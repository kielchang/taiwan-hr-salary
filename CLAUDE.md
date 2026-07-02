# CLAUDE.md — 專案交接指南（新 session 從這裡開始）

台灣合規薪資計算系統（115 年／2026）。React 19 + TypeScript + Vite + Tailwind + shadcn/ui + zustand（localStorage persist），
純前端單機應用，無後端；規格源頭是 `README.md`（Excel 參考實作的設計文件）＋ `docs/appendix/附錄A–C`。

## 快速啟動

```bash
npm install
npm run dev          # http://localhost:5173
npx vitest run       # 全部測試（目前 179 項，必須全綠）
npm run build        # tsc -b && vite build（CI 同款；tsc 增量快取可能漏抓，改用 npx tsc -b --force 驗證最準）
```

本機 Node 23+ 注意：Node 內建實驗性 Web Storage 會以「屬性存在、值 undefined」遮蔽 jsdom 的
localStorage，`tests/setup.ts` 已裝條件式記憶體墊片（CI Node 20 無此屬性、不受影響）——測試炸
storage undefined 時先想到這裡，不要改測試本身。

## 分支與部署慣例

- 開發分支：`claude/salary-calculator-react-shadcn-stxjp7`（所有變更先 commit 到這裡並 push）。
- 上線＝merge 到 `main` push → GitHub Actions `deploy-pages.yml`（跑驗收測試＋build＋Pages 發佈）。
  **merge main 前務必取得使用者同意**（deploy 即正式上線）。
- CI 曾因 Pages 佇列逾時而 deploy job 失敗（build 綠）— 平台問題，用 rerun_failed_jobs 重跑即可。

## 鐵律（違反會壞驗收或破壞既有決策）

1. **TC-9 不可動**：`src/data/seed.ts` 的 `SEED_*`（8 名員工）是 `tests/acceptance.test.ts` 硬編碼的驗收基準
   （合計 686,417／622,426／773,287）。要改示範資料改 `src/data/demoCompany.ts`（60 人示範公司＝開箱預設）。
2. **計算層是純函數**：`src/lib/calc/*` 不 import store、不碰 UI；改公式必須先對 README §5 與附錄A 條號。
3. **硬鎖定語意**（使用者拍板）：已確認月份（`confirmations[period]` 存在）＝資料凍結。
   store 守衛（`isPeriodLocked`，`usePayrollStore.ts`）對事件/薪資/眷屬/參數/級距/調薪核定一律 no-op，
   UI 需預攔提示「先取消確認」。**不要**改回「編輯自動解除確認」的舊行為。
   `unconfirmPeriod` 會同步刪該期快照；重新確認時 `ReviewView.doConfirm` 重建。
4. **比率顯示＝百分比**（使用者拍板）：compa-ratio／市場 compa 顯示 105% 不是 1.05（`ratioPct`）；百分比用 `pctOf`；金額 `ntd`。
5. **表格一律用 `DataTable`**（`src/components/ui/data-table.tsx`）：欄位設定驅動，內建搜尋/排序/門檻分頁(>25)/
   合計/凍結首欄/空狀態/CSV。圖表卡用 `ChartCard`。不要退回手刻 `<Table>`（僅可編輯參數格例外）。
6. **變異顯示用 `<Delta>`**（▲▼＋文字＋色，非純色語意）；空狀態用 `<EmptyState>`；列印靠 `@media print`＋`PrintHeader`。
7. **敏感異動要入稽核**：新 mutation 記得 `pushAudit`（AuditAction 已含 parameter/dependent/declare/allocation/clear）。
8. 「帶入上月異動」**不帶獎金與代扣稅**（使用者拍板，防誤重發）；累計獎金由 `ytdBonusBefore` 自動帶入。

## 架構地圖

```
src/
├── lib/calc/          薪資計算純函數（§5：級距/保費/加班/稅/補充保費/破月）— 動它前先讀 README
├── lib/validation.ts  V1–V12 驗證＋allocationIssues（V8 離職未填日/V9 負實發/V10 累計<當月＝error）
├── lib/reports/       withholding/bracketAdjust/enrollment/projectCost/projectTrend(EAC)/annual
├── lib/insights.ts    各分析頁「重點意見」規則
├── store/usePayrollStore.ts  zustand persist；硬鎖定守衛、稽核、scheduledRaises、刪除連鎖都在這
├── store/selectors.ts buildPayrollRows/isActiveInPeriod/ytdBonusBefore
├── data/seed.ts       TC-9 8 人 fixture（勿動）＋buildDemoData（歷史回填）＋salary/dep/evt/addMonths 工廠
├── data/demoCompany.ts 60 人示範公司（開箱預設；含邊界個案/多月快照/確認/稽核/申報基準）
├── components/ui/     DataTable/ChartCard/Delta/EmptyState/table(zebra/sticky/SortHead)/…
├── components/charts/ 零相依 SVG 圖表（StackedBar/Pareto/Heatmap 含圖例/TrendChart/Bullet…）
├── content/help.tsx   情境式說明內容（HelpHint ℹ 用；鍵：payroll/master/analytics/projects/reports/settings/attendance）
└── views/
    ├── DashboardView  「本月工作台」＝首頁 /：六待辦卡＋排程調薪＋深連結（?tab=、?emp=）
    ├── PayrollFlow    每月結算兩步（MonthlyView 輸入異動 → ReviewView 查核確認）
    ├── ReportsHubView /reports：月結報表(ReportsView)＋申報名冊(FilingView)；?tab= 深連結；頂部月份選擇器
    ├── AnalyticsView  月報/規劃試算(沙盒)/年報 兩層分組；RaiseTab 含生效月排程
    ├── ProjectsView   專案之家（主檔+工時分攤+成本/EAC）
    └── MasterDataView/AttendanceView/SettingsView(三分頁)/SetupWizard/HelpView/SourcesView
```

側邊欄 IA（App.tsx `NAV_SECTIONS`）：每月作業（工作台/薪資結算/出勤）／規劃與分析／專案／報表與申報／主檔與設定／說明。

## 本 session 已完成（時間序）

1. **UX 大改版**：側邊欄分區 IA、專案之家、報表與申報中心（actual 單一出口）、例行/試算徽章、情境式 ℹ 說明。
2. **60 人示範公司**為開箱預設（TC-9 8 人保留為測試 fixture）；13 個月快照供趨勢/環比/同比。
3. **報表呈現優化**：格式器統一、sticky/斑馬/凍結首欄、Delta、Heatmap 圖例、@media print、compa 改百分比。
4. **DataTable/ChartCard 通用元件**＋全站表格遷移（搜尋/排序/門檻分頁）。
5. **HR 工作邏輯優化**（UIUX×HR 稽查 41 項發現 → PM 優化書 P0+P1+P2 全做）：
   硬鎖定、V7–V12 驗證、累計獎金自動化、稽核補洞＋刪員工連鎖、本月工作台、
   ?emp=/?tab= 深連結、帶入上月/儲存並下一位/全部帶入、分攤沿用上月、報表月份選擇器、
   調薪生效月排程（scheduledRaises）、出勤工時參考、精靈文案、主檔 ℹ。

6. **backlog 清尾**（本次 session）：CostTab/DistTab/TrendTab CSV 匯出補齊、AnalyticsView 13 張單圖卡
   收斂 ChartCard、BracketTables（投保級距主檔）遷 DataTable（維持唯讀＋搜尋/CSV）、validation.ts 註記
   V3/V5 保留編號、tests/setup.ts Node 23+ Web Storage 墊片。

最新 commit（開發分支）：`cb06cf3`。測試 18 檔 179 項全綠（Node 22/26 皆驗）。

## 已知可續作（backlog，未做）

- 出勤→加班「自動分級回填」（目前僅顯示參考工時，使用者要求不自動回填 — 若要做需先確認規則）。
- 投保級距主檔改「可編輯」（現為刻意唯讀檢視＝設定頁明示文案；要做需使用者確認年度更新流程與稽核）。

## 改動驗證清單（每批必跑）

1. `npx tsc -b --force`（CI 是全新編譯，增量快取會騙人——曾因此炸過一次 CI）。
2. `npx vitest run` 179 全綠；動到路由/首頁要同步改 `tests/clientmount.test.tsx`，
   動到鎖定/驗證要看 `tests/guards.test.ts`，動到示範資料看 `tests/demoCompany.test.ts`。
3. `npm run build`。
4. 大改後更新 `docs/appendix/附錄C_網站實作架構.md` 的導覽/工作邏輯註記。

## 新 session 開場建議

直接說要做的事即可（本檔會自動載入）。例：
「讀 CLAUDE.md 後續作：⟨任務⟩。遵守鐵律：TC-9 不動、硬鎖定語意、DataTable 標準；
完成後 tsc --force＋vitest 全綠，commit 到 claude/salary-calculator-react-shadcn-stxjp7，
merge main 部署前先問我。」
