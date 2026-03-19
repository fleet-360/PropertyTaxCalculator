'use client';
import { Box, Container, Typography, Paper, Avatar } from '@mui/material';
import { motion } from 'framer-motion';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';

const testimonials = [
  {
    name: 'יוסי כ.',
    city: 'נתניה',
    text: 'גיליתי שאני משלם כמעט 1,500 ₪ יותר מדי בשנה. תוך דקות הבנתי מה קורה.',
    savings: '1,416 ₪',
  },
  {
    name: 'מירי א.',
    city: 'אשדוד',
    text: 'לא ידעתי שמגיעה לי הנחה כאזרחית ותיקה. המחשבון חשף את זה מיד.',
    savings: '2,340 ₪',
  },
  {
    name: 'דוד ר.',
    city: 'ראשון לציון',
    text: 'בעל עסק קטן, המחשבון מצא שהסיווג שלי שגוי. חסכתי הרבה כסף.',
    savings: '4,200 ₪',
  },
];

export default function TestimonialsSection() {
  return (
    <Box id="testimonials" sx={{ py: 10, bgcolor: '#f8f9fa' }}>
      <Container maxWidth="lg">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Typography variant="h3" align="center" sx={{ mb: 1, fontWeight: 700 }}>
            מה אומרים הלקוחות שלנו
          </Typography>
          <Typography variant="h6" align="center" color="text.secondary" sx={{ mb: 6 }}>
            אלפי ישראלים כבר חוסכים בארנונה
          </Typography>
        </motion.div>

        <Box sx={{ display: 'flex', gap: 4, flexDirection: { xs: 'column', md: 'row' } }}>
          {testimonials.map((t, i) => (
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
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <FormatQuoteIcon sx={{ color: 'primary.light', fontSize: 40, mb: 2 }} />
                <Typography sx={{ mb: 3, flex: 1, lineHeight: 1.7 }}>{t.text}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>{t.name[0]}</Avatar>
                  <Box>
                    <Typography fontWeight={600}>{t.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{t.city}</Typography>
                  </Box>
                  <Box sx={{ mr: 'auto' }}>
                    <Typography variant="body2" color="success.main" fontWeight={700}>
                      חיסכון: {t.savings}/שנה
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </motion.div>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
