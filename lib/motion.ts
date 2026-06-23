import type { Variants } from 'framer-motion'

// Shared entrance variants for the dashboard refresh animation.
// Each element: ~0.4s. Groups stagger their children by 0.10s.
// Whole sequence resolves within ~1.5–2s. Mount-driven, so it replays on every
// full browser refresh but not on component re-renders.

const EASE = [0.22, 1, 0.36, 1] as const
const DURATION = 0.4

// Single-use, independently-animated elements. Delays are baked into the
// variant (a variant's own transition overrides the `transition` prop), so the
// top-level order is: sidebar → header → top-seller card.
export const fadeLeft: Variants = {
  hidden: { opacity: 0, x: -24 },
  show: { opacity: 1, x: 0, transition: { duration: DURATION, ease: EASE, delay: 0.05 } },
}

export const fadeDown: Variants = {
  hidden: { opacity: 0, y: -14 },
  show: { opacity: 1, y: 0, transition: { duration: DURATION, ease: EASE, delay: 0.18 } },
}

export const riseScale: Variants = {
  hidden: { opacity: 0, y: 22, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: EASE, delay: 0.28 } },
}

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: DURATION, ease: EASE } },
}

/** fadeUp with a fixed delay — for elements that can't rely on stagger propagation. */
export const fadeUpDelayed = (delay: number): Variants => ({
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: DURATION, ease: EASE, delay } },
})

/** Orchestrating container: reveals children one-by-one after `delayChildren`. */
export const group = (delayChildren = 0): Variants => ({
  hidden: {},
  show: { transition: { delayChildren, staggerChildren: 0.1 } },
})
