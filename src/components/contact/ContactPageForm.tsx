'use client';

import ContactForm, {
  type ContactFormSubmitPayload,
  type ContactFormWithMessage,
} from '@/components/contact/ContactForm';

function isContactWithMessage(data: ContactFormSubmitPayload): data is ContactFormWithMessage {
  return 'message' in data && typeof data.message === 'string';
}

export default function ContactPageForm() {
  const handleSubmit = async (data: ContactFormSubmitPayload) => {
    if (!isContactWithMessage(data)) {
      throw new Error('חסרה הודעה');
    }

    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        message: data.message,
        source: 'contact_form',
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(
        typeof body.error === 'string' ? body.error : 'שגיאה בשליחת הטופס',
      );
    }
  };

  return <ContactForm onSubmit={handleSubmit} />;
}
