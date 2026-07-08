# CLAUDE.md — 專案交接指南（新 session 從這裡開始）

台灣合規薪資計算系統（115 年／2026）。React 19 + TypeScript + Vite + Tailwind + shadcn/ui + zustand（localStorage persist），
純前端單機應用，無後端；規格源頭是 `README.md`（Excel 參考實作的設計文件）＋ `docs/appendix/附錄A–C`。

## 快速啟動

```bash
npm install
npm run dev          # http://localhost:5173
npx vitest run       # 全部測試（目前 193 項，必須全綠）
npm run build        # tsc -b && vite build（CI 同款；tsc 增量快取可能漏抓，改用 npx tsc -b --force 驗證最準）
```

本機 Node 23+ 注意：Node 內建實驗性 Web Storage 會以「屬性存在、值 undefined」遮蔽 jsdom 的
localStorage，`tests/setup.ts` 已裝條件式記憶體墊片（CI Node 20 無此屬性、不受影響）——測試炸
storage undefined 時先想到這裡，不要改測試本身。

## 分支與部署慣例

- 開發分支：`claude/salary-calculator-react-shadcn-stxjp7`（所有變更先 commit 到這裡並 push）。
- 上線＝merge 到 `main` push → GitHub Actions `deploy-pages.yml`（跑驗收測試＋build＋Pages 發佈）。
  **merge main 前務必取得使用者同意**（deploy 即正式上線）。線上站：<https://kielchang.github.io/taiwan-hr-salary/>。
- **版號**（發佈流程見 `docs/versioning.md`）：每次發佈到 main＝bump `package.json` `version`（SemVer；功能→minor、修正→patch）＋補 `CHANGELOG.md` 一段。
  tag `vX.Y.Z` 與 GitHub Release 由 `deploy-pages.yml` 的 `release` job **自動建立**（依 package.json 版號、已存在則略過；Release 內容取自 CHANGELOG），一般不用手動打 tag。
  SHA/建置時間由 `vite.config.ts` define 自動注入（CI 用 `GITHUB_SHA`、本地＝`dev`），畫面版號來源＝`src/version.ts`（側邊欄/設定「關於」/列印頁尾共用）。
- CI 曾因 Pages 佇列逾時而 deploy job 失敗（build 綠）— 平台問題，用 rerun_failed_jobs 重跑即可。

## 鐵律（違反會壞驗收或破壞既有決策）

1. **TC-9 不可動**：`src/data/seed.ts` 的 `SEED_*`（8 名員工）是 `tests/acceptance.test.ts` 硬編碼的驗收基準
   （合計 686,417／622,426／773,287）。要改示範資料改 `src/data/demoCompany.ts`（62 人示範公司＝開箱預設）。
   TC-9 保證：`calculatePayroll` **無 `opts.period`** 時 payFactor/勞保按天/leavePolicy 皆不觸發、seed 無 customAllowances/非在職狀態，故破月與津貼改動不影響驗收。
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
9. **元件庫邊界不可耦合 app**（使用者拍板：未來要切成共用套件統一介面風格）：`src/components/{ui,form,charts}`＋
   `NumberInput/Stepper/ErrorBoundary`＋支撐工具（`lib/utils`・`useSort`・`csv`・`forms/diff`・`download`）**只能**依賴設計 token
   與彼此，**禁止** import `@/store`／`@/data`／`@/views`／`@/content`／`@/version`／`@/lib/types`／`@/lib/calc`… 等 app 模組。
   由 `tests/uiKit.test.ts` 守衛（新增元件請加進 barrel `src/components/index.ts`）。元件庫**版號獨立於 app**
   （`src/components/version.ts` `UI_KIT`；改元件→bump＋補 `docs/ui-kit/CHANGELOG.md`）。`HelpHint`/`PrintHeader`/`BracketTables`＝app glue，刻意**不入** barrel。

## 架構地圖

```
src/
├── lib/calc/wage.ts   payFactor（逐日破月：生效日+復職日+給薪比例）/employmentDaysFactor（勞保按天）/
│                       effectiveLeaveRatio（逐案覆寫∥公司政策）/monthlySalaryTotal（含 customAllowances）
├── lib/calc/          薪資計算純函數（§5：級距/保費/加班/稅/補充保費/破月）— 動它前先讀 README
├── lib/validation.ts  V1–V12 驗證＋allocationIssues（V8 非在職未填生效日/復職日<生效日/V9 負實發/V10 累計<當月＝error）
├── lib/reports/       withholding/bracketAdjust/enrollment(加保/退保/停保/復保 4 類)/projectCost/projectTrend(EAC)/annual
├── lib/insights.ts    各分析頁「重點意見」規則
├── store/usePayrollStore.ts  zustand persist；硬鎖定守衛、稽核、scheduledRaises、刪除連鎖；leavePolicy/salaryDefaults 也在這
├── store/selectors.ts buildPayrollRows/isActiveInPeriod(吃 leavePolicy，僅整月無給剔除)/ytdBonusBefore
├── data/seed.ts       TC-9 8 人 fixture（勿動）＋buildDemoData（歷史回填）＋salary/dep/evt/addMonths 工廠
├── data/demoCompany.ts 62 人示範公司（開箱預設；含離職/留停/停職半薪/復職邊界/多月快照/確認/稽核/申報基準）
├── components/ui/     DataTable/ChartCard/Delta/EmptyState/table(zebra/sticky/SortHead)/…
├── components/charts/ 零相依 SVG 圖表（StackedBar/Pareto/Heatmap 含圖例/TrendChart/Bullet…）
├── content/help.tsx   情境式說明內容（HelpHint ℹ 用；鍵：payroll/master/analytics/projects/reports/settings/attendance）
├── version.ts         版本資訊單一來源（vite define 注入版號/SHA/建置時間；側邊欄/設定「關於」/列印頁尾共用）
└── views/
    ├── DashboardView  「本月工作台」＝首頁 /：待辦卡（含停保/復保）＋排程調薪＋深連結（?tab=、?emp=）
    ├── PayrollFlow    每月結算兩步（MonthlyView 輸入異動 → ReviewView 查核確認）
    ├── ReportsHubView /reports：月結報表(ReportsView)＋申報名冊(FilingView)；?tab= 深連結；頂部月份選擇器
    ├── AnalyticsView  月報/規劃試算(沙盒)/年報 兩層分組；RaiseTab 含生效月排程
    ├── ProjectsView   專案之家（主檔+工時分攤+成本/EAC）
    └── MasterDataView(狀態5種＋生效日/復職日/給薪比例＋自訂津貼)/AttendanceView/
        SettingsView(公司分頁含 LeavePolicyCard 非在職給薪比例＋SalaryDefaultsCard 新進預設)/SetupWizard/HelpView/SourcesView
```

**員工生命週期**（使用者拍板）：`EmployeeStatus` 5 種＝在職/離職/留停/停職/暫離。
`leaveDate` 語意＝離職日（離職）或**生效日(起)**（留停/停職/暫離）；`returnDate`＝復職日（空＝尚未復職）；
`leavePaidRatio`＝逐案覆寫給薪比例（空＝採公司 `leavePolicy` 該狀態預設 0/0/0）。破月用 `payFactor`（逐日加權），
勞保費到/離職當月按 `employmentDaysFactor`（在職天數）比例、健保與勞退整月。復職＝補填復職日，之後自動全薪（不必改回在職）。

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
6. **backlog 清尾**：CostTab/DistTab/TrendTab CSV 匯出補齊、AnalyticsView 13 張單圖卡收斂 ChartCard、
   BracketTables（投保級距主檔）遷 DataTable（維持唯讀＋搜尋/CSV）、validation.ts 註記 V3/V5 保留編號、
   tests/setup.ts Node 23+ Web Storage 墊片。
7. **員工生命週期＋固定津貼**（使用者拍板）：
   狀態擴為 5 種（＋停職/暫離），`payFactor` 逐日破月（生效日+復職日+**每狀態可調給薪比例**，公司政策 `leavePolicy` 預設＋逐案 `leavePaidRatio` 覆寫），
   勞保費到/離職當月按在職天數（`employmentDaysFactor`）、健保勞退整月；名冊加**停保/復保**（enrollment 4 類）＋工作台待辦；
   V8 擴充（復職日<生效日 error）；主檔狀態欄（生效日/復職日/給薪比例）；SettingsView 加 LeavePolicyCard；
   `customAllowances` **自訂固定津貼**（計入月薪資總額/級距/加班）＋SalaryDefaultsCard **新進預設帶入**＋MonthlyView/help 動線指引。
8. **系統版號顯示**（使用者拍板，起始 `1.1.0`）：`package.json` 版號＋`GITHUB_SHA`/建置時間由 `vite.config.ts` define 注入 →
   `src/version.ts`（單一來源）→ 側邊欄常駐版號、系統設定「關於」卡、列印頁尾。發佈流程（bump＋CHANGELOG＋tag）見 `docs/versioning.md`。
9. **元件 UX 大改（v1.3–v1.6）**：`EditableField` 唯讀逐欄編輯（點擊才輸入、變更標色 amber、undo/redo 皆先確認舊→新）；
   數字格式化（`lib/forms/diff.ts`：金額 $ 千分位、比率 %、單位、**不四捨五入**顯示、負值帳務括號紅字）；
   radio→分段 `SegGroup`、multiselect→`Chips`（皆收合顯示目前值、點擊展開）；`Tooltip`（hover/鍵盤聚焦/長壓＋邊緣防溢）。
   **v1.6.0 無障礙/跨裝置**：SegGroup=`radiogroup`、Chips=checkbox 群（方向鍵/Space/Esc、選中打勾 ✓、進編輯自動聚焦）；
   觸控目標 `@media(pointer:coarse)` ≥44px（`.tap-target`/`.tap-target-y`）；唯讀欄鉛筆可發現性；鎖定欄可聚焦＋aria；
   `ChangeSummary` 還原先確認；`MasterDataView` 表單 grid 響應式（手機單欄）。**唯讀逐欄編輯目前只套 MasterDataView（範本）**，其餘表單 backlog（見 F3–F7 task）。

最新 commit（開發分支）：見 `git log`（本批＝元件 UX 無障礙/跨裝置 v1.6.0；前批＝提示泡泡/截斷 v1.5.0）。測試 21 檔 211 項全綠（Node 22 驗）。

## 已知可續作（backlog，未做）

- **留停/停職多段歷史**：目前每員單一 `leaveDate`+`returnDate` 區間（同月僅一段），多次留停/復職的歷史未建模（使用者已知的取捨，避免 migration）。若要做需改 leaveRecords 陣列。
- **停保/復保為提醒性質**：名冊列出加退保/停保/復保供人工辦理，系統**不自動改保費**（健保續保自費等依公司規定）。
- 出勤→加班「自動分級回填」（目前僅顯示參考工時，使用者要求不自動回填 — 若要做需先確認規則）。
- 投保級距主檔改「可編輯」（現為刻意唯讀檢視＝設定頁明示文案；要做需使用者確認年度更新流程與稽核）。

## 改動驗證清單（每批必跑）

1. `npx tsc -b --force`（CI 是全新編譯，增量快取會騙人——曾因此炸過一次 CI）。
2. `npx vitest run` 193 全綠；動到路由/首頁要同步改 `tests/clientmount.test.tsx`，
   動到鎖定/驗證要看 `tests/guards.test.ts`，動到示範資料看 `tests/demoCompany.test.ts`，
   動到破月/保費/津貼看 `tests/proration.test.ts`。
3. `npm run build`。
4. 大改後更新 `docs/appendix/附錄C_網站實作架構.md` 的導覽/工作邏輯註記。

## 新 session 開場建議

直接說要做的事即可（本檔會自動載入）。例：
「讀 CLAUDE.md 後續作：⟨任務⟩。遵守鐵律：TC-9 不動、硬鎖定語意、DataTable 標準；
完成後 tsc --force＋vitest 全綠，commit 到 claude/salary-calculator-react-shadcn-stxjp7，
merge main 部署前先問我。」
