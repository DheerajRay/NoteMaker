import { mkdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const iconsDirectory = join(root, "public", "icons");
const source = await readFile(join(iconsDirectory, "notemaker-icon.svg"), "utf8");
const outputs = [
  ["notemaker-1024.png", 1024],
  ["notemaker-512.png", 512],
  ["notemaker-192.png", 192],
  ["apple-touch-icon.png", 180],
  ["favicon-32.png", 32]
];

await mkdir(iconsDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

for (const [filename, size] of outputs) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`
    <style>
      html, body { width: 100%; height: 100%; margin: 0; overflow: hidden; background: #151513; }
      svg { display: block; width: 100%; height: 100%; }
    </style>
    ${source}
  `);
  const icon = page.locator("svg");
  const bounds = await icon.boundingBox();
  if (!bounds || bounds.width !== size || bounds.height !== size) {
    throw new Error(`Icon ${filename} rendered at an unexpected size: ${JSON.stringify(bounds)}`);
  }
  await icon.screenshot({ path: join(iconsDirectory, filename), type: "png" });
}

await browser.close();
console.log(`Generated ${outputs.length} NoteMaker app icons.`);
