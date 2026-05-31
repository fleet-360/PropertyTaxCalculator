"use client";
import { useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Container,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const faqItems = [
  {
    q: "דיוק מירבי בתוצאות החישוב",
    a: "מחשבון הארנונה משווה את דרישת התשלום שאתם מקבלים לתעריפים המעודכנים ביותר מתוך צו הארנונה שמתעדכנים בכל שנה.",
  },
  {
    q: "מחיר שאין לו תחרות",
    a: "המחיר של מחשבון הארנונה מאפשר לכל משפחה ולכל עסק לבדוק בעצמו ולהגיש השגות לעירייה מבלי להרגיש את זה בכיס.",
  },
  {
    q: "חיסכון זמן",
    a: "מחשבון הארנונה מאפשר לכם לבצע את החישוב ולהגיש את ההשגה בתוך כמה דקות בלבד, תבדקו בעצמכם",
  },
  {
    q: "פיקוח של עורכי דין",
    a: "מחשבון הארנונה נוצר בפיקוח של עורכי דין המתמחים בדיני הארנונה ולפיכך התוצאות טובות יותר ואפקטיביות יותר",
  },
  {
    q: "המחשבון מתעדכן בכל שנה",
    a: `מחשבון הארנונה מתעדכן בכל שנה עפ"י נתוני צו הארנונה, וכן בכל פעם שיש שינוי משמעותי בחוק, בתקנות או בפסקי דין ובכך מדייק את עצמו עם כלי AI מתקדמים.`,
  },
  {
    q: "השגות מקצועיות בנוסח משפטי",
    a: `המחשבון מבוסס על השגות אמיתיות שנבדקו ע"י עורכי דין ונמצאו יעילות לקבלת החיסכון.`,
  },
];

export default function FaqSection() {
  const [expanded, setExpanded] = useState<string | false>("");

  return (
    <Box
      component="section"
      sx={{
        py: { xs: 6, md: 10 },
        bgcolor: "background.default",
      }}
    >
      <Container maxWidth="lg">
        <Typography
          component="h2"
          sx={(theme) => ({
            fontFamily: 'var(--font-noto-sans-hebrew), "Noto Sans Hebrew", sans-serif',
            fontWeight: 700,
            fontSize: "24px",
            color: theme.palette.brand.navyDeep,
            textAlign: "center",
            mb: { xs: 4, md: 6 },
            letterSpacing: "-0.3px",
          })}
        >
          למה כדאי לעבוד עם מחשבון הארנונה?
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1.2fr 1fr" },
            gap: { xs: 4, md: 6 },
            alignItems: "start",
          }}
        >
          {/* Looping cube video (visually LEFT in RTL) */}
          <Box
            sx={(theme) => ({
              position: "relative",
              borderRadius: 3,
              overflow: "hidden",
              aspectRatio: "507 / 450",
              background: `linear-gradient(160deg, #eef1fa 0%, #d6deef 100%)`,

              order: { xs: 2, md: 2 },
            })}
            aria-label="סרטון הסבר"
          >
            <Box
              component="video"
              src="/videos/cube.mp4"
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              aria-hidden
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          </Box>

          {/* FAQ accordion (visually RIGHT in RTL) */}
          <Box sx={{ order: { xs: 1, md: 1 } }}>
            {faqItems.map((item, idx) => {
              const panelId = `panel${idx + 1}`;
              const isExpanded = expanded === panelId;
              return (
                <Accordion
                  key={panelId}
                  elevation={0}
                  disableGutters
                  expanded={isExpanded}
                  onChange={(_, exp) => setExpanded(exp ? panelId : false)}
                  sx={(theme) => ({
                    bgcolor: theme.palette.background.paper,
                    border: `1px solid ${
                      isExpanded
                        ? theme.palette.brand.blue
                        : theme.palette.brand.borderField
                    }`,
                    borderRadius: 2,
                    mb: 1.5,
                    overflow: "hidden",
                    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                    boxShadow: isExpanded
                      ? "0 4px 14px rgba(0,85,252,0.08)"
                      : "none",
                    "&:before": { display: "none" },
                    "&:last-of-type": { mb: 0 },
                    "& .MuiAccordionSummary-root": {
                      px: { xs: 2, md: 2.5 },
                      minHeight: 64,
                      "& .MuiAccordionSummary-content": {
                        ml: 1.5,
                        mr: 0,
                        justifyContent: "flex-start",
                      },
                    },
                  })}
                >
                  <AccordionSummary
                    expandIcon={
                      <Box
                        sx={(theme) => ({
                          width: 32,
                          height: 32,
                          borderRadius: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: isExpanded
                            ? theme.palette.brand.blue
                            : theme.palette.brand.borderField,
                          color: isExpanded
                            ? "#fff"
                            : theme.palette.brand.navyDeep,
                          transition: "all 0.2s",
                        })}
                      >
                        <ExpandMoreIcon fontSize="small" />
                      </Box>
                    }
                  >
                    <Typography
                      sx={(theme) => ({
                        fontSize: { xs: "14px", md: "16px" },
                        fontWeight: isExpanded ? 700 : 500,
                        color: isExpanded
                          ? theme.palette.brand.blue
                          : theme.palette.brand.navyDeep,
                      })}
                    >
                      {item.q}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails
                    sx={(theme) => ({
                      px: { xs: 2, md: 2.5 },
                      pt: 0,
                      pb: 2.5,
                      borderTop: `1px solid ${theme.palette.brand.borderField}`,
                      mt: 0.5,
                    })}
                  >
                    <Typography
                      sx={(theme) => ({
                        fontSize: { xs: "13px", md: "14px" },
                        color: theme.palette.brand.textMuted,
                        lineHeight: 1.7,
                        pt: 1.5,
                      })}
                    >
                      {item.a}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
