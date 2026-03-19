import { z } from 'zod';
import { registerDocumentType } from './registry';
import type { DocumentTypeDefinition } from '../types';

// ── Output schema — all fields optional (partial extraction expected) ──

export const taxBillSchema = z.object({
  fullName: z.string().optional(),
  idNumber: z.string().optional(),
  propertyNumber: z.string().optional(),
  propertyId: z.string().optional(),
  address: z.string().optional(),
  block: z.string().optional(),
  parcel: z.string().optional(),
  propertyArea: z.number().optional(),
  coveredBalconyArea: z.number().optional(),
  storageArea: z.number().optional(),
  parkingArea: z.number().optional(),
  classificationCode: z.string().optional(),
  zone: z.string().optional(),
  bimonthlyPayment: z.number().optional(),
});

export type TaxBillData = z.infer<typeof taxBillSchema>;

// ── Hebrew extraction prompt ────────────────────────────────────────

function buildTaxBillPrompt(): string {
  return `אתה מערכת OCR מומחית לקריאת שוברי ארנונה ישראליים.

נתח את התמונה המצורפת של שובר ארנונה וחלץ את השדות הבאים.
עבור כל שדה, ציין את הערך שחולץ, רמת ביטחון (high/medium/low), והטקסט המקורי שקראת מהמסמך.

החזר תשובה בפורמט JSON בלבד, ללא טקסט נוסף, במבנה הבא:
{
  "fields": {
    "fullName": { "value": "שם מלא של בעל הנכס", "confidence": "high", "rawText": "הטקסט המקורי" },
    "idNumber": { "value": "מספר ת.ז. 9 ספרות", "confidence": "high", "rawText": "..." },
    "propertyNumber": { "value": "מספר נכס", "confidence": "medium", "rawText": "..." },
    "propertyId": { "value": "מזהה/זיהוי נכס", "confidence": "medium", "rawText": "..." },
    "address": { "value": "כתובת הנכס", "confidence": "high", "rawText": "..." },
    "block": { "value": "מספר גוש", "confidence": "medium", "rawText": "..." },
    "parcel": { "value": "מספר חלקה", "confidence": "medium", "rawText": "..." },
    "propertyArea": { "value": 85.5, "confidence": "high", "rawText": "..." },
    "coveredBalconyArea": { "value": 0, "confidence": "low", "rawText": "..." },
    "storageArea": { "value": 0, "confidence": "low", "rawText": "..." },
    "parkingArea": { "value": 0, "confidence": "low", "rawText": "..." },
    "classificationCode": { "value": "קוד סיווג הנכס", "confidence": "medium", "rawText": "..." },
    "zone": { "value": "אזור/אזור מס", "confidence": "medium", "rawText": "..." },
    "bimonthlyPayment": { "value": 850.00, "confidence": "high", "rawText": "..." }
  }
}

הנחיות חשובות:
- שדות מספריים (שטחים, תשלום) חייבים להיות מספרים, לא מחרוזות.
- אם שדה לא מופיע במסמך, אל תכלול אותו בתשובה.
- bimonthlyPayment הוא סכום התשלום הדו-חודשי (לא שנתי). אם מופיע רק תשלום שנתי, חלק ב-6.
- propertyArea הוא השטח העיקרי של הנכס במ"ר.
- idNumber צריך להיות בדיוק 9 ספרות. אם יש מקפים או רווחים, הסר אותם.
- אם אתה לא בטוח לגבי ערך, ציין confidence כ-"low".
- הערך של zone הוא בדרך כלל אות עברית (א, ב, ג...) או מספר.
- classificationCode הוא הקוד המספרי של סיווג הנכס (לדוגמה: 211, 301, 311).
- חפש את השדות בכל חלקי המסמך: כותרת, טבלאות, שורות פירוט.`;
}

// ── Post-processing — normalize extracted values ────────────────────

function postProcess(raw: Partial<TaxBillData>): Partial<TaxBillData> {
  const result = { ...raw };

  // Normalize ID number: strip dashes, spaces, non-digit characters
  if (result.idNumber) {
    result.idNumber = result.idNumber.replace(/[^\d]/g, '');
  }

  // Ensure areas are non-negative
  const areaKeys = ['propertyArea', 'coveredBalconyArea', 'storageArea', 'parkingArea'] as const;
  for (const key of areaKeys) {
    if (result[key] !== undefined && result[key]! < 0) {
      result[key] = 0;
    }
  }

  // Ensure bimonthly payment is non-negative
  if (result.bimonthlyPayment !== undefined && result.bimonthlyPayment < 0) {
    result.bimonthlyPayment = 0;
  }

  return result;
}

// ── Register document type ──────────────────────────────────────────

const taxBillDefinition: DocumentTypeDefinition<TaxBillData> = {
  id: 'tax_bill',
  label: 'שובר ארנונה',
  schema: taxBillSchema,
  buildPrompt: buildTaxBillPrompt,
  postProcess,
};

registerDocumentType(taxBillDefinition);
