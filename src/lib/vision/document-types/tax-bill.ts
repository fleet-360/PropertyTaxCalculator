import { z } from 'zod';
import { registerDocumentType } from './registry';
import type { DocumentTypeDefinition } from '../types';

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
  coveredBalconyArea: z.number().optional(),
  storageArea: z.number().optional(),
  parkingArea: z.number().optional(),
  // Payment
  bimonthlyPayment: z.number().optional(),
  annualPayment: z.number().optional(),
  paymentPeriod: z.string().optional(),
  ratePerSqm: z.number().optional(),
});

export type TaxBillData = z.infer<typeof taxBillSchema>;

// ── Hebrew extraction prompt ────────────────────────────────────────

function buildTaxBillPrompt(): string {
  return `אתה מערכת OCR מומחית לקריאת שוברי ארנונה ישראליים.

נתח את התמונה/מסמך המצורף של שובר ארנונה וחלץ את כל השדות הבאים.
עבור כל שדה, ציין את הערך שחולץ, רמת ביטחון (high/medium/low), והטקסט המקורי שקראת מהמסמך.

החזר תשובה בפורמט JSON בלבד, ללא טקסט נוסף, במבנה הבא:
{
  "fields": {
    "fullName": { "value": "שם מלא", "confidence": "high", "rawText": "..." },
    "idNumber": { "value": "123456789", "confidence": "high", "rawText": "..." },
    "propertyNumber": { "value": "מספר נכס", "confidence": "medium", "rawText": "..." },
    "propertyId": { "value": "זיהוי נכס", "confidence": "medium", "rawText": "..." },
    "address": { "value": "כתובת הנכס", "confidence": "high", "rawText": "..." },
    "block": { "value": "מספר גוש", "confidence": "medium", "rawText": "..." },
    "parcel": { "value": "מספר חלקה", "confidence": "medium", "rawText": "..." },
    "propertyPurposeDescription": { "value": "מגורים", "confidence": "high", "rawText": "..." },
    "subTypeDescription": { "value": "דירת מגורים רגילה", "confidence": "medium", "rawText": "..." },
    "classificationCode": { "value": "101", "confidence": "medium", "rawText": "..." },
    "zone": { "value": "א", "confidence": "medium", "rawText": "..." },
    "propertyArea": { "value": 85.5, "confidence": "high", "rawText": "..." },
    "coveredBalconyArea": { "value": 12, "confidence": "medium", "rawText": "..." },
    "storageArea": { "value": 5, "confidence": "medium", "rawText": "..." },
    "parkingArea": { "value": 15, "confidence": "medium", "rawText": "..." },
    "bimonthlyPayment": { "value": 850.00, "confidence": "high", "rawText": "..." },
    "annualPayment": { "value": 5100.00, "confidence": "medium", "rawText": "..." },
    "paymentPeriod": { "value": "bimonthly", "confidence": "high", "rawText": "..." },
    "ratePerSqm": { "value": 95.50, "confidence": "medium", "rawText": "..." }
  }
}

═══════════════════════════════════════════════════
הנחיות מפורטות לכל שדה:
═══════════════════════════════════════════════════

פרטי בעל הנכס:
───────────────
• fullName — שם מלא של בעל הנכס/המשלם. מופיע בד"כ בחלק העליון של השובר.
• idNumber — מספר תעודת זהות (9 ספרות). חפש גם תחת:
  - "ת.ז."
  - "תעודת זהות"
  - "מספר משלם" / "מס' משלם" — לעתים ת.ז. מופיעה כמספר המשלם
  - "מספר זיהוי"
  הסר מקפים ורווחים, החזר 9 ספרות בלבד.

פרטי זיהוי הנכס:
─────────────────
• propertyNumber — מספר הנכס ברשות המקומית
• propertyId — מזהה/זיהוי נכס (יכול להיות שונה ממספר הנכס)
• address — כתובת מלאה של הנכס (רחוב, מספר בית, דירה, עיר)
• block — מספר גוש (רישום מקרקעין)
• parcel — מספר חלקה (רישום מקרקעין)

סיווג הנכס (קריטי לחישוב תעריף):
────────────────────────────────────
• propertyPurposeDescription — תיאור ייעוד הנכס כפי שמופיע בשובר. דוגמאות:
  "מגורים", "עסקי", "משרדים", "תעשייה", "מסחר", "חקלאות", "קרקע חקלאית"
  חפש ליד "סוג נכס", "ייעוד", "סיווג", "תיאור"
• subTypeDescription — תת-סיווג מפורט יותר אם קיים. דוגמאות:
  "דירת מגורים רגילה", "וילה/קוטג'", "פנטהאוז", "חנות", "מפעל"
• classificationCode — הקוד המספרי של סיווג הנכס (2-4 ספרות). חפש ליד:
  - "קוד סיווג" / "קוד נכס" / "סיווג"
  - "סוג נכס" עם מספר (למשל "101 מגורים" → הקוד הוא "101")
  - זה הקוד החשוב ביותר — הוא מאפשר חיפוש אוטומטי של התעריף
• zone — אזור הארנונה. חפש ליד "אזור", "אזור ארנונה", "אזור מס".
  יכול להיות אות עברית (א, ב, ג...) או מספר (1, 2, 3...)

שטחים (במטרים רבועים):
──────────────────────
• propertyArea — שטח עיקרי/שטח הנכס. חפש "שטח", "שטח עיקרי", "שטח הנכס", "מ״ר"
• coveredBalconyArea — שטח מרפסת מקורה. חפש "מרפסת מקורה", "מרפסת סגורה"
• storageArea — שטח מחסן. חפש "מחסן"
• parkingArea — שטח חניה. חפש "חניה", "חניון"
  השטחים מופיעים לרוב בטבלת פירוט שטחים. כל שטח חייב להיות מספר חיובי.

תשלום:
──────
• bimonthlyPayment — סכום התשלום בפועל (הסכום שהמשלם צריך לשלם).
  חפש "סכום לתשלום", "יתרה לתשלום", "סה״כ לתשלום".
  אם מצוין שהתשלום הוא דו-חודשי — זה הערך הנכון.
  אם מצוין שהתשלום שנתי — חלק ב-6 כדי לקבל דו-חודשי.
  אם מצוין רבעוני — חלק ב-1.5.
• annualPayment — סכום שנתי כולל אם מופיע בנפרד. חפש "חיוב שנתי", "סה״כ שנתי"
• paymentPeriod — תקופת התשלום כפי שמופיעה בשובר. החזר אחד מ:
  - "monthly" — אם כתוב "חודשי"
  - "bimonthly" — אם כתוב "דו-חודשי" או "דו חודשי" (ברירת מחדל)
  - "quarterly" — אם כתוב "רבעוני"
  - "semi_annual" — אם כתוב "חצי שנתי"
  - "annual" — אם כתוב "שנתי"
  אם לא ברור, החזר "bimonthly".
• ratePerSqm — תעריף למ"ר אם מופיע. חפש "תעריף", "תעריף למ״ר", "מחיר למ״ר"

כללי:
─────
- שדות מספריים (שטחים, תשלומים, תעריף) חייבים להיות מספרים, לא מחרוזות.
- אם שדה לא מופיע במסמך, אל תכלול אותו בתשובה.
- אם אתה לא בטוח לגבי ערך, ציין confidence כ-"low".
- חפש את השדות בכל חלקי המסמך: כותרת, טבלאות, שורות פירוט, כותרות עמודות.
- שים לב ששוברי ארנונה בישראל כתובים בעברית (RTL) ועשויים לכלול מספרים בסדר שונה.`;
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

  // Ensure payments and rate are non-negative
  const paymentKeys = ['bimonthlyPayment', 'annualPayment', 'ratePerSqm'] as const;
  for (const key of paymentKeys) {
    if (result[key] !== undefined && result[key]! < 0) {
      result[key] = 0;
    }
  }

  // Normalize paymentPeriod to known values
  if (result.paymentPeriod) {
    const period = result.paymentPeriod.toLowerCase().trim();
    const validPeriods = ['monthly', 'bimonthly', 'quarterly', 'semi_annual', 'annual'];
    if (!validPeriods.includes(period)) {
      result.paymentPeriod = 'bimonthly'; // default
    } else {
      result.paymentPeriod = period;
    }
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
