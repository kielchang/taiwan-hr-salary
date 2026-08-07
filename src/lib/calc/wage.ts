// §5.0 基底量、§5.3 加班費、§5.4 請假扣款 — 純函數
import type { Parameters } from "@/config/parameters";
import type { SalaryStructure, MonthlyEvent, EmployeeStatus, LeaveStatus, LeavePolicy, LeaveSegment, Employee } from "@/lib/types";
import { round } from "@/lib/rounding";

const LEAVE_STATUSES: LeaveStatus[] = ["留停", "停職", "暫離"];

/** 是否為可復職之非在職狀態（留停/停職/暫離） */
export function isLeaveStatus(status?: EmployeeStatus): status is LeaveStatus {
  return status != null && (LEAVE_STATUSES as string[]).includes(status);
}

/**
 * B-1：取員工的留停/停職/暫離「多段」清單（payroll/名冊/驗證的單一入口）。
 * 有 `leaveRecords` 時直接採用；否則回退到舊單段欄位（leaveDate/returnDate/leavePaidRatio）——
 * 讓舊資料與 TC-9 行為完全不變（無 leave＝空陣列＝payFactor 全月 1）。
 */
export function leaveSegments(emp: Pick<Employee, "status" | "leaveDate" | "returnDate" | "leavePaidRatio" | "leaveRecords">): LeaveSegment[] {
  if (emp.leaveRecords && emp.leaveRecords.length) return emp.leaveRecords;
  if (isLeaveStatus(emp.status)) {
    // 舊單段回退。缺生效日時視為「久遠以前起的開放段」（＝目前整段在假），與導入前 isActiveInPeriod 行為一致。
    return [{ status: emp.status, from: emp.leaveDate ?? "0001-01-01", to: emp.returnDate ?? null, paidRatio: emp.leavePaidRatio ?? null }];
  }
  return [];
}

/** 有效給薪比例：員工逐案覆寫值優先，否則採公司該狀態預設政策；非請假狀態回 1（沿用；單段語意）。 */
export function effectiveLeaveRatio(
  emp: { status?: EmployeeStatus; leavePaidRatio?: number | null },
  policy: LeavePolicy,
): number {
  if (!isLeaveStatus(emp.status)) return 1;
  return emp.leavePaidRatio ?? policy[emp.status];
}

/** 單段的有效給薪比例（逐案覆寫優先，否則公司政策）。 */
export function segmentRatio(seg: LeaveSegment, policy: LeavePolicy): number {
  return seg.paidRatio ?? policy[seg.status];
}

/** 逐日走訪當月每一天，callback 回傳該日「給薪權重」，回傳權重總和／當月天數。
 *  每日時間戳一律用 UTC 午夜（Date.UTC）：呼叫端的 hireDate/離職日/請假段皆為 "YYYY-MM-DD"
 *  字串、`new Date(...)` 解析為 UTC 午夜——兩側同基準才時區無關。若這裡用本地午夜，
 *  在 UTC+N 時區本地午夜早於 UTC 午夜，邊界日會被多算/少算一天（台灣 UTC+8 實測少一天）。 */
function dailyFactor(period: string, weight: (dayTs: number) => number): number {
  const [y, m] = period.split("-").map(Number);
  if (!y || !m) return 1;
  const total = new Date(y, m, 0).getDate();
  let sum = 0;
  for (let d = 1; d <= total; d++) sum += weight(Date.UTC(y, m - 1, d));
  return Math.max(0, Math.min(1, sum / total));
}

/**
 * 破月給薪比例（固定薪資 × 本值）。逐日加權：
 * 到職前／離職日之後＝0；落在任一請假區間 [from, to) 者＝該段給薪比例；其餘＝1。
 * B-1：支援**多段**留停/停職/暫離（`segments`，不重疊）；每段各自的給薪比例（逐案覆寫∥公司政策）。
 * - 離職：`terminationDate`＝離職日（inclusive，當天仍計）；null＝未離職。
 * - 無 segments、無離職＝全月回 1，與破月前結果逐位元相同（保 TC-9／proration）。
 */
export function payFactor(
  period: string,
  hireDate: string,
  terminationDate: string | null,
  segments: LeaveSegment[],
  policy: LeavePolicy,
): number {
  const hireTs = hireDate ? new Date(hireDate).getTime() : -Infinity;
  const termTs = terminationDate ? new Date(terminationDate).getTime() : Infinity; // 離職日 inclusive
  const segs = segments.map((s) => ({
    from: new Date(s.from).getTime(),
    to: s.to ? new Date(s.to).getTime() : Infinity, // 開放段＝到月底之後
    ratio: segmentRatio(s, policy),
  }));
  return dailyFactor(period, (t) => {
    if (t < hireTs) return 0; // 尚未到職
    if (t > termTs) return 0; // 離職後
    for (const seg of segs) if (t >= seg.from && t < seg.to) return seg.ratio; // 落在某請假段
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
