import { defineConfig, devices } from "@playwright/test";

/** Remote sandbox environments ship a pinned Chromium binary. */
const pinnedChromium = () =>
  process.env.PLAYWRIGHT_CHROMIUM_PATH
    ? { launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } }
    : {};

/**
 * Port the app under test listens on. Defaults to 3000 (unchanged) but can be
 * overridden with PORT so the suite can run when 3000 is already in use by
 * another local dev server. `next start` reads the same PORT env var.
 */
const parsedPort = Number(process.env.PORT);
const PORT =
  Number.isInteger(parsedPort) && parsedPort > 0 && parsedPort < 65536 ? parsedPort : 3000;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: BASE_URL,
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
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
});
