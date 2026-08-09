import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const base = "http://127.0.0.1:3000";
const viewports = [
  ["1440", 1440, 900], ["1280", 1280, 800], ["768", 768, 1024], ["390", 390, 844],
];
const routes = [["landing", "/"], ["studio", "/studio"], ["case-study", "/case-study"]];
await mkdir("artifacts/visual", { recursive: true });
const browser = await chromium.launch();
const results = [];

for (const [size, width, height] of viewports) {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion: "reduce" });
  for (const [name, route] of routes) {
    const page = await context.newPage();
    const errors = [];
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    await page.screenshot({ path: `artifacts/visual/${name}-${size}.png`, fullPage: false });
    results.push({ route, size, overflow, errors });
    await page.close();
  }
  await context.close();
}

const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
const page = await context.newPage();
await page.goto(`${base}/studio`);
for (const [name, label] of [["workflow", "Workflows"], ["governance", "Governance"], ["review", "Human review"], ["reset", "Reset demo"]]) {
  await page.getByRole("button", { name: new RegExp(`^${label}`) }).click();
  if (name === "workflow") {
    await page.getByTestId("run-workflow").click();
    await page.getByTestId("processing-stage").waitFor();
    await page.screenshot({ path: "artifacts/visual/studio-workflow-processing-1440.png", fullPage: false });
    await page.getByTestId("workflow-run-complete").waitFor();
  }
  await page.waitForTimeout(80);
  await page.screenshot({ path: `artifacts/visual/studio-${name}-1440.png`, fullPage: false });
  if (name === "workflow") {
    await page.locator('[data-stage-id="policy"]').click();
    await page.screenshot({ path: "artifacts/visual/studio-workflow-policy-1440.png", fullPage: false });
    await page.getByRole("button", { name: "Overview", exact: true }).click();
    await page.screenshot({ path: "artifacts/visual/studio-overview-active-1440.png", fullPage: false });
  }
}
await context.close();

const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
const mobilePage = await mobile.newPage();
await mobilePage.goto(`${base}/studio`);
for (const [name, label] of [["workflow", "Workflows"], ["governance", "Governance"], ["review", "Human review"], ["reset", "Reset demo"]]) {
  await mobilePage.getByRole("button", { name: "Open navigation" }).click();
  await mobilePage.getByRole("navigation").getByRole("button", { name: new RegExp(`^${label}`) }).click();
  if (name === "workflow") {
    await mobilePage.getByTestId("run-workflow").click();
    await mobilePage.getByTestId("workflow-run-complete").waitFor();
  }
  await mobilePage.waitForTimeout(80);
  await mobilePage.screenshot({ path: `artifacts/visual/studio-${name}-390.png`, fullPage: false });
}
await mobile.close();
await browser.close();
console.log(JSON.stringify(results, null, 2));
