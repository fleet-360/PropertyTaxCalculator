"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import PrintIcon from "@mui/icons-material/Print";
import EmailIcon from "@mui/icons-material/Email";
import GavelIcon from "@mui/icons-material/Gavel";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import type { StepProps } from "../CalculatorWizard";
import type { AreaBreakdownItem, AppliedFee } from "@/lib/types/calculator";
import { usePrint } from "@/hooks/usePrint";
import { useEmailSend } from "@/hooks/useEmailSend";
import EmailSendDialog from "@/components/common/EmailSendDialog";
import { StepIndicator } from "../WizardLayout";
import {
  wizardPrimaryButtonSx,
  wizardResultsCardSx,
  wizardSecondaryButtonSx,
} from "../wizardStyles";

export default function ResultsDisplayStep({ state, dispatch, sx }: StepProps) {
  useEffect(() => {
    dispatch({ type: "SET_MIA_MESSAGE", payload: "step-6-default" });
  }, [dispatch]);

  const result = state.calculationResult ?? {};
  const outcome: string = result.outcome ?? "match";
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
    { label: "סכום לחודשיים (מדווח)", value: `${reported.toLocaleString()} ₪`, highlight: false },
    {
      label: "סכום לחודשיים (לפי המחשבון)",
      value: `${calculated.toLocaleString()} ₪`,
      highlight: false,
    },
    { label: "הנחה לחודשיים", value: `${biMonthlySavings.toLocaleString()} ₪`, highlight: false },
    {
      label: "חיסכון שנתי",
      value: `${annualSavings.toLocaleString()} ₪`,
      highlight: true,
    },
    {
      label: "חיסכון ל-10 שנים",
      value: `${tenYearSavings.toLocaleString()} ₪`,
      highlight: false,
    },
  ];

  const handleSendResultsEmail = async (email: string) => {
    const emailResult = await sendEmail({
      type: "results",
      to: email,
      payload: {
        fullName: state.fullName,
        cityName: state.cityData?.cityName ?? "",
        reported,
        calculated,
        biMonthlySavings,
        annualSavings,
        tenYearSavings,
      },
    });
    if (!emailResult.success) {
      throw new Error(emailResult.error);
    }
  };

  const resultsHeadline =
    outcome === "overpaying" ? (
      <Typography
        sx={(theme) => ({
          fontWeight: 700,
          fontSize: { xs: "18px", md: "20px" },
          lineHeight: "27px",
          textAlign: "right",
          color: theme.palette.brand.textMain,
          mb: { xs: 3, md: 4 },
        })}
      >
        לפי התחשיב שלנו מגיעה לך{" "}
        <Box component="span" sx={(theme) => ({ color: theme.palette.brand.successGreen })}>
          הנחה משמעותית
        </Box>{" "}
        בתשלום הארנונה!
      </Typography>
    ) : null;

  return (
    <Box sx={sx}>
      <StepIndicator displayStep={5} total={5} />
      {resultsHeadline}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
          gap: { xs: 3, md: 4 },
          alignItems: "stretch",
        }}
      >
        <Box sx={wizardResultsCardSx}>
          <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ mb: 3 }}>
            <DescriptionOutlinedIcon sx={{ fontSize: 40, color: "action.disabled" }} />
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 700, fontSize: "24px", lineHeight: "32px", mb: 1 }}>
                תוצאות המחשבון:
              </Typography>
              <Typography sx={{ fontWeight: 500, fontSize: "16px" }}>
                גובה ההנחה השנתי שמגיע לך:
              </Typography>
              <Typography
                sx={(theme) => ({
                  fontWeight: 500,
                  fontSize: "32px",
                  mt: 1,
                  color:
                    annualSavings > 0
                      ? theme.palette.brand.successGreen
                      : theme.palette.brand.textMain,
                })}
              >
                ₪{Math.max(0, annualSavings).toLocaleString("he-IL")}
              </Typography>
            </Box>
          </Stack>

          <Box id="results-printable">
            <TableContainer sx={{ mb: areaBreakdown?.length || appliedFees?.length ? 3 : 0 }}>
              <Table size="small">
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.label}>
                      <TableCell sx={{ fontWeight: 600, border: 0, py: 1.5 }}>
                        {row.label}
                      </TableCell>
                      <TableCell align="left" sx={{ border: 0, py: 1.5 }}>
                        {row.highlight ? (
                          <Chip
                            label={row.value}
                            sx={(theme) => ({
                              bgcolor: theme.palette.brand.successGreen,
                              color: "#fff",
                              fontWeight: 600,
                              fontSize: "14px",
                              height: 28,
                              borderRadius: "14px",
                            })}
                          />
                        ) : (
                          row.value
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {areaBreakdown && areaBreakdown.length > 0 && (
              <>
                <Typography sx={{ fontWeight: 600, fontSize: "16px", mb: 1 }}>
                  פירוט שטחים
                </Typography>
                <TableContainer sx={{ mb: 3 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>סוג שטח</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="left">
                          שטח (מ&quot;ר)
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="left">
                          תעריף בסיס
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="left">
                          הנחה
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="left">
                          תעריף אפקטיבי
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="left">
                          סה&quot;כ שנתי
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {areaBreakdown.map((item) => (
                        <TableRow key={item.areaType}>
                          <TableCell>{item.label}</TableCell>
                          <TableCell align="left">{item.areaSqm}</TableCell>
                          <TableCell align="left">{item.baseRatePerSqm} ₪</TableCell>
                          <TableCell align="left">
                            {item.discountPercent > 0 ? `${item.discountPercent}%` : "—"}
                          </TableCell>
                          <TableCell align="left">{item.effectiveRatePerSqm} ₪</TableCell>
                          <TableCell align="left">
                            {item.annualAmount.toLocaleString()} ₪
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}

            {appliedFees && appliedFees.length > 0 && (
              <>
                <Typography sx={{ fontWeight: 600, fontSize: "16px", mb: 1 }}>
                  אגרות נוספות
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>אגרה</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="left">
                          עלות דו-חודשית
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="left">
                          סוג
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {appliedFees.map((fee) => (
                        <TableRow key={fee.name}>
                          <TableCell>{fee.name}</TableCell>
                          <TableCell align="left">{fee.amount.toLocaleString()} ₪</TableCell>
                          <TableCell align="left">
                            <Chip
                              label={fee.isMandatory ? "חובה" : "אופציונלי"}
                              size="small"
                              color={fee.isMandatory ? "primary" : "default"}
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
        </Box>

        <Stack spacing={3}>
          <Box sx={wizardResultsCardSx}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
              <Box
                sx={(theme) => ({
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  bgcolor: theme.palette.secondary.main,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                })}
              >
                <InfoOutlinedIcon sx={{ fontSize: 18, color: "#fff" }} />
              </Box>
              <Typography sx={{ fontWeight: 700, fontSize: "24px", lineHeight: "32px" }}>
                סיכום ומסקנות
              </Typography>
            </Stack>
            <Typography sx={{ fontSize: "15px", lineHeight: "22px", textAlign: "right" }}>
              <Box component="span" sx={{ fontWeight: 700 }}>
                לתשומת לבך:
              </Box>{" "}
              התוצאות מבוססות על הנתונים שהזנתם ועל תעריפי צו הארנונה של הרשות המקומית. ייתכן
              שיש הבדלים בין החישוב לבין החיוב בפועל — מומלץ לבדוק מול דו&quot;ח הארנונה.
            </Typography>
            <Typography sx={{ fontSize: "15px", lineHeight: "22px", textAlign: "right", mt: 2 }}>
              <Box component="span" sx={{ fontWeight: 700 }}>
                לתשובת לבך:
              </Box>{" "}
              {outcome === "overpaying"
                ? "נראה שאתם משלמים יותר מהנדרש. ניתן להגיש השגה לעירייה או לפנות לרשות לבירור."
                : outcome === "underpaying"
                  ? "החישוב מצביע על תשלום נמוך מהצפוי. מומלץ לוודא את הנתונים מול העירייה."
                  : "החישוב תואם את הנתונים שדיווחתם. אם יש שינוי בנכס — עדכנו את הרשות."}
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              gap: 2,
              justifyContent: "flex-start",
              flexWrap: "wrap",
            }}
          >
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={() => print({ id: "results-printable" })}
              sx={wizardSecondaryButtonSx}
            >
              הדפס תוצאות
            </Button>
            <Button
              variant="outlined"
              startIcon={<EmailIcon />}
              onClick={() => setEmailDialogOpen(true)}
              sx={wizardSecondaryButtonSx}
            >
              שלח למייל
            </Button>
            <Button
              variant="contained"
              startIcon={<GavelIcon />}
              disabled={!appealSavingsNonNegative}
              onClick={() => dispatch({ type: "NEXT_STEP" })}
              sx={wizardPrimaryButtonSx}
            >
              הגש השגה לעירייה
            </Button>
          </Box>
        </Stack>
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
