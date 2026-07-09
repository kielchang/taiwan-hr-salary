// B1 年度各類所得扣繳憑單彙整（純函數）：跨期事件聚合，逐人算全年給付/應稅/已扣繳。
import type { Employee, SalaryStructure, Dependent, MonthlyEvent } from "@/lib/types";
import type { Parameters } from "@/config/parameters";
import type { InsuranceBrackets } from "@/config/brackets";
import { calculatePayroll } from "@/lib/calc";

export interface YearlyWithholdingRow {
  employeeId: string;
  name: string;
  months: number; // 當年有結算的月份數
  gross: number; // 全年應發合計
  taxable: number; // 全年估算應稅薪資
  bonus: number; // 全年獎金
  withheld: number; // 全年已代扣所得稅（人工填值加總）
  supplementary: number; // 全年個人二代健保補充費
}

/** 聚合某年度（yyyy）各員工的扣繳彙總；只納入當年有結算事件的員工 */
export function yearlyWithholding(
  employees: Employee[],
  salaries: SalaryStructure[],
  dependents: Dependent[],
  events: MonthlyEvent[],
  parameters: Parameters,
  brackets: InsuranceBrackets,
  year: string,
  // 選填：依生效月版本逐月解析費率/級距（申報一致性）。未給＝全年用單一 parameters/brackets（相容）。
  resolve?: { parametersFor?: (period: string) => Parameters; bracketsFor?: (period: string) => InsuranceBrackets },
): YearlyWithholdingRow[] {
  const prefix = `${year}-`;
  const out: YearlyWithholdingRow[] = [];
  for (const emp of employees) {
    const empEvents = events.filter((e) => e.employeeId === emp.id && e.period.startsWith(prefix));
    if (empEvents.length === 0) continue;
    const salary =
      salaries.find((s) => s.employeeId === emp.id) ?? ({ employeeId: emp.id } as SalaryStructure);
    let gross = 0, taxable = 0, bonus = 0, withheld = 0, supplementary = 0;
    for (const ev of empEvents) {
      const p = resolve?.parametersFor?.(ev.period) ?? parameters;
      const b = resolve?.bracketsFor?.(ev.period) ?? brackets;
      const r = calculatePayroll(emp, salary, dependents, ev, p, b, { period: ev.period });
      gross += r.grossPay;
      taxable += r.taxableSalary;
      bonus += ev.monthlyBonus;
      withheld += ev.withheldTax ?? 0;
      supplementary += r.personalSupplementary;
    }
    out.push({
      employeeId: emp.id,
      name: emp.name,
      months: empEvents.length,
      gross,
      taxable,
      bonus,
      withheld,
      supplementary,
    });
  }
  return out;
}

/** 由 events 取出所有出現過的年度（遞減） */
export function availableYears(events: MonthlyEvent[]): string[] {
  return [...new Set(events.map((e) => e.period.slice(0, 4)))].sort((a, b) => b.localeCompare(a));
}
