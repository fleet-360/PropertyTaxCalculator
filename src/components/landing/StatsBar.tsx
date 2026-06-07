"use client";
import { Box, Container, Typography, Button } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import Link from "next/link";
import {
  animate,
  useMotionValue,
  useMotionValueEvent,
  useInView,
  useReducedMotion,
} from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { DURATION_MULTIPLIER } from "@/lib/animations";
import bgPattern from "@/assets/partOfHomeBackground.png";

type StatConfig = {
  target: number;
  label: string;
  prefix?: string;
  suffix?: string;
  comma?: boolean;
};

const stats: StatConfig[] = [
  { target: 20, suffix: "+", label: "רשויות מקומיות" },
  { target: 1000000, suffix: "+", comma: true, label: "פוטנציאל משתמשים" },
  { target: 5400, prefix: "₪", comma: true, label: "פוטנציאל חיסכון שנתי" },
  { target: 98, suffix: "%", label: "שאיפה לדיוק בחישוב" },
];

function formatStatValue(n: number, comma: boolean): string {
  const rounded = Math.round(n);
  return comma ? rounded.toLocaleString("en-US") : String(rounded);
}

function RollingStat({ stat, index }: { stat: StatConfig; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });
  const reduceMotion = useReducedMotion();
  const count = useMotionValue(0);
  const [display, setDisplay] = useState(0);

  useMotionValueEvent(count, "change", (latest) => {
    setDisplay(Math.round(latest));
  });

  useEffect(() => {
    if (!isInView) return;
    if (reduceMotion) {
      setDisplay(stat.target);
      return;
    }
    count.set(0);
    setDisplay(0);
    const controls = animate(count, stat.target, {
      duration: 2 * DURATION_MULTIPLIER,
      ease: [0.22, 1, 0.36, 1],
      delay: index * 0.1 * DURATION_MULTIPLIER,
    });
    return () => controls.stop();
  }, [isInView, stat.target, reduceMotion, index, count]);

  const valueText = `${stat.prefix ?? ""}${formatStatValue(display, stat.comma ?? false)}${stat.suffix ?? ""}`;

  return (
    <Box
      ref={ref}
      sx={{
        flex: 1,
        px: { xs: 0.5, md: 3 },
        py: { xs: 1.5, md: 0 },
        borderWidth: { xs: 0, sm: "0px 0px 0px 0.5px" },
        borderStyle: "solid",
        borderColor: "#FFFFFF",
        textAlign: { xs: "center", sm: "inherit" },
      }}
    >
      <Typography
        sx={{
          fontSize: { xs: "28px", sm: "36px", md: "48px" },
          fontWeight: 300,
          color: "#fff",
          lineHeight: 1.1,
          fontVariantNumeric: "tabular-nums",
          mb: 0.5,
        }}
      >
        {valueText}
      </Typography>
      <Typography
        sx={{
          fontSize: { xs: "12px", md: "15px" },
          color: "rgba(255,255,255,0.78)",
          fontWeight: 500,
        }}
      >
        {stat.label}
      </Typography>
    </Box>
  );
}

export default function StatsBar() {
  return (
    <Box
      component="section"
      sx={{
        py: { xs: 6, md: 9 },
        bgcolor: "background.default",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Continuation of the page-wide pixel-grid pattern on the sides of the
          stats card. Same contrast / blend-mode treatment as the section above. */}
      <Box
        component="img"
        src={bgPattern.src}
        alt=""
        aria-hidden="true"
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: { xs: "70%", md: "45%" },
          height: "auto",
          pointerEvents: "none",
          userSelect: "none",
          filter: "contrast(2.6) brightness(0.95)",
          mixBlendMode: "darken",
        }}
      />
      <Box
        component="img"
        src={bgPattern.src}
        alt=""
        aria-hidden="true"
        sx={{
          position: "absolute",
          top: 0,
          right: 0,
          width: { xs: "70%", md: "45%" },
          height: "auto",
          pointerEvents: "none",
          userSelect: "none",
          transform: "scaleX(-1)",
          filter: "contrast(2.6) brightness(0.95)",
          mixBlendMode: "darken",
        }}
      />

      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
        <Box
          sx={(theme) => ({
            position: "relative",
            borderRadius: { xs: "20px", md: "28px" },
            overflow: "hidden",
            // Solid navy fallback in case the video is still loading or fails to load.
            // backgroundColor: theme.palette.brand.navyDeep,
            px: { xs: 3, md: 6 },
            py: { xs: 5, md: 6 },
            boxShadow: "0 30px 60px rgba(11,26,71,0.25)",
            isolation: "isolate",
          })}
        >
          {/* Looping video texture (data/code particles) — sits at the very back. */}
          <Box
            component="video"
            src="/videos/stats-bg.mp4"
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            aria-hidden
            sx={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              zIndex: 0,
              pointerEvents: "none",
            }}
          />

          {/* Tinted gradient overlay — keeps the brand colours dominant and the text legible
              while letting the video texture shimmer through. */}
          <Box
            aria-hidden="true"
            sx={(theme) => ({
              position: "absolute",
              inset: 0,
              zIndex: 1,
              background: `
                radial-gradient(60% 100% at 50% 0%, rgba(61,120,240,0.45) 0%, rgba(61,120,240,0) 70%),
                linear-gradient(180deg, ${theme.palette.brand.navyLight}E6 0%, ${theme.palette.brand.navyMid}F2 50%, ${theme.palette.brand.navyDeep}F2 100%)
              `,
              pointerEvents: "none",
            })}
          />

          {/* Subtle grid overlay (kept for the brand grid texture). */}
          <Box
            aria-hidden="true"
            sx={(theme) => ({
              position: "absolute",
              inset: 0,
              zIndex: 2,
              backgroundImage: `linear-gradient(${theme.palette.brand.gridLine} 1px, transparent 1px), linear-gradient(90deg, ${theme.palette.brand.gridLine} 1px, transparent 1px)`,
              backgroundSize: "60px 60px",
              pointerEvents: "none",
              maskImage:
                "radial-gradient(100% 100% at 50% 30%, #000 30%, transparent 80%)",
              WebkitMaskImage:
                "radial-gradient(100% 100% at 50% 30%, #000 30%, transparent 80%)",
            })}
          />

          <Box
            sx={{ position: "relative", zIndex: 3 }}
            role="group"
            aria-label="נתונים סטטיסטיים"
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" },
                alignItems: "center",
                justifyContent: "space-between",
                mb: { xs: 4, md: 5 },
                gap: { xs: 2, sm: 1 },
                "& > *": {
                  position: "relative",
                  // dividers between stats (desktop row only)
                  "&:not(:last-of-type)::after": {
                    content: { sm: '""' },
                    position: "absolute",
                    insetInlineStart: 0,
                    top: { sm: "20%" },
                    bottom: { sm: "20%" },
                    width: "1px",
                    bgcolor: "rgba(255,255,255,0.2)",
                  },
                },
              }}
            >
              {stats.map((stat, i) => (
                <RollingStat key={stat.label} stat={stat} index={i} />
              ))}
            </Box>
          </Box>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "center", pt: 15 }}>
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
              py: { xs: 1.5, md: 1.75 },
              fontSize: { xs: "15px", md: "17px" },
              fontWeight: 500,
              boxShadow: "0px 12px 28px rgba(26,86,224,0.4)",
              "& .MuiButton-endIcon": { ml: 0.75, mr: -0.5 },
              "&:hover": {
                bgcolor: theme.palette.brand.blueDark,
                boxShadow: "0px 14px 32px rgba(26,86,224,0.55)",
              },
            })}
          >
            אני רוצה להתחיל בחישוב
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
