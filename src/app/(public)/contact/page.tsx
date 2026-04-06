import type { Metadata } from 'next';
import { Container, Typography, Box } from '@mui/material';
import ContactForm from '@/components/contact/ContactForm';

export const metadata: Metadata = {
  title: 'צור קשר | מחשבון ארנונה',
  description:
    'השאירו פרטים ונחזור אליכם בהקדם. נשמח לעזור בכל שאלה בנושא ארנונה, חישוב מס, הגשת השגה ועוד.',
};

export default function ContactPage() {
  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, sm: 6 } }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          צור קשר
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 480, mx: 'auto' }}>
          יש לכם שאלה? רוצים לדעת עוד על השירות שלנו? השאירו פרטים ונחזור אליכם בהקדם
        </Typography>
      </Box>

      <ContactForm />
    </Container>
  );
}
