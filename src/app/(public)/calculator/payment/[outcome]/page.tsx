import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { notFound } from 'next/navigation';

const COPY = {
  success: {
    title: 'התשלום התקבל',
    body: 'ניתן לסגור חלון זה ולחזור למחשבון.',
  },
  fail: {
    title: 'התשלום לא הושלם',
    body: 'ניתן לנסות שוב מהמחשבון.',
  },
} as const;

type Outcome = keyof typeof COPY;

/** Tranzila redirect target after payment (success or fail). */
export default async function PaymentOutcomePage({
  params,
}: {
  params: Promise<{ outcome: string }>;
}) {
  const { outcome } = await params;
  if (outcome !== 'success' && outcome !== 'fail') {
    notFound();
  }
  const { title, body } = COPY[outcome as Outcome];

  return (
    <Box sx={{ py: 8, px: 2, textAlign: 'center' }}>
      <Typography variant="h5" gutterBottom>
        {title}
      </Typography>
      <Typography color="text.secondary">{body}</Typography>
    </Box>
  );
}
