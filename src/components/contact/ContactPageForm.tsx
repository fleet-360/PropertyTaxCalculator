'use client';

import ContactForm, {
  type ContactFormSubmitPayload,
  type ContactFormWithMessage,
  type ContactFormProps,
} from '@/components/contact/ContactForm';

function isContactWithMessage(data: ContactFormSubmitPayload): data is ContactFormWithMessage {
  return 'message' in data && typeof data.message === 'string';
}

interface ContactPageFormProps {
  showMessage?: boolean;
  variant?: ContactFormProps['variant'];
  source?: string;
}

export default function ContactPageForm({
  showMessage = false,
  variant = 'embedded',
  source = 'contact_form',
}: ContactPageFormProps) {
  const handleSubmit = async (data: ContactFormSubmitPayload) => {
    const message = isContactWithMessage(data) ? data.message : undefined;

    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        ...(message ? { message } : {}),
        source,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(
        typeof body.error === 'string' ? body.error : 'שגיאה בשליחת הטופס',
      );
    }
  };

  return (
    <ContactForm
      onSubmit={handleSubmit}
      showMessage={showMessage}
      variant={variant}
    />
  );
}
