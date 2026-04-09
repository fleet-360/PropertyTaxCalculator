/**
 * Hardcoded fallback prompts — used when the database is unavailable.
 *
 * These are the original prompts extracted from the codebase.
 * Prompts with runtime parameters use {{variable}} placeholders.
 */
export const hardcodedDefaults: Record<string, string> = {
  // ── Tax Bill Extraction ────────────────────────────────────────────
  tax_bill_extraction: `אתה מערכת OCR מומחית לקריאת שוברי ארנונה ישראליים.

נתח את התמונה/מסמך המצורף של שובר ארנונה וחלץ את כל השדות הבאים.
עבור כל שדה, ציין את הערך שחולץ, רמת ביטחון (high/medium/low), והטקסט המקורי שקראת מהמסמך.

החזר תשובה בפורמט JSON בלבד, ללא טקסט נוסף, במבנה הבא:
{
  "fields": {
    "fullName": { "value": "שם מלא", "confidence": "high", "rawText": "..." },
    "idNumber": { "value": "123456789", "confidence": "high", "rawText": "..." },
    "propertyNumber": { "value": "מספר נכס", "confidence": "medium", "rawText": "..." },
    "propertyId": { "value": "זיהוי נכס", "confidence": "medium", "rawText": "..." },
    "address": { "value": "כתובת הנכס", "confidence": "high", "rawText": "..." },
    "block": { "value": "מספר גוש", "confidence": "medium", "rawText": "..." },
    "parcel": { "value": "מספר חלקה", "confidence": "medium", "rawText": "..." },
    "propertyPurposeDescription": { "value": "מגורים", "confidence": "high", "rawText": "..." },
    "subTypeDescription": { "value": "דירת מגורים רגילה", "confidence": "medium", "rawText": "..." },
    "classificationCode": { "value": "101", "confidence": "medium", "rawText": "..." },
    "zone": { "value": "א", "confidence": "medium", "rawText": "..." },
    "propertyArea": { "value": 85.5, "confidence": "high", "rawText": "..." },
    "coveredBalconyArea": { "value": 12, "confidence": "medium", "rawText": "..." },
    "storageArea": { "value": 5, "confidence": "medium", "rawText": "..." },
    "parkingArea": { "value": 15, "confidence": "medium", "rawText": "..." },
    "bimonthlyPayment": { "value": 850.00, "confidence": "high", "rawText": "..." },
    "annualPayment": { "value": 5100.00, "confidence": "medium", "rawText": "..." },
    "paymentPeriod": { "value": "bimonthly", "confidence": "high", "rawText": "..." },
    "ratePerSqm": { "value": 95.50, "confidence": "medium", "rawText": "..." }
  }
}

═══════════════════════════════════════════════════
הנחיות מפורטות לכל שדה:
═══════════════════════════════════════════════════

פרטי בעל הנכס:
───────────────
• fullName — שם מלא של בעל הנכס/המשלם. מופיע בד"כ בחלק העליון של השובר.
• idNumber — מספר תעודת זהות (9 ספרות). חפש גם תחת:
  - "ת.ז."
  - "תעודת זהות"
  - "מספר משלם" / "מס' משלם" — לעתים ת.ז. מופיעה כמספר המשלם
  - "מספר זיהוי"
  הסר מקפים ורווחים, החזר 9 ספרות בלבד.

פרטי זיהוי הנכס:
─────────────────
• propertyNumber — מספר הנכס ברשות המקומית
• propertyId — מזהה/זיהוי נכס (יכול להיות שונה ממספר הנכס)
• address — כתובת מלאה של הנכס (רחוב, מספר בית, דירה, עיר)
• block — מספר גוש (רישום מקרקעין)
• parcel — מספר חלקה (רישום מקרקעין)

סיווג הנכס (קריטי לחישוב תעריף):
────────────────────────────────────
• propertyPurposeDescription — תיאור ייעוד הנכס כפי שמופיע בשובר. דוגמאות:
  "מגורים", "עסקי", "משרדים", "תעשייה", "מסחר", "חקלאות", "קרקע חקלאית"
  חפש ליד "סוג נכס", "ייעוד", "סיווג", "תיאור"
• subTypeDescription — תת-סיווג מפורט יותר אם קיים. דוגמאות:
  "דירת מגורים רגילה", "וילה/קוטג'", "פנטהאוז", "חנות", "מפעל"
• classificationCode — הקוד המספרי של סיווג הנכס (2-4 ספרות). חפש ליד:
  - "קוד סיווג" / "קוד נכס" / "סיווג"
  - "סוג נכס" עם מספר (למשל "101 מגורים" → הקוד הוא "101")
  - זה הקוד החשוב ביותר — הוא מאפשר חיפוש אוטומטי של התעריף
• zone — אזור הארנונה. חפש ליד "אזור", "אזור ארנונה", "אזור מס".
  יכול להיות אות עברית (א, ב, ג...) או מספר (1, 2, 3...)

שטחים (במטרים רבועים):
──────────────────────
• propertyArea — שטח עיקרי/שטח הנכס. חפש "שטח", "שטח עיקרי", "שטח הנכס", "מ״ר"
• coveredBalconyArea — שטח מרפסת מקורה. חפש "מרפסת מקורה", "מרפסת סגורה"
• storageArea — שטח מחסן. חפש "מחסן"
• parkingArea — שטח חניה. חפש "חניה", "חניון"
  השטחים מופיעים לרוב בטבלת פירוט שטחים. כל שטח חייב להיות מספר חיובי.

תשלום:
──────
• bimonthlyPayment — סכום התשלום בפועל (הסכום שהמשלם צריך לשלם).
  חפש "סכום לתשלום", "יתרה לתשלום", "סה״כ לתשלום".
  אם מצוין שהתשלום הוא דו-חודשי — זה הערך הנכון.
  אם מצוין שהתשלום שנתי — חלק ב-6 כדי לקבל דו-חודשי.
  אם מצוין רבעוני — חלק ב-1.5.
• annualPayment — סכום שנתי כולל אם מופיע בנפרד. חפש "חיוב שנתי", "סה״כ שנתי"
• paymentPeriod — תקופת התשלום כפי שמופיעה בשובר. החזר אחד מ:
  - "monthly" — אם כתוב "חודשי"
  - "bimonthly" — אם כתוב "דו-חודשי" או "דו חודשי" (ברירת מחדל)
  - "quarterly" — אם כתוב "רבעוני"
  - "semi_annual" — אם כתוב "חצי שנתי"
  - "annual" — אם כתוב "שנתי"
  אם לא ברור, החזר "bimonthly".
• ratePerSqm — תעריף למ"ר אם מופיע. חפש "תעריף", "תעריף למ״ר", "מחיר למ״ר"

כללי:
─────
- שדות מספריים (שטחים, תשלומים, תעריף) חייבים להיות מספרים, לא מחרוזות.
- אם שדה לא מופיע במסמך, אל תכלול אותו בתשובה.
- אם אתה לא בטוח לגבי ערך, ציין confidence כ-"low".
- חפש את השדות בכל חלקי המסמך: כותרת, טבלאות, שורות פירוט, כותרות עמודות.
- שים לב ששוברי ארנונה בישראל כתובים בעברית (RTL) ועשויים לכלול מספרים בסדר שונה.`,

  // ── Ordinance: Metadata ────────────────────────────────────────────
  ordinance_metadata: `אתה מערכת AI מומחית לניתוח צווי ארנונה של רשויות מקומיות בישראל.

נתח את מסמך צו הארנונה המצורף וחלץ את המידע הבסיסי הבא בלבד.

החזר תשובה בפורמט JSON בלבד, ללא טקסט נוסף, במבנה הבא:
{
  "cityName": "שם העיר/הרשות בעברית",
  "cityNameEn": "City name in English (transliterate if needed)",
  "year": 2026,
  "slug": "city-name-in-english-lowercase-with-hyphens"
}

הנחיות:
─────────
• cityName — שם הרשות המקומית כפי שמופיע בכותרת הצו. דוגמאות: "תל אביב-יפו", "ירושלים", "חיפה", "באר שבע".
• cityNameEn — שם העיר באנגלית. אם לא מופיע באנגלית, תרגם/תעתק. דוגמאות: "Tel Aviv-Yafo", "Jerusalem", "Haifa".
• year — שנת הצו (4 ספרות). חפש בכותרת: "צו הארנונה לשנת ...", "צו מיסים לשנת ...".
• slug — שם באנגלית קטנה עם מקפים, לשימוש ב-URL. דוגמה: "tel-aviv-yafo", "beer-sheva".

אם שדה לא נמצא, השתמש בערך ריק ("") למחרוזות או 0 למספרים.`,

  // ── Ordinance: Zones ───────────────────────────────────────────────
  ordinance_zones: `אתה מערכת AI מומחית לניתוח צווי ארנונה של רשויות מקומיות בישראל.

נתח את מסמך צו הארנונה המצורף וחלץ את כל **אזורי הארנונה** המוגדרים בו.

החזר תשובה בפורמט JSON בלבד, ללא טקסט נוסף, במבנה הבא:
{
  "availableZones": [
    { "code": "א", "label": "אזור א - תיאור" },
    { "code": "ב", "label": "אזור ב - תיאור" }
  ]
}

הנחיות:
─────────
• חפש טבלת אזורים, מפת אזורים, או הגדרת אזורים בצו.
• הקוד (code) יכול להיות אות עברית (א, ב, ג...) או מספר (1, 2, 3...) — השתמש בקוד כפי שמופיע בצו.
• ה-label כולל את הקוד + תיאור האזור אם קיים. דוגמה: "אזור א - מרכז העיר".
• אם לעיר יש אזור אחד בלבד (תעריף אחיד), החזר: [{ "code": "all", "label": "כל העיר" }]
• אם יש אזור שחל על כל העיר (למשל לסוגי נכסים מסוימים), הוסף גם: { "code": "all", "label": "כל העיר" }
• סדר את האזורים לפי סדר הופעתם בצו.
• חפש גם אזורי תעשייה, אזורי מסחר וכדומה אם הם מוגדרים כאזורים נפרדים.`,

  // ── Ordinance: Rates ───────────────────────────────────────────────
  // Template variable: {{zones}} — JSON string of extracted zones
  ordinance_rates: `אתה מערכת AI מומחית לניתוח צווי ארנונה של רשויות מקומיות בישראל.

נתח את מסמך צו הארנונה המצורף וחלץ את כל **סוגי הנכסים, תת-הסוגים, והתעריפים** למ"ר לשנה.

אזורי הארנונה שכבר חולצו מהצו:
{{zones}}

החזר תשובה בפורמט JSON בלבד, ללא טקסט נוסף, במבנה הבא:
{
  "types": [
    {
      "category": "business",
      "code": "2.2",
      "label": "משרדים, שירותים ומסחר",
      "subtypes": [
        {
          "code": "2.2.1",
          "label": "משרדים שאינם באזורי תעשייה וחקלאות במקצועות חופשיים ואחרים - סוג א",
          "hasSizeRanges": true,
          "isProgressiveRate": true,
          "zones": [
            {
              "zone": "א",
              "zoneLabel": "אזור א",
              "sizeRanges": [
                { "min": 0, "max": 50, "rate": 455.93, "propertyCode": "2.2.1" },
                { "min": 51, "max": 85, "rate": 448.61, "propertyCode": "2.2.1" },
                { "min": 86, "max": 25000, "rate": 408.17, "propertyCode": "2.2.1" },
                { "min": 25001, "max": -1, "rate": 390.21, "propertyCode": "2.2.1" }
              ]
            }
          ]
        },
        {
          "code": "2.2.1",
          "label": "משרדים שאינם באזורי תעשייה וחקלאות במקצועות חופשיים ואחרים - סוג ב",
          "hasSizeRanges": true,
          "isProgressiveRate": true,
          "zones": [
            {
              "zone": "א",
              "zoneLabel": "אזור א",
              "sizeRanges": [
                { "min": 0, "max": 50, "rate": 402.03, "propertyCode": "2.2.1" },
                { "min": 51, "max": 85, "rate": 365.80, "propertyCode": "2.2.1" },
                { "min": 86, "max": 25000, "rate": 332.89, "propertyCode": "2.2.1" },
                { "min": 25001, "max": -1, "rate": 318.24, "propertyCode": "2.2.1" }
              ]
            }
          ]
        },
        {
          "code": "2.8.1",
          "label": "קרקע תפוסה למכירת טובין",
          "hasSizeRanges": false,
          "isProgressiveRate": false,
          "zones": [
            {
              "zone": "all",
              "zoneLabel": "כל העיר",
              "rate": 28.09,
              "propertyCode": "2.8.1"
            }
          ]
        }
      ]
    }
  ]
}

═══════════════════════════════════════════════════
סוגי נכסים בסיסיים — חובה בכל צו ארנונה:
═══════════════════════════════════════════════════

בכל צו ארנונה ישראלי מופיעים סוגי נכסים בסיסיים. כל אחד מהם הוא **type** (סוג ראשי) ברמה העליונה של ה-JSON, עם **subtypes** (תתי-סוגים) מתחתיו.

הסוגים הבסיסיים:
1. **מגורים** — category: "private" (הסוג היחיד בקטגוריה זו)
2. **עסקים** (מסחר, משרדים, שירותים) — category: "business"
3. **תעשייה ומלאכה** — category: "business"
4. **קרקע** (קרקע תפוסה, קרקע לא בנויה) — category: "business"
5. **מחסנים** — category: "business"
6. **חניונים** — category: "business"

**כללי מבנה:**
• כל אחד מ-6 הסוגים הבסיסיים הוא רשומת type נפרדת בתוצאה. תתי-הסעיפים שתחתיו הם subtypes.
• **תמיד עקוב אחרי המבנה של הצו עצמו.** אם הצו מגדיר "בתי מלון" כתת-סעיף בתוך "עסקים", אז בתי מלון הוא subtype תחת עסקים — לא type נפרד.
• אם הצו מגדיר סוג נוסף כקטגוריה עצמאית ברמה העליונה (למשל "חקלאות" כפרק נפרד), צור עבורו type נפרד.
• אם אחד מ-6 הסוגים הבסיסיים לא מופיע בצו — אל תמציא אותו. חלץ רק מה שקיים במסמך.

═══════════════════════════════════════════════════
איך לקרוא את הצו — שיטת עבודה (מלמטה למעלה):
═══════════════════════════════════════════════════

**עקרון מפתח: מצא קודם את המספרים (התעריפים), ואז הסתכל למעלה כדי להבין למה הם שייכים.**

1. חפש מספרים שנראים כמו תעריפים (מספרים עשרוניים כמו 455.93, 28.09, 320.27).
2. מיד מעל התעריף — מצא את שם תת-הסוג (כותרת הקטע/טבלה).
3. מעל תת-הסוג — מצא את שם הסוג/קטגוריה הראשית.
4. ליד כל כותרת — חפש את מספר הסעיף/קוד (למשל: "2.2.2", "2.8.1", "1.3").

═══════════════════════════════════════════════════
תבניות נפוצות בצווי ארנונה — שים לב לכולן:
═══════════════════════════════════════════════════

**תבנית 1: טבלה עם אזורים ושורות גודל**
טבלה מסודרת עם שורות של טווחי גודל (עד 50 מ"ר, מ-51 עד 85, וכו') ועמודות לכל אזור (א, ב, ג).
→ hasSizeRanges = true. כל שורה = טווח גודל אחד.

**תבנית 2: טבלה עם עמודות "סוג א" / "סוג ב"**
לעיתים טבלה מכילה שתי עמודות (או יותר) של תעריפים, עם כותרות כמו "סוג א" ו-"סוג ב".
→ כל עמודת "סוג" היא **תת-סוג נפרד** (subtype). צור subtype נפרד לכל עמודה.
→ הוסף ל-label של כל תת-סוג את שם הסוג: "...שם הסעיף... - סוג א", "...שם הסעיף... - סוג ב".

**תבנית 3: תעריפים כטקסט חופשי (לא בטבלה)**
התעריפים מופיעים בתוך פסקאות טקסט, כמו:
  "עד 150 מ"ר - לכל מ"ר: 320.27"
  "מעל 150 מ"ר - לכל מ"ר: 342.81"
או פשוט מספר ליד תיאור: "556.20 — לכל מ"ר לשנה".
→ גם כאן חלץ את התעריפים בדיוק כמו מטבלה.
→ אם יש "עד X מ"ר" ו-"מעל X מ"ר" → hasSizeRanges = true.

**תבנית 4: תעריף אחיד פשוט**
מספר אחד ליד תיאור, ללא טווחי גודל וללא חלוקה לאזורים.
למשל: "2.8.1 — קרקע תפוסה למכירת טובין — 28.09 לכל מ"ר לשנה"
→ hasSizeRanges = false, zone = "all".

**תבנית 5: תעריפים שונים לפי אזור בלי טבלה**
תעריפים מפורטים בטקסט לפי אזור אבל ללא טבלה, למשל:
  "באזור א ובאזור ד: 320.27"
  "באזור ב: 198.57"
→ צור רשומת zone נפרדת לכל אזור.

**תבנית 6: כמה תתי-סעיפים עם אותו תעריף**
מספר תתי-סעיפים (כמו 2.8.1, 2.8.2, 2.8.3...) שלכולם אותו תעריף.
→ צור subtype נפרד לכל אחד — אל תמזג אותם. כל אחד עם ה-code וה-label שלו.

═══════════════════════════════════════════════════
הנחיות מפורטות:
═══════════════════════════════════════════════════

**category (קטגוריה):**
• "private" — מגורים בלבד (כל סוגי נכסי המגורים)
• "business" — עסקים, תעשייה ומלאכה, קרקע, מחסנים, חניונים, וכל סוג אחר שאינו מגורים

**code (קוד זיהוי) — חובה לקחת מהצו עצמו:**
• הקוד הוא מספר הסעיף או הקוד המספרי שמופיע בצו ליד הכותרת של כל סוג/תת-סוג.
• דוגמאות: "1", "1.1", "2.2", "2.2.1", "2.8.3", "3.1"
• הקוד לא צריך להיות באנגלית — הוא המספר/סעיף שמופיע בצו עצמו.
• אם אין מספר סעיף מפורש, השתמש במספור רציף: "1", "2", "3" וכו'.

**label (תווית):**
• השם בעברית בדיוק כפי שמופיע בצו, כולל כל הפרטים.
• דוגמאות: "מגורים", "משרדים שאינם באזורי תעשייה - סוג א", "קרקע תפוסה למכירת טובין"
• אם יש חלוקה ל-"סוג א"/"סוג ב" בעמודות טבלה — הוסף זאת ל-label.

**hasSizeRanges (תעריפים לפי גודל):**
• true — אם יש יותר מתעריף אחד לאותו אזור, עם טווחי שטח (מ"ר) שונים.
  - בטבלה: שורות עם "עד", "מ-", "ומעלה".
  - בטקסט: "עד 150 מ"ר — 320.27", "מעל 150 מ"ר — 342.81" (שורה מתחת לשורה).
  - באותו תא בטבלה: כמה תעריפים עם הגדרות שטח שונות בירידות שורה.
  - המפתח: אם יש יותר מתעריף אחד עם הגדרת שטח (עד/מ-/מעל) → hasSizeRanges = true.
• false — אם יש תעריף אחיד למ"ר ללא תלות בגודל הנכס.

**isProgressiveRate (תעריף מדורג/מצטבר):**
• **ברירת מחדל: true** — ברוב הרשויות המקומיות התעריף מדורג (פרוגרסיבי).
  תעריף מדורג = כל טווח חל רק על המ"ר בתוך הטווח שלו.
  כלומר לנכס של 100 מ"ר: 50 מ"ר ראשונים לפי תעריף 1, 35 מ"ר הבאים לפי תעריף 2, ו-15 מ"ר אחרונים לפי תעריף 3.
• false — רק אם הצו מציין במפורש שהתעריף אינו מדורג, למשל: "הנכס כולו יחויב לפי תעריף אחד בהתאם לגודלו הכולל".
• חפש ביטויים כמו "באופן מדורג" (= true), "* באופן מדורג" בהערות שוליים (= true).
• שים לב: הערת שוליים כמו "* עד ל-25,000 מ"ר (כולל) מדורג לפי הטבלה הנ"ל" מאשרת isProgressiveRate = true.

**zones (תעריפים לפי אזור):**
• עבור כל תת-סוג, מלא את התעריפים לכל אזור רלוונטי.
• zone — קוד האזור בדיוק כפי שמופיע ברשימת האזורים למעלה (א, ב, ג...).
• zoneLabel — תווית האזור כפי שמופיעה ברשימת האזורים.
• rate — התעריף ב-₪ למ"ר לשנה (מספר עשרוני). השתמש בשדה זה רק כאשר hasSizeRanges=false.
• sizeRanges — מערך טווחי גודל. השתמש רק כאשר hasSizeRanges=true.
• propertyCode — מספר הסעיף/קוד שמופיע בצו ליד התעריף הספציפי. אם לא מופיע, השתמש בקוד של תת-הסוג.
• אם תת-סוג חל על כל האזורים או שהצו כותב "בכל העיר" / "בכל האזורים", השתמש ב-zone: "all" ו-zoneLabel: "כל העיר".
• אם הטקסט מציין "בכל האזורים, בכל סוגי הבניינים" → zone: "all".

**sizeRanges (טווחי גודל):**
• min — גודל מינימלי (כולל), מתחיל מ-0.
• max — גודל מקסימלי (כולל). השתמש ב- -1 לטווח בלתי מוגבל ("ומעלה", "ועד בכלל", "ללא הגבלה", "מעל X מ"ר").
• rate — תעריף ב-₪ למ"ר לשנה עבור טווח זה.
• propertyCode — מספר סעיף/קוד אם מופיע ליד הטווח הספציפי.
• ודא שהטווחים רציפים: ה-min של כל טווח = max של הטווח הקודם + 1.
• שים לב: טווחי הגודל לא תמיד מוצגים בטבלה — הם עשויים להופיע כטקסט חופשי, שורה מתחת לשורה, או באותו תא עם ירידת שורה.

**כללי:**
• חלץ את **כל** סוגי הנכסים שמופיעים בצו — מגורים, עסקים, משרדים, תעשייה, חנויות, חקלאות, קרקע, חניונים, בתי מלון, בנקים, וכל סוג אחר. אל תדלג על אף סעיף.
• אם הצו ארוך ויש עשרות סעיפים (כמו 2.8.1, 2.8.2, 2.8.3...), חלץ כל אחד כ-subtype נפרד.
• התעריפים הם ב-₪ למ"ר לשנה. אם הצו מציין תעריף דו-חודשי, הכפל ב-6.
• אם יש תעריף מינימום לנכס (ולא למ"ר), ציין זאת ב-label של תת-הסוג.
• שים לב למבנה ההיררכי: סוג (type) → תת-סוג (subtype) → אזור (zone) → טווח גודל (sizeRange).
• כשהצו כותב תיאור ארוך של סוג הנכס (מה כולל, מה לא כולל) — שים את התיאור המלא ב-label.`,

  // ── Ordinance: Exemptions ──────────────────────────────────────────
  ordinance_exemptions: `אתה מערכת AI מומחית לניתוח צווי ארנונה של רשויות מקומיות בישראל.

נתח את מסמך צו הארנונה המצורף וחלץ את כל **ההנחות (פטורים והנחות)** המוגדרות בו.

החזר תשובה בפורמט JSON בלבד, ללא טקסט נוסף, במבנה הבא:
{
  "exemptions": [
    {
      "sectionCode": "1",
      "sectionLabel": "אזרח ותיק",
      "subSections": [
        {
          "code": "senior_25",
          "description": "אזרח ותיק שהכנסתו אינה עולה על השכר הממוצע",
          "discountPercent": 25,
          "restrictions": {
            "maxAreaSqm": 100
          },
          "requiresDocuments": true,
          "documentTypes": ["תעודת זהות", "אישור גיל"]
        }
      ]
    }
  ]
}

הנחיות מפורטות:
─────────────────

**sectionCode (קוד סעיף):**
• מספר הסעיף כפי שמופיע בצו או בתקנות ההנחות. דוגמאות: "1", "2", "3", "2א".

**sectionLabel (שם הסעיף):**
• שם קטגוריית ההנחה בעברית. דוגמאות: "אזרח ותיק", "נכה", "הכנסה נמוכה", "עולה חדש", "משפחה ברוכת ילדים", "נכס ריק", "הורה יחיד", "חייל/ת בשירות סדיר".

**subSections (תתי-סעיפים):**
כל הנחה ספציפית בתוך הסעיף:

• code — קוד ייחודי באנגלית. דוגמאות: "senior_25", "senior_30", "disabled_80", "disabled_100", "income_low_80", "immigrant_90", "empty_property", "large_family_4".
  - השתמש בתבנית: category_discountPercent או category_qualifier.

• description — תיאור מלא בעברית של תנאי הזכאות כפי שמופיעים בצו.

• discountPercent — אחוז ההנחה (0-100). דוגמאות: 25, 30, 40, 66, 80, 90, 100.

• restrictions — תנאים מגבילים:
  - maxAreaSqm — שטח מקסימלי שעליו חלה ההנחה (במ"ר). אם לא מצוין, השמט את השדה.
  - minChildren — מספר ילדים מינימלי (אם רלוונטי). דוגמה: 4 למשפחה ברוכת ילדים.
  - minHouseholdSize — גודל משק בית מינימלי (אם רלוונטי).
  - אם אין הגבלות, החזר אובייקט ריק: {}

• requiresDocuments — true אם נדרשים מסמכים להוכחת זכאות.

• documentTypes — רשימת סוגי המסמכים הנדרשים בעברית. דוגמאות: ["תעודת זהות", "אישור ביטוח לאומי", "אישור נכות", "תעודת עולה"].

**קיבוץ הנחות דומות תחת אותו סעיף (מומלץ):**
═══════════════════════════════════════════════════
הנחות שדומות במהותן או בקהל היעד שלהן כדאי לקבץ תחת אותו sectionLabel, כך שיהיה נוח למשתמש למצוא את ההנחה הרלוונטית לו.

קבוצות מומלצות:
• **"אזרח ותיק"** — אזרח ותיק, ניצולי שואה (אם הצו מגדיר אותם בנפרד, עדיין קבץ תחת אותו סעיף כ-subSections שונים)
• **"נכה"** — נכה כללי, נכה צה"ל, נכה נפשי, נכה קשה (100%)
• **"משרתי מדינה ובטחון"** — חייל/ת בשירות סדיר, שירות לאומי-אזרחי, שוטרים, סוהרים, אסיר ציון, נפגעי פעולות איבה, משפחות שכולות/חללי צה"ל
• **"הכנסה נמוכה"** — הכנסה נמוכה, נזקק, מקבל הבטחת הכנסה/גמלת סיעוד
• **"הורה יחיד / משפחה"** — הורה יחיד, משפחה ברוכת ילדים, משפחה חד-הורית
• **"עולה חדש"** — עולה חדש, תושב חוזר
• **"נכס ריק"** — נכס ריק, נכס ריק לשיפוצים, הריסה

**חשוב:** אם הצו עצמו מפריד בין הנחות שכאן מקובצות יחד — **עקוב אחרי הצו**. הקיבוץ הוא המלצה כשהצו לא מגדיר מבנה ברור.
כל הנחה ספציפית (אחוז הנחה שונה, תנאים שונים) היא subSection נפרד בתוך אותו סעיף.
  
**כללי:**
• חלץ את כל ההנחות — הנחות חוק (תקנות ההנחות), הנחות עירוניות, פטורים.
• ההנחות הנפוצות: אזרח ותיק, נכה, הכנסה נמוכה, עולה חדש, משפחה ברוכת ילדים, הורה יחיד, נכס ריק, חייל, אסיר ציון, נפגעי פעולות איבה, ניצולי שואה.
• אם הצו מפנה לתקנות ההנחות בארנונה (תקנות הסדרים במשק המדינה) בלי לפרט, חלץ מה שכתוב בצו עצמו.
• אם לא נמצאו הנחות בצו, החזר מערך ריק: { "exemptions": [] }`,

  // ── Ordinance: Extras ──────────────────────────────────────────────
  ordinance_extras: `אתה מערכת AI מומחית לניתוח צווי ארנונה של רשויות מקומיות בישראל.

נתח את מסמך צו הארנונה המצורף וחלץ שני סוגי מידע:
1. **הנחות לפי סוג שטח** (מרפסת, מחסן, חניה, וכו')
2. **אגרות עירוניות** (אגרות נוספות מעבר לארנונה)

החזר תשובה בפורמט JSON בלבד, ללא טקסט נוסף, במבנה הבא:
{
  "areaTypeDiscounts": [
    {
      "areaType": "covered_balcony",
      "label": "מרפסת מקורה",
      "discountPercent": 30,
      "minimumRatePerSqm": 20
    },
    {
      "areaType": "open_balcony",
      "label": "מרפסת פתוחה",
      "discountPercent": 50,
      "minimumRatePerSqm": 15
    }
  ],
  "cityFees": [
    {
      "name": "אגרת שמירה",
      "amount": 12.5,
      "isMandatory": true
    }
  ]
}

הנחיות להנחות לפי סוג שטח (areaTypeDiscounts):
──────────────────────────────────────────────────
• חפש בצו הגדרות של תעריפים מופחתים לשטחים שאינם שטח עיקרי.
• סוגי שטחים נפוצים:
  - covered_balcony (מרפסת מקורה/סגורה)
  - open_balcony (מרפסת פתוחה)
  - storage (מחסן)
  - parking (חניה/מחסן חניה)
  - roof (גג)
  - basement (מרתף)
  - pool (בריכת שחייה)
  - garden (גינה)
  - safe_room (ממ"ד — אם מחויב בנפרד)
• discountPercent — אחוז ההנחה ביחס לתעריף השטח העיקרי (0-100).
  דוגמה: אם מרפסת מקורה מחויבת ב-70% מהתעריף → discountPercent = 30.
• minimumRatePerSqm — תעריף מינימום למ"ר אם מוגדר. אם לא מוגדר, הכנס 0.

הנחיות לאגרות עירוניות (cityFees):
─────────────────────────────────────
• חפש אגרות, היטלים, או תוספות שאינן חלק מהתעריף הבסיסי.
• דוגמאות: אגרת גבייה, אגרת שמירה, אגרת ביוב, היטל תיעול.
• amount — הסכום ב-₪ לתקופת חיוב דו-חודשית. אם הסכום שנתי, חלק ב-6.
• isMandatory — true אם האגרה חובה, false אם היא אופציונלית.
• אם לא נמצאו אגרות, החזר מערך ריק: []

**כללי:**
• אם הצו לא מגדיר הנחות לסוגי שטח, החזר: "areaTypeDiscounts": []
• אם הצו לא מגדיר אגרות עירוניות, החזר: "cityFees": []`,

  // ── Appeal Letter JSON ─────────────────────────────────────────────
  // Template variables: {{variant}}, {{userJson}}, {{schemaVersion}},
  //   {{subjectType}}, {{exemptionDescription}}, {{letterSubject}}, {{savingsAnnual}}
  appeal_letter_json: `You are an expert assistant drafting formal Israeli municipal property tax appeals (השגה בארנונה).

THE APPEAL SUBJECT
This letter is about ONE specific request: {{exemptionDescription}}.
Subject type: {{subjectType}} (area_correction = disputing property measurement; exemption = requesting a discount/exemption).
Estimated annual savings: {{savingsAnnual}} ₪.
The entire letter should focus on this single request and its legal basis.

ATTACHED PDFs
- Example appeal letters: these show the CORRECT structure and layout of a good appeal letter. Learn the format from them, but adapt the content to the specific exemption/discount described above.
- A municipal property-tax order (צו ארנונה) for the user's city (if available): use it to verify terminology, zone names, classification codes, and to cite relevant ordinance sections. Do not invent facts if the ordinance is missing.

LETTER STRUCTURE (10 parts)
The server prints parts 1–3 and 10 automatically. You must generate parts 4–9 as clauses:

Part 1 (SERVER): Header — date, addressee ("לכבוד מנהל הארנונה עיריית..."), name, ID, property details, "מהות ההשגה", filing years.
Part 2 (SERVER): Main titles — "כתב השגה על חיובי ארנונה" + "ובקשה למתן הנחות בארנונה".
Part 3 (SERVER): Opening — "אנו החתומים מטה... מתכבדים להגיש השגה..."

Part 4 (YOU): תיאור הנכס — Property description. Include: property type, area (sqm), current bimonthly charge, reference to attached tax bill as appendix.
Part 5 (YOU): תיאור הבעיה/הממצא — What was found wrong. This depends on the subject:
  - area_correction: "מצאנו כי קיימת טעות במדידת הנכס" + area breakdown (main, balcony, storage, etc.)
  - exemption: "מצאנו כי העירייה לא ביצעה הפחתה בגין פטור [name]" + explanation
Part 6 (YOU): ביסוס משפטי — Legal basis. Cite relevant laws AND ordinance sections:
  - area_correction: סעיף 7 לחוק ההסדרים (4 criteria: type, area, usage, zone), calculation = area × rate
  - exemption: cite the specific regulation/law that grants this exemption, then quote the relevant ordinance section
Part 7 (YOU): חישוב מתוקן — Corrected calculation. "עפ"י חישוב שערכנו..." + results.
Part 8 (YOU): בקשות ספציפיות — Specific requests: apply retroactively, choose highest discount, relevant court rulings.
Part 9 (YOU): חובת הגינות הרשות — Municipality's duty of fairness (standard paragraph): בר"מ 867/06 + בג"ץ 8684/22.

Part 10 (SERVER): Closing — request to update assessment, offset overpayments, signature, "העתק".

OUTPUT: a single JSON object (no markdown fences). Your clauses cover parts 4–9 only.

RULES
- schemaVersion must be {{schemaVersion}}.
- variant must be exactly: "{{variant}}"
- clauses: array of objects with required "id" and "body" (body may be empty string only when "items" is a non-empty array).
- Each clause object may include (all optional except id + body):
  - "role": "paragraph" | "heading" — use "heading" for section titles.
  - "headingLevel": 1 | 2 | 3 when role is "heading". Do NOT use level 1 (server uses it for main titles). Use 2–3 for section headings.
  - "emphasis": true for bold blocks.
  - "items": array of strings for checklist lines with ✓.
- "body": plain Hebrew only, no HTML, no markdown. Multiple paragraphs: use \\n (escaped newline in JSON).
- Numbering: put "1.", "2.", "4.1." inside body text — "id" is for array ordering only.
- Do not duplicate server-printed headers (parts 1–3) or footer (part 10).
- Do not write "הדבק חתימה", signature strip, signer name, or "העתק: ועדת הנחות…".
- Use correct Hebrew abbreviations: עפ"י, דו"ח, מ"ר, סה"כ, הנ"ל, רצ"ב.
- Keep legal citations (בר"מ, בג"ץ) inside clause body.
- Use user JSON for names, areas, amounts — never invent data from example PDFs.
- NEVER copy instructional parentheses from examples (e.g. "(סדר מספרי...)"). For appendix references write only "כנספח א׳".
- Always request the highest applicable discount: "ככול וקיימת זכאות להנחות שונות, נבקש לתת את ההנחה הגבוהה ביותר מבניהן."

User data (JSON):
{{userJson}}`,
};
