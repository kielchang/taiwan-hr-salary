# 元件庫（UI Kit）變更紀錄

本檔記錄**元件庫自己的版本**，與 app 版號（`package.json` / `CHANGELOG.md`）**獨立**。
版號規則見 [README.md](README.md)。版號單一來源＝[`src/components/version.ts`](../../src/components/version.ts)。

## [0.10.0] - 2026-07-08

### 變更（圖表色票定案：Cobalt → Gem 寶石色票）
- **`--chart-1..8`（`index.css`）改為「Gem」**：綜合使用者指定的 6 個 Figma 命名色票（Mermaid Garnet
  Symphony／Copper Aquamarine Dream／Lavender Sapphire Mist／Emerald Blush Sunset／Beryl Topaz
  Afternoon／Emerald Sand Dusk）研究後，抽出 8 個彼此獨立的寶石色相：藍寶石 `#1d4ed8`／祖母綠
  `#0e8a5f`／石榴石 `#a3123a`／黃玉 `#b88d0a`／紫水晶 `#7e3af2`／粉晶 `#db5a79`／紅玉髓 `#cf4217`／
  海藍寶石 `#0e9488`。淺、深色模式皆通過亮度帶／彩度/CVD 分離/對比四項檢查、零警示（深色藍寶石另配
  較亮的 `#2a5ae5` 步階，以通過暗黑模式改版後的新背景 `#101319`）。完整研究/比較過程見
  `src/components/ChartThemes.stories.tsx`（保留 Cobalt/Vivid/Deep/Pastel/Aqua/Bold 供未來參考）。
- 黃玉／紅玉髓原本色相只差 11°、容易讀成同一種棕色，已拉開到 31° 差距（更貼近寶石本名色澤）。

## [0.9.0] - 2026-07-08

### 變更（圖表色票 token 化＋改用「Cobalt」驗證色票）
- **`charts/index.tsx` 的 `PALETTE`／`AXIS`／`GRID`／`TEXT`** 由硬編 hex 改讀 `index.css` 的 `--chart-1..8`／`--chart-axis/grid/text`（SVG `fill`/`stroke` 可直接吃 `var()`）；深色步階已備於 `.dark`，未來啟用主題切換零元件改動。
- **色票內容同時更新為「Cobalt」**：以 dataviz 技能的 `validate_palette.js` 驗證器實測——原本的舊色票其實**未通過**檢查（slate 彩度不足、洋紅↔青綠 CVD 混色 ΔE 6.0、深色模式 4 色亮度超出可用帶）。新色票（`#2a78d6` 藍／`#1baf7a` 青綠／`#eda100` 金黃／`#008300` 綠／`#4a3aa7` 紫／`#e34948` 紅／`#e87ba4` 洋紅／`#eb6834` 橙）淺、深色模式皆通過亮度帶／彩度/CVD 分離/對比四項檢查。
- Storybook「設計 Tokens」型錄同步更新色票說明。

## [0.8.0] - 2026-07-08

### 新增（統一設計語言：語意色彩 token）
- **語意狀態 token**：`success`／`warning`／`info`／`danger`＋「已變更」`edit`（`edit`/`edit-foreground`/`edit-bg`）。定義於 `src/index.css` CSS 變數（含 dark-ready `.dark` 值）、映射於 `tailwind.config.js`。取代散落各處的 emerald/amber/sky/rose 硬編色——改 token 即全站同步。
- **元件庫改走 token**：`badge`(success/warning)、`Delta`(good/bad)、`Stepper`(完成步)、`EditableField`／`ChangeSummary`（「已變更」amber 態、undo/redo 色）皆改用語意 token。
- **Storybook「設計 Tokens」型錄**：色彩/狀態/edit/圖表色票/型級/圓角的可視單一參考。
- **shadcn CLI 設定** `components.json`（default/slate/cssVariables/aliases）：未來可 `npx shadcn add` 並對比上游。

### 治理
- **設計語言守衛**（`tests/uiKit.test.ts`）：元件庫檔案不得出現原始調色盤字面色（amber-/emerald-/rose-/sky-/orange-/yellow-NNN），強制走語意 token。

## [0.7.0] - 2026-07-08

### 新增
- **TabPills**（分頁膠囊列）：全站分頁切換的統一元件（tablist/tab 語意＋觸控目標）。取代各畫面手刻的 `<button>` 分頁列——ProjectsView／ReportsHubView／SettingsView／FilingView／AnalyticsView／MasterDataView 皆改用，樣式集中、一改全站同步。

## [0.6.0] - 2026-07-08

### 變更（DataTable 文字篩選）
- **多筆文字條件**：文字欄篩選改為可加入**多個「包含」條件**（符合任一即列出），每個條件是獨立可移除的標籤（popover 內與外層條件列皆可個別移除）。
- **推薦選項（自動完成）**：輸入時即時列出該欄不重複值中**最相似的前 3 項**（起頭＞包含＞字元相近），點擊即快速加入為條件。

## [0.5.0] - 2026-07-08

### 新增（DataTable）
- **多選篩選（select）**：欄位設 `filter: "select"` 時，篩選 popover 改為該欄**不重複值的勾選清單**（>8 項附搜尋、全選／取消全選），符合 Excel 的多選篩選；條件標籤顯示「欄：值1、值2 等 N 項」。

## [0.4.0] - 2026-07-08

### 新增（DataTable）
- **篩選條件標籤列**：每個生效中的欄位篩選以獨立標籤顯示（如「月薪總額：≥ 30000、≤ 50000」），可**個別移除**單一條件；多個條件時另有「全部清除」。取代原本只能一次清掉全部的做法。

## [0.3.0] - 2026-07-08

### 變更（DataTable 表頭與欄寬）
- **表頭排列一致化**：所有欄位統一為「標題＋排序箭頭（左）… 篩選漏斗（固定最右）」；不再因數字欄右對齊而順序不一。
- **篩選 popover 改用 portal＋fixed 定位**：修正凍結首欄的篩選面板被水平捲動容器/黏性欄裁切或蓋住的問題。

### 新增
- **可調欄寬**：拖曳欄位右邊界調整寬度；**雙擊邊界自適應內容**（清除手動寬度）。`resizable` 預設開。

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
