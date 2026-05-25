'use client';

import { Box, Button, Container, Stack, Typography } from '@mui/material';
import Link from 'next/link';
import Image from 'next/image';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { BLOG_PATHS } from '@/lib/blog/routes';
import FooterLegalLinks from '@/components/landing/FooterLegalLinks';

const navItems = [
  { label: 'דף הבית', href: '/' },
  { label: 'המחשבון', href: '/calculator' },
  { label: 'ממליצים', href: '/testimonials' },
  { label: 'חשוב לדעת', href: BLOG_PATHS.home },
  { label: 'יצירת קשר', href: '/contact' },
];

const navLinkSx = {
  color: '#fff',
  fontSize: { xs: '14px', md: '15px' },
  fontWeight: 500,
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  transition: 'opacity 0.2s ease',
  opacity: 0.92,
  '&:hover': { opacity: 1 },
} as const;

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={(theme) => ({
        position: 'relative',
        backgroundColor: theme.palette.brand.footerBg,
        color: '#fff',
      })}
    >
      <Container
        maxWidth="lg"
        sx={{ py: { xs: 6, md: 8 }, px: { xs: 2.5, sm: 3 } }}
      >
        <Stack
          alignItems="center"
          spacing={{ xs: 3.5, md: 4.5 }}
          sx={{ textAlign: 'center' }}
        >
          {/* Logo */}
          <Box
            component={Link}
            href="/"
            aria-label="מחשבון הארנונה - דף הבית"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              textDecoration: 'none',
            }}
          >
            <Image
              src="/images/logo/whiteLogo.svg"
              alt="מחשבון הארנונה"
              width={220}
              height={50}
              priority={false}
              style={{ height: 'auto', width: 'min(220px, 60vw)' }}
            />
          </Box>

          {/* Nav links */}
          <Box
            component="nav"
            aria-label="ניווט פוטר"
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              alignItems: 'center',
              rowGap: 1.5,
              columnGap: { xs: 3, sm: 4, md: 6 },
            }}
          >
            {navItems.map((item) =>
              item.href.startsWith('/') && !item.href.includes('#') ? (
                <Typography
                  key={item.label}
                  component={Link}
                  href={item.href}
                  sx={navLinkSx}
                >
                  {item.label}
                </Typography>
              ) : (
                <Typography
                  key={item.label}
                  component="a"
                  href={item.href}
                  sx={navLinkSx}
                >
                  {item.label}
                </Typography>
              ),
            )}
          </Box>

          {/* CTA */}
          <Button
            component={Link}
            href="/calculator"
            variant="contained"
            endIcon={<ChevronLeftIcon />}
            sx={(theme) => ({
              bgcolor: theme.palette.brand.blue,
              color: '#fff',
              borderRadius: '999px',
              px: 3,
              py: 1.2,
              fontSize: '15px',
              fontWeight: 700,
              boxShadow: '0px 8px 20px rgba(0,0,0,0.28)',
              '& .MuiButton-endIcon': { ml: 0.5, mr: -0.5 },
              '&:hover': {
                bgcolor: theme.palette.brand.blueDark,
                boxShadow: '0px 10px 24px rgba(0,0,0,0.38)',
              },
            })}
          >
            חישוב הארנונה
          </Button>
        </Stack>
      </Container>

      {/* Bottom bar */}
      <Box
        sx={{
          borderTop: '1px solid rgba(255,255,255,0.14)',
          py: { xs: 2, md: 2.25 },
        }}
      >
        <Container maxWidth="lg" sx={{ px: { xs: 2.5, sm: 3 } }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexDirection: { xs: 'column', md: 'row' },
              gap: { xs: 1.25, md: 1 },
              textAlign: { xs: 'center', md: 'inherit' },
            }}
          >
            <FooterLegalLinks />
            <Typography
              sx={{
                fontSize: { xs: '12px', sm: '13px' },
                color: 'rgba(255,255,255,0.7)',
              }}
            >
              © 2026 מחשבון הארנונה. כל הזכויות שמורות.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
