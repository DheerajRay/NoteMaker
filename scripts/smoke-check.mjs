import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const baseUrl = process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:5173";
const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const outputDir = join(projectRoot, "test-results");
const failures = [];
const browserErrors = [];

await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ acceptDownloads: true });

function observe(page, name) {
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(`${name}: ${message.text()}`);
  });
  page.on("pageerror", (error) => browserErrors.push(`${name}: ${error.message}`));
}

function check(condition, message) {
  if (!condition) failures.push(message);
}

const desktop = await context.newPage();
observe(desktop, "desktop");
await desktop.setViewportSize({ width: 1440, height: 1000 });
await desktop.goto(baseUrl, { waitUntil: "networkidle" });
await desktop.evaluate(async () => {
  localStorage.clear();
  await new Promise((resolve) => {
    const request = indexedDB.deleteDatabase("notemaker-audio");
    request.onsuccess = request.onerror = request.onblocked = () => resolve(undefined);
  });
});
await desktop.reload({ waitUntil: "networkidle" });

await desktop.getByRole("heading", { name: "NoteMaker" }).waitFor();
check(await desktop.getByRole("button", { name: /^step \d{2}$/i }).count() === 16, "Desktop must expose 16 step buttons.");
check(await desktop.getByRole("button", { name: /^slot \d{2}/i }).count() === 16, "Desktop must expose 16 sound slots.");
check(await desktop.getByLabel("Sound slots page 01-16").isVisible(), "Sound slots must start on page 01-16.");

await desktop.getByRole("button", { name: /write mode/i }).click();
await desktop.getByRole("button", { name: /slot 09 kick/i }).click();
await desktop.getByRole("button", { name: /key 01/i }).click();
await desktop.getByRole("button", { name: /^step 01$/i }).click();
const kickChip = desktop.getByRole("button", { name: /remove slot 09 kick from beat 01/i });
await kickChip.waitFor();
check((await kickChip.textContent())?.toLowerCase().includes("x"), "Beat Flow chips must expose a remove mark.");
await kickChip.click();
check(await kickChip.count() === 0, "Beat Flow chip must remove its trigger.");
await desktop.getByRole("button", { name: /^step 01$/i }).click();

await desktop.getByRole("button", { name: /play pattern/i }).click();
await desktop.getByRole("button", { name: /stop playback/i }).waitFor();
await desktop.waitForTimeout(400);
await desktop.getByRole("button", { name: /stop playback/i }).click();

await desktop.getByRole("button", { name: /techno tempo 140 bpm/i }).click();
await desktop.getByRole("button", { name: /pattern 02/i }).click();
await desktop.reload({ waitUntil: "networkidle" });
check(await desktop.getByRole("button", { name: /pattern 02/i }).getAttribute("aria-pressed") === "true", "Active pattern must persist after reload.");
check((await desktop.getByLabel("Tempo control").textContent())?.includes("140"), "Tempo must persist after reload.");

await desktop.locator('input[type="file"][accept*="application/json"]').setInputFiles({
  name: "broken.json",
  mimeType: "application/json",
  buffer: Buffer.from("{bad json")
});
await desktop.getByText(/could not import this project/i).waitFor();

check(await desktop.getByRole("button", { name: /sound import paused/i }).count() === 0, "Top-bar sound import must be removed.");
await desktop.getByRole("button", { name: /slot 01 mono bass/i }).click();
check((await desktop.getByLabel("Sound controls").textContent())?.toLowerCase().includes("round bass"), "Sound controls must show selected slot tuning.");
await desktop.getByRole("slider", { name: /gain/i }).fill("1.2");
check((await desktop.getByLabel("Sound controls").textContent())?.toLowerCase().includes("gain"), "Sound controls must react to knob changes.");
await desktop.getByRole("button", { name: /next sound slot page/i }).click();
await desktop.getByRole("button", { name: /slot 17 velvet keys/i }).click();
await desktop.getByRole("button", { name: /key 05/i }).click();
await desktop.getByRole("button", { name: /^step 02$/i }).click();
await desktop.getByRole("button", { name: /next sound slot page/i }).click();
await desktop.getByRole("button", { name: /slot 33 808 kick/i }).click();
await desktop.getByRole("button", { name: /key 01/i }).click();
await desktop.getByRole("button", { name: /^step 03$/i }).click();
check(await desktop.getByRole("button", { name: /add sound import planned/i }).isDisabled(), "Add Sound placeholder must be disabled.");
check(await desktop.getByRole("button", { name: /next sound slot page/i }).isDisabled(), "Last sound page must disable next.");
await desktop.reload({ waitUntil: "networkidle" });
await desktop.getByRole("button", { name: /slot 01 mono bass/i }).click();
await desktop.getByRole("button", { name: /key 11/i }).click();
await desktop.waitForTimeout(150);

const downloadPromise = desktop.waitForEvent("download");
await desktop.getByRole("button", { name: /export project/i }).click();
const download = await downloadPromise;
check(download.suggestedFilename().endsWith(".notemaker.json"), "Project export must download NoteMaker JSON.");

await desktop.screenshot({ path: join(outputDir, "notemaker-smoke-desktop.png"), fullPage: true });

const mobile = await context.newPage();
observe(mobile, "mobile");
await mobile.setViewportSize({ width: 390, height: 844 });
await mobile.goto(baseUrl, { waitUntil: "networkidle" });
const metrics = await mobile.evaluate(() => ({
  scrollWidth: document.documentElement.scrollWidth,
  clientWidth: document.documentElement.clientWidth,
  scrollHeight: document.documentElement.scrollHeight,
  undersized: Array.from(document.querySelectorAll("button"))
    .filter((button) => !button.closest(".flow-timing-control"))
    .filter((button) => !button.closest(".flow-trigger"))
    .map((button) => {
      const bounds = button.getBoundingClientRect();
      return { label: button.getAttribute("aria-label") ?? button.textContent?.trim(), width: bounds.width, height: bounds.height };
    })
    .filter((button) => button.width < 34 || button.height < 34)
}));
check(metrics.scrollWidth <= metrics.clientWidth, `Mobile horizontal overflow: ${JSON.stringify(metrics)}.`);
check(metrics.undersized.length === 0, `Mobile controls below 34px: ${JSON.stringify(metrics.undersized)}.`);
check(metrics.scrollHeight <= 1800, `Mobile page is unexpectedly tall: ${metrics.scrollHeight}px.`);
await mobile.screenshot({ path: join(outputDir, "notemaker-smoke-mobile.png"), fullPage: true });

await browser.close();

if (browserErrors.length || failures.length) {
  console.error([...browserErrors, ...failures].join("\n"));
  process.exit(1);
}

console.log(`Smoke check passed at ${baseUrl}: core audio, persistence, errors, export, and responsive layout verified.`);
