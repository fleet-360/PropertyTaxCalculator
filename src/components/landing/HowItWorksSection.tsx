'use client';

import { useRef } from 'react';
import { Box, Container, Typography } from '@mui/material';
import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'framer-motion';
import { DURATION_MULTIPLIER } from '@/lib/animations';

const steps = [
  {
    number: 1,
    label: 'שלב ראשון',
    title: 'בחירת סוג נכס ואזור',
    description:
      'בוחרים סוג נכס (פרטי/עסקי) ובוחרים את העיר או האזור שלכם.',
    side: 'left' as const,
  },
  {
    number: 2,
    label: 'שלב שני',
    title: 'העלאת שובר הארנונה',
    description:
      'מעלים את שובר הארנונה שלכם למערכת לצורך ניתוח אוטומטי.',
    side: 'right' as const,
  },
  {
    number: 3,
    label: 'שלב שלישי',
    title: 'חישוב חיסכון בקליק',
    description:
      'מתבצע חישוב חיסכון אוטומטי בקליק אחד – מהיר ומדויק.',
    side: 'left' as const,
  },
  {
    number: 4,
    label: 'שלב רביעי',
    title: 'הכנת מכתב לעירייה',
    description:
      'מכינים עבורכם מכתב מקצועי שיוגש לעירייה לקבלת ההנחה.',
    side: 'right' as const,
  },
];

/** Activation thresholds (one per step, evenly spaced) */
const THRESHOLDS = steps.map((_, i) => i / (steps.length - 1));

/* ------------------------------------------------------------------ */
/*  StepCircle — colour transitions gray → orange as the line arrives  */
/* ------------------------------------------------------------------ */

function StepCircle({
  stepNumber,
  scrollYProgress,
  threshold,
}: {
  stepNumber: number;
  scrollYProgress: MotionValue<number>;
  threshold: number;
}) {
  const lo = Math.max(0, threshold - 0.06);
  const hi = Math.min(1, threshold + 0.06);

  const progress = useTransform(scrollYProgress, [lo, hi], [0, 1]);
  const bgColor = useTransform(progress, [0, 1], ['#9ca3af', '#F28B00']);
  const textColor = useTransform(progress, [0, 1], ['#6b7280', '#ffffff']);
  const circleScale = useTransform(progress, [0, 0.5, 1], [1, 1.15, 1]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.4 * DURATION_MULTIPLIER }}
    >
      <motion.div
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          backgroundColor: bgColor,
          color: textColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: '20px',
          zIndex: 2,
          position: 'relative',
          flexShrink: 0,
          scale: circleScale,
        }}
      >
        {stepNumber}
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main section                                                       */
/* ------------------------------------------------------------------ */

export default function HowItWorksSection() {
  const timelineRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ['start 80%', 'end 50%'],
  });

  const lineScaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <Box sx={{ py: { xs: 6, md: 10 }, bgcolor: '#f8fafc' }}>
      <Container maxWidth="lg">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 * DURATION_MULTIPLIER }}
        >
          <Typography
            component="h2"
            sx={{
              fontWeight: 700,
              fontSize: { xs: '28px', md: '38px' },
              color: '#080808',
              textAlign: 'center',
              mb: 1,
            }}
          >
            איך זה עובד?
          </Typography>
          <Typography
            sx={{
              fontSize: { xs: '14px', md: '18px' },
              color: '#4a4a6a',
              textAlign: 'center',
              mb: { xs: 5, md: 8 },
            }}
          >
            זה לקח שנייה, תראו בעצמכם!
          </Typography>
        </motion.div>

        {/* Timeline */}
        <Box
          ref={timelineRef}
          sx={{
            position: 'relative',
            maxWidth: 900,
            mx: 'auto',
          }}
        >
          {/* Background line (gray) */}
          <Box
            sx={{
              position: 'absolute',
              left: '50%',
              top: 0,
              bottom: 0,
              width: 2,
              bgcolor: '#e0e4ea',
              transform: 'translateX(-50%)',
              display: { xs: 'none', md: 'block' },
            }}
          />

          {/* Animated progress line (orange) */}
          <motion.div
            style={{
              position: 'absolute',
              left: '50%',
              top: 0,
              bottom: 0,
              width: 2,
              background: '#F28B00',
              transformOrigin: 'top',
              scaleY: lineScaleY,
              translateX: '-50%',
            }}
          />

          {/* Steps */}
          {steps.map((step, i) => (
            <Box
              key={step.number}
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: { xs: 'center', md: 'center' },
                justifyContent: 'center',
                position: 'relative',
                mb: i < steps.length - 1 ? { xs: 5, md: 8 } : 0,
              }}
            >
              {/* LEFT content area */}
              <Box
                sx={{
                  flex: '1 1 0',
                  display: { xs: 'none', md: 'flex' },
                  justifyContent: 'flex-end',
                  pr: 4,
                }}
              >
                {step.side === 'left' ? (
                  <motion.div
                    initial={{ opacity: 0, x: -60 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: false, margin: '-80px' }}
                    transition={{
                      duration: 0.5 * DURATION_MULTIPLIER,
                      delay: 0.15 * DURATION_MULTIPLIER,
                    }}
                  >
                    <StepCard
                      title={step.title}
                      description={step.description}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, x: 60 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: false, margin: '-80px' }}
                    transition={{
                      duration: 0.5 * DURATION_MULTIPLIER,
                      delay: 0.15 * DURATION_MULTIPLIER,
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: '18px',
                        color: '#F28B00',
                        mt: 1,
                      }}
                    >
                      {step.label}
                    </Typography>
                  </motion.div>
                )}
              </Box>

              {/* CENTER — number circle */}
              <StepCircle
                stepNumber={step.number}
                scrollYProgress={scrollYProgress}
                threshold={THRESHOLDS[i]}
              />

              {/* RIGHT content area */}
              <Box
                sx={{
                  flex: '1 1 0',
                  display: { xs: 'none', md: 'flex' },
                  justifyContent: 'flex-start',
                  pl: 4,
                }}
              >
                {step.side === 'right' ? (
                  <motion.div
                    initial={{ opacity: 0, x: 60 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: false, margin: '-80px' }}
                    transition={{
                      duration: 0.5 * DURATION_MULTIPLIER,
                      delay: 0.15 * DURATION_MULTIPLIER,
                    }}
                  >
                    <StepCard
                      title={step.title}
                      description={step.description}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, x: -60 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: false, margin: '-80px' }}
                    transition={{
                      duration: 0.5 * DURATION_MULTIPLIER,
                      delay: 0.15 * DURATION_MULTIPLIER,
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: '18px',
                        color: '#F28B00',
                        mt: 1,
                      }}
                    >
                      {step.label}
                    </Typography>
                  </motion.div>
                )}
              </Box>

              {/* Mobile: label + card below circle */}
              <Box
                sx={{
                  display: { xs: 'flex', md: 'none' },
                  flexDirection: 'column',
                  alignItems: 'center',
                  mt: 2,
                  gap: 1.5,
                }}
              >
               
                <motion.div
                    initial={{ opacity: 0, x: 60 * (step.side === 'right' ? 1 : -1) }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: false, margin: '-80px' }}
                  transition={{
                    duration: 0.4 * DURATION_MULTIPLIER,
                    delay: 0.1 * DURATION_MULTIPLIER,
                  }}
                >
                   <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: '16px',
                    color: '#F28B00',
                    width: '100%',
                    paddingLeft: 3,
                  }}
                >
                  {step.label}
                </Typography>
                  <StepCard
                    title={step.title}
                    description={step.description}
                  />
                </motion.div>
              </Box>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/*  StepCard with hover pop-out                                        */
/* ------------------------------------------------------------------ */

function StepCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      transition={{ duration: 0.2 }}
    >
      <Box
        sx={{
          bgcolor: '#fff',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          p: 3,
          width: { xs: 300, md: 340 },
          transition: 'box-shadow 0.3s ease',
          '&:hover': {
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          },
        }}
      >
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: '16px',
            color: '#0c0c0c',
            mb: 1,
          }}
        >
          {title}
        </Typography>
        <Typography
          sx={{
            fontSize: '14px',
            color: '#4a4a6a',
            lineHeight: '22px',
          }}
        >
          {description}
        </Typography>
      </Box>
    </motion.div>
  );
}
