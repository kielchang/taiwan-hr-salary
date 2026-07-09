// §5.5 應發合計、§5.10 實發與雇主總成本 — 編排（orchestration）純函數
// 串接 §5.0–5.9 各模組，產出單一員工當月完整薪資結算結果。
import type { Parameters } from "@/config/parameters";
import type { InsuranceBrackets } from "@/config/brackets";
import type {
  Employee,
  SalaryStructure,
  Dependent,
  MonthlyEvent,
  LeavePolicy,
} from "@/lib/types";
import { round } from "@/lib/rounding";
import { lookupInsuredAmounts, type InsuredAmounts } from "./brackets";
import { dependentStats, type DependentStats } from "./dependents";
import { seniorityMonths, annualLeaveDays } from "./seniority";
import { monthlySalaryTotal, overtimePay, leaveDeduction, payFactor, employmentDaysFactor, leaveSegments } from "./wage";

/** 破月給薪比例預設政策（無給）；呼叫端未提供 leavePolicy 時採用 */
const DEFAULT_LEAVE_POLICY: LeavePolicy = { 留停: 0, 停職: 0, 暫離: 0 };
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
  salaryTotal: number; // 月薪資總額（全月契約值；投保/最低工資/分析皆用此）
  prorationFactor: number; // 破月比例（全月＝1）
  paidSalaryTotal: number; // 當月實付固定薪資（＝salaryTotal×比例）
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
  opts?: { period?: string; leavePolicy?: LeavePolicy }, // 提供 period 才啟用破月（全月者比例＝1，結果與不傳完全相同）
): PayrollResult {
  const salaryTotal = monthlySalaryTotal(salary);
  const insured = lookupInsuredAmounts(brackets, salaryTotal);
  const stats = dependentStats(dependents, employee.id, p);
  const months = seniorityMonths(employee.hireDate, p.seniorityBaseDate);

  // 破月：僅當提供 period 且非全月在職時 factor<1；factor===1 短路保持與原本逐位元相同
  // 固定薪資依 payFactor（含請假區間給薪比例）；勞保費另依在職天數（employmentDaysFactor）。
  const policy = opts?.leavePolicy ?? DEFAULT_LEAVE_POLICY;
  const termination = employee.status === "離職" ? (employee.leaveDate ?? null) : null;
  const factor = opts?.period
    ? payFactor(opts.period, employee.hireDate, termination, leaveSegments(employee), policy)
    : 1;
  const empFactor = opts?.period
    ? employmentDaysFactor(opts.period, employee.hireDate, employee.leaveDate ?? null, employee.status)
    : 1;
  const paidSalaryTotal = factor === 1 ? salaryTotal : round(salaryTotal * factor);

  const ot = overtimePay(salaryTotal, event, p); // 加班費依全月時薪率
  // §5.5 應發合計（固定薪資按破月比例）
  const grossPay = paidSalaryTotal + ot + event.otherAddition + event.monthlyBonus;

  const leave = leaveDeduction(salaryTotal, event, p);
  const fullPremiums = insurancePremiums(
    insured,
    stats.billableDependents,
    employee.voluntaryPensionRate,
    p,
  );
  // 勞保/就保/職保按在職天數比例（到/離職當月）；健保、勞退維持整月（健保以月計）。
  const premiums = empFactor === 1
    ? fullPremiums
    : {
        ...fullPremiums,
        laborEmployee: round(fullPremiums.laborEmployee * empFactor),
        laborEmployer: round(fullPremiums.laborEmployer * empFactor),
        occupationalEmployer: round(fullPremiums.occupationalEmployer * empFactor),
      };
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
    prorationFactor: factor,
    paidSalaryTotal,
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
