import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import {
  buildResultsEmailHtml,
  buildAppealEmailHtml,
  buildAppealPdfEmailHtml,
  buildInvoiceEmailHtml,
  type ResultsEmailParams,
  type AppealEmailParams,
  type AppealPdfEmailParams,
  type InvoiceEmailParams,
} from './emailTemplates';
import { loadSystemConfigForPublic
 } from '../admin/loaders';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface EmailOptions {
  from: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer | string;
    contentType?: string;
  }>;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/* ------------------------------------------------------------------ */
/*  Singleton transporter (cached across Next.js hot reloads)          */
/* ------------------------------------------------------------------ */

interface TransporterCache {
  transporter: Transporter | null;
}

declare global {
  var smtpTransporter: TransporterCache | undefined;
}

function getTransporter(): Transporter {
  const cached: TransporterCache = global.smtpTransporter || { transporter: null };

  if (!global.smtpTransporter) {
    global.smtpTransporter = cached;
  }

  if (!cached.transporter) {
    const host = process.env.SMTP_HOST?.trim();
    const port = Number(process.env.SMTP_PORT) || 587;
    const user = process.env.SMTP_USER?.trim();
    const pass = process.env.SMTP_PASS?.trim();

    if (!host || !user || !pass) {
      throw new Error(
        'חסרה תצורת SMTP: יש למלא ב-.env או .env.local את SMTP_HOST, SMTP_USER ו-SMTP_PASS (כולם לא ריקים). ב-Brevo: SMTP_USER = כתובת המשתמש ב-SMTP, SMTP_PASS = מפתח SMTP.',
      );
    }

    cached.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  return cached.transporter;
}

/* ------------------------------------------------------------------ */
/*  Generic send                                                       */
/* ------------------------------------------------------------------ */

export async function sendEmail(options: EmailOptions): Promise<SendEmailResult> {
  try {
    const transporter = getTransporter();
    console.log('[sendEmail] from:', options.from, '| to:', options.to, '| subject:', options.subject);

    const info = await transporter.sendMail({
      from:options.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      attachments: options.attachments,
    });

    return { success: true, messageId: info.messageId };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown email error';
    console.error('[emailService] sendEmail failed:', message);
    return { success: false, error: message };
  }
}

/* ------------------------------------------------------------------ */
/*  Convenience methods                                                */
/* ------------------------------------------------------------------ */

export async function sendResultsEmail(params: ResultsEmailParams): Promise<SendEmailResult> {
  const settings = await loadSystemConfigForPublic
();
  const from = settings?.contactEmails?.calculator || '';
  return sendEmail({
    from,
    to: params.to,
    subject: 'תוצאות מחשבון הארנונה',
    html: buildResultsEmailHtml(params),
  });
}

export async function sendAppealEmail(params: AppealEmailParams): Promise<SendEmailResult> {
  const settings = await loadSystemConfigForPublic
();
  const from = settings?.contactEmails?.calculator || '';
  return sendEmail({
    from,
    to: params.to,
    subject: 'אישור הגשת השגה — מחשבון הארנונה',
    html: buildAppealEmailHtml(params),
  });
}

const MAX_APPEAL_PDF_BYTES = 9 * 1024 * 1024;

export async function sendAppealPdfEmail(
  params: AppealPdfEmailParams & { pdfBase64: string },
): Promise<SendEmailResult> {
  let pdfBuffer: Buffer;
  try {
    pdfBuffer = Buffer.from(params.pdfBase64, 'base64');
  } catch {
    return { success: false, error: 'קובץ PDF לא תקין' };
  }
  if (pdfBuffer.length < 200) {
    return { success: false, error: 'קובץ PDF חסר או פגום' };
  }
  if (pdfBuffer.length > MAX_APPEAL_PDF_BYTES) {
    return { success: false, error: 'קובץ PDF גדול מדי לשליחה במייל' };
  }

  const settings = await loadSystemConfigForPublic
();
  const from = settings?.contactEmails?.calculator || '';
  return sendEmail({
    from,
    to: params.to,
    subject: 'מכתב השגה חתום — מחשבון הארנונה',
    html: buildAppealPdfEmailHtml(params),
    attachments: [
      {
        filename: 'michtav-hashaga-chatum.pdf',
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });
}

export async function sendInvoiceEmail(params: InvoiceEmailParams): Promise<SendEmailResult> {
  const settings = await loadSystemConfigForPublic
();
  const from = settings?.contactEmails?.noreply || '';
  console.log('[sendInvoiceEmail] resolved from:', JSON.stringify(from), '| noreply field:', JSON.stringify(settings?.contactEmails?.noreply), '| all contactEmails:', JSON.stringify(settings?.contactEmails));
  return sendEmail({
    from,
    to: params.to,
    subject: `חשבונית — מחשבון הארנונה`,
    html: buildInvoiceEmailHtml(params),
  });
}
