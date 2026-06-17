// 種子資料：Excel 參考實作之 8 名測試員工（README §9 TC-9 全簿勾稽基準）。
// 首次開啟（localStorage 無資料）時載入，使系統開箱即與驗收測試一致。
import type {
  Employee,
  SalaryStructure,
  Dependent,
  MonthlyEvent,
  PayrollSnapshot,
  Project,
  Allocation,
} from "@/lib/types";
import { calculatePayroll } from "@/lib/calc";
import { buildSnapshot } from "@/lib/analytics";
import type { Parameters } from "@/config/parameters";
import type { InsuranceBrackets } from "@/config/brackets";

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

export function salary(
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

export function dep(
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

export function evt(
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

/* ───────────── 專案主檔與工時分攤（示範） ───────────── */

export const SEED_PROJECTS: Project[] = [
  { id: "P-A", code: "PJ-2026A", name: "2026 平台改版專案", manager: "蔡佩珊", client: "內部", budget: 6000000, startDate: "2026-01-01", endDate: "2026-12-31", status: "進行中" },
  { id: "P-B", code: "PJ-2026B", name: "2026 客戶導入專案", manager: "張志豪", client: "ACME", budget: 3600000, startDate: "2026-01-01", endDate: "2026-09-30", status: "進行中" },
];

// 對應 SEED_PERIOD（2026-01）：示範跨專案與未分攤殘量
export const SEED_ALLOCATIONS: Allocation[] = [
  { employeeId: "E001", period: SEED_PERIOD, mode: "hours", lines: [{ projectId: "P-A", value: 144 }] }, // 60%，殘 40% 未分攤
  { employeeId: "E005", period: SEED_PERIOD, mode: "hours", lines: [{ projectId: "P-A", value: 120 }, { projectId: "P-B", value: 120 }] },
  { employeeId: "E003", period: SEED_PERIOD, mode: "pct", lines: [{ projectId: "P-B", value: 100 }] },
];

/* ───────────── 多月示範資料（讓報表/趨勢有歷史可看） ───────────── */

/** period（yyyy-mm）加減月份 */
export function addMonths(period: string, delta: number): string {
  const [y, m] = period.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** 該期末日 yyyy-mm-dd */
function lastDayOf(period: string): string {
  const [y, m] = period.split("-").map(Number);
  const d = new Date(y, m, 0);
  return `${period}-${String(d.getDate()).padStart(2, "0")}`;
}

/** 員工於該期是否在職（用於歷史快照人數隨到/離職與留停自然變化） */
function activeInPeriod(e: Employee, period: string): boolean {
  if (e.status === "留停") return false;
  if (e.hireDate && e.hireDate > lastDayOf(period)) return false; // 尚未到職
  if (e.status === "離職" && e.leaveDate && e.leaveDate < `${period}-01`) return false; // 已離職
  return true;
}

/**
 * 以目前員工/薪資結構為基礎，回填過去數月的變動事件並為每月計算一張趨勢快照：
 * - 加班呈季節性起伏、某月發季獎金；
 * - 模擬最後幾名員工為「新進」，早期月份尚未到職 → 人數與成本隨時間成長；
 * - 當月（currentPeriod）沿用呼叫端既有事件、不覆蓋。
 * 回傳僅含「過去月份」的事件與全部月份的快照，供 store 合併。
 */
export function buildDemoData(
  employees: Employee[],
  salaries: SalaryStructure[],
  dependents: Dependent[],
  parameters: Parameters,
  brackets: InsuranceBrackets,
  currentPeriod: string,
  currentEvents: MonthlyEvent[],
  months = 6,
): { events: MonthlyEvent[]; snapshots: PayrollSnapshot[] } {
  const periods = Array.from({ length: months }, (_, k) => addMonths(currentPeriod, -(months - 1 - k))); // 舊→新
  const otPattern = [3, 6, 4, 9, 5, 7]; // 各月加班強度（依索引取模）
  const bonusMonthIndex = 1; // 第 2 個月發季獎金
  const salaryOf = (id: string) => salaries.find((s) => s.employeeId === id) ?? salary(id, {});

  const genEvents: MonthlyEvent[] = [];
  const snapshots: PayrollSnapshot[] = [];

  periods.forEach((period, j) => {
    const isCurrent = j === months - 1;
    const active = employees.filter((e) => activeInPeriod(e, period));
    const periodEvents: MonthlyEvent[] = isCurrent
      ? currentEvents.filter((e) => e.period === period)
      : active.map((emp, i) => {
          const ot = i % 2 === 0 ? otPattern[j % otPattern.length] + (i % 3) : 0;
          const bonus = j === bonusMonthIndex && i % 2 === 1 ? 20000 + (i % 3) * 5000 : 0;
          return { ...evt(emp.id, { overtimeWeekday1: ot, monthlyBonus: bonus, cumulativeBonus: bonus }), period };
        });
    if (!isCurrent) genEvents.push(...periodEvents);

    const rows = active.map((emp) => {
      const ev = periodEvents.find((e) => e.employeeId === emp.id) ?? { ...evt(emp.id, {}), period };
      const result = calculatePayroll(emp, salaryOf(emp.id), dependents, ev, parameters, brackets);
      return { ...result, name: emp.name, department: emp.department, costCenter: emp.costCenter, project: emp.project };
    });
    const bonusTotal = periodEvents.reduce((a, e) => a + e.monthlyBonus, 0);
    snapshots.push(buildSnapshot(rows, period, bonusTotal));
  });

  return { events: genEvents, snapshots };
}
