// 手冊 Tailwind：以 app 的設定為 preset（同一套 token→class 對映），但：
// - preflight 關閉（不注入 CSS reset，否則會打爆 Docusaurus/Infima 全站樣式）
// - darkMode 增列 [data-theme="dark"]（Docusaurus 的深色開關；app 用 .dark class）
// - content 掃「元件庫本尊」＋手冊自身，只產出有用到的 utilities
import appPreset from "../tailwind.config.js";

/** @type {import('tailwindcss').Config} */
export default {
  presets: [appPreset],
  corePlugins: { preflight: false },
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "../src/components/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "./docs/**/*.{md,mdx}",
  ],
};
