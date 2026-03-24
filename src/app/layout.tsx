import type { Metadata } from 'next';
import { Heebo, Inter } from 'next/font/google';
import ThemeRegistry from '@/theme/ThemeRegistry';
import AccessibilityWidget from '@/components/common/AccessibilityWidget';
import '@/styles/globals.css';

const heebo = Heebo({
  subsets: ['latin', 'hebrew'],
  display: 'swap',
  variable: '--font-heebo',
});

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
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
    <html lang="he" dir="rtl" className={`${heebo.variable} ${inter.variable}`}>
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
