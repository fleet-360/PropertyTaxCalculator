import type { WizardState } from '@/components/calculator/CalculatorWizard';
import type { AppealGenerateRequest } from '@/lib/appeal/schemas';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidAppealEmail(email: string | undefined): boolean {
  return typeof email === 'string' && EMAIL_RE.test(email.trim());
}

/**
 * Merge an explicit corrected total area (מ"ר) into the generate payload so the server can use
 * the structured תיקון שטחים pipeline (`area_correction`). Prefer wizard `measurementError` attachment when present.
 */
export function withMeasurementErrorClaimed(
  payload: AppealGenerateRequest,
  claimedSqm: number,
): AppealGenerateRequest {
  if (!Number.isFinite(claimedSqm) || claimedSqm <= 0) {
    return payload;
  }
  return {
    ...payload,
    measurementError: {
      claimed: claimedSqm,
      attachment: payload.measurementError?.attachment,
    },
  };
}

/** Build JSON body for POST /api/appeals/generate from wizard state. */
export function buildAppealGeneratePayload(state: WizardState): AppealGenerateRequest {
  const cityName =
    (state.cityData?.cityName as string | undefined)?.trim() ||
    state.citySlug ||
    'לא צוין';

  const additionalAreas =
    state.additionalAreas?.filter((r) => r.areaType?.trim() && r.areaSqm > 0) ?? [];
  const selectedFees = state.selectedFees?.map((s) => s.trim()).filter(Boolean) ?? [];

  const payload = {
    fullName: state.fullName.trim(),
    idNumber: state.idNumber?.trim() || undefined,
    email: state.email?.trim() || undefined,
    phone: state.phone?.trim() || undefined,
    address: state.address?.trim() || undefined,
    cityName,
    citySlug: state.citySlug || undefined,
    propertyType: state.propertyType ?? undefined,
    propertyNumber: state.propertyNumber?.trim() || undefined,
    propertyId: state.propertyId?.trim() || undefined,
    propertyArea: state.propertyArea > 0 ? state.propertyArea : undefined,
    zone: state.zone?.trim() || undefined,
    subType: state.subType?.trim() || undefined,
    bimonthlyPayment: state.bimonthlyPayment,
    reportedPayment: state.reportedPayment > 0 ? state.reportedPayment : undefined,
    paymentPeriod: state.paymentPeriod?.trim() || undefined,
    calculationResult: (state.calculationResult ?? {}) as Record<string, unknown>,
    designations: state.designations?.length ? state.designations : undefined,
    selectedExemptions: state.selectedExemptions?.length ? state.selectedExemptions : undefined,
    householdSize: state.householdSize > 0 ? state.householdSize : undefined,
    childrenCount: state.childrenCount > 0 ? state.childrenCount : undefined,
    leadId: state.leadId ?? undefined,
    propertyPurpose: state.propertyPurpose?.trim() || undefined,
    measurementError:
      state.measurementError != null && state.measurementError.claimed > 0
        ? {
            claimed: state.measurementError.claimed,
            attachment: state.measurementError.attachment?.trim() || undefined,
          }
        : undefined,
    classificationError:
      state.classificationError?.suggested?.trim() != null &&
      state.classificationError.suggested.trim().length > 0
        ? { suggested: state.classificationError.suggested.trim() }
        : undefined,
    coveredBalconyArea: state.coveredBalconyArea > 0 ? state.coveredBalconyArea : undefined,
    storageArea: state.storageArea > 0 ? state.storageArea : undefined,
    parkingArea: state.parkingArea > 0 ? state.parkingArea : undefined,
    additionalAreas: additionalAreas.length > 0 ? additionalAreas : undefined,
    block: state.block?.trim() || undefined,
    parcel: state.parcel?.trim() || undefined,
    classificationCode: state.classificationCode?.trim() || undefined,
    selectedFees: selectedFees.length > 0 ? selectedFees : undefined,
  };
  return payload as AppealGenerateRequest;
}
