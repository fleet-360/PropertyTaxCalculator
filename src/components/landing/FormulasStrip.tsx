'use client';
import { Box, Typography } from '@mui/material';

const formulas = [
  'ארנונה = שטח × תעריף למ"ר',
  'חיסכון שנתי = (תשלום נוכחי - חישוב מחדש) × 6',
  'הנחה = תעריף × אחוז הנחה × שטח מוטב',
  'תשלום דו-חודשי = ארנונה שנתית ÷ 6',
  'חיסכון ל-10 שנים = חיסכון שנתי × 10',
  'ארנונה = שטח × תעריף למ"ר',
  'חיסכון שנתי = (תשלום נוכחי - חישוב מחדש) × 6',
  'הנחה = תעריף × אחוז הנחה × שטח מוטב',
];

export default function FormulasStrip() {
  return (
    <Box
      sx={{
        bgcolor: '#f0f4f8',
        py: 2,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          gap: 6,
          animation: 'marquee 30s linear infinite',
          whiteSpace: 'nowrap',
          '@keyframes marquee': {
            '0%': { transform: 'translateX(0)' },
            '100%': { transform: 'translateX(-50%)' },
          },
        }}
      >
        {formulas.map((formula, i) => (
          <Typography
            key={i}
            variant="body1"
            sx={{
              color: 'primary.main',
              fontWeight: 500,
              opacity: 0.7,
              fontSize: '0.95rem',
              fontFamily: 'monospace',
            }}
          >
            {formula}
          </Typography>
        ))}
      </Box>
    </Box>
  );
}
