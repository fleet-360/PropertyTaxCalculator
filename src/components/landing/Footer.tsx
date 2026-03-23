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
      <Container maxWidth="lg" sx={{ py: { xs: 4, sm: 5, md: 6.5 }, px: { xs: 2, sm: 3 } }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row-reverse' },
            gap: { xs: 3.5, sm: 4, md: 2 },
            justifyContent: 'space-between',
            alignItems: { xs: 'stretch', md: 'flex-start' },
            width: '100%',
          }}
        >
          {/* Contact info */}
          <Box
            sx={{
              width: '100%',
              minWidth: 0,
              flex: { xs: 'none', md: '0 1 280px' },
              maxWidth: { md: 280 },
            }}
          >
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: { xs: '15px', md: '16px' },
                color: '#0c0c0c',
                mb: { xs: 1.75, md: 2.25 },
              }}
            >
              יצירת קשר
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.75, md: 2.25 } }}>
              <Typography
                sx={{
                  fontSize: { xs: '13px', md: '14px' },
                  color: '#060606',
                  wordBreak: 'break-word',
                }}
              >
                ✉&nbsp;&nbsp;support@arnona.co.il
              </Typography>
              <Typography sx={{ fontSize: { xs: '13px', md: '14px' }, color: '#060606' }}>
                📞&nbsp;&nbsp;03-123-4567
              </Typography>
              <Typography sx={{ fontSize: { xs: '13px', md: '14px' }, color: '#060606' }}>
                🕐&nbsp;&nbsp;א-ה | 09:00 - 17:00
              </Typography>
              <Typography sx={{ fontSize: { xs: '13px', md: '14px' }, color: '#060606' }}>
                📍&nbsp;&nbsp;תל אביב, ישראל
              </Typography>
            </Box>
          </Box>

          {/* Articles */}
          <Box
            sx={{
              width: '100%',
              minWidth: 0,
              flex: { xs: 'none', md: '0 1 200px' },
              maxWidth: { md: 200 },
            }}
          >
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: { xs: '15px', md: '16px' },
                color: '#0c0c0c',
                mb: 2,
              }}
            >
              מאמרים
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.6 }}>
              {articles.map((article, i) => (
                <MuiLink
                  key={i}
                  component={Link}
                  href="/blog"
                  sx={{
                    fontSize: { xs: '13px', md: '14px' },
                    color: '#060606',
                    textDecoration: 'none',
                    wordBreak: 'break-word',
                    lineHeight: 1.45,
                    '&:hover': { color: '#1a4fdb' },
                  }}
                >
                  › {article}
                </MuiLink>
              ))}
            </Box>
          </Box>

          {/* Quick links */}
          <Box
            sx={{
              width: '100%',
              minWidth: 0,
              flex: { xs: 'none', md: '0 1 116px' },
              maxWidth: { md: 116 },
            }}
          >
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: { xs: '15px', md: '16px' },
                color: '#0c0c0c',
                mb: 2,
              }}
            >
              קישורים מהירים
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.6 }}>
              {quickLinks.map((link, i) => (
                <MuiLink
                  key={i}
                  component={link.href.startsWith('/') || link.href.startsWith('#') ? Link : 'a'}
                  href={link.href}
                  sx={{
                    fontSize: { xs: '13px', md: '14px' },
                    color: '#060606',
                    textDecoration: 'none',
                    wordBreak: 'break-word',
                    lineHeight: 1.45,
                    '&:hover': { color: '#1a4fdb' },
                  }}
                >
                  › {link.label}
                </MuiLink>
              ))}
            </Box>
          </Box>

          {/* Logo + description */}
          <Box
            sx={{
              width: '100%',
              minWidth: 0,
              flex: { xs: 'none', md: '0 1 280px' },
              maxWidth: { md: 280 },
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                mb: 2.5,
                flexWrap: 'wrap',
                rowGap: 1,
              }}
            >
              {/* TODO: Replace with actual logo image */}
              <Box
                sx={{
                  width: { xs: 64, sm: 75 },
                  height: { xs: 58, sm: 68 },
                  flexShrink: 0,
                  bgcolor: '#e8eef6',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: { xs: '24px', sm: '28px' },
                }}
              >
                🏠
              </Box>
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: '18px', sm: '20px', md: '22px' },
                  color: '#0c0c0c',
                  lineHeight: 1.25,
                }}
              >
                ארנונה חכמה
              </Typography>
            </Box>
            <Typography
              sx={{
                fontSize: { xs: '13px', md: '14px' },
                color: '#161717',
                lineHeight: { xs: 1.5, md: '22px' },
                mb: 2.5,
                maxWidth: { xs: '100%', md: 280 },
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
                minHeight: 46,
                py: { xs: 1.25, md: 0 },
                px: { xs: 1.5, md: 2 },
                width: { xs: '100%', md: 'auto' },
                maxWidth: '100%',
                boxSizing: 'border-box',
                textDecoration: 'none',
                cursor: 'pointer',
                textAlign: 'center',
                '&:hover': { bgcolor: 'rgba(26,79,219,0.2)' },
              }}
            >
              <Typography
                sx={{
                  fontSize: { xs: '13px', md: '14px' },
                  fontWeight: 500,
                  color: '#4a90e2',
                  lineHeight: 1.35,
                  wordBreak: 'break-word',
                }}
              >
                ✉&nbsp;&nbsp;שלח לנו מייל לתמיכה
              </Typography>
            </Box>
          </Box>
        </Box>
      </Container>

      {/* Bottom bar */}
      <Box>
        {/* Separator line */}
        <Box
          sx={{
            mx: { xs: 2, sm: 4, md: 6, lg: 10 },
            height: '1px',
            bgcolor: '#e0e0e0',
          }}
        />

        <Box
          sx={{
            bgcolor: 'rgba(162,213,246,0.2)',
            py: { xs: 1.75, md: 2 },
          }}
        >
          <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexDirection: { xs: 'column', md: 'row' },
                gap: { xs: 1.5, md: 1 },
                textAlign: { xs: 'center', md: 'inherit' },
                width: '100%',
              }}
            >
              <Typography
                sx={{
                  fontSize: { xs: '12px', sm: '13px' },
                  color: '#141414',
                  lineHeight: 1.5,
                  wordBreak: 'break-word',
                  maxWidth: '100%',
                }}
              >
                מדיניות פרטיות&nbsp;&nbsp;|&nbsp;&nbsp;תנאי שימוש&nbsp;&nbsp;|&nbsp;&nbsp;נגישות
              </Typography>
              <Typography
                sx={{
                  fontSize: { xs: '12px', sm: '13px' },
                  color: '#141414',
                  lineHeight: 1.5,
                  wordBreak: 'break-word',
                }}
              >
                © 2026 ארנונה חכמה. כל הזכויות שמורות.
              </Typography>
            </Box>
          </Container>
        </Box>
      </Box>
    </Box>
  );
}
