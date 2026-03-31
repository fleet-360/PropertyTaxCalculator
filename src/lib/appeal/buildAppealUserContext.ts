import type { AppealGenerateRequest } from './schemas';
import { buildAppealNarrativeHints } from './appealNarrativeHints';

/** Structured context sent to Gemini and echoed in PDF metadata (no secrets). */
export interface AppealUserContext {
  fullName: string;
  idNumber?: string;
  email?: string;
  phone?: string;
  address?: string;
  city: { name: string; slug?: string };
  property: {
    type?: 'private' | 'business';
    propertyNumber?: string;
    propertyId?: string;
    areaSqm?: number;
    zone?: string;
    subType?: string;
    /** Wizard free-text: use / vacancy / situation (Hebrew). */
    statedPurpose?: string;
    /** Sub-areas the user entered (balcony, storage, parking, dynamic types). */
    partialAreas?: {
      coveredBalconySqm?: number;
      storageSqm?: number;
      parkingSqm?: number;
      byType?: { areaType: string; areaSqm: number }[];
    };
    cadastral?: {
      block?: string;
      parcel?: string;
      gushClassificationCode?: string;
    };
    /** User-reported correct total sqm when disputing the billed area. */
    userClaimedCorrectTotalAreaSqm?: number;
    /** Link to evidence file if the user attached one (e.g. survey). */
    areaDisputeEvidenceUrl?: string;
    /** User-suggested property classification label when disputing סיווג. */
    userSuggestedClassification?: string;
  };
  tax: {
    bimonthlyPaymentReported: number;
    /** When entered separately from the main bimonthly field */
    reportedPaymentFromForm?: number;
    paymentPeriod?: string;
    calculationSummary: Record<string, unknown>;
    /** Optional municipal fees the user opted into in the wizard */
    optedIntoFeeNames?: string[];
  };
  exemptions?: AppealGenerateRequest['selectedExemptions'];
  designations?: AppealGenerateRequest['designations'];
  householdSize?: number;
  childrenCount?: number;
  leadId?: string;
  /**
   * Pre-derived English hints for choosing the closest example template
   * (area correction, classification, exemptions, vacancy, etc.).
   */
  appealNarrativeHints: string[];
}

export function buildAppealUserContext(payload: AppealGenerateRequest): AppealUserContext {
  const partialAreas: AppealUserContext['property']['partialAreas'] = {};
  if (payload.coveredBalconyArea != null && payload.coveredBalconyArea > 0) {
    partialAreas.coveredBalconySqm = payload.coveredBalconyArea;
  }
  if (payload.storageArea != null && payload.storageArea > 0) {
    partialAreas.storageSqm = payload.storageArea;
  }
  if (payload.parkingArea != null && payload.parkingArea > 0) {
    partialAreas.parkingSqm = payload.parkingArea;
  }
  const byType =
    payload.additionalAreas
      ?.filter((r) => r.areaType.trim().length > 0 && r.areaSqm > 0)
      .map((r) => ({ areaType: r.areaType.trim(), areaSqm: r.areaSqm })) ?? [];
  if (byType.length > 0) {
    partialAreas.byType = byType;
  }
  const hasPartial =
    partialAreas.coveredBalconySqm != null ||
    partialAreas.storageSqm != null ||
    partialAreas.parkingSqm != null ||
    (partialAreas.byType != null && partialAreas.byType.length > 0);

  const cadastral: AppealUserContext['property']['cadastral'] = {};
  if (payload.block?.trim()) cadastral.block = payload.block.trim();
  if (payload.parcel?.trim()) cadastral.parcel = payload.parcel.trim();
  if (payload.classificationCode?.trim()) {
    cadastral.gushClassificationCode = payload.classificationCode.trim();
  }
  const hasCadastral = Object.keys(cadastral).length > 0;

  const me = payload.measurementError;
  const ce = payload.classificationError;

  return {
    fullName: payload.fullName,
    idNumber: payload.idNumber,
    email: payload.email,
    phone: payload.phone,
    address: payload.address,
    city: { name: payload.cityName, slug: payload.citySlug },
    property: {
      type: payload.propertyType,
      propertyNumber: payload.propertyNumber,
      propertyId: payload.propertyId,
      areaSqm: payload.propertyArea,
      zone: payload.zone,
      subType: payload.subType,
      statedPurpose: payload.propertyPurpose?.trim() || undefined,
      partialAreas: hasPartial ? partialAreas : undefined,
      cadastral: hasCadastral ? cadastral : undefined,
      userClaimedCorrectTotalAreaSqm:
        me != null && me.claimed > 0 ? me.claimed : undefined,
      areaDisputeEvidenceUrl: me?.attachment,
      userSuggestedClassification: ce?.suggested?.trim() || undefined,
    },
    tax: {
      bimonthlyPaymentReported: payload.bimonthlyPayment,
      reportedPaymentFromForm:
        payload.reportedPayment != null && payload.reportedPayment > 0
          ? payload.reportedPayment
          : undefined,
      paymentPeriod: payload.paymentPeriod?.trim() || undefined,
      calculationSummary: payload.calculationResult,
      optedIntoFeeNames:
        payload.selectedFees && payload.selectedFees.length > 0
          ? payload.selectedFees
          : undefined,
    },
    
    exemptions: payload.selectedExemptions,
    designations: payload.designations,
    householdSize: payload.householdSize,
    childrenCount: payload.childrenCount,
    leadId: payload.leadId,
    appealNarrativeHints: buildAppealNarrativeHints(payload),
  };
}
