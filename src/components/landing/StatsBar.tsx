'use client';

import { Box, Container, Typography } from '@mui/material';
import {
  motion,
  animate,
  useMotionValue,
  useMotionValueEvent,
  useInView,
  useReducedMotion,
} from 'framer-motion';
import { useRef, useEffect, useState } from 'react';

type StatConfig = {
  target: number;
  label: string;
  prefix?: string;
  suffix?: string;
  comma?: boolean;
};

const stats: StatConfig[] = [
  { target: 100, suffix: '+', label: 'רשויות מקומיות' },
  { target: 50000, suffix: '+', comma: true, label: 'לקוחות מרוצים' },
  { target: 2400, prefix: '₪', comma: true, label: 'חיסכון ממוצע' },
  { target: 98, suffix: '%', label: 'דיוק בחישוב' },
];

function formatStatValue(n: number, comma: boolean): string {
  const rounded = Math.round(n);
  return comma ? rounded.toLocaleString('en-US') : String(rounded);
}

function RollingStat({ stat, index }: { stat: StatConfig; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });
  const reduceMotion = useReducedMotion();
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
      duration: 2,
      ease: [0.22, 1, 0.36, 1],
      delay: index * 0.1,
    });
    return () => controls.stop();
  }, [isInView, stat.target, reduceMotion, index, count]);

  const valueText = `${stat.prefix ?? ''}${formatStatValue(display, stat.comma ?? false)}${stat.suffix ?? ''}`;

  return (
    <Box ref={ref} sx={{ textAlign: 'center' }}>
      <Typography
        sx={{
          color: '#1a4fdb',
          fontSize: '30px',
          fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {valueText}
      </Typography>
      <Typography
        sx={{
          color: '#020202',
          fontSize: '13px',
          fontWeight: 400,
        }}
      >
        {stat.label}
      </Typography>
    </Box>
  );
}

export default function StatsBar() {
  return (
    <Box sx={{ py: { xs: 4, md: 5 }, bgcolor: '#fff' }}>
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
              justifyContent: 'center',
              alignItems: 'center',
              gap: { xs: 4, sm: 8, md: 24 },
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
