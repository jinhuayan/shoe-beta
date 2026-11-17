import { defineConfig, devices } from "@playwright/test";

// End-to-end tests run against a production build backed by a seeded test database.
// See "End-to-end tests" in README.md for setup.
const port = Number(process.env.E2E_PORT ?? 3100);
const baseURL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${port}`;
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    launchOptions: { executablePath },
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } }, testIgnore: /mobile\.spec\.ts/ },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /mobile\.spec\.ts/ },
  ],
  // Reuse a server you already started; otherwise start the production build.
  webServer: process.env.E2E_BASE_URL ? undefined : {
    command: `npx next start -p ${port} -H 127.0.0.1`,
    url: `${baseURL}/shoes`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      BETTER_AUTH_URL: baseURL,
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
});
