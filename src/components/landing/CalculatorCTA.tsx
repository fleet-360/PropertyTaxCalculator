"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Container, Typography } from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";
import dynamic from "next/dynamic";
import { CalculatorMiaSpeechBubbleTyping } from "@/components/common/TypingText";
import CalculatorUnavailableMessage from "@/components/calculator/CalculatorUnavailableMessage";
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

  // ── Mia messages from DB ──
  const [miaMessages, setMiaMessages] = useState<
    Record<string, IMiaMessageData>
  >({});
  const [miaMessageId, setMiaMessageId] = useState<string | string[]>(
    "step-0-default",
  );

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
      .catch(() => {});
  }, []);

  const handleMiaMessage = useCallback((messageId: string | string[]) => {
    setMiaMessageId(messageId);
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
        bgcolor: "#fff",
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
                  color: "#000",
                  mb: 1.5,
                  px: { xs: 1, sm: 2, md: 0 },
                  lineHeight: { xs: 1.25, md: 1.2 },
                }}
              >
                מחשבון הארנונה
              </Typography>
            </motion.div>
            <motion.div variants={childVariants}>
              <Typography
                sx={{
                  fontSize: { xs: "14px", sm: "16px", md: "18px" },
                  color: "#000",
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
                      width: "100%", height: "100%",
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
                    sx={{
                      bgcolor: "rgba(255,255,255,0.96)",
                      borderRadius: "20px",
                      boxShadow: "0px 12px 30px rgba(0,0,0,0.2)",
                      p: { xs: 2, sm: 2.5 },
                      width: "100%",
                      textAlign: "right",
                      wordBreak: "break-word",
                      overflowWrap: "break-word",
                    }}
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
                      borderRight: "20px solid rgba(255,255,255,0.96)",
                      display: { xs: "none", md: "block" },
                    }}
                  />
                </Box>
              </Box>
            </motion.div>
          </Box>

          {/* Left side — Embedded Calculator (2/3) */}
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
              initial={reduceMotion ? undefined : { opacity: 0, x: -30 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.6 * DURATION_MULTIPLIER,
                delay: 0.2 * DURATION_MULTIPLIER,
              }}
            >
              <Box
                sx={{
                  bgcolor: "#f1f5f9",
                  border: "1px solid #d2d2d2",
                  borderRadius: "20px",
                  overflowY: "scroll",
                  p: { xs: 1.5, sm: 2, md: 3 },
                  mx: "auto",
                  width: "100%",
                  height: "600px",
                  maxWidth: "720px",
                  boxSizing: "border-box",
                }}
              >
                {featureConfig.systemEnabled ? (
                  <CalculatorWizard
                    features={featureConfig}
                    onMiaMessage={handleMiaMessage}
                  />
                ) : (
                  <CalculatorUnavailableMessage variant="embedded" />
                )}
              </Box>
            </motion.div>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
