import * as React from "react";
import { Sparkles } from "lucide-react";

const ITEMS = [
  "Upload your docs",
  "Ask anything",
  "Embed anywhere",
  "Sources cited",
  "No hallucinations",
  "Live in minutes",
];

function Row() {
  return (
    <>
      {ITEMS.map((item) => (
        <span key={item} className="mx-6 inline-flex items-center gap-3 sm:mx-8">
          <span className="font-display text-lg font-semibold tracking-tight sm:text-2xl">
            {item}
          </span>
          <Sparkles className="size-4 text-indigo-400" />
        </span>
      ))}
    </>
  );
}

/** Endless ticker strip — pure CSS animation, pauses for reduced-motion users. */
export function Marquee() {
  return (
    <div
      aria-hidden
      className="relative overflow-hidden py-5 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]"
    >
      <div className="marquee-track flex w-max whitespace-nowrap">
        <div className="flex items-center">
          <Row />
        </div>
        <div className="flex items-center">
          <Row />
        </div>
      </div>
    </div>
  );
}
