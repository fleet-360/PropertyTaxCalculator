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
