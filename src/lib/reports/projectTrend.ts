// ─────────────────────────────────────────────────────────────────────────
// 跨月專案成本趨勢 ＋ 完工預估（EAC）— 純函數。設計原理：
//
// ── 逐期重算（不吃快照）
//   對每個期間重建當期 PayrollRow（沿用 selectors 的 buildPayrollRows/calculatePayroll，
//   同一套計算邏輯），再跑 computeProjectCost。好處：任何歷史月都可重算、與月結一致。
//
// ── 兩種 EAC（完工總成本預估），並列供對照
//   1) run-rate（燃燒率外推）：burnRate＝AC ÷ 已投入月數；runRateEac＝burnRate × 專案總月數
//      （有起訖用起訖、否則沿用已投入月數）。**免填 %完成**，任何專案都算得出。
//   2) EVM（實獲值，需填 %完成）：EV＝預算×%完成；CPI＝EV ÷ AC；eacEvm＝預算 ÷ CPI（＝AC ÷ %完成）。
//      CPI<1＝超支、>1＝節省；比 run-rate 更反映「進度 vs 花費」，但依賴人工填的完成度。
//   兩法差異＝提醒 PM「是照花錢速度、還是照實際產出」在看完工預估。
// ─────────────────────────────────────────────────────────────────────────
import type { Employee, SalaryStructure, Dependent, MonthlyEvent, Project, Allocation } from "@/lib/types";
import type { Parameters } from "@/config/parameters";
import type { InsuranceBrackets } from "@/config/brackets";
import { isActiveInPeriod, buildPayrollRows } from "@/store/selectors";
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
    const rows = buildPayrollRows(period, { employees, salaries, dependents, events, parameters, brackets });
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
