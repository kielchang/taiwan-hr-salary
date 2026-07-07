// §8 合規檢核（不變量與驗證規則）— 驗證層
import type { Parameters } from "@/config/parameters";
import type { InsuranceBrackets } from "@/config/brackets";
import type {
  Employee,
  SalaryStructure,
  Dependent,
  MonthlyEvent,
  Allocation,
} from "@/lib/types";
import { monthlySalaryTotal } from "./calc/wage";
import { calculatePayroll } from "./calc";

export type Severity = "error" | "warning";

export interface ValidationIssue {
  /**
   * V3、V5 為 README §8 保留編號，不產生逐筆 issue：
   * V3 彙總勾稽＝報表層 reconciliationDiff（差異紅標）；V5 級距申報一致＝程序面（申報名冊／級距調整報表）。
   */
  rule: "V1" | "V2" | "V4" | "V6" | "V7" | "V8" | "V9" | "V10" | "V11" | "V12";
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

/** 台灣身分證格式（居住者）：一碼大寫英文＋1/2＋八碼數字 */
const TW_ID_RE = /^[A-Z][12]\d{8}$/;

/** V7 身分證檢核：格式疑異常（居住者）／跨員工重複（皆 warning；身分證是薪資條加密密碼與申報識別） */
export function checkNationalIds(employees: Employee[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seen = new Map<string, Employee>();
  for (const emp of employees) {
    const nid = emp.nationalId.trim();
    if (!nid) continue; // 空白於薪資條產生時另有提示
    if (emp.taxResidency === "居住者" && !TW_ID_RE.test(nid)) {
      issues.push({ rule: "V7", severity: "warning", employeeId: emp.id, message: `${emp.name}：身分證字號「${nid}」格式疑異常（薪資條密碼與申報將受影響）` });
    }
    const dup = seen.get(nid);
    if (dup) {
      issues.push({ rule: "V7", severity: "warning", employeeId: emp.id, message: `${emp.name} 與 ${dup.name} 身分證字號重複（${nid}），請確認是否誤植` });
    } else {
      seen.set(nid, emp);
    }
  }
  return issues;
}

/** V8 到離職日期一致性：離職/留停必填生效日（否則整月照發薪資）；生效日不得早於到職日 */
export function checkLifecycleDates(employee: Employee): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const status = employee.status ?? "在職";
  if (status !== "在職" && !employee.leaveDate) {
    issues.push({ rule: "V8", severity: "error", employeeId: employee.id, message: `${employee.name}：狀態為「${status}」但未填生效日 — 系統將視為全月在職照發薪資，請補填` });
  }
  if (employee.leaveDate && employee.hireDate && employee.leaveDate < employee.hireDate) {
    issues.push({ rule: "V8", severity: "error", employeeId: employee.id, message: `${employee.name}：離職／留停生效日（${employee.leaveDate}）早於到職日（${employee.hireDate}）` });
  }
  if (employee.returnDate && employee.leaveDate && employee.returnDate < employee.leaveDate) {
    issues.push({ rule: "V8", severity: "error", employeeId: employee.id, message: `${employee.name}：復職日（${employee.returnDate}）早於生效日（${employee.leaveDate}）` });
  }
  return issues;
}

/** V10 累計獎金一致性：年度累計不得小於本月發放（影響二代健保 4× 門檻計費） */
export function checkCumulativeBonus(event: MonthlyEvent, name: string): ValidationIssue | null {
  if (event.cumulativeBonus < event.monthlyBonus) {
    return { rule: "V10", severity: "error", employeeId: event.employeeId, message: `${name}：年度累計獎金（${event.cumulativeBonus.toLocaleString()}）小於本月發放（${event.monthlyBonus.toLocaleString()}），補充保費將少算` };
  }
  return null;
}

/** V12 眷屬申報欄位完整性：依附健保之眷屬缺出生年月日或身分證（彙總為單一提醒，避免灌版） */
export function checkDependentCompleteness(dependents: Dependent[], employees: Employee[]): ValidationIssue | null {
  const ids = new Set(employees.map((e) => e.id));
  const incomplete = dependents.filter(
    (d) => ids.has(d.employeeId) && d.enrolledInHealthInsurance && (!d.birthDate || !d.nationalId.trim()),
  );
  if (incomplete.length === 0) return null;
  return {
    rule: "V12", severity: "warning",
    message: `共 ${incomplete.length} 名依附健保眷屬缺出生年月日或身分證，加保／報稅申報前請至「基本資料」補齊`,
  };
}

/** V11 工時分攤超額：百分比合計 > 100％，或時數合計超過可用工時（分攤與稼動率將失真） */
export function allocationIssues(
  allocations: Allocation[],
  p: Parameters,
  period: string,
  nameById: Map<string, string> = new Map(),
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const a of allocations.filter((x) => x.period === period)) {
    const sum = a.lines.reduce((acc, l) => acc + l.value, 0);
    const cap = a.mode === "pct" ? 100 : (a.availableHours ?? p.monthlyWorkHours);
    if (sum > cap) {
      const name = nameById.get(a.employeeId) ?? a.employeeId;
      issues.push({
        rule: "V11", severity: "warning", employeeId: a.employeeId,
        message: a.mode === "pct"
          ? `${name}：${a.period} 專案分攤合計 ${sum}% 超過 100%，成本占比將被重新加權`
          : `${name}：${a.period} 分攤時數 ${sum}h 超過可用工時 ${cap}h，稼動率將失真`,
      });
    }
  }
  return issues;
}

/** 全簿驗證：彙整 V1／V2／V4／V6／V7／V8／V10／V12；提供 brackets 時加驗 V9（實發為負） */
export function validateAll(
  employees: Employee[],
  salaries: SalaryStructure[],
  dependents: Dependent[],
  events: MonthlyEvent[],
  p: Parameters,
  brackets?: InsuranceBrackets,
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
    issues.push(...checkLifecycleDates(emp));
    const e = eventById.get(emp.id);
    if (e) {
      const v4 = checkOvertimeCap(e);
      if (v4) issues.push(v4);
      const v10 = checkCumulativeBonus(e, emp.name);
      if (v10) issues.push(v10);
    }
    // V9 實發為負：大額扣款/誤植稅額會直接流入薪資條，必須擋下
    if (brackets && s) {
      const r = calculatePayroll(emp, s, dependents, e ?? blankEventFor(emp.id), p, brackets);
      if (r.netPay < 0) {
        issues.push({ rule: "V9", severity: "error", employeeId: emp.id, message: `${emp.name}：實發金額為負（${r.netPay.toLocaleString()}），請檢查代扣稅／其他扣款是否誤植` });
      }
    }
  }
  issues.push(...checkNationalIds(employees));
  issues.push(...checkDependentIntegrity(dependents, employees));
  const v12 = checkDependentCompleteness(dependents, employees);
  if (v12) issues.push(v12);
  return issues;
}

/** 空事件（V9 驗證用；與 store blankEvent 對齊但避免循環相依） */
function blankEventFor(employeeId: string): MonthlyEvent {
  return {
    employeeId, period: "",
    overtimeWeekday1: 0, overtimeWeekday2: 0, overtimeRestday1: 0, overtimeRestday2: 0, overtimeHoliday: 0,
    personalLeaveHours: 0, sickLeaveHours: 0,
    monthlyBonus: 0, cumulativeBonus: 0, otherAddition: 0, otherDeduction: 0, withheldTax: null,
  };
}

/**
 * V3 彙總勾稽：各分類合計 ＝ 全公司合計，差異列恆為 0。
 * 回傳差異值；恆為 0 即正常（>0 表示有未分類或名稱不一致）。
 */
export function reconciliationDiff(total: number, classifiedSum: number): number {
  return total - classifiedSum;
}
