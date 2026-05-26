'use client';

import { useCallback, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { WizardAction, WizardState } from '../CalculatorWizard';
import { Dispatch } from 'react';
import { useLeadUpdate } from '@/hooks/useLeadUpdate';
import ContactForm, { type ContactFormSubmitPayload } from '@/components/contact/ContactForm';

interface ContactRedirectStepProps {
  reason:
    | 'area'
    | 'designations'
    | 'multiple_classifications'
    | 'city'
    | 'other_city'
    | 'error';
  dispatch: Dispatch<WizardAction>;
  state: WizardState;
}

const MESSAGES: Record<ContactRedirectStepProps['reason'], { title: string; body: string }> = {
  area: {
    title: 'שטח הנכס גדול מ-1,000 מ"ר',
    body: 'המחשבון אינו תומך בחישוב עבור נכסים בשטח העולה על 1,000 מ"ר. לקבלת חישוב מדויק, אנא צור קשר עם הצוות שלנו.',
  },
  designations: {
    title: 'יתכן שאתה משלם יותר ממה שצרי!',
    body: `כאשר לנכס עסקי יש יותר מייעוד אחד, נדרש חישוב מותאם אישית. אנא צור קשר עם הצוות אולם, במקרה של נכס עסקי שיש לו מספר
סיווגים שונים או שטחים נרחבים, מומלץ להיעזר במומחה בתחום הארנונה.
האם תרצה להשאיר פרטים כדי שנציג יחזור אליך?`,
  },
  multiple_classifications: {
    title: 'הנכס שלך כולל מספר סיווגים',
    body: 'לאור מורכבות הטיפול בנכס בעל מספר סיווגים (לדוגמה תעשייה ומגורים או עירוב סיווגים אחר), המחשבון אינו מסוגל בשלב זה לבצע את החישוב באופן אוטומטי. אנא השאר פרטים ונציג יחזור אליך לצורך בדיקה אישית.',
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
  const [callbackOpen, setCallbackOpen] = useState(false);
  const [formMountKey, setFormMountKey] = useState(0);

  // Update abandonment stage when redirected to contact
  useEffect(() => {
    updateLead(state.leadId, state.calculationIndex, {
      abandonmentStage: 'contact_redirect',
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openCallbackDialog = () => {
    setFormMountKey((k) => k + 1);
    setCallbackOpen(true);
  };

  const handleCallbackSubmit = useCallback(
    async (data: ContactFormSubmitPayload) => {
      const fullName = data.fullName.trim();
      const phone = data.phone.trim();
      const email = data.email.trim();

      if (state.leadId) {
        const res = await fetch(`/api/leads/${state.leadId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName,
            phone,
            email,
            calculationIndex: state.calculationIndex,
            calculationUpdate: {
              abandonmentStage: 'contact_redirect',
            },
          }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            typeof body.error === 'string' ? body.error : 'שגיאה בשמירת הפרטים',
          );
        }
      } else {
        const res = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName,
            phone,
            email,
            source: 'calculator',
            calculation: {
              abandonmentStage: 'contact_redirect',
              propertyType: state.propertyType,
              citySlug: state.citySlug,
            },
          }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          const detail =
            typeof body.details === 'string'
              ? body.details
              : typeof body.error === 'string'
                ? body.error
                : 'שגיאה בשמירת הפרטים';
          throw new Error(detail);
        }
      }

      setCallbackOpen(false);
      dispatch({ type: 'RESET_CALCULATOR' });
    },
    [
      dispatch,
      state.leadId,
      state.calculationIndex,
      state.propertyType,
      state.citySlug,
    ],
  );

  return (
    <Box>
      <Typography variant="h5" textAlign="center" mb={3}>
        {msg.title}
      </Typography>

      <Alert severity="info" sx={{ mb: 4, fontSize: '1rem' }}>
        {msg.body}
      </Alert>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', mb: 4 }}>
        <Button onClick={openCallbackDialog} variant="outlined" size="large">
          רוצה שיחזרו אלי
        </Button>
      </Box>

      <Box textAlign="center">
        <Button variant="text" onClick={() => dispatch({ type: 'RESET_CALCULATOR' })}>
          חזרה להתחלה
        </Button>
      </Box>

      <Dialog
        open={callbackOpen}
        onClose={() => setCallbackOpen(false)}
        fullWidth
        maxWidth="sm"
        aria-labelledby="contact-callback-dialog-title"
      >
        <DialogTitle id="contact-callback-dialog-title" sx={{ pr: 6 }}>
          השארת פרטים לחזרה
          <IconButton
            aria-label="סגור"
            onClick={() => setCallbackOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            מלאו שם מלא, טלפון ואימייל ונציג יחזור אליכם בהקדם.
          </Typography>
          <ContactForm
            key={formMountKey}
            variant="embedded"
            showMessage={false}
            defaultValues={{
              fullName: state.fullName,
              phone: state.phone,
              email: state.email,
            }}
            onSubmit={handleCallbackSubmit}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
