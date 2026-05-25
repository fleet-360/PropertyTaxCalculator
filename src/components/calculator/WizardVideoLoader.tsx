"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

interface WizardVideoLoaderProps {
  /**
   * Optional Hebrew status text shown below the video.
   * Omit when the surrounding layout already supplies the title/subtitle
   * (e.g. centered wizard layout) so the loader is visually clean.
   */
  message?: string;
  /** Video src. Defaults to the binary-code loader used across the wizard. */
  videoSrc?: string;
}

/**
 * Designed loading state for long-running wizard operations
 * (tax-bill extraction, appeal generation, signature merge…).
 * Replaces ad-hoc CircularProgress spinners with the brand video loader.
 */
export default function WizardVideoLoader({
  message,
  videoSrc = "/videos/binary-code-loader.mp4",
}: WizardVideoLoaderProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 560,
          aspectRatio: "16 / 9",
          borderRadius: "16px",
          overflow: "hidden",
          bgcolor: "#000",
          position: "relative",
        }}
      >
        <Box
          component="video"
          src={videoSrc}
          autoPlay
          loop
          muted
          playsInline
          aria-hidden
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      </Box>

      {message ? (
        <Typography
          role="status"
          aria-live="polite"
          sx={{
            fontSize: "16px",
            lineHeight: "22px",
            textAlign: "center",
            color: "text.secondary",
            maxWidth: 597,
          }}
        >
          {message}
        </Typography>
      ) : null}
    </Box>
  );
}
