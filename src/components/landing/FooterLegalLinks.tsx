'use client';

import Link from 'next/link';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

const linkSx = {
  color: 'inherit',
  textDecoration: 'none',
  cursor: 'pointer',
  '&:hover': { textDecoration: 'underline' },
} as const;

export default function FooterLegalLinks() {
  return (
    <Typography
      sx={{
        fontSize: { xs: '12px', sm: '13px' },
        color: 'rgba(255,255,255,0.72)',
        lineHeight: 1.5,
        wordBreak: 'break-word',
        maxWidth: '100%',
      }}
    >
      <Box component={Link} href="/privacy-policy" sx={linkSx}>
        מדיניות פרטיות
      </Box>
      &nbsp;&nbsp;|&nbsp;&nbsp;
      <Box component={Link} href="/terms" sx={linkSx}>
        תנאי שימוש
      </Box>
      &nbsp;&nbsp;|&nbsp;&nbsp;נגישות
    </Typography>
  );
}
