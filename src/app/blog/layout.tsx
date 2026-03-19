import Link from 'next/link';
import Script from 'next/script';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import dbConnect from '@/lib/mongodb';
import Settings from '@/lib/models/Settings';

async function getSettings() {
  await dbConnect();
  const settings = await Settings.getSettings();
  return JSON.parse(JSON.stringify(settings));
}

export default async function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();
  const currentYear = new Date().getFullYear();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Google Analytics */}
      {settings.googleAnalyticsId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${settings.googleAnalyticsId}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${settings.googleAnalyticsId}');
            `}
          </Script>
        </>
      )}

      {/* Custom Head Code */}
      {settings.customHeadCode && (
        <Script id="custom-head-code" strategy="afterInteractive">
          {settings.customHeadCode}
        </Script>
      )}

      {/* Custom CSS */}
      {settings.customCss && (
        <style dangerouslySetInnerHTML={{ __html: settings.customCss }} />
      )}

      {/* Header */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backgroundColor: '#fff',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ justifyContent: 'space-between', py: 0.5 }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <Typography
                variant="h6"
                component="span"
                sx={{
                  fontWeight: 800,
                  color: '#1a1a1a',
                  letterSpacing: '-0.02em',
                  fontSize: '1.35rem',
                }}
              >
                {settings.siteName || 'My Blog'}
              </Typography>
            </Link>
            <Box
              component="nav"
              aria-label="Main navigation"
              sx={{ display: 'flex', gap: 3, alignItems: 'center' }}
            >
              <Link
                href="/"
                style={{
                  textDecoration: 'none',
                  color: '#555',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  transition: 'color 0.2s',
                }}
              >
                Home
              </Link>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1 }}>
        {children}
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          borderTop: '1px solid',
          borderColor: 'divider',
          py: 4,
          mt: 8,
          backgroundColor: '#fafafa',
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              &copy; {currentYear} {settings.siteName || 'My Blog'}. All rights reserved.
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Powered by BlogsManager
              </Typography>
              <Link
                href="/admin"
                style={{
                  fontSize: '0.7rem',
                  color: '#aaa',
                  textDecoration: 'none',
                }}
              >
                Admin
              </Link>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
