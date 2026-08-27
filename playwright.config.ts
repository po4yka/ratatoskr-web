import { defineConfig, devices } from "@playwright/test"

const appUrl = "http://127.0.0.1:4173"
const platformUrl = "http://127.0.0.1:4310"

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 15_000,
  expect: { timeout: 5_000 },
  reporter: [["list"]],
  use: {
    ...devices["Desktop Chrome"],
    baseURL: appUrl,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
  webServer: [
    {
      command: "node scripts/mock-platform.mjs",
      url: `${platformUrl}/__mock/health`,
      timeout: 10_000,
      reuseExistingServer: false,
      env: { MOCK_PLATFORM_PORT: "4310" },
    },
    {
      command: "npm run dev -- --host 127.0.0.1 --port 4173 --strictPort",
      url: appUrl,
      timeout: 20_000,
      reuseExistingServer: false,
      env: { VITE_API_BASE_URL: platformUrl },
    },
  ],
})
