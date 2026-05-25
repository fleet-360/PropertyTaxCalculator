"use client";

import { useEffect } from "react";
import Image from "next/image";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import type { StepProps } from "../CalculatorWizard";
import {
  wizardInstructionSx,
  wizardPrimaryButtonSx,
  wizardPropertyCardSx,
} from "../wizardStyles";

const PROPERTY_OPTIONS = [
  {
    value: "private" as const,
    label: "בית פרטי",
    image: "/images/calculator/house.png",
  },
  {
    value: "business" as const,
    label: "נכס עסקי",
    image: "/images/calculator/shop.png",
  },
];

export default function InitialInfoStep({ state, dispatch }: StepProps) {
  useEffect(() => {
    dispatch({ type: "SET_MIA_MESSAGE", payload: "step-0-default" });
  }, [dispatch]);

  const handleSelectType = (value: "private" | "business") => {
    dispatch({ type: "SET_PROPERTY_TYPE", payload: value });
    dispatch({
      type: "SET_MIA_MESSAGE",
      payload: value === "private" ? "step-0-private" : "step-0-business",
    });
  };

  const canProceed = Boolean(state.propertyType);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        gap: { xs: 3, md: 6 },
        width: "100%",
        maxWidth: 547,
      }}
    >
      <Box sx={{ width: "100%" }}>
        <Typography sx={wizardInstructionSx}>
          בחרו את סוג הנכס אותו תרצו להוזיל
        </Typography>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            gap: { xs: 2, md: "55px" },
            flexWrap: "wrap",
          }}
        >
          {PROPERTY_OPTIONS.map(({ value, label, image }) => {
            const isSelected = state.propertyType === value;
            return (
              <Box
                key={value}
                role="button"
                aria-label={label}
                aria-pressed={isSelected}
                tabIndex={0}
                onClick={() => handleSelectType(value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSelectType(value);
                  }
                }}
                sx={wizardPropertyCardSx(isSelected)}
              >
                <Image src={image} alt="" width={216} height={192} priority />
              </Box>
            );
          })}
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          width: "100%",
          pt: 2,
        }}
      >
        <Button
          variant="contained"
          disabled={!canProceed}
          onClick={() => dispatch({ type: "NEXT_STEP" })}
          endIcon={<ChevronLeftIcon />}
          sx={wizardPrimaryButtonSx}
        >
          לשלב הבא
        </Button>
      </Box>
    </Box>
  );
}
