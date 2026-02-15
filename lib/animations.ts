/**
 * Shared Animation Configurations
 * 
 * Centralized animation variants and motion configs for consistent,
 * performant animations across all components.
 */

import { Variants } from "framer-motion";

/**
 * Premium easing curves for smooth, natural animations
 * Refined cubic-bezier curves for different animation types
 */
export const EASING = {
  // Primary easing - smooth and natural (array format for Framer Motion)
  primary: [0.22, 1, 0.36, 1] as [number, number, number, number],
  // Spring-like for interactive elements
  spring: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
  // Smooth out for exits
  smoothOut: [0.4, 0, 0.2, 1] as [number, number, number, number],
  // Smooth in for entrances
  smoothIn: [0, 0, 0.2, 1] as [number, number, number, number],
  // Elastic for playful interactions
  elastic: [0.68, -0.55, 0.265, 1.55] as [number, number, number, number],
} as const;

/**
 * Standard animation durations (in seconds)
 * Refined for premium feel
 */
export const DURATION = {
  instant: 0.1,
  fast: 0.25,
  normal: 0.5,
  slow: 0.75,
  slower: 1.2,
} as const;

/**
 * Viewport trigger margins for scroll animations
 */
export const VIEWPORT_MARGIN = {
  default: "-100px",
  close: "-50px",
  far: "-150px",
} as const;

/**
 * Page load animation - fade + slight scale
 * Used for initial page entrance
 */
export const pageLoadVariants: Variants = {
  initial: { opacity: 0, scale: 0.98 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: DURATION.normal,
      ease: EASING.primary,
    },
  },
};

/**
 * Premium card hover - enhanced with spring physics
 * More responsive and natural feeling
 */
export const premiumCardHover = {
  y: -15,
  scale: 1.04,
  rotateY: 3,
  rotateX: -2,
  transition: {
    type: "spring",
    stiffness: 300,
    damping: 20,
  },
};

/**
 * Code snippet hover - developer-focused interaction
 * Mimics IDE hover effects
 */
export const codeSnippetHover = {
  scale: 1.05,
  opacity: 0.4,
  filter: "brightness(1.2)",
  transition: {
    duration: DURATION.fast,
    ease: EASING.primary,
  },
};

/**
 * Button ripple effect - premium tactile feedback
 */
export const buttonRipple = {
  scale: [1, 1.2, 1],
  opacity: [0.5, 0, 0],
  transition: {
    duration: 0.6,
    ease: EASING.smoothOut,
  },
};

/**
 * Typewriter effect for code/text
 * Developer-friendly typing animation
 */
export const typewriterEffect = {
  width: ["0%", "100%"],
  transition: {
    duration: 2,
    ease: EASING.smoothIn,
  },
};

/**
 * Terminal cursor blink - authentic dev feel
 */
export const cursorBlink = {
  opacity: [1, 0, 1],
  transition: {
    duration: 1,
    repeat: Infinity,
    ease: "linear",
  },
};

/**
 * Git commit style animation
 * Slides in like a commit message
 */
export const commitMessageVariants: Variants = {
  hidden: { x: -20, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      duration: DURATION.normal,
      ease: EASING.primary,
    },
  },
};

/**
 * Package.json style badge animation
 * Bounces in like npm install
 */
export const packageBadgeAnimation = {
  scale: [0, 1.2, 1],
  rotate: [0, 10, -10, 0],
  transition: {
    type: "spring",
    stiffness: 400,
    damping: 15,
  },
};

/**
 * Container variants for staggered children animations
 * Use with staggerChildren for sequential reveals
 */
export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.08,
      ease: EASING.primary,
    },
  },
};

/**
 * Standard item animation - fade in from bottom
 * Used for text, cards, and general content
 */
export const fadeInUpVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATION.normal,
      ease: EASING.primary,
    },
  },
};

/**
 * Card animation variants - with 3D perspective
 * Includes scale and rotation for depth
 */
export const cardVariants: Variants = {
  hidden: { opacity: 0, y: 50, scale: 0.9, rotateX: 10 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: {
      duration: DURATION.slow,
      ease: EASING.primary,
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
};

/**
 * Card hover animation - 3D tilt and elevation
 * Creates interactive depth effect
 */
export const cardHover = {
  y: -12,
  scale: 1.03,
  rotateY: 2,
  rotateX: -2,
  transition: {
    type: "spring",
    stiffness: 300,
    damping: 20,
  },
};

/**
 * Button hover animation - scale with glow
 * Used for primary CTAs
 */
export const buttonHoverPrimary = {
  scale: 1.08,
  boxShadow: "0 20px 60px rgba(14, 165, 233, 0.5), 0 0 40px rgba(34, 211, 238, 0.3)",
  transition: {
    type: "spring",
    stiffness: 400,
    damping: 17,
  },
};

/**
 * Button hover animation - subtle scale
 * Used for secondary buttons
 */
export const buttonHoverSecondary = {
  scale: 1.05,
  boxShadow: "0 10px 30px rgba(34, 211, 238, 0.3)",
  transition: {
    type: "spring",
    stiffness: 400,
    damping: 17,
  },
};

/**
 * Button tap animation - quick scale down
 * Provides tactile feedback
 */
export const buttonTap = {
  scale: 0.96,
  transition: {
    duration: 0.1,
  },
};

/**
 * Section title animation - scale + fade
 * Used for section headings
 */
export const sectionTitleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: DURATION.normal,
      delay: 0.1,
      ease: EASING.primary,
      type: "spring",
      stiffness: 200,
      damping: 20,
    },
  },
};

/**
 * Section description animation - fade in
 * Used for section subtitles
 */
export const sectionDescriptionVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATION.normal,
      delay: 0.2,
      ease: EASING.primary,
    },
  },
};

/**
 * Icon glow animation - pulsing effect
 * Used for feature icons
 * Note: transition should be passed separately, not as part of animate
 * Using explicit times array to ensure proper keyframe interpolation
 */
export const iconGlowAnimation = {
  opacity: [0, 0.4, 0],
  scale: [1, 1.3, 1],
};

export const iconGlowTransition = {
  duration: 3,
  repeat: Infinity,
  ease: "easeInOut" as const,
  times: [0, 0.5, 1] as const, // Explicit keyframe times
};

