'use client';

import { useMemo, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box,
  TextField,
  Button,
  Alert,
  Typography,
  Paper,
  CircularProgress,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { motion, AnimatePresence } from 'framer-motion';

export const contactFieldsSchema = z.object({
  fullName: z.string().min(2, 'יש להזין שם מלא (לפחות 2 תווים)'),
  phone: z
    .string()
    .min(1, 'יש להזין מספר טלפון')
    .regex(/^05\d{1}-?\d{7}$/, 'מספר טלפון לא תקין (לדוגמה: 050-1234567)'),
  email: z
    .string()
    .min(1, 'יש להזין כתובת אימייל')
    .email('כתובת אימייל לא תקינה'),
});

const contactSchemaWithMessage = contactFieldsSchema.extend({
  message: z.string().min(10, 'יש להזין הודעה (לפחות 10 תווים)'),
});

export type ContactFormFields = z.infer<typeof contactFieldsSchema>;
export type ContactFormWithMessage = z.infer<typeof contactSchemaWithMessage>;

export type ContactFormSubmitPayload = ContactFormFields | ContactFormWithMessage;

export interface ContactFormProps {
  onSubmit: (data: ContactFormSubmitPayload) => Promise<void>;
  showMessage?: boolean;
  variant?: 'page' | 'embedded';
  defaultValues?: Partial<ContactFormWithMessage>;
}

const emptyDefaults: ContactFormWithMessage = {
  fullName: '',
  phone: '',
  email: '',
  message: '',
};

export default function ContactForm({
  onSubmit: onSubmitProp,
  showMessage = true,
  variant = 'page',
  defaultValues,
}: ContactFormProps) {
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const schema = useMemo(
    () => (showMessage ? contactSchemaWithMessage : contactFieldsSchema),
    [showMessage],
  );

  const mergedDefaults = useMemo(
    () => ({
      ...emptyDefaults,
      ...defaultValues,
      message: showMessage ? defaultValues?.message ?? '' : '',
    }),
    [defaultValues, showMessage],
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactFormWithMessage>({
    resolver: zodResolver(schema) as unknown as Resolver<ContactFormWithMessage>,
    defaultValues: mergedDefaults,
  });

  const onSubmit = async (data: ContactFormWithMessage) => {
    setSubmitStatus('idle');
    setErrorMessage('');

    const payload: ContactFormSubmitPayload = showMessage
      ? {
          fullName: data.fullName,
          phone: data.phone,
          email: data.email,
          message: data.message,
        }
      : {
          fullName: data.fullName,
          phone: data.phone,
          email: data.email,
        };

    try {
      await onSubmitProp(payload);

      if (variant === 'embedded') {
        reset(mergedDefaults);
      } else {
        setSubmitStatus('success');
        reset(emptyDefaults);
      }
    } catch (err) {
      setSubmitStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'שגיאה בשליחת הטופס');
    }
  };

  const formBody = (
    <AnimatePresence mode="wait">
      {submitStatus === 'success' && variant === 'page' ? (
        <Box
          component={motion.div}
          key="success"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          sx={{
            textAlign: 'center',
            py: 4,
          }}
        >
          <CheckCircleOutlineIcon
            sx={{ fontSize: 64, color: 'success.main', mb: 2 }}
          />
          <Typography variant="h5" gutterBottom>
            הפנייה נשלחה בהצלחה!
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            נחזור אלי בהקדם האפשרי
          </Typography>
          <Button
            variant="outlined"
            onClick={() => setSubmitStatus('idle')}
            sx={{ borderColor: 'primary.main', color: 'primary.main' }}
          >
            שליחת פנייה נוספת
          </Button>
        </Box>
      ) : (
        <Box
          component={motion.form}
          key="form"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
        >
          <TextField
            label="שם מלא"
            {...register('fullName')}
            error={!!errors.fullName}
            helperText={errors.fullName?.message}
            fullWidth
            autoComplete="name"
          />

          <TextField
            label="טלפון"
            {...register('phone')}
            error={!!errors.phone}
            helperText={errors.phone?.message}
            fullWidth
            autoComplete="tel"
            inputProps={{ dir: 'ltr', inputMode: 'tel' }}
          />

          <TextField
            label="אימייל"
            {...register('email')}
            error={!!errors.email}
            helperText={errors.email?.message}
            fullWidth
            autoComplete="email"
            inputProps={{ dir: 'ltr', inputMode: 'email' }}
          />

          {showMessage && (
            <TextField
              label="הודעה"
              {...register('message')}
              error={!!errors.message}
              helperText={errors.message?.message}
              fullWidth
              multiline
              rows={4}
            />
          )}

          {submitStatus === 'error' && (
            <Alert severity="error">{errorMessage}</Alert>
          )}

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isSubmitting}
            startIcon={
              isSubmitting ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <SendIcon />
              )
            }
            sx={{
              bgcolor: 'secondary.main',
              color: '#fff',
              fontWeight: 700,
              py: 1.5,
              '&:hover': {
                bgcolor: 'secondary.dark',
              },
            }}
          >
            {isSubmitting ? 'שולח...' : 'שליחה'}
          </Button>
        </Box>
      )}
    </AnimatePresence>
  );

  if (variant === 'embedded') {
    return formBody;
  }

  return (
    <Paper
      component={motion.div}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      elevation={0}
      sx={{
        p: { xs: 3, sm: 5 },
        maxWidth: 600,
        mx: 'auto',
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      {formBody}
    </Paper>
  );
}
