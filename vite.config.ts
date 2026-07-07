/// <reference types="vitest/config" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { readFileSync } from "node:fs";

// 版本注入：版號來自 package.json；commit SHA 僅在 CI（GITHUB_SHA）取用，
// 本地/非 CI build 一律為 "dev"（見 src/version.ts、docs/versioning.md）。
const pkg = JSON.parse(readFileSync(path.resolve(__dirname, "package.json"), "utf-8")) as { version: string };
const gitSha = process.env.GITHUB_SHA ? process.env.GITHUB_SHA.slice(0, 7) : "dev";
const buildTime = new Date().toISOString();

export default defineConfig({
  // 相對路徑：可部署於 GitHub Pages 專案子路徑（/taiwan-hr-salary/）或任意子目錄
  base: "./",
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __GIT_SHA__: JSON.stringify(gitSha),
    __BUILD_TIME__: JSON.stringify(buildTime),
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    setupFiles: ["tests/setup.ts"],
  },
});
