/**
 * Hook for recording consent/disclaimer acceptance.
 * Non-blocking: errors are silently ignored so the wizard continues.
 */

import type { ConsentType } from '@/lib/types/consent';

export function useConsentSubmit() {
  const submitConsent = async (
    leadId: string | null,
    phone: string,
    consentType: ConsentType,
    accepted: boolean
  ) => {
    if (!phone) return;

    try {
      await fetch('/api/consents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: leadId || undefined,
          phone,
          consentType,
          accepted,
        }),
      });
    } catch {
      // Non-blocking: continue wizard even if consent recording fails
    }
  };

  const linkConsents = async (phone: string, leadId: string) => {
    if (!phone || !leadId) return;

    try {
      await fetch('/api/consents', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, leadId }),
      });
    } catch {
      // Non-blocking
    }
  };

  return { submitConsent, linkConsents };
}
