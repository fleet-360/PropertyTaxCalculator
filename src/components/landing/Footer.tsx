'use client';
import { Box, Container, Typography, Link as MuiLink } from '@mui/material';
import Link from 'next/link';

const quickLinks = [
  { label: 'דף הבית', href: '/' },
  { label: 'מחשבון ארנונה', href: '/calculator' },
  { label: 'המלצות לקוחות', href: '#testimonials' },
  { label: 'מאמרים', href: '/blog' },
  { label: 'אודות', href: '#' },
  { label: 'צור קשר', href: '#' },
];

const articles = [
  'כיצד לחשב ארנונה נכון?',
  'הנחות ארנונה לאזרחים ותיקים',
  'זכויות שוכרים בנושא ארנונה',
  'ערעור על חיוב ארנונה',
  'ארנונה לעסקים: מה צריך לדעת?',
];

export default function Footer() {
  return (
    <Box component="footer" sx={{ bgcolor: '#fff', position: 'relative' }} >
      {/* Top gradient line */}
      <Box
        sx={{
          height: 2,
          background: 'linear-gradient(to right, rgba(26,79,219,0), #194fdb 50%, rgba(26,79,219,0))',
        }}
      />

      {/* Main content */}
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6.5 } }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row-reverse' },
            gap: { xs: 4, md: 0 },
            justifyContent: 'space-between',
          }}
        >
          {/* Contact info */}
          <Box sx={{ flex: '0 1 280px' }}>
            <Typography sx={{ fontWeight: 700, fontSize: '16px', color: '#0c0c0c', mb: 2.25 }}>
              יצירת קשר
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.25 }}>
              <Typography sx={{ fontSize: '14px', color: '#060606' }}>
                ✉&nbsp;&nbsp;support@arnona.co.il
              </Typography>
              <Typography sx={{ fontSize: '14px', color: '#060606' }}>
                📞&nbsp;&nbsp;03-123-4567
              </Typography>
              <Typography sx={{ fontSize: '14px', color: '#060606' }}>
                🕐&nbsp;&nbsp;א-ה | 09:00 - 17:00
              </Typography>
              <Typography sx={{ fontSize: '14px', color: '#060606' }}>
                📍&nbsp;&nbsp;תל אביב, ישראל
              </Typography>
            </Box>
          </Box>

          {/* Articles */}
          <Box sx={{ flex: '0 1 200px' }}>
            <Typography sx={{ fontWeight: 700, fontSize: '16px', color: '#0c0c0c', mb: 2 }}>
              מאמרים
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.6 }}>
              {articles.map((article, i) => (
                <MuiLink
                  key={i}
                  component={Link}
                  href="/blog"
                  sx={{
                    fontSize: '14px',
                    color: '#060606',
                    textDecoration: 'none',
                    '&:hover': { color: '#1a4fdb' },
                  }}
                >
                  › {article}
                </MuiLink>
              ))}
            </Box>
          </Box>

          {/* Quick links */}
          <Box sx={{ flex: '0 1 116px' }}>
            <Typography sx={{ fontWeight: 700, fontSize: '16px', color: '#0c0c0c', mb: 2 }}>
              קישורים מהירים
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.6 }}>
              {quickLinks.map((link, i) => (
                <MuiLink
                  key={i}
                  component={link.href.startsWith('/') || link.href.startsWith('#') ? Link : 'a'}
                  href={link.href}
                  sx={{
                    fontSize: '14px',
                    color: '#060606',
                    textDecoration: 'none',
                    '&:hover': { color: '#1a4fdb' },
                  }}
                >
                  › {link.label}
                </MuiLink>
              ))}
            </Box>
          </Box>

          {/* Logo + description */}
          <Box sx={{ flex: '0 1 280px' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5,  mb: 2.5 }}>
              {/* TODO: Replace with actual logo image */}
              <Box
                sx={{
                  width: 75,
                  height: 68,
                  bgcolor: '#e8eef6',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                }}
              >
                🏠
              </Box>
              <Typography sx={{ fontWeight: 700, fontSize: '22px', color: '#0c0c0c' }}>
                ארנונה חכמה
              </Typography>
              
            </Box>
            <Typography
              sx={{
                fontSize: '14px',
                color: '#161717',
                lineHeight: '22px',
                mb: 2.5,
              }}
            >
              המערכת המתקדמת לחישוב ובדיקת
              <br />
              חיובי ארנונה ברחבי ישראל
            </Typography>
            <Box
              component="a"
              href="mailto:support@arnona.co.il"
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(26,79,219,0.15)',
                border: '1px solid rgba(26,79,219,0.4)',
                borderRadius: '12px',
                height: 46,
                textDecoration: 'none',
                cursor: 'pointer',
                '&:hover': { bgcolor: 'rgba(26,79,219,0.2)' },
              }}
            >
              <Typography sx={{ fontSize: '14px', fontWeight: 500, color: '#4a90e2' }}>
                ✉&nbsp;&nbsp;שלח לנו מייל לתמיכה
              </Typography>
            </Box>
          </Box>
        </Box>
      </Container>

      {/* Bottom bar */}
      <Box>
        {/* Separator line */}
        <Box sx={{ mx: 10, height: '1px', bgcolor: '#e0e0e0' }} />

        <Box
          sx={{
            bgcolor: 'rgba(162,213,246,0.2)',
            py: 2,
          }}
        >
          <Container maxWidth="lg">
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexDirection: { xs: 'column', md: 'row' },
                gap: 1,
              }}
            >
              <Typography sx={{ fontSize: '13px', color: '#141414' }}>
                מדיניות פרטיות&nbsp;&nbsp;|&nbsp;&nbsp;תנאי שימוש&nbsp;&nbsp;|&nbsp;&nbsp;נגישות
              </Typography>
              <Typography sx={{ fontSize: '13px', color: '#141414' }}>
                © 2026 ארנונה חכמה. כל הזכויות שמורות.
              </Typography>
            </Box>
          </Container>
        </Box>
      </Box>
    </Box>
  );
}
