'use client';

import { useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import SignaturePad from 'signature_pad';

export interface AppealSignaturePadProps {
  /** Raw base64 PNG (no data: prefix). */
  onConfirm: (signaturePngBase64: string) => void;
  onEmptySignature?: () => void;
  disabled?: boolean;
}

function resizeCanvas(canvas: HTMLCanvasElement, signaturePad: SignaturePad) {
  const ratio = Math.max(window.devicePixelRatio || 1, 1);
  const w = canvas.offsetWidth;
  const h = canvas.offsetHeight;
  canvas.width = w * ratio;
  canvas.height = h * ratio;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(ratio, ratio);
  }
  signaturePad.clear();
}

export default function AppealSignaturePad({
  onConfirm,
  onEmptySignature,
  disabled,
}: AppealSignaturePadProps) {
  const theme = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePad | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const signaturePad = new SignaturePad(canvas, {
      backgroundColor: 'rgba(0,0,0,0)',
      penColor: theme.palette.text.primary,
    });
    padRef.current = signaturePad;

    const onResize = () => {
      resizeCanvas(canvas, signaturePad);
    };
    onResize();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      signaturePad.off();
      padRef.current = null;
    };
  }, [theme.palette.text.primary]);

  const handleClear = () => {
    padRef.current?.clear();
  };

  const handleConfirm = () => {
    const pad = padRef.current;
    if (!pad || pad.isEmpty()) {
      onEmptySignature?.();
      return;
    }
    const dataUrl = pad.toDataURL('image/png');
    const raw = dataUrl.replace(/^data:image\/png;base64,/, '');
    onConfirm(raw);
  };

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        חתימה דיגיטלית על מכתב ההשגה
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        חתמו באזור למטה. החתימה תשולב במסמך ה-PDF ותישלח למייל שלכם.
      </Typography>
      <Box
        sx={{
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          bgcolor: 'background.paper',
          overflow: 'hidden',
          mb: 2,
        }}
      >
        <canvas
          ref={canvasRef}
          aria-label="אזור חתימה — ציירו את חתימתכם כאן"
          style={{
            display: 'block',
            width: '100%',
            height: 200,
            touchAction: 'none',
          }}
        />
      </Box>
      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
        <Button variant="outlined" color="inherit" onClick={handleClear} disabled={disabled}>
          נקה
        </Button>
        <Button variant="contained" onClick={handleConfirm} disabled={disabled}>
          אשר חתימה
        </Button>
      </Stack>
    </Box>
  );
}
