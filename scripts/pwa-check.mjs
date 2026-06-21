import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const dist = join(root, "dist");
const failures = [];

async function requireFile(path, label) {
  try {
    const details = await stat(path);
    if (!details.isFile() || details.size === 0) failures.push(`${label} is empty.`);
  } catch {
    failures.push(`${label} is missing.`);
  }
}

async function pngDimensions(path) {
  const bytes = await readFile(path);
  if (bytes.toString("ascii", 1, 4) !== "PNG") throw new Error(`${path} is not a PNG.`);
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

await requireFile(join(dist, "manifest.webmanifest"), "Web app manifest");
await requireFile(join(dist, "sw.js"), "Service worker");

for (const [file, expected] of [
  ["notemaker-1024.png", 1024],
  ["notemaker-512.png", 512],
  ["notemaker-192.png", 192],
  ["apple-touch-icon.png", 180],
  ["favicon-32.png", 32]
]) {
  const path = join(root, "public", "icons", file);
  await requireFile(path, file);
  try {
    const dimensions = await pngDimensions(path);
    if (dimensions.width !== expected || dimensions.height !== expected) {
      failures.push(`${file} must be ${expected}x${expected}, got ${dimensions.width}x${dimensions.height}.`);
    }
  } catch (error) {
    failures.push(error instanceof Error ? error.message : String(error));
  }
}

try {
  const manifest = JSON.parse(await readFile(join(dist, "manifest.webmanifest"), "utf8"));
  if (manifest.name !== "NoteMaker" || manifest.short_name !== "NoteMaker") failures.push("Manifest app name is incorrect.");
  if (manifest.display !== "standalone") failures.push("Manifest display mode must be standalone.");
  if (manifest.theme_color !== "#f18a36" || manifest.background_color !== "#151513") failures.push("Manifest colors are incorrect.");
  const iconSizes = new Set((manifest.icons ?? []).map((icon) => icon.sizes));
  if (!iconSizes.has("192x192") || !iconSizes.has("512x512")) failures.push("Manifest must include 192x192 and 512x512 icons.");
  if (!(manifest.icons ?? []).some((icon) => String(icon.purpose).includes("maskable"))) failures.push("Manifest must include a maskable icon.");
} catch (error) {
  failures.push(`Manifest could not be validated: ${error instanceof Error ? error.message : String(error)}`);
}

try {
  const serviceWorker = await readFile(join(dist, "sw.js"), "utf8");
  if (!serviceWorker.includes("09-kick.wav") || !serviceWorker.includes("16-texture.wav")) {
    failures.push("Starter audio is not included in the service-worker precache.");
  }
} catch (error) {
  failures.push(`Service worker could not be validated: ${error instanceof Error ? error.message : String(error)}`);
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("PWA check passed: manifest, service worker, icons, and starter-audio cache are valid.");
