// 種子資料：Excel 參考實作之 8 名測試員工（README §9 TC-9 全簿勾稽基準）。
// 首次開啟（localStorage 無資料）時載入，使系統開箱即與驗收測試一致。
import type {
  Employee,
  SalaryStructure,
  Dependent,
  MonthlyEvent,
} from "@/lib/types";

export const SEED_PERIOD = "2026-01";

export const SEED_EMPLOYEES: Employee[] = [
  { id: "E001", name: "王小明", department: "資訊部", title: "工程師", hireDate: "2019-03-01", costCenter: "CC-300 研發", project: "PJ-2026A", taxResidency: "居住者", withholdingMethod: "固定5%", exemptionFormReceivedDate: "2026-01-10", voluntaryPensionRate: 0.06, nationalId: "A123456789", email: "ming.wang@example.com" },
  { id: "E002", name: "李美華", department: "行政部", title: "行政專員", hireDate: "2023-07-15", costCenter: "CC-100 管理", project: "", taxResidency: "居住者", withholdingMethod: "依扣繳稅額表", exemptionFormReceivedDate: "2026-01-10", voluntaryPensionRate: 0, nationalId: "B223456781", email: "mei.li@example.com" },
  { id: "E003", name: "張志豪", department: "業務部", title: "業務經理", hireDate: "2016-05-09", costCenter: "CC-200 營運", project: "PJ-2026B", taxResidency: "居住者", withholdingMethod: "依扣繳稅額表", exemptionFormReceivedDate: "2026-01-12", voluntaryPensionRate: 0.03, nationalId: "C123456782", email: "hao.chang@example.com" },
  { id: "E004", name: "陳雅婷", department: "財務部", title: "會計", hireDate: "2021-11-01", costCenter: "CC-100 管理", project: "", taxResidency: "居住者", withholdingMethod: "固定5%", exemptionFormReceivedDate: "2026-01-10", voluntaryPensionRate: 0, nationalId: "D223456783", email: "ya.chen@example.com" },
  { id: "E005", name: "林承翰", department: "資訊部", title: "資深工程師", hireDate: "2020-02-17", costCenter: "CC-300 研發", project: "PJ-2026A", taxResidency: "居住者", withholdingMethod: "依扣繳稅額表", exemptionFormReceivedDate: null, voluntaryPensionRate: 0.06, nationalId: "E123456784", email: "han.lin@example.com" },
  { id: "E006", name: "黃詩涵", department: "人資部", title: "人資專員", hireDate: "2024-09-02", costCenter: "CC-100 管理", project: "", taxResidency: "非居住者", withholdingMethod: "固定5%", exemptionFormReceivedDate: "2026-01-15", voluntaryPensionRate: 0, nationalId: "F223456785", email: "han.huang@example.com" },
  { id: "E007", name: "吳建宏", department: "製造部", title: "作業員", hireDate: "2025-12-01", costCenter: "CC-200 營運", project: "PJ-2026B", taxResidency: "居住者", withholdingMethod: "固定5%", exemptionFormReceivedDate: "2026-01-10", voluntaryPensionRate: 0, note: "眷屬4口，自付以3口計", nationalId: "G123456786", email: "hung.wu@example.com" },
  { id: "E008", name: "蔡佩珊", department: "總經理室", title: "特助", hireDate: "2013-08-01", costCenter: "CC-100 管理", project: "PJ-2026A", taxResidency: "居住者", withholdingMethod: "依扣繳稅額表", exemptionFormReceivedDate: "2026-01-10", voluntaryPensionRate: 0.06, note: "勞/職/退級距均達上限測試", nationalId: "H223456787", email: "pei.tsai@example.com" },
];

function salary(
  employeeId: string,
  v: Partial<Omit<SalaryStructure, "employeeId">>,
): SalaryStructure {
  return {
    employeeId,
    baseSalary: 0,
    managerAllowance: 0,
    dutyAllowance: 0,
    professionalAllowance: 0,
    mealAllowance: 0,
    transportAllowance: 0,
    attendanceBonus: 0,
    otherFixedAllowance: 0,
    ...v,
  };
}

export const SEED_SALARIES: SalaryStructure[] = [
  salary("E001", { baseSalary: 54000, dutyAllowance: 3000, professionalAllowance: 3000, mealAllowance: 3000, attendanceBonus: 2000 }),
  salary("E002", { baseSalary: 31000, mealAllowance: 3000, attendanceBonus: 2000 }),
  salary("E003", { baseSalary: 65000, managerAllowance: 10000, dutyAllowance: 5000, mealAllowance: 3000, transportAllowance: 2000 }),
  salary("E004", { baseSalary: 34000, dutyAllowance: 3000, mealAllowance: 3000, attendanceBonus: 2000 }),
  salary("E005", { baseSalary: 64000, dutyAllowance: 3000, professionalAllowance: 6000, mealAllowance: 3000, attendanceBonus: 2000 }),
  salary("E006", { baseSalary: 28000, mealAllowance: 3000, attendanceBonus: 2000 }),
  salary("E007", { baseSalary: 24500, mealAllowance: 3000, attendanceBonus: 2000 }),
  salary("E008", { baseSalary: 135000, managerAllowance: 15000, dutyAllowance: 5000, mealAllowance: 3000, transportAllowance: 2000 }),
];

function dep(
  id: string,
  employeeId: string,
  name: string,
  relationship: string,
  health: boolean,
  tax: boolean,
): Dependent {
  return {
    id,
    employeeId,
    name,
    relationship,
    birthDate: "",
    nationalId: "",
    enrolledInHealthInsurance: health,
    taxDependent: tax,
  };
}

export const SEED_DEPENDENTS: Dependent[] = [
  // E001：健保眷屬 1／扶養 1
  dep("D001", "E001", "王配偶", "配偶", true, true),
  // E003：健保眷屬 2／扶養 3
  dep("D002", "E003", "張配偶", "配偶", true, true),
  dep("D003", "E003", "張長子", "子女", true, true),
  dep("D004", "E003", "張母", "父母", false, true),
  // E005：健保眷屬 3／扶養 3
  dep("D005", "E005", "林配偶", "配偶", true, true),
  dep("D006", "E005", "林長女", "子女", true, true),
  dep("D007", "E005", "林次女", "子女", true, true),
  // E007：健保眷屬 4（計費以 3 計）／扶養 2
  dep("D008", "E007", "吳配偶", "配偶", true, true),
  dep("D009", "E007", "吳長子", "子女", true, true),
  dep("D010", "E007", "吳父", "父母", true, false),
  dep("D011", "E007", "吳母", "父母", true, false),
  // E008：健保眷屬 1／扶養 1
  dep("D012", "E008", "蔡配偶", "配偶", true, true),
];

function evt(
  employeeId: string,
  v: Partial<Omit<MonthlyEvent, "employeeId" | "period">>,
): MonthlyEvent {
  return {
    employeeId,
    period: SEED_PERIOD,
    overtimeWeekday1: 0,
    overtimeWeekday2: 0,
    overtimeRestday1: 0,
    overtimeRestday2: 0,
    overtimeHoliday: 0,
    personalLeaveHours: 0,
    sickLeaveHours: 0,
    monthlyBonus: 0,
    cumulativeBonus: 0,
    otherAddition: 0,
    otherDeduction: 0,
    withheldTax: null,
    ...v,
  };
}

export const SEED_EVENTS: MonthlyEvent[] = [
  evt("E001", { overtimeWeekday1: 6 }),
  evt("E002", { overtimeWeekday1: 2, overtimeRestday1: 4 }),
  evt("E003", { monthlyBonus: 50000, cumulativeBonus: 50000 }),
  evt("E004", { personalLeaveHours: 4 }),
  evt("E005", { overtimeWeekday1: 8, overtimeWeekday2: 2 }),
  evt("E006", {}),
  evt("E007", { personalLeaveHours: 8, sickLeaveHours: 16 }),
  evt("E008", { monthlyBonus: 100000, cumulativeBonus: 700000, withheldTax: 12000 }),
];
