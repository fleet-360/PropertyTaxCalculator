"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import PrintIcon from "@mui/icons-material/Print";
import EmailIcon from "@mui/icons-material/Email";
import GavelIcon from "@mui/icons-material/Gavel";
import type { StepProps } from "../CalculatorWizard";
import type { AreaBreakdownItem, AppliedFee } from "@/lib/types/calculator";
import { usePrint } from "@/hooks/usePrint";
import { useEmailSend } from "@/hooks/useEmailSend";
import EmailSendDialog from "@/components/common/EmailSendDialog";

export default function ResultsDisplayStep({ state, dispatch, sx }: StepProps) {
  useEffect(() => {
    dispatch({ type: 'SET_MIA_MESSAGE', payload: 'step-6-default' });
  }, [dispatch]);

  const result = state.calculationResult ?? {};
  const reported = state.bimonthlyPayment;
  const calculated =
    result.calculatedBimonthly ?? result.calculated ?? reported;
  const biMonthlySavings = reported - calculated;
  const annualSavings = biMonthlySavings * 6;
  const tenYearSavings = annualSavings * 10;
  const appealSavingsNonNegative =
    biMonthlySavings >= 0 && annualSavings >= 0 && tenYearSavings >= 0;

  const areaBreakdown: AreaBreakdownItem[] | undefined = result.areaBreakdown;
  const appliedFees: AppliedFee[] | undefined = result.appliedFees;
  const totalFeesBimonthly: number | undefined = result.totalFeesBimonthly;

  const { print } = usePrint();
  const { sendEmail } = useEmailSend();
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);

  const rows = [
    { label: "סכום לחודשיים (מדווח)", value: `${reported.toLocaleString()} ₪` },
    {
      label: "סכום לחודשיים (לפי המחשבון)",
      value: `${calculated.toLocaleString()} ₪`,
    },
    { label: "הנחה לחודשיים", value: `${biMonthlySavings.toLocaleString()} ₪` },
    { label: "חיסכון שנתי", value: `${annualSavings.toLocaleString()} ₪` },
    {
      label: "חיסכון ל-10 שנים",
      value: `${tenYearSavings.toLocaleString()} ₪`,
    },
  ];

  const handleSendResultsEmail = async (email: string) => {
    const result = await sendEmail({
      type: 'results',
      to: email,
      payload: {
        fullName: state.fullName,
        cityName: state.cityData?.cityName ?? '',
        reported,
        calculated,
        biMonthlySavings,
        annualSavings,
        tenYearSavings,
      },
    });
    if (!result.success) {
      throw new Error(result.error);
    }
  };

  return (
    <Box sx={sx}>
      <Box id="results-printable">
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

        {/* Area breakdown table */}
        {areaBreakdown && areaBreakdown.length > 0 && (
          <>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
              פירוט שטחים
            </Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 4 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>סוג שטח</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="left">שטח (מ&quot;ר)</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="left">תעריף בסיס</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="left">הנחה</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="left">תעריף אפקטיבי</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="left">סה&quot;כ שנתי</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {areaBreakdown.map((item) => (
                    <TableRow key={item.areaType}>
                      <TableCell>{item.label}</TableCell>
                      <TableCell align="left">{item.areaSqm}</TableCell>
                      <TableCell align="left">{item.baseRatePerSqm} ₪</TableCell>
                      <TableCell align="left">{item.discountPercent > 0 ? `${item.discountPercent}%` : '—'}</TableCell>
                      <TableCell align="left">{item.effectiveRatePerSqm} ₪</TableCell>
                      <TableCell align="left">{item.annualAmount.toLocaleString()} ₪</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}

        {/* Applied fees table */}
        {appliedFees && appliedFees.length > 0 && (
          <>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
              אגרות נוספות
            </Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 4 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>אגרה</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="left">עלות דו-חודשית</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="left">סוג</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {appliedFees.map((fee) => (
                    <TableRow key={fee.name}>
                      <TableCell>{fee.name}</TableCell>
                      <TableCell align="left">{fee.amount.toLocaleString()} ₪</TableCell>
                      <TableCell align="left">
                        <Chip
                          label={fee.isMandatory ? 'חובה' : 'אופציונלי'}
                          size="small"
                          color={fee.isMandatory ? 'primary' : 'default'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {totalFeesBimonthly !== undefined && (
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>סה&quot;כ אגרות</TableCell>
                      <TableCell align="left" sx={{ fontWeight: 600 }}>
                        {totalFeesBimonthly.toLocaleString()} ₪
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </Box>

      <Box
        sx={{
          display: "flex",
          gap: 2,
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        <Button
          variant="outlined"
          startIcon={<PrintIcon />}
          onClick={() => print({ id: "results-printable" })}
        >
          הדפס תוצאות
        </Button>
        <Button
          variant="outlined"
          startIcon={<EmailIcon />}
          onClick={() => setEmailDialogOpen(true)}
        >
          שלח למייל
        </Button>
        <Button
          variant="contained"
          startIcon={<GavelIcon />}
          disabled={!appealSavingsNonNegative}
          onClick={() => dispatch({ type: "NEXT_STEP" })}
        >
          הגש השגה לעירייה
        </Button>
      </Box>


      <EmailSendDialog
        open={emailDialogOpen}
        onClose={() => setEmailDialogOpen(false)}
        onSend={handleSendResultsEmail}
        defaultEmail={state.email}
        title="שליחת תוצאות למייל"
        description="התוצאות יישלחו לכתובת המייל שלך."
      />
    </Box>
  );
}
