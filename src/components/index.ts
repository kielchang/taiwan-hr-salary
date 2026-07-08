// ─────────────────────────────────────────────────────────────────────────
// 元件庫（UI Kit）公開匯出 — 這份 barrel 即「元件庫範圍清單」與對外邊界。
//
// 規則（鐵律）：這裡列出的所有模組**不得** import app 專屬模組（store / data / views /
// content / version / lib/types / lib/calc / lib/reports…）。僅可依賴設計 token（Tailwind
// 設定＋index.css 的 CSS 變數）與少數通用工具（lib/utils・useSort・csv・forms/diff・download）。
// 由 tests/uiKit.test.ts 自動守衛，確保未來可原樣切割成獨立套件。
//
// 版本：見 ./version.ts（獨立於 app 版號）。app 內部可漸進改為 `import { Button } from "@/components"`。
// ─────────────────────────────────────────────────────────────────────────

export { UI_KIT } from "./version";

// 基礎 UI 原子（shadcn 風格）
export * from "./ui/badge";
export * from "./ui/button";
export * from "./ui/card";
export * from "./ui/checkbox";
export * from "./ui/delta";
export * from "./ui/dialog";
export * from "./ui/empty-state";
export * from "./ui/input";
export * from "./ui/label";
export * from "./ui/select";
export * from "./ui/table";
export * from "./ui/tabs";
export * from "./ui/tooltip";

// 資料呈現容器
export * from "./ui/data-table";
export * from "./ui/chart-card";

// 零相依 SVG 圖表
export * from "./charts";

// 表單：唯讀逐欄編輯系統
export * from "./form/EditableField";
export * from "./form/ChangeSummary";
export * from "./form/useRecordDiff";

// 其他通用元件
export * from "./NumberInput";
export * from "./Stepper";
export * from "./ErrorBoundary";
