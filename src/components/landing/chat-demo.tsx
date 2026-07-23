"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { MessageSquareText } from "lucide-react";

type DemoMessage = {
  role: "user" | "assistant";
  text: string;
  source?: string;
};

const SCRIPT: DemoMessage[] = [
  { role: "user", text: "Do you ship to Germany?" },
  {
    role: "assistant",
    text: "Yes — we ship worldwide! Standard delivery takes 5–7 business days ($4.99) and is free on orders over $50.",
    source: "Shipping FAQ",
  },
  { role: "user", text: "What if the size doesn't fit?" },
  {
    role: "assistant",
    text: "No problem — you can return any item within 30 days for a full refund. Just email us your order number.",
    source: "Returns policy",
  },
];

const STEP_MS = 2200;
const RESET_PAUSE_MS = 3200;

/**
 * Self-playing chat conversation for the hero — loops through a scripted
 * Q&A so visitors see the product working before they sign up.
 */
export function ChatDemo() {
  const prefersReduced = useReducedMotion();
  // How many messages are visible; SCRIPT.length + 1 = "hold" step before reset.
  const [step, setStep] = React.useState(prefersReduced ? SCRIPT.length : 0);

  React.useEffect(() => {
    if (prefersReduced) return;
    const timer = setTimeout(
      () => setStep((s) => (s > SCRIPT.length ? 0 : s + 1)),
      step === SCRIPT.length + 1 ? RESET_PAUSE_MS : STEP_MS
    );
    return () => clearTimeout(timer);
  }, [step, prefersReduced]);

  const visible = SCRIPT.slice(0, Math.min(step, SCRIPT.length));
  const typing =
    !prefersReduced && step < SCRIPT.length && SCRIPT[step].role === "assistant";

  return (
    <div className="flex h-full min-h-[360px] flex-col overflow-hidden rounded-2xl border bg-background shadow-xl">
      {/* Header mirrors the real widget */}
      <div className="flex items-center gap-3 border-b bg-indigo-500 px-4 py-3 text-white">
        <span className="flex size-8 items-center justify-center rounded-full bg-white/20">
          <MessageSquareText className="size-4" />
        </span>
        <div className="text-left leading-tight">
          <p className="text-sm font-medium">Acme Support</p>
          <p className="text-xs text-white/70">Usually replies instantly</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-end gap-3 p-4">
        <AnimatePresence mode="popLayout">
          {visible.map((m, i) => (
            <motion.div
              key={`${i}-${m.text.slice(0, 12)}`}
              layout
              initial={{ opacity: 0, y: 14, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.25 } }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
            >
              <div
                className={
                  m.role === "user"
                    ? "max-w-[80%] rounded-2xl rounded-br-md bg-indigo-500 px-3.5 py-2.5 text-left text-sm text-white"
                    : "max-w-[85%] rounded-2xl rounded-bl-md bg-muted px-3.5 py-2.5 text-left text-sm"
                }
              >
                {m.text}
                {m.source && (
                  <span className="mt-2 block w-fit rounded-full border bg-background px-2 py-0.5 text-[11px] text-muted-foreground">
                    📄 {m.source}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
          {typing && (
            <motion.div
              key="typing"
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              className="flex justify-start"
            >
              <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-muted px-3.5 py-3">
                {[0, 1, 2].map((d) => (
                  <motion.span
                    key={d}
                    className="size-1.5 rounded-full bg-muted-foreground/60"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: d * 0.18 }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="border-t px-4 py-3">
        <div className="flex items-center justify-between rounded-full border bg-muted/40 px-4 py-2 text-sm text-muted-foreground">
          Ask a question…
          <span className="flex size-6 items-center justify-center rounded-full bg-indigo-500 text-white">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
}
