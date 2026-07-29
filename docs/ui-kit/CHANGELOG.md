# 元件庫（UI Kit）變更紀錄

本檔記錄**元件庫自己的版本**，與 app 版號（`package.json` / `CHANGELOG.md`）**獨立**。
版號規則見 [README.md](README.md)。版號單一來源＝[`src/components/version.ts`](../../src/components/version.ts)。

## [0.19.0] - 2026-07-28

### 新增（圖表的文字等價：aria-label 摘要＋無障礙資料表）

修正一個 **WCAG 1.1.1（Level A）** 缺口。原本 8 張圖的 `<svg>` 都掛 `role="img"` 但**沒有名稱**——
而 `role="img"` 並非中性標記：它同時使**子樹對輔助技術隱藏**，所以圖內 `<text>` 畫的類別名與數值
螢幕報讀器一個都讀不到。等於「宣告這是一張圖、我會給你文字說明」然後沒給，比不寫 role 更糟。

- **具名**：`BarChart`／`Pareto`／`TrendChart`／`LineChart`／`Scatter` 的 svg 補 `aria-label` 摘要，
  由資料自動生成（例：「趨勢圖，6 個時間點，從 1月 4,800,000 到 6月 5,400,000」）。
- **資料出口**：同上五種圖各附一份 `sr-only` 的 `<table>`（`<caption>`＋`scope="col"/"row"`），
  把原本**只有 hover 拿得到**的精確數值與分段明細補成文字。Pareto 另含佔比與累積佔比欄。
  用表格而非讓 SVG 可逐點瀏覽：SVG 內部焦點與無障礙樹支援在各瀏覽器×報讀器間很不一致，
  `<table>` 的語意則是普世的（報讀器有專門的表格瀏覽指令）。
- **刻意標裝飾性**：`StackedBar` 每列長條與 `Bullet` 改 `aria-hidden`——它們的數值**已在鄰近可見文字**
  （列標籤＋合計／實際＋目標＋差額），再唸一次只是重複。StackedBar 的分段明細改由整體表格提供。
- **`Heatmap` 本來就是真表格**（數值是可見文字、顏色只是輔助），故不加 `SrTable`，改補正表格語意：
  `<caption>`、`scope`、列標頭由 `<td>` 改 `<th scope="row">`（原本報讀器無法把數值對回列）。
- 新增選填 `caption?: string`：給摘要與表格標題用；未給時仍有通用字樣。呼叫端建議補上。
- `LineChart` 新增 `xLabel`／`yLabel`（預設值＝原本的提示文案，**行為不變**），同時供提示與表格使用。
- Storybook「元件/圖表」新增 **`無障礙_文字等價`**：把 sr-only 表格顯形供人工審查。

**尚未涵蓋**：hover 提示仍無鍵盤等價、`onSelect` 鑽取仍只能用滑鼠（WCAG 2.1.1）。
屬第 3 層修法，需先決定鍵盤操作介面（建議讓資料表列兼任操作面），列為 backlog。

## [0.18.0] - 2026-07-28

### 新增（SegGroup／Chips 抽成獨立元件——對齊設計上游）
- 這兩個元件**本來就存在**，但是 `form/EditableField.tsx` 內部的私有函式（無匯出、無 story）。
  上游 [doping-design-book](https://github.com/kielchang/doping-design-book) `@doping/react` 0.1.0
  把它們收為獨立元件，本次比照抽出 → `ui/seg-group.tsx`、`ui/chips.tsx`，並列入 barrel。
- **`SegGroup`**：少量互斥選項的分段選擇（2–5 個、標籤短時取代原生 radio；更多或會動態增減請用 Select）。
  `role="radiogroup"`＋roving tabindex、方向鍵/Space/Enter/Esc、選中同時打勾與填色（不只靠顏色）。
- **`Chips`**：多選標籤片（選項固定且 ≤12、需同時看見已選與未選時取代多選下拉）。
  `role="group"` 內一組 `role="checkbox"`。
- 對齊上游補齊：`className`、`changed` 改為選填（預設 `false`）、`emptyHint` 可覆寫無選項文案、
  `Lock` 圖示補 `aria-hidden`（原本螢幕報讀器會唸出裝飾圖示）。
- `EditableFieldOption` 改為上游 `SegOption` 的型別別名（結構相同，既有匯入不受影響）。
- 行為零變更：元件本體沿用既有實作，僅改封裝。Storybook 新增「元件/選擇」（互動＋已改動＋鎖定＋無選項）。

### 新增（動態時長 token）
- `--duration-{instant,fast,normal,slow}`＝0/150/200/1500ms，對映 Tailwind `duration-*`（additive，
  內建 `duration-150` 等不受影響）。上游 token 層的一部分；`fast` 與 Tailwind 預設同為 150ms，故無視覺變化。

## [0.17.1] - 2026-07-28

### 修正（Placeholder 列印保底）
- `Placeholder` 加掛 `mock-ph` class：瀏覽器列印預設不印背景色（「背景圖形」未勾）時佔位塊會整塊消失——
  消費端（手冊）以此 class 於 `@media print` 補淡邊框保底；搭配 `print-color-adjust: exact` 強制列印底色。

## [0.17.0] - 2026-07-28

### 新增（模擬畫面積木 Mockup：文件「零截圖」操作示意的基礎元件）
- UX 稽核落地（規範見 `docs/ui-kit/mock-screens.md`）：操作手冊的模擬畫面 primitives 自 manual 端**收編入元件庫**，
  納入 Storybook-first 管理——`Placeholder`（佔位塊）/`Spotlight`（聚光）/`MockScreenFrame`（畫面框）/`MockRow`（假列）。
- **聚光視覺改用主色脈動環**（使用者拍板）：與系統內導覽 Coachmark 同一套 `tour-pulse` 視覺語言（含
  `prefers-reduced-motion` 靜態降級）；捨棄原硬編琥珀——琥珀專屬「已改動未送出」語意（鐵律 4）。
- 全部走 tailwind 語意 token（bg-muted/bg-background/primary…），亮暗模式自動同步；`MockScreenFrame`
  設最小寬度，小螢幕由外層容器橫向捲動、不擠壞排版。
- Storybook「元件/模擬畫面」：佔位塊/聚光互動 playground＋假列重點格＋完整組合示例。

## [0.16.0] - 2026-07-15

### 新增（Coachmark 可縮小：騰出空間操作）
- 使用者回報：需要實際操作的導覽步驟（開對話框/切子分頁）中，導覽卡固定浮層擋住底下控制項無法操作。
- **「縮小」**：標題列新增「－」鈕，收成右下角小膠囊（`導引 n/N` ＋展開＋略過），**隱藏暗罩/聚光/卡片** → 整個畫面恢復可操作（唯一擋點是 `pointer-events-auto` 的卡片）。膠囊按「展開」還原。
- 換步一律自動展開，確保每步先看到新說明。純呈現不變（collapsed 為內部 UI 狀態，不 import app）。
- Storybook「元件 / 導引 Coachmark」新增「可縮小」狀態。

## [0.15.0] - 2026-07-10

### 新增（Coachmark 驗收標記：逐步「通過／有問題＋備註」）
- 支援「引導式驗收」：導覽逐步讓使用者標記結果，結束產出可複製的驗收報告（回報層由 TourRunner glue 組裝）。
- **`showVerdict?: boolean`**：開啟後於卡片動作列上方顯示驗收列——「✅ 通過／❌ 有問題」二選一（`role="radiogroup"`），選「有問題」再展開備註輸入。
- **`verdict?: "pass"|"issue"|null`／`onVerdict?`／`note?`／`onNote?`**：純呈現，狀態由外部（TourRunner 依 `audience:"acceptance"`）保存，元件不 import app 模組（維持元件庫邊界）。
- Storybook「元件 / 導引 Coachmark」新增「驗收標記」狀態。

## [0.14.0] - 2026-07-09

### 新增（Coachmark 互動化：脈動聚光＋互動提示＋末步鏈結；TabPills 可錨定分頁）
- 使用者回報導引「只換頁、沒標記該注意哪、該按什麼」。三項互動強化：
- **脈動聚光環**：聚光框改為「挖洞暗罩 + 獨立脈動環」兩層，被圈元素外緣做呼吸式外擴光暈（`.tour-pulse-ring`＋`@keyframes tour-pulse`，於 `index.css`），把視線拉到該注意/該點的控制項；尊重 `prefers-reduced-motion`（降級為靜態粗環）。
- **`actionHint?: ReactNode`**：需使用者實際點圈選處才前進的步驟，於卡片顯示脈動圓點＋提示（如「👆 點上方圈選處即可繼續」）。搭配 TourRunner 的 `advanceOn:"click"`（點到目標即自動前進）。
- **`secondaryAction?: { label, onClick }`**：僅於末步在主鈕左側顯示 outline 次要鈕，用於上手導引「完成 → 接著看下一支」串接（系統總覽 → 每月結算 → 主檔情境）。仍純呈現、跳轉邏輯由 TourRunner glue 傳入。
- **`TabPills`**：`TabPill` 新增選配 `dataTour?`，渲染到該分頁 `<button data-tour>`，讓導引能圈選並 advanceOn 點擊**特定分頁**（如設定頁「幣別與匯率／法定參數／資料與安全」）。向後相容、不傳即無屬性。
- **鍵盤/焦點無障礙**：Coachmark 每步把焦點移入卡片（`tabIndex=-1`＋`aria-live="polite"` 讓報讀者唸出步驟）；卡片聚焦時 `←/→` 換步、`Esc` 略過、`Enter` 下一步（只在焦點在卡片本體、非內部按鈕時，避免重複觸發）；卡片顯示 `focus-visible` 外框與鍵盤提示「← → 換步 · Esc 略過」。
- **`warning?: ReactNode`**：前置條件未滿足時的紅字提醒（如當期已確認、計薪情境被鎖）。搭配 TourRunner 讀 store 狀態注入。
- Storybook「元件 / 導引 Coachmark」新增「互動待點」「狀態警示」「末步鏈結下一支」狀態。

## [0.13.0] - 2026-07-09

### 新增（Coachmark 導引聚光框）
- **`Coachmark`**（`src/components/ui/coachmark.tsx`）：教學/驗收導引用的聚光原語——暗化畫面＋圈住目標元素（box-shadow 挖洞、洞內可穿透點擊，導引不代填）＋邊緣感知彈出框（標題／說明／第 n·N 步／上一步·下一步·略過）。純呈現：目標矩形/內容/步進狀態全由外部（TourRunner glue）傳入，不 import store/router/content（鐵律 9）。`targetRect=null` ＝置中歡迎卡。經 portal 掛 body。
- Storybook「元件 / 導引 Coachmark」：錨定元素（3 步示範）＋置中歡迎卡。

## [0.12.0] - 2026-07-09

### 變更（欄位用色：Excel 三色 → 「可編輯 vs 唯讀」單一語意）
- 使用者回報輸入欄配色**看不懂、不夠直覺**。根因＝把 Excel 儲存格慣例（附錄B §B3.7：橘輸入／黃假設／藍公式）硬套到網頁表單：三個近乎同色的暖色淡底（橘 h33／黃 h55／琥珀 h48）互相難分、「輸入 vs 公司自訂假設」對使用者是同一件事（都要填）、公式藍從未被使用（死碼）。
- **一次改中央 `index.css` token，全站 66 個呼叫點零改動**：`--col-input` 與 `--col-assumption` 重定義為**同一款**「可編輯欄位」長相＝**極淡冷底（#f5f9ff／深色 #222935）＋清楚邊框 `--field-border`**，刻意與暖色狀態語意（success/warning/danger）及琥珀「已變更」`--edit` 區隔；`--col-formula` 併為唯讀/計算 muted 底。移除暖橘/暖黃 → **琥珀成為唯一暖色訊號＝「已變更未送出」**，語意更清楚。深淺色各一份、文字對比實測 ≥4.5:1（可編輯淺 16.9:1／深 12.2:1）。
- `.col-input`/`.col-assumption` 改用 `border-color: hsl(var(--field-border))`（未分層規則，優先於 utility `border-input`）——刻意不動 focus ring 的 `box-shadow`，避免遮蔽鍵盤聚焦外框。
- `NumberInput` 註解更新（不再提「橘色＝輸入」）；補齊散在 views 的純 `<Input>`（`BatchSalaryPanel` 生效月份、`MasterDataView` 異動原因）加上 `col-input`，使全站可編輯欄位同一長相。
- Storybook「設計 Tokens」新增「欄位用色」型錄（可編輯／已變更／唯讀三態並列）；`HelpView` 畫面慣例圖例改寫為單一慣例。

## [0.11.1] - 2026-07-09

### 修正（DataTable 十字對準破壞凍結首欄／黏性表頭）
- 十字對準 highlight 原以 `background-color`（`bg-primary/[0.06]`／`bg-primary/20`）上色，會**覆蓋**凍結首欄與黏性表頭儲存格的 `bg-background`，使被選到的黏性儲存格變半透明、露出捲動到後面的欄位（表現為「首欄凍結失效」——水平捲動時凍結首欄可看到後方資料透出）。
- 改用 `background-image`（`bg-gradient-to-r from-primary/… to-primary/…`）：色塊疊在儲存格既有背景色之上、不覆蓋 `background-color`，故凍結/黏性儲存格維持不透明。一般（非黏性）儲存格視覺不變。全站表格同步修正。

## [0.11.0] - 2026-07-08

### 新增（Callout 狀態提示框）
- **`Callout`**（`src/components/ui/callout.tsx`）：統一的良好/警示/提醒/危險提示框（圖示＋可選標籤＋標題＋內文），走語意 token（`success`/`warning`/`info`/`danger`）。取代各畫面（`AnalyticsView`／`AttendanceView`／`SettingsView`／`FilingView`…）各自手刻、逐字重複的 `border-*-200 bg-*-50 text-*-900` 色塊——這是階段 5「views 硬編色換 token」批次遷移的第一步：先立元件、Storybook 驗證，再逐檔遷移。
- Storybook「元件 / 基礎」新增「狀態提示框 Callout」＋互動 Playground。

### 變更（階段 5 完成：views 硬編色全面換 token）
- 稽查 103 處硬編調色盤色跨 15 個 `src/views/*.tsx`＋`App.tsx`＋`BracketTableCards.tsx`，逐檔遷移完畢（`PrintHeader.tsx` 本就乾淨）：
  - 符合 icon＋標籤＋標題＋內文形狀者改用 `Callout`（如 `AnalyticsView` 的 `InsightList`）。
  - 單純狀態色塊/行內強調文字（無法套 `Callout` 固定形狀者，如帶操作按鈕的橫幅）直接改語意 token 類別（`border-success/30 bg-success/10 text-success` 等）。
  - 表格「已變更列」改用既有 `bg-edit-bg`（`FilingView`）；表單輸入欄改用 `.col-input`（`SettingsView`）；純檢視用日期篩選器移除誤用的輸入欄底色（`AttendanceView`）。
  - 新增 `col-input`／`col-formula`／`col-assumption` 三組 Tailwind 色彩別名（`tailwind.config.js`，對映既有 `--col-*` token），讓 `HelpView` 的圖例色塊可直接用 `bg-col-input` 而非重複硬編。
- 全數以 Storybook 深色模式截圖（`AnalyticsView` 為代表）驗證：視覺與遷移前一致、深色模式下不再出現「淺色塊卡在深色背景」的問題。

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
