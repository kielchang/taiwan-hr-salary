// §5.0 基底量、§5.3 加班費、§5.4 請假扣款 — 純函數
import type { Parameters } from "@/config/parameters";
import type { SalaryStructure, MonthlyEvent, EmployeeStatus } from "@/lib/types";
import { round } from "@/lib/rounding";

/**
 * 破月比例（到/離職當月固定薪資按在職日數比例計）。
 * 一般全月在職者回 1（不影響既有計算）。以該月日曆天為分母。
 * 限制（批次 1）：僅按比例固定薪資；投保金額仍以全月薪資查級距。
 */
export function prorationFactor(
  period: string,
  hireDate: string,
  leaveDate: string | null,
  status?: EmployeeStatus,
): number {
  if (status === "留停") return 0;
  const [y, m] = period.split("-").map(Number);
  if (!y || !m) return 1;
  const total = new Date(y, m, 0).getDate(); // 當月日曆天
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m - 1, total);
  const hire = hireDate ? new Date(hireDate) : start;
  const leave = leaveDate ? new Date(leaveDate) : null;
  if (hire > end) return 0; // 當月尚未到職
  if (leave && leave < start) return 0; // 當月前已離職
  const from = hire > start ? hire : start;
  const to = leave && leave < end ? leave : end;
  if (to < from) return 0;
  const activeDays = Math.round((to.getTime() - from.getTime()) / 86400000) + 1;
  return Math.max(0, Math.min(1, activeDays / total));
}

/**
 * §5.0 月薪資總額＝薪資結構中「屬工資」項目之合計（八項皆屬工資）。
 * 同時是投保級距、加班費、平均工資、最低工資檢核的法定基礎。
 */
export function monthlySalaryTotal(s: SalaryStructure): number {
  return (
    s.baseSalary +
    s.managerAllowance +
    s.dutyAllowance +
    s.professionalAllowance +
    s.mealAllowance +
    s.transportAllowance +
    s.attendanceBonus +
    s.otherFixedAllowance
  );
}

/** §5.0 平日每小時工資額＝月薪資總額 ÷ 月計薪時數（240） */
export function hourlyWage(salaryTotal: number, p: Parameters): number {
  return salaryTotal / p.monthlyWorkHours;
}

/**
 * §5.3 加班費（勞基法 §24、§39）
 * 倍率以 4/3、5/3 分數運算；各段先不捨入、加總後捨入一次。
 * 對照 Excel 薪資總表 J 欄（附錄A §A2）。
 */
export function overtimePay(
  salaryTotal: number,
  e: MonthlyEvent,
  p: Parameters,
): number {
  const hw = hourlyWage(salaryTotal, p);
  const factored =
    (e.overtimeWeekday1 * 4) / 3 +
    (e.overtimeWeekday2 * 5) / 3 +
    (e.overtimeRestday1 * 4) / 3 +
    (e.overtimeRestday2 * 5) / 3 +
    e.overtimeHoliday;
  return round(hw * factored);
}

/**
 * §5.4 請假扣款（勞工請假規則）
 * 事假無薪全扣、普通傷病假半薪。對照 Excel 薪資總表 P 欄。
 */
export function leaveDeduction(
  salaryTotal: number,
  e: MonthlyEvent,
  p: Parameters,
): number {
  const hw = hourlyWage(salaryTotal, p);
  return round(hw * (e.personalLeaveHours + 0.5 * e.sickLeaveHours));
}
