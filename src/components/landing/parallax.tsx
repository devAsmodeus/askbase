"use client";

import * as React from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";

type ParallaxLayerProps = {
  children: React.ReactNode;
  className?: string;
  /**
   * How far the layer drifts relative to scroll, in px over the layer's
   * time on screen. Positive = lags behind (feels far away), negative =
   * moves ahead (feels close). Try 40–160.
   */
  drift?: number;
};

/**
 * Scrolls children at a different speed than the page, creating depth.
 * Static for reduced-motion users.
 */
export function ParallaxLayer({ children, className, drift = 80 }: ParallaxLayerProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [drift, -drift]);

  return (
    <motion.div ref={ref} className={className} style={prefersReduced ? undefined : { y }}>
      {children}
    </motion.div>
  );
}

/** Gently bobs children up and down forever — for floating decorative cards. */
export function Floating({
  children,
  className,
  duration = 6,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  duration?: number;
  delay?: number;
}) {
  const prefersReduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      animate={prefersReduced ? undefined : { y: [0, -10, 0] }}
      transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}
