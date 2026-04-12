"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Container, IconButton, Tooltip, Typography } from "@mui/material";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { alpha } from "@mui/material/styles";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import dynamic from "next/dynamic";
import { CalculatorMiaSpeechBubbleTyping } from "@/components/common/TypingText";
import DocumentPreviewPopover from "@/components/common/DocumentPreviewPopover";
import CalculatorUnavailableMessage from "@/components/calculator/CalculatorUnavailableMessage";
import type { CalculatorWizardHandle } from "@/components/calculator/CalculatorWizard";
import type { CalculatorFeatureConfig } from "@/lib/types/system-config";
import type { IMiaMessageData } from "@/lib/types/mia-message";
import Image from "next/image";
import miaImage from "@/assets/mia.png";
import {
  fadeSlideUp,
  staggerContainer,
  reducedMotionVariants,
  DURATION_MULTIPLIER,
} from "@/lib/animations";
import type { SxProps, Theme } from "@mui/material/styles";

const calcButtonSx: SxProps<Theme> = {
  position: "relative",
  color: "#fff",
  minWidth: 0,
  minHeight: 1.5,
  px: 2,
  py: 1,
  borderRadius: "10px",
  background: "linear-gradient(180deg, #2f2f2f, #3f3f3f)",
  boxShadow:
    "inset -8px 0 8px rgba(0,0,0,0.15), inset 0 -8px 8px rgba(0,0,0,0.25), 0 0 0 2px rgba(0,0,0,0.75), 10px 20px 25px rgba(0,0,0,0.4)",
  userSelect: "none",
  fontWeight: 400,
  fontSize: "0.85rem",
  textTransform: "none",
  overflow: "hidden",
  "&::before": {
    content: '""',
    position: "absolute",
    top: 6,
    left: 6,
    bottom: 6,
    right: 6,
    borderRadius: "10px",
    background: "linear-gradient(90deg, #2d2d2d, #4d4d4d)",
    boxShadow:
      "-5px -5px 15px rgba(0,0,0,0.1), 10px 5px 10px rgba(0,0,0,0.15)",
    borderLeft: "1px solid rgba(0,0,0,0.27)",
    borderBottom: "1px solid rgba(0,0,0,0.27)",
    borderTop: "1px solid rgba(0,0,0,0.6)",
    pointerEvents: "none",
    zIndex: 0,
  },
  "& > *": { position: "relative", zIndex: 1 },
  "&:active": { filter: "brightness(1.5)",transform:"scale(0.95)" },
  "&:hover": { background: "linear-gradient(180deg, #3a3a3a, #4a4a4a)" },
};

function combineMiaBubbleContent(
  messageIds: string | string[],
  byId: Record<string, IMiaMessageData>,
): { title: string; description: string } | undefined {
  const ids = typeof messageIds === "string" ? [messageIds] : messageIds;
  const parts = ids
    .map((id) => byId[id])
    .filter((m): m is IMiaMessageData => Boolean(m));
  if (parts.length === 0) return undefined;
  if (parts.length === 1) {
    return { title: parts[0].title, description: parts[0].description };
  }
  const title = parts[0]?.title ?? "";
  const description = parts
    .map((m) => m.description?.trim())
    .filter((d) => d.length > 0)
    .join("\n\n");
  return { title, description };
}

const CalculatorWizard = dynamic(
  () => import("@/components/calculator/CalculatorWizard"),
  { ssr: false },
);

interface CalculatorCTAProps {
  featureConfig: CalculatorFeatureConfig;
}

export default function CalculatorSection({
  featureConfig,
}: CalculatorCTAProps) {
  const reduceMotion = useReducedMotion();
  const containerVariants = reduceMotion
    ? reducedMotionVariants
    : staggerContainer;
  const childVariants = reduceMotion ? reducedMotionVariants : fadeSlideUp;

  const wizardRef = useRef<CalculatorWizardHandle>(null);

  // ── Mia messages from DB ──
  const [miaMessages, setMiaMessages] = useState<
    Record<string, IMiaMessageData>
  >({});
  const [miaMessageId, setMiaMessageId] = useState<string | string[]>(
    "step-0-default",
  );

  // ── Ordinance URL from wizard (available after city selection) ──
  const [ordinanceUrl, setOrdinanceUrl] = useState<{ download: string, preview: string } | undefined>();

  useEffect(() => {
    fetch("/api/mia-messages")
      .then((r) => r.json())
      .then((data) => {
        const msgs: IMiaMessageData[] = data.messages ?? [];
        const map: Record<string, IMiaMessageData> = {};
        for (const m of msgs) {
          map[m.messageId] = m;
        }
        setMiaMessages(map);
      })
      .catch(() => { });
  }, []);

  const handleMiaMessage = useCallback((messageId: string | string[]) => {
    setMiaMessageId(messageId);
  }, []);

  const handleOrdinanceUrl = useCallback((url: { download: string; preview: string } | undefined) => {
    setOrdinanceUrl(url);
  }, []);

  const currentMiaMessage = useMemo(
    () => combineMiaBubbleContent(miaMessageId, miaMessages),
    [miaMessages, miaMessageId],
  );

  return (
    <Box
      id="calculator-section"
      sx={{
        py: { xs: 6, md: 10 },
        bgcolor: "background.default",
        minHeight: { xs: "auto", md: "100vh" },
      }}
    >
      <Container maxWidth="xl">
        {/* Header */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <Box sx={{ textAlign: "center", mb: { xs: 4, md: 6 } }}>
            <motion.div variants={childVariants}>
              <Typography
                component="h2"
                sx={{
                  fontFamily:
                    'var(--font-varela-round), "Varela Round", "Heebo", sans-serif',
                  fontWeight: 400,
                  fontSize: { xs: "24px", sm: "28px", md: "44px" },
                  color: "text.primary",
                  mb: 1.5,
                  px: { xs: 1, sm: 2, md: 0 },
                  lineHeight: { xs: 1.25, md: 1.2 },
                }}
              >
                מחשבון חכם
              </Typography>
            </motion.div>
            <motion.div variants={childVariants}>
              <Typography
                sx={{
                  fontSize: { xs: "14px", sm: "16px", md: "18px" },
                  color: "text.primary",
                  lineHeight: 1.5,
                  px: { xs: 1, sm: 2, md: 0 },
                  maxWidth: 640,
                  mx: "auto",
                }}
              >
                הזן את פרטי הנכס שלך וקבל חישוב מדויק תוך שניות
              </Typography>
            </motion.div>
          </Box>
        </motion.div>

        {/* Content: Calculator (2/3) + Mia bubble (1/3) */}
        <Box
          sx={{
            display: "flex",
            gap: { xs: 3, sm: 4, md: 5 },
            flexDirection: { xs: "column", md: "row" },
            alignItems: { xs: "stretch", md: "flex-start" },
            justifyContent: "center",
            width: "100%",
          }}
        >
          {/* Right side — Mia bubble + character (1/3) */}
          <Box
            sx={{
              width: "100%",
              flex: { md: "0 1 33.333%" },
              maxWidth: { md: "33.333%" },
              minWidth: 0,
            }}
          >
            <motion.div
              style={{ width: "100%" }}
              initial={reduceMotion ? undefined : { opacity: 0, x: 30 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, x: 0 }}
              viewport={{ once: false }}
              transition={{
                duration: 0.6 * DURATION_MULTIPLIER,
                delay: 0.35 * DURATION_MULTIPLIER,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 0,
                  width: "100%",
                  justifyContent: { xs: "center", md: "flex-start" },
                }}
              >
                {/* Character illustration */}
                <Box
                  sx={{
                    width: "clamp(100px, 100%, 250px)",
                    display: { xs: "none", md: "flex" },
                    alignItems: "flex-end",
                    justifyContent: "center",
                    flexShrink: 0,
                    mr: { xs: 0, md: 2 },
                  }}
                >
                  <Box
                    sx={{
                      borderRadius: "60px 60px 10px 10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "column",
                      width: "100%",
                      height: "100%",
                      gap: 1,
                    }}
                  >
                    <Image
                      src={miaImage}
                      alt="Mia"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33.333vw"
                      style={{
                        objectFit: "contain",
                        width: "100%",
                        height: "100%",
                      }}
                    />
                  </Box>
                </Box>
                {/* Speech bubble */}
                <Box
                  sx={{
                    position: "relative",
                    width: { xs: "100%", md: "auto" },
                    maxWidth: { xs: "100%", md: 340 },
                    minWidth: 0,
                  }}
                >
                  <Box
                    sx={(theme) => ({
                      bgcolor: "background.paper",
                      borderRadius: "20px",
                      border: `1.5px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                      boxShadow: "0px 8px 24px rgba(0,0,0,0.12)",
                      p: { xs: 2, sm: 2.5 },
                      width: "100%",
                      textAlign: "right",
                      wordBreak: "break-word",
                      overflowWrap: "break-word",
                    })}
                  >
                    <CalculatorMiaSpeechBubbleTyping
                      title={currentMiaMessage?.title}
                      description={currentMiaMessage?.description}
                    />
                  </Box>

                  {/* Triangle pointer */}
                  <Box
                    sx={{
                      position: "absolute",
                      left: -20,
                      top: "50%",
                      width: 0,
                      height: 0,
                      borderTop: "15px solid transparent",
                      borderBottom: "15px solid transparent",
                      borderRight: "20px solid",
                      borderRightColor: "background.paper",
                      display: { xs: "none", md: "block" },
                    }}
                  />
                </Box>
              </Box>
            </motion.div>
          </Box>

          {/* Left side — Calculator Device Frame (2/3) */}
          <Box
            sx={{
              width: "100%",
              flex: { md: "0 1 66.666%" },
              maxWidth: { md: "66.666%" },
              minWidth: 0,
            }}
          >
            <motion.div
              style={{ width: "100%" }}
              initial={
                reduceMotion ? undefined : { opacity: 0, scale: 0.97 }
              }
              whileInView={
                reduceMotion ? undefined : { opacity: 1, scale: 1 }
              }
              viewport={{ once: true }}
              transition={{
                duration: 0.7 * DURATION_MULTIPLIER,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {/* CalcBody — dark gradient with 3D shadows (CodePen style) */}
              <Box
                sx={{
                  background:
                    "linear-gradient(45deg, rgb(0,0,0), rgb(16,15,15), rgb(42,41,41), rgb(60,60,60))",
                  borderRadius: "20px",
                  borderTop: "5px solid rgb(91,90,90)",
                  borderRight: "4px solid rgb(100,102,100)",
                  boxShadow: [
                    "10px 2px 50px rgb(0,0,0)",
                    "0px -2px 4px 3px rgb(42,42,42)",
                    "inset 20px -10px 10px rgb(0,0,0)",
                    "inset 20px 15px 10px rgb(69,69,69)",
                    "inset -20px 10px 10px rgb(62,62,62)",
                    "inset -20px 1px 10px rgb(143,144,142)",
                  ].join(", "),
                  p: { xs: "10px", sm: "12px", md: "14px" },
                  pb: { xs: "18px", sm: "22px", md: "26px" },
                  mx: "auto",
                  width: "100%",
                  maxWidth: "720px",
                  boxSizing: "border-box",
                }}
              >
                {/* LCD Display — greenish screen above wizard */}
                <Box sx={{ display: "flex", width: "100%", justifyContent: "center", mb: { xs: 1, sm: 1.5 } }}>
                  <Box
                    sx={{
                      flexGrow: 1,
                      bgcolor: "rgb(124,124,124)",
                      backgroundImage:
                        "linear-gradient(160deg, rgba(80,90,70,0.5), rgba(100,110,90,0.3))",
                      backgroundBlendMode: "soft-light",
                      borderRadius: "5px",
                      p: { xs: 1, sm: 1.5 },
                      mx: { xs: 0.5, sm: 1 },
                      mb: { xs: 1, sm: 1.5 },
                      boxShadow: "inset -10px 8px 7px rgba(0,0,0,0.7)",
                      borderBottom: "2px solid #020101",
                      borderLeft: "2px solid #020101",
                      color: "rgb(255, 255, 255)",
                      fontFamily: "monospace",
                      fontSize: { xs: "16px", sm: "20px", md: "24px" },
                      fontWeight: 700,
                      textShadow: "4px 3px 3px rgb(88, 88, 88)",
                      filter: "sepia(0.6) brightness(0.6)",
                      minHeight: { xs: "36px", sm: "44px" },
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-start",
                    }}
                  >
                    מחשבון חכם
                  </Box>
                  {/* Ordinance button — styled as calculator key */}
                  <AnimatePresence >
                    {ordinanceUrl?.preview && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            gap: 1.5,
                            height: "100%",
                            pb: { xs: 1, sm: 1.5 },
                            mx: { xs: 0.5, sm: 1 },
                            mb: { xs: 1, sm: 1.5 },
                          }}
                        >
                          <DocumentPreviewPopover
                            documentUrl={ordinanceUrl.download}
                            previewSrc={ordinanceUrl.preview}
                            title="צו הארנונה"
                            triggerLabel="צפייה בצו הארנונה"
                            triggerAriaLabel="פתיחת תצוגה מקדימה של צו הארנונה"
                            downloadLabel="הורדת צו הארנונה (PDF)"
                            triggerSx={calcButtonSx}
                          />
                          <Tooltip title="איפוס מחשבון" arrow>
                            <IconButton
                              aria-label="איפוס מחשבון"
                              onClick={() => wizardRef.current?.resetCalculator()}
                              sx={calcButtonSx}
                            >
                              <RestartAltIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Box>

                {/* Brand label */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: { xs: 1, sm: 1.5 },
                    mb: { xs: 1, sm: 1.5 },
                  }}
                >

                </Box>

                {/* Main screen — wizard area */}
                <Box
                  sx={{
                    bgcolor: "#f5f5f0",
                    borderRadius: "8px",
                    height: { xs: "500px", sm: "550px", md: "600px" },
                    overflowY: "auto",
                    p: { xs: 1.5, sm: 2, md: 3 },
                    boxShadow: "inset -8px 6px 6px rgba(0,0,0,0.5)",
                    borderBottom: "2px solid #020101",
                    borderLeft: "2px solid #020101",
                  }}
                >
                  {featureConfig.systemEnabled ? (
                    <CalculatorWizard
                      ref={wizardRef}
                      features={featureConfig}
                      onMiaMessage={handleMiaMessage}
                      onOrdinanceUrl={handleOrdinanceUrl}
                    />
                  ) : (
                    <CalculatorUnavailableMessage variant="embedded" />
                  )}
                </Box>


              </Box>
            </motion.div>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
