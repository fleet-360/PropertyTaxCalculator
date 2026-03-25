/**
 * Property Tax Calculator Engine
 *
 * Calculates property tax based on city tariff data and compares
 * with reported bimonthly payment to determine if user is overpaying.
 */

import type { ICityTariff, IPropertyType, ISubType, IZoneRate, ISizeRange, IExemptionSection } from './models/CityTariff';
import type { TaxCalculationInput, TaxCalculationResult, RateResult } from './types/calculator';

// Re-export shared types so existing consumers don't break
export type { TaxCalculationInput, TaxCalculationResult, RateResult } from './types/calculator';

/**
 * Calculate progressive (cumulative/bracket-style) annual cost.
 *
 * Each size range applies ONLY to the portion of area within its bracket.
 * Example: ranges [0-60 @40, 61-100 @65] for 70 sqm =
 *   60 × 40 + 10 × 65 = 2400 + 650 = 3050
 *
 * Uses cumulative thresholds: range.max is the upper boundary of the bracket.
 * Ranges are sorted by min ascending. max=-1 means unbounded.
 */
function calculateProgressiveAnnual(
  sizeRanges: ISizeRange[],
  totalAreaSqm: number
): { annualTotal: number; primaryPropertyCode?: string } {
  // Sort by min ascending
  const sorted = [...sizeRanges].sort((a, b) => a.min - b.min);

  let annualTotal = 0;
  let coveredSoFar = 0;
  let primaryPropertyCode: string | undefined;

  for (const range of sorted) {
    if (coveredSoFar >= totalAreaSqm) break;

    // Bracket end — use range.max as cumulative threshold
    const bracketEnd = range.max === -1 ? totalAreaSqm : range.max+1;

    // Area taxed in this bracket
    const areaInBracket = Math.max(0, Math.min(totalAreaSqm, bracketEnd) - coveredSoFar);

    if (areaInBracket > 0) {
      annualTotal += areaInBracket * range.rate;
      primaryPropertyCode = range.propertyCode;
    }

    coveredSoFar = bracketEnd;
  }

  return { annualTotal, primaryPropertyCode };
}

/**
 * Find the rate per sqm by traversing the tariff tree:
 * types → subtypes → zones → (sizeRanges?) → rate
 *
 * When size ranges exist, calculates progressive (bracket-style) cost:
 * each bracket's rate applies only to the area within that bracket.
 */
export function findRate(
  tariff: ICityTariff,
  typeCode: string,
  subtypeCode: string,
  zoneCode: string,
  propertySizeSqm: number
): RateResult {
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

  // If zone has size ranges
  if (zoneRate.sizeRanges && zoneRate.sizeRanges.length > 0) {
    if (subType.isProgressiveRate) {
      // Progressive (bracket-style): each range applies only to the area within its bracket
      const { annualTotal, primaryPropertyCode } = calculateProgressiveAnnual(
        zoneRate.sizeRanges,
        propertySizeSqm
      );
      const blendedRate = propertySizeSqm > 0 ? annualTotal / propertySizeSqm : 0;
      return {
        rate: Math.round(blendedRate * 100) / 100,
        propertyCode: primaryPropertyCode,
        annualTotal,
        isProgressive: true,
      };
    } else {
      // Flat: find the matching range and apply its rate to the entire area
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
      return {
        rate: matchingRange.rate,
        propertyCode: matchingRange.propertyCode,
        annualTotal: propertySizeSqm * matchingRange.rate,
        isProgressive: false,
      };
    }
  }

  // Direct rate on zone (flat — no size ranges)
  if (zoneRate.rate !== undefined && zoneRate.rate !== null) {
    return {
      rate: zoneRate.rate,
      propertyCode: zoneRate.propertyCode,
      annualTotal: propertySizeSqm * zoneRate.rate,
      isProgressive: false,
    };
  }

  throw new Error(`לא נמצא תעריף עבור ${subType.label} באזור ${zoneRate.zoneLabel}`);
}

// ── Reverse lookup by property code ─────────────────────────────────────

/**
 * Given a propertyCode, find the matching type/subtype/zone in the tariff tree.
 * This enables auto-populating classification fields when the code is extracted
 * from a tax bill image.
 */
export function findByPropertyCode(
  tariff: ICityTariff,
  propertyCode: string
): { typeCode: string; subtypeCode: string; zoneCode: string; rate: number } | null {
  for (const pType of tariff.types) {
    for (const sub of pType.subtypes) {
      for (const zone of sub.zones) {
        // Check size ranges first
        if (zone.sizeRanges && zone.sizeRanges.length > 0) {
          for (const sr of zone.sizeRanges) {
            if (sr.propertyCode == propertyCode) {
              return {
                typeCode: pType.code,
                subtypeCode: sub.code,
                zoneCode: zone.zone,
                rate: sr.rate,
              };
            }
          }
        }
        // Check direct zone propertyCode
        if (zone.propertyCode == propertyCode && zone.rate !== undefined && zone.rate !== null) {
          return {
            typeCode: pType.code,
            subtypeCode: sub.code,
            zoneCode: zone.zone,
            rate: zone.rate,
          };
        }
      }
    }
  }
  return null;
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

/**
 * Resolve multiple exemption codes and return the best (highest discount).
 */
export function resolveBestExemption(
  tariff: ICityTariff,
  codes: string[],
  householdSize?: number,
  childrenCount?: number
): ResolvedExemption | null {
  let best: ResolvedExemption | null = null;
  for (const code of codes) {
    const resolved = resolveExemption(tariff, code, householdSize, childrenCount);
    if (resolved && (!best || resolved.discountPercent > best.discountPercent)) {
      best = resolved;
    }
  }
  return best;
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
  // Validation
  const effectiveArea = input.correctedAreaSqm ?? input.propertyAreaSqm;
  if (effectiveArea <= 0) {
    throw new Error('שטח הנכס חייב להיות גדול מ-0');
  }
  if (input.bimonthlyPayment < 0) {
    throw new Error('סכום התשלום חייב להיות גדול מ-0');
  }

  // Use corrected area if provided (measurement error)
  const mainArea = input.correctedAreaSqm ?? input.propertyAreaSqm;
  const totalArea =
    mainArea +
    (input.coveredBalconySqm ?? 0) +
    (input.storageSqm ?? 0) +
    (input.parkingSqm ?? 0);

  // Find rate (progressive if size ranges exist)
  const { rate: ratePerSqm, propertyCode, annualTotal } = findRate(
    tariff,
    input.propertyType,
    input.subType,
    input.zone,
    totalArea
  );

  // Calculate annual before exemption (use progressive total from findRate)
  const annualBeforeExemption = annualTotal;

  // Apply exemption if selected
  let annualAfterExemption = annualBeforeExemption;
  let appliedExemption: TaxCalculationResult['appliedExemption'] = undefined;

  // Normalize: support both single code and array of codes
  const exemptionCodes = input.selectedExemptionCodes
    ?? (input.selectedExemptionCode ? [input.selectedExemptionCode] : []);

  if (exemptionCodes.length > 0) {
    const exemption = resolveBestExemption(
      tariff,
      exemptionCodes,
      input.householdSize,
      input.childrenCount
    );

    if (exemption) {
      // Discount applies to eligible area only
      const eligibleArea = exemption.maxAreaSqm
        ? Math.min(totalArea, exemption.maxAreaSqm)
        : totalArea;

      // For exemptions with area cap, calculate the discount proportionally
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

  // Bimonthly = annual / 6 (Israel: 6 bimonthly periods per year)
  const calculatedBimonthly = Math.round((annualAfterExemption / 6) * 100) / 100;
  const reportedBimonthly = input.bimonthlyPayment;

  // Determine outcome (10₪ tolerance)
  const TOLERANCE = 10;
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
  selectedExemptionCodes?: string[],
  householdSize?: number,
  childrenCount?: number
): TaxCalculationResult {
  // Validation
  if (designations.length === 0) {
    throw new Error('לא ניתן לחשב ללא ייעודים');
  }
  if (designations.length > 1) {
    throw new Error('מספר ייעודים — יש לפנות לנציג');
  }
  if (bimonthlyPayment < 0) {
    throw new Error('סכום התשלום חייב להיות גדול מ-0');
  }

  let totalAnnual = 0;
  let totalArea = 0;
  let lastRate = 0;
  let lastPropertyCode: string | undefined;

  for (const d of designations) {
    const { rate, propertyCode, annualTotal } = findRate(tariff, d.typeCode, d.subtypeCode, d.zone, d.areaSqm);
    totalAnnual += annualTotal;
    totalArea += d.areaSqm;
    lastRate = rate;
    lastPropertyCode = propertyCode;
  }

  // Validate total area
  if (totalArea > 1000) {
    throw new Error('שטח מעל 1000 מ"ר — יש לפנות לנציג');
  }

  const annualBeforeExemption = totalAnnual;
  let annualAfterExemption = annualBeforeExemption;
  let appliedExemption: TaxCalculationResult['appliedExemption'] = undefined;

  // Business exemptions are less common but still possible
  if (selectedExemptionCodes && selectedExemptionCodes.length > 0) {
    const exemption = resolveBestExemption(tariff, selectedExemptionCodes, householdSize, childrenCount);
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
  const TOLERANCE = 10;

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
