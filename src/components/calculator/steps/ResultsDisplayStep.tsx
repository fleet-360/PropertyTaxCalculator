'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import PrintIcon from '@mui/icons-material/Print';
import GavelIcon from '@mui/icons-material/Gavel';
import type { StepProps } from '../CalculatorWizard';

export default function ResultsDisplayStep({ state, dispatch }: StepProps) {
  const result = state.calculationResult ?? {};
  const reported = state.bimonthlyPayment;
  const calculated = result.calculatedBimonthly ?? result.calculated ?? reported;
  const biMonthlySavings = reported - calculated;
  const annualSavings = biMonthlySavings * 6;
  const tenYearSavings = annualSavings * 10;

  const rows = [
    { label: 'סכום לחודשיים (מדווח)', value: `${reported.toLocaleString()} ₪` },
    { label: 'סכום לחודשיים (לפי המחשבון)', value: `${calculated.toLocaleString()} ₪` },
    { label: 'הנחה לחודשיים', value: `${biMonthlySavings.toLocaleString()} ₪` },
    { label: 'חיסכון שנתי', value: `${annualSavings.toLocaleString()} ₪` },
    { label: 'חיסכון ל-10 שנים', value: `${tenYearSavings.toLocaleString()} ₪` },
  ];

  return (
    <Box>
      <Typography variant="h5" textAlign="center" mb={4}>
        תוצאות מפורטות
      </Typography>

      <TableContainer component={Paper} variant="outlined" sx={{ mb: 4 }}>
        <Table>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.label}>
                <TableCell sx={{ fontWeight: 600 }}>{row.label}</TableCell>
                <TableCell align="left">{row.value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Button variant="outlined" startIcon={<PrintIcon />} onClick={() => window.print()}>
          הדפס תוצאות
        </Button>
        <Button
          variant="contained"
          startIcon={<GavelIcon />}
          onClick={() => dispatch({ type: 'NEXT_STEP' })}
        >
          הגש השגה לעירייה
        </Button>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 4 }}>
        <Button variant="outlined" onClick={() => dispatch({ type: 'PREV_STEP' })}>
          חזרה
        </Button>
      </Box>
    </Box>
  );
}
