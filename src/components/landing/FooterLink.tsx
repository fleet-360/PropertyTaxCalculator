'use client';

import Box from '@mui/material/Box';
import Link from 'next/link';
import type { ReactNode } from 'react';
import type { SxProps, Theme } from '@mui/material/styles';

interface FooterLinkProps {
  href: string;
  children: ReactNode;
  sx?: SxProps<Theme>;
}

export default function FooterLink({ href, children, sx }: FooterLinkProps) {
  const isInternal = href.startsWith('/');

  if (isInternal) {
    return (
      <Box component={Link} href={href} sx={sx}>
        {children}
      </Box>
    );
  }

  return (
    <Box component="a" href={href} sx={sx}>
      {children}
    </Box>
  );
}
