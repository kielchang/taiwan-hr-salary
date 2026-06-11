// 衍生計算：以純函數計算模組（§5）將 store 狀態轉為當月薪資結算結果與彙總。
import { calculatePayroll, type PayrollResult } from "@/lib/calc";
import { companySupplementary } from "@/lib/calc";
import { usePayrollStore, blankEvent } from "./usePayrollStore";

export interface PayrollRow extends PayrollResult {
  name: string;
  department: string;
  costCenter: string;
  project: string;
}

/** 計算當月（currentPeriod）全體員工薪資結算 */
export function usePayrollRows(): PayrollRow[] {
  const { employees, salaries, dependents, events, parameters, brackets, currentPeriod } =
    usePayrollStore();

  return employees.map((emp) => {
    const salary =
      salaries.find((s) => s.employeeId === emp.id) ?? {
        employeeId: emp.id,
        baseSalary: 0,
        managerAllowance: 0,
        dutyAllowance: 0,
        professionalAllowance: 0,
        mealAllowance: 0,
        transportAllowance: 0,
        attendanceBonus: 0,
        otherFixedAllowance: 0,
      };
    const event =
      events.find((e) => e.employeeId === emp.id && e.period === currentPeriod) ??
      blankEvent(emp.id, currentPeriod);
    const result = calculatePayroll(emp, salary, dependents, event, parameters, brackets);
    return {
      ...result,
      name: emp.name,
      department: emp.department,
      costCenter: emp.costCenter,
      project: emp.project,
    };
  });
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
