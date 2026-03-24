'use client';

import { useRef } from 'react';
import { Box, Container, Typography } from '@mui/material';
import { motion, useScroll, useTransform } from 'framer-motion';

const steps = [
  {
    number: 1,
    label: 'שלב ראשון',
    title: 'הזנת פרטי הנכס',
    description:
      'הזן את כתובת הנכס, שטח במ״ר וסוג הנכס (מגורים, עסקי, חקלאי) לקבלת חישוב מותאם אישית.',
    side: 'left' as const,
  },
  {
    number: 2,
    label: 'שלב שני',
    title: 'חישוב אוטומטי',
    description:
      'המערכת מחשבת את הארנונה לפי תעריפי הרשות המקומית העדכניים, כולל הנחות וזיכויים.',
    side: 'right' as const,
  },
  {
    number: 3,
    label: 'שלב שלישי',
    title: 'קבלת תוצאות',
    description:
      'קבל דוח מפורט עם סכום הארנונה השנתי, הנחות זמינות וחיסכון פוטנציאלי.',
    side: 'left' as const,
  },
];

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
          transition={{ duration: 0.6 }}
        >
          <Typography
            component="h2"
            sx={{
              fontWeight: 700,
              fontSize: { xs: '28px', md: '38px' },
              color: '#080808',
              textAlign: 'center',
              mb: { xs: 5, md: 8 },
            }}
          >
            איך זה עובד?
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

          {/* Animated progress line (blue) */}
          <motion.div
            style={{
              position: 'absolute',
              left: '50%',
              top: 0,
              bottom: 0,
              width: 2,
              background: '#1a4fdb',
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
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.5, delay: 0.15 }}
                  >
                    <StepCard title={step.title} description={step.description} />
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, x: 60 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.5, delay: 0.15 }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: '18px',
                        color: '#1a4fdb',
                        mt: 1,
                      }}
                    >
                      {step.label}
                    </Typography>
                  </motion.div>
                )}
              </Box>

              {/* CENTER — number circle */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.4 }}
              >
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    bgcolor: '#1a4fdb',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '20px',
                    zIndex: 2,
                    position: 'relative',
                    flexShrink: 0,
                  }}
                >
                  {step.number}
                </Box>
              </motion.div>

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
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.5, delay: 0.15 }}
                  >
                    <StepCard title={step.title} description={step.description} />
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, x: -60 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.5, delay: 0.15 }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: '18px',
                        color: '#1a4fdb',
                        mt: 1,
                      }}
                    >
                      {step.label}
                    </Typography>
                  </motion.div>
                )}
              </Box>

              {/* Mobile: label + card below circle */}
              <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', alignItems: 'center', mt: 2, gap: 1.5 }}>
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: '16px',
                    color: '#1a4fdb',
                    width: '100%',
                    paddingLeft: 3,
                  }}
                >
                  {step.label}
                </Typography>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                  <StepCard title={step.title} description={step.description} />
                </motion.div>
              </Box>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
}

function StepCard({ title, description }: { title: string; description: string }) {
  return (
    <Box
      sx={{
        bgcolor: '#fff',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        p: 3,
        width: { xs: 300, md: 340 },
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
  );
}
