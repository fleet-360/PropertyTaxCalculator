"use client";
import { Box, Container, Typography } from "@mui/material";
import { keyframes } from "@mui/system";
import Image from "next/image";
import type { Theme } from "@mui/material/styles";

type ColorKey = "blue" | "orange" | "green" | "indigo" | "red";

type Step = {
  number: string;
  title: string;
  /** Public-relative path to the icon SVG (rendered inside the bubble). */
  iconSrc: string;
  /** Intrinsic icon width — height is derived from the SVG aspect ratio. */
  iconWidth: number;
  iconHeight: number;
  colorKey: ColorKey;
  delay: string;
};

const steps: Step[] = [
  {
    number: "01",
    title: "אתם בוחרים סוג נכס ועיר",
    iconSrc: "/images/how%20it%20works/checkmark.svg",
    iconWidth: 45,
    iconHeight: 44,
    colorKey: "blue",
    delay: "0s",
  },
  {
    number: "02",
    title: "מעלים את שובר הארנונה",
    iconSrc: "/images/how%20it%20works/camera.svg",
    iconWidth: 45,
    iconHeight: 44,
    colorKey: "orange",
    delay: "0.2s",
  },
  {
    number: "03",
    title: "מסמנים פטורים והנחות שנציע עבורכם",
    iconSrc: "/images/how%20it%20works/dollar.svg",
    iconWidth: 49,
    iconHeight: 31,
    colorKey: "green",
    delay: "0.4s",
  },
  {
    number: "04",
    title: "מחשבון הארנונה עושה חישוב",
    iconSrc: "/images/how%20it%20works/calculator.svg",
    iconWidth: 49,
    iconHeight: 31,
    colorKey: "indigo",
    delay: "0.6s",
  },
  {
    number: "05",
    title: "מקבלים את התוצאה ומגישים השגה לעירייה לקבלת חיסכון",
    iconSrc: "/images/how%20it%20works/target.svg",
    iconWidth: 45,
    iconHeight: 44,
    colorKey: "red",
    delay: "0.8s",
  },
];

// Float animation used for the numbers and the icon bubbles
const float = keyframes`
  0%   { transform: translateY(0px); }
  50%  { transform: translateY(-14px); }
  100% { transform: translateY(0px); }
`;

// Soft pulse for the dashed connector arrows
const arrowPulse = keyframes`
  from { opacity: 0.15; }
  to   { opacity: 0.85; }
`;

function StepCard({ step, index }: { step: Step; index: number }) {
  // Cards at odd index (2nd, 4th) drop down to create the zigzag pattern
  const isDropped = index % 2 === 1;
  // Render the icon at ~58px height max while preserving aspect ratio
  const ICON_MAX = { xs: 48, md: 60 };
  const aspect = step.iconWidth / step.iconHeight;

  return (
    <Box
      className="cardWork"
      sx={{
        position: "relative",
        zIndex: 2,
        textAlign: "center",
        flex: { md: "0 0 200px" },
        maxWidth: { xs: 260, md: 220 },
        width: "100%",
        mt: { xs: 0, md: isDropped ? "124px" : 0 },
      }}
    >
      {/* Large translucent step number — tilted to look like it's written on the diamond's side */}
      <Box
        sx={{
          display: "block",
          textAlign: "right",
          mb: "-22px",
          mr: { xs: "8px", md: "6px" },
          animation: `${float} 3s ease-in-out infinite`,
          animationDelay: step.delay,
        }}
      >
        <Typography
          component="span"
          sx={() => ({
            display: "inline-block",
            fontFamily: '"Inter", var(--font-heebo), sans-serif',
            fontSize: { xs: "44px", md: "62px" },
            fontWeight: 700,
            lineHeight: 0.9,
            letterSpacing: "-2px",
            color: "#0367B7",
            transform: "rotate(-30deg) skewX(-30deg)",
            transformOrigin: "right bottom",
          })}
        >
          {step.number}
        </Typography>
      </Box>

      {/* Icon parallelogram + shadow ellipse (the "imgBox") */}
      <Box
        sx={{
          position: "relative",
          display: "inline-block",
          mb: { xs: "32px", md: "50px" },
          zIndex: 5,
        }}
      >
        {/* Outer wrapper handles the floating animation so the inner skew is preserved */}
        <Box
          sx={{
            position: "relative",
            display: "inline-block",
            animation: `${float} 3s ease-in-out infinite`,
            animationDelay: step.delay,
          }}
        >
          {/* Dark blue base layer — peeks out beneath the main shape to create a 3D lifted effect */}
          <Box
            aria-hidden
            sx={(theme) => ({
              position: "absolute",
              top: { xs: "8px", md: "10px" },
              left: 0,
              width: { xs: 128, md: 152 },
              height: { xs: 128, md: 132 },
              borderRadius: "22px",
              backgroundColor: theme.palette.brand.blueDark,
              transform: "rotate(-40deg) skewX(-10deg)",
              boxShadow: `0 10px 22px ${theme.palette.brand.blueDark}33`,
              zIndex: 4,
              pointerEvents: "none",
            })}
          />
          <Box
            className="step-bubble"
            sx={(theme) => {
              return {
                position: "relative",
                width: { xs: 128, md: 152 },
                height: { xs: 128, md: 132 },
                borderRadius: "22px",
                backgroundColor: theme.palette.background.paper,
                backgroundImage: `linear-gradient(135deg, #0367B714 0%, #0367B706 60%, ${theme.palette.background.paper} 100%)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 5,
                transform: "rotate(-40deg) skewX(-10deg)",
                boxShadow: `0 14px 32px #0367B726, inset 0 1px 0 #0367B710`,
                transition:
                  "transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.4s ease",
                "&:hover": {
                  transform: "rotate(-40deg) skewX(-10deg) scale(1.06)",
                  boxShadow: `0 18px 40px #0367B740, inset 0 1px 0 #0367B720`,
                },
              };
            }}
          >
            {/* Counter-transform so the icon stays upright inside the tilted shape */}
            <Box
              sx={{
                position: "relative",
                transform: "skewX(10deg) rotate(40deg)",
                width: {
                  xs: aspect >= 1 ? ICON_MAX.xs : ICON_MAX.xs * aspect,
                  md: aspect >= 1 ? ICON_MAX.md : ICON_MAX.md * aspect,
                },
                height: {
                  xs: aspect >= 1 ? ICON_MAX.xs / aspect : ICON_MAX.xs,
                  md: aspect >= 1 ? ICON_MAX.md / aspect : ICON_MAX.md,
                },
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Image
                src={step.iconSrc}
                alt=""
                fill
                sizes="60px"
                style={{ objectFit: "contain" }}
                aria-hidden
              />
            </Box>
          </Box>
        </Box>

        {/* Soft ground shadow beneath the lifted parallelogram */}
        <Box
          aria-hidden
          sx={(theme) => ({
            position: "absolute",
            bottom: { xs: "-20px", md: "-26px" },
            left: "50%",
            transform: "translateX(-50%)",
            width: { xs: 130, md: 160 },
            height: { xs: 14, md: 18 },
            borderRadius: "50%",
            background: `radial-gradient(ellipse at center, ${theme.palette.brand.blueDark}33 0%, transparent 70%)`,
            filter: "blur(5px)",
            zIndex: 1,
            pointerEvents: "none",
          })}
        />
      </Box>

      {/* Title — color matches the bubble */}
      <Typography
        sx={(theme) => ({
          mt: { xs: 1, md: "16px" },
          px: 1,
          fontFamily: 'var(--font-heebo), "Noto Sans Hebrew", sans-serif',
          fontSize: { xs: "15px", md: "17px" },
          fontWeight: 600,
          lineHeight: 1.45,
          color: "#0367B7",
        })}
      >
        {step.title}
      </Typography>
    </Box>
  );
}

/**
 * Dashed zigzag connector that follows the alternating step layout.
 * Drawn on desktop only — mobile stacks vertically.
 *
 * Lines use vector-effect="non-scaling-stroke" so the dash pattern keeps
 * a consistent visual weight regardless of horizontal stretch.
 *
 * Coordinate system: viewBox 1200x280
 *  - "high" cards center their bubble around y = 90
 *  - "dropped" cards (124px down) center around y = 214
 *  - 5 cards spaced evenly across the x-axis
 */
function StepsConnector() {
  const xs = [120, 360, 600, 840, 1080];
  const yHigh = 90;
  const yLow = 214;
  const ys = xs.map((_, i) => (i % 2 === 0 ? yHigh : yLow));

  const segments = xs.slice(0, -1).map((x1, i) => {
    const x2 = xs[i + 1];
    const y1 = ys[i];
    const y2 = ys[i + 1];
    return `M ${x1} ${y1} L ${x2} ${y2}`;
  });

  // Midpoints of each segment, used to place pulsing dot markers
  const midpoints = segments.map((_, i) => ({
    cx: (xs[i] + xs[i + 1]) / 2,
    cy: (ys[i] + ys[i + 1]) / 2,
    delay: `${i * 0.3}s`,
  }));

  return (
    <Box
      aria-hidden
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        width: "100%",
        height: "100%",
        display: { xs: "none", md: "block" },
        zIndex: 0,
        pointerEvents: "none",
      }}
    >
      <Box
        component="svg"
        viewBox="0 0 1200 280"
        preserveAspectRatio="none"
        sx={(theme) => ({
          width: "100%",
          height: "100%",
          "& .conn-line": {
            stroke: theme.palette.brand.borderField,
            strokeWidth: 2.5,
            strokeLinecap: "round",
            strokeDasharray: "2 12",
            fill: "none",
          },
          "& .conn-dot": {
            fill: theme.palette.brand.borderBtn,
            animation: `${arrowPulse} 1.6s ease-in-out alternate infinite`,
            transformOrigin: "center",
          },
        })}
      >
        {segments.map((d, i) => (
          <path
            key={i}
            d={d}
            className="conn-line"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {midpoints.map((p, i) => (
          <circle
            key={`dot-${i}`}
            cx={p.cx}
            cy={p.cy}
            r={6}
            className="conn-dot"
            style={{ animationDelay: p.delay }}
          />
        ))}
      </Box>
    </Box>
  );
}

export default function HowItWorksSection() {
  return (
    <Box
      component="section"
      sx={{
        py: { xs: 6, md: 10 },
        bgcolor: "background.paper",
        overflow: "hidden",
      }}
    >
      <Container maxWidth="lg">
        <Typography
          component="h2"
          sx={(theme) => ({
            fontFamily: 'var(--font-heebo), "Heebo", sans-serif',
            fontWeight: 800,
            fontSize: { xs: "26px", md: "38px" },
            color: theme.palette.brand.navyDeep,
            textAlign: "center",
            mb: { xs: 5, md: 8 },
            letterSpacing: "-0.3px",
          })}
        >
          זה לוקח כמה רגעים ויש תוצאה!
        </Typography>

        {/* Steps wrapper — provides the relative context for the connector */}
        <Box
          sx={{
            position: "relative",
            maxWidth: 1180,
            mx: "auto",
            minHeight: { md: 420 },
            pt: { md: 2 },
            pb: { md: 6 },
          }}
        >
          <StepsConnector />

          <Box
            component="ul"
            sx={{
              listStyle: "none",
              p: 0,
              m: 0,
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: { xs: "center", md: "flex-start" },
              justifyContent: { md: "space-between" },
              gap: { xs: 5, md: 0 },
              position: "relative",
              zIndex: 1,
              width: "100%",
            }}
          >
            {steps.map((step, i) => (
              <Box
                component="li"
                key={step.number}
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  width: { xs: "100%", md: "auto" },
                }}
              >
                <StepCard step={step} index={i} />
              </Box>
            ))}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
