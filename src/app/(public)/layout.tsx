import Script from 'next/script';
import Box from '@mui/material/Box';
import dbConnect from '@/lib/mongodb';
import Settings from '@/lib/models/Settings';
import Navbar, { NAVBAR_MAIN_PADDING_TOP } from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';

async function getSettings() {
  await dbConnect();
  const settings = await Settings.getSettings();
  return JSON.parse(JSON.stringify(settings));
}

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
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

      {settings.customHeadCode && (
        <Script id="custom-head-code" strategy="afterInteractive">
          {settings.customHeadCode}
        </Script>
      )}

      {settings.customCss && (
        <style dangerouslySetInnerHTML={{ __html: settings.customCss }} />
      )}

      <Navbar variant="routes" />

      <Box component="main" id="main-content" sx={{ flexGrow: 1, pt: NAVBAR_MAIN_PADDING_TOP }}>
        {children}
      </Box>

      <Footer />
    </Box>
  );
}
