"use client";

import { useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Button from "@mui/material/Button";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import type { StepProps } from "../CalculatorWizard";
import { useLeadUpdate } from "@/hooks/useLeadUpdate";
import { CONSENT_TEXTS } from "@/lib/consent/consentTexts";
import { useConsentSubmit } from "@/hooks/useConsentSubmit";
import {
  wizardNavRowSx,
  wizardPrimaryButtonSx,
  wizardSecondaryButtonSx,
} from "../wizardStyles";

/** Mia messages seeded in `seed-mia-messages.ts` — merged into one bubble on the disclaimer step. */
const DISCLAIMER_MIA_MESSAGE_IDS = [
  "step-4-note-accuracy",
  "step-4-note-ordinance",
] as const;

const DISCLAIMER_TEXT = CONSENT_TEXTS.legal_disclaimer.text;

export default function DisclaimerStep({ state, dispatch, sx }: StepProps) {
  const { updateLead } = useLeadUpdate();
  const { submitConsent } = useConsentSubmit();

  useEffect(() => {
    dispatch({
      type: "SET_MIA_MESSAGE",
      payload: [...DISCLAIMER_MIA_MESSAGE_IDS],
    });
  }, [dispatch]);

  return (
    <Box sx={sx}>
      <Typography
        sx={{
          fontSize: "16px",
          lineHeight: "22px",
          color: "text.primary",
          mb: 3,
        }}
      >
        {DISCLAIMER_TEXT}
      </Typography>

      <FormControlLabel
        control={
          <Checkbox
            checked={state.consentGiven}
            onChange={(e) =>
              dispatch({
                type: "UPDATE_FIELD",
                field: "consentGiven",
                value: e.target.checked,
              })
            }
            sx={(theme) => ({
              color: "#cdd2e0",
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

      <Box sx={wizardNavRowSx}>
        <Button
          variant="outlined"
          onClick={() => dispatch({ type: "PREV_STEP" })}
          startIcon={<ChevronRightIcon />}
          sx={wizardSecondaryButtonSx}
        >
          לשלב הקודם
        </Button>
        <Button
          variant="contained"
          disabled={!state.consentGiven}
          endIcon={<ChevronLeftIcon />}
          sx={wizardPrimaryButtonSx}
          onClick={() => {
            submitConsent(state.leadId, state.phone, "legal_disclaimer", true);
            updateLead(state.leadId, state.calculationIndex, {
              abandonmentStage: "disclaimer",
            });
            dispatch({ type: "SET_LOADING", payload: true });
            if (state.designations.length > 1) {
              dispatch({ type: "SET_LOADING", payload: false });
              dispatch({
                type: "SET_CONTACT_REDIRECT",
                payload: "designations",
              });
              return;
            }
            fetch("/api/tax-rates/calculate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                citySlug: state.citySlug,
                propertyType: state.propertyPurpose,
                subType: state.subType,
                zone: state.zone,
                propertyAreaSqm: state.propertyArea,
                coveredBalconySqm: state.coveredBalconyArea,
                storageSqm: state.storageArea,
                parkingSqm: state.parkingArea,
                bimonthlyPayment: state.bimonthlyPayment,
                selectedExemptionCodes: state.selectedExemptions
                  .filter((e) => e.subSectionCode)
                  .map((e) => e.subSectionCode),
                householdSize: state.householdSize,
                childrenCount: state.childrenCount,
                correctedAreaSqm: state.measurementError?.claimed,
                designations:
                  state.propertyType === "business"
                    ? state.designations.map((d) => ({
                        typeCode: d.type,
                        subtypeCode: d.subtype,
                        zone: d.zone,
                        areaSqm: d.area,
                      }))
                    : undefined,
                additionalAreas:
                  state.additionalAreas.length > 0
                    ? state.additionalAreas
                    : undefined,
                selectedFees:
                  state.selectedFees.length > 0
                    ? state.selectedFees
                    : undefined,
              }),
            })
              .then(async (r) => {
                if (!r.ok) {
                  const body = await r.json().catch(() => ({}));
                  const detail =
                    typeof body?.error === "string"
                      ? body.error
                      : typeof body?.message === "string"
                        ? body.message
                        : `HTTP ${r.status}`;
                  throw new Error(detail);
                }
                return r.json();
              })
              .then((data) => {
                dispatch({ type: "SET_CALCULATION_RESULT", payload: data });
                dispatch({ type: "SET_LOADING", payload: false });
                // Save calculation result to lead
                updateLead(state.leadId, state.calculationIndex, {
                  abandonmentStage: "results_gate",
                  calculationResult: data,
                  calculationStatus: data.outcome,
                });
                dispatch({ type: "NEXT_STEP" });
              })
              .catch((err: unknown) => {
                dispatch({ type: "SET_LOADING", payload: false });
                dispatch({
                  type: "SET_CONTACT_REDIRECT",
                  payload: "error",
                  errorMessage:
                    err instanceof Error
                      ? err.message
                      : typeof err === "string"
                        ? err
                        : undefined,
                });
              });
          }}
        >
          לשלב הבא
        </Button>
      </Box>
    </Box>
  );
}
