import type { AppealGenerateRequest } from './schemas';

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
  };
  tax: {
    bimonthlyPaymentReported: number;
    calculationSummary: Record<string, unknown>;
  };
  exemptions?: AppealGenerateRequest['selectedExemptions'];
  designations?: AppealGenerateRequest['designations'];
  householdSize?: number;
  childrenCount?: number;
  leadId?: string;
}

export function buildAppealUserContext(payload: AppealGenerateRequest): AppealUserContext {
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
    },
    tax: {
      bimonthlyPaymentReported: payload.bimonthlyPayment,
      calculationSummary: payload.calculationResult,
    },
    exemptions: payload.selectedExemptions,
    designations: payload.designations,
    householdSize: payload.householdSize,
    childrenCount: payload.childrenCount,
    leadId: payload.leadId,
  };
}
