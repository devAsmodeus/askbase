"use client";

import * as React from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useScroll,
  useTransform,
  useReducedMotion,
} from "motion/react";
import { RisingBubbles } from "./rising-bubbles";

/** Scroll stops for the page-wide color fade (Cann-style). */
const LIGHT_STOPS = ["#e0e7ff", "#fae8ff", "#fef3c7", "#fce7f3", "#e0e7ff"];
const DARK_STOPS = ["#1e1b4b", "#3b0764", "#451a03", "#500724", "#1e1b4b"];
const OFFSETS = [0, 0.3, 0.55, 0.8, 1];

/**
 * Living page background, themed like a soda site for knowledge:
 * the whole page cross-fades between pastel tints as you scroll, thin
 * outlined chat-bubbles/docs/question-marks rise like carbonation, and a
 * soft glow follows the cursor.
 */
export function InteractiveBackground() {
  const prefersReduced = useReducedMotion();
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    const html = document.documentElement;
    const update = () => setIsDark(html.classList.contains("dark"));
    update();
    const observer = new MutationObserver(update);
    observer.observe(html, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const { scrollYProgress } = useScroll();
  const backgroundColor = useTransform(
    scrollYProgress,
    OFFSETS,
    isDark ? DARK_STOPS : LIGHT_STOPS
  );

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
      {/* Scroll color fade — flat tint that changes with scroll position */}
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundColor: prefersReduced
            ? isDark
              ? DARK_STOPS[0]
              : LIGHT_STOPS[0]
            : backgroundColor,
        }}
      />

      {/* Cursor-follow glow */}
      {!prefersReduced && (
        <motion.div
          className="absolute h-[640px] w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            left: x,
            top: y,
            background:
              "radial-gradient(circle, rgba(99, 102, 241, 0.16) 0%, rgba(217, 70, 239, 0.07) 40%, transparent 70%)",
          }}
        />
      )}

      {/* Rising outlined bubbles: chat, docs, question marks */}
      <RisingBubbles />
    </div>
  );
}
