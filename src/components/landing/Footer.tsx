'use client';
import { Box, Container, Typography, Link as MuiLink, Divider } from '@mui/material';
import Link from 'next/link';

export default function Footer() {
  return (
    <Box component="footer" sx={{ bgcolor: '#1a1a2e', color: '#ccc', py: 6 }}>
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 4,
            mb: 4,
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ color: '#fff', mb: 2, fontWeight: 700 }}>
              מחשבון ארנונה
            </Typography>
            <Typography variant="body2" sx={{ lineHeight: 1.8 }}>
              כלי חכם לבדיקת חיובי ארנונה מול צווי ארנונה עירוניים.
              גלה אם אתה משלם יותר מדי וחסוך אלפי שקלים.
            </Typography>
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>קישורים</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <MuiLink component={Link} href="/calculator" sx={{ color: '#ccc', textDecoration: 'none', '&:hover': { color: '#fff' } }}>
                מחשבון ארנונה
              </MuiLink>
              <MuiLink component={Link} href="/blog" sx={{ color: '#ccc', textDecoration: 'none', '&:hover': { color: '#fff' } }}>
                מאמרים
              </MuiLink>
            </Box>
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>יצירת קשר</Typography>
            <Typography variant="body2" sx={{ lineHeight: 2 }}>
              דוא&quot;ל: mahshevon@arnona.co.il
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 3 }} />

        <Typography variant="body2" align="center" sx={{ opacity: 0.6 }}>
          © {new Date().getFullYear()} מחשבון ארנונה. כל הזכויות שמורות.
        </Typography>
      </Container>
    </Box>
  );
}
