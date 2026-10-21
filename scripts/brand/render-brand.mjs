// Renders the Atlas brand set — the Stack mark (three rising layers capped by
// the red point) and the Outfit wordmark — from the bundled fonts with
// Playwright's Chromium.
// Usage: node scripts/brand/render-brand.mjs <repo root> <output dir>
// Then copy icon/mark/wordmark/logo.png over public/brand/atlas-*.png, resize
// icon.png to src/app/icon.png (512) and apple-icon.png (180, on ink), and
// regenerate src/app/favicon.ico (16/32/48) — see .ai/CURRENT_STATE.md.
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const [, , root, out] = process.argv;
mkdirSync(out, { recursive: true });
const fonts = path.join(root, "src/app/fonts");
const INK = "#1a1917", PAPER = "#f2efe8", RED = "#c9574b";

/** The mark in a 100×100 box: the system's layers rising to the red point. */
export const markSvg = (fill, size, red = RED) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">` +
  `<g stroke="${fill}" stroke-linecap="round" stroke-width="13" fill="none">` +
  `<path d="M16 84 H84"/><path d="M26 62 H74" opacity=".72"/><path d="M36 40 H64" opacity=".48"/>` +
  `</g><circle cx="50" cy="18" r="9" fill="${red}"/></svg>`;

const html = `<!doctype html><meta charset="utf-8"><style>
@font-face { font-family: Outfit; src: url(file://${fonts}/Outfit-Variable.ttf); font-weight: 100 900; }
html, body { margin: 0; background: transparent; }
.board { position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.tile { background: ${INK}; }
.word { font-family: Outfit; font-weight: 700; letter-spacing: -0.05em; line-height: 1; color: ${INK}; white-space: nowrap; }
.tag { font-family: Outfit; font-weight: 500; font-size: 34px; letter-spacing: 0.01em; color: #6c685f; white-space: nowrap; }
.tag i { font-style: normal; color: ${RED}; }
</style>
<div id="icon" class="board tile" style="width:1024px;height:1024px;border-radius:236px">${markSvg(PAPER, 740)}</div>
<div id="mark" class="board" style="width:515px;height:400px">${markSvg(INK, 400)}</div>
<div id="wordmark" class="board" style="width:max-content;height:145px;gap:18px;padding:0 6px">${markSvg(INK, 128)}<span class="word" style="font-size:124px;margin-top:-6px">Atlas</span></div>
<div id="logo" class="board" style="width:905px;height:715px;flex-direction:column;gap:40px">
  <div class="board tile" style="width:250px;height:250px;border-radius:58px">${markSvg(PAPER, 182)}</div>
  <span class="word" style="font-size:132px">Atlas</span>
  <span class="tag" style="margin-top:-8px">Plan<i>.</i>&nbsp; Make<i>.</i>&nbsp; Deliver<i>.</i></span>
</div>`;

const file = path.join(out, "brand.html");
writeFileSync(file, html);
writeFileSync(path.join(out, "mark.svg"), markSvg(INK, 100));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 3000 }, deviceScaleFactor: 1 });
await page.goto(`file://${file}`);
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(200);
for (const id of ["icon", "mark", "wordmark", "logo"]) {
  await page.locator(`#${id}`).screenshot({ path: path.join(out, `${id}.png`), omitBackground: true });
}
await browser.close();
console.log("rendered", out);
