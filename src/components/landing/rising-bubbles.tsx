"use client";

import * as React from "react";
import { useReducedMotion } from "motion/react";

/**
 * Cann-style carbonation, themed for AskBase: recognizable file-type badges
 * (PDF, DOC, XLS, CSV, MD, TXT), books and chat bubbles slowly rise up the
 * page like fizz, swaying and dodging the cursor.
 */

type FileKind = { label: string; r: number; g: number; b: number };

const FILE_KINDS: FileKind[] = [
  { label: "PDF", r: 239, g: 68, b: 68 }, // red
  { label: "DOC", r: 59, g: 130, b: 246 }, // blue
  { label: "XLS", r: 22, g: 163, b: 74 }, // green
  { label: "CSV", r: 5, g: 150, b: 105 }, // teal-green
  { label: "MD", r: 99, g: 102, b: 241 }, // indigo
  { label: "TXT", r: 100, g: 116, b: 139 }, // slate
];

const STROKES = [
  "99, 102, 241", // indigo
  "217, 70, 239", // fuchsia
  "217, 119, 6", // amber
];

type Kind = "file" | "book" | "chat" | "circle";

type Bubble = {
  kind: Kind;
  file: FileKind;
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
  const roll = Math.random();
  // Half the fizz is file badges, the rest keeps the airy feel
  const kind: Kind = roll < 0.5 ? "file" : roll < 0.62 ? "book" : roll < 0.76 ? "chat" : "circle";
  const size =
    kind === "file" || kind === "book" ? 22 + Math.random() * 20 : 8 + Math.random() * 22;
  return {
    kind,
    file: FILE_KINDS[Math.floor(Math.random() * FILE_KINDS.length)],
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

function drawBubble(ctx: CanvasRenderingContext2D, b: Bubble, x: number, y: number) {
  const s = b.size;

  switch (b.kind) {
    case "file": {
      // File badge: page with a folded corner, format color, label
      const w = s * 0.82;
      const h = s;
      const fold = w * 0.32;
      const { r, g, b: bl } = b.file;
      const left = x - w / 2;
      const top = y - h / 2;

      ctx.beginPath();
      ctx.moveTo(left + 3, top);
      ctx.lineTo(left + w - fold, top);
      ctx.lineTo(left + w, top + fold);
      ctx.lineTo(left + w, top + h - 3);
      ctx.quadraticCurveTo(left + w, top + h, left + w - 3, top + h);
      ctx.lineTo(left + 3, top + h);
      ctx.quadraticCurveTo(left, top + h, left, top + h - 3);
      ctx.lineTo(left, top + 3);
      ctx.quadraticCurveTo(left, top, left + 3, top);
      ctx.closePath();
      ctx.fillStyle = `rgba(${r}, ${g}, ${bl}, 0.5)`;
      ctx.fill();

      // Folded corner flap
      ctx.beginPath();
      ctx.moveTo(left + w - fold, top);
      ctx.lineTo(left + w - fold, top + fold);
      ctx.lineTo(left + w, top + fold);
      ctx.closePath();
      ctx.fillStyle = `rgba(${r}, ${g}, ${bl}, 0.75)`;
      ctx.fill();

      // Format label
      ctx.font = `700 ${Math.round(s * 0.3)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
      ctx.fillText(b.file.label, x, top + h * 0.62);
      break;
    }
    case "book": {
      // Open book: two page halves + spine
      const w = s * 1.15;
      const h = s * 0.75;
      ctx.strokeStyle = `rgba(${b.stroke}, ${b.alpha + 0.12})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(x, y - h * 0.28);
      ctx.quadraticCurveTo(x - w * 0.28, y - h * 0.55, x - w / 2, y - h * 0.32);
      ctx.lineTo(x - w / 2, y + h * 0.35);
      ctx.quadraticCurveTo(x - w * 0.28, y + h * 0.12, x, y + h * 0.4);
      ctx.quadraticCurveTo(x + w * 0.28, y + h * 0.12, x + w / 2, y + h * 0.35);
      ctx.lineTo(x + w / 2, y - h * 0.32);
      ctx.quadraticCurveTo(x + w * 0.28, y - h * 0.55, x, y - h * 0.28);
      ctx.moveTo(x, y - h * 0.28);
      ctx.lineTo(x, y + h * 0.4);
      ctx.stroke();
      break;
    }
    case "chat": {
      const w = s;
      const h = s * 0.72;
      ctx.strokeStyle = `rgba(${b.stroke}, ${b.alpha})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(x - w / 2, y - h / 2, w, h, h / 3);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - w / 6, y + h / 2);
      ctx.lineTo(x - w / 4, y + h / 2 + s / 5);
      ctx.lineTo(x + w / 12, y + h / 2);
      ctx.stroke();
      break;
    }
    case "circle": {
      ctx.strokeStyle = `rgba(${b.stroke}, ${b.alpha})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(x, y, s / 2, 0, Math.PI * 2);
      ctx.stroke();
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
      const count = Math.min(44, Math.max(20, Math.round((w * h) / 46000)));
      bubbles = Array.from({ length: count }, () => makeBubble(w, h, true));
    };
    resize();

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const margin = 60;
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
        drawBubble(ctx, b, x, sy);
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
