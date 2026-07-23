"use client";

import { motion, useScroll, useSpring, useReducedMotion } from "motion/react";

/** Thin gradient bar at the very top showing reading progress. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 28, mass: 0.4 });
  const prefersReduced = useReducedMotion();
  if (prefersReduced) return null;

  return (
    <motion.div
      aria-hidden
      className="fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-amber-400"
      style={{ scaleX }}
    />
  );
}
