"use client";
import { Box, Container, Typography, Button } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import Link from "next/link";
import Image from "next/image";
import heroMockup from "@/assets/hero-imac-mockup.png";
import heroBg from "@/assets/heroBackgroundcolor.jpg";

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
        pb: { xs: "30px", md: "20px" },
        // overflow: "hidden",
        // Solid navy fallback (in case the image is still loading or fails).
        // Background photo (gradient + grid texture baked in).
        backgroundImage: `url(${heroBg.src})`,
        backgroundSize: "cover",
        backgroundPosition: "right center",
        backgroundRepeat: "no-repeat",
        opacity: 0.9,
      })}
    >
      {/* One continuous, smooth wave at the bottom of the hero — high on the
          LEFT, gently descending to the RIGHT. A single cubic-bezier guarantees
          a clean curve with no artefacts (peaks around x=15%, y=18% then sweeps
          down to x=100%, y=78%). */}
      <Box
        aria-hidden="true"
        component="svg"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        sx={(theme) => ({
          position: "absolute",
          bottom: -1,
          left: 0,
          width: "100%",
          height: { xs: 100, md: 160 },
          display: "block",
          zIndex: 1,
          color: theme.palette.background.default,
          overflow: "visible",
        })}
      >
        <path
          d="M0,320 L0,-200 C 400,600 800,280 3840,-1600 L3440,320 Z"
          fill="currentColor"
        />
      </Box>

      <Container maxWidth="xl" sx={{ position: "relative", zIndex: 2 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1.05fr 1fr" },
            alignItems: "center",
            gap: { xs: 4, md: 1, lg: 1 },
            width: "100%",
          }}
        >
          {/* Right column (RTL) — Text content */}
          <Box
            sx={{
              color: "#fff",
              textAlign: { xs: "center", md: "left" },
              alignSelf: { xs: "center", md: "flex-start" },
            }}
          >
            <Typography
              component="h1"
              sx={{
                fontFamily: 'var(--font-noto-sans-hebrew), "Noto Sans Hebrew", sans-serif',
                fontWeight: 800,
                fontSize: { xs: "42px", sm: "54px", md: "62px", lg: "76px" },
                lineHeight: 1.55,
                letterSpacing: "-1.5px",
                mt: { xs: 1, md: 1 },
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
                lineHeight: 0.4,
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
                mb: { xs: 2, md: 3 },
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
                px: { xs: 1, md: 2 },
                py: { xs: 1.5, md: 2 },
                fontSize: { xs: "12px", md: "14px" },
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
              mt: { xs: 6, md: 8 },
              zIndex: 3,
            }}
          >
            <Image
              src={heroMockup}
              alt=""
              priority
              unoptimized
              sizes="(max-width: 768px) 100vw, 55vw"
              style={{
                width: "105%",
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
