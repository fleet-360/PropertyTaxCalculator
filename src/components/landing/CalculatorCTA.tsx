'use client';
import { Box, Container, Typography, Button, Paper } from '@mui/material';
import { motion } from 'framer-motion';
import CalculateIcon from '@mui/icons-material/Calculate';
import Link from 'next/link';

export default function CalculatorCTA() {
  return (
    <Box id="calculator-cta" sx={{ py: 10, bgcolor: '#fff' }}>
      <Container maxWidth="md">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Typography variant="h3" align="center" sx={{ mb: 2, fontWeight: 700 }}>
            איך זה עובד?
          </Typography>
          <Typography variant="h6" align="center" color="text.secondary" sx={{ mb: 6 }}>
            בשלושה שלבים פשוטים תוכל לבדוק אם אתה משלם יותר מדי
          </Typography>
        </motion.div>

        <Box sx={{ display: 'flex', gap: 4, flexDirection: { xs: 'column', md: 'row' }, mb: 6 }}>
          {[
            { step: '1', title: 'בחר עיר וסוג נכס', desc: 'בחר את העיר שלך ואת סוג הנכס — פרטי או עסקי' },
            { step: '2', title: 'הזן פרטי נכס', desc: 'מלא את פרטי הנכס מתוך דו"ח הארנונה הדו-חודשי' },
            { step: '3', title: 'קבל תוצאות', desc: 'המחשבון ישווה את התשלום שלך מול צו הארנונה העירוני' },
          ].map((item, i) => (
            <motion.div
              key={i}
              style={{ flex: 1 }}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  textAlign: 'center',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 3,
                  height: '100%',
                }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2,
                    fontSize: '1.2rem',
                    fontWeight: 700,
                  }}
                >
                  {item.step}
                </Box>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                  {item.title}
                </Typography>
                <Typography color="text.secondary">{item.desc}</Typography>
              </Paper>
            </motion.div>
          ))}
        </Box>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <Button
              component={Link}
              href="/calculator"
              variant="contained"
              size="large"
              startIcon={<CalculateIcon />}
              sx={{ px: 5, py: 1.5, fontSize: '1.1rem', borderRadius: 3 }}
            >
              התחל חישוב עכשיו
            </Button>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
}
