// 資料模型（README §3）— 型別定義
// 對應 Excel 工作表：員工清單、眷屬名冊、薪資結構、薪資總表（每月變動事件）。

/** 稅務身分（員工主檔） */
export type TaxResidency = "居住者" | "非居住者";

/** 扣繳方式（員工主檔；README §5.9 分流） */
export type WithholdingMethod = "依扣繳稅額表" | "固定5%";

/**
 * 員工主檔（README §3.2）
 * 注意：月薪資總額、投保級距、年資、特休、眷屬統計皆為「衍生值」，
 * 不存於主檔，由計算模組（§5）依薪資結構與眷屬名冊即時推導。
 */
export interface Employee {
  /** 員工編號（主鍵） */
  id: string;
  name: string;
  department: string; // 部門
  title: string; // 職稱
  hireDate: string; // 到職日 ISO yyyy-mm-dd
  costCenter: string; // 成本中心
  project: string; // 專案別
  taxResidency: TaxResidency; // 稅務身分
  withholdingMethod: WithholdingMethod; // 扣繳方式
  exemptionFormReceivedDate: string | null; // 免稅額申報表收件日（空 → V6 警示＋預設固定5%）
  voluntaryPensionRate: number; // 勞退自提率 0~0.06
  nationalId: string; // 身分證字號／居留證號（薪資條加密 PDF 之開啟密碼）
  email: string; // 員工 Email（薪資條 email 通知收件人）
  note?: string;
}

/**
 * 薪資結構（README §3.2、P3 屬性驅動）
 * 台灣常見八項固定工資項目，皆「屬工資＝是」。
 * 伙食津貼掛「免稅上限」屬性（§5.8 免稅 min(伙食, 3000)）。
 */
export interface SalaryStructure {
  employeeId: string;
  baseSalary: number; // 本薪
  managerAllowance: number; // 主管加給
  dutyAllowance: number; // 職務加給
  professionalAllowance: number; // 專業/技術加給
  mealAllowance: number; // 伙食津貼（免稅上限 3,000）
  transportAllowance: number; // 交通津貼（固定）
  attendanceBonus: number; // 全勤獎金
  otherFixedAllowance: number; // 其他固定津貼
}

/** 眷屬名冊（README §3.2、P4 分流眷屬模型） */
export interface Dependent {
  id: string;
  employeeId: string; // 外鍵 → 員工主檔
  name: string;
  relationship: string; // 關係
  birthDate: string; // 出生年月日
  nationalId: string; // 身分證字號
  enrolledInHealthInsurance: boolean; // 依附健保 → 影響保費
  taxDependent: boolean; // 報稅扶養 → 影響扣繳起扣點
}

/**
 * 每月變動事件（README §3.2）— 對應薪資總表當月手動輸入欄。
 * 加班時數五類對應 §5.3；代扣所得稅為人工確認欄（four-eyes，§7）。
 */
export interface MonthlyEvent {
  employeeId: string;
  period: string; // 期間 yyyy-mm
  overtimeWeekday1: number; // 平日前 2 小時（×4/3）
  overtimeWeekday2: number; // 平日第 3–4 小時（×5/3）
  overtimeRestday1: number; // 休息日前 2 小時（×4/3）
  overtimeRestday2: number; // 休息日第 3 小時起（×5/3）
  overtimeHoliday: number; // 假日出勤（×1）
  personalLeaveHours: number; // 事假時數
  sickLeaveHours: number; // 病假時數
  monthlyBonus: number; // 當月獎金
  cumulativeBonus: number; // 年度累計獎金（含本月）
  otherAddition: number; // 其他加項
  otherDeduction: number; // 其他扣款
  withheldTax: number | null; // 代扣所得稅（人工轉填；null＝未填）
}
