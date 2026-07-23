"use client";

import * as React from "react";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { FileUp, MessageSquareText, Code2, Check } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;

const STEPS = [
  {
    icon: FileUp,
    title: "Upload your knowledge",
    text: "Drag in the docs your customers ask about — PDFs, Markdown, plain text. AskBase chunks and embeds them for semantic search.",
    accent: "text-indigo-500",
    chip: "bg-indigo-100 dark:bg-indigo-950",
  },
  {
    icon: MessageSquareText,
    title: "Test in the playground",
    text: "Chat with your bot in a ChatGPT-style interface. Tune the welcome message, color and instructions until it sounds like you.",
    accent: "text-emerald-500",
    chip: "bg-emerald-100 dark:bg-emerald-950",
  },
  {
    icon: Code2,
    title: "Embed the widget",
    text: "Paste one script tag into your website. Your visitors get instant answers, 24/7 — with sources cited.",
    accent: "text-amber-500",
    chip: "bg-amber-100 dark:bg-amber-950",
  },
];

/* ------------------------- per-step visuals ------------------------- */

function UploadScene() {
  const docs = [
    { name: "help-center.pdf", chunks: 32 },
    { name: "shipping-faq.md", chunks: 14 },
    { name: "returns-policy.txt", chunks: 9 },
  ];
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      {docs.map((d, i) => (
        <motion.div
          key={d.name}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 + i * 0.15, duration: 0.5, ease: EASE }}
          className="flex items-center justify-between rounded-xl border bg-background px-4 py-3 shadow-md"
        >
          <span className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-950">
              <FileUp className="size-4 text-indigo-500" />
            </span>
            <span className="text-sm font-medium">{d.name}</span>
          </span>
          <span className="flex items-center gap-1.5 text-xs text-emerald-600">
            <Check className="size-3.5" /> {d.chunks} chunks
          </span>
        </motion.div>
      ))}
    </div>
  );
}

function PlaygroundScene() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.45, ease: EASE }}
        className="self-end rounded-2xl rounded-br-md bg-emerald-500 px-4 py-2.5 text-sm text-white shadow-md"
      >
        Do you offer refunds?
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.45, ease: EASE }}
        className="max-w-[90%] self-start rounded-2xl rounded-bl-md border bg-background px-4 py-2.5 text-sm shadow-md"
      >
        Yes — full refund within 30 days, no questions asked.
        <span className="mt-2 block w-fit rounded-full border bg-muted/50 px-2 py-0.5 text-[11px] text-muted-foreground">
          📄 returns-policy.txt
        </span>
      </motion.div>
    </div>
  );
}

function EmbedScene() {
  return (
    <div className="relative w-full max-w-sm">
      <motion.pre
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.45, ease: EASE }}
        className="overflow-x-auto rounded-xl border bg-zinc-950 p-4 text-xs text-zinc-100 shadow-md"
      >
        <code>
          <span className="text-zinc-500">&lt;</span>
          <span className="text-indigo-400">script</span>{" "}
          <span className="text-emerald-400">src</span>=
          <span className="text-amber-300">&quot;askbase.app/widget.js&quot;</span>
          {"\n  "}
          <span className="text-emerald-400">data-bot-id</span>=
          <span className="text-amber-300">&quot;acme-support&quot;</span>{" "}
          <span className="text-emerald-400">async</span>
          <span className="text-zinc-500">&gt;&lt;/</span>
          <span className="text-indigo-400">script</span>
          <span className="text-zinc-500">&gt;</span>
        </code>
      </motion.pre>
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, type: "spring", stiffness: 260, damping: 18 }}
        className="absolute -bottom-6 -right-2 flex size-13 items-center justify-center rounded-full bg-amber-500 text-white shadow-xl"
      >
        <MessageSquareText className="size-5" />
      </motion.div>
    </div>
  );
}

const SCENES = [UploadScene, PlaygroundScene, EmbedScene];

/* ------------------------- pinned section ------------------------- */

/**
 * "How it works" pinned to the viewport for 3 screen-heights: scrolling
 * scrubs through the three steps while the background tint cross-fades.
 */
export function PinnedSteps() {
  const ref = React.useRef<HTMLElement>(null);
  const prefersReduced = useReducedMotion();
  const [step, setStep] = React.useState(0);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setStep(Math.min(STEPS.length - 1, Math.floor(v * STEPS.length)));
  });

  // Cann-style scroll color fade between step tints.
  const background = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    ["rgba(99, 102, 241, 0.07)", "rgba(16, 185, 129, 0.06)", "rgba(245, 158, 11, 0.07)"]
  );

  const active = STEPS[step];
  const Scene = SCENES[step];

  // Reduced motion (or SSR fallback): plain stacked steps, no pinning.
  if (prefersReduced) {
    return (
      <section id="how" className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="font-display text-center text-3xl font-semibold tracking-tight sm:text-4xl">
            Live on your site in three steps
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="text-center">
                <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-indigo-500 font-semibold text-white">
                  {i + 1}
                </div>
                <p className="mt-4 font-medium">{s.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} id="how" className="relative h-[300vh]">
      <motion.div
        style={{ background }}
        className="sticky top-0 flex h-dvh items-center overflow-hidden"
      >
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 md:grid-cols-2 md:gap-16">
          {/* Left: step text */}
          <div className="relative flex flex-col justify-center">
            <p className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              How it works
            </p>
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: EASE }}
            >
                <span
                  className={`font-mono text-7xl font-bold tabular-nums opacity-15 sm:text-8xl ${active.accent}`}
                >
                  0{step + 1}
                </span>
                <h2 className="font-display mt-2 text-3xl font-semibold tracking-tight sm:text-5xl">
                  {active.title}
                </h2>
                <p className="mt-4 max-w-md text-muted-foreground">{active.text}</p>
              </motion.div>

            {/* Progress rail */}
            <div className="mt-10 flex items-center gap-2">
              {STEPS.map((s, i) => (
                <div
                  key={s.title}
                  className={`h-1 rounded-full transition-all duration-500 ${
                    i === step ? "w-10 bg-foreground" : "w-4 bg-border"
                  }`}
                />
              ))}
              <span className="ml-3 text-xs tabular-nums text-muted-foreground">
                {step + 1} / {STEPS.length}
              </span>
            </div>
          </div>

          {/* Right: animated scene — remounts per step, scenes animate themselves in */}
          <div className="flex min-h-[280px] items-center justify-center">
            <div key={step} className="flex w-full justify-center">
              <Scene />
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
