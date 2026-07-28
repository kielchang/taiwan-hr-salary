# 符合性台帳（Conformance Ledger）

**這份台帳回答一個問題：本專案的每個元件，哪些是遵照上游規範、哪些是自製、哪些刻意不一樣。**

上游＝[doping-design-book](https://github.com/kielchang/doping-design-book)（`@doping/react` **0.1.0**）
本地＝`src/components`（`UI_KIT` **0.17.1**，見 [`src/components/version.ts`](../../src/components/version.ts)）

> 本專案對上游**唯讀**。要改上游 → 寫 [提案](proposals/) → PR → 合併後才回寫本表與本地實作。

## 狀態定義

| 狀態 | 意義 | 後續動作 |
|---|---|---|
| **遵循** | 對齊上游同名項目的規範與行為 | 上游 bump 時評估跟進 |
| **自製** | 上游沒有，本專案自行設計 | 若具通用性 → 依三次法則寫提案推上游 |
| **刻意偏離** | 上游有，但本專案做法不同 | **必須寫原因**；沒寫原因＝待修，不是偏離 |

## 基礎元件（`src/components/ui/`）

| 本地元件 | 狀態 | 上游對應 | 備註 |
|---|---|---|---|
| `badge` | 遵循 | `ui/badge` | |
| `button` | 遵循 | `ui/button` | |
| `callout` | 遵循 | `ui/callout` | 四種狀態語意 success/warning/info/danger |
| `card` | 遵循 | `ui/card` | |
| `checkbox` | 遵循 | `ui/checkbox` | |
| `coachmark` | 遵循 | `ui/coachmark` | 含可縮小（避免擋住操作）與驗收標記 |
| `delta` | 遵循 | `ui/delta` | 箭頭＋文字＋色三重編碼 |
| `dialog` | 遵循 | `ui/dialog` | |
| `empty-state` | 遵循 | `ui/empty-state` | |
| `input` | 遵循 | `ui/input` | |
| `label` | 遵循 | `ui/label` | |
| `mockup` | 遵循 | `ui/mockup` | 文件用積木；聚光＝主色脈動環 |
| `select` | 遵循 | `ui/select` | |
| `table` | 遵循 | `ui/table` | |
| `tooltip` | 遵循 | `ui/tooltip` | |
| `data-table` | 遵循 | `ui/data-table` | 搜尋／篩選／排序／分頁／合計／凍結首欄／CSV |
| `tab-pills` | 遵循 | `ui/tab-pills` | |
| **`tabs`（Radix）** | **刻意偏離** | 上游只收 `tab-pills` | 上游認為兩者並存＝沒有規範。本地 `tabs` 為既有相依，**新畫面一律用 `TabPills`**（鐵律 6）；待確認無殘留使用後移除 |
| **`chart-card`** | **自製** | 上游未收 | 上游判定「抽掉 charts 後只是 Card 變體」而不收。本地因有 13+ 圖表卡而成立 |

## 表單（`src/components/form/`）

| 本地元件 | 狀態 | 上游對應 | 備註 |
|---|---|---|---|
| `EditableField` | 遵循 | `form/editable-field` | 唯讀逐欄編輯：點擊才輸入、改動標色、undo/redo 先確認 |
| `ChangeSummary` | 遵循 | `form/change-summary` | |
| `useRecordDiff` | 遵循 | `form/use-record-diff` | |

## 根層元件

| 本地元件 | 狀態 | 上游對應 | 備註 |
|---|---|---|---|
| `NumberInput` | 遵循 | `ui/number-input` | |
| `Stepper` | 遵循 | `ui/stepper` | |
| **`ErrorBoundary`** | **自製** | 上游刻意不收 | 上游理由：屬「應用外殼」職責，沒有視覺／互動決策要編碼。保留在本地是正確的 |
| **`charts/`**（StackedBar／Pareto／Heatmap／TrendChart／Bullet…） | **自製** | 上游第 2 階段 | 上游判定圖表是自成一格的子系統（軸／圖例／互動／色盲驗證），第一版只收**圖表色票 token**。→ 已列[提案 0001](proposals/0001-charts.md) |

## 上游有、本地尚無

| 上游項目 | 本地狀態 | 說明 |
|---|---|---|
| `ui/seg-group` | 未獨立成件 | 本地埋在 `EditableField` 內部（radio 分段）。上游抽成獨立元件。→ 待評估對齊 |
| `ui/chips` | 未獨立成件 | 同上（multiselect 標籤片）。→ 待評估對齊 |

## App glue（**不屬**元件庫範圍，刻意不入 barrel）

`HelpHint`／`PrintHeader`／`BracketTables`／`BracketTableCards`／`BracketEditor`／`TourRunner`
——領域綁定或依賴 store／content／router，上游三問第一關即排除。**這些不需要對齊，也不應推上游。**

## 維護規則

1. **新增元件前**：先查上游有無（`./scripts/design-book.sh --list`）。有 → 遵循並記一列；沒有 → 自製並記一列。
2. **偏離必須寫原因**，否則視為待修項目。
3. **上游 bump 後**：拉取 → 逐列評估是否跟進 → 更新本表的上游版本欄。
4. 本表與 [`docs/ui-kit/CHANGELOG.md`](../ui-kit/CHANGELOG.md) 併行維護：CHANGELOG 記「本地改了什麼」，本表記「與上游的關係」。
