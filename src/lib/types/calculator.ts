/**
 * Shared interfaces for the Tax Calculation engine.
 *
 * Moved from `src/lib/calculator.ts` to avoid coupling consumers
 * to the engine implementation when they only need the type shapes.
 */

// ── Calculation input ────────────────────────────────────────────────
export interface TaxCalculationInput {
  propertyType: string;       // type code (e.g., "residential")
  subType: string;            // subtype code (e.g., "apartments")
  zone: string;               // zone code (e.g., "א")
  propertyAreaSqm: number;    // main property area
  coveredBalconySqm?: number;
  storageSqm?: number;
  parkingSqm?: number;
  bimonthlyPayment: number;   // reported payment from council bill
  // Exemption
  selectedExemptionCode?: string;   // single code (backward compat)
  selectedExemptionCodes?: string[]; // multiple codes — best one is applied
  householdSize?: number;
  childrenCount?: number;
  // Error corrections
  correctedAreaSqm?: number;  // if user reports measurement error
  // Dynamic area types (replaces legacy fields when city defines areaTypeDiscounts)
  additionalAreas?: { areaType: string; areaSqm: number }[];
  // Fee opt-in (names of optional fees the user opted into)
  selectedFees?: string[];
}

// ── Area breakdown item ──────────────────────────────────────────────
export interface AreaBreakdownItem {
  areaType: string;
  label: string;
  areaSqm: number;
  baseRatePerSqm: number;
  discountPercent: number;
  effectiveRatePerSqm: number;
  annualAmount: number;
}

// ── Applied fee ──────────────────────────────────────────────────────
export interface AppliedFee {
  name: string;
  amount: number;        // דו-חודשי
  isMandatory: boolean;
}

// ── Calculation result ───────────────────────────────────────────────
export interface TaxCalculationResult {
  // Rate info
  ratePerSqm: number;
  propertyCode?: string;
  // Calculated amounts
  totalAreaSqm: number;
  annualBeforeExemption: number;
  // Exemption
  appliedExemption?: {
    sectionCode: string;
    sectionLabel: string;
    subSectionCode: string;
    description: string;
    discountPercent: number;
    eligibleAreaSqm: number;
  };
  annualAfterExemption: number;
  // Area breakdown (when areaTypeDiscounts exist on tariff)
  areaBreakdown?: AreaBreakdownItem[];
  // Applied fees (when cityFees exist on tariff)
  appliedFees?: AppliedFee[];
  totalFeesBimonthly?: number;
  // Bimonthly
  calculatedBimonthly: number;
  reportedBimonthly: number;
  // Outcome
  outcome: 'match' | 'overpaying' | 'underpaying';
  // Savings (only meaningful when overpaying)
  savingsBimonthly: number;
  savingsAnnual: number;
  savings10Year: number;
}

// ── Rate lookup result ───────────────────────────────────────────────
export interface RateResult {
  rate: number;             // blended rate per sqm (annualTotal / area) — for display
  propertyCode?: string;    // property code of the primary (last applicable) range
  annualTotal: number;      // actual annual cost — use this for calculations
  isProgressive: boolean;   // true if progressive size-range calculation was used
}
