"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import DummyPaymentDialog from "@/components/calculator/DummyPaymentDialog";
import coffeePastryImage from "@/assets/results-gate-coffee-pastry.png";
import { useCalculatorFeatures } from "../CalculatorFeaturesContext";
import { useEmailSend } from "@/hooks/useEmailSend";
import type { StepProps } from "../CalculatorWizard";

function PaymentUpsellBanner() {
  return (
    <Stack spacing={1} justifyContent="center">
      <Box
        sx={(theme) => ({
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: "background.paper",
          textAlign: "center",
          borderRadius: 1,
          p: 1,
        })}
      >
        <Typography variant="body1" component="p">
          זה לוקח כמה שניות
        </Typography>
        <Typography variant="body1" component="p">
          והמחיר של כוס קפה ומאפה
        </Typography>
      </Box>
      <Box
        sx={{
          position: "relative",
          width: "100%",
          overflow: "hidden",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Image
          src={coffeePastryImage}
          alt="כוס קפה ומאפה על שולחן במסעדה"
          width={coffeePastryImage.width}
          height={coffeePastryImage.height}
          style={{ height: "auto", borderRadius: "1em" }}
        />
      </Box>
    </Stack>
  );
}

export default function ResultsGateStep({ state, dispatch, sx }: StepProps) {
  const { paymentEnabled, calculatorChargeAmount } = useCalculatorFeatures();
  const { sendEmail } = useEmailSend();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const result = state.calculationResult;

  if (state.isLoading || !result) {
    return (
      <Box textAlign="center" py={6}>
        <CircularProgress />
        <Typography mt={2}>מחשב תוצאות...</Typography>
      </Box>
    );
  }

  const outcome: string = result.outcome ?? "match";
  const showPaymentBlock =
    paymentEnabled && (outcome === "underpaying" || outcome === "overpaying");

  // ── Mia message based on outcome ──
  useEffect(() => {
    const miaId =
      outcome === "overpaying"
        ? "step-5-overpaying"
        : outcome === "underpaying"
          ? "step-5-underpaying"
          : "step-5-match";
    dispatch({ type: "SET_MIA_MESSAGE", payload: miaId });
  }, [outcome, dispatch]);

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
    }).catch(() => {
      // Invoice sending is non-blocking
    });
  };

  const handlePaymentConfirm = () => {
    sendInvoice();
    goToDetailedResults();
  };

  const paymentButton = (
    <>
      {paymentEnabled && <PaymentUpsellBanner />}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          gap: 2
        }}
      >
      <Button variant="outlined" onClick={() => dispatch({ type: 'SET_STEP', step: 0 })}>
              חזרה להתחלה
            </Button>
        <Button variant="contained" onClick={handlePrimaryClick}>
          {paymentEnabled ? "תשלום וצפייה בתוצאות" : "צפה בתוצאות מפורטות"}
        </Button>
      </Box>
    </>
  );
  return (
    <Box sx={sx}>
      <Typography variant="h5" textAlign="center" mb={4}>
        תוצאות
      </Typography>

      {outcome === "match" && (
        <>
          <Alert severity="success" sx={{ mb: 3, fontSize: "1rem" }}>
            {"\u{1F60A}"} על פי המידע שהזנת, נראה שהחישוב תואם את הנתונים שגובה
            העירייה
          </Alert>
          <Typography textAlign="center" color="text.secondary" mb={3}>
            תודה שהשתמשת במחשבון הארנונה
          </Typography>
          <Box textAlign="center">
            <Button
              variant="contained"
              onClick={() => dispatch({ type: "RESET_CALCULATOR" })}
            >
              חזרה להתחלה
            </Button>
          </Box>
        </>
      )}

      {outcome === "underpaying" && (
        <>
          <Alert severity="info" sx={{ mb: 3, fontSize: "1rem" }}>
            {`לפי המחשבון, נמצא אי-התאמה בין תוצאת המחשבון לדו"ח הארנונה`}
          </Alert>

          {/* {paymentEnabled && (
            <Typography variant="body1" mb={2} textAlign="center">
              לצפייה בתוצאות המפורטות:{' '}
              <strong>{calculatorChargeAmount.toLocaleString('he-IL')} ₪</strong>
            </Typography>
          )} */}
          {paymentButton}
        </>
      )}

      {outcome === "overpaying" && (
        <>
          <Alert severity="success" sx={{ mb: 3, fontSize: "1rem" }}>
            {"\u{1F389}"} על פי המחשבון אתה זכאי להנחה!
          </Alert>
          {/* {paymentEnabled ? (
            <Typography variant="body1" mb={2} textAlign="center">
              לצפייה בתוצאות המפורטות:{" "}
              <strong>
                {calculatorChargeAmount.toLocaleString("he-IL")} ₪
              </strong>
            </Typography>
          ) : (
            <Typography variant="body1" mb={2} textAlign="center">
              תרצה לראות את התוצאות המפורטות?
            </Typography>
          )} */}
          {paymentButton}
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
