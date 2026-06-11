// §8 合規檢核（不變量與驗證規則）— 驗證層
import type { Parameters } from "@/config/parameters";
import type {
  Employee,
  SalaryStructure,
  Dependent,
  MonthlyEvent,
} from "@/lib/types";
import { monthlySalaryTotal } from "./calc/wage";

export type Severity = "error" | "warning";

export interface ValidationIssue {
  rule: "V1" | "V2" | "V4" | "V6";
  severity: Severity;
  employeeId?: string;
  message: string;
}

/** V1 最低工資：月薪資總額 ≥ 最低工資（強制） */
export function checkMinWage(
  salary: SalaryStructure,
  p: Parameters,
): ValidationIssue | null {
  const total = monthlySalaryTotal(salary);
  if (total < p.minWageMonthly) {
    return {
      rule: "V1",
      severity: "error",
      employeeId: salary.employeeId,
      message: `月薪資總額 ${total.toLocaleString()} 低於最低工資 ${p.minWageMonthly.toLocaleString()}`,
    };
  }
  return null;
}

/** V2 眷屬參照完整性：每筆眷屬之員工編號必須存在於員工主檔（孤兒警示） */
export function checkDependentIntegrity(
  dependents: Dependent[],
  employees: Employee[],
): ValidationIssue[] {
  const ids = new Set(employees.map((e) => e.id));
  return dependents
    .filter((d) => !ids.has(d.employeeId))
    .map((d) => ({
      rule: "V2" as const,
      severity: "error" as const,
      message: `眷屬「${d.name}」之員工編號「${d.employeeId}」⚠查無此員編`,
    }));
}

/**
 * V4 月加班上限：平日＋休息日加班時數合計 ≤ 46 小時（勞基法 §32）。
 * README §8 標註「未實作，新實作建議納入」— 本系統據此納入驗證層。
 */
export function checkOvertimeCap(event: MonthlyEvent): ValidationIssue | null {
  const total =
    event.overtimeWeekday1 +
    event.overtimeWeekday2 +
    event.overtimeRestday1 +
    event.overtimeRestday2;
  if (total > 46) {
    return {
      rule: "V4",
      severity: "warning",
      employeeId: event.employeeId,
      message: `延長工時連同休息日出勤 ${total} 小時，超過每月 46 小時上限（勞基法 §32）`,
    };
  }
  return null;
}

/** V6 免稅額申報表收件：收件日為空 → 警示＋預設固定 5% */
export function checkExemptionForm(employee: Employee): ValidationIssue | null {
  if (employee.taxResidency === "居住者" && !employee.exemptionFormReceivedDate) {
    return {
      rule: "V6",
      severity: "warning",
      employeeId: employee.id,
      message: `${employee.name}：免稅額申報表未收件，請補收（未填表依規定按固定 5% 扣繳）`,
    };
  }
  return null;
}

/** 全簿驗證：彙整 V1／V2／V4／V6 */
export function validateAll(
  employees: Employee[],
  salaries: SalaryStructure[],
  dependents: Dependent[],
  events: MonthlyEvent[],
  p: Parameters,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const salaryById = new Map(salaries.map((s) => [s.employeeId, s]));
  const eventById = new Map(events.map((e) => [e.employeeId, e]));

  for (const emp of employees) {
    const s = salaryById.get(emp.id);
    if (s) {
      const v1 = checkMinWage(s, p);
      if (v1) issues.push(v1);
    }
    const v6 = checkExemptionForm(emp);
    if (v6) issues.push(v6);
    const e = eventById.get(emp.id);
    if (e) {
      const v4 = checkOvertimeCap(e);
      if (v4) issues.push(v4);
    }
  }
  issues.push(...checkDependentIntegrity(dependents, employees));
  return issues;
}

/**
 * V3 彙總勾稽：各分類合計 ＝ 全公司合計，差異列恆為 0。
 * 回傳差異值；恆為 0 即正常（>0 表示有未分類或名稱不一致）。
 */
export function reconciliationDiff(total: number, classifiedSum: number): number {
  return total - classifiedSum;
}
