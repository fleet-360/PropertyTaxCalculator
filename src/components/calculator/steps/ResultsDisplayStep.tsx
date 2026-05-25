"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import PrintIcon from "@mui/icons-material/Print";
import EmailIcon from "@mui/icons-material/Email";
import GavelIcon from "@mui/icons-material/Gavel";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import type { StepProps } from "../CalculatorWizard";
import type { AreaBreakdownItem, AppliedFee } from "@/lib/types/calculator";
import { usePrint } from "@/hooks/usePrint";
import { useEmailSend } from "@/hooks/useEmailSend";
import EmailSendDialog from "@/components/common/EmailSendDialog";
import ResultsDetailsCard from "@/components/calculator/ResultsDetailsCard";
import { StepIndicator } from "../WizardLayout";
import { useCalculatorFeatures } from "../CalculatorFeaturesContext";
import {
  wizardPrimaryButtonSx,
  wizardResultsCardSx,
  wizardSecondaryButtonSx,
} from "../wizardStyles";

export default function ResultsDisplayStep({ state, dispatch, sx }: StepProps) {
  const { paymentEnabled } = useCalculatorFeatures();

  useEffect(() => {
    dispatch({ type: "SET_MIA_MESSAGE", payload: "step-6-default" });
  }, [dispatch]);

  const result = state.calculationResult ?? {};
  const outcome: string = result.outcome ?? "match";
  const paymentCompleted =
    paymentEnabled && (outcome === "overpaying" || outcome === "underpaying");
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
          color: theme.palette.brand.textMain,
          mb: { xs: 3, md: 4 },
        })}
      >
        לפי התחשיב שלנו מגיעה לך{" "}
        <Box
          component="span"
          sx={(theme) => ({ color: theme.palette.brand.successGreen })}
        >
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
        <Stack spacing={3}>
          {paymentCompleted && (
            <Box sx={wizardResultsCardSx}>
              <Stack
                direction="row"
                spacing={1.5}
                alignItems="center"
                sx={{ mb: 2 }}
              >
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: "24px",
                    lineHeight: "32px",
                  }}
                >
                  סיכום תשלום
                </Typography>
              </Stack>
              <Stack
                alignItems="center"
                spacing={1.5}
                sx={{ py: { xs: 2, md: 3 } }}
              >
                <Box
                  sx={(theme) => ({
                    position: "relative",
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    bgcolor: `${theme.palette.brand.successGreen}14`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  })}
                >
                  <ReceiptLongOutlinedIcon
                    sx={(theme) => ({
                      fontSize: 38,
                      color: theme.palette.brand.successGreen,
                    })}
                  />
                  <CheckCircleIcon
                    sx={(theme) => ({
                      position: "absolute",
                      bottom: -2,
                      insetInlineEnd: -2,
                      fontSize: 24,
                      color: theme.palette.brand.successGreen,
                      bgcolor: theme.palette.background.paper,
                      borderRadius: "50%",
                    })}
                  />
                </Box>
                <Typography
                  sx={(theme) => ({
                    fontWeight: 700,
                    fontSize: { xs: "18px", md: "20px" },
                    lineHeight: "28px",
                    color: theme.palette.brand.successGreen,
                    textAlign: "center",
                  })}
                >
                  התשלום בוצע בהצלחה
                </Typography>
                <Typography
                  sx={{
                    fontSize: "14px",
                    lineHeight: "20px",
                    color: "text.secondary",
                    textAlign: "center",
                  }}
                >
                  תודה! חשבונית נשלחה אליך למייל
                </Typography>
              </Stack>
            </Box>
          )}

          <Box sx={wizardResultsCardSx}>
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              sx={{ mb: 2 }}
            >
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
              <Typography
                sx={{ fontWeight: 700, fontSize: "24px", lineHeight: "32px" }}
              >
                סיכום ומסקנות
              </Typography>
            </Stack>
            <Typography sx={{ fontSize: "15px", lineHeight: "22px" }}>
              <Box component="span" sx={{ fontWeight: 700 }}>
                לתשומת לבך:
              </Box>{" "}
              התוצאות מבוססות על הנתונים שהזנתם ועל תעריפי צו הארנונה של הרשות
              המקומית. ייתכן שיש הבדלים בין החישוב לבין החיוב בפועל — מומלץ
              לבדוק מול דו&quot;ח הארנונה.
            </Typography>
            <Typography
              sx={{
                fontSize: "15px",
                lineHeight: "22px",
                mt: 2,
              }}
            >
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
              color="success"
            >
              להגשת השגה עכשיו{" "}
            </Button>
          </Box>
        </Stack>
        <ResultsDetailsCard
          reported={reported}
          calculated={calculated}
          biMonthlySavings={biMonthlySavings}
          annualSavings={annualSavings}
          tenYearSavings={tenYearSavings}
          areaBreakdown={areaBreakdown}
          appliedFees={appliedFees}
          totalFeesBimonthly={totalFeesBimonthly}
          printableId="results-printable"
        />
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
