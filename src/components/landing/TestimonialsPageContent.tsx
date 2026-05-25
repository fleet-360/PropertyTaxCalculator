'use client';

import Image from 'next/image';
import { Box, Container, Typography } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { videoTestimonials, quoteTestimonials } from '@/data/testimonials';

export default function TestimonialsPageContent() {
  return (
    <Container maxWidth="lg" sx={{ pb: { xs: 6, md: 10 }, pt: { xs: 1, md: 2 } }}>
      {/* Intro paragraph */}
      <Box sx={{ maxWidth: 720, mx: 'auto', textAlign: 'center', mb: { xs: 4, md: 6 } }}>
        <Typography
          sx={(theme) => ({
            fontSize: { xs: '14px', md: '15px' },
            color: theme.palette.brand.textMuted,
            lineHeight: 1.8,
          })}
        >
          אלפי בעלי נכסים ועסקים כבר חסכו זמן וכסף באמצעות מחשבון הארנונה.
          אנשים מספרים איך זה היה למצוא חיובי ארנונה שגויים, להגיש השגה ולקבל
          החזר כספי או הנחה — יותר מכל שמשלמים הארנונה שלהם.
        </Typography>
      </Box>

      {/* Video thumbnails — duplicated to fill 2 rows of 3 */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
          },
          gap: { xs: 2.5, md: 3 },
          mb: { xs: 5, md: 7 },
        }}
      >
        {[...videoTestimonials, ...videoTestimonials].map((v, idx) => (
          <Box
            key={`${v.name}-${idx}`}
            role="button"
            aria-label={`צפייה בהמלצה של ${v.name}`}
            sx={{
              position: 'relative',
              aspectRatio: '4 / 3',
              borderRadius: 2.5,
              overflow: 'hidden',
              cursor: 'pointer',
              boxShadow: '0 10px 28px rgba(11,26,71,0.12)',
              transition: 'transform 0.25s ease, box-shadow 0.25s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 16px 36px rgba(11,26,71,0.2)',
                '& .play-btn': {
                  transform: 'translate(-50%, -50%) scale(1.08)',
                },
              },
            }}
          >
            <Image
              src={v.photo}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              style={{ objectFit: 'cover' }}
            />
            <Box
              className="play-btn"
              sx={(theme) => ({
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: { xs: 56, md: 64 },
                height: { xs: 56, md: 64 },
                borderRadius: '50%',
                bgcolor: 'rgba(255,255,255,0.95)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                transition: 'transform 0.25s ease',
                color: theme.palette.brand.blue,
                zIndex: 2,
                opacity: 0.6,
              })}
            >
              <PlayArrowIcon sx={{ fontSize: { xs: 32, md: 36 }, ml: 0.5 }} />
            </Box>
          </Box>
        ))}
      </Box>

      {/* Quote testimonials — duplicated to fill 2 rows of 4 */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(4, 1fr)',
          },
          gap: { xs: 1.75, md: 2 },
        }}
      >
        {[...quoteTestimonials, ...quoteTestimonials].map((q, i) => (
          <Box
            key={`${q.author}-${i}`}
            sx={{
              p: 2.25,
              borderRadius: 2,
              border: `1px solid #e3e7f1`,
              bgcolor: '#fff',
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: (theme) => theme.palette.brand.blueLight,
                boxShadow: '0 8px 20px rgba(11,26,71,0.08)',
                transform: 'translateY(-2px)',
              },
            }}
          >
            <Typography
              sx={{
                fontSize: '12.5px',
                color: '#5a6788',
                lineHeight: 1.6,
                flex: 1,
              }}
            >
              {q.text}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mt: 'auto',
              }}
            >
              <Box
                sx={{
                  position: 'relative',
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  flexShrink: 0,
                  bgcolor: '#f1f4fb',
                }}
              >
                <Image
                  src={q.avatar}
                  alt={`תמונה של ${q.author}`}
                  fill
                  sizes="32px"
                  style={{ objectFit: 'cover' }}
                />
              </Box>
              <Typography
                sx={(theme) => ({
                  fontSize: '12px',
                  fontWeight: 700,
                  color: theme.palette.brand.navyDeep,
                })}
              >
                {q.author}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Container>
  );
}
