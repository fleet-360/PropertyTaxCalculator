"use client";
import { Box, Container, Typography } from "@mui/material";
import TouchAppOutlinedIcon from "@mui/icons-material/TouchAppOutlined";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import CalculateOutlinedIcon from "@mui/icons-material/CalculateOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import type { SvgIconComponent } from "@mui/icons-material";

type Step = {
  number: string;
  title: string;
  Icon: SvgIconComponent;
  /** Vertical offset relative to baseline (px). Creates zigzag layout. */
  offsetY: number;
};

const steps: Step[] = [
  { number: "01", title: "אתם בוחרים סוג נכס ועיר", Icon: TouchAppOutlinedIcon, offsetY: 0 },
  { number: "02", title: "מעלים את שובר הארנונה", Icon: CloudUploadOutlinedIcon, offsetY: 60 },
  { number: "03", title: "מסמנים פטורים והנחות שנציע עבורכם", Icon: LocalOfferOutlinedIcon, offsetY: 0 },
  { number: "04", title: "מחשבון הארנונה עושה חישוב", Icon: CalculateOutlinedIcon, offsetY: 60 },
  { number: "05", title: "מקבלים את התוצאה ומגישים השגה לעירייה לקבלת חיסכון", Icon: EmojiEventsOutlinedIcon, offsetY: 0 },
];

function StepCard({ step }: { step: Step }) {
  const { Icon } = step;
  return (
    <Box
      className="step-card"
      sx={(theme) => ({
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1.5,
        cursor: "default",
        transform: { md: `translateY(${step.offsetY}px)` },
        transition: "transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
        "&:hover": {
          transform: {
            md: `translateY(${step.offsetY - 10}px)`,
          },
          "& .step-box": {
            transform: "rotate(-45deg) scale(1.08)",
            boxShadow: `0 16px 36px ${theme.palette.brand.blue}40, 0 0 0 2px ${theme.palette.brand.blue}`,
          },
          "& .step-number": {
            color: theme.palette.brand.blueLight,
          },
        },
      })}
    >
      {/* Large number (tilted) */}
      <Typography
        className="step-number"
        sx={(theme) => ({
          fontSize: { xs: "44px", md: "60px" },
          fontWeight: 900,
          color: theme.palette.brand.navyDeep,
          letterSpacing: "-1px",
          lineHeight: 0.85,
          fontFamily: '"Inter", var(--font-heebo), sans-serif',
          transform: "skewX(-12deg)",
          transition: "color 0.3s ease",
        })}
      >
        {step.number}
      </Typography>

      {/* Rotated rounded-square card */}
      <Box
        className="step-box"
        sx={(theme) => ({
          width: { xs: 96, md: 120 },
          height: { xs: 96, md: 120 },
          borderRadius: { xs: "18px", md: "22px" },
          bgcolor: "#fff",
          boxShadow: `0 8px 24px ${theme.palette.brand.blue}25, 0 0 0 1.5px ${theme.palette.brand.blue}`,
          transform: "rotate(-45deg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.4s ease",
        })}
      >
        {/* Icon back-rotated */}
        <Box
          sx={(theme) => ({
            transform: "rotate(45deg)",
            color: theme.palette.brand.blue,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          })}
        >
          <Icon sx={{ fontSize: { xs: 36, md: 44 } }} />
        </Box>
      </Box>

      {/* Description text */}
      <Typography
        sx={(theme) => ({
          fontSize: { xs: "13px", md: "15px" },
          fontWeight: 600,
          color: theme.palette.brand.navyDeep,
          textAlign: "center",
          lineHeight: 1.4,
          maxWidth: 180,
          mt: 1,
        })}
      >
        {step.title}
      </Typography>
    </Box>
  );
}

/** Decorative wave path connecting all 5 cards. */
function ConnectorWave() {
  return (
    <Box
      aria-hidden
      component="svg"
      viewBox="0 0 1200 200"
      preserveAspectRatio="none"
      sx={{
        position: "absolute",
        top: { md: 100 },
        left: 0,
        right: 0,
        width: "100%",
        height: { md: 200 },
        display: { xs: "none", md: "block" },
        zIndex: 0,
        pointerEvents: "none",
      }}
    >
      <path
        d="M 100 30 Q 250 30 300 90 Q 350 150 500 150 Q 650 150 700 90 Q 750 30 900 30 Q 1050 30 1100 90 Q 1150 150 1100 150"
        fill="none"
        stroke="#dde3f3"
        strokeWidth={2}
        strokeLinecap="round"
      />
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
          לוקח כמה רגעים ויש תוצאה!
        </Typography>

        <Box
          sx={{
            position: "relative",
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: { xs: 6, md: 0 },
            alignItems: { xs: "center", md: "flex-start" },
            justifyContent: "space-around",
            minHeight: { md: 380 },
            pb: { md: 8 },
          }}
        >
          <ConnectorWave />
          {steps.map((step) => (
            <Box
              key={step.number}
              sx={{
                position: "relative",
                zIndex: 1,
                flex: { md: 1 },
                display: "flex",
                justifyContent: "center",
              }}
            >
              <StepCard step={step} />
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
