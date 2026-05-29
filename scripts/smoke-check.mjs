import { chromium } from "playwright";

const errors = [];

const browser = await chromium.launch({ headless: true });

async function checkViewport(name, viewport) {
  const page = await browser.newPage({ viewport });
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("http://127.0.0.1:5173", { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "NoteMaker" }).waitFor();
  await page.getByRole("button", { name: "Play song" }).waitFor();
  await page.getByRole("region", { name: "Pocket performance deck" }).waitFor();
  await page.getByRole("grid", { name: "Pocket Session timeline" }).waitFor();
  await page.getByRole("button", { name: /01 kick drums/i }).waitFor();
  await page.screenshot({ path: `test-results/notemaker-smoke-${name}.png`, fullPage: true });
  await page.close();
}

await checkViewport("desktop", { width: 1440, height: 960 });
await checkViewport("mobile", { width: 390, height: 844 });

await browser.close();

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("Smoke check passed: NoteMaker loaded with no console errors.");
