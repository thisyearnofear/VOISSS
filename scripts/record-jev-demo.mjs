// Records the /demo/jev intent-matching demo to a video file.
// Usage: node scripts/record-jev-demo.mjs <url> <outdir>
// e.g.  node scripts/record-jev-demo.mjs http://localhost:4445 /tmp/jev-demo
import { chromium } from "playwright";
import fs from "node:fs";

// Full URL including path — e.g. http://localhost:4445/demo/jev or http://localhost:4446/
const BASE = process.argv[2] || "http://localhost:4445/demo/jev";
const OUT = process.argv[3] || "/tmp/jev-demo-recording";
fs.mkdirSync(OUT, { recursive: true });

const BRIEFS = [
  "urgent 15s ad read for a sneaker drop",
  "calm meditation narrator for a sleep app",
];

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  recordVideo: { dir: OUT, size: { width: 1280, height: 800 } },
  deviceScaleFactor: 2,
});
const page = await context.newPage();

await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForSelector("input");
await page.waitForTimeout(1200);

const input = page.locator("input");

for (const brief of BRIEFS) {
  await input.click();
  // human-ish typing
  await input.pressSequentially(brief, { delay: 45 });
  // let the debounce fire + results land + bars animate
  await page.waitForTimeout(2600);
  // dwell on the re-ranked grid so viewers can read the scores
  await page.waitForTimeout(1400);
  if (brief !== BRIEFS[BRIEFS.length - 1]) {
    await input.fill("");
    await page.waitForTimeout(500);
  }
}

await page.waitForTimeout(800);
await context.close();
await browser.close();

const files = fs.readdirSync(OUT).filter((f) => f.endsWith(".webm"));
console.log("VIDEO_DIR:", OUT);
console.log("VIDEOS:", files.join(", "));
