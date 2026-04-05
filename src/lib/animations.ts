import type { Variants, Transition } from 'framer-motion';

/** Global multiplier — slows all entrance animations by 40% */
export const DURATION_MULTIPLIER = 1.4;

/** Smooth cubic-bezier easing used across animations */
const SMOOTH_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Build a Framer Motion transition with the global multiplier applied */
export function createTransition(
  baseDuration: number,
  baseDelay = 0,
): Transition {
  return {
    duration: baseDuration * DURATION_MULTIPLIER,
    delay: baseDelay * DURATION_MULTIPLIER,
    ease: SMOOTH_EASE,
  };
}

/* ------------------------------------------------------------------ */
/*  Shared Variants                                                    */
/* ------------------------------------------------------------------ */

/** Fade in + slide up from y:30 */
export const fadeSlideUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: createTransition(0.7,1.5),
  },
};

/** Fade in + slide from the left (x:-60) */
export const fadeSlideLeft: Variants = {
  hidden: { opacity: 0, x: -60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: createTransition(0.5, 0.15),
  },
};

/** Fade in + slide from the right (x:+60) */
export const fadeSlideRight: Variants = {
  hidden: { opacity: 0, x: 60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: createTransition(0.5, 0.15),
  },
};

/** Scale up from 0.88 with a slight fade */
export const scaleIn: Variants = {
  hidden: { scale: 0.01, opacity: 0.1 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: createTransition(2),
  },
};

/** Stagger container — orchestrates child animations */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.18 * DURATION_MULTIPLIER,
    },
  },
};

/** No-op variants for reduced-motion mode */
export const reducedMotionVariants: Variants = {
  hidden: {},
  visible: {},
};
