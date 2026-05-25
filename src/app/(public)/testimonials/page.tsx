import type { Metadata } from 'next';
import PageHero from '@/components/common/PageHero';
import PageBreadcrumbs from '@/components/common/PageBreadcrumbs';
import TestimonialsPageContent from '@/components/landing/TestimonialsPageContent';

export const metadata: Metadata = {
  title: 'ממליצים | מחשבון ארנונה',
  description:
    'אלפי בעלי נכסים בכל הארץ כבר חסכו זמן וכסף באמצעות מחשבון הארנונה — אנשים מספרים איך זה היה.',
};

export default function TestimonialsPage() {
  return (
    <>
      <PageHero title="ממליצים" />
      <PageBreadcrumbs
        items={[
          { label: 'בית', href: '/' },
          { label: 'ממליצים' },
        ]}
      />

      <TestimonialsPageContent />
    </>
  );
}
