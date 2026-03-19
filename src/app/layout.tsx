import type { Metadata } from 'next';
import { Heebo } from 'next/font/google';
import ThemeRegistry from '@/theme/ThemeRegistry';
import '@/styles/globals.css';

const heebo = Heebo({
  subsets: ['latin', 'hebrew'],
  display: 'swap',
  variable: '--font-heebo',
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
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body suppressHydrationWarning>
        <ThemeRegistry>
          {children}
        </ThemeRegistry>
      </body>
    </html>
  );
}
