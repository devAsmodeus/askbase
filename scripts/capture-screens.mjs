#!/usr/bin/env node
/**
 * Walks through the whole product with a headless Chrome and saves the
 * screenshots used in docs/PRESENTATION.md.
 *
 * Usage:
 *   node scripts/capture-screens.mjs <email> <password> [app-url]
 *
 * Requires: `npm i -D puppeteer-core` and a local Chrome install.
 * The account must already exist; the script logs in, uploads the sample
 * files to the first bot, asks the playground a question and captures
 * every page along the way.
 */
import { mkdirSync } from "node:fs";
import { launch } from "puppeteer-core";

const [, , email, password, appUrl = "http://localhost:3000"] = process.argv;
if (!email || !password) {
  console.error("Usage: node scripts/capture-screens.mjs <email> <password> [app-url]");
  process.exit(1);
}

const OUT = "docs/walkthrough";
mkdirSync(OUT, { recursive: true });

const CHROME =
  process.env.CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const browser = await launch({
  executablePath: CHROME,
  headless: "shell",
  args: ["--no-sandbox", "--force-prefers-reduced-motion=no", "--hide-scrollbars"],
  defaultViewport: { width: 1440, height: 900 },
});
const page = await browser.newPage();
const shot = async (name) => {
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log("captured", name);
};

// --- Landing ---
await page.goto(appUrl, { waitUntil: "networkidle2", timeout: 60000 });
await new Promise((r) => setTimeout(r, 2500)); // let hero animations play
await shot("01-landing-hero");

// Pinned "How it works" mid-scrub (step 02)
await page.evaluate(() => {
  const how = document.getElementById("how");
  window.scrollTo(0, how.offsetTop + window.innerHeight * 1.2);
});
await new Promise((r) => setTimeout(r, 1200));
await shot("02-pinned-steps");

await page.evaluate(() => {
  document.getElementById("pricing").scrollIntoView();
  window.scrollBy(0, -80);
});
await new Promise((r) => setTimeout(r, 1200));
await shot("03-pricing");

// --- Login ---
await page.goto(`${appUrl}/login`, { waitUntil: "networkidle2" });
await shot("04-login");
await page.click("button[type=button]"); // switch to sign-in mode
await page.type("#email", email);
await page.type("#password", password);
await Promise.all([
  page.waitForNavigation({ waitUntil: "networkidle2", timeout: 60000 }),
  page.click("button[type=submit]"),
]);

// --- Dashboard ---
await page.goto(`${appUrl}/app`, { waitUntil: "networkidle2" });
await shot("05-dashboard");

// --- Bot workspace: open the first bot ---
await page.waitForSelector('a[href^="/app/bots/"]', { timeout: 30000 });
await Promise.all([
  page.waitForNavigation({ waitUntil: "networkidle2" }),
  page.click('a[href^="/app/bots/"]'),
]);

// Knowledge: upload the sample files through the real multi-file input
// (skipped when the docs are already there so re-runs don't duplicate)
const existingRows = await page.$$("table tbody tr, [data-slot=table-body] tr");
if (existingRows.length < 4) {
  const input = await page.waitForSelector('input[type=file]', { timeout: 30000 });
  await input.uploadFile(
    "samples/shipping-and-returns.md",
    "samples/warranty-policy.txt",
    "samples/product-catalog.csv",
    "samples/support-handbook.pdf"
  );
  await new Promise((r) => setTimeout(r, 9000)); // wait for ingestion round-trip
}
await shot("06-knowledge-multi-upload");

// Radix tabs need a real (trusted) click, not element.click() from page JS
async function clickTab(label) {
  for (const t of await page.$$('[role=tab]')) {
    if ((await t.evaluate((el) => el.textContent)) === label) {
      await t.click();
      return;
    }
  }
  throw new Error(`tab not found: ${label}`);
}

// Playground: ask a question, wait for the streamed answer
await clickTab("Playground");
await page.waitForSelector('textarea[placeholder^="Test your bot"]');
await page.type('textarea[placeholder^="Test your bot"]', "How much does express shipping cost and how long does it take?");
await page.click("button[type=submit]");
await new Promise((r) => setTimeout(r, 12000)); // model answer + stream
await shot("07-playground-ai-answer");

// Embed tab
await clickTab("Embed");
await new Promise((r) => setTimeout(r, 600));
await shot("08-embed");

// --- Billing ---
await page.goto(`${appUrl}/app/billing`, { waitUntil: "networkidle2" });
await shot("09-billing");

// --- Widget on the landing page (the real embedded product) ---
await page.goto(appUrl, { waitUntil: "networkidle2" });
await new Promise((r) => setTimeout(r, 2000));
const launcher = await page
  .waitForSelector('button[aria-label="Open chat"]', { timeout: 15000 })
  .catch(() => null);
if (launcher) {
  await launcher.click();
  await new Promise((r) => setTimeout(r, 1500));
  const frame = page.frames().find((f) => f.url().includes("/embed/"));
  if (frame) {
    await frame.type('textarea[placeholder="Ask a question…"]', "Do you offer refunds?");
    await frame.click("button[type=submit]");
    await new Promise((r) => setTimeout(r, 12000));
  }
  await shot("10-widget-live");
} else {
  console.warn("widget launcher not found — skipping 10-widget-live");
}

await browser.close();
console.log("done →", OUT);
