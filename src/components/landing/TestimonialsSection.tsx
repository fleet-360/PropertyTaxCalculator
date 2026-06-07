"use client";
import { Box, Container, Typography } from "@mui/material";
import Image from "next/image";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { videoTestimonials, quoteTestimonials } from "@/data/testimonials";

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
        {/* Title with decorative quote mark */}
        <Box sx={{ textAlign: "center", mb: { xs: 5, md: 7 } }}>
          <Box
            sx={{
              position: "relative",
              display: "inline-block",
            }}
          >
            {/* Decorative typographic quote — sits behind the title at the start (right side in RTL) */}
            <Box
              aria-hidden
              sx={(theme) => ({
                position: "absolute",
                top: { xs: -40, md: -50 },
                left: { xs: -80, md: -100 },
                fontFamily:
                  'var(--font-noto-sans-hebrew), "Noto Sans Hebrew", sans-serif',
                fontWeight: 700,
                fontSize: { xs: "164px", md: "196px" },
                lineHeight: 1,
                color: theme.palette.brand.blueLight,
                opacity: 0.3,
                userSelect: "none",
                pointerEvents: "none",
              })}
            >
              &rdquo;
            </Box>
            <Typography
              component="h2"
              sx={(theme) => ({
                position: "relative",
                fontFamily: 'var(--font-noto-sans-hebrew), "Noto Sans Hebrew", sans-serif',
                fontWeight: 700,
                fontSize: "24px",
                color: theme.palette.brand.navyDeep,
                letterSpacing: "-0.3px",
              })}
            >
              לקוחות שלנו ממליצים
            </Typography>
          </Box>
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
                  opacity: 0.5,
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
                }}
              >
                <Box
                  sx={{
                    position: "relative",
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    overflow: "hidden",
                    flexShrink: 0,
                    bgcolor: "#f1f4fb",
                  }}
                >
                  <Image
                    src={q.avatar}
                    alt={`תמונה של ${q.author}`}
                    fill
                    sizes="32px"
                    style={{ objectFit: "cover" }}
                  />
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
