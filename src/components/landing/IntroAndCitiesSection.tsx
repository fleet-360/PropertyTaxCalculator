"use client";
import { Box, Container, Typography } from "@mui/material";

const FEATURED_CITIES = [
  "ירושלים",
  "תל אביב",
  "חיפה",
  "באר שבע",
  "ראשון לציון",
  "פתח תקווה",
  "אשדוד",
  "נתניה",
  "חולון",
  "בני ברק",
  "רמת גן",
  "אשקלון",
  "רחובות",
  "בת ים",
  "כפר סבא",
  "הרצליה",
] as const;

function CityCell({ name }: { name: string }) {
  return (
    <Box
      sx={(theme) => ({
        bgcolor: "background.paper",
        border: `1px solid #e3e7f1`,
        borderRadius: 2,
        py: { xs: 2, md: 2.5 },
        px: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: { xs: 56, md: 64 },
        transition: "all 0.2s ease",
        "&:hover": {
          borderColor: theme.palette.brand.blue,
          boxShadow: "0 8px 20px rgba(11,26,71,0.08)",
          transform: "translateY(-2px)",
        },
      })}
    >
      <Typography
        sx={{
          fontSize: { xs: "13px", md: "14px" },
          fontWeight: 600,
          color: (theme) => theme.palette.brand.navyDeep,
          textAlign: "center",
        }}
      >
        עיריית {name}
      </Typography>
    </Box>
  );
}

export default function IntroAndCitiesSection() {
  return (
    <Box
      component="section"
      sx={{
        py: { xs: 6, md: 10 },
        bgcolor: "background.default",
        position: "relative",
        zIndex: 3,
      }}
    >
      <Container maxWidth="lg">
        {/* Intro paragraph */}
        <Box sx={{ textAlign: "center", maxWidth: 920, mx: "auto", mb: { xs: 5, md: 7 } }}>
          <Typography
            sx={(theme) => ({
              fontSize: { xs: "16px", md: "20px" },
              lineHeight: 1.7,
              color: theme.palette.brand.navyDeep,
              fontWeight: 500,
            })}
          >
            אנחנו מחשבים את הארנונה בבית או בעסק ובודקים האם אתה זכאי להנחה
            בתשלום הארנונה תוך שימוש בפטורים, הנחות או איתור טעויות בחישוב.{" "}
            <Box
              component="span"
              sx={(theme) => ({
                color: theme.palette.brand.blue,
                fontWeight: 800,
              })}
            >
              והכל בצורה פשוטה, מהירה ומדויקת
            </Box>
          </Typography>
        </Box>

        {/* City names grid — text only */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, 1fr)",
              sm: "repeat(4, 1fr)",
              md: "repeat(8, 1fr)",
            },
            gap: { xs: 1.25, md: 1.5 },
          }}
        >
          {FEATURED_CITIES.map((city) => (
            <CityCell key={city} name={city} />
          ))}
        </Box>
      </Container>
    </Box>
  );
}
