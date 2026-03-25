'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';

interface ContactRedirectStepProps {
  reason: 'area' | 'designations' | 'city' | 'other_city' | 'error';
}

const MESSAGES: Record<ContactRedirectStepProps['reason'], { title: string; body: string }> = {
  area: {
    title: 'שטח הנכס גדול מ-1,000 מ"ר',
    body: 'המחשבון אינו תומך בחישוב עבור נכסים בשטח העולה על 1,000 מ"ר. לקבלת חישוב מדויק, אנא צור קשר עם הצוות שלנו.',
  },
  designations: {
    title: 'מספר ייעודים עסקיים',
    body: 'כאשר לנכס עסקי יש יותר מייעוד אחד, נדרש חישוב מותאם אישית. אנא צור קשר עם הצוות שלנו.',
  },
  city: {
    title: 'העיר אינה קיימת במאגר',
    body: 'לצערנו, העיר שבחרת אינה נתמכת כרגע במחשבון. אנא צור קשר עם הצוות שלנו לקבלת סיוע.',
  },
  other_city: {
    title: 'העיר שבחרת אינה נתמכת במחשבון',
    body: 'העיר שבחרת אינה קיימת במאגר הנתונים שלנו ולכן לא ניתן לחשב את הארנונה באופן אוטומטי. אנא צור קשר עם הצוות שלנו וניתן לך מענה אישי.',
  },
  error: {
    title: 'לא ניתן לבצע חישוב',
    body: 'אירעה שגיאה בעת ביצוע החישוב. אנא צור קשר עם הצוות שלנו לקבלת סיוע.',
  },
};

export default function ContactRedirectStep({ reason }: ContactRedirectStepProps) {
  const msg = MESSAGES[reason];

  return (
    <Box>
      <Typography variant="h5" textAlign="center" mb={3}>
        {msg.title}
      </Typography>

      <Alert severity="info" sx={{ mb: 4, fontSize: '1rem' }}>
        {msg.body}
      </Alert>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', mb: 4 }}>
        <Button
          variant="contained"
          startIcon={<PhoneIcon />}
          href="tel:+972000000000"
          size="large"
        >
          התקשר אלינו
        </Button>
        <Button
          variant="outlined"
          startIcon={<EmailIcon />}
          href="mailto:info@example.com"
          size="large"
        >
          שלח מייל
        </Button>
      </Box>

      <Box textAlign="center">
        <Button variant="text" href="/#hero">
          חזרה לדף הבית
        </Button>
      </Box>
    </Box>
  );
}
