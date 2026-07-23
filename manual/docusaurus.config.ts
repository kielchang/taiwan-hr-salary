// 操作手冊站（Docusaurus）：獨立於 app 建置與部署（改 manual/** 只重佈手冊）。
// baseUrl 依環境注入（CI 傳 MANUAL_BASE_URL；本地預設 /）；APP_URL＝回系統連結。
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

  presets: [
    [
      "classic",
      {
        docs: {
          routeBasePath: "/", // 手冊即整站：docs 掛根
          sidebarPath: "./sidebars.ts",
        },
        blog: false,
        pages: false,
        theme: { customCss: "./src/css/custom.css" },
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
      items: [{ href: APP_URL, label: "回系統 ↗", position: "right" }],
    },
    footer: {
      style: "dark",
      copyright: `薪資管理系統操作手冊 · 115 年度（2026）· <a href="${APP_URL}" target="_blank" rel="noreferrer">開啟系統</a>`,
    },
    prism: { theme: prismThemes.github, darkTheme: prismThemes.dracula },
  } satisfies Preset.ThemeConfig,
};

export default config;
