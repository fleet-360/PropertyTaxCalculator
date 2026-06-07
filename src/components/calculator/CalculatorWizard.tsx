"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useImperativeHandle,
  forwardRef,
  Dispatch,
} from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import InitialInfoStep from "./steps/InitialInfoStep";
import CityBillStep from "./steps/CityBillStep";
import InitialWaiverStep from "./steps/InitialWaiverStep";
import DataEntryStep from "./steps/DataEntryStep";
import ExemptionsStep from "./steps/ExemptionsStep";
import DisclaimerStep from "./steps/DisclaimerStep";
import ResultsGateStep from "./steps/ResultsGateStep";
import ResultsDisplayStep from "./steps/ResultsDisplayStep";
import AppealStep from "./steps/AppealStep";
import ContactRedirectStep from "./steps/ContactRedirectStep";
import { CalculatorFeaturesContext } from "./CalculatorFeaturesContext";
import {
  BillExtractionContext,
  type BillExtractionContextValue,
} from "./BillExtractionContext";
import WizardLayout from "./WizardLayout";

import {
  DEFAULT_CALCULATOR_FEATURE_CONFIG,
  type CalculatorFeatureConfig,
} from "@/lib/types/system-config";
import { priceAfterCoupon } from "@/lib/priceAfterCoupon";
import { isVercelBlobPublicUrl } from "@/lib/ordinancePdf";
import { findByPropertyCode, findBySubtypeAndZone } from "@/lib/calculator";
import { initialState, type WizardAction, type WizardState } from "./wizardTypes";
import { SxProps } from "@mui/material";
import { Theme } from "@emotion/react";

export type { CalculatorFeaturesContextValue } from "./CalculatorFeaturesContext";
export {
  CalculatorFeaturesContext,
  useCalculatorFeatures,
} from "./CalculatorFeaturesContext";
export type {
  AppliedWizardCoupon,
  Designation,
  SelectedExemption,
  WizardAction,
  WizardState,
} from "./wizardTypes";
export { initialState } from "./wizardTypes";

// ── Step definitions ──
// 0: InitialInfoStep (property type)
// 1: CityBillStep (city + bill upload)
// 2: InitialWaiverStep
// 3: DataEntryStep
// 4: ExemptionsStep (skipped for business)
// 5: DisclaimerStep
// 6: ResultsGateStep (coupon UI inline when payment + under/overpay)
// 7: ResultsDisplayStep
// 8: AppealStep

const EXEMPTIONS_STEP = 4;

export function shouldSkipExemptions(_state: WizardState): boolean {
  // The "exemptions" step now also hosts additional-area inputs and measurement /
  // classification error reporting, so it must always be shown.
  return false;
}

export function wizardReducer(
  state: WizardState,
  action: WizardAction,
): WizardState {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, currentStep: action.step };
    case "NEXT_STEP": {
      let nextStep = state.currentStep + 1;
      if (nextStep === EXEMPTIONS_STEP && shouldSkipExemptions(state)) {
        nextStep = EXEMPTIONS_STEP + 1;
      }
      return { ...state, currentStep: nextStep };
    }
    case "PREV_STEP": {
      let prevStep = Math.max(0, state.currentStep - 1);
      if (prevStep === EXEMPTIONS_STEP && shouldSkipExemptions(state)) {
        prevStep = EXEMPTIONS_STEP - 1;
      }
      return { ...state, currentStep: prevStep };
    }
    case "SET_PROPERTY_TYPE":
      return { ...state, propertyType: action.payload };
    case "SET_CITY":
      return {
        ...state,
        citySlug: action.payload.slug,
        cityData: action.payload.data ?? state.cityData,
      };
    case "SET_CITY_DATA":
      return { ...state, cityData: action.payload };
    case "UPDATE_FIELD":
      return { ...state, [action.field]: action.value };
    case "UPDATE_FIELDS_BULK":
      return { ...state, ...action.payload };
    case "SET_DESIGNATIONS":
      return { ...state, designations: action.payload };
    case "SET_SELECTED_EXEMPTIONS":
      return { ...state, selectedExemptions: action.payload };
    case "SET_MEASUREMENT_ERROR":
      return { ...state, measurementError: action.payload };
    case "SET_CLASSIFICATION_ERROR":
      return { ...state, classificationError: action.payload };
    case "SET_CALCULATION_RESULT":
      return { ...state, calculationResult: action.payload };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "START_EXTRACTION":
      return {
        ...state,
        extractionStatus: "extracting",
        extractionError: null,
      };
    case "APPLY_EXTRACTION_RESULT": {
      const data = action.payload || {};
      const fieldsToApply: Record<string, unknown> = {};
      for (const [key, field] of Object.entries(data)) {
        if (!field) continue;
        const f = field as { value?: unknown };
        if (f.value === undefined || f.value === null) continue;
        if (key === "bimonthlyPayment") {
          fieldsToApply["reportedPayment"] = f.value;
        } else if (
          key === "propertyPurposeDescription" ||
          key === "subTypeDescription" ||
          key === "ratePerSqm" ||
          key === "annualPayment"
        ) {
          // display-only fields — skip
        } else {
          fieldsToApply[key] = f.value;
        }
      }

      // Resolve classification fields: try classificationCode first, then
      // fall back to fuzzy-matching subTypeDescription + zone.
      let resolved = false;
      if (fieldsToApply.classificationCode && state.cityData) {
        const match = findByPropertyCode(
          state.cityData,
          fieldsToApply.classificationCode as string,
        );
        if (match) {
          fieldsToApply.propertyPurpose = match.typeCode;
          fieldsToApply.subType = match.subtypeCode;
          fieldsToApply.zone = match.zoneCode;
          resolved = true;
        }
      }

      if (!resolved && state.cityData) {
        const extractedSubType = (
          data.subTypeDescription as { value?: unknown } | undefined
        )?.value;
        const extractedZone = (data.zone as { value?: unknown } | undefined)
          ?.value;
        if (typeof extractedSubType === "string" && extractedSubType) {
          const fallback = findBySubtypeAndZone(
            state.cityData,
            extractedSubType,
            typeof extractedZone === "string" ? extractedZone : undefined,
          );
          if (fallback) {
            fieldsToApply.propertyPurpose = fallback.typeCode;
            fieldsToApply.subType = fallback.subtypeCode;
            fieldsToApply.zone = fallback.zoneCode;
          }
        }
      }

      if (state.propertyType === "business") {
        const resolvedType = (fieldsToApply.propertyPurpose as string) || state.propertyPurpose;
        const resolvedSubtype = (fieldsToApply.subType as string) || state.subType;
        const resolvedZone = (fieldsToApply.zone as string) || state.zone;
        const resolvedArea = (fieldsToApply.propertyArea as number) || state.propertyArea;

        if (resolvedType || resolvedSubtype || resolvedZone || resolvedArea) {
          fieldsToApply.designations = [{
            type: resolvedType || "",
            subtype: resolvedSubtype || "",
            zone: resolvedZone || "",
            area: resolvedArea || 0,
          }];
        }
      }

      return {
        ...state,
        ...fieldsToApply,
        extractionStatus: "success",
        extractionError: null,
      };
    }
    case "FAIL_EXTRACTION":
      return {
        ...state,
        extractionStatus: "error",
        extractionError: action.payload,
      };
    case "RESET_EXTRACTION":
      return { ...state, extractionStatus: "idle", extractionError: null };
    case "SET_APPEAL_PHASE":
      return { ...state, appealPhase: action.payload };
    case "RESET_CALCULATOR":
      return { ...initialState };
    case "SET_CONTACT_REDIRECT":
      return {
        ...state,
        contactRedirectReason: action.payload,
        contactRedirectErrorMessage:
          action.payload === "error" ? (action.errorMessage ?? null) : null,
      };
    case "SET_LEAD_ID":
      return { ...state, leadId: action.payload };
    case "SET_CALCULATION_INDEX":
      return { ...state, calculationIndex: action.payload };
    case "SET_MIA_MESSAGE":
      return { ...state, miaMessageId: action.payload };
    default:
      return state;
  }
}

// ── Props type for steps ──

export interface StepProps {
  state: WizardState;
  dispatch: Dispatch<WizardAction>;
  sx?: SxProps<Theme>;
}

// ── Validation checks ──

export function getContactRedirectReason(
  state: WizardState,
): WizardState["contactRedirectReason"] {
  if (state.citySlug === "other") return "other_city";

  const totalArea =
    (state.propertyArea || 0) +
    (state.coveredBalconyArea || 0) +
    (state.storageArea || 0) +
    (state.parkingArea || 0);
  if (totalArea > 1000) return "area";

  if (state.propertyType === "business" && state.designations.length > 1) {
    return "designations";
  }

  if (
    !state.cityData ||
    !state.cityData.types ||
    state.cityData.types.length === 0
  ) {
    return "city";
  }

  return null;
}

// ── Component ──

const STEP_COMPONENTS = [
  InitialInfoStep,
  CityBillStep,
  InitialWaiverStep,
  DataEntryStep,
  ExemptionsStep,
  DisclaimerStep,
  ResultsGateStep,
  ResultsDisplayStep,
  AppealStep,
];

interface StepMeta {
  displayStep: number;
  title: string;
  subtitle?: string;
  infoMessage?: string;
  hideInfoCard?: boolean;
  layoutVariant?: "default" | "centered" | "fullWidth";
  hideStepChrome?: boolean;
}

/**
 * Map internal step index → display metadata for WizardLayout.
 * Display steps: 1=Welcome, 2=Property details, 3=Exemptions, 4=Disclaimer, 5=Results.
 */
function getStepMeta(
  internalStep: number,
  propertyType: WizardState["propertyType"],
  appealPhase: WizardState["appealPhase"] = "idle",
): StepMeta {
  switch (internalStep) {
    case 0:
      return {
        displayStep: 1,
        title: "ברוכים הבאים למחשבון הארנונה",
        subtitle:
          "המחשבון מנתח את נתוני הנכס שלך ומשווה אותם לתעריפים בצו הארנונה",
        infoMessage:
          "זה לוקח כמה שניות, שנתחיל? המחשבון שלנו מנתח את נתוני הנכס שלך ומשווה אותם לתעריפי צו הארנונה של הרשות המקומית. תוך שניות תקבל תוצאה וגם תוכל להגיש השגה לעירייה כדי לקבל הנחות.",
      };
    case 1:
      return {
        displayStep: 2,
        title: "ברוכים הבאים למחשבון הארנונה",
        subtitle: "תוך שניות תקבל הערכה מדויקת הכוללת שימוש בפטורים והנחות.",
        infoMessage:
          'יש להעלות צילום ברור או קובץ של דו"ח ארנונה דו-חודשי, כדי שהמחשבון יוכל לחלץ את הנתונים.',
      };
    case 2:
      return {
        displayStep: 2,
        title: "המערכת סורקת את הנתונים,",
        subtitle: "זה יקח כמה שניות, קצת סבלנות",
        hideInfoCard: true,
        layoutVariant: "centered",
      };
    case 3:
      return {
        displayStep: 3,
        title:
          propertyType === "business"
            ? "בואו נזין את פרטי העסק"
            : "בואו נזין את פרטי הנכס",
        infoMessage:
          'המחשבון משך את הנתונים מתוך דו"ח הארנונה וודאו שהנתונים נכונים ומלאו את השדות הנותרים.',
      };
    case 4:
      return {
        displayStep: 4,
        title: "נא סמן את הטעויות בתחשיב שלך",
        subtitle: "",
        infoMessage:
          "בואו נבדוק אם מגיעה לך הנחה על הארנונה. בחר את ההנחות הרלוונטיות מהרשימה.",
      };
    case 5:
      return {
        displayStep: 4,
        title: "הצהרה ואישור",
        infoMessage:
          "בואו נבדוק אם מגיעה לך הנחה על הארנונה. בחר את ההנחות הרלוונטיות מהרשימה.",
      };
    case 6:
      return {
        displayStep: 5,
        title: "",
        hideInfoCard: true,
        layoutVariant: "fullWidth",
        hideStepChrome: true,
      };
    case 7:
      return {
        displayStep: 5,
        title: "",
        hideInfoCard: true,
        layoutVariant: "fullWidth",
        hideStepChrome: true,
      };
    case 8:
      if (
        appealPhase === "generating" ||
        appealPhase === "finalize" ||
        appealPhase === "sign" ||
        appealPhase === "done"
      ) {
        // IMPORTANT: keep layoutVariant === 'default' (do NOT switch to 'centered').
        // Switching layout variants restructures the React tree and unmounts
        // AppealStep — losing its local flow state — which sends the user back
        // to the intro screen. We only hide chrome/sidebar via stable CSS flags,
        // and AppealStep renders its own centered title + subtitle + content
        // (loader / signature page / success page).
        return {
          displayStep: 5,
          title: "",
          hideInfoCard: true,
          hideStepChrome: true,
        };
      }
      return {
        displayStep: 5,
        title: "הכנת השגה לעירייה",
        subtitle: "מערכת ה-AI שלנו תכין עבורכם מכתב מקצועי",
        infoMessage: "ממש תכף תקבל את ההשגה שלך למייל!",
      };
    default:
      return {
        displayStep: 1,
        title: "מחשבון הארנונה",
      };
  }
}

function mergeFeatures(
  partial?: Partial<CalculatorFeatureConfig>,
): CalculatorFeatureConfig {
  return { ...DEFAULT_CALCULATOR_FEATURE_CONFIG, ...partial };
}

export interface CalculatorWizardHandle {
  resetCalculator: () => void;
}

export interface CalculatorWizardProps {
  features?: Partial<CalculatorFeatureConfig>;
  onMiaMessage?: (messageId: string | string[]) => void;
  onOrdinanceUrl?: (
    url: { download: string; preview: string } | undefined,
  ) => void;
}

const CalculatorWizard = forwardRef<
  CalculatorWizardHandle,
  CalculatorWizardProps
>(function CalculatorWizard(props, ref) {
  const features = mergeFeatures(props.features);
  const { onMiaMessage, onOrdinanceUrl } = props;
  const [state, dispatch] = useReducer(wizardReducer, initialState);

  // Bumped every time a new extraction is kicked off — older in-flight requests
  // compare against this and silently drop their results.
  const extractionTokenRef = useRef(0);

  const startExtraction = useCallback<
    BillExtractionContextValue["startExtraction"]
  >(async ({ file, expectedCityName, cityData }) => {
    const token = ++extractionTokenRef.current;
    dispatch({ type: "START_EXTRACTION" });

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", "tax_bill");
      const trimmed = expectedCityName?.trim();

      const promptOpts: Record<string, unknown> = {};
      if (trimmed) promptOpts.expectedCityName = trimmed;

      if (cityData) {
        const cd = cityData as {
          availableZones?: { code: string; label: string }[];
          types?: {
            category: string;
            code: string;
            label: string;
            subtypes: {
              code: string;
              label: string;
              zones: { zone: string }[];
            }[];
          }[];
        };
        promptOpts.tariffHints = {
          availableZones: cd.availableZones ?? [],
          subtypes:
            cd.types?.flatMap((t) =>
              t.subtypes.map((s) => ({
                code: s.code,
                label: s.label,
                category: t.category,
                typeCode: t.code,
                typeLabel: t.label,
                zones: s.zones.map((z) => z.zone),
              })),
            ) ?? [],
        };
      }

      if (Object.keys(promptOpts).length > 0) {
        formData.append("promptOptions", JSON.stringify(promptOpts));
      }

      const response = await fetch("/api/vision/extract", {
        method: "POST",
        body: formData,
      });

      if (extractionTokenRef.current !== token) return;

      if (!response.ok) {
        let msg = "שגיאה בעיבוד המסמך";
        try {
          const errData = await response.json();
          if (typeof errData?.error === "string") msg = errData.error;
        } catch {
          /* ignore parse error */
        }
        dispatch({ type: "FAIL_EXTRACTION", payload: msg });
        return;
      }

      const result = await response.json();
      if (extractionTokenRef.current !== token) return;

      if (!result?.success) {
        const w = Array.isArray(result?.warnings)
          ? result.warnings.join(". ")
          : "";
        dispatch({
          type: "FAIL_EXTRACTION",
          payload: w || "לא ניתן היה לחלץ נתונים מהמסמך",
        });
        return;
      }

      dispatch({ type: "APPLY_EXTRACTION_RESULT", payload: result.data ?? {} });
    } catch {
      if (extractionTokenRef.current !== token) return;
      dispatch({ type: "FAIL_EXTRACTION", payload: "שגיאה בעיבוד המסמך" });
    }
  }, []);

  const resetExtraction = useCallback<
    BillExtractionContextValue["resetExtraction"]
  >(() => {
    extractionTokenRef.current++;
    dispatch({ type: "RESET_EXTRACTION" });
  }, []);

  const extractionContextValue = useMemo<BillExtractionContextValue>(
    () => ({ startExtraction, resetExtraction }),
    [startExtraction, resetExtraction],
  );

  useImperativeHandle(ref, () => ({
    resetCalculator: () => dispatch({ type: "RESET_CALCULATOR" }),
  }));
  const ordinanceUrl = state.cityData?.ordinanceUrl as string | undefined;

  // Notify parent whenever miaMessageId changes
  useEffect(() => {
    onMiaMessage?.(state.miaMessageId);
  }, [state.miaMessageId, onMiaMessage]);

  // Notify parent whenever ordinance URL changes (after city selection)
  useEffect(() => {
    onOrdinanceUrl?.({
      download: state.cityData?.ordinanceUrl as string | undefined,
      preview: isVercelBlobPublicUrl(ordinanceUrl ?? "")
        ? `/api/view-pdf/${encodeURIComponent(state.citySlug!)}`
        : undefined,
    } as { download: string; preview: string } | undefined);
  }, [state.cityData?.ordinanceUrl, onOrdinanceUrl]);

  const applied = state.appliedCoupon;
  const featuresContextValue = useMemo(
    () => ({
      paymentEnabled: features.paymentEnabled,
      calculatorPrice: features.calculatorPrice,
      appealPrice: features.appealPrice,
      calculatorChargeAmount: priceAfterCoupon(
        features.calculatorPrice,
        applied,
      ),
      appealChargeAmount: priceAfterCoupon(features.appealPrice, applied),
    }),
    [
      features.paymentEnabled,
      features.calculatorPrice,
      features.appealPrice,
      applied,
    ],
  );

  const redirectReason =
    state.currentStep >= EXEMPTIONS_STEP && state.currentStep <= 5
      ? getContactRedirectReason(state)
      : null;

  if (redirectReason || state.contactRedirectReason) {
    return (
      <Container maxWidth="md">
        <ContactRedirectStep
          reason={redirectReason ?? state.contactRedirectReason!}
          dispatch={dispatch}
          state={state}
        />
      </Container>
    );
  }

  const StepComponent = STEP_COMPONENTS[state.currentStep];

  // const showOrdinanceLink =
  //   Boolean(state.citySlug) && state.citySlug !== 'other' && Boolean(ordinanceUrl);
  // const ordinanceTitle =
  //   state.cityData?.cityName != null && String(state.cityData.cityName).trim() !== ''
  //     ? `צו הארנונה — ${state.cityData.cityName}`
  //     : 'צו הארנונה';

  const stepMeta = getStepMeta(
    state.currentStep,
    state.propertyType,
    state.appealPhase,
  );
  const ordinancePreviewSrc =
    state.citySlug && isVercelBlobPublicUrl(ordinanceUrl ?? "")
      ? `/api/view-pdf/${encodeURIComponent(state.citySlug)}`
      : undefined;
  const ordinanceTitle =
    state.cityData?.cityName != null &&
    String(state.cityData.cityName).trim() !== ""
      ? `צו הארנונה — ${state.cityData.cityName}`
      : "צו הארנונה";

  return (
    <CalculatorFeaturesContext.Provider value={featuresContextValue}>
      <BillExtractionContext.Provider value={extractionContextValue}>
        <WizardLayout
          displayStep={stepMeta.displayStep}
          totalSteps={5}
          title={stepMeta.title}
          subtitle={stepMeta.subtitle}
          infoMessage={stepMeta.infoMessage}
          hideInfoCard={stepMeta.hideInfoCard}
          layoutVariant={stepMeta.layoutVariant}
          hideStepChrome={stepMeta.hideStepChrome}
          onResetCalculator={() => dispatch({ type: "RESET_CALCULATOR" })}
          ordinanceDocumentUrl={ordinanceUrl}
          ordinancePreviewSrc={ordinancePreviewSrc}
          ordinanceTitle={ordinanceTitle}
        >
          {StepComponent && (
            <StepComponent
              key={state.currentStep}
              state={state}
              dispatch={dispatch}
            />
          )}
        </WizardLayout>
      </BillExtractionContext.Provider>
    </CalculatorFeaturesContext.Provider>
  );
});

export default CalculatorWizard;
