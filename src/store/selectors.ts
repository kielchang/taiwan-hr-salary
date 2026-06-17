// 衍生計算：以純函數計算模組（§5）將 store 狀態轉為當月薪資結算結果與彙總。
import { calculatePayroll, type PayrollResult } from "@/lib/calc";
import { companySupplementary } from "@/lib/calc";
import type { Employee, SalaryStructure, Dependent, MonthlyEvent } from "@/lib/types";
import type { Parameters } from "@/config/parameters";
import type { InsuranceBrackets } from "@/config/brackets";
import { usePayrollStore, blankEvent } from "./usePayrollStore";

/** 該員工於某期間是否在職（用於當期計薪過濾；undefined 狀態＝在職） */
export function isActiveInPeriod(emp: Employee, period: string): boolean {
  const [y, m] = period.split("-").map(Number);
  if (!y || !m) return true;
  const monthEnd = new Date(y, m, 0);
  const monthStart = new Date(y, m - 1, 1);
  if (emp.status === "留停") return false;
  if (emp.hireDate && new Date(emp.hireDate) > monthEnd) return false; // 尚未到職
  if (emp.status === "離職" && emp.leaveDate && new Date(emp.leaveDate) < monthStart) return false; // 期前已離職
  return true;
}

export interface PayrollRow extends PayrollResult {
  name: string;
  department: string;
  costCenter: string;
  project: string;
}

const blankSalary = (employeeId: string): SalaryStructure => ({
  employeeId, baseSalary: 0, managerAllowance: 0, dutyAllowance: 0, professionalAllowance: 0,
  mealAllowance: 0, transportAllowance: 0, attendanceBonus: 0, otherFixedAllowance: 0,
});

export interface PayrollData {
  employees: Employee[];
  salaries: SalaryStructure[];
  dependents: Dependent[];
  events: MonthlyEvent[];
  parameters: Parameters;
  brackets: InsuranceBrackets;
}

/** 純函數：計算指定期間全體在職員工之薪資結算列（供 hook 與跨期重算共用） */
export function buildPayrollRows(period: string, data: PayrollData): PayrollRow[] {
  const { employees, salaries, dependents, events, parameters, brackets } = data;
  return employees.filter((emp) => isActiveInPeriod(emp, period)).map((emp) => {
    const salary = salaries.find((s) => s.employeeId === emp.id) ?? blankSalary(emp.id);
    const event = events.find((e) => e.employeeId === emp.id && e.period === period) ?? blankEvent(emp.id, period);
    const result = calculatePayroll(emp, salary, dependents, event, parameters, brackets, { period });
    return { ...result, name: emp.name, department: emp.department, costCenter: emp.costCenter, project: emp.project };
  });
}

/** 計算當月（currentPeriod）全體員工薪資結算 */
export function usePayrollRows(): PayrollRow[] {
  const { employees, salaries, dependents, events, parameters, brackets, currentPeriod } = usePayrollStore();
  return buildPayrollRows(currentPeriod, { employees, salaries, dependents, events, parameters, brackets });
}

/** 計算指定期間全體員工薪資結算（檢視歷史/其他月份用） */
export function usePayrollRowsFor(period: string): PayrollRow[] {
  const { employees, salaries, dependents, events, parameters, brackets } = usePayrollStore();
  return buildPayrollRows(period, { employees, salaries, dependents, events, parameters, brackets });
}

export interface Totals {
  count: number;
  grossPay: number;
  overtimePay: number;
  monthlyBonus: number;
  netPay: number;
  employerBurden: number;
  employerTotalCost: number;
}

export function sumTotals(rows: PayrollRow[], bonusByEmp: Map<string, number>): Totals {
  return rows.reduce<Totals>(
    (acc, r) => ({
      count: acc.count + 1,
      grossPay: acc.grossPay + r.grossPay,
      overtimePay: acc.overtimePay + r.overtimePay,
      monthlyBonus: acc.monthlyBonus + (bonusByEmp.get(r.employeeId) ?? 0),
      netPay: acc.netPay + r.netPay,
      employerBurden: acc.employerBurden + r.employerBurden,
      employerTotalCost: acc.employerTotalCost + r.employerTotalCost,
    }),
    {
      count: 0,
      grossPay: 0,
      overtimePay: 0,
      monthlyBonus: 0,
      netPay: 0,
      employerBurden: 0,
      employerTotalCost: 0,
    },
  );
}

/** 投保單位（公司）二代健保補充保費（差額制，§5.7） */
export function useCompanySupplementary(rows: PayrollRow[]): number {
  const parameters = usePayrollStore((s) => s.parameters);
  const totalGross = rows.reduce((a, r) => a + r.grossPay, 0);
  const totalHealthInsured = rows.reduce((a, r) => a + r.insured.health, 0);
  return companySupplementary(totalGross, totalHealthInsured, parameters);
}
