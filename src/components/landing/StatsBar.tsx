'use client';

import { Box, Container, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  motion,
  animate,
  useMotionValue,
  useMotionValueEvent,
  useInView,
  useReducedMotion,
} from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import { DURATION_MULTIPLIER } from '@/lib/animations';

type StatConfig = {
  target: number;
  ringPercent: number;
  label: string;
  prefix?: string;
  suffix?: string;
  comma?: boolean;
};

const stats: StatConfig[] = [
  { target: 20, ringPercent: 75, suffix: '+', label: 'רשויות מקומיות' },
  { target: 1000, ringPercent: 85, suffix: '+', comma: true, label: 'לקוחות מרוצים' },
  { target: 2400, ringPercent: 80, prefix: '₪', comma: true, label: 'חיסכון ממוצע' },
  { target: 98, ringPercent: 98, suffix: '%', label: 'דיוק בחישוב' },
];

function formatStatValue(n: number, comma: boolean): string {
  const rounded = Math.round(n);
  return comma ? rounded.toLocaleString('en-US') : String(rounded);
}

function RollingStat({ stat, index }: { stat: StatConfig; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });
  const reduceMotion = useReducedMotion();
  const theme = useTheme();
  const count = useMotionValue(0);
  const [display, setDisplay] = useState(0);

  useMotionValueEvent(count, 'change', (latest) => {
    setDisplay(Math.round(latest));
  });

  useEffect(() => {
    if (!isInView) return;

    if (reduceMotion) {
      count.set(stat.target);
      setDisplay(stat.target);
      return;
    }

    count.set(0);
    setDisplay(0);
    const controls = animate(count, stat.target, {
      duration: 2 * DURATION_MULTIPLIER,
      ease: [0.22, 1, 0.36, 1],
      delay: index * 0.1 * DURATION_MULTIPLIER,
    });
    return () => controls.stop();
  }, [isInView, stat.target, reduceMotion, index, count]);

  const valueText = `${stat.prefix ?? ''}${formatStatValue(display, stat.comma ?? false)}${stat.suffix ?? ''}`;
  const progress = Math.max(0, Math.min(1, stat.ringPercent / 100));

  const size = 220;
  const strokeWidth = 8;
  const r = 38;

  return (
    <Box
      ref={ref}
      sx={{
        position: 'relative',
        width: { xs: 124, sm: size },
        height: { xs: 124, sm: size },
        display: 'grid',
        placeItems: 'center',
        textAlign: 'center',
      }}
    >
      <Box
        component="svg"
        aria-hidden
        viewBox="0 0 100 100"
        sx={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          transform: 'rotate(-90deg)',
          transformOrigin: '50% 50%',
        }}
      >
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={theme.palette.grey[200]}
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={theme.palette.primary.main}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: isInView ? progress : 0 }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { duration: 2 * DURATION_MULTIPLIER, ease: [0.22, 1, 0.36, 1], delay: index * 0.1 * DURATION_MULTIPLIER }
          }
        />
      </Box>

      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Typography
          sx={{
            color: theme.palette.secondary.main,
            fontSize: { xs: '16px', sm: '30px' },
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1.1,
          }}
        >
          {valueText}
        </Typography>
        <Typography
          sx={{
            color: theme.palette.text.primary,
            fontSize: { xs: '12px', sm: '15px' },
            fontWeight: 400,
          }}
        >
          {stat.label}
        </Typography>
      </Box>
    </Box>
  );
}

export default function StatsBar() {
  const theme = useTheme();

  return (
    <Box sx={{ py: { xs: 4, md: 5 }, bgcolor: theme.palette.background.paper }}>
      <Container maxWidth="lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Box
            role="group"
            aria-label="נתונים סטטיסטיים"
            sx={{
              display: 'flex',
              justifyContent: 'space-around',
              gap: { xs: 2, sm: 4, md: 8 },
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            {stats.map((stat, i) => (
              <RollingStat key={stat.label} stat={stat} index={i} />
            ))}
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
}
