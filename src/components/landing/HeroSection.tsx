"use client";
import { Box, Container, Typography, Button } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import Link from "next/link";
import Image from "next/image";
import heroMockup from "@/assets/hero-imac-mockup.png";

const BENEFITS = [
  "דיוק בחישוב",
  "תוצאה מיידית",
  "הכנת השגה AI",
  "חיסכון כספי",
] as const;

export default function HeroSection() {
  return (
    <Box
      id="hero"
      component="section"
      sx={(theme) => ({
        position: "relative",
        minHeight: { xs: "auto", md: "78vh" },
        pt: { xs: "120px", md: "120px" },
        pb: { xs: "80px", md: "60px" },
        overflow: "hidden",
        background: `
          radial-gradient(60% 50% at 70% 30%, rgba(61,120,240,0.45) 0%, rgba(61,120,240,0) 70%),
          radial-gradient(100% 80% at 50% 60%, ${theme.palette.brand.navyMid} 0%, ${theme.palette.brand.navyDeep} 75%)
        `,
      })}
    >
      {/* Subtle grid pattern overlay */}
      <Box
        aria-hidden="true"
        sx={(theme) => ({
          position: "absolute",
          inset: 0,
          backgroundImage: `linear-gradient(${theme.palette.brand.gridLine} 1px, transparent 1px), linear-gradient(90deg, ${theme.palette.brand.gridLine} 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
          pointerEvents: "none",
          maskImage:
            "radial-gradient(100% 70% at 50% 30%, #000 40%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(100% 70% at 50% 30%, #000 40%, transparent 100%)",
        })}
      />

      {/* White curve at bottom-left */}
      <Box
        aria-hidden="true"
        sx={{
          position: "absolute",
          bottom: -1,
          left: 0,
          width: { xs: "100%", md: "55%" },
          height: { xs: 80, md: 160 },
          bgcolor: "background.default",
          borderTopRightRadius: { xs: "60px 40px", md: "200px 120px" },
          zIndex: 1,
        }}
      />

      <Container maxWidth="xl" sx={{ position: "relative", zIndex: 2 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1.05fr 1fr" },
            alignItems: "center",
            gap: { xs: 6, md: 4, lg: 6 },
            width: "100%",
          }}
        >
          {/* Right column (RTL) — Text content */}
          <Box sx={{ color: "#fff", textAlign: { xs: "center", md: "right" } }}>
            <Typography
              component="h1"
              sx={{
                fontFamily:
                  'var(--font-heebo), "Heebo", "Inter", sans-serif',
                fontWeight: 800,
                fontSize: { xs: "42px", sm: "54px", md: "62px", lg: "76px" },
                lineHeight: 1.05,
                letterSpacing: "-1.5px",
                mb: { xs: 2, md: 3 },
                color: "#fff",
                whiteSpace: { md: "nowrap" },
              }}
            >
              מחשבון הארנונה
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: "18px", md: "24px" },
                fontWeight: 500,
                lineHeight: 1.4,
                mb: { xs: 2, md: 3 },
                color: "#fff",
                opacity: 0.95,
              }}
            >
              הדרך המהירה בישראל לחשב ארנונה.
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: { xs: 1, md: 1.5 },
                justifyContent: { xs: "center", md: "flex-start" },
                alignItems: "center",
                mb: { xs: 4, md: 5 },
                fontSize: { xs: "14px", md: "17px" },
                fontWeight: 500,
                color: "#fff",
                opacity: 0.95,
              }}
            >
              {BENEFITS.map((benefit, idx) => (
                <Box
                  key={benefit}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: { xs: 1, md: 1.5 },
                  }}
                >
                  <Box component="span">{benefit}</Box>
                  {idx < BENEFITS.length - 1 && (
                    <Box
                      aria-hidden="true"
                      component="span"
                      sx={{
                        display: "inline-block",
                        width: "1px",
                        height: { xs: "14px", md: "18px" },
                        bgcolor: "rgba(255,255,255,0.45)",
                      }}
                    />
                  )}
                </Box>
              ))}
            </Box>
            <Button
              component={Link}
              href="/calculator"
              variant="contained"
              endIcon={<ChevronLeftIcon />}
              sx={(theme) => ({
                bgcolor: theme.palette.brand.blue,
                color: "#fff",
                borderRadius: "999px",
                px: { xs: 3.5, md: 5 },
                py: { xs: 1.5, md: 2 },
                fontSize: { xs: "16px", md: "19px" },
                fontWeight: 700,
                boxShadow: "0px 14px 36px rgba(26,86,224,0.45)",
                "& .MuiButton-endIcon": { ml: 0.75, mr: -0.5 },
                "&:hover": {
                  bgcolor: theme.palette.brand.blueDark,
                  boxShadow: "0px 14px 36px rgba(26,86,224,0.6)",
                },
              })}
            >
              אני רוצה להתחיל בחישוב
            </Button>
          </Box>

          {/* Left column (RTL) — iMac mockup (real Figma asset) */}
          <Box
            sx={{
              order: { xs: -1, md: 1 },
              position: "relative",
              width: "100%",
              mb: { md: "-160px", lg: "-200px" },
            }}
          >
            <Image
              src={heroMockup}
              alt=""
              priority
              sizes="(max-width: 768px) 100vw, 55vw"
              style={{
                width: "100%",
                height: "auto",
                objectFit: "contain",
              }}
            />
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
