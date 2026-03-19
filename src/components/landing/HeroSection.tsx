'use client';
import { Box, Container, Typography, Button } from '@mui/material';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function HeroSection() {
  return (
    <Box
      id="hero"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 50%, #42a5f5 100%)',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background decoration */}
      <Box
        sx={{
          position: 'absolute',
          top: -100,
          left: -100,
          width: 400,
          height: 400,
          borderRadius: '50%',
          bgcolor: 'rgba(255,255,255,0.05)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -150,
          right: -150,
          width: 500,
          height: 500,
          borderRadius: '50%',
          bgcolor: 'rgba(255,255,255,0.03)',
        }}
      />

      <Container maxWidth="md" sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Typography
            variant="h2"
            component="h1"
            sx={{ fontWeight: 700, mb: 3, fontSize: { xs: '2rem', md: '3rem' } }}
          >
            בודקים לדעת את חוב הארנונה שלך?
          </Typography>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Typography
            variant="h5"
            sx={{ mb: 5, opacity: 0.9, fontWeight: 400, lineHeight: 1.6 }}
          >
            מחשבון הארנונה החכם שלנו בודק אם אתה משלם יותר מדי
            <br />
            ומאפשר לך לחסוך אלפי שקלים בשנה
          </Typography>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <Button
            component={Link}
            href="/calculator"
            variant="contained"
            size="large"
            sx={{
              bgcolor: '#fff',
              color: 'primary.main',
              px: 5,
              py: 1.5,
              fontSize: '1.2rem',
              fontWeight: 700,
              borderRadius: 3,
              '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
            }}
          >
            בדוק עכשיו — חינם
          </Button>
        </motion.div>
      </Container>
    </Box>
  );
}
