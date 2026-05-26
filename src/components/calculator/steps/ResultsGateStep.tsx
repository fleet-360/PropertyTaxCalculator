"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import DummyPaymentDialog from "@/components/calculator/DummyPaymentDialog";
import CouponPaymentSection from "@/components/calculator/CouponPaymentSection";
import ResultsDetailsCard from "@/components/calculator/ResultsDetailsCard";
import { StepIndicator } from "../WizardLayout";
import { useCalculatorFeatures } from "../CalculatorFeaturesContext";
import { useEmailSend } from "@/hooks/useEmailSend";
import type { StepProps } from "../CalculatorWizard";
import type { AreaBreakdownItem, AppliedFee } from "@/lib/types/calculator";
import {
  wizardPrimaryButtonSx,
  wizardResultsCardSx,
  wizardSecondaryButtonSx,
} from "../wizardStyles";

export default function ResultsGateStep({ state, dispatch, sx }: StepProps) {
  const { paymentEnabled, calculatorChargeAmount } = useCalculatorFeatures();
  const { sendEmail } = useEmailSend();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const result = state.calculationResult;
  const outcome: string = result?.outcome ?? "match";

  useEffect(() => {
    if (!result) return;
    const miaId =
      outcome === "overpaying"
        ? "step-5-overpaying"
        : outcome === "underpaying"
          ? "step-5-underpaying"
          : "step-5-match";
    dispatch({ type: "SET_MIA_MESSAGE", payload: miaId });
  }, [outcome, dispatch, result]);

  if (state.isLoading || !result) {
    return (
      <Box textAlign="center" py={6}>
        <CircularProgress />
        <Typography mt={2}>מחשב תוצאות...</Typography>
      </Box>
    );
  }

  const showPaymentBlock =
    paymentEnabled && (outcome === "underpaying" || outcome === "overpaying");

  const reported = state.bimonthlyPayment ?? state.reportedPayment ?? 0;
  const calculated =
    result.calculatedBimonthly ?? result.calculated ?? reported;
  const biMonthlySavings = Math.max(0, reported - calculated);
  const annualSavings = biMonthlySavings * 6;
  const tenYearSavings = annualSavings * 10;
  const areaBreakdown: AreaBreakdownItem[] | undefined = result.areaBreakdown;
  const appliedFees: AppliedFee[] | undefined = result.appliedFees;
  const totalFeesBimonthly: number | undefined = result.totalFeesBimonthly;

  const goToDetailedResults = () => dispatch({ type: "NEXT_STEP" });

  const handlePrimaryClick = () => {
    if (showPaymentBlock) {
      setPaymentDialogOpen(true);
      return;
    }
    goToDetailedResults();
  };

  const sendInvoice = () => {
    if (!state.email) return;
    sendEmail({
      type: "invoice",
      to: state.email,
      payload: {
        fullName: state.fullName,
        itemDescription: "צפייה בתוצאות מפורטות — מחשבון הארנונה",
        amountNis: calculatorChargeAmount,
        date: new Date().toISOString(),
      },
    }).catch(() => {});
  };

  const handlePaymentConfirm = () => {
    sendInvoice();
    goToDetailedResults();
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

  const overpayingLayout = outcome === "overpaying" && showPaymentBlock && (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
        gap: { xs: 3, md: 4 },
        alignItems: "stretch",
      }}
    >
      <Stack spacing={3}>
        <Box sx={wizardResultsCardSx}>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: "24px",
              lineHeight: "32px",
              mb: 2,
            }}
          >
            סיכום תשלום — לצפייה בתוצאות המחשבון המפורטות
          </Typography>
          <Box
            sx={{
              borderTop: "1px solid",
              borderColor: "divider",
              pt: 3,
              mb: 3,
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="flex-end"
            >
              <Box>
                <Typography sx={{ fontWeight: 500, fontSize: "32px" }}>
                  ₪{calculatorChargeAmount.toLocaleString("he-IL")}
                </Typography>
                <Typography sx={{ fontSize: "14px", fontWeight: 500, mt: 0.5 }}>
                  עלות של קפה ומאפה :)
                </Typography>
              </Box>
              <Typography sx={{ fontWeight: 500, fontSize: "24px" }}>
                סך הכל לתשלום
              </Typography>
            </Stack>
          </Box>
          <CouponPaymentSection
            state={state}
            dispatch={dispatch}
            context="results_gate"
          />
          <Button
            variant="contained"
            fullWidth
            onClick={handlePrimaryClick}
            endIcon={<ChevronLeftIcon />}
            sx={{ ...wizardPrimaryButtonSx, mt: 2, py: 1.25 }}
          >
            לתשלום וצפייה בתוצאות
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
        blurred
      />
    </Box>
  );

  const simpleActions = (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        gap: 2,
        flexWrap: "wrap",
        mt: 3,
      }}
    >
      <Button
        variant="outlined"
        onClick={() => dispatch({ type: "SET_STEP", step: 0 })}
        sx={wizardSecondaryButtonSx}
      >
        חזרה להתחלה
      </Button>
      <Button
        variant="contained"
        onClick={handlePrimaryClick}
        sx={wizardPrimaryButtonSx}
      >
        {paymentEnabled ? "תשלום וצפייה בתוצאות" : "צפה בתוצאות מפורטות"}
      </Button>
    </Box>
  );

  return (
    <Box sx={sx}>
      <StepIndicator displayStep={5} total={5} />
      {resultsHeadline}

      {outcome === "match" && (
        <>
          <Alert severity="success" sx={{ mb: 3, fontSize: "1rem" }}>
            על פי המידע שהזנת, נראה שהחישוב תואם את הנתונים שגובה העירייה
          </Alert>
          <Typography textAlign="center" color="text.secondary" mb={3}>
            תודה שהשתמשת במחשבון הארנונה
          </Typography>
          <Box textAlign="center">
            <Button
              variant="contained"
              onClick={() => dispatch({ type: "RESET_CALCULATOR" })}
              sx={wizardPrimaryButtonSx}
            >
              חזרה להתחלה
            </Button>
          </Box>
        </>
      )}

      {outcome === "underpaying" && (
        <>
          <Alert severity="info" sx={{ mb: 3, fontSize: "1rem" }}>
            לפי המחשבון, אין התאמה בין תוצאת המחשבון לדו&quot;ח הארנונה
          </Alert>
          {simpleActions}
        </>
      )}

      {outcome === "overpaying" && (
        <>
          {overpayingLayout ?? (
            <>
              <Alert severity="success" sx={{ mb: 3, fontSize: "1rem" }}>
                על פי המחשבון אתה זכאי להנחה!
              </Alert>
              {simpleActions}
            </>
          )}
        </>
      )}

      <DummyPaymentDialog
        open={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        onConfirm={handlePaymentConfirm}
        amountNis={calculatorChargeAmount}
        state={state}
        dispatch={dispatch}
        context="results_gate"
      />
    </Box>
  );
}
