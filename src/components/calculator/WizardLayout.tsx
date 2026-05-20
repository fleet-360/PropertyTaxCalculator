"use client";

import { Box, Container, Typography } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import type { ReactNode } from "react";

interface StepIndicatorProps {
  /** Display step (1..total) */
  displayStep: number;
  /** Total number of display steps */
  total: number;
}

/** "שלב X מתוך 5" + dots, RTL-aware. */
export function StepIndicator({ displayStep, total }: StepIndicatorProps) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        justifyContent: "flex-end",
        mb: { xs: 3, md: 4 },
      }}
    >
      <Typography
        sx={(theme) => ({
          fontSize: { xs: "15px", md: "17px" },
          fontWeight: 700,
          color: theme.palette.brand.navyDeep,
        })}
      >
        שלב {displayStep} מתוך {total}
      </Typography>
      <Box sx={{ display: "flex", gap: 0.75 }} aria-hidden>
        {Array.from({ length: total }).map((_, i) => {
          const stepNum = i + 1;
          const isCurrent = stepNum === displayStep;
          const isPast = stepNum < displayStep;
          return (
            <Box
              key={i}
              sx={(theme) => ({
                width: isCurrent ? 14 : 10,
                height: isCurrent ? 14 : 10,
                borderRadius: "50%",
                bgcolor: isCurrent
                  ? theme.palette.brand.blue
                  : isPast
                    ? theme.palette.brand.blueLight
                    : "#d6dbe8",
                border: isCurrent
                  ? `2px solid ${theme.palette.brand.blue}`
                  : "none",
                transition: "all 0.2s ease",
              })}
            />
          );
        })}
      </Box>
    </Box>
  );
}

interface WizardInfoCardProps {
  /** Bubble content above the bill illustration */
  message?: ReactNode;
  /** Show paper-bill illustration below message */
  showIllustration?: boolean;
}

/** Navy info card with optional Mia bubble + bill illustration (matches Figma left-column). */
export function WizardInfoCard({ message, showIllustration = true }: WizardInfoCardProps) {
  return (
    <Box
      aria-hidden={!message}
      sx={(theme) => ({
        position: "relative",
        overflow: "hidden",
        borderRadius: 3,
        p: { xs: 3, md: 4 },
        minHeight: { md: 540 },
        background: `radial-gradient(70% 60% at 30% 20%, ${theme.palette.brand.navyLight} 0%, ${theme.palette.brand.navyMid} 50%, ${theme.palette.brand.navyDeep} 100%)`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        color: "#fff",
        boxShadow: "0 16px 40px rgba(11,26,71,0.18)",
      })}
    >
      {/* Subtle grid pattern overlay */}
      <Box
        aria-hidden
        sx={(theme) => ({
          position: "absolute",
          inset: 0,
          backgroundImage: `linear-gradient(${theme.palette.brand.gridLine} 1px, transparent 1px), linear-gradient(90deg, ${theme.palette.brand.gridLine} 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
          maskImage:
            "radial-gradient(80% 60% at 50% 30%, #000 30%, transparent 90%)",
          WebkitMaskImage:
            "radial-gradient(80% 60% at 50% 30%, #000 30%, transparent 90%)",
          pointerEvents: "none",
        })}
      />

      {/* Mia-style message bubble */}
      {message && (
        <Box
          sx={{
            position: "relative",
            zIndex: 1,
            bgcolor: "rgba(11,26,71,0.5)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 2,
            p: 2.25,
            mb: 3,
            backdropFilter: "blur(2px)",
          }}
        >
          <Box
            sx={(theme) => ({
              position: "absolute",
              top: -12,
              right: -12,
              width: 30,
              height: 30,
              borderRadius: "8px",
              bgcolor: theme.palette.secondary.main,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
            })}
          >
            <InfoOutlinedIcon sx={{ fontSize: 18 }} />
          </Box>
          <Typography
            sx={{
              fontSize: { xs: "13px", md: "14px" },
              lineHeight: 1.6,
              color: "rgba(255,255,255,0.95)",
              textAlign: "right",
            }}
          >
            {message}
          </Typography>
        </Box>
      )}

      {/* Paper bill illustration */}
      {showIllustration && (
        <Box
          sx={{
            position: "relative",
            zIndex: 1,
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 220,
          }}
        >
          <Box
            component="svg"
            viewBox="0 0 220 280"
            sx={{
              width: "85%",
              maxWidth: 240,
              filter: "drop-shadow(0 18px 36px rgba(0,0,0,0.35))",
              transform: "rotate(-8deg)",
            }}
            aria-hidden
          >
            <defs>
              <linearGradient id="paperGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#e8ecf5" />
              </linearGradient>
            </defs>
            <rect x="14" y="14" width="192" height="252" rx="8" fill="url(#paperGrad)" />
            {/* header */}
            <rect x="28" y="28" width="86" height="10" rx="2" fill="#c5cde2" />
            <rect x="28" y="44" width="60" height="6" rx="2" fill="#dde3f3" />
            {/* table-ish lines */}
            {[70, 86, 102, 118, 134, 150, 166].map((y, i) => (
              <g key={i}>
                <rect x="28" y={y} width="60" height="4" rx="1" fill="#dde3f3" />
                <rect x="118" y={y} width="74" height="4" rx="1" fill="#eef2fa" />
              </g>
            ))}
            {/* footer block */}
            <rect x="28" y="188" width="164" height="60" rx="4" fill="#eef2fa" />
            <rect x="36" y="200" width="80" height="6" rx="2" fill="#c5cde2" />
            <rect x="36" y="214" width="120" height="6" rx="2" fill="#dde3f3" />
            <rect x="36" y="228" width="100" height="6" rx="2" fill="#dde3f3" />
          </Box>
          {/* Floating % and + symbols */}
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              top: "12%",
              left: "8%",
              fontSize: 36,
              fontWeight: 800,
              color: "rgba(255,255,255,0.35)",
            }}
          >
            %
          </Box>
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              bottom: "10%",
              right: "8%",
              fontSize: 32,
              fontWeight: 800,
              color: "rgba(255,255,255,0.3)",
            }}
          >
            +
          </Box>
        </Box>
      )}
    </Box>
  );
}

export interface WizardLayoutProps {
  /** Display step number (1..total). Used in indicator. */
  displayStep: number;
  /** Total display steps. */
  totalSteps?: number;
  /** Title shown at top of right column. */
  title: ReactNode;
  /** Subtitle shown under title. */
  subtitle?: ReactNode;
  /** Info card message (Mia speech bubble). */
  infoMessage?: ReactNode;
  /** Hide the info card entirely (for ResultsDisplay etc.). */
  hideInfoCard?: boolean;
  /** Right column content (form / selection / etc.) */
  children: ReactNode;
}

/**
 * Standard two-column wizard layout matching Figma:
 *  - Right (RTL): step indicator, title, subtitle, content slot.
 *  - Left: navy info card with Mia bubble + paper-bill illustration.
 */
export default function WizardLayout({
  displayStep,
  totalSteps = 5,
  title,
  subtitle,
  infoMessage,
  hideInfoCard = false,
  children,
}: WizardLayoutProps) {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 7 } }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: hideInfoCard ? "1fr" : "1.05fr 1fr" },
          gap: { xs: 4, md: 5 },
          alignItems: "stretch",
        }}
      >
        {/* Right column (RTL first) — content */}
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          <StepIndicator displayStep={displayStep} total={totalSteps} />

          <Typography
            component="h1"
            sx={(theme) => ({
              fontFamily: 'var(--font-heebo), "Heebo", sans-serif',
              fontWeight: 800,
              fontSize: { xs: "26px", md: "34px" },
              color: theme.palette.brand.navyDeep,
              lineHeight: 1.2,
              letterSpacing: "-0.4px",
              mb: subtitle ? 1.5 : 3,
            })}
          >
            {title}
          </Typography>

          {subtitle && (
            <Typography
              sx={{
                fontSize: { xs: "14px", md: "16px" },
                color: "#5a6788",
                lineHeight: 1.6,
                mb: { xs: 3, md: 4 },
              }}
            >
              {subtitle}
            </Typography>
          )}

          <Box sx={{ flex: 1 }}>{children}</Box>
        </Box>

        {/* Left column — navy info card */}
        {!hideInfoCard && (
          <Box sx={{ display: { xs: "none", md: "block" } }}>
            <WizardInfoCard message={infoMessage} />
          </Box>
        )}
      </Box>
    </Container>
  );
}
