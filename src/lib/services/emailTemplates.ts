/* ------------------------------------------------------------------ */
/*  Email template builder functions — Hebrew RTL HTML emails           */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Shared types                                                       */
/* ------------------------------------------------------------------ */

export interface ResultsEmailParams {
  to: string;
  fullName: string;
  cityName: string;
  reported: number;
  calculated: number;
  biMonthlySavings: number;
  annualSavings: number;
  tenYearSavings: number;
}

export interface AppealEmailParams {
  to: string;
  fullName: string;
  cityName: string;
  reported: number;
  calculated: number;
  annualSavings: number;
}

/** Appeal PDF email — extended with optional subject info for appendices list. */
export interface AppealPdfEmailParams extends AppealEmailParams {
  /** e.g. 'area_correction' | 'exemption' */
  subjectType?: string;
  /** Human-readable exemption/subject description (Hebrew). */
  exemptionDescription?: string;
}

export interface InvoiceEmailParams {
  to: string;
  fullName: string;
  itemDescription: string;
  amountNis: number;
  date: string; // ISO date string
}

/* ------------------------------------------------------------------ */
/*  Theme colors (hardcoded — email clients require inline styles)      */
/* ------------------------------------------------------------------ */

const COLORS = {
  primary: '#1a1a1a',
  primaryDark: '#000000',
  secondary: '#F28B00',
  success: '#2e7d32',
  textPrimary: '#1a1a2e',
  textSecondary: '#555555',
  background: '#f5f5f5',
  white: '#ffffff',
  border: '#e0e0e0',
} as const;

/* ------------------------------------------------------------------ */
/*  Base wrapper                                                       */
/* ------------------------------------------------------------------ */

function buildBaseWrapper(content: string, title: string): string {
  return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:${COLORS.background};font-family:'Heebo','Arial',sans-serif;direction:rtl;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLORS.background};padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:${COLORS.white};border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background-color:${COLORS.primary};padding:24px 32px;text-align:center;">
              <h1 style="margin:0;color:${COLORS.white};font-size:22px;font-weight:600;">מחשבון הארנונה</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;border-top:1px solid ${COLORS.border};text-align:center;">
              <p style="margin:0;font-size:12px;color:${COLORS.textSecondary};">
                הודעה זו נשלחה אוטומטית ממחשבון הארנונה. אין להשיב למייל זה.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/* ------------------------------------------------------------------ */
/*  Helper: format number for Hebrew display                            */
/* ------------------------------------------------------------------ */

function formatNis(n: number): string {
  return `${n.toLocaleString('he-IL')} ₪`;
}

/* ------------------------------------------------------------------ */
/*  Results email                                                      */
/* ------------------------------------------------------------------ */

export function buildResultsEmailHtml(params: ResultsEmailParams): string {
  const rows = [
    { label: 'סכום לחודשיים (מדווח)', value: formatNis(params.reported) },
    { label: 'סכום לחודשיים (לפי המחשבון)', value: formatNis(params.calculated) },
    { label: 'הנחה לחודשיים', value: formatNis(params.biMonthlySavings) },
    { label: 'חיסכון שנתי', value: formatNis(params.annualSavings) },
    { label: 'חיסכון ל-10 שנים', value: formatNis(params.tenYearSavings) },
  ];

  const tableRows = rows
    .map(
      (r) => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid ${COLORS.border};font-weight:600;color:${COLORS.textPrimary};text-align:right;">${r.label}</td>
      <td style="padding:12px 16px;border-bottom:1px solid ${COLORS.border};color:${COLORS.textPrimary};text-align:left;">${r.value}</td>
    </tr>`,
    )
    .join('');

  const content = `
    <p style="margin:0 0 8px;font-size:16px;color:${COLORS.textPrimary};">שלום ${params.fullName},</p>
    <p style="margin:0 0 24px;font-size:15px;color:${COLORS.textSecondary};">
      להלן תוצאות המחשבון עבור הנכס ב${params.cityName}:
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${COLORS.border};border-radius:6px;overflow:hidden;margin-bottom:24px;">
      ${tableRows}
    </table>
    ${
      params.annualSavings > 0
        ? `<p style="margin:0;padding:12px 16px;background-color:#e8f5e9;border-radius:6px;color:${COLORS.success};font-weight:600;text-align:center;">
        ייתכן שאת/ה משלם/ת יותר מדי! חיסכון שנתי אפשרי: ${formatNis(params.annualSavings)}
      </p>`
        : ''
    }`;

  return buildBaseWrapper(content, 'תוצאות מחשבון הארנונה');
}

/* ------------------------------------------------------------------ */
/*  Appeal email                                                       */
/* ------------------------------------------------------------------ */

export function buildAppealEmailHtml(params: AppealEmailParams): string {
  const content = `
    <p style="margin:0 0 8px;font-size:16px;color:${COLORS.textPrimary};">שלום ${params.fullName},</p>
    <p style="margin:0 0 24px;font-size:15px;color:${COLORS.textSecondary};">
      ההשגה שלך עבור הנכס ב${params.cityName} הוכנה בהצלחה.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${COLORS.border};border-radius:6px;overflow:hidden;margin-bottom:24px;">
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid ${COLORS.border};font-weight:600;text-align:right;">סכום מדווח לחודשיים</td>
        <td style="padding:12px 16px;border-bottom:1px solid ${COLORS.border};text-align:left;">${formatNis(params.reported)}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid ${COLORS.border};font-weight:600;text-align:right;">סכום לפי המחשבון</td>
        <td style="padding:12px 16px;border-bottom:1px solid ${COLORS.border};text-align:left;">${formatNis(params.calculated)}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;font-weight:600;text-align:right;">חיסכון שנתי צפוי</td>
        <td style="padding:12px 16px;text-align:left;color:${COLORS.success};font-weight:600;">${formatNis(params.annualSavings)}</td>
      </tr>
    </table>
    <p style="margin:0;font-size:14px;color:${COLORS.textSecondary};">
      ההשגה תישלח לעירייה בהתאם לנתונים שהוזנו. לשאלות או בירורים ניתן ליצור איתנו קשר.
    </p>`;

  return buildBaseWrapper(content, 'אישור הגשת השגה');
}

/* ------------------------------------------------------------------ */
/*  Appendices builder for appeal PDF email                            */
/* ------------------------------------------------------------------ */

function buildAppealAppendicesList(subjectType?: string): string[] {
  const items: string[] = [
    'צילום תעודת זהות / תעודת רישום חברה',
    'דו"ח חיוב ארנונה (שובר תשלום עדכני)',
  ];

  if (subjectType === 'area_correction') {
    items.push('תשריט / מפת מדידה של הנכס (אם קיימים)');
    items.push('חוזה רכישה או שכירות המציין את שטח הנכס');
  } else {
    // exemption or general
    items.push('מסמכים המעידים על הזכאות לפטור / הנחה (אישורים רלוונטיים)');
    items.push('חוזה רכישה או שכירות (אם רלוונטי)');
  }

  items.push('כל מסמך נוסף שיש בו כדי לתמוך בבקשה');

  return items;
}

export function buildAppealPdfEmailHtml(params: AppealPdfEmailParams): string {
  const appendices = buildAppealAppendicesList(params.subjectType);

  const appendicesRows = appendices
    .map(
      (item, i) => `
    <tr>
      <td style="padding:6px 12px;border-bottom:1px solid ${COLORS.border};color:${COLORS.textPrimary};font-size:14px;text-align:right;vertical-align:top;width:28px;font-weight:600;">${i + 1}.</td>
      <td style="padding:6px 12px;border-bottom:1px solid ${COLORS.border};color:${COLORS.textPrimary};font-size:14px;text-align:right;">${item}</td>
    </tr>`,
    )
    .join('');

  const content = `
    <p style="margin:0 0 8px;font-size:16px;color:${COLORS.textPrimary};">שלום ${params.fullName},</p>
    <p style="margin:0 0 16px;font-size:15px;color:${COLORS.textSecondary};">
      מצורף מכתב ההשגה שלך בנוגע לנכס ב${params.cityName}, כולל חתימתך הדיגיטלית בקובץ PDF.
    </p>

    <!-- Appendices list -->
    <div style="margin:20px 0;padding:16px 20px;background-color:#fafafa;border-radius:6px;border:1px solid ${COLORS.border};">
      <p style="margin:0 0 10px;font-size:15px;font-weight:600;color:${COLORS.textPrimary};">
        📎 נספחים שיש לצרף למכתב ההשגה:
      </p>
      <p style="margin:0 0 12px;font-size:13px;color:${COLORS.textSecondary};">
        לצורך הגשה תקינה, יש לצרף את המסמכים הבאים יחד עם מכתב ההשגה החתום:
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:0;">
        ${appendicesRows}
      </table>
    </div>

    <!-- Submission instructions -->
    <div style="margin:20px 0;padding:16px 20px;background-color:#f0f7ff;border-radius:6px;border:1px solid #c8ddf5;">
      <p style="margin:0 0 10px;font-size:15px;font-weight:600;color:${COLORS.textPrimary};">
        📋 הנחיות להגשת ההשגה:
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:5px 12px;color:${COLORS.textPrimary};font-size:14px;text-align:right;vertical-align:top;width:28px;font-weight:600;">1.</td>
          <td style="padding:5px 12px;color:${COLORS.textPrimary};font-size:14px;text-align:right;">
            <strong>הדפסת המכתב</strong> — הדפיסו את קובץ ה-PDF המצורף (מכתב ההשגה החתום).
          </td>
        </tr>
        <tr>
          <td style="padding:5px 12px;color:${COLORS.textPrimary};font-size:14px;text-align:right;vertical-align:top;width:28px;font-weight:600;">2.</td>
          <td style="padding:5px 12px;color:${COLORS.textPrimary};font-size:14px;text-align:right;">
            <strong>צירוף הנספחים</strong> — צרפו את כל המסמכים הנדרשים (ראו רשימה למעלה).
          </td>
        </tr>
        <tr>
          <td style="padding:5px 12px;color:${COLORS.textPrimary};font-size:14px;text-align:right;vertical-align:top;width:28px;font-weight:600;">3.</td>
          <td style="padding:5px 12px;color:${COLORS.textPrimary};font-size:14px;text-align:right;">
            <strong>הגשה לעירייה</strong> — הגישו את ההשגה באחת הדרכים הבאות:
            <br />• <strong>בדואר רשום</strong> — למחלקת הארנונה בעיריית ${params.cityName} (מומלץ לשמור אישור משלוח).
            <br />• <strong>בפקס</strong> — למספר הפקס של מחלקת הארנונה בעירייה (ניתן לאתר באתר העירייה).
            <br />• <strong>במסירה ידנית</strong> — במשרדי מחלקת הארנונה. בקשו חותמת "נתקבל" על עותק למעקב.
          </td>
        </tr>
        <tr>
          <td style="padding:5px 12px;color:${COLORS.textPrimary};font-size:14px;text-align:right;vertical-align:top;width:28px;font-weight:600;">4.</td>
          <td style="padding:5px 12px;color:${COLORS.textPrimary};font-size:14px;text-align:right;">
            <strong>מעקב</strong> — העירייה מחויבת להשיב תוך 60 יום ממועד קבלת ההשגה. שמרו עותק של כל המסמכים שהגשתם.
          </td>
        </tr>
      </table>
    </div>

    <p style="margin:16px 0 0;font-size:13px;color:${COLORS.textSecondary};">
      💡 <strong>טיפ:</strong> מומלץ לשלוח את ההשגה בדואר רשום עם אישור מסירה — כך תוכלו להוכיח שההשגה הוגשה במועד.
    </p>
    <p style="margin:8px 0 0;font-size:13px;color:${COLORS.textSecondary};">
      לשאלות נוספות ניתן ליצור איתנו קשר.
    </p>`;

  return buildBaseWrapper(content, 'מכתב השגה חתום — מחשבון הארנונה');
}

/* ------------------------------------------------------------------ */
/*  Invoice email                                                      */
/* ------------------------------------------------------------------ */

export function buildInvoiceEmailHtml(params: InvoiceEmailParams): string {
  const dateStr = new Date(params.date).toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const content = `
    <p style="margin:0 0 8px;font-size:16px;color:${COLORS.textPrimary};">שלום ${params.fullName},</p>
    <p style="margin:0 0 24px;font-size:15px;color:${COLORS.textSecondary};">
      להלן אישור התשלום שלך:
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${COLORS.border};border-radius:6px;overflow:hidden;margin-bottom:24px;">
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid ${COLORS.border};font-weight:600;text-align:right;">תיאור</td>
        <td style="padding:12px 16px;border-bottom:1px solid ${COLORS.border};text-align:left;">${params.itemDescription}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid ${COLORS.border};font-weight:600;text-align:right;">סכום</td>
        <td style="padding:12px 16px;border-bottom:1px solid ${COLORS.border};text-align:left;font-weight:600;color:${COLORS.primary};">${formatNis(params.amountNis)}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid ${COLORS.border};font-weight:600;text-align:right;">תאריך</td>
        <td style="padding:12px 16px;border-bottom:1px solid ${COLORS.border};text-align:left;">${dateStr}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;font-weight:600;text-align:right;">שם הלקוח</td>
        <td style="padding:12px 16px;text-align:left;">${params.fullName}</td>
      </tr>
    </table>
    <p style="margin:0;font-size:14px;color:${COLORS.textSecondary};">
      תודה על השימוש במחשבון הארנונה. שמרו על אישור זה לצורכי רישום.
    </p>`;

  return buildBaseWrapper(content, 'חשבונית — מחשבון הארנונה');
}
