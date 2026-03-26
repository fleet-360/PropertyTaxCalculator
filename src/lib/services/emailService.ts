import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import {
  buildResultsEmailHtml,
  buildAppealEmailHtml,
  buildInvoiceEmailHtml,
  type ResultsEmailParams,
  type AppealEmailParams,
  type InvoiceEmailParams,
} from './emailTemplates';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface EmailOptions {
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
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT) || 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      throw new Error(
        'Missing SMTP configuration. Set SMTP_HOST, SMTP_USER, and SMTP_PASS in .env.local',
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
    const from = process.env.SMTP_FROM || 'מחשבון ארנונה <noreply@example.co.il>';

    const info = await transporter.sendMail({
      from,
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
  return sendEmail({
    to: params.to,
    subject: 'תוצאות מחשבון הארנונה',
    html: buildResultsEmailHtml(params),
  });
}

export async function sendAppealEmail(params: AppealEmailParams): Promise<SendEmailResult> {
  return sendEmail({
    to: params.to,
    subject: 'אישור הגשת השגה — מחשבון הארנונה',
    html: buildAppealEmailHtml(params),
  });
}

export async function sendInvoiceEmail(params: InvoiceEmailParams): Promise<SendEmailResult> {
  return sendEmail({
    to: params.to,
    subject: `חשבונית — מחשבון הארנונה`,
    html: buildInvoiceEmailHtml(params),
  });
}
