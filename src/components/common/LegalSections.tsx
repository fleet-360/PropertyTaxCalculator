'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { LegalSection } from '@/lib/legal/content';

interface LegalSectionsProps {
  sections: LegalSection[];
}

/**
 * Renders a list of legal/policy sections (used by the privacy policy
 * and terms pages, and inside legal dialogs in the footer).
 */
export default function LegalSections({ sections }: LegalSectionsProps) {
  return (
    <Box>
      {sections.map((section) => (
        <Box key={section.title} sx={{ mb: { xs: 3, md: 4 } }}>
          <Typography
            component="h2"
            sx={(theme) => ({
              fontWeight: 700,
              fontSize: { xs: '17px', md: '19px' },
              color: theme.palette.brand.navyDeep,
              mb: 1,
            })}
          >
            {section.title}
          </Typography>
          <Typography
            sx={(theme) => ({
              whiteSpace: 'pre-line',
              lineHeight: 1.95,
              fontSize: { xs: '14px', md: '15px' },
              color: theme.palette.brand.textMuted,
            })}
          >
            {section.body}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
