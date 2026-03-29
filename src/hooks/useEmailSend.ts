'use client';

import { useCallback } from 'react';

export type EmailType = 'results' | 'appeal' | 'appeal_pdf' | 'invoice';

interface SendEmailParams {
  type: EmailType;
  to: string;
  payload: Record<string, unknown>;
}

interface SendEmailResult {
  success: boolean;
  error?: string;
}

export function useEmailSend() {
  const sendEmail = useCallback(async (params: SendEmailParams): Promise<SendEmailResult> => {
    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || 'שליחת המייל נכשלה' };
      }

      return { success: true };
    } catch {
      return { success: false, error: 'שגיאה בתקשורת עם השרת' };
    }
  }, []);

  return { sendEmail };
}
