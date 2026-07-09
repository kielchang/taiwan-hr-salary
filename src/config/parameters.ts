// 參數登錄表（README §4）— 設定檔，法定數值集中於此（P1/P2 單一事實來源）。
// 計算模組（§5）一律引用本檔參數，嚴禁在公式中寫死數字（P2）。
// 年度更新時只改本檔與 brackets.ts，公式無須變動（P1）。
//
// 儲存格對照見附錄 A §A1；逐項法源見來源01／04／05。

export interface Parameters {
  /** 適用年度（顯示用） */
  year: string;

  // —— 最低工資（來源01） ——
  minWageMonthly: number; // 最低工資（月）C4
  minWageHourly: number; // 最低工資（時）C5

  // —— 勞就保（來源01） ——
  laborOrdinaryRate: number; // 勞保普通事故費率 C6
  employmentInsuranceRate: number; // 就業保險費率 C7
  laborEmploymentRate: number; // 勞就保合計費率 C8（＝C6＋C7）
  laborEmployeeShare: number; // 勞就保 勞工負擔比例 C9
  laborEmployerShare: number; // 勞就保 雇主負擔比例 C10

  // —— 職保（來源01；公司別參數） ——
  occupationalRate: number; // 職保行業別費率 C11（全額雇主）

  // —— 健保（來源01） ——
  healthRate: number; // 健保費率 C12
  healthEmployeeShare: number; // 健保 勞工負擔比例 C13
  healthEmployerShare: number; // 健保 雇主負擔比例 C14
  healthAvgDependents: number; // 平均眷口數（雇主負擔用）C15
  healthDependentCap: number; // 眷屬計費上限（口）C16

  // —— 勞退（來源01） ——
  pensionEmployerRate: number; // 勞退雇主提繳率 C17

  // —— 二代健保補充保費（來源05） ——
  supplementaryRate: number; // 補充保費率 C18

  // —— 工時與伙食（來源01／03） ——
  monthlyWorkHours: number; // 月計薪時數 C19
  mealAllowanceExemption: number; // 伙食費免稅額（月）C28

  // —— 所得稅扣繳（來源04） ——
  taxThresholdBase: number; // 查表起扣標準（0 扶養）C21
  taxThresholdPerDependent: number; // 每名扶養之起扣點提高額 C22（估算）
  fixedWithholdingRate: number; // 固定法／獎金扣繳率 5% C23
  withholdingExemptionCap: number; // 單次免扣稅額上限 C24
  nonResidentThreshold: number; // 非居住者全月薪資門檻 C25（＝C4×1.5）
  nonResidentRateLow: number; // 非居住者稅率（≤門檻）C26
  nonResidentRateHigh: number; // 非居住者稅率（＞門檻）C27

  /** 二代健保補充保費單次計費上限（健保法；來源05） */
  supplementaryCap: number;

  /** 年資／特休 計算基準日（公司自訂，來源01）ISO yyyy-mm-dd；於 seniorityBasis="fixedDate" 時作為統一截止日 */
  seniorityBaseDate: string;
  /** 年資／特休計算方式：fixedDate＝固定基準日（預設）；hireDate＝依到職日算實際年資（截至當期月底）。選填，未設＝fixedDate。 */
  seniorityBasis?: "fixedDate" | "hireDate";
}

/** 115 年（2026）法定參數值（來源01／04／05、附錄 A §A1） */
export const DEFAULT_PARAMETERS: Parameters = {
  year: "115年（2026年）",

  minWageMonthly: 29500,
  minWageHourly: 196,

  laborOrdinaryRate: 0.115,
  employmentInsuranceRate: 0.01,
  laborEmploymentRate: 0.125,
  laborEmployeeShare: 0.2,
  laborEmployerShare: 0.7,

  occupationalRate: 0.0021,

  healthRate: 0.0517,
  healthEmployeeShare: 0.3,
  healthEmployerShare: 0.6,
  healthAvgDependents: 0.56,
  healthDependentCap: 3,

  pensionEmployerRate: 0.06,

  supplementaryRate: 0.0211,

  monthlyWorkHours: 240,
  mealAllowanceExemption: 3000,

  taxThresholdBase: 90501,
  taxThresholdPerDependent: 8417,
  fixedWithholdingRate: 0.05,
  withholdingExemptionCap: 2000,
  nonResidentThreshold: 44250,
  nonResidentRateLow: 0.06,
  nonResidentRateHigh: 0.18,

  supplementaryCap: 10000000,

  seniorityBaseDate: "2026-06-01",
  seniorityBasis: "fixedDate",
};
