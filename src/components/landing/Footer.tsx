import { Box, Container, Typography } from '@mui/material';
import Link from 'next/link';
import Image from 'next/image';
import navbarLogo from '@/assets/navbar-logo.png';
import { BLOG_PATHS } from '@/lib/blog/routes';
import { getPosts } from '@/app/(public)/blog/page';
import FooterLegalLinks from '@/components/landing/FooterLegalLinks';

const NAVY_MID = '#152762';
const NAVY_DEEP = '#0B1A47';
const BLUE_LIGHT = '#3D78F0';

const quickLinks = [
  { label: 'דף הבית', href: '/#hero' },
  { label: 'המחשבון', href: '/calculator' },
  { label: 'ממליצים', href: '/#testimonials' },
  { label: 'חשוב לדעת', href: BLOG_PATHS.home },
  { label: 'יצירת קשר', href: '/contact' },
];

const linkStyle: React.CSSProperties = {
  fontSize: '13px',
  color: 'rgba(255,255,255,0.78)',
  textDecoration: 'none',
};

export default async function Footer() {
  const { posts } = await getPosts(1, 5);
  return (
    <Box
      component="footer"
      sx={{
        position: 'relative',
        background: `linear-gradient(180deg, ${NAVY_MID} 0%, ${NAVY_DEEP} 100%)`,
        color: '#fff',
      }}
    >
      <Container maxWidth="lg" sx={{ py: { xs: 5, md: 7 }, px: { xs: 2, sm: 3 } }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row-reverse' },
            gap: { xs: 4, md: 6 },
            justifyContent: 'space-between',
            alignItems: { xs: 'stretch', md: 'flex-start' },
          }}
        >
          {/* Logo + description (right in RTL) */}
          <Box sx={{ flex: { md: '0 1 320px' }, maxWidth: { md: 320 } }}>
            <Box
              sx={{
                bgcolor: '#fff',
                borderRadius: 2,
                p: 1.25,
                display: 'inline-flex',
                alignItems: 'center',
                mb: 2.5,
              }}
            >
              <Image
                src={navbarLogo}
                alt="מחשבון הארנונה"
                style={{ height: 36, width: 'auto', objectFit: 'contain' }}
              />
            </Box>
            <Typography
              sx={{
                fontSize: { xs: '13px', md: '14px' },
                lineHeight: 1.6,
                opacity: 0.85,
              }}
            >
              המערכת המתקדמת לחישוב ובדיקת חיובי ארנונה ברחבי ישראל.
              דייקנות מירבית, חיסכון מקסימלי והכנת השגות מקצועיות.
            </Typography>
          </Box>

          {/* Quick links */}
          <Box sx={{ flex: { md: '0 1 160px' }, maxWidth: { md: 160 } }}>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: { xs: '15px', md: '16px' },
                color: '#fff',
                mb: 2,
              }}
            >
              קישורים מהירים
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
              {quickLinks.map((link, i) => (
                link.href.startsWith('/') ? (
                  <Link key={i} href={link.href} style={linkStyle}>
                    {link.label}
                  </Link>
                ) : (
                  <a key={i} href={link.href} style={linkStyle}>
                    {link.label}
                  </a>
                )
              ))}
            </Box>
          </Box>

          {/* Articles */}
          <Box sx={{ flex: { md: '0 1 220px' }, maxWidth: { md: 220 } }}>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: { xs: '15px', md: '16px' },
                color: '#fff',
                mb: 2,
              }}
            >
              מאמרים אחרונים
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
              {posts.slice(0, 4).map((post, i) => (
                <Link key={i} href={BLOG_PATHS.home} style={linkStyle}>
                  {post.title}
                </Link>
              ))}
            </Box>
          </Box>

          {/* Contact info */}
          <Box sx={{ flex: { md: '0 1 240px' }, maxWidth: { md: 240 } }}>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: { xs: '15px', md: '16px' },
                color: '#fff',
                mb: 2,
              }}
            >
              יצירת קשר
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
              <Typography sx={{ fontSize: '13px', color: 'rgba(255,255,255,0.78)', wordBreak: 'break-word' }}>
                service@arnonacal.com
              </Typography>
              <Typography sx={{ fontSize: '13px', color: 'rgba(255,255,255,0.78)' }}>
                03-123-4567
              </Typography>
              <Typography sx={{ fontSize: '13px', color: 'rgba(255,255,255,0.78)' }}>
                א-ה | 09:00 - 17:00
              </Typography>
              <Typography sx={{ fontSize: '13px', color: 'rgba(255,255,255,0.78)' }}>
                תל אביב, ישראל
              </Typography>
            </Box>
          </Box>
        </Box>
      </Container>

      {/* Bottom bar */}
      <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.1)', py: { xs: 2, md: 2.25 } }}>
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexDirection: { xs: 'column', md: 'row' },
              gap: { xs: 1.5, md: 1 },
              textAlign: { xs: 'center', md: 'inherit' },
            }}
          >
            <FooterLegalLinks />
            <Typography sx={{ fontSize: { xs: '12px', sm: '13px' }, color: 'rgba(255,255,255,0.6)' }}>
              © 2026 מחשבון הארנונה. כל הזכויות שמורות.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
