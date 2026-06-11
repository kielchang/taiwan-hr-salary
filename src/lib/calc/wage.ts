// §5.0 基底量、§5.3 加班費、§5.4 請假扣款 — 純函數
import type { Parameters } from "@/config/parameters";
import type { SalaryStructure, MonthlyEvent } from "@/lib/types";
import { round } from "@/lib/rounding";

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
