// B4 加退保作業清單（純函數）：依生命週期日期，列出當期應辦加保/退保/停保/復保者。
import type { Employee } from "@/lib/types";

const LEAVE = ["留停", "停職", "暫離"];

/** 該日期是否落在指定期間（yyyy-mm）月內 */
function inPeriod(dateIso: string | null | undefined, period: string): boolean {
  if (!dateIso) return false;
  return dateIso.slice(0, 7) === period;
}

export interface EnrollmentWorklist {
  newHires: Employee[]; // 當月到職 → 應辦加保
  leavers: Employee[]; // 當月離職 → 應辦退保
  suspends: Employee[]; // 當月留停/停職/暫離生效 → 應辦停保（依規定；健保得續保自費）
  returns: Employee[]; // 當月復職 → 應辦復保
}

export function enrollmentWorklist(employees: Employee[], period: string): EnrollmentWorklist {
  return {
    newHires: employees.filter((e) => inPeriod(e.hireDate, period)),
    leavers: employees.filter((e) => e.status === "離職" && inPeriod(e.leaveDate, period)),
    suspends: employees.filter((e) => e.status != null && LEAVE.includes(e.status) && inPeriod(e.leaveDate, period)),
    returns: employees.filter((e) => e.status != null && LEAVE.includes(e.status) && inPeriod(e.returnDate, period)),
  };
}
