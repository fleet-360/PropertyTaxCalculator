"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Button from "@mui/material/Button";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import type { StepProps } from "../CalculatorWizard";
import { CONSENT_TEXTS } from "@/lib/consent/consentTexts";
import { wizardNavRowSx, wizardPrimaryButtonSx } from "../wizardStyles";

const INITIAL_WAIVER_TEXT = CONSENT_TEXTS.data_retention.text;

export default function InitialWaiverStep({ state, dispatch }: StepProps) {
  const [accepted, setAccepted] = useState(state.saveInfoPremission);

  useEffect(() => {
    dispatch({ type: "SET_MIA_MESSAGE", payload: "step-1-default" });
  }, [dispatch]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <Typography
        sx={{
          fontSize: "16px",
          lineHeight: "22px",
          textAlign: "center",
          color: "text.primary",
          maxWidth: 597,
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

      <Box sx={{ ...wizardNavRowSx, justifyContent: "center", width: "100%" }}>
        <Button
          variant="contained"
          disabled={!accepted}
          onClick={() => {
            dispatch({ type: "UPDATE_FIELD", field: "saveInfoPremission", value: accepted });
            dispatch({ type: "NEXT_STEP" });
          }}
          endIcon={<ChevronLeftIcon />}
          sx={wizardPrimaryButtonSx}
        >
          לשלב הבא
        </Button>
      </Box>
    </Box>
  );
}
