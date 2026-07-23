#!/usr/bin/env node
/**
 * Chat smoke test — hits the public widget chat API with real questions and
 * checks the answers against expectations from TESTING.md.
 *
 * Usage:
 *   node scripts/chat-smoke.mjs <bot-public-id> [app-url]
 *
 * The bot must have the "Shipping FAQ" test document from TESTING.md indexed.
 */

const [, , botId, appUrl = "http://localhost:3000"] = process.argv;

if (!botId) {
  console.error("Usage: node scripts/chat-smoke.mjs <bot-public-id> [app-url]");
  process.exit(1);
}

/** @type {{q: string, expect: RegExp, why: string, aiOnly?: boolean}[]} */
const CASES = [
  {
    q: "How much does express shipping cost and how long does it take?",
    expect: /14\.99/,
    why: "answer must quote the express price from the docs",
  },
  {
    q: "Can I return an item after 45 days?",
    expect: /30\s*days/i,
    why: "answer must reference the 30-day return window",
  },
  {
    q: "Do you accept cash on delivery?",
    expect: /cash on delivery|Visa|PayPal/i,
    why: "answer must come from the payment section",
  },
  {
    q: "What is the capital of France?",
    expect: /don'?t know|couldn'?t find|not (?:covered|in)|no relevant|contact/i,
    why: "off-topic question must NOT be answered from thin air",
    aiOnly: true, // demo mode always echoes passages, so only meaningful with an LLM
  },
];

async function ask(question, history = []) {
  const res = await fetch(`${appUrl}/api/widget/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ publicId: botId, question, history }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);

  const text = await res.text();
  const nl = text.indexOf("\n");
  const meta = JSON.parse(text.slice(0, nl));
  return { meta, answer: text.slice(nl + 1).trim() };
}

let failed = 0;
console.log(`Chat smoke test → ${appUrl}, bot ${botId}\n`);

for (const c of CASES) {
  const { meta, answer } = await ask(c.q);
  const skipped = c.aiOnly && meta.mode === "demo";
  const ok = skipped || (answer.length > 0 && c.expect.test(answer));
  if (!ok) failed++;

  console.log(`${skipped ? "SKIP" : ok ? "PASS" : "FAIL"}  [${meta.mode}] ${c.q}`);
  if (skipped) console.log(`      (demo mode always shows passages — run with an LLM to test this)`);
  if (!ok) {
    console.log(`      expected ${c.expect} — ${c.why}`);
    console.log(`      got: ${answer.slice(0, 300).replace(/\n/g, " ")}`);
  }
}

// Follow-up question relying on history — the bot must keep context.
{
  const first = "How much does express shipping cost?";
  const { answer: a1 } = await ask(first);
  const { meta, answer } = await ask("And how long does that take?", [
    { role: "user", content: first },
    { role: "assistant", content: a1 },
  ]);
  const skipped = meta.mode === "demo";
  const ok = skipped || /1\s*[-–]\s*2|1 to 2/i.test(answer);
  if (!ok) failed++;
  console.log(
    `${skipped ? "SKIP" : ok ? "PASS" : "FAIL"}  [${meta.mode}] follow-up keeps context (expects 1–2 business days)`
  );
  if (skipped) console.log(`      (context test needs an LLM — demo mode does retrieval only)`);
  if (!ok) console.log(`      got: ${answer.slice(0, 300).replace(/\n/g, " ")}`);
}

console.log(failed === 0 ? "\nAll checks passed ✅" : `\n${failed} check(s) FAILED ❌`);
process.exit(failed === 0 ? 0 : 1);
