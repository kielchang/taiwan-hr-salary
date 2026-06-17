// B4 加退保作業清單（純函數）：依生命週期日期，列出當期應辦加保（新進）與退保（離職）者。
import type { Employee } from "@/lib/types";

/** 該日期是否落在指定期間（yyyy-mm）月內 */
function inPeriod(dateIso: string | null | undefined, period: string): boolean {
  if (!dateIso) return false;
  return dateIso.slice(0, 7) === period;
}

export interface EnrollmentWorklist {
  newHires: Employee[]; // 當月到職 → 應辦加保
  leavers: Employee[]; // 當月離職 → 應辦退保
}

export function enrollmentWorklist(employees: Employee[], period: string): EnrollmentWorklist {
  return {
    newHires: employees.filter((e) => inPeriod(e.hireDate, period)),
    leavers: employees.filter((e) => e.status === "離職" && inPeriod(e.leaveDate, period)),
  };
}
