'use client';
import { Box, Container, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';

const CalculatorWizard = dynamic(
  () => import('@/components/calculator/CalculatorWizard'),
  { ssr: false }
);

export default function CalculatorSection() {
  return (
    <Box id="calculator-section" sx={{ py: { xs: 6, md: 10 }, bgcolor: '#f8fafc' }}>
      <Container maxWidth="lg">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 6 } }}>
            {/* Badge */}
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(25,79,219,0.15)',
                border: '1px solid rgba(25,79,219,0.5)',
                borderRadius: '16px',
                px: 4.25,
                py: 0.6,
                mb: 2,
              }}
            >
              <Typography sx={{ color: '#3c3c3c', fontSize: '13px', fontWeight: 500 }}>
                🧮 מחשבון חינמי
              </Typography>
            </Box>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: { xs: '28px', md: '44px' },
                color: '#000',
                mb: 1.5,
              }}
            >
              מחשבון הארנונה שלך
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: '14px', md: '18px' },
                color: '#000',
              }}
            >
              הזן את פרטי הנכס שלך וקבל חישוב מדויק תוך שניות
            </Typography>
          </Box>
        </motion.div>

        {/* Content: Calculator + Info bubble */}
        <Box
          sx={{
            display: 'flex',
            gap: { xs: 4, md: 7.5 },
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'flex-start',
            justifyContent: 'center',
          }}
        >
          {/* Left side — Embedded Calculator */}
          <motion.div
            style={{ flex: '0 1 500px' }}
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Box
              sx={{
                bgcolor: '#f1f5f9',
                border: '1px solid #d2d2d2',
                borderRadius: '20px',
                p: { xs: 2, md: 3 },
                minHeight: 500,
              }}
            >
              <CalculatorWizard />
            </Box>
          </motion.div>

          {/* Right side — Info bubble + character */}
          <motion.div
            style={{ flex: '0 1 554px' }}
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.35 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
              {/* Speech bubble */}
              <Box sx={{ position: 'relative' }}>
                <Box
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.96)',
                    borderRadius: '20px',
                    boxShadow: '0px 12px 30px rgba(0,0,0,0.2)',
                    p: 2.5,
                    width: { xs: '100%', md: 340 },
                  }}
                >
                  {/* Title */}
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: '13px',
                      color: '#1a3380',
                      textAlign: 'right',
                      mb: 1.5,
                    }}
                  >
                    👋 שלום! אני מיה, יועצת הארנונה שלך
                  </Typography>

                  {/* Divider */}
                  <Box sx={{ height: 1, bgcolor: '#e5ebf7', mb: 1.5 }} />

                  {/* Description */}
                  <Typography
                    sx={{
                      fontSize: '12px',
                      color: '#4d668c',
                      textAlign: 'right',
                      lineHeight: 1.6,
                      mb: 1.5,
                    }}
                  >
                    המחשבון שלנו מנתח את נתוני הנכס שלך ומשווה אותם לתעריפי הרשות המקומית.
                    <br /><br />
                    תוך שניות תקבל הערכה מדויקת + המלצות לחיסכון!
                  </Typography>

                  {/* Steps */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {[
                      '1️⃣ הזן עיר ופרטי נכס',
                      '2️⃣ העלה טופס (אופציונלי)',
                      '3️⃣ קבל חישוב מיידי',
                    ].map((step, i) => (
                      <Typography
                        key={i}
                        sx={{
                          fontSize: '12px',
                          fontWeight: 500,
                          color: '#2659cc',
                          textAlign: 'right',
                        }}
                      >
                        {step}
                      </Typography>
                    ))}
                  </Box>
                </Box>

                {/* Triangle pointer */}
                <Box
                  sx={{
                    position: 'absolute',
                    left: -20,
                    top: 64,
                    width: 0,
                    height: 0,
                    borderTop: '15px solid transparent',
                    borderBottom: '15px solid transparent',
                    borderRight: '20px solid rgba(255,255,255,0.96)',
                    display: { xs: 'none', md: 'block' },
                  }}
                />
              </Box>

              {/* Character illustration placeholder */}
              <Box
                sx={{
                  width: 150,
                  height: 433,
                  display: { xs: 'none', md: 'flex' },
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {/* TODO: Replace with actual character illustration (Lottie animation or image) */}
                <Box
                  sx={{
                    width: 120,
                    height: 350,
                    bgcolor: '#e8eef6',
                    borderRadius: '60px 60px 10px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: 1,
                  }}
                >
                  <Box sx={{ fontSize: '48px' }}>👩‍💼</Box>
                  <Typography sx={{ fontSize: '11px', color: '#666', textAlign: 'center' }}>
                    מיה
                    <br />
                    יועצת ארנונה
                  </Typography>
                </Box>
              </Box>
            </Box>
          </motion.div>
        </Box>
      </Container>
    </Box>
  );
}
