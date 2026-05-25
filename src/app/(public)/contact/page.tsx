import type { Metadata } from 'next';
import PageHero from '@/components/common/PageHero';
import PageBreadcrumbs from '@/components/common/PageBreadcrumbs';
import ContactPageContent from '@/components/contact/ContactPageContent';

export const metadata: Metadata = {
  title: 'יצירת קשר | מחשבון ארנונה',
  description:
    'השאירו פרטים ונציג מטעמנו יחזור אליכם בהקדם. נשמח לעזור בכל שאלה בנושא ארנונה, חישוב מס, הגשת השגה ועוד.',
};

export default function ContactPage() {
  return (
    <>
      <PageHero title="יצירת קשר" />
      <PageBreadcrumbs
        items={[
          { label: 'בית', href: '/' },
          { label: 'יצירת קשר' },
        ]}
      />

      <ContactPageContent />
    </>
  );
}
