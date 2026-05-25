/**
 * Testimonial data shared between the landing-page testimonials section
 * and the dedicated /testimonials page.
 */
import photoBlonde from '@/assets/testimonial-photo-0-blonde.png';
import photoMan from '@/assets/testimonial-photo-1-man.png';
import photoCurly from '@/assets/testimonial-photo-2-curly.png';
import type { StaticImageData } from 'next/image';

export interface VideoTestimonial {
  name: string;
  photo: StaticImageData;
}

export interface QuoteTestimonial {
  text: string;
  author: string;
  avatar: string;
}

export const videoTestimonials: VideoTestimonial[] = [
  { name: 'ממליצה 1', photo: photoBlonde },
  { name: 'ממליץ 2', photo: photoMan },
  { name: 'ממליצה 3', photo: photoCurly },
];

export const quoteTestimonials: QuoteTestimonial[] = [
  {
    text: '"לא היה לי מושג בכלל איזה פטורים יש בצו הארנונה ובתקנות. בזכות מחשבון הארנונה, נפתחו בפניי כל הפטורים הרלבנטיים לי ויכולתי להגיש השגה ולקבל החזר"',
    author: 'ניר מימון',
    avatar: '/images/testimonials/nir.png',
  },
  {
    text: '"הרגשנו במשך הרבה חודשים שאנחנו משלמים ארנונה גבוה מידי, בעקבות שימוש במחשבון הארנונה ביססנו את טענותינו והגשנו השגה לעירייה"  פשוט מושלם. תודה למחשבון הארנונה"',
    author: 'קבוצת פרידנזון',
    avatar: '/images/testimonials/friendzone.png',
  },
  {
    text: '“פניתי לעורך דין שדרש ממני 700 ₪ עבור ייעוץ ראשוני ו- 1,500 ₪ על כתיבת ההשגה בזכות המחשבון עשיתי את זה בעשירית מהסכום ומבלי לצאת מהבית"',
    author: 'מלי אהרון',
    avatar: '/images/testimonials/mali.png',
  },
  {
    text: '"מי ידע בכלל שעל נכס ריק יש פטור של 6 חודשים? ולמי יש זמן לנסוע לעירייה? זה פיתרון פשוט מושלם. תודה למחשבון הארנונה"',
    author: 'סיגל גזית',
    avatar: '/images/testimonials/sigal.png',
  },
];
