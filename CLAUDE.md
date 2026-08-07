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
- **三環境（gh-pages 分支、每環境獨立、子路徑區分）**：main→根（PROD 正式站）、`stage`→`/stage`（STAGE 預覽）、
  開發分支→`/dev`（DEV）。因 `base:"./"`＋HashRouter，同一 build 可掛任一子路徑。畫面右上依 `APP_ENV`
  顯示 STAGE/DEV 徽章（PROD 不顯示）。`deploy-pages.yml`：**推哪個分支就只重建並只更新該環境**
  （peaceiris/actions-gh-pages＋`keep_files`，其餘子目錄不動；main 才跑驗收測試＋打版號）。
  **Pages 來源需設「Deploy from a branch：gh-pages / root」**。
  URL：正式 <https://kielchang.github.io/taiwan-hr-salary/>、預覽 `…/stage/`、開發 `…/dev/`。
  **Storybook 僅 dev 發佈**（`…/dev/storybook/`）：Storybook 是開發/設計工具、非終端使用者面向，且鐵律 10
  已保證元件在 dev 階段驗畢才接畫面，故 stage/main 不發佈（`deploy-pages.yml` 的 build-storybook 步驟
  `if: app_env == 'dev'`；省 build 時間、不對外供應開發工具）。
- 上線＝merge 到 `main` push → `deploy-pages.yml`（跑驗收測試＋build＋Pages 發佈）。
  **merge main 前務必取得使用者同意**（deploy 即正式上線）。
- **版號**（發佈流程見 `docs/versioning.md`）：每次發佈到 main＝bump `package.json` `version`（SemVer；功能→minor、修正→patch）＋補 `CHANGELOG.md` 一段＋**同步快照手冊版本**（`cd manual && npm run docusaurus docs:version <版號>`＋更新 config `lastVersion`/`versions` 標籤；操作示意＝MockFlow 元件排版、隨元件庫自動同步，無截圖需重錄）。
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
3.5. **法定參數/級距＝生效月版本化**（P2 治本，使用者拍板）：`parameterVersions`/`bracketVersions`（`{effectiveFrom,value}[]`，源頭）＋`parameters`/`brackets`（最新版本相容 mirror）。各期以 `resolveSettingVersion(versions, period, DEFAULT)` 取「≤該期的最後一個版本」；**calc 簽章不動、只吃已解析值**（TC-9 直接用 DEFAULT_* 呼叫 calc、不受影響）。消費端一律依 period 解析（selectors hooks／`yearlyWithholding`／`projectCostByPeriod`／逐期重算報表）——改率不回溯污染歷史月。**編輯守衛**：`isSettingsInPlaceLocked`＝就地改「最新版本」若其生效區間含已確認月則擋，導向 SettingsView「新增生效版本」（`addParameterVersion`，生效月須 > 最後已確認月）。**不要**把版本清單推進 calc；**不要**讓 setParameters 就地改被已確認月引用的版本。leavePolicy/salaryDefaults 本輪不版本化（仍走 `isPeriodLocked` 當期鎖）。
4. **比率顯示＝百分比**（使用者拍板）：compa-ratio／市場 compa 顯示 105% 不是 1.05（`ratioPct`）；百分比用 `pctOf`；金額 `ntd`。
   **欄位用色＝「可編輯 vs 唯讀」單一語意**（使用者拍板，2026-07 收斂舊 Excel 三色）：可編輯欄位一律 `.col-input`（＝`.col-assumption` 同款：淡冷底＋`--field-border` 邊框，改一次全站同步於 `index.css`）；唯讀/計算值＝純文字或 `.col-formula` muted。**不要**再用暖橘（輸入）/暖黃（假設）/藍（公式）三分法——那是 Excel 儲存格慣例、對網頁表單語意不成立。暖色琥珀 `--edit` 專屬「已改動未送出」；狀態語意走 `success/warning/info/danger`。改欄位色屬元件庫視覺（鐵律 10）：bump `UI_KIT`＋補 `docs/ui-kit/CHANGELOG.md`。
4.5. **多幣別外幣薪資＝獨立金流**（使用者拍板）：外幣（`SalaryStructure.foreignPay`／`MonthlyEvent.foreignOverride`）與台幣**分開計算、視作獎金**，**刻意不進 `monthlySalaryTotal`**→永不觸動投保級距/勞健保保費；台幣 `grossPay`/`netPay` 不含外幣。由「幣別與匯率維護中心」（SettingsView 分頁：`currencies`/`fxRates`/`fxPolicy`）驅動；`fxPolicy.enabled` 預設關＝全站零外幣 UI 與計算、TC-9 逐位元不變。`calculatePayroll` 無 `opts.fx` 即短路（比照 `opts.period`）。是否計所得稅/二代健保補充保費＝`fxPolicy` 開關（預設關）。發放/調整走 `applyBatchForeign`（族群公司/部門批次）或主檔逐員。分析/報表：外幣一律**獨立欄/序列＋台幣約當**，**不併入**既有台幣核心（成本/獎金比/compa/預算），`buildSnapshot.foreignTwdTotal` 為凍結歷史唯一入口且不進 `totalCost`。
5. **表格一律用 `DataTable`**（`src/components/ui/data-table.tsx`）：欄位設定驅動，內建關鍵字搜尋/**單欄篩選（文字包含·數值範圍）**/
   排序/**十字對準 highlight**/門檻分頁（每頁 5/15/30/50，預設 15）/合計/凍結首欄/空狀態/CSV。圖表卡用 `ChartCard`。
   不要退回手刻 `<Table>`（僅可編輯參數格例外）。
6. **變異顯示用 `<Delta>`**（▲▼＋文字＋色，非純色語意）；空狀態用 `<EmptyState>`；**分頁切換一律用 `<TabPills>`**
   （勿再手刻 `<button>` 分頁列，否則改樣式無法全站同步）；列印靠 `@media print`＋`PrintHeader`。
7. **敏感異動要入稽核**：新 mutation 記得 `pushAudit`（AuditAction 已含 parameter/dependent/declare/allocation/clear）。
   **逐欄編輯類（salary/employee/dependent/event）的更新**須附結構化 `before/after`＋`restoreKind`（見 `AuditEntry`），
   讓「回復」（`restoreAudit`，設定頁稽核表的「回復」鈕）能把記錄還原成變更前值；回復受硬鎖定守衛（已確認期間 no-op）、
   本身另記一筆稽核（`restoredFrom`）。新增/刪除/批次/確認類**不附** before/after ＝不可回復（`auditRestorable` 判定）。
   **基本資料維護＝情境化申請單**（使用者拍板）：MasterDataView 挑情境（`ChangeScenario` 8 種：onboard/terminate/leave/
   reinstate/salary/dependents/withholding/contact）→只填該情境欄位＋必填「異動原因」→`applyChangeTicket` **一律**記一筆帶
   `scenario`/`reason` 的結構化稽核（可回復；onboard 插入不可回復）；計薪情境於已確認月 no-op、contact 免鎖。異動紀錄＝
   MasterDataView「異動紀錄」分頁＝`auditLog.filter(scenario)` 透鏡（回復沿用既有機制）；`AuditRestoreKind` 增 `dependents`
   （整份眷屬名冊回復）。**這是與稽核整合、非平行資料源**——不要另建 ticket slice。
8. 「帶入上月異動」**不帶獎金與代扣稅**（使用者拍板，防誤重發）；累計獎金由 `ytdBonusBefore` 自動帶入。
8.5. **設計上游＝doping-design-book（唯讀鐵律，使用者拍板）**：介面設計語言與操作邏輯的單一真實來源在
   <https://github.com/kielchang/doping-design-book>（另一個 repo）。**本專案不得寫入上游**（環境上 push 也會 403）。
   ⇒ 動介面/元件前先讀 **`docs/design-book/`**：`README.md`（怎麼讀上游＋離線摘要）、**`conformance.md`（符合性台帳：
   每個元件是「遵循／自製／刻意偏離」）**、`proposals/`（給上游的提案）。取得上游：`./scripts/design-book.sh`
   （唯讀 clone 到 repo 外部；`--list` 列章節、`--show <章節>` 直接讀）。**注意**：GitHub Pages 站與 GitHub MCP
   在本環境讀不到（proxy 擋 github.io、MCP scope 僅本 repo），只能走 git clone。
   **新增/改元件的動作**：先查上游有無 → 有則遵循並記台帳；無則自製並記台帳，具通用性者寫提案。
   要改上游一律 **提案 → PR → 上游確認合併 → 才回寫台帳與本地實作**（**未合併不得先行實作**）。
9. **元件庫邊界不可耦合 app**（使用者拍板：未來要切成共用套件統一介面風格）：`src/components/{ui,form,charts}`＋
   `NumberInput/Stepper/ErrorBoundary`＋支撐工具（`lib/utils`・`useSort`・`csv`・`forms/diff`・`download`）**只能**依賴設計 token
   與彼此，**禁止** import `@/store`／`@/data`／`@/views`／`@/content`／`@/version`／`@/lib/types`／`@/lib/calc`… 等 app 模組。
   由 `tests/uiKit.test.ts` 守衛（新增元件請加進 barrel `src/components/index.ts`）。元件庫**版號獨立於 app**
   （`src/components/version.ts` `UI_KIT`；改元件→bump＋補 `docs/ui-kit/CHANGELOG.md`）。`HelpHint`/`PrintHeader`/`BracketTables`＝app glue，刻意**不入** barrel。
10. **Storybook-first 工作流（使用者拍板，鐵律）**：任何介面/元件的視覺或互動更新，**先在 Storybook 改元件＋story、確認，再接到實際畫面**；
    畫面（views）只負責「組裝」已在 Storybook 驗證過的元件，不在 view 裡各自長出新互動。否則元件庫與介面會脫鉤、Storybook 失去意義。
    ⇒ 改/加元件的 SOP：①改 `src/components/*` 元件＋更新該元件 `*.stories.tsx`（涵蓋新狀態）→ ②`build-storybook` 綠、於 Storybook 確認 →
    ③bump `UI_KIT`＋補 `docs/ui-kit/CHANGELOG.md` → ④views 才改用。純 view 內容（非共用元件的互動）不受此限。
11. **資安層不變量（1.12，ADR-040/041/043，合規文件＝docs/compliance/）**：
    ①`lib/security/` 純函數層不 import store/UI；加密 storage adapter「未設密碼＝同步明文 passthrough」**必須維持逐位元零回歸**
    （動 persist 前先跑 clientmount）；已設密碼走 skipHydration＋AppGate 解鎖後 rehydrate，**鎖定中禁止覆寫密文**（雙守衛勿拆）。
    ②稽核＝tamper-evident 雜湊鏈：pushAudit 簽章不變、內部封鏈；clearAuditLog 一律留 tombstone（**不要**改回一鍵清空）；
    UI/文件措辭不得宣稱「防竄改」。③示範資料身分證＝Z 段檢查碼不合法測試值（tests/deidentification.test.ts 守衛，勿塞回擬真值；
    V7 若未來加檢查碼驗證需為 Z 段開豁免）。④密碼提示/規則不得寫入任何匯出載體（ZIP 清單/mailto 內文）。
    ⑤storage key 前綴 `taiwan-hr-salary:v1` 被 ErrorBoundary/AppGate 以字面值引用（uiKit 邊界禁 import store），改前綴要三處同步。
    ⑥CSP 由 vite build 注入（dev 不注入保 HMR）；index.html 新增 inline script 會自動進 sha256 白名單，但先想清楚是否必要。

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
├── store/selectors.ts buildPayrollRows(計薪前注入當期生效「區間補貼」：計入投保→臨時 customAllowance 併月薪資總額、
│                       不計投保→加 event.otherAddition；不改計算核心簽章，TC-9 不變)/isActiveInPeriod/ytdBonusBefore
├── lib/security/      資安純函數層（1.12）：crypto(AES-256-GCM+PBKDF2 600k)/lockMeta(:lock 鍵)/encryptedStorage
│                       (StateStorage adapter＋unlock/enable/disable/changePassword＋鎖定守衛)/backupCrypto(.enc.json)/
│                       sha256(同步純JS)/auditChain(sealEntry/verifyAuditChain，tamper-evident)——見鐵律 11
├── components/security/ AppGate(解鎖閘門，包在 App.tsx 最外層)＋LockScreen（app glue 不入 barrel）
├── data/seed.ts       TC-9 8 人 fixture（勿動；nationalId＝Z 段去識別測試值，ADR-043）＋buildDemoData（歷史回填）＋salary/dep/evt/addMonths 工廠
├── data/demoCompany.ts 62 人示範公司（開箱預設；含離職/留停/停職半薪/復職邊界/多月快照/確認/稽核/申報基準）
├── components/ui/     DataTable/ChartCard/Delta/EmptyState/table(zebra/sticky/SortHead)/…
├── components/charts/ 零相依 SVG 圖表（StackedBar/Pareto/Heatmap 含圖例/TrendChart/Bullet…）
├── content/help.tsx   情境式說明內容（HelpHint ℹ 用；鍵：payroll/master/analytics/projects/reports/settings/attendance；wiki 欄＝獨立手冊站章 slug，外連 MANUAL_URL+slug）
├── version.ts         版本資訊單一來源（vite define 注入版號/SHA/建置時間；側邊欄/設定「關於」/列印頁尾共用）
└── views/
    ├── DashboardView  「本月工作台」＝首頁 /：待辦卡（含停保/復保）＋排程調薪＋深連結（?tab=、?emp=）
    ├── PayrollFlow    每月結算兩步（MonthlyView 輸入異動 → ReviewView 查核確認）
    ├── ReportsHubView /reports：月結報表(ReportsView)＋申報名冊(FilingView)；?tab= 深連結；頂部月份選擇器
    ├── AnalyticsView  月報/規劃試算(沙盒)/年報 兩層分組；RaiseTab 含生效月排程
    ├── ProjectsView   專案之家（主檔+工時分攤+成本/EAC）
    └── MasterDataView(情境化申請單：員工清單/批次薪資/異動紀錄三分頁＋員工檔案面板挑情境→聚焦表單＋原因→applyChangeTicket；
        批次薪資＝BatchSalaryPanel 族群選擇→調整既有%/定額·新增津貼·區間補貼→預覽→即時套用/排程)/AttendanceView/
        SettingsView(公司分頁含 年資計算方式〔seniorityBasis：fixedDate 固定基準日／hireDate 依到職日算至當月，僅影響年資/特休顯示、TC-9 不變〕＋LeavePolicyCard＋SalaryDefaultsCard 新進預設；
        1.12 新增「安全與隱私」分頁＝PasswordLockCard＋AuditIntegrityCard＋DataErasureCard＋隱私說明；備份卡含加密匯出/匯入)/
        SetupWizard(六步：歡迎/隱私與資料保護〔勾選才放行〕/公司設定/薪資結構預設〔伙食津貼預帶 3000→salaryDefaults〕/員工資料/完成)/HelpView/SourcesView
```

**員工生命週期**（使用者拍板）：`EmployeeStatus` 5 種＝在職/離職/留停/停職/暫離。
離職＝`leaveDate`（離職日）。**留停/停職/暫離改用 `leaveRecords: LeaveSegment[]`（B-1 多段歷史，權威來源）**：
每段 `{status, from(生效日), to(復職日, null＝尚未復職), paidRatio(逐案給薪比例, null＝採公司 `leavePolicy` 預設)}`，
支援同員多段（多次留停/復職）。破月用 `payFactor(period, hireDate, terminationDate, segments, policy)`（逐日加權掃描各段），
`leaveSegments(emp)` 為單一入口（無 `leaveRecords` 時回退舊單段欄位 `leaveDate/returnDate/leavePaidRatio`，
舊資料與 TC-9 逐位元不變；store `migrate` v2→v3 已自動回填）。勞保費到/離職當月按 `employmentDaysFactor`（在職天數）比例、
健保與勞退整月。復職＝補填該段復職日，之後自動全薪（不必改回在職）。**主檔基本分頁下方「區間紀錄」逐段編輯**。

側邊欄 IA（App.tsx `NAV_SECTIONS`）：每月作業（工作台/薪資結算/出勤）／規劃與分析／專案／報表與申報／主檔與設定／說明（使用說明/操作手冊〔外連〕/法規依據〔外連手冊附錄 `legal/`，原 SourcesView 已移除〕）。
**操作手冊＝獨立 Docusaurus 站（`manual/`，使用者拍板：通用框架、獨立更新維護）**：8 章 55 節 Markdown（`manual/docs/`）＋
中文搜尋（@easyops-cn/docusaurus-search-local）＋StoryFrame 嵌 Storybook 互動 story（隨手冊發佈 `<env>/manual/storybook`）＋
AppLink 依環境開系統畫面＋MockFlow 逐步操作示意（**零截圖鐵律，使用者拍板**：畫面＝`manual/src/components/screens.tsx` 以元件庫真元件＋placeholder 佔位排版、重點 Spot 高亮，隨元件庫自動同步；守衛禁 FlowPlayer/截圖回歸）＋每頁「🖨 列印此頁」（DocItem/Content swizzle＋@media print，MockFlow 列印時全步驟展開）。**docs versioning 對映系統版號**（預設＝最新快照/正式站版本、`/next/`＝開發中；發佈時快照，見 docs/versioning.md）。**獨立部署**：`deploy-manual.yml` 於 `manual/**`＋`src/components/**`＋`.storybook/**` 變更時建置→gh-pages `<env>/manual`（keep_files；元件變更重佈＝內嵌 storybook 與 UI 掛鉤，守衛 `tests/manualStories.test.ts`）；
`deploy-pages.yml` 已 paths-ignore `manual/**`——改手冊不重佈 app、反之亦然。app 端外連＝`version.ts` `MANUAL_URL`（依 APP_ENV）；
HelpHint `wiki` 欄外連手冊章（slug：quickstart/concepts/monthly/master/reports/analytics/settings/calc，章 slug 於 `_category_.json` link.slug 固定，勿改）。

**功能開關（`src/config/features.ts` `FEATURES`）**（使用者拍板）：讓人事先專注薪資作業驗收，**「出勤打卡」與「專案」
目前全環境隱藏 UI 入口**（`attendance:false`／`projects:false`，純布林、與 APP_ENV 無關）。**只隱藏入口、不刪碼/資料/計算**：
store slices（punches/allocations/projects/attendance）、seed／示範公司資料、`lib/attendance`・`lib/reports/projectCost|projectTrend`
純函數、`AttendanceView`/`ProjectsView`/`ProjectCostTab`/`ProjectMasterCard` 元件全部保留（Storybook 仍可預覽），
整合成熟後把對應 flag 改 `true` 即**一鍵重啟**。已驗證薪資/保費/稅/報表數字零依賴這些資料（`selectors` 零引用）。
gating 點：App 側邊欄+路由（隱藏時 `*` fallback 導回 `/payroll/monthly`）、Dashboard/ReviewView 的 `allocationIssues`
（分攤超額）、ReportsView `ProjectPnL`、MonthlyView `AllocationEditor`＋出勤工時參考、SettingsView「打卡設定」分頁
（標籤「公司與出勤」→「公司」，保留 LeavePolicy/SalaryDefaults）、HelpView 相關 FAQ/說明。
注意：員工主檔「專案別（選填）」自由文字欄與報表「專案別」分組**是獨立的分類維度、非專案功能，仍保留**。

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

- ~~留停/停職多段歷史~~（**已完成，B-1**）：改用 `leaveRecords: LeaveSegment[]`（多段、每段獨立生效日/復職日/給薪比例），
  `leaveSegments()` 單一入口＋舊單段回退＋store migrate v2→v3；主檔「區間紀錄」編輯器逐段增刪。
- **停保/復保為提醒性質**：名冊列出加退保/停保/復保供人工辦理，系統**不自動改保費**（健保續保自費等依公司規定）。
- 出勤→加班「自動分級回填」（目前僅顯示參考工時，使用者要求不自動回填 — 若要做需先確認規則）。
- 投保級距主檔改「可編輯」（現為刻意唯讀檢視＝設定頁明示文案；要做需使用者確認年度更新流程與稽核）。
- **資安 P1（1.13.0，見 docs/compliance/合規08 §3）**：保存期限管理（勞基法 5 年＋到期提醒＋人工清理，ADR-042）、
  資料主體權利工具（單員全量匯出／抹除＋稽核假名化保鏈）、ipify 同意閘（attendance 啟用前必做）、
  閒置自動上鎖、PDF/ZIP 密碼策略升級（@zip.js AES-256）、敏感欄位（note/病假）書寫規範提示。
- **資安 P2（1.14.0）**：docs/compliance/templates 四範本（隱私政策/事故應變/DPIA/教育訓練）＋合規01 主報告定稿複審。
- **PMIS features 補登**：features 資料表伺服端故障（2026-08-08），13 筆清單見合規08 §6 與 CLAUDE.local.md「待補登」。

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

**若任務會動到介面/元件**：先讀 `docs/design-book/`（上游規範與符合性台帳，鐵律 8.5），
需要上游原文時跑 `./scripts/design-book.sh`。
