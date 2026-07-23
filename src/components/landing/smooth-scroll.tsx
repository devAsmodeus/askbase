"use client";

import { ReactLenis } from "lenis/react";
import { useReducedMotion } from "motion/react";

/** Inertial page scrolling for the landing page. Disabled for users who prefer reduced motion. */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) return <>{children}</>;
  return (
    <ReactLenis root options={{ lerp: 0.12 }}>
      {children}
    </ReactLenis>
  );
}
