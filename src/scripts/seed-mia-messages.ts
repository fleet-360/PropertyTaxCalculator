import mongoose from 'mongoose';
import MiaMessage from '../lib/models/MiaMessage';

const MONGODB_URI =
  process.env.MONGODB_URI_MONGODB_URI || ""

const DEFAULT_MESSAGES = [
  {
    messageId: 'step-0-default',
    title: '👋 שלום! אני מיה, יועצת הארנונה שלך',
    description:
      'המחשבון שלנו מנתח את נתוני הנכס שלך ומשווה אותם לתעריפי הרשות המקומית.\n\nתוך שניות תקבל הערכה מדויקת + המלצות לחיסכון!',
    isActive: true,
  },
  {
    messageId: 'step-0-private',
    title: '🏠 מצוין! בחרת בנכס למגורים',
    description: 'עכשיו בואו נבחר את העיר שלך כדי שנוכל לחשב את הארנונה לפי התעריפים המעודכנים.',
    isActive: true,
  },
  {
    messageId: 'step-0-business',
    title: '🏢 נכס עסקי? אני כאן לעזור!',
    description: 'בואו נתחיל עם בחירת העיר. נחשב את הארנונה לפי סוג העסק והאזור.',
    isActive: true,
  },
  {
    messageId: 'step-1-default',
    title: '📋 לפני שנמשיך',
    description: 'יש כמה דברים חשובים שכדאי לדעת. קרא את התנאים ואשר כדי להמשיך.',
    isActive: true,
  },
  {
    messageId: 'step-2-default',
    title: '✏️ בואו נזין את פרטי הנכס',
    description: 'ככל שהנתונים מדויקים יותר, כך התוצאה תהיה טובה יותר. מלא את כל השדות הרלוונטיים.',
    isActive: true,
  },
  {
    messageId: 'step-3-default',
    title: '💡 בדיקת הנחות',
    description: 'בואו נבדוק אם מגיעה לך הנחה על הארנונה. בחר את ההנחות הרלוונטיות מהרשימה.',
    isActive: true,
  },
  {
    messageId: 'step-4-default',
    title: '✅ כמעט סיימנו!',
    description: 'רק צריך לאשר את ההצהרה ונוכל לחשב את הארנונה שלך.',
    isActive: true,
  },
  {
    messageId: 'step-4-note-accuracy',
    title: '🤔',
    description:
      '🤔 התחשיב מסתמך על נכונות הפרטים שהזנת. לפני שתמשיך — בדוק שנית את נכונות הפרטים והתאמה לדוח הארנונה.',
    isActive: true,
  },
  {
    messageId: 'step-4-note-ordinance',
    title: '🤔',
    description:
      '🤔 התחשיב עלול להשתנות כתוצאה משינויים בתוך צו הארנונה, ולכן נמליץ לך גם לבדוק את החישוב בהתאם לצו הארנונה.',
    isActive: true,
  },
  {
    messageId: 'step-5-overpaying',
    title: '🎉 נמצא חיסכון אפשרי!',
    description: 'לפי הנתונים שהזנת, נראה שאתה משלם יותר מהנדרש. בואו נראה את הפרטים המלאים.',
    isActive: true,
  },
  {
    messageId: 'step-5-match',
    title: '👍 החישוב תואם!',
    description: 'נראה שהחישוב שלך תואם את הנתונים שגובה העירייה. זה חדשות טובות!',
    isActive: true,
  },
  {
    messageId: 'step-5-underpaying',
    title: '📊 נמצא הפרש',
    description: 'לפי המחשבון, נמצא אי-התאמה בין תוצאת המחשבון לדו"ח הארנונה שלך.',
    isActive: true,
  },
  {
    messageId: 'step-6-default',
    title: '📊 הנה התוצאות המלאות',
    description: 'לפניך פירוט מלא של חישוב הארנונה. ניתן להדפיס או לשלוח במייל.',
    isActive: true,
  },
  {
    messageId: 'step-7-default',
    title: '📝 הגשת השגה',
    description: 'רוצה להגיש השגה? אני אעזור לך לנסח מכתב מקצועי על בסיס הנתונים שהזנת.',
    isActive: true,
  },
  {
    messageId: 'error-measurement',
    title: '📏 טעות במדידה?',
    description: 'אם אתה סבור שהשטח הרשום בעירייה אינו תואם את השטח בפועל, הזן את השטח המתוקן ונבדוק את ההפרש.',
    isActive: true,
  },
  {
    messageId: 'error-classification',
    title: '🏷️ טעות בסיווג?',
    description: 'אם הנכס שלך מסווג בצורה שגויה, בחר את הסיווג הנכון לדעתך. סיווג שגוי עלול לגרום לחיוב יתר משמעותי.',
    isActive: true,
  },
];

async function main() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log(`Connected to MongoDB: ${MONGODB_URI}`);

    for (const msg of DEFAULT_MESSAGES) {
      await MiaMessage.findOneAndUpdate(
        { messageId: msg.messageId },
        { $set: msg },
        { upsert: true, new: true },
      );
      console.log(`Upserted: ${msg.messageId}`);
    }

    console.log(`Seeded ${DEFAULT_MESSAGES.length} Mia messages`);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

main();
