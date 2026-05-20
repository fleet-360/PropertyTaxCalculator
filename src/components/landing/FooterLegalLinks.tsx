'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import { useTheme } from '@mui/material/styles';

const privacySections = [
  {
    title: '1. כללי',
    body: 'אתר arnonacal.com ("האתר") מופעל על ידי ארנונה חכמה ("החברה"). מדיניות פרטיות זו מפרטת כיצד אנו אוספים, משתמשים ומגנים על המידע האישי שלך בעת השימוש בשירותי חישוב ובדיקת ארנונה באתר.',
  },
  {
    title: '2. מידע שאנו אוספים',
    body: `במסגרת השימוש בשירותים שלנו, אנו עשויים לאסוף את סוגי המידע הבאים:
• פרטי נכס: עיר, סוג נכס, שטח במ"ר, אזור ארנונה וסוג שימוש.
• פרטי תשלום: סכום ארנונה דו-חודשי שמדווח על ידך לצורך השוואה.
• פרטי קשר: שם, כתובת דוא"ל ומספר טלפון, במידה ונמסרים באמצעות טופס יצירת קשר או בעת רכישת שירותים.
• נתוני שימוש: כתובת IP, סוג דפדפן, עמודים שנצפו ומשך הביקור — באמצעות כלי ניתוח כגון Google Analytics.
• מסמכים שהועלו: חשבונות ארנונה או מסמכים אחרים שהועלו לצורך ניתוח באמצעות מנוע ה-OCR שלנו.`,
  },
  {
    title: '3. כיצד אנו משתמשים במידע',
    body: `המידע שנאסף משמש למטרות הבאות:
• חישוב ארנונה: חישוב ערכי ארנונה על פי צווי ארנונה עירוניים והשוואתם לסכומים שמדווחים על ידך.
• הכנת מסמכי השגה: יצירת מכתבי השגה מותאמים אישית בסיוע בינה מלאכותית עבור מי שמשלם ארנונה ביתר.
• שיפור השירות: ניתוח דפוסי שימוש לצורך שיפור חוויית המשתמש ודיוק התוצאות.
• תקשורת: שליחת אישורי רכישה, עדכונים לגבי שירותים או מענה לפניות.`,
  },
  {
    title: '4. שיתוף מידע עם צדדים שלישיים',
    body: `איננו מוכרים, סוחרים או מעבירים מידע אישי לצדדים שלישיים, למעט במקרים הבאים:
• ספקי שירות: גורמים הנדרשים לתפעול השירות (עיבוד תשלומים, אחסון ענן, שירותי בינה מלאכותית של Google).
• דרישה חוקית: כאשר קיימת חובה חוקית לחשוף מידע בהתאם לצו בית משפט או דרישת רשות מוסמכת.`,
  },
  {
    title: '5. אבטחת מידע',
    body: `אנו נוקטים באמצעי אבטחה סבירים להגנה על המידע שלך, לרבות:
• הצפנת תעבורה באמצעות פרוטוקול HTTPS.
• אימות משתמשים באמצעות טוקנים מאובטחים (JWT).
• הגבלת גישה למסדי הנתונים לצוות מורשה בלבד.
למרות מאמצינו, אין אפשרות להבטיח אבטחה מוחלטת של מידע המועבר באינטרנט.`,
  },
  {
    title: '6. עוגיות (Cookies)',
    body: 'האתר משתמש בעוגיות לצרכי ניתוח סטטיסטי ושיפור חוויית המשתמש. ניתן לנהל את הגדרות העוגיות דרך הדפדפן שלך.',
  },
  {
    title: '7. זכויות המשתמש',
    body: `בהתאם לחוק הגנת הפרטיות, התשמ"א-1981, עומדות לך הזכויות הבאות:
• עיון במידע שנאסף אודותיך.
• בקשה לתיקון או מחיקת מידע אישי.
• התנגדות לשימוש במידע לצורכי דיוור ישיר.
לצורך מימוש זכויותיך, ניתן לפנות אלינו בכתובת service@arnonacal.com.`,
  },
  {
    title: '8. שינויים במדיניות',
    body: 'אנו שומרים לעצמנו את הזכות לעדכן מדיניות זו מעת לעת. שינויים יפורסמו בעמוד זה עם ציון תאריך העדכון.\n\nעדכון אחרון: אפריל 2026',
  },
];

const termsSections = [
  {
    title: '1. הסכמה לתנאים',
    body: 'השימוש באתר arnonacal.com ("האתר") ובשירותי חישוב הארנונה המוצעים בו כפוף לתנאי שימוש אלה. עצם השימוש באתר מהווה הסכמה לתנאים אלה. אם אינך מסכים לתנאים, עליך להימנע מהשימוש באתר.',
  },
  {
    title: '2. תיאור השירות',
    body: `האתר מספק כלי לחישוב ובדיקת חיובי ארנונה עירונית בישראל. השירותים כוללים:
• מחשבון ארנונה: חישוב ארנונה משוער על פי נתוני הנכס שמוזנים על ידי המשתמש וצווי ארנונה עירוניים.
• השוואת תשלומים: השוואת סכום הארנונה המחושב לסכום שמדווח על ידי המשתמש לצורך איתור חיוב יתר.
• הכנת מסמכי השגה: יצירת מכתבי השגה מותאמים אישית בסיוע בינה מלאכותית.
• ניתוח מסמכים: סריקת חשבונות ארנונה באמצעות טכנולוגיית OCR.`,
  },
  {
    title: '3. הגבלת אחריות',
    body: `• השירות מספק הערכות בלבד: תוצאות החישוב מבוססות על צווי ארנונה שפורסמו על ידי הרשויות המקומיות ואינן מהוות ייעוץ משפטי, פיננסי או מקצועי.
• אין אחריות לדיוק: למרות מאמצינו לספק נתונים מדויקים ועדכניים, ייתכנו אי-דיוקים בשיעורי הארנונה, סיווגי הנכסים או נתוני האזורים. האחריות לאימות הנתונים מול הרשות המקומית הרלוונטית חלה על המשתמש.
• מסמכי השגה: מכתבי ההשגה שנוצרים באמצעות המערכת הם כלי עזר בלבד. הגשת השגה והתנהלות מול הרשות המקומית הן באחריות המשתמש בלבד. אין התחייבות לתוצאה כלשהי בהליך ההשגה.
• ארנונה חכמה אינה משרד עורכי דין ואינה מספקת ייעוץ משפטי.`,
  },
  {
    title: '4. תשלומים ומחירים',
    body: `• צפייה בתוצאות מפורטות של המחשבון כרוכה בתשלום בהתאם למחירון המוצג באתר.
• שירות הכנת מסמך השגה כרוך בתשלום נפרד כמפורט באתר.
• התשלום מתבצע באמצעות אמצעי התשלום המוצעים באתר ואינו ניתן להחזר לאחר מתן השירות, אלא אם נקבע אחרת בהתאם לחוק הגנת הצרכן.
• החברה רשאית לשנות את המחירים מעת לעת. המחיר הקובע הוא המחיר המוצג בעת ביצוע הרכישה.`,
  },
  {
    title: '5. קניין רוחני',
    body: 'כל התוכן באתר, לרבות עיצוב, טקסט, לוגו, קוד תוכנה ומאמרים, הם רכוש ארנונה חכמה ומוגנים בזכויות יוצרים. אין להעתיק, לשכפל, להפיץ או לעשות שימוש מסחרי בתוכן האתר ללא אישור בכתב מראש.',
  },
  {
    title: '6. שימוש אסור',
    body: `המשתמש מתחייב שלא:
• להשתמש באתר למטרות בלתי חוקיות.
• לנסות לפרוץ, לשבש או להעמיס את שרתי האתר.
• להעתיק או לגרד (scrape) תוכן מהאתר באופן אוטומטי.
• להתחזות למשתמש אחר או למסור פרטים כוזבים.`,
  },
  {
    title: '7. זמינות השירות',
    body: 'החברה שואפת לספק שירות רציף, אך אינה מתחייבת לזמינות מלאה ורצופה של האתר. האתר עשוי להיות מושבת לצרכי תחזוקה, עדכונים או עקב תקלות טכניות.',
  },
  {
    title: '8. דין חל וסמכות שיפוט',
    body: 'על תנאי שימוש אלה יחולו דיני מדינת ישראל. סמכות השיפוט הבלעדית נתונה לבתי המשפט המוסמכים בתל אביב-יפו.',
  },
  {
    title: '9. שינויים בתנאי השימוש',
    body: 'החברה רשאית לעדכן תנאים אלה בכל עת. המשך השימוש באתר לאחר פרסום שינויים מהווה הסכמה לתנאים המעודכנים.',
  },
  {
    title: '10. יצירת קשר',
    body: `לשאלות בנוגע לתנאי שימוש אלה, ניתן לפנות אלינו:
דוא"ל: service@arnonacal.com
טלפון: 03-123-4567`,
  },
];

interface LegalDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  titleId: string;
  sections: { title: string; body: string }[];
}

function LegalDialog({ open, onClose, title, titleId, sections }: LegalDialogProps) {
  const theme = useTheme();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby={titleId}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: {
          sx: {
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
          },
        },
      }}
    >
      <DialogTitle
        component="div"
        id={titleId}
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        <IconButton onClick={onClose} aria-label="סגירה" size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 2 }}>
        {sections.map((section) => (
          <Box key={section.title} sx={{ mb: 2.5 }}>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 700, mb: 0.75, color: theme.palette.text.primary }}
            >
              {section.title}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                lineHeight: 1.85,
                color: theme.palette.text.secondary,
                whiteSpace: 'pre-line',
              }}
            >
              {section.body}
            </Typography>
          </Box>
        ))}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, pt: 1.5 }}>
        <Button onClick={onClose} variant="outlined" size="small">
          סגירה
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function FooterLegalLinks() {
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  const linkSx = {
    cursor: 'pointer',
    '&:hover': { textDecoration: 'underline' },
  } as const;

  const handleKeyDown =
    (setter: (v: boolean) => void) => (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setter(true);
      }
    };

  return (
    <>
      <Typography
        sx={{
          fontSize: { xs: '12px', sm: '13px' },
          color: 'rgba(255,255,255,0.6)',
          lineHeight: 1.5,
          wordBreak: 'break-word',
          maxWidth: '100%',
        }}
      >
        <Box
          component="span"
          role="button"
          tabIndex={0}
          onClick={() => setPrivacyOpen(true)}
          onKeyDown={handleKeyDown(setPrivacyOpen)}
          sx={linkSx}
        >
          מדיניות פרטיות
        </Box>
        &nbsp;&nbsp;|&nbsp;&nbsp;
        <Box
          component="span"
          role="button"
          tabIndex={0}
          onClick={() => setTermsOpen(true)}
          onKeyDown={handleKeyDown(setTermsOpen)}
          sx={linkSx}
        >
          תנאי שימוש
        </Box>
        &nbsp;&nbsp;|&nbsp;&nbsp;נגישות
      </Typography>

      <LegalDialog
        open={privacyOpen}
        onClose={() => setPrivacyOpen(false)}
        title="מדיניות פרטיות"
        titleId="privacy-dialog-title"
        sections={privacySections}
      />

      <LegalDialog
        open={termsOpen}
        onClose={() => setTermsOpen(false)}
        title="תנאי שימוש"
        titleId="terms-dialog-title"
        sections={termsSections}
      />
    </>
  );
}
