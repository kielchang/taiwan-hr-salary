// §5.0 基底量、§5.3 加班費、§5.4 請假扣款 — 純函數
import type { Parameters } from "@/config/parameters";
import type { SalaryStructure, MonthlyEvent, EmployeeStatus, LeaveStatus, LeavePolicy } from "@/lib/types";
import { round } from "@/lib/rounding";

const LEAVE_STATUSES: LeaveStatus[] = ["留停", "停職", "暫離"];

/** 是否為可復職之非在職狀態（留停/停職/暫離） */
export function isLeaveStatus(status?: EmployeeStatus): status is LeaveStatus {
  return status != null && (LEAVE_STATUSES as string[]).includes(status);
}

/** 有效給薪比例：員工逐案覆寫值優先，否則採公司該狀態預設政策；非請假狀態回 1 */
export function effectiveLeaveRatio(
  emp: { status?: EmployeeStatus; leavePaidRatio?: number | null },
  policy: LeavePolicy,
): number {
  if (!isLeaveStatus(emp.status)) return 1;
  return emp.leavePaidRatio ?? policy[emp.status];
}

/** 逐日走訪當月每一天，callback 回傳該日「給薪權重」，回傳權重總和／當月天數。 */
function dailyFactor(period: string, weight: (dayTs: number) => number): number {
  const [y, m] = period.split("-").map(Number);
  if (!y || !m) return 1;
  const total = new Date(y, m, 0).getDate();
  let sum = 0;
  for (let d = 1; d <= total; d++) sum += weight(new Date(y, m - 1, d).getTime());
  return Math.max(0, Math.min(1, sum / total));
}

/**
 * 破月給薪比例（固定薪資 × 本值）。逐日加權：
 * 到職前／離職日之後＝0；落在請假區間 [leaveDate, returnDate) 者＝leaveRatio；其餘＝1。
 * - status 離職：leaveDate＝離職日（inclusive，當天仍計）。
 * - status 留停/停職/暫離：leaveDate＝生效日(起)、returnDate＝復職日(空＝到月底)。
 * - 全月在職（無 leave、無離職）回 1，與破月前結果逐位元相同（保 TC-9／proration）。
 */
export function payFactor(
  period: string,
  hireDate: string,
  leaveDate: string | null,
  status?: EmployeeStatus,
  returnDate?: string | null,
  leaveRatio = 1,
): number {
  const leave = isLeaveStatus(status);
  const hireTs = hireDate ? new Date(hireDate).getTime() : -Infinity;
  const termTs = status === "離職" && leaveDate ? new Date(leaveDate).getTime() : Infinity; // 離職日 inclusive
  const leaveStartTs = leave && leaveDate ? new Date(leaveDate).getTime() : Infinity;
  const returnTs = leave && returnDate ? new Date(returnDate).getTime() : Infinity;
  return dailyFactor(period, (t) => {
    if (t < hireTs) return 0; // 尚未到職
    if (t > termTs) return 0; // 離職後
    if (leave && t >= leaveStartTs && t < returnTs) return leaveRatio; // 請假中
    return 1; // 在職工作日
  });
}

/**
 * 在職天數比例（供勞保費按天）：僅看「勞動契約存續」的天數（到職～離職日），
 * 請假期間仍視為在職（在保），故不因留停/停職/暫離而減少。到/離職當月才 <1。
 */
export function employmentDaysFactor(
  period: string,
  hireDate: string,
  leaveDate: string | null,
  status?: EmployeeStatus,
): number {
  const hireTs = hireDate ? new Date(hireDate).getTime() : -Infinity;
  const termTs = status === "離職" && leaveDate ? new Date(leaveDate).getTime() : Infinity;
  return dailyFactor(period, (t) => (t < hireTs || t > termTs ? 0 : 1));
}

/**
 * §5.0 月薪資總額＝薪資結構中「屬工資」項目之合計（八項固定＋自訂津貼皆屬工資）。
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
    s.otherFixedAllowance +
    (s.customAllowances?.reduce((a, c) => a + (c.amount || 0), 0) ?? 0)
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
