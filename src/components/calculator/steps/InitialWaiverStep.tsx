"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import type { StepProps } from "../CalculatorWizard";
import { CONSENT_TEXTS } from "@/lib/consent/consentTexts";
import WizardVideoLoader from "../WizardVideoLoader";
import {
  wizardPrimaryButtonSx,
  wizardSecondaryButtonSx,
} from "../wizardStyles";

const INITIAL_WAIVER_TEXT = CONSENT_TEXTS.data_retention.text;

const CONSENT_DIALOG_DELAY_MS = 3000;

export default function InitialWaiverStep({ state, dispatch }: StepProps) {
  const [accepted, setAccepted] = useState(state.saveInfoPremission);
  const [consentDialogOpen, setConsentDialogOpen] = useState(false);
  // True once the user clicked the dialog confirm button. We then wait for the
  // background extraction (if any) to finish before advancing.
  const [consentGiven, setConsentGiven] = useState(false);

  const extractionStatus = state.extractionStatus;
  const isExtracting = extractionStatus === "extracting";
  const hasExtractionError = extractionStatus === "error";

  useEffect(() => {
    dispatch({ type: "SET_MIA_MESSAGE", payload: "step-1-default" });
  }, [dispatch]);

  useEffect(() => {
    if (hasExtractionError) return;
    const timer = setTimeout(
      () => setConsentDialogOpen(true),
      CONSENT_DIALOG_DELAY_MS,
    );
    return () => clearTimeout(timer);
  }, [hasExtractionError]);

  // Close the dialog if extraction fails after it opened — the error UI
  // replaces both the video and the dialog.
  useEffect(() => {
    if (hasExtractionError) setConsentDialogOpen(false);
  }, [hasExtractionError]);

  // Auto-advance once the user has confirmed consent AND the background
  // extraction is no longer running (success, or no extraction was needed).
  useEffect(() => {
    if (!consentGiven) return;
    if (isExtracting) return;
    if (hasExtractionError) return;
    dispatch({ type: "NEXT_STEP" });
  }, [consentGiven, isExtracting, hasExtractionError, dispatch]);

  const handleConfirm = () => {
    dispatch({
      type: "UPDATE_FIELD",
      field: "saveInfoPremission",
      value: accepted,
    });
    setConsentGiven(true);
    setConsentDialogOpen(false);
  };

  const handleRetry = () => {
    // Send the user back to re-upload / re-try extraction.
    setConsentGiven(false);
    dispatch({ type: "RESET_EXTRACTION" });
    dispatch({ type: "PREV_STEP" });
  };

  if (hasExtractionError) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
          maxWidth: 560,
          mx: "auto",
        }}
      >
        <Alert severity="error" sx={{ width: "100%" }}>
          {state.extractionError || "שגיאה בעיבוד המסמך"}
        </Alert>
        <Typography
          sx={{
            fontSize: "16px",
            lineHeight: "22px",
            textAlign: "center",
            color: "text.secondary",
          }}
        >
          ניתן לחזור לשלב הקודם ולהחליף את הקובץ.
        </Typography>
        <Button
          variant="outlined"
          onClick={handleRetry}
          startIcon={<ChevronRightIcon />}
          sx={wizardSecondaryButtonSx}
        >
          חזרה לשלב הקודם
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
      }}
    >
      <WizardVideoLoader message="סורקים את הנתונים ומכינים את המחשבון עבורך..." />

      <Dialog
        open={consentDialogOpen}
        onClose={(_event, reason) => {
          if (reason === "backdropClick" || reason === "escapeKeyDown") return;
          setConsentDialogOpen(false);
        }}
        disableEscapeKeyDown
        maxWidth="sm"
        fullWidth
        aria-labelledby="initial-waiver-dialog-title"
        PaperProps={{
          sx: {
            borderRadius: "20px",
            px: { xs: 1, md: 2 },
            py: 1,
          },
        }}
      >
        <DialogTitle
          id="initial-waiver-dialog-title"
          sx={{
            textAlign: "center",
            fontWeight: 700,
            fontSize: { xs: "18px", md: "20px" },
          }}
        >
          אישור שמירת מידע
        </DialogTitle>
        <DialogContent
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Typography
            sx={{
              fontSize: "16px",
              lineHeight: "22px",
              textAlign: "center",
              color: "text.primary",
            }}
          >
            {INITIAL_WAIVER_TEXT}
          </Typography>

          <FormControlLabel
            sx={{ alignSelf: "center", m: 0 }}
            control={
              <Checkbox
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                sx={(theme) => ({
                  color: theme.palette.brand.borderField,
                  borderRadius: "4px",
                  "&.Mui-checked": { color: theme.palette.brand.blue },
                })}
              />
            }
            label={
              <Typography sx={{ fontSize: "18px", fontWeight: 400 }}>
                קראתי ואני מסכים/ה
              </Typography>
            }
          />
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
          <Button
            variant="contained"
            disabled={!accepted}
            onClick={handleConfirm}
            endIcon={<ChevronLeftIcon />}
            sx={wizardPrimaryButtonSx}
          >
            לשלב הבא
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
