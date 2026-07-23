"use client";

import * as React from "react";
import { useReducedMotion } from "motion/react";

/**
 * Interactive "knowledge constellation" canvas: drifting nodes (your docs)
 * linked into a graph, gently attracted to the cursor — connections light up
 * around it. Fits the product story: documents connected into answers.
 *
 * Cheap by design: 2D canvas, ~70 nodes, DPR capped, static frame for
 * reduced-motion users.
 */

const PALETTE = [
  { r: 99, g: 102, b: 241 }, // indigo
  { r: 217, g: 70, b: 239 }, // fuchsia
  { r: 245, g: 158, b: 11 }, // amber
];

const LINK_DIST = 130;
const CURSOR_DIST = 200;

type Node = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: (typeof PALETTE)[number];
};

function makeNodes(w: number, h: number): Node[] {
  const count = Math.min(90, Math.max(40, Math.round((w * h) / 22000)));
  return Array.from({ length: count }, (_, i) => {
    const color = PALETTE[i % 6 === 5 ? 2 : i % 3 === 2 ? 1 : 0];
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r: i % 7 === 0 ? 3 : 1.4 + Math.random() * 1.2,
      color,
    };
  });
}

export function KnowledgeField() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const prefersReduced = useReducedMotion();

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    let w = 0;
    let h = 0;
    let nodes: Node[] = [];
    let raf = 0;
    const mouse = { x: -9999, y: -9999 };

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      nodes = makeNodes(w, h);
    };
    resize();

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      // Links between nearby nodes
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > LINK_DIST * LINK_DIST) continue;
          const d = Math.sqrt(d2);
          // Links near the cursor glow brighter
          const mx = (a.x + b.x) / 2 - mouse.x;
          const my = (a.y + b.y) / 2 - mouse.y;
          const nearCursor = Math.max(0, 1 - Math.hypot(mx, my) / CURSOR_DIST);
          const alpha = (1 - d / LINK_DIST) * (0.1 + nearCursor * 0.35);
          ctx.strokeStyle = `rgba(${a.color.r}, ${a.color.g}, ${a.color.b}, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      // Nodes
      for (const n of nodes) {
        const mdx = n.x - mouse.x;
        const mdy = n.y - mouse.y;
        const md = Math.hypot(mdx, mdy);
        const near = Math.max(0, 1 - md / CURSOR_DIST);
        ctx.fillStyle = `rgba(${n.color.r}, ${n.color.g}, ${n.color.b}, ${0.35 + near * 0.45})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + near * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const step = () => {
      for (const n of nodes) {
        // Gentle pull toward the cursor
        const dx = mouse.x - n.x;
        const dy = mouse.y - n.y;
        const d = Math.hypot(dx, dy);
        if (d < CURSOR_DIST && d > 1) {
          const f = ((1 - d / CURSOR_DIST) * 0.012) / d;
          n.vx += dx * f;
          n.vy += dy * f;
        }
        // Drift, damping, wrap
        n.x += n.vx;
        n.y += n.vy;
        n.vx *= 0.995;
        n.vy *= 0.995;
        const speed = Math.hypot(n.vx, n.vy);
        if (speed < 0.08) {
          n.vx += (Math.random() - 0.5) * 0.02;
          n.vy += (Math.random() - 0.5) * 0.02;
        }
        if (n.x < -20) n.x = w + 20;
        if (n.x > w + 20) n.x = -20;
        if (n.y < -20) n.y = h + 20;
        if (n.y > h + 20) n.y = -20;
      }
      draw();
      raf = requestAnimationFrame(step);
    };

    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const onLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    if (prefersReduced) {
      draw(); // single static frame, no loop, no cursor tracking
    } else {
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerout", onLeave, { passive: true });
      raf = requestAnimationFrame(step);
    }
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerout", onLeave);
      window.removeEventListener("resize", resize);
    };
  }, [prefersReduced]);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />;
}
