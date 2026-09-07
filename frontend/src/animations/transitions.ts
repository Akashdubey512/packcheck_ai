import { Transition, Variants } from 'framer-motion';

/**
 * Restrained transitions - strictly avoid bouncy or flashy marketing animations.
 * Enterprise regulatory tone: subtle, calm, instant feedback.
 */

export const standardTransition: Transition = {
  duration: 0.15,
  ease: [0.16, 1, 0.3, 1], // ease-out cubic
};

export const fadeInVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: standardTransition },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};

export const panelVariants: Variants = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0, transition: standardTransition },
  exit: { opacity: 0, y: -4, transition: { duration: 0.1 } },
};
