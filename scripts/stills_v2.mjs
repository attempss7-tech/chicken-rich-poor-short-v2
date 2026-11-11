// usage: node scripts/stills_v2.mjs <outDir> <frame,frame,...> [scale]
// Bundles once, renders each listed frame as a JPEG still (SwiftShader GL).
import fs from "node:fs";
if (process.env.REMOTION_TMP) { fs.mkdirSync(process.env.REMOTION_TMP, { recursive: true }); process.env.TEMP = process.env.TMP = process.env.REMOTION_TMP; }
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
const [outDir, framesS, scaleS = "0.5"] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const browserExecutable = process.env.CHROME_PATH || `${process.env.HOME}/.cache/ms-playwright/chromium_headless_shell-1148/chrome-linux/headless_shell`;
const chromiumOptions = { gl: "swiftshader" };
const t0 = Date.now();
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
console.log(`bundled in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
const composition = await selectComposition({ serveUrl, id: "ChickenShort", browserExecutable, chromiumOptions });
const onBrowserLog = (l) => { if (l.type === "error") console.log(`[browser-error]`, l.text.slice(0, 300)); };
for (const f of framesS.split(",").map(Number)) {
  const s0 = Date.now();
  try {
    await renderStill({ composition, serveUrl, frame: f, output: path.join(outDir, `f${f}.jpg`), imageFormat: "jpeg", jpegQuality: 88, scale: Number(scaleS), browserExecutable, chromiumOptions, timeoutInMilliseconds: 300000, onBrowserLog });
    console.log(`still ${f} ${((Date.now() - s0) / 1000).toFixed(1)}s`);
  } catch (e) { console.log(`FAILED ${f} ${String(e && e.message ? e.message : e).slice(0, 200)}`); }
}
