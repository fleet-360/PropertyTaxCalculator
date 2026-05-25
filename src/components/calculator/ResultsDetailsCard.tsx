"use client";

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
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import type { AreaBreakdownItem, AppliedFee } from "@/lib/types/calculator";
import { wizardResultsCardSx } from "./wizardStyles";

export interface ResultsDetailsCardProps {
  reported: number;
  calculated: number;
  biMonthlySavings: number;
  annualSavings: number;
  tenYearSavings: number;
  areaBreakdown?: AreaBreakdownItem[];
  appliedFees?: AppliedFee[];
  totalFeesBimonthly?: number;
  /**
   * When true, the numeric content (annual savings amount, tables, breakdown,
   * fees) is rendered behind a CSS blur and is not interactive. The card
   * heading and labels remain visible so the user knows what is hidden.
   */
  blurred?: boolean;
  /** Optional DOM id applied to the printable wrapper (used by the print hook). */
  printableId?: string;
}

/**
 * Detailed calculator results card. Shared between the paywalled
 * `ResultsGateStep` (blurred) and the post-payment `ResultsDisplayStep`
 * (unblurred) so the same data layout is used in both places.
 */
export default function ResultsDetailsCard({
  reported,
  calculated,
  biMonthlySavings,
  annualSavings,
  tenYearSavings,
  areaBreakdown,
  appliedFees,
  totalFeesBimonthly,
  blurred = false,
  printableId,
}: ResultsDetailsCardProps) {
  const rows = [
    {
      label: "סכום לחודשיים (מדווח)",
      value: `${reported.toLocaleString()} ₪`,
      highlight: false,
    },
    {
      label: "סכום לחודשיים (לפי המחשבון)",
      value: `${calculated.toLocaleString()} ₪`,
      highlight: false,
    },
    {
      label: "הנחה לחודשיים",
      value: `${biMonthlySavings.toLocaleString()} ₪`,
      highlight: false,
    },
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

  const blurSx = blurred
    ? {
        filter: "blur(8px)",
        userSelect: "none" as const,
        pointerEvents: "none" as const,
      }
    : undefined;

  return (
    <Box sx={[wizardResultsCardSx as any, { position: "relative" }]}>
      <Stack
        direction="row-reverse"
        spacing={2}
        alignItems="flex-start"
        sx={{ mb: 3 }}
      >
        <DescriptionOutlinedIcon
          sx={{ fontSize: 40, color: "action.disabled" }}
        />
        <Box sx={{ flex: 1 }}>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: { xs: "26px", md: "28px" },
              lineHeight: "36px",
              mb: 1,
            }}
          >
            תוצאות המחשבון:
          </Typography>
          <Typography
            sx={{ fontWeight: 500, fontSize: { xs: "17px", md: "18px" } }}
          >
            גובה ההנחה השנתי שמגיע לך:
          </Typography>
          <Typography
            aria-hidden={blurred || undefined}
            sx={(theme) => ({
              fontWeight: 500,
              fontSize: { xs: "36px", md: "40px" },
              lineHeight: 1.15,
              mt: 1,
              color:
                annualSavings > 0
                  ? theme.palette.brand.successGreen
                  : theme.palette.brand.textMain,
              ...(blurSx ?? {}),
            })}
          >
            ₪{Math.max(0, annualSavings).toLocaleString("he-IL")}
          </Typography>
        </Box>
      </Stack>

      <Box id={printableId} sx={blurSx} aria-hidden={blurred || undefined}>
        <TableContainer
          sx={{ mb: areaBreakdown?.length || appliedFees?.length ? 3 : 0 }}
        >
          <Table size="small">
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.label}>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      border: 0,
                      py: 1.5,
                      fontSize: { xs: "15px", md: "16px" },
                    }}
                  >
                    {row.label}
                  </TableCell>
                  <TableCell
                    align="left"
                    sx={{
                      border: 0,
                      py: 1.5,
                      fontSize: { xs: "15px", md: "16px" },
                    }}
                  >
                    {row.highlight ? (
                      <Chip
                        label={row.value}
                        sx={(theme) => ({
                          bgcolor: theme.palette.brand.successGreen,
                          color: "#fff",
                          fontWeight: 600,
                          fontSize: "16px",
                          height: 32,
                          borderRadius: "16px",
                          px: 0.5,
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
            <Typography sx={{ fontWeight: 600, fontSize: "18px", mb: 1 }}>
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
                      <TableCell align="left">
                        {item.baseRatePerSqm} ₪
                      </TableCell>
                      <TableCell align="left">
                        {item.discountPercent > 0
                          ? `${item.discountPercent}%`
                          : "—"}
                      </TableCell>
                      <TableCell align="left">
                        {item.effectiveRatePerSqm} ₪
                      </TableCell>
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
            <Typography sx={{ fontWeight: 600, fontSize: "18px", mb: 1 }}>
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
                      <TableCell align="left">
                        {fee.amount.toLocaleString()} ₪
                      </TableCell>
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
                      <TableCell sx={{ fontWeight: 600 }}>
                        סה&quot;כ אגרות
                      </TableCell>
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
  );
}
