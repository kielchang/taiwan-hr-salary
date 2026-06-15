# 附錄 C｜網站實作架構（React + shadcn）

> 本附錄供維護 `src/` 網站實作的人：說明這套 React + shadcn 薪資計算系統**如何對應
> [README](../../README.md) 規格**、**架構分層**、**技術選型**與**驗收方式**。
> 設計原則同 README §2；計算公式同 §5、捨入同 §6、驗收同 §9。
> Excel 參考實作的對照見 [附錄A](附錄A_Excel公式對照.md)／[附錄B](附錄B_Excel設計說明.md)；本實作與 Excel 為同一規格的兩種落地。

---

## C1. 設計理念（架構師規劃）

依 README「後續網站系統開發之檔案分置原則」：

| 規格要求（README） | 本實作落地 |
|---|---|
| 計算模組依 §5 **純函數**實作 | `src/lib/calc/*`：每個小節一檔，全為無副作用純函數 |
| 法定數值**外置為設定檔（§4）**，不寫死於程式（P1/P2） | `src/config/parameters.ts`、`src/config/brackets.ts`；計算函數一律以參數為引數傳入 |
| 以 §9 驗收案例為**基準測試集** | `tests/acceptance.test.ts`：TC-1～TC-9 共 17 項，`npm test` 全綠 |
| §8 不變量納入**驗證層** | `src/lib/validation.ts`：V1／V2／V4／V6（V3 於彙總頁即時勾稽） |
| local storage 記錄、在地操作 | `src/store/usePayrollStore.ts`：zustand persist middleware → 瀏覽器 localStorage |

**與 Excel 一致性的關鍵決策**：計算函數的乘除**運算順序逐字對齊附錄A 的儲存格公式**。
因 JavaScript 與 Excel 同為 IEEE 754 雙精度浮點，順序一致即中間值位元等價、捨入結果相同
（例：勞保雇主 `45800×0.125×0.7 = 4007.4999… → 4007`，非 4008）。捨入函數 `round()`
採「四捨五入、遠離零」對齊 Excel `ROUND`（§6）。

---

## C2. 架構分層（對齊附錄B §B2 的 Excel 分層）

```
src/
├── config/                  參數層（年度維護，P1/P2 單一來源）
│   ├── parameters.ts        §4 參數登錄表（115 年值）
│   └── brackets.ts          四大投保分級表 + 特休對照表
├── lib/
│   ├── types.ts             §3 資料模型型別
│   ├── rounding.ts          §6 捨入策略（對齊 Excel ROUND）
│   ├── validation.ts        §8 合規檢核（驗證層）
│   └── calc/                §5 計算模組（純函數）
│       ├── brackets.ts      §5.1 投保級距查表
│       ├── seniority.ts     §5.2 年資與特休
│       ├── wage.ts          §5.0 基底量、§5.3 加班費、§5.4 請假扣款
│       ├── dependents.ts    §3.2 眷屬統計（P4）
│       ├── insurance.ts     §5.6 四險保費
│       ├── supplementary.ts §5.7 二代健保補充保費
│       ├── tax.ts           §5.8 應稅薪資、§5.9 扣繳分流
│       └── payroll.ts       §5.5/§5.10 編排：單人完整結算
│   ├── attendance.ts        出勤打卡＋彈性上下班（純函數；額外模組）
│   ├── analytics.ts         薪酬分析與試算（純函數；額外模組）
│   ├── insights.ts          口語化意見回饋引擎（數據→白話結論＋建議；純函數）
│   ├── payslipPdf.ts        薪資條加密 PDF（身分證為開啟密碼）／reportPdf.ts 多頁月報
│   └── payslipEmail.ts      薪資條 mailto 通知草稿
├── store/
│   ├── usePayrollStore.ts   全域狀態 + localStorage 持久化
│   └── selectors.ts         衍生計算（store → 結算結果與彙總）
├── components/ui/           shadcn 元件（button/card/tabs/table/dialog/select…）
├── components/charts/       零相依 SVG 圖表（薪酬分析用）
├── views/                   依 HR 工作流程組織的操作頁（見 C3）；HashRouter 路由
└── data/seed.ts             8 名測試員工（TC-9 基準），設定精靈可載入
tests/*.test.ts(x)           §9 驗收＋analytics/attendance/payslip 純函數＋路由掛載（白屏防護）
```

> 路由採 **react-router-dom HashRouter**（GitHub Pages 子路徑深連結/重新整理皆可）；
> jspdf／html2canvas／jszip 以動態 import 切為獨立 chunk、圖表為零相依 SVG，不影響主包。
> 額外模組（出勤打卡、薪酬分析、薪資條 PDF/Email）為核心薪資管線之外的延伸，**只讀薪資、不影響結算**。

**資料流**（同附錄B §B2）：

```
config（參數/級距） ──► store（主檔：員工·眷屬·薪資結構·每月事件·確認狀態）
        │                        │
        └────────► calc 純函數 ◄──┘  ──► selectors ──► views（結算/查核/報表）
                       ▲
                   validation（V1/V2/V4/V6）
```

---

## C3. 資訊架構（HR 工作流程導向）

頁面不再 1:1 對應 Excel 工作表，改依 HR 每月作業流程組織；計算層完全不變，
僅 view 層重新分組。系統內文案使用 HR 語言，**不出現規格條號、儲存格位置或任何
原始碼／文件路徑**（使用者預設只操作本系統；本附錄僅供維護者對照）。

| 導覽區 | 頁面（views/） | 涵蓋的規格功能 |
|---|---|---|
| 首次開啟 | `SetupWizard` 初始設定引導 | 選擇範例/空白起點 → 公司自訂參數（職保費率、年資基準日）→ 快速建立員工 → 每月三步驟導引；完成旗標存於 store（`setupCompleted`） |
| 系統 | `SettingsView` 系統設定 | §4 參數登錄表（分「公司專屬」黃色與「法定值」分組、附年度更新提醒）＋四張級距表唯讀檢視＋資料管理＋重跑精靈 |
| 資料維護 | `MasterDataView` 基本資料 | 員工主檔＋薪資結構（八項目、即時 V1 檢核與投保級距預覽）＋眷屬雙旗標——以「人」為單位在同一視窗的三個分頁維護 |
| 每月作業① | `MonthlyView` 薪資結算 | 預設自動帶入固定薪資（「無異動」即不必操作）；逐人開窗編輯加班/請假/獎金/其他/代扣稅，含即時試算、46 小時加班提醒、稅額建議一鍵帶入、查表分支黃色指引（§7 控制點） |
| 每月作業② | `ReviewView` 結算查核 | 試算總覽（摘要卡＋全員明細）＋統計查核（§8 檢核以 HR 語言呈現＋V3 勾稽＋公司補充保費）＋獎金試算（§5.7 差分式＋獎金 5%）＋「確認本月結算」（four-eyes；資料再異動即自動解除確認） |
| 每月作業③ | `ReportsView` 報表與薪資條 | 三維度匯總報表＋本月代扣所得稅清單（建議值/已填值分離、可帶入）＋逐人薪資條（§23）；薪資條可列印、產身分證加密 PDF、mailto 通知草稿、批次 ZIP |
| 薪酬分析 | `AnalyticsView` 薪酬分析（額外模組） | 成本結構／分布與公平（CV·Gini·Lorenz·百分位）／級距與 compa-ratio／獎金·分紅試算／年度·季度調薪試算／指標說明（用途＋怎麼看，非公式）；各分頁最上方以 `src/lib/insights.ts` 純函數產生**白話「重點意見」**（good/info/warn＋結論＋建議＋佐證）；零相依 SVG 圖表、CSV 與多頁 PDF 月報；**只讀薪資、試算不寫回** |
| 出勤打卡 | `AttendanceView` 出勤打卡（額外模組） | GPS 軟性圍欄＋選用 IP 限制的上下班打卡、彈性上下班每日彙整（遲到/工時不足/缺卡）、CSV 匯出；前端定位/IP 僅供輔助稽核、非強制 |
| 說明 | `HelpView` 使用說明／`SourcesView` 法規與費率依據 | 純操作說明＋FAQ＋薪酬分析指引；法源出處卡片（法條連結指向全國法規資料庫條文＋主管機關），即來源01–05 的使用者版 |

顏色語意沿用附錄B §B3.7：橘＝輸入欄（`.col-input`）、黃＝公司自訂（`.col-assumption`）、其餘為自動計算。

---

## C4. 控制點與 four-eyes（README §5/§7）

- **建議值與結算值分離**：系統於結算編輯視窗與「報表→所得稅扣繳」顯示「建議金額」；
  實際代扣為獨立輸入值，須由人按「帶入」或手動填寫。查表分支（居住者・依扣繳稅額表且達
  起扣點）不給數字、只給指引（P6），並在結算清單以黃色提醒未填者，阻擋「確認本月結算」。
- **月結確認（four-eyes 強化）**：查核頁的「確認本月結算」留下確認時間戳；其後任何該月
  資料異動會自動解除確認，強制重新查核。
- **估算標示（P6）**：應稅薪資估算、查表起扣點估算、公司補充保費概算，於頁面以文字標註。

---

## C5. 開發與驗收

```bash
npm install      # 安裝相依
npm run dev      # 本機開發伺服器
npm test         # 執行 §9 驗收測試（TC-1～TC-9）
npm run build    # 型別檢查 + 生產建置
npm run preview  # 預覽生產建置
```

**驗收基準（README §9）**：`npm test` 必須全綠。重點案例：
TC-1 觸頂分流、TC-2 眷屬上限＋健保自付 1,832、TC-3 加班費 2,167、TC-4 補充保費 312／獎金稅 8,000、
TC-9 全簿應發 686,417／實發 622,426／雇主總成本 773,287 且三維度分類小計皆相等（V3）。

**年度更新（同附錄B §B4）**：只改 `src/config/parameters.ts` 與 `brackets.ts`，計算與測試公式不動；
更新後 §9 期望值需依新參數重算（⚠ 116 年勞就保合計費率升至 13%）。

---

## C6. 已知限制

1. **localStorage 範圍**：資料存於使用者瀏覽器，清除瀏覽器資料即遺失；正式環境建議改接後端。
2. **V4 加班上限**：本實作已納入驗證層（README §8 標註「新實作建議納入」），為提醒（warning）非強制。
3. **查表法稅額**：官方稅額表為非閉式對照，維持人工控制點，系統不偽裝全自動。
4. **與繳款單 ±1 元**：官方分擔金額表捨入時點不可考，以繳款單為對帳基準（README §6）。
