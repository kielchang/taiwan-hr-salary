// 專案別人事成本：依工時/百分比比例，把每位員工的「全載成本」逐元件分攤到各專案，
// 未投入專案的殘量歸「未分攤/間接」桶。以 distributeRounded 確保整數加總恆等，
// 滿足勾稽：Σ各專案成本（含未分攤）＝ Σ全公司 employerTotalCost。純函數。
import type { PayrollRow } from "@/store/selectors";
import type { Project, Allocation } from "@/lib/types";
import { distributeRounded } from "@/lib/analytics";

export const UNALLOCATED_ID = "__unallocated__";

export interface ProjectAgg {
  projectId: string; // UNALLOCATED_ID＝未分攤/間接
  name: string;
  hours: number; // 投入工時（hours 模式）
  fte: number; // hours / 月計薪時數
  base: number;
  allowance: number;
  ot: number;
  bonus: number;
  other: number;
  burden: number;
  totalCost: number;
  pctOfCompany: number;
  budget: number; // 期間化後之預算（monthlyBudgetShare）
  variance: number; // budget − totalCost（正＝結餘）
}

export interface ProjectCostInput {
  rows: PayrollRow[];
  allocations: Allocation[];
  projects: Project[];
  period: string; // yyyy-mm
  monthlyWorkHours: number; // FTE 分母（240）
  baseByEmp: Map<string, number>; // 員工本薪（全月）
  bonusByEmp: Map<string, number>; // 當月獎金
  otherByEmp: Map<string, number>; // 當月其他加項
  defaultProjectByEmp: Map<string, string>; // employeeId → 預設 projectId（無分攤時 fallback）
}

export interface ProjectCostResult {
  projects: ProjectAgg[]; // 含未分攤桶（若有）
  companyTotal: number;
  totalDirectHours: number;
  totalHours: number;
  utilization: number; // 直接工時 / 總工時（hours 模式）
}

/** 專案整案預算依起訖平均攤到「當期」；無起訖或不在期間內回 0 */
export function monthlyBudgetShare(project: Project, period: string): number {
  if (!project.budget || !project.startDate || !project.endDate) return 0;
  const toM = (iso: string) => {
    const [y, m] = iso.split("-").map(Number);
    return y * 12 + (m - 1);
  };
  const s = toM(project.startDate);
  const e = toM(project.endDate.slice(0, 7));
  const pm = toM(period);
  if (pm < s || pm > e) return 0;
  const months = e - s + 1;
  if (months <= 0) return 0;
  return Math.round(project.budget / months);
}

/** 單一員工對各專案的貢獻（供彙總、矩陣、charge-out 共用同一切分邏輯） */
export interface EmpContribution {
  projectId: string;
  department: string;
  base: number; allowance: number; ot: number; bonus: number; other: number; burden: number;
  totalCost: number;
  hours: number; // 直接工時（hours 模式；未分攤桶記殘量）
  standardValue: number; // 標準工率 × 等量工時（charge-out）
}

interface AllocCtx {
  monthlyWorkHours: number;
  baseByEmp: Map<string, number>;
  bonusByEmp: Map<string, number>;
  otherByEmp: Map<string, number>;
  defaultProjectByEmp: Map<string, string>;
}

/** 把一位員工的全載成本依分攤切到各專案（含未分攤桶）；回傳逐專案貢獻與工時資訊。 */
function allocateEmployee(r: PayrollRow, alloc: Allocation | undefined, ctx: AllocCtx): {
  contributions: EmpContribution[]; directHours: number; availHours: number; hoursMode: boolean;
} {
  const { monthlyWorkHours, baseByEmp, bonusByEmp, otherByEmp, defaultProjectByEmp } = ctx;
  const factor = r.prorationFactor ?? 1;
  const base = Math.round((baseByEmp.get(r.employeeId) ?? 0) * factor);
  const allowance = r.paidSalaryTotal - base;
  const ot = r.overtimePay;
  const bonus = bonusByEmp.get(r.employeeId) ?? 0;
  const other = otherByEmp.get(r.employeeId) ?? 0;
  const burden = r.employerBurden;
  const rate = monthlyWorkHours > 0 ? r.employerTotalCost / monthlyWorkHours : 0;

  let ids: string[];
  let weights: number[];
  let lineHours: number[] = [];
  let eqHours: number[]; // charge-out 等量工時
  let hoursMode = false;
  let availHours = 0;
  if (alloc && alloc.lines.length > 0) {
    ids = alloc.lines.map((l) => l.projectId);
    weights = alloc.lines.map((l) => Math.max(0, l.value));
    if (alloc.mode === "hours") {
      hoursMode = true;
      availHours = alloc.availableHours ?? monthlyWorkHours;
      lineHours = [...weights];
      const residual = availHours - weights.reduce((a, b) => a + b, 0);
      if (residual > 0) { ids.push(UNALLOCATED_ID); weights.push(residual); lineHours.push(residual); }
      eqHours = [...lineHours];
    } else {
      const residual = 100 - weights.reduce((a, b) => a + b, 0);
      if (residual > 0) { ids.push(UNALLOCATED_ID); weights.push(residual); }
      lineHours = ids.map(() => 0);
      eqHours = weights.map((w) => (w / 100) * monthlyWorkHours);
    }
  } else {
    const pid = defaultProjectByEmp.get(r.employeeId) || UNALLOCATED_ID;
    ids = [pid]; weights = [1]; lineHours = [0]; eqHours = [monthlyWorkHours];
  }

  const split = (pool: number) => distributeRounded(pool, weights);
  const sBase = split(base), sAllow = split(allowance), sOt = split(ot), sOther = split(other), sBurden = split(burden);
  let sBonus: number[];
  if (alloc?.bonusProjectId) {
    if (!ids.includes(alloc.bonusProjectId) && bonus > 0) {
      ids = [...ids, alloc.bonusProjectId]; weights = [...weights, 0]; lineHours = [...lineHours, 0]; eqHours = [...eqHours, 0];
      sBase.push(0); sAllow.push(0); sOt.push(0); sOther.push(0); sBurden.push(0);
    }
    sBonus = ids.map((pid) => (pid === alloc.bonusProjectId ? bonus : 0));
  } else {
    sBonus = split(bonus);
  }

  const contributions: EmpContribution[] = ids.map((pid, i) => ({
    projectId: pid, department: r.department || "（未填）",
    base: sBase[i], allowance: sAllow[i], ot: sOt[i], bonus: sBonus[i], other: sOther[i], burden: sBurden[i],
    totalCost: sBase[i] + sAllow[i] + sOt[i] + sOther[i] + sBurden[i] + sBonus[i],
    hours: lineHours[i] ?? 0,
    standardValue: Math.round(rate * (eqHours[i] ?? 0)),
  }));
  const directHours = contributions.reduce((a, c) => a + (c.projectId === UNALLOCATED_ID ? 0 : c.hours), 0);
  return { contributions, directHours, availHours, hoursMode };
}

export function computeProjectCost(input: ProjectCostInput): ProjectCostResult {
  const { rows, allocations, projects, period, monthlyWorkHours, baseByEmp, bonusByEmp, otherByEmp, defaultProjectByEmp } = input;
  const nameOf = new Map(projects.map((p) => [p.id, p.name || p.code]));
  const allocOf = new Map(allocations.filter((a) => a.period === period).map((a) => [a.employeeId, a]));

  // 累加器：projectId → 各元件
  const blank = (): Omit<ProjectAgg, "projectId" | "name" | "fte" | "pctOfCompany" | "budget" | "variance"> =>
    ({ hours: 0, base: 0, allowance: 0, ot: 0, bonus: 0, other: 0, burden: 0, totalCost: 0 });
  const acc = new Map<string, ReturnType<typeof blank>>();
  const bump = (pid: string) => { const a = acc.get(pid) ?? blank(); acc.set(pid, a); return a; };

  const ctx: AllocCtx = { monthlyWorkHours, baseByEmp, bonusByEmp, otherByEmp, defaultProjectByEmp };
  let companyTotal = 0;
  let totalDirectHours = 0;
  let totalHours = 0;

  for (const r of rows) {
    companyTotal += r.employerTotalCost;
    const { contributions, directHours, availHours, hoursMode } = allocateEmployee(r, allocOf.get(r.employeeId), ctx);
    if (hoursMode) { totalDirectHours += directHours; totalHours += availHours; }
    for (const c of contributions) {
      const a = bump(c.projectId);
      a.base += c.base; a.allowance += c.allowance; a.ot += c.ot; a.other += c.other;
      a.burden += c.burden; a.bonus += c.bonus; a.hours += c.hours; a.totalCost += c.totalCost;
    }
  }

  // 輸出：所有主檔專案（即使 0 成本，供預算 vs 實際）＋有資料的未知專案＋未分攤桶（末）
  const out: ProjectAgg[] = [];
  const pushAgg = (pid: string, name: string) => {
    const a = acc.get(pid) ?? blank();
    const project = projects.find((p) => p.id === pid);
    const budget = project ? monthlyBudgetShare(project, period) : 0;
    out.push({
      projectId: pid, name,
      hours: a.hours, fte: monthlyWorkHours > 0 ? a.hours / monthlyWorkHours : 0,
      base: a.base, allowance: a.allowance, ot: a.ot, bonus: a.bonus, other: a.other, burden: a.burden,
      totalCost: a.totalCost, pctOfCompany: companyTotal > 0 ? a.totalCost / companyTotal : 0,
      budget, variance: budget - a.totalCost,
    });
  };
  for (const p of projects) pushAgg(p.id, p.name || p.code);
  for (const pid of acc.keys()) if (pid !== UNALLOCATED_ID && !nameOf.has(pid)) pushAgg(pid, pid);
  if (acc.has(UNALLOCATED_ID)) pushAgg(UNALLOCATED_ID, "未分攤／間接");

  return {
    projects: out,
    companyTotal,
    totalDirectHours,
    totalHours,
    utilization: totalHours > 0 ? totalDirectHours / totalHours : 0,
  };
}

/* ───────── 專案×部門矩陣 ───────── */
export interface ProjectDeptMatrix {
  rowLabels: string[]; // 專案（含未分攤）
  colLabels: string[]; // 部門
  cells: (number | null)[][]; // 成本（null＝0）
}

/** 專案×部門人事成本矩陣（重用 allocateEmployee；每列和＝該專案總成本） */
export function projectDeptMatrix(input: ProjectCostInput): ProjectDeptMatrix {
  const { rows, allocations, projects, period, monthlyWorkHours, baseByEmp, bonusByEmp, otherByEmp, defaultProjectByEmp } = input;
  const ctx: AllocCtx = { monthlyWorkHours, baseByEmp, bonusByEmp, otherByEmp, defaultProjectByEmp };
  const allocOf = new Map(allocations.filter((a) => a.period === period).map((a) => [a.employeeId, a]));
  const nameOf = new Map(projects.map((p) => [p.id, p.name || p.code]));
  const depts = [...new Set(rows.map((r) => r.department || "（未填）"))];
  const grid = new Map<string, Map<string, number>>(); // projectId → dept → cost
  for (const r of rows) {
    const { contributions } = allocateEmployee(r, allocOf.get(r.employeeId), ctx);
    for (const c of contributions) {
      const row = grid.get(c.projectId) ?? new Map<string, number>();
      row.set(c.department, (row.get(c.department) ?? 0) + c.totalCost);
      grid.set(c.projectId, row);
    }
  }
  const pids = [...grid.keys()].sort((a, b) => (a === UNALLOCATED_ID ? 1 : b === UNALLOCATED_ID ? -1 : 0));
  return {
    rowLabels: pids.map((pid) => (pid === UNALLOCATED_ID ? "未分攤／間接" : nameOf.get(pid) ?? pid)),
    colLabels: depts,
    cells: pids.map((pid) => depts.map((d) => grid.get(pid)?.get(d) ?? null)),
  };
}

/* ───────── 標準工率(charge-out)差異 ───────── */
export interface ChargeOutRow {
  projectId: string;
  name: string;
  actual: number; // 實際分攤成本
  standard: number; // 標準工率 × 投入工時
  variance: number; // standard − actual（工時＝標準時近 0）
}

/** 以自動工率（全載成本÷標準工時）算各專案應計 vs 實際差異 */
export function chargeOutVariance(input: ProjectCostInput): ChargeOutRow[] {
  const { rows, allocations, projects, period, monthlyWorkHours, baseByEmp, bonusByEmp, otherByEmp, defaultProjectByEmp } = input;
  const ctx: AllocCtx = { monthlyWorkHours, baseByEmp, bonusByEmp, otherByEmp, defaultProjectByEmp };
  const allocOf = new Map(allocations.filter((a) => a.period === period).map((a) => [a.employeeId, a]));
  const nameOf = new Map(projects.map((p) => [p.id, p.name || p.code]));
  const acc = new Map<string, { actual: number; standard: number }>();
  for (const r of rows) {
    const { contributions } = allocateEmployee(r, allocOf.get(r.employeeId), ctx);
    for (const c of contributions) {
      const a = acc.get(c.projectId) ?? { actual: 0, standard: 0 };
      a.actual += c.totalCost; a.standard += c.standardValue;
      acc.set(c.projectId, a);
    }
  }
  return [...acc.entries()].map(([pid, a]) => ({
    projectId: pid,
    name: pid === UNALLOCATED_ID ? "未分攤／間接" : nameOf.get(pid) ?? pid,
    actual: a.actual, standard: a.standard, variance: a.standard - a.actual,
  }));
}
