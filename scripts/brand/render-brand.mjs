// Renders the Atlas "A." brand set from the bundled Fraunces/Outfit fonts.
// Usage: node render.mjs <worktree> <outdir>
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const [, , root, out] = process.argv;
mkdirSync(out, { recursive: true });
const fonts = path.join(root, "src/app/fonts");
const html = `<!doctype html><meta charset="utf-8"><style>
@font-face { font-family: Fraunces; src: url(file://${fonts}/Fraunces-Variable.ttf); font-weight: 100 900; }
@font-face { font-family: Outfit; src: url(file://${fonts}/Outfit-Variable.ttf); font-weight: 100 900; }
html, body { margin: 0; background: transparent; }
.board { position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; }
.serif { font-family: Fraunces; font-weight: 650; font-variation-settings: "SOFT" 80, "WONK" 1, "opsz" 144; letter-spacing: -0.035em; line-height: 1; color: #1a1917; }
.dot { color: #a6473d; }
.tile { background: #1a1917; }
.tile .serif { color: #f2efe8; }
.tile .dot { color: #c9574b; }
.tag { font-family: Outfit; font-weight: 500; color: #6c685f; letter-spacing: 0.01em; }
.tag .dot { color: #a6473d; }
</style>
<!-- App icon: ink tile, paper "A", red full stop -->
<div id="icon" class="board tile" style="width:1024px;height:1024px;border-radius:236px">
  <div class="serif" style="font-size:700px;margin:-80px 0 0 -30px">A<span class="dot">.</span></div>
</div>
<!-- Mark without tile (used over paper with multiply) -->
<div id="mark" class="board" style="width:515px;height:400px">
  <div class="serif" style="font-size:380px;margin-top:-30px">A<span class="dot">.</span></div>
</div>
<!-- Wordmark -->
<div id="wordmark" class="board" style="width:max-content;height:145px;padding:0 6px">
  <div class="serif" style="font-size:150px;margin:-22px 0 0 0;white-space:nowrap">Atlas<span class="dot">.</span></div>
</div>
<!-- Full logo: tile, wordmark, tagline -->
<div id="logo" class="board" style="width:905px;height:715px;flex-direction:column;gap:34px">
  <div class="board tile" style="width:236px;height:236px;border-radius:54px"><div class="serif" style="font-size:160px;margin:-16px 0 0 -9px">A<span class="dot">.</span></div></div>
  <div class="serif" style="font-size:140px;margin-top:-10px;white-space:nowrap">Atlas<span class="dot">.</span></div>
  <div class="tag" style="font-size:34px;margin-top:-6px">Plan<span class="dot">.</span>&nbsp; Make<span class="dot">.</span>&nbsp; Deliver<span class="dot">.</span></div>
</div>`;
const file = path.join(out, "brand.html");
writeFileSync(file, html);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 3200 }, deviceScaleFactor: 1 });
await page.goto(`file://${file}`);
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(200);
for (const id of ["icon", "mark", "wordmark", "logo"]) {
  await page.locator(`#${id}`).screenshot({ path: path.join(out, `${id}.png`), omitBackground: true });
}
await browser.close();
console.log("rendered", out);
