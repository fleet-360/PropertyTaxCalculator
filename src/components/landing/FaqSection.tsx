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
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

const faqItems = [
  {
    q: "דיוק מירבי בתוצאות החישוב",
    a: "המערכת מבוססת על צווי הארנונה הרשמיים של הרשויות המקומיות ומחושבת בהתאם לסיווג, אזור וגודל הנכס.",
  },
  {
    q: "מחיר שאין לו תחרות",
    a: "תוצאת חישוב חינמית. דוח מלא ומכתב השגה בסכום נמוך משמעותית מהחיסכון הצפוי.",
  },
  {
    q: "חיסכון זמן",
    a: "מקבלים תוצאה מדויקת בתוך פחות מדקה, ללא צורך לבדוק תעריפים ידנית מול העירייה.",
  },
  {
    q: "עדכונים מתוך החוק והפסיקה",
    a: "המערכת מתעדכנת בהתאם לפסיקות אחרונות ולשינויים בצווי הארנונה כך שתמיד תקבל את הזכאות המעודכנת.",
  },
  {
    q: "המחשבון מתעדכן בכל שנה",
    a: "כל שנה אנחנו מעדכנים את התעריפים והסיווגים של הרשויות הקיימות ומוסיפים רשויות חדשות.",
  },
  {
    q: "השגות מקצועיות בנוסח משפטי",
    a: "מכתב ההשגה נכתב על ידי מערכת AI שאומנה על ידי מומחי ארנונה ומשפט, ומותאם לעירייה הרלוונטית.",
  },
];

export default function FaqSection() {
  const [expanded, setExpanded] = useState<string | false>("panel3");

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
            fontFamily: 'var(--font-heebo), "Heebo", sans-serif',
            fontWeight: 800,
            fontSize: { xs: "26px", md: "36px" },
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
          {/* Video preview placeholder (visually LEFT in RTL) */}
          <Box
            sx={(theme) => ({
              position: "relative",
              borderRadius: 3,
              overflow: "hidden",
              aspectRatio: "507 / 450",
              background: `linear-gradient(160deg, #eef1fa 0%, #d6deef 100%)`,
              border: `1px solid ${theme.palette.brand.gridLine}`,
              boxShadow: "0 12px 32px rgba(11,26,71,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              order: { xs: 2, md: 2 },
            })}
            role="button"
            aria-label="צפייה בסרטון הסבר"
          >
            {/* Decorative isometric cubes pattern */}
            <Box
              aria-hidden
              component="svg"
              viewBox="0 0 240 240"
              sx={{ width: "55%", height: "55%", opacity: 0.85 }}
            >
              <defs>
                <linearGradient id="cubeLight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#9eaef0" />
                  <stop offset="100%" stopColor="#7d92e6" />
                </linearGradient>
                <linearGradient id="cubeMid" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7d92e6" />
                  <stop offset="100%" stopColor="#5b76dd" />
                </linearGradient>
                <linearGradient id="cubeDark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5b76dd" />
                  <stop offset="100%" stopColor="#3d5dd5" />
                </linearGradient>
              </defs>
              {[
                [60, 60],
                [120, 60],
                [60, 120],
                [120, 120],
                [90, 90],
                [150, 90],
                [90, 150],
              ].map(([x, y], i) => (
                <g key={i} transform={`translate(${x},${y})`}>
                  <polygon points="0,15 30,0 60,15 30,30" fill="url(#cubeLight)" />
                  <polygon points="0,15 0,45 30,60 30,30" fill="url(#cubeMid)" />
                  <polygon points="30,30 30,60 60,45 60,15" fill="url(#cubeDark)" />
                </g>
              ))}
            </Box>

            {/* Play button overlay */}
            <Box
              sx={(theme) => ({
                position: "absolute",
                width: 72,
                height: 72,
                borderRadius: "50%",
                bgcolor: "rgba(255,255,255,0.95)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 12px 32px rgba(11,26,71,0.25)",
                color: theme.palette.brand.blue,
              })}
            >
              <PlayArrowIcon sx={{ fontSize: 40, ml: 0.5 }} />
            </Box>
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
                    bgcolor: "transparent",
                    borderBottom: `1px solid ${isExpanded ? theme.palette.brand.blue : "#e3e7f1"}`,
                    "&:before": { display: "none" },
                    "& .MuiAccordionSummary-root": {
                      px: 0,
                      minHeight: 56,
                      flexDirection: "row-reverse",
                      "& .MuiAccordionSummary-content": {
                        ml: 1.5,
                        mr: 0,
                        justifyContent: "flex-end",
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
                            : "rgba(11,26,71,0.06)",
                          color: isExpanded ? "#fff" : theme.palette.brand.navyDeep,
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
                  <AccordionDetails sx={{ px: 0, pb: 2.5 }}>
                    <Typography
                      sx={(theme) => ({
                        fontSize: { xs: "13px", md: "14px" },
                        color: "#5a6788",
                        lineHeight: 1.7,
                        textAlign: "right",
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
