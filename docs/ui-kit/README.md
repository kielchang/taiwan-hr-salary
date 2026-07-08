# 元件庫（UI Kit）— 版控與切割指南

目標：讓這套介面元件**有自己的版控**，未來可**切割成共用套件**，讓不同系統套用、統一介面設計風格。
目前採「**in-repo 獨立版控**」：元件仍住在本 repo 的 `src/components`，但已有獨立版號、CHANGELOG 與
對外邊界，隨時可 lift-and-shift 抽出。

## 版本

- 單一來源：[`src/components/version.ts`](../../src/components/version.ts) 的 `UI_KIT = { name, version }`。
- 與 app 版號**脫鉤**：app 走 `package.json` 版號；元件庫走自己的 SemVer。
- 顯示位置：Storybook「元件庫 / 總覽」頁。
- Bump 規則（SemVer，獨立於 app）：
  - **patch**：修 bug、內部重構、無 API/視覺行為變動。
  - **minor**：新增元件或 props、向後相容的視覺/互動增強。
  - **major**：破壞性 API 變更（移除/改名 props、改變預設行為）。
  每次變動元件庫 → bump `version.ts` ＋ 補一段 [CHANGELOG](CHANGELOG.md)。

## 範圍（＝公開邊界）

對外公開的元件與工具都列在 **[`src/components/index.ts`](../../src/components/index.ts)**（barrel）。
app 內部可漸進改用 `import { Button, DataTable } from "@/components"`。

**不在**元件庫內（app glue，刻意排除）：`HelpHint`（吃 `content/help`）、`PrintHeader`（吃 `@/version`）、
`BracketTables`／`BracketTableCards`（業務資料表）。這些留在 `src/components` 但不進 barrel。

## 鐵律：邊界不得耦合 app

元件庫檔案**只能**依賴：設計 token（Tailwind＋`index.css`）＋通用工具
（`lib/utils`・`useSort`・`csv`・`forms/diff`・`download`）＋彼此。
**不得** import `@/store`、`@/data`、`@/views`、`@/content`、`@/version`、`@/lib/types`、
`@/lib/calc`、`@/lib/reports`… 等 app 專屬模組。

由 **[`tests/uiKit.test.ts`](../../tests/uiKit.test.ts)** 自動守衛：任何違規（例如在元件裡 import store）
會讓測試變紅，逼在切割前就保持乾淨。新增元件請一併加進 barrel（會自動納入守衛）。

## 依賴面（切出時需一併帶走）

- **設計 token**：`tailwind.config.js` 的色彩/半徑；`src/index.css` 的 `:root` CSS 變數、`.col-*`、`.tap-target*`。
- **通用工具**：`lib/utils`、`lib/useSort`、`lib/csv`、`lib/forms/diff`、`lib/download`。
- **peer deps**：React 18、`lucide-react`、`@radix-ui/*`（checkbox/dialog/label/select/tabs/slot）、`clsx`、`tailwind-merge`、`tailwindcss-animate`。

## 未來切割路線（保留、非現在做）

1. **（現況）in-repo 獨立版控** — 版號＋CHANGELOG＋barrel＋邊界守衛。零 build 變更、app 全綠。
2. **monorepo 套件** — 建 `packages/ui`：把 `src/components`＋依賴面搬入，獨立 `package.json`／版號／
   lib build（tsup 或 vite lib mode）＋自己的 tsconfig；app 以 npm workspace 依賴 `@org/ui`；
   Storybook 指向套件。需改 build/alias/CI。
3. **獨立 repo／發佈 npm** — 抽成獨立 git repo，CI 發佈到私有或公開 registry，多系統以版本號依賴。

因為 §1 已維持邊界乾淨，往 §2/§3 走時元件檔幾乎原樣搬移，主要工作在 build 設定與依賴面打包。
