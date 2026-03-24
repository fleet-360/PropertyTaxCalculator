"use client";
import { Box, Container, Typography } from "@mui/material";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { CalculatorMiaSpeechBubbleTyping } from "@/components/common/TypingText";

const CalculatorWizard = dynamic(
  () => import("@/components/calculator/CalculatorWizard"),
  { ssr: false },
);

export default function CalculatorSection() {
  return (
    <Box
      id="calculator-section"
      sx={{
        py: { xs: 6, md: 10 },
        bgcolor: "#fff",
        minHeight: { xs: "auto", md: "100vh" },
      }}
    >
      <Container maxWidth="lg">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Box sx={{ textAlign: "center", mb: { xs: 4, md: 6 } }}>
            <Typography
              component="h2"
              sx={{
                fontWeight: 700,
                fontSize: { xs: "24px", sm: "28px", md: "44px" },
                color: "#000",
                mb: 1.5,
                px: { xs: 1, sm: 2, md: 0 },
                lineHeight: { xs: 1.25, md: 1.2 },
              }}
            >
              מחשבון הארנונה שלך
            </Typography>
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
          </Box>
        </motion.div>

        {/* Content: Calculator + Info bubble */}
        <Box
          sx={{
            display: "flex",
            gap: { xs: 3, sm: 4, md: 7.5 },
            flexDirection: { xs: "column", md: "row" },
            alignItems: { xs: "stretch", md: "flex-start" },
            justifyContent: "center",
            width: "100%",
          }}
        >
          {/* Right side — Info bubble + character */}
          <Box
            sx={{
              width: "100%",
              maxWidth: { md: 554 },
              flex: { md: "0 1 554px" },
              minWidth: 0,
            }}
          >
            <motion.div
              style={{ width: "100%" }}
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.35 }}
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

                            {/* Character illustration placeholder */}
                            <Box
                sx={{
                  width: 150,
                  height: 433,
                  display: { xs: "none", md: "flex" },
                  alignItems: "flex-end",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {/* TODO: Replace with actual character illustration (Lottie animation or image) */}
                <Box
                  sx={{
                    width: 120,
                    height: 350,
                    bgcolor: "#e8eef6",
                    borderRadius: "60px 60px 10px 10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                    gap: 1,
                  }}
                >
                  <Box aria-hidden="true" sx={{ fontSize: "48px" }}>👩‍💼</Box>
                  <Typography
                    sx={{
                      fontSize: "11px",
                      color: "#666",
                      textAlign: "center",
                    }}
                  >
                    מיה
                    <br />
                    יועצת ארנונה
                  </Typography>
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
                  <CalculatorMiaSpeechBubbleTyping />
                </Box>

                {/* Triangle pointer */}
                <Box
                  sx={{
                    position: "absolute",
                    left: -20,
                    top: 64,
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
          {/* Left side — Embedded Calculator */}
          <Box
            sx={{
              width: "100%",
              maxWidth: { md: 500 },
              flex: { md: "0 1 500px" },
              minWidth: 0,
            }}
          >
            <motion.div
              style={{ width: "100%" }}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Box
                sx={{
                  bgcolor: "#f1f5f9",
                  border: "1px solid #d2d2d2",
                  borderRadius: "20px",
                  p: { xs: 1.5, sm: 2, md: 3 },
                  mx: "auto",
                  width: "100%",
                  minHeight: { xs: 420, sm: 460, md: 500 },
                  maxWidth: "100%",
                  boxSizing: "border-box",
                }}
              >
                <CalculatorWizard />
              </Box>
            </motion.div>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
