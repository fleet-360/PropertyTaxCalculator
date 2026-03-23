'use client';
import { Box, Container, Typography } from '@mui/material';
import { motion } from 'framer-motion';

const stats = [
  { value: '100+', label: 'רשויות מקומיות' },
  { value: '50,000+', label: 'לקוחות מרוצים' },
  { value: '₪2,400', label: 'חיסכון ממוצע' },
  { value: '98%', label: 'דיוק בחישוב' },
];

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
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: { xs: 4, sm: 8, md: 24 },
              flexWrap: 'wrap',
            }}
          >
            {stats.map((stat, i) => (
              <Box key={i} sx={{ textAlign: 'center' }}>
                <Typography
                  sx={{
                    color: '#1a4fdb',
                    fontSize: '30px',
                    fontWeight: 700,
                  }}
                >
                  {stat.value}
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
            ))}
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
}
