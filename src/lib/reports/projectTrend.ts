// 跨月專案成本：逐月重算 computeProjectCost，並算累計實際(AC)、燃燒率、完工預估(EAC)。
// 純函數；逐期重建 PayrollRow 沿用 calculatePayroll（與 selectors 相同）。
import type { Employee, SalaryStructure, Dependent, MonthlyEvent, Project, Allocation } from "@/lib/types";
import type { Parameters } from "@/config/parameters";
import type { InsuranceBrackets } from "@/config/brackets";
import { calculatePayroll } from "@/lib/calc";
import { isActiveInPeriod } from "@/store/selectors";
import { blankEvent } from "@/store/usePayrollStore";
import { computeProjectCost, type ProjectCostResult } from "./projectCost";

export interface ProjectTrendInput {
  employees: Employee[];
  salaries: SalaryStructure[];
  dependents: Dependent[];
  events: MonthlyEvent[];
  allocations: Allocation[];
  projects: Project[];
  parameters: Parameters;
  brackets: InsuranceBrackets;
}

const blankSalary = (employeeId: string): SalaryStructure => ({
  employeeId, baseSalary: 0, managerAllowance: 0, dutyAllowance: 0, professionalAllowance: 0,
  mealAllowance: 0, transportAllowance: 0, attendanceBonus: 0, otherFixedAllowance: 0,
});

/** 逐期重算專案成本（每期＝重建當期 rows → computeProjectCost） */
export function projectCostByPeriod(input: ProjectTrendInput, periods: string[]): Map<string, ProjectCostResult> {
  const { employees, salaries, dependents, events, allocations, projects, parameters, brackets } = input;
  const codeToId = new Map(projects.map((p) => [p.code, p.id]));
  const defaultProjectByEmp = new Map(
    employees.filter((e) => e.project && codeToId.has(e.project)).map((e) => [e.id, codeToId.get(e.project) as string]),
  );
  const baseByEmp = new Map(salaries.map((s) => [s.employeeId, s.baseSalary]));
  const out = new Map<string, ProjectCostResult>();

  for (const period of periods) {
    const active = employees.filter((e) => isActiveInPeriod(e, period));
    const rows = active.map((emp) => {
      const salary = salaries.find((s) => s.employeeId === emp.id) ?? blankSalary(emp.id);
      const event = events.find((e) => e.employeeId === emp.id && e.period === period) ?? blankEvent(emp.id, period);
      const r = calculatePayroll(emp, salary, dependents, event, parameters, brackets, { period });
      return { ...r, name: emp.name, department: emp.department, costCenter: emp.costCenter, project: emp.project };
    });
    const eventOf = (id: string) => events.find((e) => e.employeeId === id && e.period === period);
    out.set(period, computeProjectCost({
      rows, allocations, projects, period, monthlyWorkHours: parameters.monthlyWorkHours,
      baseByEmp,
      bonusByEmp: new Map(active.map((e) => [e.id, eventOf(e.id)?.monthlyBonus ?? 0])),
      otherByEmp: new Map(active.map((e) => [e.id, eventOf(e.id)?.otherAddition ?? 0])),
      defaultProjectByEmp,
    }));
  }
  return out;
}

export interface ProjectEac {
  projectId: string;
  name: string;
  monthly: { period: string; cost: number }[];
  ac: number; // 累計實際成本
  monthsElapsed: number; // 自首次有成本至當期之月數
  burnRate: number; // 月均
  totalMonths: number; // 專案起訖總月數（無起訖→沿用 monthsElapsed）
  runRateEac: number; // 燃燒率外推完工成本
  budget: number;
  varianceRunRate: number; // budget − runRateEac
  pctConsumed: number; // ac / budget
  // EVM（有 %完成 才有）
  pct?: number;
  ev?: number; // earned value
  cpi?: number; // ev / ac
  eacEvm?: number; // budget / cpi
  varianceEvm?: number; // budget − eacEvm
}

const toMonthIdx = (iso: string) => {
  const [y, m] = iso.split("-").map(Number);
  return y * 12 + (m - 1);
};

/** 由逐期成本算各專案 AC／燃燒率／EAC（run-rate＋選用 EVM） */
export function projectEac(
  byPeriod: Map<string, ProjectCostResult>,
  projects: Project[],
  currentPeriod: string,
  percentByProject?: Map<string, number>,
): ProjectEac[] {
  const periods = [...byPeriod.keys()].filter((p) => p <= currentPeriod).sort((a, b) => a.localeCompare(b));
  return projects.map((proj) => {
    const monthly = periods.map((p) => ({
      period: p,
      cost: byPeriod.get(p)?.projects.find((x) => x.projectId === proj.id)?.totalCost ?? 0,
    }));
    const ac = monthly.reduce((a, m) => a + m.cost, 0);
    const firstActive = monthly.findIndex((m) => m.cost > 0);
    const monthsElapsed = firstActive < 0 ? 0 : monthly.length - firstActive;
    const burnRate = monthsElapsed > 0 ? ac / monthsElapsed : 0;
    const totalMonths = proj.startDate && proj.endDate
      ? Math.max(1, toMonthIdx(proj.endDate.slice(0, 7)) - toMonthIdx(proj.startDate.slice(0, 7)) + 1)
      : monthsElapsed || 1;
    const runRateEac = Math.round(burnRate * totalMonths);
    const budget = proj.budget;

    const eac: ProjectEac = {
      projectId: proj.id, name: proj.name || proj.code, monthly, ac, monthsElapsed, burnRate, totalMonths,
      runRateEac, budget, varianceRunRate: budget - runRateEac, pctConsumed: budget > 0 ? ac / budget : 0,
    };

    const pct = percentByProject?.get(proj.id) ?? proj.percentComplete;
    if (pct && pct > 0 && ac > 0 && budget > 0) {
      const ev = budget * pct;
      const cpi = ev / ac;
      const eacEvm = Math.round(budget / cpi); // = ac / pct
      eac.pct = pct; eac.ev = ev; eac.cpi = cpi; eac.eacEvm = eacEvm; eac.varianceEvm = budget - eacEvm;
    }
    return eac;
  });
}
