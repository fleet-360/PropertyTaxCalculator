/**
 * Centralized consent text registry.
 *
 * When the wording of a consent changes, bump the `version` field.
 * The full text is stored alongside each ConsentRecord so old records
 * retain a snapshot of what the user actually saw.
 */

import type { ConsentType } from '@/lib/types/consent';

export interface ConsentTextEntry {
  version: string;
  text: string;
}

export const CONSENT_TEXTS: Record<ConsentType, ConsentTextEntry> = {
  data_retention: {
    version: '1.0',
    text: 'הנני מצהיר/ה ומאשר/ת את שמירת הנתונים האישיים שאזין במערכת. הנתונים יישמרו אצל מנהל המערכת, ואני מסכים/ה לכך שמנהל המערכת יוכל לפנות אליי בנוגע לנתונים אלה.',
  },
  legal_disclaimer: {
    version: '1.0',
    text: 'הנני מצהיר/ה ומאשר/ת כי מחשבון הארנונה אינו מהווה ייעוץ משפטי ו/או תחליף לייעוץ משפטי, וכי תוצאות החישוב מבוססות על הנתונים שהזנתי במחשבון ולצורך התמצאות בלבד. לאחר שעיינתי בתקנון האתר ובמדיניות הפרטיות, הנני מצהיר/ה כי לא אעלה באופן אישי ו/או באמצעות מי מטעמי כל טענה ו/או תלונה ו/או תביעה כנגד מחשבון הארנונה ומנהליו בכל מקרה של שימוש במחשבון הארנונה ובמקרה של סטייה מהתוצאה המופיעה בצו הארנונה.',
  },
};
