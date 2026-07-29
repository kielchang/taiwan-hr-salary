# 交付包：帶去 doping-design-book 的草案與方法論

這一包是從下游專案（一套實際在跑的後台系統）萃取出來、**準備推給上游設計書**的內容。
它不是文件本身，是一份**放置清單 ＋ 草案**：到了上游照著〈落地清單〉逐列操作即可。

## 🔒 唯讀鐵律

**本交付包不修改上游任何檔案。** 所有內容都是草案，落地一律走：

```
交付包 → 人工帶去上游 → 開 PR → 上游確認並合併 → 才回頭更新下游的 conformance.md
```

未合併的提案**不得在下游先行實作**，否則兩邊會各走各的，台帳就失去意義。

## 這一包的核心原則：不製造第二份文件

上游 `book/docs/3-components/` **已經有 22 頁元件文件**（`00-overview` ＋ `01-button` … `21-mockup`），
而且寫得比預期完整——多數頁面的規範深度已經超過下游的 story 覆蓋。

所以這一包**刻意不產出 21 份重複的新頁**。分流原則：

| 上游現況 | 產出 |
| --- | --- |
| 已有頁，且下游有它沒寫的東西 | **差異補充稿**，指明併進哪一頁的哪一節 |
| 上游沒有、值得收 | 完整新頁草案 |
| 上游刻意不收 | 只在本清單登記理由，不產檔 |
| 比對後沒有實質差異 | 標「無差異」，不產檔 |

**盤點結果：22 頁裡有 13 頁判定「無差異」。** 這是好消息不是壞消息——
代表兩邊的規範已經高度對齊，真正需要人工判斷的只剩下面那幾項。

---

## 落地清單（到了上游照這張表操作）

### A. 新頁

| 草案 | 上游目標路徑 | 動作 | 一句話理由 |
| --- | --- | --- | --- |
| [`pages/22-charts.mdx`](pages/22-charts.mdx) | `book/docs/3-components/22-charts.mdx` | **新增** | 上游最大的缺口：色票統一了但畫法沒統一，各專案自己畫圖表仍會視覺分家 |

⚠️ **落地前置**：圖表元件不在 `book/src/theme/MDXComponents.tsx` 的白名單裡，
本草案因此**完全沒有使用 `<Demo>`**，改用決策表＋程式碼＋文字描述。
元件收進 `packages/react` 並註冊到 MDXComponents 之後，再回頭補活範例，頁面結構不必動。

### B. 差異補充稿（併進既有頁）

| 草案 | 上游目標路徑 | 動作 | 一句話理由 |
| --- | --- | --- | --- |
| [`pages/supplements/00-overview.md`](pages/supplements/00-overview.md) | `3-components/00-overview.md` | **合併**進〈收錄範圍〉與〈不收什麼〉 | 收了 charts 之後，「不收圖表元件」這句話會自我矛盾 |
| [`pages/supplements/02-badge.mdx`](pages/supplements/02-badge.mdx) | `3-components/02-badge.mdx` | **合併**：〈狀態對應建議〉之後新增一節 | 頁面說「一定要有文字」卻沒說「文字要多短」，兩條規則會互相拉扯 |
| [`pages/supplements/09-chips.mdx`](pages/supplements/09-chips.mdx) | `3-components/09-chips.mdx` | **合併**：Demo 之後新增兩節 | 元件已支援 `changed`／`disabled`／`emptyHint`，頁面一個都沒示範；對照 SegGroup 已做三態並列，兩頁深度不一致 |
| [`pages/supplements/11-dialog.mdx`](pages/supplements/11-dialog.mdx) | `3-components/11-dialog.mdx` | **合併**：三處插入（破壞性分級／長內容捲動／禁止巢狀） | **雙方都缺**：上游 `DialogContent` 沒有任何高度上限，內容一長標題與按鈕會同時被推出視窗 |
| [`pages/supplements/13-data-table.mdx`](pages/supplements/13-data-table.mdx) | `3-components/13-data-table.mdx` | **合併**：三處插入（每頁檔位／欄寬／版面開關／資料量邊界） | 元件已支援 `pageSizeOptions`／`resizable`／`dense`／`crosshair`，頁面沒寫——**功能有、規範沒有** |
| [`pages/supplements/17-stepper.mdx`](pages/supplements/17-stepper.mdx) | `3-components/17-stepper.mdx` | **合併**：〈何時不要用〉之後新增一節 | 頁面只寫了「超過 6 步該拆」，沒寫「沒拆會怎樣」；第一個遇到 8 步的人只能自己發明做法 |
| [`pages/supplements/18-editable-field.mdx`](pages/supplements/18-editable-field.mdx) | `3-components/18-editable-field.mdx` | **合併**：兩處插入（數值顯示三規則／`unit`／極端值） | 元件已實作不四捨五入、負值會計括號、`unit`，頁面一字未提——不寫下來下一個實作者就會做成別的樣子 |
| [`pages/supplements/19-change-summary.mdx`](pages/supplements/19-change-summary.mdx) | `3-components/19-change-summary.mdx` | **合併**：〈空狀態要明說〉之後新增一節 | 元件已實作「超過 8 筆限高捲動」，門檻值沒寫下來，下一個人會當成 bug 修掉 |
| [`pages/supplements/20-coachmark.mdx`](pages/supplements/20-coachmark.mdx) | `3-components/20-coachmark.mdx` | **合併**：〈驗收模式〉之後新增三節 | `targetRect=null`／`actionHint`／`warning`／`secondaryAction` 四個能力頁面完全沒提，只能靠讀型別去猜 |

### C. 方法論（治理章節）

| 草案 | 上游目標路徑 | 動作 | 一句話理由 |
| --- | --- | --- | --- |
| [`conventions/storybook-setup.md`](conventions/storybook-setup.md) | `book/docs/6-governance/05-storybook-setup.mdx` | **新增** | 上游 `.storybook/` 幾乎已照做，但這些決定只活在程式碼註解裡——註解只有改那個檔案的人讀得到 |
| [`conventions/story-conventions.md`](conventions/story-conventions.md) | `book/docs/6-governance/06-story-conventions.mdx` | **新增** | 中文 arg playground、狀態並列、hook 陷阱，上游完全沒有這一層規範 |
| [`conventions/stress-stories.md`](conventions/stress-stories.md) | `book/docs/6-governance/07-stress-stories.mdx` | **新增** | 壓力測試 story 多數專案沒有，而它產出的是**規範**不只是 bug 清單 |
| [`conventions/kit-boundary.md`](conventions/kit-boundary.md) | **不新增頁** → 併進 `6-governance/03-drift-guards.mdx` ＋ `01-versioning.mdx` | **合併** | 上游已寫了邊界守衛、barrel 覆蓋率、獨立版號。只補三件事：把三者講成一組、barrel 的「多出來」風險、**第五支守衛（禁止原始調色盤字面色）** |

### D. 涵蓋度盤點

| 草案 | 上游目標路徑 | 動作 | 一句話理由 |
| --- | --- | --- | --- |
| [`coverage.md`](coverage.md) | 參考資料，**不直接落地** | **登記備查** | 給上游當補 story 的依據；同時是下游的 backlog（全庫無 loading／error 態、0 個 play function、未裝 a11y addon） |

---

## 判定「無差異」的頁（不產檔）

| 上游頁 | 理由 |
| --- | --- |
| `01-button.mdx` | 下游只有變體與尺寸的展示，上游已全數涵蓋，且多寫了「為什麼沒有 loading 變體」 |
| `03-callout.mdx` | 四種語意＋固定圖示＋`tag` 代號，上游已完整，下游無新增 |
| `04-card.mdx` | 下游只有基本結構展示 |
| `05-input.mdx` | 上游多寫了 36px 高度統一與 placeholder 不是 label，下游無新增 |
| `06-number-input.mdx` | 上游已寫三件小事＋滾輪陷阱；下游多的只有 `step`／`min` 這類 API 細節，不構成規範 |
| `07-checkbox-select.mdx` | 上游已寫「幾個選項該用哪一種」的判準，下游無新增 |
| `08-seg-group.mdx` | 上游頁面與 story **都已經做了三態並列**，下游無新增（對照組：Chips 沒做，見補充稿） |
| `10-tooltip.mdx` | 三種觸發、邊緣防溢、`focusable` 界線，上游已完整 |
| `12-table.mdx` | 三個擴充＋列印時關掉黏性表頭，上游已完整 |
| `14-tab-pills.mdx` | 上游多寫了「建議同步到網址」，下游無新增 |
| `15-delta.mdx` | 三重編碼、`goodWhen`、零值也要說話，上游已完整 |
| `16-empty-state.mdx` | 三種空的分類是上游的，下游沒有更細的分法（僅 `compact` prop 未載，見下方零碎補充） |
| `21-mockup.mdx` | 零截圖示意的規約，上游已完整且更清楚 |

## 零碎補充（一句話級，不另立檔）

這三項太小，不值得為它們各開一份草案。合併時順手加上即可：

| 目標 | 加什麼 |
| --- | --- |
| `16-empty-state.mdx`〈不要放大型插畫〉末 | 「嵌在卡片或表格內的空狀態用 `compact`（垂直內距減半）——它出現的頻率比整頁空狀態高得多，佔位子的代價也高得多。」 |
| `19-change-summary.mdx` | 若不採用完整補充稿，至少補一句：「超過 8 筆變更時清單限高並內部捲動，總數固定顯示在標題。」 |
| `13-data-table.mdx`〈欄位設定就是全部的 API〉程式碼註解 | 補 `width`／`headerClassName` 兩個未列出的欄位設定 |

---

## 元件對照總表（涵蓋下游 barrel 的全部公開匯出）

下游 barrel（`src/components/index.ts`）的每一項都在這裡有明確動作。

### 基礎 UI

| 下游匯出 | 上游對應 | 動作 |
| --- | --- | --- |
| `badge` | `02-badge` | 合併補充（文字長度） |
| `button` | `01-button` | 無差異 |
| `callout` | `03-callout` | 無差異 |
| `card` | `04-card` | 無差異 |
| `checkbox` | `07-checkbox-select` | 無差異（覆蓋不足屬下游 backlog，見 coverage.md） |
| `chips` | `09-chips` | 合併補充（四態並列＋`emptyHint`） |
| `coachmark` | `20-coachmark` | 合併補充（四種形態） |
| `delta` | `15-delta` | 無差異 |
| `dialog` | `11-dialog` | 合併補充（**雙方都缺**，補成規範） |
| `empty-state` | `16-empty-state` | 無差異（`compact` 走零碎補充） |
| `input` | `05-input` | 無差異 |
| `label` | 併於 `05-input` | 無差異 |
| `mockup` | `21-mockup` | 無差異 |
| `seg-group` | `08-seg-group` | 無差異 |
| `select` | `07-checkbox-select` | 無差異 |
| `table` | `12-table` | 無差異 |
| `tooltip` | `10-tooltip` | 無差異 |
| **`tabs`（Radix）** | — | **不收，登記備查**：上游只收 `TabPills`，理由是「兩者並存＝沒有規範」。下游的 `tabs` 是既有相依，屬待清理項目，不該推上游 |

### 資料呈現

| 下游匯出 | 上游對應 | 動作 |
| --- | --- | --- |
| `data-table` | `13-data-table` | 合併補充（版面開關與資料量邊界） |
| `tab-pills` | `14-tab-pills` | 無差異 |
| **`chart-card`** | — | **不收，登記備查**：上游判定「抽掉 charts 之後只是 Card 的一個變體」。若 22-charts 落地，可在 charts 頁的〈列印〉一節順帶說明「圖表要包在卡片裡」，不必獨立元件 |

### 圖表（8 種 ＋ 圖例）

全部收進單一新頁 `22-charts.mdx`，每一種在頁內各有一節（用途／何時不要用／資料形狀／可調參數）。

| 下游匯出 | 頁內小節 | 動作 |
| --- | --- | --- |
| `BarChart` | 〈BarChart 長條圖〉 | 新增 |
| `Pareto` | 〈Pareto 柏拉圖〉 | 新增 |
| `StackedBar` | 〈StackedBar 水平堆疊長條〉 | 新增 |
| `TrendChart` | 〈TrendChart 趨勢折線〉 | 新增 |
| `Bullet` | 〈Bullet 子彈圖〉 | 新增 |
| `Scatter` | 〈Scatter 散布圖〉 | 新增 |
| `Heatmap` | 〈Heatmap 熱圖〉 | 新增 |
| `LineChart` | 〈LineChart 累積分布折線〉 | 新增 |
| `Legend` | 〈Legend 圖例〉 | 新增 |
| `PALETTE` / `capItems` | 〈色票〉 | 新增（色票取用規則與「超過 8 類怎麼辦」） |

### 表單與其他

| 下游匯出 | 上游對應 | 動作 |
| --- | --- | --- |
| `EditableField` | `18-editable-field` | 合併補充（數值三規則／`unit`／極端值） |
| `ChangeSummary` | `19-change-summary` | 合併補充（多筆變更的限高捲動） |
| `useRecordDiff` | 併於 `19-change-summary` | 無差異（上游已用「同一份 `Change[]` 餵三個地方」說明清楚） |
| `NumberInput` | `06-number-input` | 無差異 |
| `Stepper` | `17-stepper` | 合併補充（超出上限的降級表現） |
| **`ErrorBoundary`** | — | **不收，登記備查**：上游已明確排除（屬「應用外殼」職責，沒有視覺／互動決策要編碼）。這個判斷是對的，保留在下游即可 |
| `UI_KIT`（版號常數） | `6-governance/01-versioning` | 合併補充（版號檔放在元件庫內部，見 `conventions/kit-boundary.md` 第四節） |

---

## 落地順序建議

1. **先合併 B 段的補充稿**——風險最低，全部是既有頁的增修，不影響導覽結構
2. **再處理 C 段的治理三頁**——新增頁但不動元件，需要更新 `6-governance/_category_.json` 的排序
3. **最後才是 22-charts**——它牽動最多：新頁 ＋ 改總覽頁 ＋ 元件要進 `packages/react` ＋
   註冊 MDXComponents ＋ 產 registry 條目 ＋ 補活範例。**建議獨立一個 PR。**

## 去領域化

上游有零容忍的禁用詞守衛（`tests/de-domain.test.ts`）。
本交付包的所有示範資料與文案都已改寫成中性商業情境（訂單／客戶／庫存品項／工單／專案），
並以下游同款規則自檢通過。

改寫對照的原則（供日後再萃取時參考）：

| 領域語彙 | 中性等價物 |
| --- | --- |
| 人員清單／部門／職稱／月度金額 | 客戶清單／區域／等級／年度採購額 |
| 在職／暫停／終止 三態 | 啟用／暫停／停用 |
| 「本期已核定，需先取消核定」 | 「此筆已結案，需先解除鎖定」 |
| 各類補貼名目 | 下單管道、標籤 A／B／C 這類中性選項 |
| 期間、期別 | 建立日期、批次編號 |

> **Do**：萃取時**先**把示範資料換成中性情境，再寫規範。
> **Dont**：不要先寫完再回頭替換。示範資料會滲進規則的敘述方式裡
> （「這個欄位通常放…」），換掉名詞之後那些句子會變得沒有道理。
