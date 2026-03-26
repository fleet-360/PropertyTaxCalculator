'use client';

import { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

export interface EmailSendDialogProps {
  open: boolean;
  onClose: () => void;
  /** Called with the email address — should return a promise that resolves when done */
  onSend: (email: string) => Promise<void>;
  /** Pre-filled email address */
  defaultEmail: string;
  /** Dialog title (Hebrew) */
  title: string;
  /** Optional description text below the title */
  description?: string;
  /** Send button label — defaults to "שלח" */
  sendButtonLabel?: string;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function EmailSendDialog({
  open,
  onClose,
  onSend,
  defaultEmail,
  title,
  description,
  sendButtonLabel = 'שלח',
}: EmailSendDialogProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setEmail(defaultEmail);
      setStatus('idle');
      setErrorMessage('');
    }
  }, [open, defaultEmail]);

  // Auto-close after success
  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => onClose(), 2000);
      return () => clearTimeout(timer);
    }
  }, [status, onClose]);

  const handleSend = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('error');
      setErrorMessage('יש להזין כתובת מייל תקינה');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      await onSend(email);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'שליחת המייל נכשלה');
    }
  };

  const titleId = 'email-send-dialog-title';

  return (
    <Dialog
      open={open}
      onClose={status === 'loading' ? undefined : onClose}
      aria-labelledby={titleId}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle id={titleId}>{title}</DialogTitle>
      <DialogContent>
        {description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {description}
          </Typography>
        )}

        {status === 'success' ? (
          <Alert severity="success" sx={{ mt: 1 }}>
            המייל נשלח בהצלחה!
          </Alert>
        ) : (
          <>
            <TextField
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              label="כתובת מייל"
              type="email"
              fullWidth
              size="small"
              disabled={status === 'loading'}
              error={status === 'error' && !!errorMessage}
              helperText={status === 'error' ? errorMessage : undefined}
              sx={{ mt: 1 }}
              slotProps={{
                input: {
                  sx: { direction: 'ltr', textAlign: 'left' },
                },
              }}
            />
          </>
        )}
      </DialogContent>

      {status !== 'success' && (
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} color="inherit" disabled={status === 'loading'}>
            ביטול
          </Button>
          <Button
            onClick={handleSend}
            variant="contained"
            disabled={status === 'loading'}
            startIcon={status === 'loading' ? <CircularProgress size={18} color="inherit" /> : undefined}
          >
            {status === 'loading' ? 'שולח...' : sendButtonLabel}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}
