# 元件庫（UI Kit）變更紀錄

本檔記錄**元件庫自己的版本**，與 app 版號（`package.json` / `CHANGELOG.md`）**獨立**。
版號規則見 [README.md](README.md)。版號單一來源＝[`src/components/version.ts`](../../src/components/version.ts)。

## [0.2.0] - 2026-07-08

### 新增（DataTable）
- **十字對準 highlight**：滑鼠移入／觸控點擊儲存格時，highlight 當前行與列（交點加深），長表對讀更容易（`crosshair` 預設開，可關）。
- **單欄篩選（Excel 式）**：每欄表頭漏斗鈕開啟 popover——文字欄「包含」、數字欄「數值範圍（最小～最大）」；工具列顯示啟用中的篩選數並可一鍵清除。欄位可用 `filter: "text" | "range" | "none"` 覆寫自動判定。
- **分頁每頁筆數改為 5／15／30／50**（預設 15）；沿用門檻式（超過每頁筆數才顯示分頁器）。

## [0.1.0] - 2026-07-08

首個獨立版控的快照。將既有元件正式劃為「元件庫」範圍並建立對外邊界，為未來切割成
共用套件（讓不同系統統一介面風格）做準備。**元件本身自 app v1.2–v1.6 已於正式站運行、經測試驗證。**

### 範圍（公開匯出見 `src/components/index.ts`）
- **基礎 UI**：Badge、Button、Card、Checkbox、Delta、Dialog、EmptyState、Input、Label、Select、Table、Tabs、Tooltip（含 TruncatedText）。
- **資料呈現**：DataTable（搜尋／排序／門檻分頁／凍結首欄／合計／CSV／截斷提示）、ChartCard。
- **圖表**（零相依 SVG）：StackedBar、Pareto、Heatmap、TrendChart、Bullet、BarChart、PALETTE、capItems。
- **表單（唯讀逐欄編輯系統）**：EditableField（含 SegGroup 單選／Chips 多選／undo·redo 確認）、ChangeSummary、useRecordDiff。
- **其他**：NumberInput、Stepper、ErrorBoundary。

### 建立
- **版本單一來源** `src/components/version.ts`（`UI_KIT = { name, version }`）。
- **公開 barrel** `src/components/index.ts`＝對外邊界與範圍清單。
- **邊界守衛測試** `tests/uiKit.test.ts`：元件庫檔案的 `@/` 匯入僅限允許清單，禁止耦合 app 模組（store／data／views／content／types…），確保可原樣切出。
- **解耦**：`saveBlob` 由 `lib/payslipPdf`（app 網域）移至通用 `lib/download`，清掉元件庫唯一的 app-domain 依賴。

### 依賴面（切出時需一併帶走）
- 設計 token：Tailwind 設定（`tailwind.config.js`）＋ `src/index.css` 的 CSS 變數與 `.tap-target*` 工具。
- 通用工具：`lib/utils`（cn）、`lib/useSort`、`lib/csv`、`lib/forms/diff`、`lib/download`。
- peer：React 18、lucide-react、Radix（checkbox/dialog/label/select/tabs/slot）、clsx/tailwind-merge。
