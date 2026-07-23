"use client";

import * as React from "react";
import { motion, useScroll, useSpring, useReducedMotion } from "motion/react";

/**
 * A glowing gradient beam that zig-zags down the whole page and draws
 * itself in as you scroll. Sits between the fixed background and the
 * content (absolute, full document height).
 */
export function ScrollBeam() {
  const [size, setSize] = React.useState({ w: 0, h: 0 });
  const prefersReduced = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 55, damping: 20, mass: 0.6 });

  React.useEffect(() => {
    const measure = () =>
      setSize({
        w: document.documentElement.clientWidth,
        h: document.documentElement.scrollHeight,
      });
    measure();
    // Content (fonts, images, pinned sections) settles after first paint
    const t = setTimeout(measure, 1500);
    window.addEventListener("resize", measure);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", measure);
    };
  }, []);

  const d = React.useMemo(() => {
    const { w, h } = size;
    if (!w || !h) return "";
    const segments = Math.max(4, Math.round(h / 1100));
    const segH = h / segments;
    const leftX = w * 0.1;
    const rightX = w * 0.9;
    let path = `M ${w * 0.5} 0`;
    let prevX = w * 0.5;
    let prevY = 0;
    for (let i = 0; i < segments; i++) {
      const y = (i + 1) * segH;
      const x = i % 2 === 0 ? rightX : leftX;
      // S-curve between the zig points for a smooth, laser-like sweep
      path += ` C ${prevX} ${prevY + segH * 0.55}, ${x} ${y - segH * 0.55}, ${x} ${y}`;
      prevX = x;
      prevY = y;
    }
    return path;
  }, [size]);

  if (!d) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 -z-[1] overflow-hidden"
      style={{ height: size.h }}
    >
      <svg
        width="100%"
        height={size.h}
        viewBox={`0 0 ${size.w} ${size.h}`}
        preserveAspectRatio="none"
        fill="none"
      >
        <defs>
          <linearGradient id="beam-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#6366F1" />
            <stop offset="0.35" stopColor="#D946EF" />
            <stop offset="0.7" stopColor="#F59E0B" />
            <stop offset="1" stopColor="#6366F1" />
          </linearGradient>
          <filter id="beam-blur-wide" x="-50%" y="-5%" width="200%" height="110%">
            <feGaussianBlur stdDeviation="16" />
          </filter>
          <filter id="beam-blur-mid" x="-50%" y="-5%" width="200%" height="110%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>
        {/* Luminous halo */}
        <motion.path
          d={d}
          stroke="url(#beam-gradient)"
          strokeWidth={44}
          strokeLinecap="round"
          opacity={0.35}
          filter="url(#beam-blur-wide)"
          style={{ pathLength: prefersReduced ? 1 : progress }}
        />
        {/* Inner glow */}
        <motion.path
          d={d}
          stroke="url(#beam-gradient)"
          strokeWidth={16}
          strokeLinecap="round"
          opacity={0.5}
          filter="url(#beam-blur-mid)"
          style={{ pathLength: prefersReduced ? 1 : progress }}
        />
        {/* Bright core */}
        <motion.path
          d={d}
          stroke="url(#beam-gradient)"
          strokeWidth={6}
          strokeLinecap="round"
          opacity={0.9}
          style={{ pathLength: prefersReduced ? 1 : progress }}
        />
        {/* White-hot center line */}
        <motion.path
          d={d}
          stroke="#fff"
          strokeWidth={1.8}
          strokeLinecap="round"
          opacity={0.6}
          style={{ pathLength: prefersReduced ? 1 : progress }}
        />
      </svg>
    </div>
  );
}
