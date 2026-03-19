/**
 * Property Tax Calculator Engine
 *
 * Calculates property tax based on city tariff data and compares
 * with reported bimonthly payment to determine if user is overpaying.
 */

import type { ICityTariff, IPropertyType, ISubType, IZoneRate, ISizeRange, IExemptionSection } from './models/CityTariff';

// ── Result interfaces ──────────────────────────────────────────────────

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
  selectedExemptionCode?: string; // subsection code (e.g., "senior_25")
  householdSize?: number;
  childrenCount?: number;
  // Error corrections
  correctedAreaSqm?: number;  // if user reports measurement error
}

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

// ── Rate lookup ────────────────────────────────────────────────────────

/**
 * Find the rate per sqm by traversing the tariff tree:
 * types → subtypes → zones → (sizeRanges?) → rate
 */
export function findRate(
  tariff: ICityTariff,
  typeCode: string,
  subtypeCode: string,
  zoneCode: string,
  propertySizeSqm: number
): { rate: number; propertyCode?: string } {
  // Find type
  const propertyType = tariff.types.find(
    (t: IPropertyType) => t.code === typeCode
  );
  if (!propertyType) {
    throw new Error(`סוג נכס "${typeCode}" לא נמצא בתעריפי ${tariff.cityName}`);
  }

  // Find subtype
  const subType = propertyType.subtypes.find(
    (s: ISubType) => s.code === subtypeCode
  );
  if (!subType) {
    throw new Error(`תת-סוג "${subtypeCode}" לא נמצא תחת ${propertyType.label}`);
  }

  // Find zone
  const zoneRate = subType.zones.find(
    (z: IZoneRate) => z.zone === zoneCode
  );
  if (!zoneRate) {
    throw new Error(`אזור "${zoneCode}" לא נמצא עבור ${subType.label}`);
  }

  // If zone has size ranges, find matching range
  if (zoneRate.sizeRanges && zoneRate.sizeRanges.length > 0) {
    const matchingRange = zoneRate.sizeRanges.find(
      (sr: ISizeRange) =>
        propertySizeSqm >= sr.min &&
        (sr.max === -1 || propertySizeSqm <= sr.max)
    );
    if (!matchingRange) {
      throw new Error(
        `לא נמצא תעריף לשטח ${propertySizeSqm} מ"ר באזור ${zoneRate.zoneLabel}`
      );
    }
    return { rate: matchingRange.rate, propertyCode: matchingRange.propertyCode };
  }

  // Direct rate on zone
  if (zoneRate.rate !== undefined && zoneRate.rate !== null) {
    return { rate: zoneRate.rate, propertyCode: zoneRate.propertyCode };
  }

  throw new Error(`לא נמצא תעריף עבור ${subType.label} באזור ${zoneRate.zoneLabel}`);
}

// ── Exemption resolution ───────────────────────────────────────────────

interface ResolvedExemption {
  sectionCode: string;
  sectionLabel: string;
  subSectionCode: string;
  description: string;
  discountPercent: number;
  maxAreaSqm?: number;
}

/**
 * Find and validate an exemption subsection from the tariff's exemptions.
 * Checks eligibility based on household size and children count.
 */
export function resolveExemption(
  tariff: ICityTariff,
  subSectionCode: string,
  householdSize?: number,
  childrenCount?: number
): ResolvedExemption | null {
  for (const section of tariff.exemptions) {
    for (const sub of section.subSections) {
      if (sub.code === subSectionCode) {
        // Validate restrictions
        const r = sub.restrictions ?? {};
        if (r.minHouseholdSize && (!householdSize || householdSize < r.minHouseholdSize)) {
          return null; // Not eligible — household too small
        }
        if (r.minChildren && (!childrenCount || childrenCount < r.minChildren)) {
          return null; // Not eligible — not enough children
        }
        return {
          sectionCode: section.sectionCode,
          sectionLabel: section.sectionLabel,
          subSectionCode: sub.code,
          description: sub.description,
          discountPercent: sub.discountPercent,
          maxAreaSqm: r.maxAreaSqm,
        };
      }
    }
  }
  return null;
}

// ── Main calculation ───────────────────────────────────────────────────

/**
 * Calculate property tax and compare with reported payment.
 *
 * Formula:
 *   annual = totalArea × ratePerSqm
 *   If exemption: discount applies on min(totalArea, maxAreaSqm)
 *   bimonthly = annual / 6
 *
 * Outcome:
 *   match      — difference < 5₪ bimonthly (tolerance)
 *   overpaying — reported > calculated (user pays too much)
 *   underpaying — reported < calculated
 */
export function calculatePropertyTax(
  tariff: ICityTariff,
  input: TaxCalculationInput
): TaxCalculationResult {
  // Use corrected area if provided (measurement error)
  const mainArea = input.correctedAreaSqm ?? input.propertyAreaSqm;
  const totalArea =
    mainArea +
    (input.coveredBalconySqm ?? 0) +
    (input.storageSqm ?? 0) +
    (input.parkingSqm ?? 0);

  // Find rate
  const { rate: ratePerSqm, propertyCode } = findRate(
    tariff,
    input.propertyType,
    input.subType,
    input.zone,
    totalArea
  );

  // Calculate annual before exemption
  const annualBeforeExemption = totalArea * ratePerSqm;

  // Apply exemption if selected
  let annualAfterExemption = annualBeforeExemption;
  let appliedExemption: TaxCalculationResult['appliedExemption'] = undefined;

  if (input.selectedExemptionCode) {
    const exemption = resolveExemption(
      tariff,
      input.selectedExemptionCode,
      input.householdSize,
      input.childrenCount
    );

    if (exemption) {
      // Discount applies to eligible area only
      const eligibleArea = exemption.maxAreaSqm
        ? Math.min(totalArea, exemption.maxAreaSqm)
        : totalArea;
      const remainderArea = totalArea - eligibleArea;

      const discountedPortion = eligibleArea * ratePerSqm * (1 - exemption.discountPercent / 100);
      const fullPricePortion = remainderArea * ratePerSqm;
      annualAfterExemption = discountedPortion + fullPricePortion;

      appliedExemption = {
        sectionCode: exemption.sectionCode,
        sectionLabel: exemption.sectionLabel,
        subSectionCode: exemption.subSectionCode,
        description: exemption.description,
        discountPercent: exemption.discountPercent,
        eligibleAreaSqm: eligibleArea,
      };
    }
  }

  // Bimonthly = annual / 6 (Israel: 6 bimonthly periods per year)
  const calculatedBimonthly = Math.round((annualAfterExemption / 6) * 100) / 100;
  const reportedBimonthly = input.bimonthlyPayment;

  // Determine outcome (5₪ tolerance)
  const TOLERANCE = 5;
  const diff = reportedBimonthly - calculatedBimonthly;
  let outcome: 'match' | 'overpaying' | 'underpaying';
  if (Math.abs(diff) <= TOLERANCE) {
    outcome = 'match';
  } else if (diff > 0) {
    outcome = 'overpaying';
  } else {
    outcome = 'underpaying';
  }

  // Savings (positive = user saves money)
  const savingsBimonthly = Math.max(0, Math.round(diff * 100) / 100);
  const savingsAnnual = Math.round(savingsBimonthly * 6 * 100) / 100;
  const savings10Year = Math.round(savingsAnnual * 10 * 100) / 100;

  return {
    ratePerSqm,
    propertyCode,
    totalAreaSqm: totalArea,
    annualBeforeExemption: Math.round(annualBeforeExemption * 100) / 100,
    appliedExemption,
    annualAfterExemption: Math.round(annualAfterExemption * 100) / 100,
    calculatedBimonthly,
    reportedBimonthly,
    outcome,
    savingsBimonthly,
    savingsAnnual,
    savings10Year,
  };
}

/**
 * Calculate tax for business property with multiple designations.
 * Each designation gets its own rate lookup and the totals are summed.
 */
export function calculateBusinessPropertyTax(
  tariff: ICityTariff,
  designations: { typeCode: string; subtypeCode: string; zone: string; areaSqm: number }[],
  bimonthlyPayment: number,
  selectedExemptionCode?: string,
  householdSize?: number,
  childrenCount?: number
): TaxCalculationResult {
  let totalAnnual = 0;
  let totalArea = 0;
  let lastRate = 0;
  let lastPropertyCode: string | undefined;

  for (const d of designations) {
    const { rate, propertyCode } = findRate(tariff, d.typeCode, d.subtypeCode, d.zone, d.areaSqm);
    totalAnnual += d.areaSqm * rate;
    totalArea += d.areaSqm;
    lastRate = rate;
    lastPropertyCode = propertyCode;
  }

  const annualBeforeExemption = totalAnnual;
  let annualAfterExemption = annualBeforeExemption;
  let appliedExemption: TaxCalculationResult['appliedExemption'] = undefined;

  // Business exemptions are less common but still possible
  if (selectedExemptionCode) {
    const exemption = resolveExemption(tariff, selectedExemptionCode, householdSize, childrenCount);
    if (exemption) {
      const eligibleArea = exemption.maxAreaSqm
        ? Math.min(totalArea, exemption.maxAreaSqm)
        : totalArea;
      const discountRatio = eligibleArea / totalArea;
      annualAfterExemption = annualBeforeExemption * (1 - (exemption.discountPercent / 100) * discountRatio);

      appliedExemption = {
        sectionCode: exemption.sectionCode,
        sectionLabel: exemption.sectionLabel,
        subSectionCode: exemption.subSectionCode,
        description: exemption.description,
        discountPercent: exemption.discountPercent,
        eligibleAreaSqm: eligibleArea,
      };
    }
  }

  const calculatedBimonthly = Math.round((annualAfterExemption / 6) * 100) / 100;
  const diff = bimonthlyPayment - calculatedBimonthly;
  const TOLERANCE = 5;

  let outcome: 'match' | 'overpaying' | 'underpaying';
  if (Math.abs(diff) <= TOLERANCE) {
    outcome = 'match';
  } else if (diff > 0) {
    outcome = 'overpaying';
  } else {
    outcome = 'underpaying';
  }

  const savingsBimonthly = Math.max(0, Math.round(diff * 100) / 100);

  return {
    ratePerSqm: designations.length === 1 ? lastRate : totalAnnual / totalArea,
    propertyCode: designations.length === 1 ? lastPropertyCode : undefined,
    totalAreaSqm: totalArea,
    annualBeforeExemption: Math.round(annualBeforeExemption * 100) / 100,
    appliedExemption,
    annualAfterExemption: Math.round(annualAfterExemption * 100) / 100,
    calculatedBimonthly,
    reportedBimonthly: bimonthlyPayment,
    outcome,
    savingsBimonthly,
    savingsAnnual: Math.round(savingsBimonthly * 6 * 100) / 100,
    savings10Year: Math.round(savingsBimonthly * 60 * 100) / 100,
  };
}
