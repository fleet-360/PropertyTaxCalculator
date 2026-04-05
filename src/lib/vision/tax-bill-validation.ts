/** Shape expected from the model under `documentValidation` on the parsed root. */
export interface TaxBillDocumentValidationShape {
  isPropertyTaxBill: boolean;
  municipalityNameOnDocument: string | null;
  cityMatchesSelection: boolean | null;
}

/**
 * Validates tax-bill root metadata from Gemini before field extraction.
 * `promptOptions.expectedCityName` triggers a city match check when non-empty.
 */
export function evaluateTaxBillDocumentValidation(
  raw: Record<string, unknown>,
  promptOptions?: Record<string, unknown>,
): { ok: boolean; warnings: string[] } {
  const expectedCity =
    typeof promptOptions?.expectedCityName === 'string' ? promptOptions.expectedCityName.trim() : '';

  const dv = raw.documentValidation;
  if (!dv || typeof dv !== 'object' || Array.isArray(dv)) {
    return { ok: false, warnings: ['לא התקבלה בדיקת מסמך תקינה מהמודל'] };
  }

  const o = dv as Record<string, unknown>;

  if (typeof o.isPropertyTaxBill !== 'boolean') {
    return { ok: false, warnings: ['לא התקבלה בדיקת מסמך תקינה מהמודל'] };
  }

  if (o.municipalityNameOnDocument !== null && typeof o.municipalityNameOnDocument !== 'string') {
    return { ok: false, warnings: ['לא התקבלה בדיקת מסמך תקינה מהמודל'] };
  }

  if (o.cityMatchesSelection !== null && typeof o.cityMatchesSelection !== 'boolean') {
    return { ok: false, warnings: ['לא התקבלה בדיקת מסמך תקינה מהמודל'] };
  }

  if (!o.isPropertyTaxBill) {
    return { ok: false, warnings: ['המסמך אינו שובר או דוח ארנונה ישראלי'] };
  }

  if (expectedCity) {
    if (o.cityMatchesSelection !== true) {
      const muni =
        typeof o.municipalityNameOnDocument === 'string' ? o.municipalityNameOnDocument.trim() : '';
      const detail = muni
        ? `העיר שנבחרה: ${expectedCity}. הרשות במסמך: ${muni}.`
        : `העיר שנבחרה: ${expectedCity}.`;
      return {
        ok: false,
        warnings: [`שובר הארנונה אינו של הרשות שנבחרה. ${detail}`],
      };
    }
  }

  return { ok: true, warnings: [] };
}

/** Prepended to the DB/hardcoded tax bill field-extraction prompt. */
export function buildTaxBillValidationAppendix(expectedCityName: string | undefined): string {
  const cityBlock = expectedCityName
    ? `המשתמש בחר בעיר: "${expectedCityName}".
חובה למלא cityMatchesSelection בערך true או false (לא null): true אם שם הרשות במסמך מתאים לעיר שנבחרה (התעלם מניסוחים שונים מעט, למשל "עיריית תל אביב" מול "תל אביב-יפו"), false אם הרשות שונה.`
    : `לא צוינה עיר צפויה במערכת — השדה cityMatchesSelection חייב להיות null (לא true/false).`;

  return `=== בדיקת מסמך (חובה; לפני חילוץ השדות) ===
נתח את התמונה/מסמך והחזר JSON בשורש עם שני מפתחות בלבד ברמה העליונה: "documentValidation" ו-"fields".

מבנה documentValidation:
{
  "isPropertyTaxBill": true או false,
  "municipalityNameOnDocument": "שם הרשות המקומית כפי שמופיע במסמך" או null,
  "cityMatchesSelection": true, false, או null
}

כללים:
• isPropertyTaxBill — true רק אם המסמך הוא שובר/דוח/חשבון ארנונה של רשות מקומית בישראל. false אם זה מסמך אחר (מים, חשמל, ארנית, מס הכנסה, ביטוח, וכו').
• municipalityNameOnDocument — שם הרשות שחייבת בארנונה (למשל "חיפה", "תל אביב-יפו") אם מזוהה; אחרת null.
• ${cityBlock}

אחרי מילוי documentValidation, מלא את "fields" לפי ההנחיות הבאות.

`;

}
