"use client";

import Image from "next/image";
import { Box, Container, Typography, Button } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CheckIcon from "@mui/icons-material/Check";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import type { ReactNode } from "react";
import DocumentPreviewPopover from "@/components/common/DocumentPreviewPopover";
import { wizardSidebarActionButtonSx } from "./wizardStyles";

interface StepIndicatorProps {
  displayStep: number;
  total: number;
}

/** "שלב X מתוך 5" + step dots — active step on the right (step 1 = rightmost dot). */
export function StepIndicator({ displayStep, total }: StepIndicatorProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: 1.5,
        justifyContent: "flex-end",
        mb: { xs: 3, md: 4 },
        width: "100%",
        direction: "ltr",
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "row", gap: 1.5 }} aria-hidden>
        {Array.from({ length: total }).map((_, i) => {
          const stepNum = total - i;
          const isCurrent = stepNum === displayStep;
          const isPast = stepNum < displayStep;
          return (
            <Box
              key={i}
              sx={(theme) => ({
                width: 24,
                height: 24,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                bgcolor: isPast || isCurrent ? theme.palette.brand.blueDark : "#FAFAFA",
                border:
                  isPast || isCurrent ? "none" : "1.5px solid #E9EAEB",
                boxShadow: isCurrent
                  ? `0 0 0 2px #FFFFFF, 0 0 0 4px ${theme.palette.brand.stepRing}`
                  : "none",
                transition: "all 0.2s ease",
              })}
            >
              {isPast ? (
                <CheckIcon sx={{ fontSize: 14, color: "#fff" }} />
              ) : isCurrent ? (
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: "#fff",
                  }}
                />
              ) : (
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: "#D5D7DA",
                  }}
                />
              )}
            </Box>
          );
        })}
      </Box>
      <Typography
        sx={(theme) => ({
          fontSize: "14px",
          fontWeight: 500,
          lineHeight: "20px",
          color: theme.palette.brand.textMain,
          flexShrink: 0,
        })}
      >
        שלב {displayStep} מתוך {total}
      </Typography>
    </Box>
  );
}

export interface WizardInfoCardProps {
  message?: ReactNode;
  showIllustration?: boolean;
  onReset?: () => void;
  ordinanceDocumentUrl?: string;
  ordinancePreviewSrc?: string;
  ordinanceTitle?: string;
}

function parseInfoMessage(message: ReactNode): { lead?: string; body?: ReactNode } {
  if (typeof message !== "string") {
    return { body: message };
  }
  const questionMark = message.indexOf("?");
  if (questionMark === -1) {
    return { body: message };
  }
  return {
    lead: message.slice(0, questionMark + 1).trim(),
    body: message.slice(questionMark + 1).trim(),
  };
}

/** Blue sidebar with info box, bill image overlay, and action buttons (Figma Frame 27). */
export function WizardInfoCard({
  message,
  showIllustration = true,
  onReset,
  ordinanceDocumentUrl,
  ordinancePreviewSrc,
  ordinanceTitle = "צו הארנונה",
}: WizardInfoCardProps) {
  const { lead, body } = parseInfoMessage(message);
  const hasOrdinance = Boolean(ordinanceDocumentUrl?.trim());

  return (
    <Box
      sx={(theme) => ({
        position: "relative",
        overflow: "hidden",
        borderRadius: "30px",
        width: { md: 446 },
        maxWidth: "100%",
        minHeight: { md: 540 },
        height: { md: 540 },
        bgcolor: theme.palette.brand.sidebarBg,
        display: "flex",
        flexDirection: "column",
        color: "#fff",
        isolation: "isolate",
      })}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          borderRadius: "30px",
          overflow: "hidden",
        }}
      >
        <Image
          src="/images/calculator/info-background.png"
          alt=""
          fill
          sizes="446px"
          style={{ objectFit: "cover", borderRadius: "30px" }}
          priority
        />
      </Box>

      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          flex: 1,
          p: { xs: 2.5, md: "18px 19px 24px" },
          minHeight: { md: 540 },
          direction: "rtl",
        }}
      >
        {message && (
          <Box
            sx={(theme) => ({
              bgcolor: theme.palette.brand.infoBg,
              border: `1px solid ${theme.palette.brand.infoBorder}`,
              borderRadius: "30px",
              p: 1.5,
              mb: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 1.25,
              direction: "rtl",
            })}
          >
            <Box
              sx={(theme) => ({
                width: 40,
                height: 40,
                borderRadius: "50%",
                bgcolor: theme.palette.secondary.main,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                alignSelf: "flex-start",
              })}
            >
              <InfoOutlinedIcon sx={{ fontSize: 22, color: "#fff" }} />
            </Box>
            {lead && (
              <Typography
                sx={{
                  fontSize: "15px",
                  fontWeight: 600,
                  lineHeight: "20px",
                  color: "#fff",
                  textAlign: "right",
                  width: "100%",
                }}
              >
                {lead}
              </Typography>
            )}
            {body && (
              <Typography
                sx={{
                  fontSize: "15px",
                  lineHeight: "20px",
                  color: "#fff",
                  textAlign: "right",
                  width: "100%",
                }}
              >
                {body}
              </Typography>
            )}
          </Box>
        )}

        {showIllustration && (
          <Box
            sx={{
              position: "relative",
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 200,
              my: 1,
            }}
          >
            <Box
              aria-hidden
              sx={{
                position: "absolute",
                top: "8%",
                insetInlineEnd: "6%",
                fontSize: 36,
                fontWeight: 800,
                color: "rgba(0, 85, 252, 0.55)",
                zIndex: 0,
              }}
            >
              %
            </Box>
            <Box
              aria-hidden
              sx={{
                position: "absolute",
                bottom: "18%",
                insetInlineStart: "4%",
                fontSize: 32,
                fontWeight: 800,
                color: "rgba(0, 85, 252, 0.55)",
                zIndex: 0,
              }}
            >
              +
            </Box>
            <Box
              aria-hidden
              sx={{
                position: "absolute",
                bottom: "8%",
                insetInlineEnd: "10%",
                fontSize: 28,
                fontWeight: 800,
                color: "rgba(0, 85, 252, 0.55)",
                zIndex: 0,
              }}
            >
              ×
            </Box>
            <Box
              sx={{
                position: "relative",
                zIndex: 1,
                width: "88%",
                maxWidth: 320,
                aspectRatio: "4 / 5",
                transform: "rotate(-8deg)",
                filter: "drop-shadow(0 18px 36px rgba(0,0,0,0.35))",
              }}
            >
              <Image
                src="/images/calculator/doc-bill.png"
                alt=""
                fill
                sizes="320px"
                style={{ objectFit: "contain" }}
              />
            </Box>
          </Box>
        )}

        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 1,
            justifyContent: "center",
            mt: "auto",
            pt: 2,
            direction: "rtl",
          }}
        >
          {hasOrdinance ? (
            <DocumentPreviewPopover
              documentUrl={ordinanceDocumentUrl!}
              previewSrc={ordinancePreviewSrc}
              title={ordinanceTitle}
              triggerLabel="צפיה בצו הארנונה"
              triggerAriaLabel="צפיה בצו הארנונה"
              triggerVariant="outlined"
              triggerStartIcon={<DescriptionOutlinedIcon sx={{ fontSize: 16 }} />}
              triggerSx={wizardSidebarActionButtonSx}
            />
          ) : (
            <Button
              variant="outlined"
              disabled
              startIcon={<DescriptionOutlinedIcon sx={{ fontSize: 16 }} />}
              sx={wizardSidebarActionButtonSx}
            >
              צפיה בצו הארנונה
            </Button>
          )}
          {onReset && (
            <Button
              variant="outlined"
              onClick={onReset}
              startIcon={<RestartAltIcon sx={{ fontSize: 16 }} />}
              sx={wizardSidebarActionButtonSx}
            >
              איפוס מחשבון
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export type WizardLayoutVariant = "default" | "centered" | "fullWidth";

export interface WizardLayoutProps {
  displayStep: number;
  totalSteps?: number;
  title: ReactNode;
  subtitle?: ReactNode;
  infoMessage?: ReactNode;
  hideInfoCard?: boolean;
  layoutVariant?: WizardLayoutVariant;
  hideStepChrome?: boolean;
  onResetCalculator?: () => void;
  ordinanceDocumentUrl?: string;
  ordinancePreviewSrc?: string;
  ordinanceTitle?: string;
  children: ReactNode;
}

/**
 * Calculator wizard shell — sidebar left, content right (LTR grid + RTL text in content).
 */
export default function WizardLayout({
  displayStep,
  totalSteps = 5,
  title,
  subtitle,
  infoMessage,
  hideInfoCard = false,
  layoutVariant = "default",
  hideStepChrome = false,
  onResetCalculator,
  ordinanceDocumentUrl,
  ordinancePreviewSrc,
  ordinanceTitle,
  children,
}: WizardLayoutProps) {
  const isCentered = layoutVariant === "centered";
  const isFullWidth = layoutVariant === "fullWidth" || hideInfoCard;

  if (isCentered) {
    return (
      <Box sx={{ bgcolor: "#FFFFFF", width: "100%" }}>
        <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 }, bgcolor: "#FFFFFF" }}>
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Typography
              component="h1"
              sx={(theme) => ({
                fontWeight: 700,
                fontSize: { xs: "20px", md: "24px" },
                lineHeight: 1,
                color: theme.palette.brand.scanTitle,
                mb: 1,
              })}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography
                sx={(theme) => ({
                  fontSize: { xs: "16px", md: "18px" },
                  color: theme.palette.brand.textMain,
                })}
              >
                {subtitle}
              </Typography>
            )}
          </Box>

          <Box
            sx={{
              position: "relative",
              borderRadius: "30px",
              border: "1px solid",
              borderColor: "divider",
              overflow: "hidden",
              minHeight: 320,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              p: { xs: 2, md: 3 },
              backgroundImage: `repeating-linear-gradient(
                0deg,
                transparent,
                transparent 18px,
                rgba(0,0,0,0.03) 18px,
                rgba(0,0,0,0.03) 19px
              )`,
            }}
          >
            <Box
              sx={{
                position: "relative",
                zIndex: 1,
                width: "100%",
                maxWidth: 645,
                bgcolor: "background.paper",
                borderRadius: "20px",
                p: 3,
                boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
              }}
            >
              {children}
            </Box>
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: "#FFFFFF", width: "100%" }}>
      <Container
        maxWidth="lg"
        sx={{
          py: { xs: 4, md: 7 },
          bgcolor: "#FFFFFF",
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: isFullWidth ? "1fr" : "minmax(320px, 446px) minmax(0, 1.05fr)",
            },
            gap: { xs: 4, md: 5 },
            alignItems: "stretch",
            direction: "ltr",
          }}
        >
          {!hideInfoCard && (
            <Box sx={{ display: { xs: "none", md: "block" } }}>
              <WizardInfoCard
                message={infoMessage}
                onReset={onResetCalculator}
                ordinanceDocumentUrl={ordinanceDocumentUrl}
                ordinancePreviewSrc={ordinancePreviewSrc}
                ordinanceTitle={ordinanceTitle}
              />
            </Box>
          )}

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
              direction: "rtl",
            }}
          >
            {!hideStepChrome && (
              <>
                <StepIndicator displayStep={displayStep} total={totalSteps} />
                {title ? (
                  <Typography
                    component="h1"
                    sx={(theme) => ({
                      fontWeight: 700,
                      fontSize: { xs: "26px", md: "32px" },
                      lineHeight: { xs: 1.2, md: "44px" },
                      color: theme.palette.brand.textMain,
                      mb: subtitle ? 1.25 : 3,
                      textAlign: "right",
                    })}
                  >
                    {title}
                  </Typography>
                ) : null}
                {subtitle && (
                  <Typography
                    sx={(theme) => ({
                      fontSize: { xs: "16px", md: "18px" },
                      lineHeight: { md: "24px" },
                      color: theme.palette.brand.textMain,
                      mb: { xs: 3, md: 4 },
                      textAlign: "right",
                    })}
                  >
                    {subtitle}
                  </Typography>
                )}
              </>
            )}
            <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
