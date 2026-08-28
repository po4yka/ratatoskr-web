/// <reference types="vitest/config" />
import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    css: true,
    // The drift tests deliberately mutate the pinned contract file for the
    // seconds their subprocess runs, and other API tests read that same
    // file. Parallel workers turned that window into a real race, so test
    // files run one at a time; within a file, order is unchanged.
    fileParallelism: false,
    // `src/test/setup.ts` raises Testing Library's poll window to 5000ms. Vitest's own default
    // per-test timeout is 5000ms, sitting exactly on that edge, so a test with more than one such
    // query would be cut off by Vitest rather than by the query it is waiting on — and the failure
    // would name the wrong thing. This keeps the outer bound above the inner one.
    testTimeout: 10000,
  },
})
