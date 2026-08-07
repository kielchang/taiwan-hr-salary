/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

// 版本注入：版號來自 package.json；commit SHA 僅在 CI（GITHUB_SHA）取用，
// 本地/非 CI build 一律為 "dev"（見 src/version.ts、docs/versioning.md）。
const pkg = JSON.parse(readFileSync(path.resolve(__dirname, "package.json"), "utf-8")) as { version: string };
const gitSha = process.env.GITHUB_SHA ? process.env.GITHUB_SHA.slice(0, 7) : "dev";
const buildTime = new Date().toISOString();
// 部署環境：由 CI 各環境 build 時以 APP_ENV 注入（prod/stage/dev）；本地/未設＝dev。
// 用於畫面「環境徽章」，讓不同階段（main / stage / dev 子路徑）一眼可辨。
const appEnv = process.env.APP_ENV || "dev";

// CSP 只在 build 注入（dev 的 HMR websocket 與 react-refresh inline script 與 CSP 不相容）。
// index.html 的 inline script（深色模式防閃爍）以 sha256 白名單放行——hash 於 build 時對「最終輸出」
// 內容計算（order: "post"），script 內容改動不會 drift。
// 平台限制（GitHub Pages 無自訂 header，只能用 <meta>）：frame-ancestors／X-Content-Type-Options
// 在 meta 中無效、做不到——已如實記載於 docs/compliance/合規08 §2.4。
function cspPlugin(): Plugin {
  return {
    name: "inject-csp-meta",
    apply: "build",
    transformIndexHtml: {
      order: "post",
      handler(html) {
        const inlineHashes = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(
          (m) => `'sha256-${createHash("sha256").update(m[1]).digest("base64")}'`,
        );
        const csp = [
          "default-src 'self'",
          ["script-src 'self'", ...inlineHashes].join(" "),
          "style-src 'self' 'unsafe-inline'", // React style 屬性＋html2canvas 複製樣式所需
          "img-src 'self' data: blob:", // html2canvas canvas→dataURL、PDF 產生
          "connect-src 'self'", // 不放行 api.ipify.org：出勤功能關閉（FEATURES.attendance）；啟用時另評（P1 同意閘）
          "font-src 'self' data:",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'none'",
          "frame-src 'self'", // html2canvas 內部 iframe（about:blank 繼承來源，不受此限制阻擋）
        ].join("; ");
        return [
          { tag: "meta", attrs: { "http-equiv": "Content-Security-Policy", content: csp }, injectTo: "head-prepend" as const },
        ];
      },
    },
  };
}

export default defineConfig({
  // 相對路徑：可部署於 GitHub Pages 專案子路徑（/taiwan-hr-salary/）或任意子目錄
  base: "./",
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __GIT_SHA__: JSON.stringify(gitSha),
    __BUILD_TIME__: JSON.stringify(buildTime),
    __APP_ENV__: JSON.stringify(appEnv),
  },
  plugins: [react(), cspPlugin()],
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
