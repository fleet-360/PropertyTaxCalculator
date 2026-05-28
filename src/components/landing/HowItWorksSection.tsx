"use client";
import { Box, Container, Typography } from "@mui/material";
import { keyframes } from "@mui/system";
import Image from "next/image";

type Step = {
  title: string;
  /** Public-relative path to the full step illustration (parallelogram + icon + number). */
  svgSrc: string;
  /** Intrinsic SVG width (used to preserve aspect ratio). */
  svgWidth: number;
  svgHeight: number;
  delay: string;
};

const steps: Step[] = [
  {
    title: "אתם בוחרים סוג נכס ועיר",
    svgSrc: "/images/steps/step1.svg",
    svgWidth: 187,
    svgHeight: 139,
    delay: "0s",
  },
  {
    title: "מעלים את שובר הארנונה",
    svgSrc: "/images/steps/step2.svg",
    svgWidth: 179,
    svgHeight: 140,
    delay: "0.2s",
  },
  {
    title: "מסמנים פטורים והנחות שנציע עבורכם",
    svgSrc: "/images/steps/step3.svg",
    svgWidth: 180,
    svgHeight: 139,
    delay: "0.4s",
  },
  {
    title: "מחשבון הארנונה עושה חישוב",
    svgSrc: "/images/steps/step4.svg",
    svgWidth: 173,
    svgHeight: 141,
    delay: "0.6s",
  },
  {
    title: "מקבלים את התוצאה ומגישים השגה לעירייה לקבלת חיסכון",
    svgSrc: "/images/steps/step5.svg",
    svgWidth: 177,
    svgHeight: 142,
    delay: "0.8s",
  },
];

// Float animation used for the step illustrations
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
  // Display sizes — derive height from intrinsic aspect to keep each SVG accurate
  const aspect = step.svgWidth / step.svgHeight;
  const widthXs = 160;
  const widthMd = 190;

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
      {/* Floating step illustration: parallelogram + icon + number, all in one SVG */}
      <Box
        sx={{
          position: "relative",
          display: "inline-block",
          animation: `${float} 3s ease-in-out infinite`,
          animationDelay: step.delay,
          mb: { xs: "20px", md: "32px" },
          width: { xs: widthXs, md: widthMd },
          height: { xs: widthXs / aspect, md: widthMd / aspect },
        }}
      >
        <Image
          src={step.svgSrc}
          alt=""
          fill
          sizes="(max-width: 900px) 160px, 190px"
          style={{ objectFit: "contain" }}
          aria-hidden
          priority={index < 2}
        />
      </Box>

      {/* Title — color matches the bubble */}
      <Typography
        sx={{
          mt: { xs: 1, md: "16px" },
          px: 1,
          fontFamily:
            'var(--font-noto-sans-hebrew), "Noto Sans Hebrew", sans-serif',
          fontSize: { xs: "15px", md: "17px" },
          fontWeight: 600,
          lineHeight: 1.45,
          color: "#0367B7",
        }}
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
            fontFamily:
              'var(--font-noto-sans-hebrew), "Noto Sans Hebrew", sans-serif',
            fontWeight: 700,
            fontSize: "24px",
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
                key={step.svgSrc}
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
