'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { CouponPaymentSectionContext } from './CouponPaymentSection';
import { WizardAction, WizardState } from './CalculatorWizard';
import { Dispatch } from 'react';

export interface DummyPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  /** Amount in ₪ (display only — demo flow) */
  amountNis: number;
  title?: string;
  state: WizardState;
  dispatch: Dispatch<WizardAction>;
  context: CouponPaymentSectionContext;
}

export default function DummyPaymentDialog({
  open,
  onClose,
  onConfirm,
  amountNis,
}: DummyPaymentDialogProps) {
  const titleId = 'dummy-payment-dialog-title';
  const descId = 'dummy-payment-dialog-desc';

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby={titleId}
      aria-describedby={descId}
      fullWidth
      maxWidth="xs"
      slotProps={{
        paper: {
          sx: (theme) => ({
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.background.paper,
            display: 'flex',
            flexDirection: 'column',
            maxHeight: 'calc(100% - 64px)',
            overflow: 'hidden',
          }),
        },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          flex: '1 1 auto',
          minHeight: 0,
          overflowY: 'auto',
        }}
      >
        <Typography
          id={titleId}
          component="h2"
          sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}
        >
          תשלום מאובטח
        </Typography>

        <IconButton
          onClick={onClose}
          aria-label="סגירת חלון תשלום"
          size="small"
          sx={(theme) => ({
            position: 'sticky',
            top: 8,
            insetInlineEnd: 8,
            float: 'inline-end',
            zIndex: 2,
            bgcolor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            '&:hover': {
              bgcolor: theme.palette.action.hover,
            },
          })}
        >
          <CloseIcon fontSize="small" />
        </IconButton>

        <Box
          component="img"
          src="/images/calculator/tranzila.png"
          alt="מסך תשלום של טרנזילה — הדגמה בלבד"
          sx={{
            display: 'block',
            width: '100%',
            height: 'auto',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        />
      </Box>

      <DialogContent
        sx={(theme) => ({
          pt: 2,
          pb: 2,
          flex: '0 0 auto',
          borderTop: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.background.paper,
        })}
      >
        <DialogContentText
          id={descId}
          component="div"
          sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}
        >
          מסך תשלום של טרנזילה להדגמה. סכום לתשלום {amountNis.toLocaleString('he-IL')} שקלים חדשים. לא מתבצע חיוב אמיתי.
        </DialogContentText>

        <Stack spacing={1.5} alignItems="center">
          <Button
            onClick={handleConfirm}
            variant="contained"
            color="primary"
            fullWidth
            sx={{
              py: 1.25,
              fontWeight: 700,
              fontSize: '1rem',
            }}
          >
            תשלום {amountNis.toLocaleString('he-IL')} ₪
          </Button>

          <Stack
            direction="row"
            alignItems="center"
            spacing={0.5}
            sx={{ color: 'text.secondary' }}
          >
            <LockOutlinedIcon sx={{ fontSize: 14 }} aria-hidden />
            <Typography variant="caption">
              מסך תשלום לדוגמה בלבד — לא מתבצע חיוב אמיתי
            </Typography>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
