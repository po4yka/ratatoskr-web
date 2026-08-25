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
  },
})
