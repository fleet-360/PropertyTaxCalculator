import type { Metadata } from 'next';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import PageHero from '@/components/common/PageHero';
import PageBreadcrumbs from '@/components/common/PageBreadcrumbs';
import LegalSections from '@/components/common/LegalSections';
import { refundsSections } from '@/lib/legal/content';

export const metadata: Metadata = {
  title: 'מדיניות החזרים וביטולים | מחשבון ארנונה',
  description:
    'מדיניות החזרים וביטולים של מחשבון הארנונה — אופן הטיפול בבקשות לביטול עסקה, החזר כספי או שירות חלופי.',
};

export default function RefundPolicyPage() {
  return (
    <>
      <PageHero title="מדיניות החזרים וביטולים" />
      <PageBreadcrumbs
        items={[
          { label: 'בית', href: '/' },
          { label: 'מדיניות החזרים וביטולים' },
        ]}
      />

      <Container maxWidth="lg" sx={{ pb: { xs: 6, md: 10 }, pt: { xs: 1, md: 2 } }}>
        <Box sx={{ maxWidth: 980, mx: 'auto' }}>
          <LegalSections sections={refundsSections} />
        </Box>
      </Container>
    </>
  );
}
