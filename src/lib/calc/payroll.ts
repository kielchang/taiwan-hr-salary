// §5.5 應發合計、§5.10 實發與雇主總成本 — 編排（orchestration）純函數
// 串接 §5.0–5.9 各模組，產出單一員工當月完整薪資結算結果。
import type { Parameters } from "@/config/parameters";
import type { InsuranceBrackets } from "@/config/brackets";
import type {
  Employee,
  SalaryStructure,
  Dependent,
  MonthlyEvent,
} from "@/lib/types";
import { lookupInsuredAmounts, type InsuredAmounts } from "./brackets";
import { dependentStats, type DependentStats } from "./dependents";
import { seniorityMonths, annualLeaveDays } from "./seniority";
import { monthlySalaryTotal, overtimePay, leaveDeduction } from "./wage";
import { insurancePremiums, type InsurancePremiums } from "./insurance";
import { personalSupplementary } from "./supplementary";
import {
  taxableSalary,
  estimatedTaxThreshold,
  withholdingSuggestion,
  type WithholdingSuggestion,
} from "./tax";

export interface PayrollResult {
  employeeId: string;
  // 基底
  salaryTotal: number; // 月薪資總額
  seniorityMonths: number; // 年資月數
  annualLeaveDays: number; // 本年特休日數
  insured: InsuredAmounts; // 四險投保金額
  dependents: DependentStats; // 眷屬統計
  // 加項
  overtimePay: number; // 加班費
  grossPay: number; // 應發合計
  // 減項
  leaveDeduction: number; // 請假扣款
  premiums: InsurancePremiums; // 四險保費（含雇主）
  personalSupplementary: number; // 個人補充保費（獎金）
  withheldTax: number; // 代扣所得稅（人工轉填值；未填＝0）
  totalDeductions: number; // 扣款合計
  netPay: number; // 實發金額
  // 雇主
  employerBurden: number; // 雇主負擔合計
  employerTotalCost: number; // 雇主總成本
  // 稅務建議（four-eyes：建議值與結算值分離）
  taxableSalary: number; // 當月應稅薪資（估）
  estimatedTaxThreshold: number | null; // 估算起扣點
  withholdingSuggestion: WithholdingSuggestion; // 建議代扣稅額
  // 檢核
  belowMinWage: boolean; // V1：月薪資總額 < 最低工資
}

export function calculatePayroll(
  employee: Employee,
  salary: SalaryStructure,
  dependents: Dependent[],
  event: MonthlyEvent,
  p: Parameters,
  brackets: InsuranceBrackets,
): PayrollResult {
  const salaryTotal = monthlySalaryTotal(salary);
  const insured = lookupInsuredAmounts(brackets, salaryTotal);
  const stats = dependentStats(dependents, employee.id, p);
  const months = seniorityMonths(employee.hireDate, p.seniorityBaseDate);

  const ot = overtimePay(salaryTotal, event, p);
  // §5.5 應發合計
  const grossPay = salaryTotal + ot + event.otherAddition + event.monthlyBonus;

  const leave = leaveDeduction(salaryTotal, event, p);
  const premiums = insurancePremiums(
    insured,
    stats.billableDependents,
    employee.voluntaryPensionRate,
    p,
  );
  const personalSupp = personalSupplementary(
    event.monthlyBonus,
    event.cumulativeBonus,
    insured.health,
    p,
  );
  // four-eyes（§7）：建議值僅供參考，實際代扣為人工轉填；未填＝0
  const withheldTax = event.withheldTax ?? 0;

  // §5.10 實發金額
  const totalDeductions =
    leave +
    premiums.laborEmployee +
    premiums.healthEmployee +
    premiums.pensionVoluntary +
    personalSupp +
    withheldTax +
    event.otherDeduction;
  const netPay = grossPay - totalDeductions;

  // §5.10 雇主總成本
  const employerBurden =
    premiums.laborEmployer +
    premiums.occupationalEmployer +
    premiums.healthEmployer +
    premiums.pensionEmployer;
  const employerTotalCost = grossPay + employerBurden;

  // §5.8–5.9 稅務建議
  const taxable = taxableSalary(
    grossPay,
    ot,
    event.monthlyBonus,
    premiums.pensionVoluntary,
    salary.mealAllowance,
    p,
  );
  const threshold = estimatedTaxThreshold(employee.taxResidency, stats.taxDependents, p);
  const suggestion = withholdingSuggestion(
    taxable,
    employee.taxResidency,
    employee.withholdingMethod,
    stats.taxDependents,
    p,
  );

  return {
    employeeId: employee.id,
    salaryTotal,
    seniorityMonths: months,
    annualLeaveDays: annualLeaveDays(months),
    insured,
    dependents: stats,
    overtimePay: ot,
    grossPay,
    leaveDeduction: leave,
    premiums,
    personalSupplementary: personalSupp,
    withheldTax,
    totalDeductions,
    netPay,
    employerBurden,
    employerTotalCost,
    taxableSalary: taxable,
    estimatedTaxThreshold: threshold,
    withholdingSuggestion: suggestion,
    belowMinWage: salaryTotal < p.minWageMonthly,
  };
}
