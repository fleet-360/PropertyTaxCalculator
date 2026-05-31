"use client";
import { Box, Container, Typography } from "@mui/material";
import { keyframes } from "@mui/system";
import bgPattern from "@/assets/partOfHomeBackground.png";

const ROW_ONE = [
  "ירושלים",
  "תל אביב",
  "חיפה",
  "באר שבע",
  "ראשון לציון",
  "פתח תקווה",
  "אשדוד",
  "נתניה",
] as const;

const ROW_TWO = [
  "חולון",
  "בני ברק",
  "רמת גן",
  "אשקלון",
  "רחובות",
  "בת ים",
  "כפר סבא",
  "הרצליה",
] as const;

// Marquee animation. We render the same list twice back-to-back inside a
// `width: max-content` track and animate by exactly half its width, so the
// loop is perfectly seamless. The "moveLeft" keyframes always animate in
// physical pixels — direction is flipped per row via `animation-direction`.
const moveLeft = keyframes`
  from { transform: translate3d(0, 0, 0); }
  to   { transform: translate3d(-50%, 0, 0); }
`;

function CityCell({ name }: { name: string }) {
  return (
    <Box
      // Restore RTL inside the cell so Hebrew text renders correctly even
      // though the marquee track is forced to LTR for layout math.
      dir="rtl"
      sx={(theme) => ({
        flex: "0 0 auto",
        width: { xs: 132, md: 160 },
        bgcolor: "background.paper",
        border: `1px solid #e3e7f1`,
        borderRadius: 2,
        py: { xs: 1.75, md: 2.25 },
        px: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center",
        gap: 0.25,
        minHeight: { xs: 64, md: 72 },
        transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        "&:hover": {
          borderColor: theme.palette.brand.blue,
          boxShadow: "0 8px 20px rgba(11,26,71,0.08)",
        },
      })}
    >
      <Typography
        sx={{
          fontSize: { xs: "12px", md: "14px" },
          fontWeight: 400,
          color: "#1E3C95",
          lineHeight: 1,
        }}
      >
        עיריית
      </Typography>
      <Typography
        sx={{
          fontSize: { xs: "16px", md: "20px" },
          fontWeight: 400,
          color: (theme) => theme.palette.brand.navyDeep,
          lineHeight: 1.2,
        }}
      >
        {name}
      </Typography>
    </Box>
  );
}

function MarqueeRow({
  cities,
  reverse = false,
  duration,
}: {
  cities: readonly string[];
  /** If true, the row scrolls toward the right instead of toward the left. */
  reverse?: boolean;
  duration: number;
}) {
  // Render the list twice — when the first copy has translated -50%, the
  // second copy has taken its exact place, so resetting to 0% is invisible.
  const items = [...cities, ...cities];

  return (
    <Box
      // Force LTR so `translateX(-50%)` always behaves the same regardless
      // of the surrounding RTL document. Hebrew text inside each cell is
      // unaffected because the cell content uses its own block layout.
      dir="ltr"
      sx={{
        position: "relative",
        width: "100%",
        overflow: "hidden",
        maskImage:
          "linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexWrap: "nowrap",
          width: "max-content",
          gap: { xs: 1.25, md: 1.5 },
          willChange: "transform",
          animation: `${moveLeft} ${duration}s linear infinite`,
          animationDirection: reverse ? "reverse" : "normal",
          "&:hover": { animationPlayState: "paused" },
          "@media (prefers-reduced-motion: reduce)": {
            animation: "none",
          },
        }}
      >
        {items.map((city, i) => (
          <Box key={`${city}-${i}`} sx={{ flex: "0 0 auto" }}>
            <CityCell name={city} />
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export default function IntroAndCitiesSection() {
  return (
    <Box
      component="section"
      sx={{
        py: { xs: 1, md: 2 },
        position: "relative",
        zIndex: 3,
        overflow: "hidden",
        backgroundColor: "white",
      }}
    >
      {/* Pixel-grid pattern. The source image has very light-gray squares biased
          to the right half on a transparent canvas, so:
            • LEFT  copy: anchored to the left edge — squares fall in the center-LEFT
            • RIGHT copy: horizontally mirrored — squares fall in the center-RIGHT */}
      <Box
        component="img"
        src={bgPattern.src}
        alt=""
        aria-hidden="true"
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: { xs: "75%", md: "55%" },
          height: "auto",
          pointerEvents: "none",
          userSelect: "none",
          filter: "brightness(0)",
          opacity: 0.08,
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
          width: { xs: "75%", md: "55%" },
          height: "auto",
          pointerEvents: "none",
          userSelect: "none",
          filter: "brightness(0)",
          opacity: 0.02,
        }}
      />

      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
        {/* Intro: small kicker title + paragraph */}
        <Box
          sx={{
            textAlign: "center",
            maxWidth: 1200,
            mx: "auto",
            mb: { xs: 4, md: 5 },
          }}
        >
          <Typography
            component="h2"
            sx={(theme) => ({
              fontSize: { xs: "13px", md: "18px" },
              fontWeight: 600,
              color: theme.palette.brand.textMuted,
              letterSpacing: "0.02em",
              mb: { xs: 1.5, md: 2 },
            })}
          >
            מה אנחנו עושים?
          </Typography>
          <Typography
            sx={(theme) => ({
              fontSize: { xs: "26px", md: "32px" },
              color: theme.palette.brand.navyDeep,
              fontWeight: 400,
              lineHeight: "32px",
              width: "100%",
            })}
          >
            אנחנו מחשבים את הארנונה בבית או בעסק ובודקים האם אתה זכאי להנחה
          </Typography>

          <Typography
            sx={(theme) => ({
              fontSize: { xs: "26px", md: "32px" },
              color: theme.palette.brand.navyDeep,
              fontWeight: 400,
              width: "100%",
              lineHeight: "32px",
            })}
          >
            בתשלום הארנונה תוך שימוש בפטורים, הנחות או איתור טעויות בחישוב.
          </Typography>
          <Box
            sx={(theme) => ({
              color: theme.palette.brand.blueDark,
              fontWeight: 700,
              fontSize: { xs: "26px", md: "32px" },
              lineHeight: "32px",
            })}
          >
            והכל בצורה פשוטה, מהירה ומדויקת
          </Box>
        </Box>

        {/* Thin divider line between text and cities */}
        <Box
          sx={{
            width: "100%",
            height: "1px",
            bgcolor: "#BDBDBD",
            mb: { xs: 4, md: 5 },
          }}
        />

        {/* Two SEPARATE infinite-scroll rows.
              • Row 1 scrolls toward the LEFT  (cities slide leftwards)
              • Row 2 scrolls toward the RIGHT (cities slide rightwards)
            Each row is its own clipped container, so they're visually
            distinct and never collide. */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: { xs: 1.5, md: 2 },
          }}
        >
          <MarqueeRow cities={ROW_ONE} duration={45} />
          <MarqueeRow cities={ROW_TWO} duration={50} reverse />
        </Box>
      </Container>
    </Box>
  );
}
