'use client';
import { Box, Container, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

const testimonials = [
  {
    name: 'יוסי בן דוד',
    city: 'נתניה',
    initial: 'י',
    text: '"קיבלתי החזר של 4,500 ₪! השירות הזה פשוט מדהים."',
    bgColor: '#c9a87c',
  },
  {
    name: 'מירי אברהמי',
    city: 'אשדוד',
    initial: 'מ',
    text: '"חסכתי אלפי שקלים בזכות המחשבון. ממליצה בחום!"',
    bgColor: '#7fa07f',
  },
  {
    name: 'דוד רביבו',
    city: 'ראשון לציון',
    initial: 'ד',
    text: '"מצאתי שהסיווג שלי שגוי. הצוות עזר לי להגיש השגה."',
    bgColor: '#8a8aa0',
  },
];

export default function TestimonialsSection() {
  return (
    <Box id="testimonials" sx={{ py: { xs: 6, md: 8 }, bgcolor: '#fff' }}>
      <Container maxWidth="lg">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: { xs: '28px', md: '38px' },
              color: '#080808',
              textAlign: 'center',
              mb: 1,
            }}
          >
            מה אומרים הלקוחות שלנו?
          </Typography>
          <Typography
            sx={{
              fontSize: '16px',
              color: '#000',
              textAlign: 'center',
              mb: { xs: 4, md: 6 },
            }}
          >
            אלפי משפחות כבר חסכו כסף עם מחשבון הארנונה שלנו
          </Typography>
        </motion.div>

        {/* Cards */}
        <Box
          sx={{
            display: 'flex',
            gap: { xs: 3, md: '46px' },
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              style={{ flex: '0 1 382px' }}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
            >
              <Box
                sx={{
                  width: { xs: '100%', md: 382 },
                  height: { xs: 420, md: 487 },
                  borderRadius: '22px',
                  overflow: 'hidden',
                  position: 'relative',
                  cursor: 'pointer',
                  '&:hover .play-btn': {
                    transform: 'translate(-50%, -50%) scale(1.1)',
                  },
                }}
              >
                {/* Background image placeholder */}
                {/* TODO: Replace with actual testimonial video thumbnail */}
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    bgcolor: t.bgColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Box sx={{ fontSize: '80px', opacity: 0.3 }}>📸</Box>
                </Box>

                {/* Gradient overlay */}
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.85) 100%)',
                  }}
                />

                {/* Play button */}
                <Box
                  className="play-btn"
                  sx={{
                    position: 'absolute',
                    top: '40%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    bgcolor: 'rgba(255,255,255,0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.3s ease',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                  }}
                >
                  <PlayArrowIcon sx={{ color: '#1a4fdb', fontSize: 40, ml: 0.5 }} />
                </Box>

                {/* Bottom content */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    p: 2.5,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: 1,
                  }}
                >
                  {/* Quote */}
                  <Typography
                    sx={{
                      fontSize: '16px',
                      color: 'rgba(255,255,255,0.8)',
                      textAlign: 'right',
                      lineHeight: '22px',
                      maxWidth: 257,
                    }}
                  >
                    {t.text}
                  </Typography>

                  {/* Stars */}
                  <Typography sx={{ color: '#f59e0b', fontSize: '16px' }}>
                    ★★★★★
                  </Typography>

                  {/* Name + Avatar */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mt: 0.5 }}>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography
                        sx={{
                          fontSize: '16px',
                          fontWeight: 700,
                          color: '#fff',
                        }}
                      >
                        {t.name}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: '13px',
                          color: '#00c6a2',
                        }}
                      >
                        {t.city}
                      </Typography>
                    </Box>
                    {/* Avatar with gradient */}
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: '22px',
                        background: 'linear-gradient(to right, #1a4fdb, #00c7a3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: '20px',
                          fontWeight: 700,
                          color: '#fff',
                        }}
                      >
                        {t.initial}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </motion.div>
          ))}
        </Box>

        {/* Carousel dots */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.75, mt: 4 }}>
          <Box sx={{ width: 24, height: 8, borderRadius: 4, bgcolor: '#1a4fdb' }} />
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#d0d0d0' }} />
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#d0d0d0' }} />
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#d0d0d0' }} />
        </Box>
      </Container>
    </Box>
  );
}
