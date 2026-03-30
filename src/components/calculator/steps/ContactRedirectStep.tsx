'use client';

import { useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import { WizardAction, WizardState } from '../CalculatorWizard';
import { Dispatch } from 'react';
import { useLeadUpdate } from '@/hooks/useLeadUpdate';

interface ContactRedirectStepProps {
  reason: 'area' | 'designations' | 'city' | 'other_city' | 'error';
  dispatch: Dispatch<WizardAction>;
  state: WizardState;
}

const MESSAGES: Record<ContactRedirectStepProps['reason'], { title: string; body: string }> = {
  area: {
    title: 'שטח הנכס גדול מ-1,000 מ"ר',
    body: 'המחשבון אינו תומך בחישוב עבור נכסים בשטח העולה על 1,000 מ"ר. לקבלת חישוב מדויק, אנא צור קשר עם הצוות שלנו.',
  },
  designations: {
    title: 'יתכן שאתה משלם יותר ממה שצריך !',
    body: `כאשר לנכס עסקי יש יותר מייעוד אחד, נדרש חישוב מותאם אישית. אנא צור קשר עם הצוות אולם, במקרה של נכס עסקי שיש לו מספר
סיווגים שונים או שטחים נרחבים נמליץ
להיעזר במומחה בתחום הארנונה...
האם תרצה להשאיר פרטים שנציג שלנו יחזור
אליך?`,
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

export default function ContactRedirectStep({ reason, dispatch, state }: ContactRedirectStepProps) {
  const { updateLead } = useLeadUpdate();
  const msg = MESSAGES[reason];

  // Update abandonment stage when redirected to contact
  useEffect(() => {
    updateLead(state.leadId, state.calculationIndex, {
      abandonmentStage: 'contact_redirect',
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Box>
      <Typography variant="h5" textAlign="center" mb={3}>
        {msg.title}
      </Typography>

      <Alert severity="info" sx={{ mb: 4, fontSize: '1rem' }}>
        {msg.body}
      </Alert>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', mb: 4 }}>

        <Button onClick={() => dispatch({ type: 'RESET_CALCULATOR' })}
          variant="outlined"
          size="large"
        >
          רוצה שיחזרו אלי       </Button>
      </Box>

      <Box textAlign="center">
        <Button variant="text" onClick={() => dispatch({ type: 'RESET_CALCULATOR' })}>
          חזרה להתחלה
        </Button>
      </Box>
    </Box>
  );
}
