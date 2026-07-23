"use client";

import * as React from "react";
import { useReducedMotion } from "motion/react";

/**
 * Cann-style carbonation, themed for AskBase: thin outlined chat bubbles,
 * documents, question marks and plain bubbles slowly rising up the page,
 * swaying like fizz. Cursor gently pushes them aside.
 */

const STROKES = [
  "99, 102, 241", // indigo
  "217, 70, 239", // fuchsia
  "217, 119, 6", // amber (darker for contrast on pastel)
];

type Kind = "circle" | "doc" | "chat" | "question";
const KINDS: Kind[] = ["circle", "circle", "circle", "doc", "chat", "question"];

type Bubble = {
  kind: Kind;
  x: number;
  y: number;
  size: number;
  speed: number;
  swayAmp: number;
  swayFreq: number;
  phase: number;
  stroke: string;
  alpha: number;
};

function makeBubble(w: number, h: number, initial: boolean): Bubble {
  const size = 8 + Math.random() * 26;
  return {
    kind: KINDS[Math.floor(Math.random() * KINDS.length)],
    x: Math.random() * w,
    y: initial ? Math.random() * h : h + size + Math.random() * 80,
    size,
    speed: 0.15 + Math.random() * 0.45,
    swayAmp: 8 + Math.random() * 22,
    swayFreq: 0.3 + Math.random() * 0.5,
    phase: Math.random() * Math.PI * 2,
    stroke: STROKES[Math.floor(Math.random() * STROKES.length)],
    alpha: 0.18 + Math.random() * 0.22,
  };
}

function drawBubble(ctx: CanvasRenderingContext2D, b: Bubble, x: number) {
  ctx.strokeStyle = `rgba(${b.stroke}, ${b.alpha})`;
  ctx.lineWidth = 1.2;
  const s = b.size;

  switch (b.kind) {
    case "circle": {
      ctx.beginPath();
      ctx.arc(x, b.y, s / 2, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case "doc": {
      const w = s * 0.78;
      const h = s;
      ctx.beginPath();
      ctx.roundRect(x - w / 2, b.y - h / 2, w, h, 2.5);
      ctx.stroke();
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const ly = b.y - h / 4 + (i * h) / 4;
        ctx.moveTo(x - w / 4, ly);
        ctx.lineTo(x + w / 4, ly);
      }
      ctx.stroke();
      break;
    }
    case "chat": {
      const w = s;
      const h = s * 0.72;
      ctx.beginPath();
      ctx.roundRect(x - w / 2, b.y - h / 2, w, h, h / 3);
      ctx.stroke();
      // tail
      ctx.beginPath();
      ctx.moveTo(x - w / 6, b.y + h / 2);
      ctx.lineTo(x - w / 4, b.y + h / 2 + s / 5);
      ctx.lineTo(x + w / 12, b.y + h / 2);
      ctx.stroke();
      break;
    }
    case "question": {
      ctx.font = `${Math.round(s)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = `rgba(${b.stroke}, ${b.alpha + 0.06})`;
      ctx.fillText("?", x, b.y);
      break;
    }
  }
}

export function RisingBubbles() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const prefersReduced = useReducedMotion();

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    // Bubbles live in "world" space and shift with scroll at a slower rate,
    // so they drift past like a parallax layer instead of sitting still.
    const PARALLAX = 0.35;
    let w = 0;
    let h = 0;
    let bubbles: Bubble[] = [];
    let raf = 0;
    let t = 0;
    let scrollY = window.scrollY;
    const mouse = { x: -9999, y: -9999 };

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(48, Math.max(22, Math.round((w * h) / 42000)));
      bubbles = Array.from({ length: count }, () => makeBubble(w, h, true));
    };
    resize();

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const margin = 50;
      const range = h + margin * 2;
      for (const b of bubbles) {
        // Screen position = world position shifted by parallax scroll, wrapped
        const raw = b.y - scrollY * PARALLAX;
        const sy = ((((raw + margin) % range) + range) % range) - margin;
        const sway = Math.sin(t * b.swayFreq + b.phase) * b.swayAmp;
        let x = b.x + sway;
        // Cursor pushes bubbles aside
        const dx = x - mouse.x;
        const dy = sy - mouse.y;
        const d = Math.hypot(dx, dy);
        if (d < 140 && d > 1) {
          x += (dx / d) * (1 - d / 140) * 26;
        }
        drawBubble(ctx, { ...b, y: sy }, x);
      }
    };

    const step = () => {
      t += 0.016;
      for (const b of bubbles) {
        b.y -= b.speed; // own buoyancy on top of the scroll parallax
      }
      draw();
      raf = requestAnimationFrame(step);
    };

    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const onScroll = () => {
      scrollY = window.scrollY;
    };

    if (prefersReduced) {
      draw();
    } else {
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("scroll", onScroll, { passive: true });
      raf = requestAnimationFrame(step);
    }
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", resize);
    };
  }, [prefersReduced]);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />;
}
