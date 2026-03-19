/**
 * Mock City Test Scenarios
 *
 * All scenarios use the "mock-city" (עיר לדוגמה) tariff data.
 * Each scenario documents the input and expected calculation result.
 *
 * Formula: annual = totalArea × ratePerSqm
 *          bimonthly = annual / 6
 *          If exemption: discount applies to min(totalArea, maxAreaSqm)
 */

import type { TaxCalculationInput } from '@/lib/calculator';

interface Scenario {
  name: string;
  description: string;
  input: TaxCalculationInput;
  expected: {
    ratePerSqm: number;
    totalAreaSqm: number;
    annualBeforeExemption: number;
    annualAfterExemption: number;
    calculatedBimonthly: number;
    outcome: 'match' | 'overpaying' | 'underpaying';
    savingsBimonthly: number;
  };
}

// ── RESIDENTIAL SCENARIOS ─────────────────────────────────────────────

export const residentialScenarios: Scenario[] = [
  // ── 1. Basic match — zone א, 80 sqm, no exemption ─────────────────
  {
    name: 'דירה רגילה - חישוב תואם',
    description: 'דירה 80 מ"ר באזור א, ללא הנחות. המשתמש משלם בדיוק מה שצריך.',
    input: {
      propertyType: 'residential',
      subType: 'standard',
      zone: 'א',
      propertyAreaSqm: 80,
      bimonthlyPayment: 1266.67, // 80 × 95 = 7600 / 6 = 1266.67
    },
    expected: {
      ratePerSqm: 95.0,
      totalAreaSqm: 80,
      annualBeforeExemption: 7600,
      annualAfterExemption: 7600,
      calculatedBimonthly: 1266.67,
      outcome: 'match',
      savingsBimonthly: 0,
    },
  },

  // ── 2. Overpaying — zone ב, 100 sqm ───────────────────────────────
  {
    name: 'דירה - תשלום יתר',
    description: 'דירה 100 מ"ר באזור ב. משלם 1500₪ אבל צריך 1308.33₪.',
    input: {
      propertyType: 'residential',
      subType: 'standard',
      zone: 'ב',
      propertyAreaSqm: 100,
      bimonthlyPayment: 1500,
      // 100 × 78.5 = 7850 / 6 = 1308.33
    },
    expected: {
      ratePerSqm: 78.5,
      totalAreaSqm: 100,
      annualBeforeExemption: 7850,
      annualAfterExemption: 7850,
      calculatedBimonthly: 1308.33,
      outcome: 'overpaying',
      savingsBimonthly: 191.67,
    },
  },

  // ── 3. Underpaying — zone ג, 70 sqm ───────────────────────────────
  {
    name: 'דירה - תשלום חסר',
    description: 'דירה 70 מ"ר באזור ג. משלם 500₪ אבל צריך 641.67₪.',
    input: {
      propertyType: 'residential',
      subType: 'standard',
      zone: 'ג',
      propertyAreaSqm: 70,
      bimonthlyPayment: 500,
      // 70 × 55 = 3850 / 6 = 641.67
    },
    expected: {
      ratePerSqm: 55.0,
      totalAreaSqm: 70,
      annualBeforeExemption: 3850,
      annualAfterExemption: 3850,
      calculatedBimonthly: 641.67,
      outcome: 'underpaying',
      savingsBimonthly: 0,
    },
  },

  // ── 4. With balcony + storage — total area includes extras ─────────
  {
    name: 'דירה עם מרפסת ומחסן',
    description: 'דירה 80 מ"ר + מרפסת 12 + מחסן 8 = סה"כ 100 מ"ר, אזור א.',
    input: {
      propertyType: 'residential',
      subType: 'standard',
      zone: 'א',
      propertyAreaSqm: 80,
      coveredBalconySqm: 12,
      storageSqm: 8,
      bimonthlyPayment: 1583.33, // 100 × 95 = 9500 / 6 = 1583.33
    },
    expected: {
      ratePerSqm: 95.0,
      totalAreaSqm: 100,
      annualBeforeExemption: 9500,
      annualAfterExemption: 9500,
      calculatedBimonthly: 1583.33,
      outcome: 'match',
      savingsBimonthly: 0,
    },
  },

  // ── 5. Size-based subtype — small apartment ────────────────────────
  {
    name: 'דירה קטנה - תעריף לפי גודל',
    description: 'דירה 50 מ"ר (טווח 0-60), תעריף 40₪/מ"ר.',
    input: {
      propertyType: 'residential',
      subType: 'size_based',
      zone: 'all',
      propertyAreaSqm: 50,
      bimonthlyPayment: 400,
      // 50 × 40 = 2000 / 6 = 333.33
    },
    expected: {
      ratePerSqm: 40.0,
      totalAreaSqm: 50,
      annualBeforeExemption: 2000,
      annualAfterExemption: 2000,
      calculatedBimonthly: 333.33,
      outcome: 'overpaying',
      savingsBimonthly: 66.67,
    },
  },

  // ── 6. Size-based subtype — large apartment ────────────────────────
  {
    name: 'דירה גדולה - תעריף לפי גודל',
    description: 'דירה 200 מ"ר (טווח 151+), תעריף 110₪/מ"ר.',
    input: {
      propertyType: 'residential',
      subType: 'size_based',
      zone: 'all',
      propertyAreaSqm: 200,
      bimonthlyPayment: 3666.67, // 200 × 110 = 22000 / 6 = 3666.67
    },
    expected: {
      ratePerSqm: 110.0,
      totalAreaSqm: 200,
      annualBeforeExemption: 22000,
      annualAfterExemption: 22000,
      calculatedBimonthly: 3666.67,
      outcome: 'match',
      savingsBimonthly: 0,
    },
  },

  // ── 7. Measurement correction ──────────────────────────────────────
  {
    name: 'דירה עם טעות מדידה',
    description: 'רשום 100 מ"ר אבל המשתמש טוען שהשטח 85 מ"ר. אזור ב.',
    input: {
      propertyType: 'residential',
      subType: 'standard',
      zone: 'ב',
      propertyAreaSqm: 100,
      correctedAreaSqm: 85,
      bimonthlyPayment: 1308.33,
      // Corrected: 85 × 78.5 = 6672.5 / 6 = 1112.08
    },
    expected: {
      ratePerSqm: 78.5,
      totalAreaSqm: 85,
      annualBeforeExemption: 6672.5,
      annualAfterExemption: 6672.5,
      calculatedBimonthly: 1112.08,
      outcome: 'overpaying',
      savingsBimonthly: 196.25,
    },
  },
];

// ── EXEMPTION SCENARIOS ───────────────────────────────────────────────

export const exemptionScenarios: Scenario[] = [
  // ── 8. Senior 25% — area 80 sqm (under 100 cap) ──────────────────
  {
    name: 'אזרח ותיק 25% - דירה קטנה',
    description: 'דירה 80 מ"ר אזור א. אזרח ותיק 25%. כל השטח זכאי להנחה.',
    input: {
      propertyType: 'residential',
      subType: 'standard',
      zone: 'א',
      propertyAreaSqm: 80,
      bimonthlyPayment: 1266.67,
      selectedExemptionCode: 'senior_25',
      // 80 × 95 × 0.75 = 5700 / 6 = 950
    },
    expected: {
      ratePerSqm: 95.0,
      totalAreaSqm: 80,
      annualBeforeExemption: 7600,
      annualAfterExemption: 5700,
      calculatedBimonthly: 950,
      outcome: 'overpaying',
      savingsBimonthly: 316.67,
    },
  },

  // ── 9. Senior 25% — area 120 sqm (exceeds 100 cap) ───────────────
  {
    name: 'אזרח ותיק 25% - דירה גדולה (מעל תקרה)',
    description: 'דירה 120 מ"ר אזור א. הנחה רק על 100 מ"ר, 20 מ"ר במחיר מלא.',
    input: {
      propertyType: 'residential',
      subType: 'standard',
      zone: 'א',
      propertyAreaSqm: 120,
      bimonthlyPayment: 1900,
      selectedExemptionCode: 'senior_25',
      // Eligible 100 sqm: 100 × 95 × 0.75 = 7125
      // Remainder 20 sqm: 20 × 95 = 1900
      // Total: 9025 / 6 = 1504.17
    },
    expected: {
      ratePerSqm: 95.0,
      totalAreaSqm: 120,
      annualBeforeExemption: 11400,
      annualAfterExemption: 9025,
      calculatedBimonthly: 1504.17,
      outcome: 'overpaying',
      savingsBimonthly: 395.83,
    },
  },

  // ── 10. Disabled 80% — within cap ──────────────────────────────────
  {
    name: 'נכה 80% - הנחה מלאה',
    description: 'דירה 90 מ"ר אזור ב. נכה 80%, תקרה 130 מ"ר — כל השטח בהנחה.',
    input: {
      propertyType: 'residential',
      subType: 'standard',
      zone: 'ב',
      propertyAreaSqm: 90,
      bimonthlyPayment: 1200,
      selectedExemptionCode: 'disabled_80',
      // 90 × 78.5 × 0.20 = 1413 / 6 = 235.5
    },
    expected: {
      ratePerSqm: 78.5,
      totalAreaSqm: 90,
      annualBeforeExemption: 7065,
      annualAfterExemption: 1413,
      calculatedBimonthly: 235.5,
      outcome: 'overpaying',
      savingsBimonthly: 964.5,
    },
  },

  // ── 11. Disabled 100% — full exemption ─────────────────────────────
  {
    name: 'נכה 100% - פטור מלא',
    description: 'דירה 70 מ"ר אזור ג. נכה 100%, תקרה 100 — פטור מלא.',
    input: {
      propertyType: 'residential',
      subType: 'standard',
      zone: 'ג',
      propertyAreaSqm: 70,
      bimonthlyPayment: 641.67,
      selectedExemptionCode: 'disabled_100',
      // 70 × 55 × 0 = 0 / 6 = 0
    },
    expected: {
      ratePerSqm: 55.0,
      totalAreaSqm: 70,
      annualBeforeExemption: 3850,
      annualAfterExemption: 0,
      calculatedBimonthly: 0,
      outcome: 'overpaying',
      savingsBimonthly: 641.67,
    },
  },

  // ── 12. Income-based — household size check (eligible) ─────────────
  {
    name: 'הכנסה נמוכה - 3 נפשות (זכאי)',
    description: '3 נפשות, הכנסה נמוכה 80%, תקרת 70 מ"ר. דירה 65 מ"ר אזור ב.',
    input: {
      propertyType: 'residential',
      subType: 'standard',
      zone: 'ב',
      propertyAreaSqm: 65,
      bimonthlyPayment: 850,
      selectedExemptionCode: 'income_80_small',
      householdSize: 3,
      // 65 × 78.5 × 0.20 = 1020.5 / 6 = 170.08
    },
    expected: {
      ratePerSqm: 78.5,
      totalAreaSqm: 65,
      annualBeforeExemption: 5102.5,
      annualAfterExemption: 1020.5,
      calculatedBimonthly: 170.08,
      outcome: 'overpaying',
      savingsBimonthly: 679.92,
    },
  },

  // ── 13. Income-based — household size check (NOT eligible) ─────────
  {
    name: 'הכנסה נמוכה 5+ נפשות - רק 3 נפשות (לא זכאי)',
    description: 'בחר הנחה ל-5+ נפשות אבל יש לו רק 3 — ההנחה לא מאושרת.',
    input: {
      propertyType: 'residential',
      subType: 'standard',
      zone: 'ב',
      propertyAreaSqm: 80,
      bimonthlyPayment: 1308.33,
      selectedExemptionCode: 'income_80_large', // requires minHouseholdSize: 5
      householdSize: 3, // too few!
      // Exemption NOT applied → 80 × 78.5 = 6280 / 6 = 1046.67
    },
    expected: {
      ratePerSqm: 78.5,
      totalAreaSqm: 80,
      annualBeforeExemption: 6280,
      annualAfterExemption: 6280, // no discount applied
      calculatedBimonthly: 1046.67,
      outcome: 'overpaying',
      savingsBimonthly: 261.66,
    },
  },

  // ── 14. Large family — children check ──────────────────────────────
  {
    name: 'משפחה ברוכת ילדים - 5 ילדים',
    description: '5 ילדים (צריך 4 מינ), דירה 100 מ"ר אזור א. 20% הנחה על 100 (תקרה 120).',
    input: {
      propertyType: 'residential',
      subType: 'standard',
      zone: 'א',
      propertyAreaSqm: 100,
      bimonthlyPayment: 1583.33,
      selectedExemptionCode: 'large_family_4',
      childrenCount: 5,
      // 100 × 95 × 0.80 = 7600 / 6 = 1266.67
    },
    expected: {
      ratePerSqm: 95.0,
      totalAreaSqm: 100,
      annualBeforeExemption: 9500,
      annualAfterExemption: 7600,
      calculatedBimonthly: 1266.67,
      outcome: 'overpaying',
      savingsBimonthly: 316.66,
    },
  },

  // ── 15. Large family 6+ — not enough children ─────────────────────
  {
    name: 'משפחה ברוכת ילדים 6+ - רק 4 ילדים (לא זכאי)',
    description: 'בחר הנחה ל-6+ ילדים אבל יש 4 — לא זכאי.',
    input: {
      propertyType: 'residential',
      subType: 'standard',
      zone: 'א',
      propertyAreaSqm: 100,
      bimonthlyPayment: 1583.33,
      selectedExemptionCode: 'large_family_6', // requires minChildren: 6
      childrenCount: 4,
      // No exemption → 100 × 95 = 9500 / 6 = 1583.33
    },
    expected: {
      ratePerSqm: 95.0,
      totalAreaSqm: 100,
      annualBeforeExemption: 9500,
      annualAfterExemption: 9500,
      calculatedBimonthly: 1583.33,
      outcome: 'match',
      savingsBimonthly: 0,
    },
  },

  // ── 16. Empty property — full exemption, no area cap ───────────────
  {
    name: 'נכס ריק - פטור מלא',
    description: 'דירה ריקה 120 מ"ר אזור ב. פטור 100%, ללא הגבלת שטח.',
    input: {
      propertyType: 'residential',
      subType: 'standard',
      zone: 'ב',
      propertyAreaSqm: 120,
      bimonthlyPayment: 1570,
      selectedExemptionCode: 'empty_100',
      // 120 × 78.5 × 0 = 0 / 6 = 0
    },
    expected: {
      ratePerSqm: 78.5,
      totalAreaSqm: 120,
      annualBeforeExemption: 9420,
      annualAfterExemption: 0,
      calculatedBimonthly: 0,
      outcome: 'overpaying',
      savingsBimonthly: 1570,
    },
  },

  // ── 17. New immigrant 90% — capped at 100 sqm ─────────────────────
  {
    name: 'עולה חדש 90% - דירה 110 מ"ר',
    description: '90% הנחה על 100 מ"ר, 10 מ"ר במחיר מלא. אזור א.',
    input: {
      propertyType: 'residential',
      subType: 'standard',
      zone: 'א',
      propertyAreaSqm: 110,
      bimonthlyPayment: 1741.67,
      selectedExemptionCode: 'immigrant_90',
      // Eligible 100: 100 × 95 × 0.10 = 950
      // Remainder 10: 10 × 95 = 950
      // Total: 1900 / 6 = 316.67
    },
    expected: {
      ratePerSqm: 95.0,
      totalAreaSqm: 110,
      annualBeforeExemption: 10450,
      annualAfterExemption: 1900,
      calculatedBimonthly: 316.67,
      outcome: 'overpaying',
      savingsBimonthly: 1425,
    },
  },
];

// ── BUSINESS SCENARIOS ────────────────────────────────────────────────

export const businessScenarios: Scenario[] = [
  // ── 18. Small shop zone א ──────────────────────────────────────────
  {
    name: 'חנות קטנה - אזור מרכז',
    description: 'חנות 25 מ"ר באזור א (טווח 0-30), 400₪/מ"ר.',
    input: {
      propertyType: 'business',
      subType: 'retail',
      zone: 'א',
      propertyAreaSqm: 25,
      bimonthlyPayment: 1800,
      // 25 × 400 = 10000 / 6 = 1666.67
    },
    expected: {
      ratePerSqm: 400.0,
      totalAreaSqm: 25,
      annualBeforeExemption: 10000,
      annualAfterExemption: 10000,
      calculatedBimonthly: 1666.67,
      outcome: 'overpaying',
      savingsBimonthly: 133.33,
    },
  },

  // ── 19. Large office zone א ────────────────────────────────────────
  {
    name: 'משרד גדול - 3000 מ"ר',
    description: 'משרד 3000 מ"ר אזור א (טווח 501-5000), 260₪/מ"ר.',
    input: {
      propertyType: 'business',
      subType: 'offices',
      zone: 'א',
      propertyAreaSqm: 3000,
      bimonthlyPayment: 130000,
      // 3000 × 260 = 780000 / 6 = 130000
    },
    expected: {
      ratePerSqm: 260.0,
      totalAreaSqm: 3000,
      annualBeforeExemption: 780000,
      annualAfterExemption: 780000,
      calculatedBimonthly: 130000,
      outcome: 'match',
      savingsBimonthly: 0,
    },
  },

  // ── 20. Supermarket — flat rate, no zones ──────────────────────────
  {
    name: 'סופרמרקט - תעריף אחיד',
    description: 'סופרמרקט 800 מ"ר, תעריף 450₪/מ"ר בכל העיר.',
    input: {
      propertyType: 'business',
      subType: 'supermarket',
      zone: 'all',
      propertyAreaSqm: 800,
      bimonthlyPayment: 62000,
      // 800 × 450 = 360000 / 6 = 60000
    },
    expected: {
      ratePerSqm: 450.0,
      totalAreaSqm: 800,
      annualBeforeExemption: 360000,
      annualAfterExemption: 360000,
      calculatedBimonthly: 60000,
      outcome: 'overpaying',
      savingsBimonthly: 2000,
    },
  },

  // ── 21. Manufacturing — size range boundary ────────────────────────
  {
    name: 'מפעל ייצור - על גבול טווח',
    description: 'מפעל 500 מ"ר (על הגבול של 0-500), 180₪/מ"ר.',
    input: {
      propertyType: 'industry',
      subType: 'manufacturing',
      zone: 'ד',
      propertyAreaSqm: 500,
      bimonthlyPayment: 15000,
      // 500 × 180 = 90000 / 6 = 15000
    },
    expected: {
      ratePerSqm: 180.0,
      totalAreaSqm: 500,
      annualBeforeExemption: 90000,
      annualAfterExemption: 90000,
      calculatedBimonthly: 15000,
      outcome: 'match',
      savingsBimonthly: 0,
    },
  },

  // ── 22. Manufacturing — next size range ────────────────────────────
  {
    name: 'מפעל ייצור - טווח שני',
    description: 'מפעל 501 מ"ר (טווח 501-3000), 150₪/מ"ר.',
    input: {
      propertyType: 'industry',
      subType: 'manufacturing',
      zone: 'ד',
      propertyAreaSqm: 501,
      bimonthlyPayment: 15000,
      // 501 × 150 = 75150 / 6 = 12525
    },
    expected: {
      ratePerSqm: 150.0,
      totalAreaSqm: 501,
      annualBeforeExemption: 75150,
      annualAfterExemption: 75150,
      calculatedBimonthly: 12525,
      outcome: 'overpaying',
      savingsBimonthly: 2475,
    },
  },

  // ── 23. Storage — flat rate ────────────────────────────────────────
  {
    name: 'מחסן',
    description: 'מחסן 300 מ"ר, תעריף 80₪/מ"ר.',
    input: {
      propertyType: 'industry',
      subType: 'storage',
      zone: 'ד',
      propertyAreaSqm: 300,
      bimonthlyPayment: 4000,
      // 300 × 80 = 24000 / 6 = 4000
    },
    expected: {
      ratePerSqm: 80.0,
      totalAreaSqm: 300,
      annualBeforeExemption: 24000,
      annualAfterExemption: 24000,
      calculatedBimonthly: 4000,
      outcome: 'match',
      savingsBimonthly: 0,
    },
  },

  // ── 24. Land — flat rate, all zones ────────────────────────────────
  {
    name: 'קרקע',
    description: 'קרקע 2000 מ"ר, 22₪/מ"ר בכל העיר.',
    input: {
      propertyType: 'industry',
      subType: 'land',
      zone: 'all',
      propertyAreaSqm: 2000,
      bimonthlyPayment: 8500,
      // 2000 × 22 = 44000 / 6 = 7333.33
    },
    expected: {
      ratePerSqm: 22.0,
      totalAreaSqm: 2000,
      annualBeforeExemption: 44000,
      annualAfterExemption: 44000,
      calculatedBimonthly: 7333.33,
      outcome: 'overpaying',
      savingsBimonthly: 1166.67,
    },
  },
];

export const allScenarios = [
  ...residentialScenarios,
  ...exemptionScenarios,
  ...businessScenarios,
];
