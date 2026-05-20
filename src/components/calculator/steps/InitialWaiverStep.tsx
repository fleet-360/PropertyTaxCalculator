"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Button from "@mui/material/Button";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import type { StepProps } from "../CalculatorWizard";
import { CONSENT_TEXTS } from "@/lib/consent/consentTexts";

const INITIAL_WAIVER_TEXT = CONSENT_TEXTS.data_retention.text;

export default function InitialWaiverStep({ state, dispatch }: StepProps) {
  const [accepted, setAccepted] = useState(state.saveInfoPremission);

  useEffect(() => {
    dispatch({ type: "SET_MIA_MESSAGE", payload: "step-1-default" });
  }, [dispatch]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.25, md: 3 },
          maxHeight: 280,
          overflowY: "auto",
          lineHeight: 1.8,
          borderRadius: 2,
          border: "1px solid #e3e7f1",
          bgcolor: "#fff",
        }}
      >
        <Typography variant="body2" sx={{ color: "#333" }}>
          {INITIAL_WAIVER_TEXT}
        </Typography>
      </Paper>

      <FormControlLabel
        control={
          <Checkbox
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            sx={(theme) => ({
              color: "#cdd2e0",
              "&.Mui-checked": { color: theme.palette.brand.blue },
            })}
          />
        }
        label={
          <Typography
            sx={(theme) => ({
              fontSize: "14px",
              fontWeight: 600,
              color: theme.palette.brand.navyDeep,
            })}
          >
            קראתי ואני מסכים/ה
          </Typography>
        }
      />

      <Box
        sx={{
          mt: "auto",
          pt: 2,
          display: "flex",
          gap: 2,
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        <Button
          variant="outlined"
          onClick={() => dispatch({ type: "PREV_STEP" })}
          startIcon={<ChevronRightIcon />}
          sx={(theme) => ({
            borderRadius: "999px",
            px: 3.5,
            py: 1.5,
            fontSize: "15px",
            fontWeight: 600,
            borderColor: "#cdd2e0",
            color: theme.palette.brand.navyDeep,
            "& .MuiButton-startIcon": { mr: 0.5, ml: -0.5 },
            "&:hover": {
              borderColor: theme.palette.brand.blue,
              bgcolor: "rgba(26,86,224,0.04)",
            },
          })}
        >
          חזרה
        </Button>
        <Button
          variant="contained"
          disabled={!accepted}
          onClick={() => {
            dispatch({ type: "UPDATE_FIELD", field: "saveInfoPremission", value: accepted });
            dispatch({ type: "NEXT_STEP" });
          }}
          endIcon={<ChevronLeftIcon />}
          sx={(theme) => ({
            bgcolor: theme.palette.brand.blue,
            color: "#fff",
            borderRadius: "999px",
            px: 4,
            py: 1.5,
            fontSize: "16px",
            fontWeight: 700,
            boxShadow: `0 10px 24px ${theme.palette.brand.blue}40`,
            "& .MuiButton-endIcon": { ml: 0.75, mr: -0.5 },
            "&:hover": {
              bgcolor: theme.palette.brand.blueDark,
            },
            "&.Mui-disabled": {
              bgcolor: "#cdd2e0",
              color: "#fff",
            },
          })}
        >
          המשך לשלב הבא
        </Button>
      </Box>
    </Box>
  );
}
