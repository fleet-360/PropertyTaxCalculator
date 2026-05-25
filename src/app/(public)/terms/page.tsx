import type { Metadata } from 'next';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import PageHero from '@/components/common/PageHero';
import PageBreadcrumbs from '@/components/common/PageBreadcrumbs';
import LegalSections from '@/components/common/LegalSections';
import { termsSections } from '@/lib/legal/content';

export const metadata: Metadata = {
  title: 'תקנון ותנאי שימוש | מחשבון ארנונה',
  description:
    'תקנון ותנאי השימוש של מחשבון הארנונה. השימוש באתר כפוף לתנאים אלה.',
};

export default function TermsPage() {
  return (
    <>
      <PageHero title="תקנון ותנאי שימוש" />
      <PageBreadcrumbs
        items={[
          { label: 'בית', href: '/' },
          { label: 'תקנון ותנאי שימוש' },
        ]}
      />

      <Container maxWidth="lg" sx={{ pb: { xs: 6, md: 10 }, pt: { xs: 1, md: 2 } }}>
        <Box sx={{ maxWidth: 980, mx: 'auto' }}>
          <LegalSections sections={termsSections} />
        </Box>
      </Container>
    </>
  );
}
