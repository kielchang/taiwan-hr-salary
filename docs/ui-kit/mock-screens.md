# 模擬畫面（Mock Screens）UX 規範——手冊「零截圖」操作示意作者指南

> UX 稽核（2026-07，UI Designer × UX Architect）產出；聚光視覺經使用者拍板＝主色脈動環。
> 適用範圍：操作手冊（`manual/`）內所有 `<MockFlow>`／`<MockScreen>` 畫面；
> 積木元件本體在 `src/components/ui/mockup.tsx`（UI Kit 0.17.0 起，Storybook「元件/模擬畫面」）。

## 1. 設計原則（零截圖鐵律的執行細則）

1. **重點＝真元件，其餘＝留白**：一張畫面只講一件事。要讀者看的控制項用**元件庫真元件**
   （Button/Badge/Callout/NumberInput/EditableField/TabPills…）並包 `<Spotlight>`；
   其餘版面一律 `<Placeholder>` 佔位（可帶淡字標籤說明那是什麼），**不得**手繪或另造樣式。
2. **一畫面一聚光**：每張步驟畫面最多一個主要 `<Spotlight>`（次要資訊用 Badge/Callout 呈現）。
   聚光太多＝沒有重點。
3. **聚光視覺＝tour-pulse 主色脈動環**：與系統內導覽（Coachmark）同一套「看這裡」語言，
   含 `prefers-reduced-motion` 靜態降級。**琥珀色專屬「已改動未送出」語意（鐵律 4），禁止用於聚光。**
4. **假控制項也要用真元件表達**：開關用 `EditableField kind="checkbox"`、單選用 `kind="radio"`、
   下拉可用帶「▾」標籤的 Placeholder——不自創按鈕樣式假裝是開關。
5. **數字要合理**：畫面中的金額/人數取自示範公司的真實量級（例：月薪 45,800、實發 217,511），
   不要放明顯瞎編的數字——讀者會拿畫面對照真系統。

## 2. token 與樣式規則

- 模擬畫面**內部**（`MockScreenFrame` 之內）：一律 tailwind 語意 token
  （`bg-muted`/`bg-background`/`text-muted-foreground`/`border-border`/`text-[13px]`…），
  **禁止**硬編色碼與 `--ifm-*` 變數——亮/暗模式才會自動同步。
- 播放器**外框**（figure/標頭/字幕列）＝ Docusaurus 版面，可用 `--ifm-*` 變數（隨站台主題走）。
- 尺寸類數值（Placeholder 的 w/h、minHeight）保留 inline style——它們是版面數據不是設計 token。

## 3. 不同模式的顯示策略（矩陣）

| 模式 | 策略 | 落點 |
|---|---|---|
| 亮色/深色 | 全走語意 token；kit.css 對映 `[data-theme="dark"]` | `mockup.tsx`＋`manual/src/css/kit.css` |
| 列印/匯出 PDF | 全步驟展開＋各步字幕；控制列/計數/展開鈕隱藏；StoryFrame 換替代說明框。**背景色跟隨當下主題**（深色模式印深色）：`@media print` 對全元素 `print-color-adjust: exact`——底色是內容不是裝飾，即使瀏覽器未勾「背景圖形」也照印；佔位塊另補列印邊框保底（`.mock-ph`）。**分頁規則**：段落/清單項/元件卡（figure）/提示框/表格不跨頁截斷（`break-inside: avoid`）、標題不孤懸頁底（`break-after: avoid`）、超長段落防孤行（orphans/widows 3）；整卡超過一頁時退回逐步分頁 | `manual/src/css/custom.css` `@media print` |
| 輪播（預設） | 自動輪播 4.2s、hover 暫停；控制列＝字幕獨立一行＋下排「上一步／圓點／下一步」**文字按鈕**（桌機 36px 高、觸控由 `.tap-target` 撐到 44px；圓點 28px 命中區）——小箭頭難點擊，勿退回純箭頭 | `MockFlow`＋`custom.css` `.mockflow-nav`/`.mockflow-dot` |
| 展開全部 | 標頭切換鈕；展開＝全步驟＋字幕、停輪播（與列印同樣式） | `.mockflow-expanded` |
| 減少動態偏好 | `prefers-reduced-motion` → 預設展開、不輪播；聚光脈動降級靜態環 | `MockFlow` effect＋`.tour-pulse-ring` 降級 |
| 小螢幕 | 步驟容器 `overflow-x:auto`＋畫面框 `min-w-[460px]`：橫向捲動、不擠壞排版 | `custom.css`＋`MockScreenFrame` |
| Storybook | primitives 互動 playground＋組合示例；深色以 Storybook 主題背景預覽 | `mockup.stories.tsx` |

## 4. 字幕與文案格式

- 流程字幕：`①`/`②`/`③` 開頭＋一句「做什麼」；最後一步盡量寫「**完成後你會看到：…**」。
- 單格（MockScreen）：`title`＝一句話的畫面主旨；`caption`＝一句補充（位置或後果）。
- 每條流程/畫面**必配 `to`**（直達系統作業的入口連結）——畫面看得到就要進得去。

## 5. 新增/修改流程（SOP，對齊鐵律 10 Storybook-first）

1. 動到**積木**（Placeholder/Spotlight/MockScreenFrame/MockRow）：改 `src/components/ui/mockup.tsx`
   ＋更新 `mockup.stories.tsx` → `build-storybook` 綠、Storybook 目視 → bump `UI_KIT`＋補
   `docs/ui-kit/CHANGELOG.md` → 手冊自動跟上（同一份元件庫；`deploy-manual.yml` 會因
   `src/components/**` 變更重佈手冊）。
2. 只動**內容排版**（某條流程的步驟畫面）：改 `manual/src/components/screens.tsx` 的 `S.*`／
   `MOCK_FLOWS`／`MOCK_SCREENS`（本檔不屬 UI Kit，不 bump 版號），文件內以
   `<MockFlow name>`／`<MockScreen name>` 引用。
3. 守衛：`tests/manualStories.test.ts`——文件引用的 name 必須存在於註冊表、禁截圖素材回歸；
   `tests/uiKit.test.ts`——mockup 不得 import app 模組。
4. 驗收：`cd manual && npm run build` → 亮/暗兩主題目視 → 「🖨 列印此頁」預覽（全展開）→
   窄視窗（≈390px）確認橫向捲動。
