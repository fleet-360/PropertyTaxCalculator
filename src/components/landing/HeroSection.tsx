"use client";
import { useMemo } from "react";
import { Box, Container, Typography, Button } from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { shuffleArray } from "@/lib/helpers";
import {
  municipalityEmblems,
  type MunicipalityEmblem,
} from "@/downloaded_emblems/emblemSources";

/** Backdrop colors from the original Figma placeholder grid */
const HERO_CITY_BACKDROP_PALETTE = [
  "#51f891",
  "#6ce4ff",
  "#ff6262",
  "#ee3ee5",
  "#8ca1f6",
  "#fff242",
  "#fb0101",
  "#e69e46",
] as const;

/** Fixed color per city when it matched the old hero list; others use a stable palette slot from the name hash */
const HERO_CITY_BACKDROP_BY_NAME: Record<string, string> = {
  "פתח תקווה": "#51f891",
  "תל אביב-יפו": "#6ce4ff",
  הרצליה: "#ff6262",
  "רמת גן": "#8ca1f6",
  אשדוד: "#ee3ee5",
  נתניה: "#6ce4ff",
  "בת ים": "#ff6262",
  "ראשון לציון": "#51f891",
  חולון: "#fb0101",
  חיפה: "#e69e46",
  "באר שבע": "#6ce4ff",
  אשקלון: "#51f891",
  רחובות: "#8ca1f6",
  רעננה: "#ff6262",
  "כפר סבא": "#ee3ee5",
  גבעתיים: "#fff242",
  "רמת השרון": "#e69e46",
};

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function heroCityBackdropColor(cityName: string): string {
  const fixed = HERO_CITY_BACKDROP_BY_NAME[cityName];
  if (fixed) return fixed;
  const i = hashString(cityName) % HERO_CITY_BACKDROP_PALETTE.length;
  return HERO_CITY_BACKDROP_PALETTE[i];
}

const MARQUEE_ROW_COUNT = 4;
const MARQUEE_ROW_GAP = '3em';
const MARQUEE_ITEM_GAP = '2em';

function CityLogoCell({ emblem }: { emblem: MunicipalityEmblem }) {
  const color = heroCityBackdropColor(emblem.name);
  return (
    <Box
      sx={{
        flexShrink: 0,
        bgcolor: color,
        borderRadius: "1em",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        aspectRatio: "1/0.8",
        p: "2em",
      }}
    >
      <Box
        sx={{
          width: 170,
          height: 170,
          bgcolor: "rgba(255,255,255,0.3)",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mx: 4,
          overflow: "hidden",
        }}
      >
        <Image
          src={emblem.src}
          alt=""
          width={emblem.src.width}
          height={emblem.src.height}
          sizes="140px"
          style={{
            width: "auto",
            height: "clamp(56px, 10vw, 120px)",
            maxWidth: "85%",
            objectFit: "contain",
          }}
        />
      </Box>
    </Box>
  );
}

function MarqueeRow({
  direction,
  duration,
  reduceMotion,
}: {
  direction: "left" | "right";
  duration: number;
  reduceMotion: boolean;
}) {
  /** One shuffled order per row; duplicated in the DOM for a seamless loop. */
  const cities = municipalityEmblems;
  const loop = [...cities, ...cities];

  return (
    <Box
      sx={{
        overflow: "hidden",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
      }}
    >
      {/* LTR so "left"/"right" match transform signs regardless of page dir="rtl" */}
      <Box
        dir="ltr"
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: MARQUEE_ITEM_GAP,
          width: "max-content",
          "@keyframes heroMarquee": {
            "0%": { transform: "translateX(0)" },
            "100%": { transform: "translateX(-50%)" },
          },
          ...(reduceMotion
            ? {}
            : {
                animation: `heroMarquee ${duration}s linear infinite`,
                animationDirection:
                  direction === "right" ? "reverse" : "normal",
              }),
          "@media (prefers-reduced-motion: reduce)": {
            animation: "none",
          },
        }}
      >
        {loop.map((emblem, i) => (
          <Box
            key={`${emblem.name}-${i}`}
            aria-hidden={i >= cities.length}
            sx={{ flexShrink: 0 }}
          >
            <CityLogoCell emblem={emblem} />
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export default function HeroSection() {
  const reduceMotion = useReducedMotion();

  return (
    <div
      id="hero"
      style={{
        height: "clamp(720px, 100vh, 1000px)",
        width: "100%",
        display: "flex",
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
        paddingTop: "8rem",
        paddingBottom: "8rem",
        background: "linear-gradient(143deg, #FFF 14.29%,rgb(163, 214, 248) 48.28%, #DEE5F6 85.71%)",
      }}
    >
      {/* Background city logos — multi-row alternating infinite marquees */}
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: "150%",
          height: "160%",
          transform: "translate(-50%, -50%) rotate(21.81deg)",
          opacity: 0.2,
          display: "flex",
          flexDirection: "column",
          gap: `${MARQUEE_ROW_GAP}`,
          overflow: "hidden",
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        {Array.from({ length: MARQUEE_ROW_COUNT }, (_, rowIndex) => (
          <MarqueeRow
            key={rowIndex}
            direction={rowIndex % 2 === 0 ? "left" : "right"}
            duration={300 + rowIndex * 6}
            reduceMotion={!!reduceMotion}
          />
        ))}
      </Box>

      {/* Content */}
      <Container
        maxWidth="md"
        sx={{ textAlign: "center", position: "relative", zIndex: 2 }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: { xs: "36px", sm: "48px", md: "72px" },
              lineHeight: { xs: 1.3, md: "90px" },
              color: "#000",
              mb: 2,
            }}
          >
            חשב את הארנונה שלך
            <br />
            בדייקנות מלאה
          </Typography>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          <Typography
            sx={{
              fontSize: { xs: "14px", md: "19px" },
              color: "#000",
              mb: 4,
            }}
          >
            מעל 100 ערים ורשויות מקומיות | עדכון שוטף | חיסכון ממוצע של 2,400 ₪
          </Typography>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45 }}
        >
          <Box
            sx={{
              display: "flex",
              gap: 3.75,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Button
              component="a"
              href="#calculator-section"
              sx={{
                bgcolor: "rgba(255,255,255,0.1)",
                border: "1.5px solid #194fdb",
                color: "#194fdb",
                borderRadius: "31px",
                width: { xs: "100%", sm: 180 },
                height: 62,
                fontSize: "17px",
                fontWeight: 700,
                "&:hover": { bgcolor: "rgba(25,79,219,0.08)" },
              }}
            >
              קרא עוד
            </Button>
            <Button
              component={Link}
              href="#calculator-section"
              sx={{
                bgcolor: "#1a4fdb",
                color: "#fff",
                borderRadius: "31px",
                width: { xs: "100%", sm: 240 },
                height: 62,
                fontSize: "17px",
                fontWeight: 700,
                boxShadow: "0px 10px 28px rgba(26,79,219,0.45)",
                "&:hover": { bgcolor: "#1640b5" },
              }}
            >
              חשב עכשיו
            </Button>
          </Box>
        </motion.div>
      </Container>
    </div>
  );
}
