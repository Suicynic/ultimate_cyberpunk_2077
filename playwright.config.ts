import { defineConfig, devices } from "@playwright/test";

/** Remote sandbox environments ship a pinned Chromium binary. */
const pinnedChromium = () =>
  process.env.PLAYWRIGHT_CHROMIUM_PATH
    ? { launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } }
    : {};

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], ...pinnedChromium() },
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"], ...pinnedChromium() },
    },
  ],
  webServer: {
    command: "npm run build && npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
});
