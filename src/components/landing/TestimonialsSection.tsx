"use client";
import { Box, Container, Typography } from "@mui/material";
import Image from "next/image";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import photoBlonde from "@/assets/testimonial-photo-0-blonde.png";
import photoMan from "@/assets/testimonial-photo-1-man.png";
import photoCurly from "@/assets/testimonial-photo-2-curly.png";

type VideoTestimonial = {
  name: string;
  photo: typeof photoBlonde;
};

// In RTL the first item displays on the right. We want photoBlonde on the right (per Figma).
const videoTestimonials: VideoTestimonial[] = [
  { name: "ממליצה 1", photo: photoBlonde },
  { name: "ממליץ 2", photo: photoMan },
  { name: "ממליצה 3", photo: photoCurly },
];

type QuoteTestimonial = {
  text: string;
  author: string;
  initial: string;
  avatarBg: string;
};

const quoteTestimonials: QuoteTestimonial[] = [
  {
    text: "ארנונה במשך זין שדרש שמהי שאמשי וחודשים בנהוקות באוקת, בענה משלמש שמע מצוץ. הצפוי על שעמשי דיכ צפינ לתואסור.",
    author: "ניר סימון",
    initial: "נ",
    avatarBg: "#fbcfe8",
  },
  {
    text: '"הרשתי לעורך זין שדרש שמהי שאמשי לעדיותי וגן 1,500 ש"ח, בעיק תרסה במגויב לקרוצ ההמלשבל יוצא אש סוס שצמשולא לשטר לעמולש שלא יוטולא?"',
    author: "ישראל ישראלי",
    initial: "י",
    avatarBg: "#dbeafe",
  },
  {
    text: '"שמיהי לעורך זין שדרש שמהי שאמשי לעדיותי וגן 1,500 ש"ח, בעיק תרסה במגויב לקרוצ ההמלשבל יוצא אש סוס שצמשולא לשטר לעמולש שלא יוטולא?"',
    author: "אורטל בטן",
    initial: "א",
    avatarBg: "#fde68a",
  },
  {
    text: '"סי ידיא בכלל לאל לכש אכמ ייח שטר אש 6 חודאיות שלמש יישוצ לואט די ידלצויית? זה פניטים פעאם נושמ, לעיריזיב התי שיקטלא העיוצ מלאל?"',
    author: "עדי לוי",
    initial: "ע",
    avatarBg: "#c7d2fe",
  },
];

export default function TestimonialsSection() {
  return (
    <Box
      id="testimonials"
      component="section"
      sx={{
        py: { xs: 6, md: 10 },
        bgcolor: "background.paper",
      }}
    >
      <Container maxWidth="lg">
        {/* Title with quote decoration */}
        <Box sx={{ textAlign: "center", mb: { xs: 5, md: 7 } }}>
          <Box
            sx={(theme) => ({
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              color: theme.palette.brand.blueLight,
              opacity: 0.5,
              mb: -1.5,
            })}
          >
            <FormatQuoteIcon sx={{ fontSize: 36, transform: "scaleX(-1)" }} />
          </Box>
          <Typography
            component="h2"
            sx={(theme) => ({
              fontFamily: 'var(--font-heebo), "Heebo", sans-serif',
              fontWeight: 800,
              fontSize: { xs: "26px", md: "36px" },
              color: theme.palette.brand.navyDeep,
              letterSpacing: "-0.3px",
            })}
          >
            לקוחות שלנו ממליצים
          </Typography>
        </Box>

        {/* Video thumbnails (3 cards) */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(3, 1fr)",
            },
            gap: { xs: 2.5, md: 3 },
            mb: { xs: 4, md: 5 },
          }}
        >
          {videoTestimonials.map((v) => (
            <Box
              key={v.name}
              role="button"
              aria-label={`צפייה בהמלצה של ${v.name}`}
              sx={{
                position: "relative",
                aspectRatio: "4 / 3",
                borderRadius: 2.5,
                overflow: "hidden",
                cursor: "pointer",
                boxShadow: "0 10px 28px rgba(11,26,71,0.12)",
                transition: "transform 0.25s ease, box-shadow 0.25s ease",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 16px 36px rgba(11,26,71,0.2)",
                  "& .play-btn": {
                    transform: "translate(-50%, -50%) scale(1.08)",
                  },
                },
              }}
            >
              <Image
                src={v.photo}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                style={{ objectFit: "cover" }}
              />
              {/* Play button overlay */}
              <Box
                className="play-btn"
                sx={(theme) => ({
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: { xs: 56, md: 64 },
                  height: { xs: 56, md: 64 },
                  borderRadius: "50%",
                  bgcolor: "rgba(255,255,255,0.95)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
                  transition: "transform 0.25s ease",
                  color: theme.palette.brand.blue,
                  zIndex: 2,
                })}
              >
                <PlayArrowIcon sx={{ fontSize: { xs: 32, md: 36 }, ml: 0.5 }} />
              </Box>
            </Box>
          ))}
        </Box>

        {/* Quote testimonials (text cards) */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(4, 1fr)",
            },
            gap: { xs: 1.75, md: 2 },
          }}
        >
          {quoteTestimonials.map((q, i) => (
            <Box
              key={i}
              sx={{
                p: 2.25,
                borderRadius: 2,
                border: `1px solid #e3e7f1`,
                bgcolor: "#fff",
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
                transition: "all 0.2s ease",
                "&:hover": {
                  borderColor: (theme) => theme.palette.brand.blueLight,
                  boxShadow: "0 8px 20px rgba(11,26,71,0.08)",
                  transform: "translateY(-2px)",
                },
              }}
            >
              <Typography
                sx={{
                  fontSize: "12.5px",
                  color: "#5a6788",
                  lineHeight: 1.6,
                  textAlign: "right",
                  flex: 1,
                }}
              >
                {q.text}
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mt: "auto",
                  flexDirection: "row-reverse",
                  justifyContent: "flex-end",
                }}
              >
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    bgcolor: q.avatarBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: (theme) => theme.palette.brand.navyDeep,
                    flexShrink: 0,
                  }}
                  aria-hidden
                >
                  {q.initial}
                </Box>
                <Typography
                  sx={(theme) => ({
                    fontSize: "12px",
                    fontWeight: 700,
                    color: theme.palette.brand.navyDeep,
                  })}
                >
                  {q.author}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
