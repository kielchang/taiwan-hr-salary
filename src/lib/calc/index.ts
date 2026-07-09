// ─────────────────────────────────────────────────────────────────────────
// 計算模組（README §5）— 純函數彙整出口 ＋ 設計原理總覽
//
// 這一層是整個系統的「正確性核心」：把台灣勞健保/勞退/所得稅/加班/請假/破月的
// 法規，翻譯成可測試、可對條號的純函數。閱讀順序建議先讀本檔，再依 §5 管線往下看。
//
// ── 1. 純函數與分層（鐵律）
//   calc/* 一律「輸入資料 → 輸出資料」，**不** import store / UI / data／不碰副作用。
//   年度費率與級距不是寫死在公式裡，而是由呼叫端**注入**：`Parameters`（@/config/parameters）
//   與 `InsuranceBrackets`（@/config/brackets）。好處：換年度＝換 config、公式不動；
//   可單元測試對法規；可用歷史參數重算任一過去月份。
//
// ── 2. §5 計算管線（資料流）
//   monthlySalaryTotal（§5.0 月薪資總額，工資基礎）
//     → lookupInsuredAmounts（§5.1 四險各自查投保級距）
//     → dependentStats（§3.2 眷屬：健保/報稅/計費眷口）
//     → insurancePremiums（§5.6 四險保費，自付＋雇主）
//        overtimePay（§5.3 加班）・leaveDeduction（§5.4 請假）
//        personalSupplementary（§5.7 二代健保補充保費，累計制）
//        taxableSalary / withholdingSuggestion（§5.8–5.9 稅）
//     → calculatePayroll（§5.5/§5.10 編排：grossPay → netPay → employerTotalCost）
//
// ── 3. 捨入紀律（改公式前必讀）
//   兩種策略刻意並存，對齊 Excel 參考實作與官方繳款單：
//     (a) 逐項先捨入：四險各口先 round；健保**先 round 單口金額、再乘 (1＋計費眷口)**
//         （順序顛倒會與健保署分擔表系統性偏差，見 insurance.ts）。
//     (b) 加總後捨入一次：加班費各倍率段（4/3、5/3）保持分數不捨入、加總後才 round。
//   乘法順序與 Excel 公式逐字一致 → IEEE-754 中間值位元等價 → 捨入與繳款單相同。
//   統一經 `@/lib/rounding` 的 `round`，不要在各處自行 Math.round。
//
// ── 4. four-eyes：建議值與結算值分離（§7）
//   稅額只產出「建議（auto 金額 / 查表提示）」；**實際代扣＝人工轉填的 event.withheldTax**
//   （未填＝0）。系統不自動把估算稅額寫進實發，避免自動誤扣；估算值僅供對帳參考。
//
// ── 5. 破月（proration）＝雙因子，且預設不啟用
//   固定薪資用 `payFactor`（逐日加權：到職前/離職後 0、請假區間 [生效日,復職日) 按給薪比例、
//   其餘 1）；勞保費另用 `employmentDaysFactor`（只看契約存續天數，請假仍在保）；
//   健保與勞退維持整月。**只有呼叫端傳 opts.period 才啟用**；全月在職 factor＝1。
//
// ── 6. TC-9 不變量（驗收基準，勿破壞）
//   `calculatePayroll` 不傳 opts.period 時 factor 恆為 1、破月/保費比例分支不觸發，
//   結果與導入破月前**逐位元相同**。acceptance.test 的 8 人 fixture 合計因此穩定；
//   改動破月/津貼邏輯時務必維持此短路（見 CLAUDE.md 鐵律 1）。
//
// ── 7. 估算標示（P6）
//   應稅薪資、估算起扣點、公司補充保費等標為「估」：供畫面概算與對帳，正式申報以官方
//   稅額表／扣繳憑單薪資總額為準。
// ─────────────────────────────────────────────────────────────────────────
export * from "./brackets";
export * from "./seniority";
export * from "./wage";
export * from "./dependents";
export * from "./insurance";
export * from "./supplementary";
export * from "./tax";
export * from "./payroll";
export * from "./batchSalary";
