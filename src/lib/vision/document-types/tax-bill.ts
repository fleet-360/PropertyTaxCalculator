import { z } from "zod";
import { registerDocumentType } from "./registry";
import type { DocumentTypeDefinition } from "../types";
import { getPrompt } from "@/lib/prompts/getPrompt";
import {
  buildTaxBillValidationAppendix,
  evaluateTaxBillDocumentValidation,
} from "@/lib/vision/tax-bill-validation";

export { evaluateTaxBillDocumentValidation };
export type { TaxBillDocumentValidationShape } from "@/lib/vision/tax-bill-validation";

// ── Output schema — all fields optional (partial extraction expected) ──

export const taxBillSchema = z.object({
  // User details
  fullName: z.string().optional(),
  idNumber: z.string().optional(),
  // Property identification
  propertyNumber: z.string().optional(),
  propertyId: z.string().optional(),
  address: z.string().optional(),
  block: z.string().optional(),
  parcel: z.string().optional(),
  // Classification — needed for tariff lookup
  propertyPurposeDescription: z.string().optional(),
  subTypeDescription: z.string().optional(),
  classificationCode: z.string().optional(),
  zone: z.string().optional(),
  // Areas
  propertyArea: z.number().optional(),
  // coveredBalconyArea: z.number().optional(),
  // storageArea: z.number().optional(),
  // parkingArea: z.number().optional(),
  // Payment
  bimonthlyPayment: z.number().optional(),
  annualPayment: z.number().optional(),
  paymentPeriod: z.string().optional(),
  ratePerSqm: z.number().optional(),
});

export type TaxBillData = z.infer<typeof taxBillSchema>;

// ── Hebrew extraction prompt ────────────────────────────────────────

function buildTariffHintsAppendix(hints: Record<string, unknown>): string {
  const zones = hints.availableZones as
    | { code: string; label: string }[]
    | undefined;
  const subtypes = hints.subtypes as
    | {
        code: string;
        label: string;
        category: string;
        typeCode: string;
        typeLabel: string;
        zones: string[];
      }[]
    | undefined;

  if ((!zones || zones.length === 0) && (!subtypes || subtypes.length === 0))
    return "";

  const lines: string[] = [
    "═══════════════════════════════════════════════════",
    "נתוני תעריף העיר — השתמש בהם להתאמת שדות הסיווג:",
    "═══════════════════════════════════════════════════",
    "",
    "הנחיות חשובות:",
    "• עבור שדה zone: התאם את הטקסט שחולץ מהשובר לקוד האזור הקרוב ביותר מהרשימה למטה. החזר את ה-code (לא את ה-label).",
    "• עבור שדה subTypeDescription: התאם את תיאור הסיווג מהשובר לתווית (label) הקרובה ביותר מרשימת תתי-הסיווגים למטה.",
    "• עבור שדה classificationCode: העדף קודים שמופיעים ברשימת תתי-הסיווגים למטה.",
    "",
  ];

  if (zones && zones.length > 0) {
    lines.push("אזורים זמינים בעיר:");
    for (const z of zones) {
      lines.push(`• ${z.code} — ${z.label}`);
    }
    lines.push("");
  }

  if (subtypes && subtypes.length > 0) {
    lines.push("תתי-סיווגים זמינים:");
    for (const s of subtypes) {
      const categoryHeb = s.category === "private" ? "מגורים" : "עסקים";
      lines.push(
        `• קוד ${s.code} — ${s.label} (${categoryHeb}, סוג: ${s.typeLabel})`,
      );
    }
    lines.push("");
  }

  return lines.join("\n");
}

async function buildTaxBillPrompt(
  options?: Record<string, unknown>,
): Promise<string> {
  const expected =
    typeof options?.expectedCityName === "string"
      ? options.expectedCityName.trim()
      : undefined;
  const appendix = buildTaxBillValidationAppendix(expected);
  const base = await getPrompt("tax_bill_extraction");

  const tariffHints = options?.tariffHints as
    | Record<string, unknown>
    | undefined;
  const tariffAppendix = tariffHints
    ? buildTariffHintsAppendix(tariffHints)
    : "";

  const parts = [appendix, tariffAppendix, base].filter(Boolean);
  return parts.join("\n\n");
}

// ── Post-processing — normalize extracted values ────────────────────

function postProcess(raw: Partial<TaxBillData>): Partial<TaxBillData> {
  const result = { ...raw };

  // Normalize ID number: strip dashes, spaces, non-digit characters
  if (result.idNumber) {
    result.idNumber = result.idNumber.replace(/[^\d]/g, "");
  }

  // // Ensure areas are non-negative
  // const areaKeys = ['propertyArea', 'coveredBalconyArea', 'storageArea', 'parkingArea'] as const;
  // for (const key of areaKeys) {
  //   if (result[key] !== undefined && result[key]! < 0) {
  //     result[key] = 0;
  //   }
  // }

  // Ensure payments and rate are non-negative
  const paymentKeys = [
    "bimonthlyPayment",
    "annualPayment",
    "ratePerSqm",
  ] as const;
  for (const key of paymentKeys) {
    if (result[key] !== undefined && result[key]! < 0) {
      result[key] = 0;
    }
  }

  // Normalize paymentPeriod to known values
  if (result.paymentPeriod) {
    const period = result.paymentPeriod.toLowerCase().trim();
    const validPeriods = [
      "monthly",
      "bimonthly",
      "quarterly",
      "semi_annual",
      "annual",
    ];
    if (!validPeriods.includes(period)) {
      result.paymentPeriod = "bimonthly"; // default
    } else {
      result.paymentPeriod = period;
    }
  }

  return result;
}

// ── Register document type ──────────────────────────────────────────

const taxBillDefinition: DocumentTypeDefinition<TaxBillData> = {
  id: "tax_bill",
  label: "שובר ארנונה",
  schema: taxBillSchema,
  buildPrompt: buildTaxBillPrompt,
  postProcess,
};

registerDocumentType(taxBillDefinition);
