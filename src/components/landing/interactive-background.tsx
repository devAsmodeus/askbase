"use client";

import * as React from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "motion/react";
import { KnowledgeField } from "./knowledge-field";

/**
 * Living page background: a soft gradient glow follows the cursor while two
 * organic blobs slowly morph and drift behind the content. Static for
 * reduced-motion users.
 */
export function InteractiveBackground() {
  const prefersReduced = useReducedMotion();
  const mx = useMotionValue(-400);
  const my = useMotionValue(-400);
  const x = useSpring(mx, { stiffness: 40, damping: 18, mass: 0.8 });
  const y = useSpring(my, { stiffness: 40, damping: 18, mass: 0.8 });

  React.useEffect(() => {
    if (prefersReduced) return;
    const onMove = (e: PointerEvent) => {
      mx.set(e.clientX);
      my.set(e.clientY);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [prefersReduced, mx, my]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 transform-gpu overflow-hidden"
    >
      {/* Colorful animated base */}
      <div className="landing-gradient absolute inset-0" />

      {/* Drifting color blobs */}
      <div className="blob blob-a absolute left-[-10%] top-[-15%] h-[50vmax] w-[50vmax]" />
      <div className="blob blob-b absolute bottom-[-20%] right-[-12%] h-[45vmax] w-[45vmax]" />
      <div className="blob blob-c absolute left-[30%] top-[50%] h-[35vmax] w-[35vmax]" />

      {/* Cursor-follow glow */}
      {!prefersReduced && (
        <motion.div
          className="absolute h-[640px] w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            left: x,
            top: y,
            background:
              "radial-gradient(circle, rgba(99, 102, 241, 0.28) 0%, rgba(217, 70, 239, 0.12) 40%, transparent 70%)",
          }}
        />
      )}

      {/* Soft veil keeps text readable without killing the color */}
      <div className="absolute inset-0 bg-background/25" />

      {/* Knowledge constellation — nodes & links reacting to the cursor */}
      <KnowledgeField />
    </div>
  );
}
