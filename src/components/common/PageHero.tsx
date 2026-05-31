'use client';

import { Box, Container, Typography } from '@mui/material';
import heroBg from '@/assets/heroBackgroundcolor.jpg';

interface PageHeroProps {
  title: string;
  subtitle?: string;
}

/**
 * Compact page hero used on inner pages (privacy, terms, contact, blog, testimonials, ...).
 * Same dark navy gradient background as the landing hero, but shorter.
 */
export default function PageHero({ title, subtitle }: PageHeroProps) {
  return (
    <Box
      component="section"
      aria-label={title}
      sx={{
        position: 'relative',
        backgroundImage: `url(${heroBg.src})`,
        backgroundSize: 'cover',
        backgroundPosition: 'right center',
        backgroundRepeat: 'no-repeat',
        py: { xs: 5, md: 7 },
        textAlign: 'center',
        color: '#fff',
      }}
    >
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
        <Typography
          component="h1"
          sx={{
            fontFamily: 'var(--font-noto-sans-hebrew), "Noto Sans Hebrew", sans-serif',
            fontWeight: 700,
            fontSize: { xs: '28px', sm: '34px', md: '40px' },
            letterSpacing: '-0.5px',
            color: '#fff',
            lineHeight: 1.2,
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            sx={{
              mt: 1.5,
              fontSize: { xs: '14px', md: '16px' },
              color: '#fff',
              opacity: 0.9,
              maxWidth: 720,
              mx: 'auto',
              lineHeight: 1.6,
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Container>
    </Box>
  );
}
