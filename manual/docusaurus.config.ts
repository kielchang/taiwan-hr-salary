// 操作手冊站（Docusaurus）：獨立於 app 建置與部署（改 manual/** 只重佈手冊）。
// baseUrl 依環境注入（CI 傳 MANUAL_BASE_URL；本地預設 /）；APP_URL＝回系統連結。
import path from "node:path";
import fs from "node:fs";
import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const BASE_URL = process.env.MANUAL_BASE_URL ?? "/";
// 手冊掛在 <env>/manual/ 底下 → 系統本體＝上一層
const APP_URL = process.env.MANUAL_APP_URL ?? "https://kielchang.github.io/taiwan-hr-salary/";

const config: Config = {
  title: "薪資管理系統 操作手冊",
  tagline: "台灣合規薪資計算系統（115 年度）完整操作說明",
  favicon: "img/favicon.ico",
  url: "https://kielchang.github.io",
  baseUrl: BASE_URL,
  organizationName: "kielchang",
  projectName: "taiwan-hr-salary",
  trailingSlash: true,
  onBrokenLinks: "throw",
  future: { v4: true },
  i18n: { defaultLocale: "zh-Hant", locales: ["zh-Hant"] },

  customFields: { appUrl: APP_URL },

  plugins: [
    // 活元件示例管線：讓手冊直接編譯並渲染 repo 的 UI 元件庫（元件本尊、非截圖）。
    // - alias @ → ../src（元件庫內部 import 路徑）
    // - 讓 siteDir 外的 ../src TSX 走 Docusaurus 官方 babel（getJSLoader）
    // - PostCSS 掛 Tailwind（manual/tailwind.config.js：preset app 設定、preflight 關）
    function kitPipeline() {
      return {
        name: "kit-pipeline",
        configureWebpack(_config: unknown, isServer: boolean, utils: { getJSLoader: (o: { isServer: boolean }) => unknown }) {
          return {
            resolve: { alias: { "@": path.resolve(__dirname, "../src") } },
            module: {
              rules: [
                {
                  test: /\.(t|j)sx?$/,
                  include: [path.resolve(__dirname, "../src")],
                  use: [utils.getJSLoader({ isServer })],
                },
              ],
            },
          };
        },
        configurePostCss(opts: { plugins: unknown[] }) {
          opts.plugins.push(
            require("tailwindcss")({ config: path.resolve(__dirname, "tailwind.config.js") }),
            require("autoprefixer"),
          );
          return opts;
        },
      };
    },
  ],

  presets: [
    [
      "classic",
      {
        docs: {
          routeBasePath: "/", // 手冊即整站：docs 掛根
          sidebarPath: "./sidebars.ts",
          // 版本對映系統版號（SemVer）：發佈 app 新版時同步 `npm run docusaurus docs:version <版號>`
          // （SOP 見 docs/versioning.md）。動態讀 versions.json：快照自動掛「系統 vX」標籤、
          // 預設顯示最新快照＝與正式站系統版本吻合；current＝「開發中」掛 /next、帶未發佈橫幅。
          ...(() => {
            const vfile = path.join(__dirname, "versions.json");
            const snap: string[] = fs.existsSync(vfile) ? JSON.parse(fs.readFileSync(vfile, "utf8")) : [];
            const versions: Record<string, object> = { current: { label: "開發中（下一版）", path: "next", banner: "unreleased" } };
            for (const v of snap) versions[v] = { label: `系統 v${v}`, banner: "none" };
            return snap.length ? { lastVersion: snap[0], versions } : { versions };
          })(),
        },
        blog: false,
        pages: false,
        theme: { customCss: ["./src/css/custom.css", "./src/css/kit.css"] },
      } satisfies Preset.Options,
    ],
  ],

  themes: [
    [
      require.resolve("@easyops-cn/docusaurus-search-local"),
      { hashed: true, language: ["en", "zh"], indexBlog: false, docsRouteBasePath: "/" },
    ],
  ],

  themeConfig: {
    colorMode: { respectPrefersColorScheme: true },
    navbar: {
      title: "薪資管理系統 操作手冊",
      items: [
        { type: "docsVersionDropdown", position: "right", dropdownActiveClassDisabled: true },
        { href: APP_URL, label: "回系統 ↗", position: "right" },
      ],
    },
    footer: {
      style: "dark",
      copyright: `薪資管理系統操作手冊 · 115 年度（2026）· <a href="${APP_URL}" target="_blank" rel="noreferrer">開啟系統</a>`,
    },
    prism: { theme: prismThemes.github, darkTheme: prismThemes.dracula },
  } satisfies Preset.ThemeConfig,
};

export default config;
