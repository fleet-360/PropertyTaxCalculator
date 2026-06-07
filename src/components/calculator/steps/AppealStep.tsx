"use client";

import { useEffect, useState, useCallback } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Link from "@mui/material/Link";
import EmailIcon from "@mui/icons-material/Email";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import TranzilaPaymentDialog from "@/components/calculator/TranzilaPaymentDialog";
import CouponPaymentSection from "@/components/calculator/CouponPaymentSection";
import AppealSignaturePad from "@/components/calculator/AppealSignaturePad";
import AppealMissingFieldsDialog from "@/components/calculator/AppealMissingFieldsDialog";
import WizardVideoLoader from "@/components/calculator/WizardVideoLoader";
import { getAppealDocumentMissingItems } from "@/components/calculator/appealDocumentCompleteness";
import {
  buildAppealGeneratePayload,
  isValidAppealEmail,
  withMeasurementErrorClaimed,
} from "@/components/calculator/appealGeneratePayload";
import type { WizardState } from "@/components/calculator/CalculatorWizard";
import { useCalculatorFeatures } from "../CalculatorFeaturesContext";
import { useEmailSend } from "@/hooks/useEmailSend";
import type { StepProps } from "../CalculatorWizard";
import {
  wizardPrimaryButtonSx,
  wizardResultsCardSx,
  wizardSecondaryButtonSx,
} from "../wizardStyles";

const APPEAL_WAIVER_TEXT = `אני החתום/ה מטה, מצהיר ומאשר בזאת, כי מחשבון הארנונה איננו מהווה ייעוץ משפטי ו/או תחליף לייעוץ משפטי וכי כתב ההשגה אשר נערך עבורי מתבסס על נתונים שאני הזנתי במחשבון, והינם לעזר בלבד. לאחר שעיינתי בתקנון האתר ובמדיניות הפרטיות, אני מצהיר כי לא אבוא בעצמי ו/או באמצעות מי מטעמי בכל טענה ו/או תלונה ו/או תביעה כנגד מחשבון הארנונה ומנהליו בכל מקרה של שימוש במחשבון הארנונה ובהגשת ההשגה וברור לי כי יתכן ומנהל הארנונה יקבע כי דין ההשגה להידחות ובמקרה כזה אהיה זכאי להגיש ערר בתוך 30 ימים ממועד דחיית ההשגה.
הריני מצהיר/ה כי עם קבלת כתב ההשגה באמצעות האימייל התמלאו התחייבויות מחשבון הארנונה כלפיי ואני אהיה רשאי/ת להחליט אם להגיש את ההשגה באתר העירייה או באמצעות הדואר בנוסח שהוצע ע"י מחשבון הארנונה או לתקן את הנוסח לפי דעתי האישית או עפ"י ייעוץ שאקבל בנושא. 
הריני מצהיר מסכים כי ההשגה הוכנה באמצעות כלי AI וברור לי כי יתכנו סטיות ו/או אי דיוקים בנתוני ההשגה, בדומה לכל כלי AI המוצעים למשתמשי הרשת.
אני מאשר/ת ומסכים/ה כי השימוש במחשבון הארנונה והכנת ההשגה נעשו על סמך החלטתי והסכמתי לאחר שברור לי משמעויות הדבר ואין לי צפייה כי מחשבון הארנונה מהווה ייצוג משפטי כלשהו עבורי. `;

type FlowPhase =
  | "intro"
  | "checkout"
  | "generating"
  | "sign"
  | "finalize"
  | "done";

export default function AppealStep({ state, dispatch }: StepProps) {
  const { paymentEnabled, appealChargeAmount } = useCalculatorFeatures();
  const { sendEmail } = useEmailSend();
  const [appealWaiverAccepted, setAppealWaiverAccepted] = useState(false);

  const [flow, setFlow] = useState<FlowPhase>("intro");
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [draftPdfBase64, setDraftPdfBase64] = useState<string | null>(null);
  const [signedPdfBase64, setSignedPdfBase64] = useState<string | null>(null);
  /** Subject metadata returned from the generate endpoint — forwarded to email. */
  const [appealSubjectType, setAppealSubjectType] = useState<
    string | undefined
  >();
  const [appealExemptionDescription, setAppealExemptionDescription] = useState<
    string | undefined
  >();
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [signatureError, setSignatureError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  /** Optional override (מ"ר) — enables structured תיקון שטחים letter when > 0 */
  const [appealCorrectedAreaInput, setAppealCorrectedAreaInput] = useState(
    () =>
      state.measurementError != null && state.measurementError.claimed > 0
        ? String(state.measurementError.claimed)
        : "",
  );
  const [missingFieldsDialogOpen, setMissingFieldsDialogOpen] = useState(false);
  const [missingDocumentItems, setMissingDocumentItems] = useState<
    ReturnType<typeof getAppealDocumentMissingItems>
  >([]);
  /** Checkout view — coupon field is collapsed behind a "יש לך קוד קופון?" link. */
  const [couponExpanded, setCouponExpanded] = useState(false);

  useEffect(() => {
    if (flow === "checkout") {
      dispatch({ type: "SET_MIA_MESSAGE", payload: "step-7-checkout" });
      return;
    }
    dispatch({ type: "SET_MIA_MESSAGE", payload: "step-7-default" });
  }, [dispatch, flow]);

  // Mirror the local flow phase into wizard state so the shell can hide its chrome
  // (step indicator, title, sidebar) while we generate / sign / finalize / show the
  // success screen. Each of these phases renders its own centered layout below.
  // We intentionally do NOT reset to 'idle' on unmount — the wizard navigates away
  // from this step before that matters, and resetting in cleanup would race with
  // the layout swap and bounce the user back to the intro screen.
  useEffect(() => {
    if (
      flow === "generating" ||
      flow === "finalize" ||
      flow === "sign" ||
      flow === "done"
    ) {
      dispatch({ type: "SET_APPEAL_PHASE", payload: flow });
    } else {
      dispatch({ type: "SET_APPEAL_PHASE", payload: "idle" });
    }
  }, [dispatch, flow]);

  const result = state.calculationResult ?? {};
  const reported = state.bimonthlyPayment ?? 0;
  const calculated =
    result.calculatedBimonthly ?? result.calculated ?? reported;
  const biMonthlySavings = reported - calculated;
  const annualSavings = biMonthlySavings * 6;
  const cityName =
    (state.cityData?.cityName as string | undefined)?.trim() ||
    state.citySlug ||
    "";

  const sendInvoice = useCallback(
    (from?: Pick<WizardState, "email" | "fullName">) => {
      const email = from?.email ?? state.email;
      const fullName = from?.fullName ?? state.fullName;
      if (!email?.trim()) return;
      void sendEmail({
        type: "invoice",
        to: email.trim(),
        payload: {
          fullName,
          itemDescription: "הכנת מכתב השגה — מחשבון הארנונה",
          amountNis: appealChargeAmount,
          date: new Date().toISOString(),
        },
      }).catch(() => {});
    },
    [appealChargeAmount, sendEmail, state.email, state.fullName],
  );

  const sendAppealPdfToUser = useCallback(
    async (pdfBase64: string): Promise<boolean> => {
      const to = state.email?.trim();
      if (!to || !isValidAppealEmail(to)) {
        setEmailError("כתובת מייל לא תקינה");
        return false;
      }
      const res = await sendEmail({
        type: "appeal_pdf",
        to,
        payload: {
          fullName: state.fullName,
          cityName,
          reported,
          calculated,
          annualSavings,
          subjectType: appealSubjectType,
          exemptionDescription: appealExemptionDescription,
          pdfBase64,
        },
      });
      if (!res.success) {
        setEmailError(res.error ?? "שליחת המייל נכשלה");
        return false;
      }
      setEmailError(null);
      return true;
    },
    [
      annualSavings,
      appealExemptionDescription,
      appealSubjectType,
      calculated,
      cityName,
      reported,
      sendEmail,
      state.email,
      state.fullName,
    ],
  );

  const beginGenerationFlow = useCallback(
    async (wizardOverride?: WizardState) => {
      const w = wizardOverride ?? state;
      setGenerateError(null);
      setSignatureError(null);
      setFlow("generating");
      sendInvoice({ email: w.email, fullName: w.fullName });
      try {
        const base = buildAppealGeneratePayload(w);
        const parsedSqm = parseFloat(
          appealCorrectedAreaInput.trim().replace(",", "."),
        );
        const fromField =
          Number.isFinite(parsedSqm) && parsedSqm > 0 ? parsedSqm : 0;
        const fromWizard =
          w.measurementError != null && w.measurementError.claimed > 0
            ? w.measurementError.claimed
            : 0;
        const claimedSqm = fromField > 0 ? fromField : fromWizard;
        const body =
          claimedSqm > 0 ? withMeasurementErrorClaimed(base, claimedSqm) : base;
        const res = await fetch("/api/appeals/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = (await res.json()) as {
          error?: string;
          pdfBase64?: string;
          subjectType?: string;
          exemptionDescription?: string;
        };
        if (!res.ok) {
          throw new Error(data.error || "הכנת מכתב ההשגה נכשלה");
        }
        if (!data.pdfBase64) {
          throw new Error("תשובת שרת לא תקינה");
        }
        setDraftPdfBase64(data.pdfBase64);
        setAppealSubjectType(data.subjectType);
        setAppealExemptionDescription(data.exemptionDescription);
        setFlow("sign");
      } catch (e) {
        console.error("[AppealStep] generation failed:", e);
        const msg = e instanceof Error ? e.message : "שגיאה";
        setGenerateError(msg);
        setFlow("intro");
      }
    },
    [appealCorrectedAreaInput, sendInvoice, state],
  );

  const startGenerationWithCompletenessCheck = () => {
    const missing = getAppealDocumentMissingItems(state);
    if (missing.length > 0) {
      setMissingDocumentItems(missing);
      setMissingFieldsDialogOpen(true);
      return;
    }
    void beginGenerationFlow();
  };

  const handleSubmit = () => {
    if (paymentEnabled) {
      setCouponExpanded(false);
      setFlow("checkout");
      return;
    }
    startGenerationWithCompletenessCheck();
  };

  const handleCheckoutPay = () => {
    setPaymentDialogOpen(true);
  };

  const handleCheckoutBack = () => {
    setPaymentDialogOpen(false);
    setFlow("intro");
  };

  const handlePaymentConfirm = () => {
    setPaymentDialogOpen(false);
    startGenerationWithCompletenessCheck();
  };

  const handleMissingFieldsSubmit = (updates: Partial<WizardState>) => {
    const merged = { ...state, ...updates } as WizardState;
    dispatch({ type: "UPDATE_FIELDS_BULK", payload: updates });
    setMissingFieldsDialogOpen(false);
    setMissingDocumentItems([]);
    void beginGenerationFlow(merged);
  };

  const handleMissingDialogClose = () => {
    setMissingFieldsDialogOpen(false);
    setMissingDocumentItems([]);
  };

  const handleGoToDataEntryForAppeal = () => {
    setMissingFieldsDialogOpen(false);
    setMissingDocumentItems([]);
    dispatch({ type: "SET_STEP", step: 2 });
  };

  const handleEmptySignature = () => {
    setSignatureError("נא לחתום באזור החתימה לפני האישור");
  };

  const handleSignatureConfirmed = async (signaturePngBase64: string) => {
    setSignatureError(null);
    if (!isValidAppealEmail(state.email)) {
      setSignatureError(
        "נא למלא כתובת מייל תקינה בשלב פרטי הקשר במחשבון לפני חתימה.",
      );
      return;
    }
    if (!draftPdfBase64) {
      setSignatureError("חסר מסמך — נסו שוב מההתחלה");
      return;
    }

    setFlow("finalize");
    setEmailSent(false);
    setEmailError(null);

    try {
      const applyRes = await fetch("/api/appeals/apply-signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftPdfBase64,
          signaturePngBase64,
        }),
      });
      const applyData = (await applyRes.json()) as {
        error?: string;
        pdfBase64?: string;
      };
      if (!applyRes.ok) {
        throw new Error(applyData.error || "מיזוג החתימה נכשל");
      }
      if (!applyData.pdfBase64) {
        throw new Error("תשובת שרת לא תקינה");
      }
      const signed = applyData.pdfBase64;
      setSignedPdfBase64(signed);
      const ok = await sendAppealPdfToUser(signed);
      setEmailSent(ok);
      setFlow("done");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "שגיאה";
      setSignatureError(msg);
      setSignedPdfBase64(null);
      setFlow("sign");
    }
  };

  const handleRetryEmail = async () => {
    if (!signedPdfBase64) return;
    setEmailError(null);
    const ok = await sendAppealPdfToUser(signedPdfBase64);
    setEmailSent(ok);
  };

  const downloadSignedPdf = () => {
    if (!signedPdfBase64) return;
    try {
      const binary = atob(signedPdfBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "michtav-hashaga-chatum.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setEmailError("הורדת הקובץ נכשלה");
    }
  };

  const canStart =
    appealWaiverAccepted &&
    state.fullName.trim().length > 0 &&
    state.calculationResult != null;

  const missingFieldsDialog = (
    <AppealMissingFieldsDialog
      open={missingFieldsDialogOpen}
      items={missingDocumentItems}
      state={state}
      onClose={handleMissingDialogClose}
      onSubmit={handleMissingFieldsSubmit}
      onGoToDataEntry={handleGoToDataEntryForAppeal}
    />
  );

  const generateErrorAlert = generateError ? (
    <Alert
      severity="error"
      sx={{ mb: 2 }}
      onClose={() => setGenerateError(null)}
    >
      {generateError}
    </Alert>
  ) : null;

  if (flow === "done") {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          py: { xs: 4, md: 8 },
          px: 2,
        }}
      >
        <Typography
          component="h1"
          sx={(theme) => ({
            fontWeight: 700,
            fontSize: { xs: "22px", md: "26px" },
            lineHeight: 1.2,
            color: theme.palette.brand.textMain,
            mb: 1.5,
          })}
        >
          מכתב ההשגה נשלח
        </Typography>

        {emailSent ? (
          <>
            <Typography
              sx={(theme) => ({
                fontSize: { xs: "14px", md: "15px" },
                color: theme.palette.brand.textMain,
                mb: 0.5,
              })}
            >
              למייל: {state.email?.trim()}
            </Typography>
            <Typography
              sx={(theme) => ({
                fontSize: { xs: "14px", md: "15px" },
                color: theme.palette.brand.textMuted,
                mb: 3.5,
              })}
            >
              תודה שהשתמשתם במחשבון הארנונה
            </Typography>
          </>
        ) : (
          <Alert severity="warning" sx={{ mb: 3, maxWidth: 480 }}>
            {emailError ||
              signatureError ||
              "לא הצלחנו לשלוח את המייל. ניתן לנסות שוב או להוריד את הקובץ."}
          </Alert>
        )}

        <Stack
          direction="row"
          spacing={2}
          flexWrap="wrap"
          useFlexGap
          justifyContent="center"
          sx={{ mb: 4 }}
        >
          {signedPdfBase64 && (
            <Button
              variant="contained"
              onClick={downloadSignedPdf}
              sx={[wizardPrimaryButtonSx as never, { px: 2.5, py: 1 }]}
            >
              הורדת עותק חתום
            </Button>
          )}
          {signedPdfBase64 && !emailSent && (
            <Button
              variant="outlined"
              startIcon={<EmailIcon />}
              onClick={() => void handleRetryEmail()}
              sx={[wizardSecondaryButtonSx as never, { px: 2.5, py: 1 }]}
            >
              שלח שוב למייל
            </Button>
          )}
        </Stack>

        <Button
          variant="outlined"
          onClick={() => dispatch({ type: "RESET_CALCULATOR" })}
          href="/#hero"
          sx={[wizardSecondaryButtonSx as never, { px: 2.5, py: 1 }]}
        >
          חזרה לעמוד הבית
        </Button>
      </Box>
    );
  }

  if (flow === "generating" || flow === "finalize") {
    // Wizard chrome is hidden via stepMeta (hideStepChrome + hideInfoCard).
    // Render our own centered title / subtitle / video so the user sees the
    // clean loading screen from the design.
    const loadingTitle =
      flow === "generating"
        ? "המערכת מכינה את מכתב ההשגה"
        : "שולחים את ההשגה למייל";
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: 1,
          py: { xs: 2, md: 4 },
        }}
      >
        <Typography
          component="h1"
          sx={(theme) => ({
            fontWeight: 700,
            fontSize: { xs: "20px", md: "24px" },
            lineHeight: 1,
            color: theme.palette.brand.scanTitle,
            mb: 1,
          })}
        >
          {loadingTitle}
        </Typography>
        <Typography
          sx={(theme) => ({
            fontSize: { xs: "16px", md: "18px" },
            color: theme.palette.brand.textMain,
            mb: 2,
          })}
        >
          זה ייקח כמה שניות, קצת סבלנות
        </Typography>
        <WizardVideoLoader />
      </Box>
    );
  }

  if (flow === "sign" && draftPdfBase64) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          py: { xs: 2, md: 4 },
          px: 2,
        }}
      >
        <Typography
          component="h1"
          sx={(theme) => ({
            fontWeight: 700,
            fontSize: { xs: "22px", md: "26px" },
            lineHeight: 1.2,
            color: theme.palette.brand.textMain,
            mb: 1,
          })}
        >
          חתימה על מכתב ההשגה
        </Typography>
        <Typography
          sx={(theme) => ({
            fontSize: { xs: "14px", md: "16px" },
            color: theme.palette.brand.textMain,
            mb: 0.5,
          })}
        >
          חתימה דיגיטלית על מסמך ההשגה
        </Typography>
        <Typography
          sx={(theme) => ({
            fontSize: { xs: "13px", md: "14px" },
            color: theme.palette.brand.textMuted,
            mb: { xs: 3, md: 4 },
            maxWidth: 520,
          })}
        >
          חתמו באזור למטה. החתימה תשולב במסמך ה-PDF ותישלח למייל שלכם.
        </Typography>

        {signatureError && (
          <Alert
            severity="error"
            sx={{ mb: 2, width: "100%", maxWidth: 520 }}
            onClose={() => setSignatureError(null)}
          >
            {signatureError}
          </Alert>
        )}
        {!isValidAppealEmail(state.email) && (
          <Alert
            severity="warning"
            sx={{ mb: 2, width: "100%", maxWidth: 520 }}
          >
            נדרשת כתובת מייל תקינה בשלב פרטי הקשר כדי לשלוח את המסמך אוטומטית.
          </Alert>
        )}

        <Box sx={{ width: "100%", maxWidth: 645, mb: 3 }}>
          <AppealSignaturePad
            variant="underline"
            onConfirm={(png) => void handleSignatureConfirmed(png)}
            onEmptySignature={handleEmptySignature}
            disabled={flow !== "sign"}
          />
        </Box>

        <Button
          variant="outlined"
          onClick={() => dispatch({ type: "PREV_STEP" })}
          sx={[wizardSecondaryButtonSx as never, { px: 2.5, py: 1 }]}
        >
          חזרה
        </Button>
      </Box>
    );
  }

  if (flow === "checkout") {
    return (
      <Box>
        {generateErrorAlert}
        <Box
          sx={[
            wizardResultsCardSx as never,
            {
              maxWidth: 560,
              mx: { xs: 0, md: "auto" },
            },
          ]}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
            sx={{ mb: 2 }}
          >
            <Box sx={{ textAlign: "right" }}>
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: "20px", md: "24px" },
                  lineHeight: "32px",
                }}
              >
                סיכום תשלום -
              </Typography>
              <Typography
                sx={(theme) => ({
                  fontSize: "14px",
                  color: theme.palette.brand.textMuted,
                  mt: 0.5,
                })}
              >
                הכנת מסמך השגה
              </Typography>
            </Box>
          </Stack>

          <Box
            sx={(theme) => ({
              borderTop: `1px solid ${theme.palette.divider}`,
              pt: 3,
              mb: 2,
            })}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "stretch", md: "center" }}
              spacing={{ xs: 1, md: 0 }}
            >
              <Typography
                sx={{
                  fontWeight: 500,
                  fontSize: { xs: "18px", md: "24px" },
                  order: { xs: 0, md: 1 },
                  textAlign: { xs: "center", md: "inherit" },
                }}
              >
                סך הכל לתשלום
              </Typography>
              <Typography
                sx={{
                  fontWeight: 500,
                  fontSize: { xs: "24px", md: "32px" },
                  order: { xs: 1, md: 0 },
                  textAlign: { xs: "center", md: "inherit" },
                }}
              >
                ₪{appealChargeAmount.toLocaleString("he-IL")}
              </Typography>
            </Stack>
          </Box>

          <Box sx={{ textAlign: "end", mb: 2 }}>
            {state.appliedCoupon || couponExpanded ? (
              <CouponPaymentSection
                state={state}
                dispatch={dispatch}
                context="appeal"
                density="checkout"
              />
            ) : (
              <Typography
                component="div"
                sx={(theme) => ({
                  fontSize: "14px",
                  color: theme.palette.brand.textMuted,
                })}
              >
                יש לך קוד קופון?{" "}
                <Link
                  component="button"
                  type="button"
                  onClick={() => setCouponExpanded(true)}
                  sx={(theme) => ({
                    color: theme.palette.brand.blue,
                    fontWeight: 500,
                    textDecoration: "underline",
                    "&:hover": { textDecoration: "underline" },
                  })}
                >
                  לחץ כאן
                </Link>
              </Typography>
            )}
          </Box>

          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              onClick={handleCheckoutPay}
              endIcon={<ChevronLeftIcon />}
              sx={[wizardPrimaryButtonSx as never, { px: 2.5, py: 1 }]}
            >
              לתשלום
            </Button>
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-start",
            mt: 3,
          }}
        >
          <Button
            variant="outlined"
            onClick={handleCheckoutBack}
            sx={wizardSecondaryButtonSx}
          >
            חזרה
          </Button>
        </Box>

        <TranzilaPaymentDialog
          open={paymentDialogOpen}
          onClose={() => setPaymentDialogOpen(false)}
          onConfirm={handlePaymentConfirm}
          amountNis={appealChargeAmount}
          product="appeal"
          title="תשלום השגה"
          state={state}
          dispatch={dispatch}
          context="appeal"
        />

        {missingFieldsDialog}
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" textAlign="center" mb={3}>
        הגשת השגה
      </Typography>

      {generateErrorAlert}

      {/* {paymentEnabled && (
        <CouponPaymentSection state={state} dispatch={dispatch} context="appeal" />
      )} */}

      {/* <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="body1" mb={2}>
          השגה היא בעצם ערעור על חיוב הארנונה. ניתן להגיש השגה תוך 90 יום ממועד קבלת החיוב.
        </Typography>
        <Typography variant="body1" mb={2}>
          בלחיצה אחת נוכל להכין עבורך השגה שמתאימה למידע שהזנת במחשבון.
        </Typography>
        <Typography variant="h6" color="primary.main">
          מחיר: {appealChargeAmount.toLocaleString('he-IL')} ₪
        </Typography>
      </Paper> */}

      {/* <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          תיקון שטח במכתב (אופציונלי)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          אם אתם טוענים שהשטח לחיוב בשומה שגוי, הזינו כאן את השטח הנכון במ&quot;ר. כך נפעיל את תבנית מכתב
          &quot;תיקון שטחים&quot; המעוצבת (HTML). אם השדה ריק והזנת שטח מתוקן בשלב הזנת הנתונים — נשתמש בו.
        </Typography>
        <TextField
          label='שטח נכון לחיוב (מ"ר)'
          type="text"
          inputMode="decimal"
          value={appealCorrectedAreaInput}
          onChange={(e) => setAppealCorrectedAreaInput(e.target.value.replace(/[^\d.,]/g, ''))}
          fullWidth
          size="small"
          placeholder={state.propertyArea > 0 ? `למשל אם בשומה ${state.propertyArea} ולדעתכם אחר` : ''}
        />
      </Paper> */}

      <Paper
        variant="outlined"
        sx={{ p: 2, mb: 2, maxHeight: 320, overflowY: "auto", lineHeight: 1.8 }}
      >
        <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
          {APPEAL_WAIVER_TEXT}
        </Typography>
      </Paper>

      <FormControlLabel
        control={
          <Checkbox
            checked={appealWaiverAccepted}
            onChange={(e) => setAppealWaiverAccepted(e.target.checked)}
          />
        }
        label="קראתי והבנתי את כל האמור לעיל ואני מסכים/ה ומאשר/ת."
        sx={{ mb: 3 }}
      />

      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
        <Button
          variant="outlined"
          onClick={() => dispatch({ type: "PREV_STEP" })}
        >
          חזרה
        </Button>
        <Button
          variant="contained"
          color="success"
          disabled={!canStart}
          onClick={handleSubmit}
        >
          {paymentEnabled ? "המשך לתשלום" : "הכנת השגה"}
        </Button>
      </Box>

      {missingFieldsDialog}
    </Box>
  );
}
