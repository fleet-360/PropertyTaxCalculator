import type { Metadata } from 'next';
import { Inter, Assistant, Noto_Sans_Hebrew } from 'next/font/google';
import ThemeRegistry from '@/theme/ThemeRegistry';
import AccessibilityWidget from '@/components/common/AccessibilityWidget';
import '@/styles/globals.css';

const notoSansHebrew = Noto_Sans_Hebrew({
  subsets: ['hebrew', 'latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-noto-sans-hebrew',
});

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const assistant = Assistant({
  subsets: ['latin', 'hebrew'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-assistant',
});
export const metadata: Metadata = {
  title: 'מחשבון ארנונה - בדוק אם אתה משלם יותר מדי',
  description: 'מחשבון ארנונה חכם - בדוק את חיוב הארנונה שלך מול צו הארנונה העירוני וגלה אם אתה זכאי להנחה',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl" className={`${notoSansHebrew.variable} ${inter.variable} ${assistant.variable}`}>
      <body suppressHydrationWarning>
        <a href="#main-content" className="skip-to-content">
          דלג לתוכן הראשי
        </a>
        <ThemeRegistry>
          {children}
          <AccessibilityWidget />
        </ThemeRegistry>
      </body>
    </html>
  );
}
