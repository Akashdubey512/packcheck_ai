import { Transition, Variants } from 'framer-motion';

/**
 * 120 FPS BUTTER-SMOOTH MOTION DESIGN TOKENS
 * Tuned for zero-jitter, hardware-accelerated rendering on the compositor thread.
 * Only properties that avoid layout recalculation (transform & opacity) are animated.
 */

// Ultra-smooth spring physics tuned for tactile, native-feeling feedback
export const butterSpring: Transition = {
  type: 'spring',
  stiffness: 380,
  damping: 30,
  mass: 0.8,
};

export const snappySpring: Transition = {
  type: 'spring',
  stiffness: 500,
  damping: 35,
  mass: 0.6,
};

export const gentleSpring: Transition = {
  type: 'spring',
  stiffness: 260,
  damping: 24,
  mass: 0.9,
};

// Standard institutional easing curve (Apple / Linear style cubic-bezier)
export const standardEase: Transition = {
  duration: 0.22,
  ease: [0.16, 1, 0.3, 1], // ease-out cubic
};

export const fastEase: Transition = {
  duration: 0.14,
  ease: [0.16, 1, 0.3, 1],
};

// Page Transition Variants: Smooth 4px elevation glide with fast opacity fade
export const pageFadeSlide: Variants = {
  initial: {
    opacity: 0,
    y: 6,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.18,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: {
      duration: 0.12,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

// Stagger Container: Cascades children smoothly into view
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.045,
      delayChildren: 0.02,
    },
  },
};

export const staggerFast: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.025,
      delayChildren: 0.01,
    },
  },
};

// Staggered Child Items: Glides in from slightly below
export const staggerItem: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 28,
      mass: 0.8,
    },
  },
};

// Micro-Interaction: Smooth button hover lift & tap compression
export const buttonTapMotion = {
  whileHover: {
    scale: 1.012,
    y: -1,
    transition: { duration: 0.15, ease: [0.16, 1, 0.3, 1] },
  },
  whileTap: {
    scale: 0.975,
    y: 0,
    transition: { duration: 0.08, ease: [0.16, 1, 0.3, 1] },
  },
};

// Micro-Interaction: Card hover elevation
export const cardHoverMotion = {
  initial: { y: 0 },
  whileHover: {
    y: -2,
    transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] },
  },
};

// Modal & Dropdown popover entrance
export const modalPopoverVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.96,
    y: -6,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: butterSpring,
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: -4,
    transition: { duration: 0.12, ease: [0.16, 1, 0.3, 1] },
  },
};

// GPU Compositor Acceleration Style Helper
export const gpuAcceleratedStyle = {
  willChange: 'transform, opacity' as const,
  backfaceVisibility: 'hidden' as const,
};
