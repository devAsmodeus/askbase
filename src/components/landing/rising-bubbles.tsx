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

type Kind = "file" | "table" | "db" | "book" | "chart" | "chat";

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
};

function makeBubble(w: number, h: number, initial: boolean): Bubble {
  const roll = Math.random();
  const kind: Kind =
    roll < 0.42
      ? "file"
      : roll < 0.56
        ? "table"
        : roll < 0.68
          ? "book"
          : roll < 0.8
            ? "chart"
            : roll < 0.9
              ? "db"
              : "chat";
  const size = 24 + Math.random() * 30;
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
    case "table": {
      // Mini spreadsheet: green sheet, white header band and gridlines
      const w = s;
      const h = s * 0.78;
      const left = x - w / 2;
      const top = y - h / 2;
      ctx.fillStyle = "rgba(16, 163, 74, 0.45)";
      ctx.beginPath();
      ctx.roundRect(left, top, w, h, 3);
      ctx.fill();
      ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
      ctx.beginPath();
      ctx.roundRect(left, top, w, h * 0.24, 3);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      for (let i = 1; i < 3; i++) {
        ctx.moveTo(left + (w * i) / 3, top + h * 0.24);
        ctx.lineTo(left + (w * i) / 3, top + h);
      }
      ctx.moveTo(left, top + h * 0.62);
      ctx.lineTo(left + w, top + h * 0.62);
      ctx.stroke();
      break;
    }
    case "db": {
      // Database cylinder
      const w = s * 0.85;
      const h = s;
      const ry = w * 0.22;
      const left = x - w / 2;
      const top = y - h / 2;
      ctx.fillStyle = "rgba(14, 165, 233, 0.45)";
      ctx.beginPath();
      ctx.ellipse(x, top + h - ry, w / 2, ry, 0, 0, Math.PI);
      ctx.lineTo(left, top + ry);
      ctx.ellipse(x, top + ry, w / 2, ry, 0, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.beginPath();
      ctx.ellipse(x, top + ry, w / 2, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(x, top + h * 0.55, w / 2, ry, 0, 0, Math.PI);
      ctx.stroke();
      break;
    }
    case "book": {
      // Closed journal: violet cover, darker spine, title lines
      const w = s * 0.8;
      const h = s;
      const left = x - w / 2;
      const top = y - h / 2;
      ctx.fillStyle = "rgba(139, 92, 246, 0.45)";
      ctx.beginPath();
      ctx.roundRect(left, top, w, h, 3.5);
      ctx.fill();
      ctx.fillStyle = "rgba(109, 40, 217, 0.55)";
      ctx.beginPath();
      ctx.roundRect(left, top, w * 0.2, h, 3.5);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(left + w * 0.36, top + h * 0.32);
      ctx.lineTo(left + w * 0.82, top + h * 0.32);
      ctx.moveTo(left + w * 0.36, top + h * 0.46);
      ctx.lineTo(left + w * 0.68, top + h * 0.46);
      ctx.stroke();
      break;
    }
    case "chart": {
      // Bar chart card
      const w = s;
      const h = s * 0.82;
      const left = x - w / 2;
      const top = y - h / 2;
      ctx.fillStyle = "rgba(245, 158, 11, 0.42)";
      ctx.beginPath();
      ctx.roundRect(left, top, w, h, 3.5);
      ctx.fill();
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      const bw = w * 0.16;
      const heights = [0.32, 0.55, 0.42];
      heights.forEach((bh, i) => {
        ctx.beginPath();
        ctx.roundRect(
          left + w * (0.18 + i * 0.24),
          top + h * (0.88 - bh),
          bw,
          h * bh,
          1.5
        );
        ctx.fill();
      });
      break;
    }
    case "chat": {
      // Filled chat bubble with typing dots
      const w = s;
      const h = s * 0.72;
      ctx.fillStyle = "rgba(99, 102, 241, 0.45)";
      ctx.beginPath();
      ctx.roundRect(x - w / 2, y - h / 2, w, h, h / 3);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x - w / 6, y + h / 2 - 1);
      ctx.lineTo(x - w / 4, y + h / 2 + s / 5);
      ctx.lineTo(x + w / 12, y + h / 2 - 1);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.arc(x + i * s * 0.16, y, s * 0.05, 0, Math.PI * 2);
        ctx.fill();
      }
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
      const count = Math.min(60, Math.max(26, Math.round((w * h) / 33000)));
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
