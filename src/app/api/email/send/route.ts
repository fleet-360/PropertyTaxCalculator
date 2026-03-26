import { NextRequest, NextResponse } from 'next/server';
import {
  sendResultsEmail,
  sendAppealEmail,
  sendInvoiceEmail,
} from '@/lib/services/emailService';

/* ------------------------------------------------------------------ */
/*  Validation helpers                                                 */
/* ------------------------------------------------------------------ */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email: unknown): email is string {
  return typeof email === 'string' && EMAIL_RE.test(email);
}

function requiredString(val: unknown): val is string {
  return typeof val === 'string' && val.length > 0;
}

function requiredNumber(val: unknown): val is number {
  return typeof val === 'number' && !Number.isNaN(val);
}

/* ------------------------------------------------------------------ */
/*  POST /api/email/send                                               */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, to, payload } = body;

    // Common validation
    if (!validateEmail(to)) {
      return NextResponse.json({ error: 'כתובת מייל לא תקינה' }, { status: 400 });
    }

    if (!type || !payload) {
      return NextResponse.json({ error: 'חסרים שדות חובה: type, payload' }, { status: 400 });
    }

    // Dispatch by type
    switch (type) {
      case 'results': {
        const { fullName, cityName, reported, calculated, biMonthlySavings, annualSavings, tenYearSavings } = payload;
        if (!requiredString(fullName) || !requiredString(cityName)) {
          return NextResponse.json({ error: 'חסרים שדות חובה ב-payload' }, { status: 400 });
        }
        if (!requiredNumber(reported) || !requiredNumber(calculated)) {
          return NextResponse.json({ error: 'חסרים נתונים מספריים ב-payload' }, { status: 400 });
        }
        const result = await sendResultsEmail({
          to,
          fullName,
          cityName,
          reported,
          calculated,
          biMonthlySavings: biMonthlySavings ?? 0,
          annualSavings: annualSavings ?? 0,
          tenYearSavings: tenYearSavings ?? 0,
        });
        if (!result.success) {
          return NextResponse.json({ error: result.error ?? 'שליחת המייל נכשלה' }, { status: 500 });
        }
        return NextResponse.json({ success: true, messageId: result.messageId });
      }

      case 'appeal': {
        const { fullName, cityName, reported, calculated, annualSavings } = payload;
        if (!requiredString(fullName) || !requiredString(cityName)) {
          return NextResponse.json({ error: 'חסרים שדות חובה ב-payload' }, { status: 400 });
        }
        const result = await sendAppealEmail({
          to,
          fullName,
          cityName,
          reported: reported ?? 0,
          calculated: calculated ?? 0,
          annualSavings: annualSavings ?? 0,
        });
        if (!result.success) {
          return NextResponse.json({ error: result.error ?? 'שליחת המייל נכשלה' }, { status: 500 });
        }
        return NextResponse.json({ success: true, messageId: result.messageId });
      }

      case 'invoice': {
        const { fullName, itemDescription, amountNis, date } = payload;
        if (!requiredString(fullName) || !requiredString(itemDescription)) {
          return NextResponse.json({ error: 'חסרים שדות חובה ב-payload' }, { status: 400 });
        }
        if (!requiredNumber(amountNis)) {
          return NextResponse.json({ error: 'חסר סכום ב-payload' }, { status: 400 });
        }
        const result = await sendInvoiceEmail({
          to,
          fullName,
          itemDescription,
          amountNis,
          date: date || new Date().toISOString(),
        });
        if (!result.success) {
          return NextResponse.json({ error: result.error ?? 'שליחת המייל נכשלה' }, { status: 500 });
        }
        return NextResponse.json({ success: true, messageId: result.messageId });
      }

      default:
        return NextResponse.json({ error: `סוג מייל לא מוכר: ${type}` }, { status: 400 });
    }
  } catch (err) {
    console.error('[api/email/send] error:', err);
    return NextResponse.json({ error: 'שגיאה פנימית בשרת' }, { status: 500 });
  }
}
