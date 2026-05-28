import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
const errors = [];

page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
page.on("pageerror", (error) => errors.push(error.message));

await page.goto("http://127.0.0.1:5173", { waitUntil: "networkidle" });
await page.getByRole("heading", { name: "NoteMaker" }).waitFor();
await page.getByRole("button", { name: "Play song" }).waitFor();
await page.getByRole("grid", { name: "Storybook Song timeline" }).waitFor();
await page.getByText("Pocket Drums").waitFor();
await page.screenshot({ path: "test-results/notemaker-smoke.png", fullPage: true });

await browser.close();

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("Smoke check passed: NoteMaker loaded with no console errors.");
