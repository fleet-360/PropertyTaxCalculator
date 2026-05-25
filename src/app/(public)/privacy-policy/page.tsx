import type { Metadata } from 'next';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import PageHero from '@/components/common/PageHero';
import PageBreadcrumbs from '@/components/common/PageBreadcrumbs';
import LegalSections from '@/components/common/LegalSections';
import { privacySections } from '@/lib/legal/content';

export const metadata: Metadata = {
  title: 'מדיניות פרטיות | מחשבון ארנונה',
  description:
    'מדיניות הפרטיות של מחשבון הארנונה — איך אנחנו אוספים, משתמשים ומגנים על המידע האישי שלך.',
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <PageHero title="מדיניות פרטיות" />
      <PageBreadcrumbs
        items={[
          { label: 'בית', href: '/' },
          { label: 'מדיניות פרטיות' },
        ]}
      />

      <Container maxWidth="lg" sx={{ pb: { xs: 6, md: 10 }, pt: { xs: 1, md: 2 } }}>
        <Box sx={{ maxWidth: 980, mx: 'auto' }}>
          <LegalSections sections={privacySections} />
        </Box>
      </Container>
    </>
  );
}
