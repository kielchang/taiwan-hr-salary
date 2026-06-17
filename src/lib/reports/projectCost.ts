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

export function computeProjectCost(input: ProjectCostInput): ProjectCostResult {
  const { rows, allocations, projects, period, monthlyWorkHours, baseByEmp, bonusByEmp, otherByEmp, defaultProjectByEmp } = input;
  const nameOf = new Map(projects.map((p) => [p.id, p.name || p.code]));
  const allocOf = new Map(allocations.filter((a) => a.period === period).map((a) => [a.employeeId, a]));

  // 累加器：projectId → 各元件
  const blank = (): Omit<ProjectAgg, "projectId" | "name" | "fte" | "pctOfCompany" | "budget" | "variance"> =>
    ({ hours: 0, base: 0, allowance: 0, ot: 0, bonus: 0, other: 0, burden: 0, totalCost: 0 });
  const acc = new Map<string, ReturnType<typeof blank>>();
  const bump = (pid: string) => { const a = acc.get(pid) ?? blank(); acc.set(pid, a); return a; };

  let companyTotal = 0;
  let totalDirectHours = 0;
  let totalHours = 0;

  for (const r of rows) {
    const factor = r.prorationFactor ?? 1;
    const base = Math.round((baseByEmp.get(r.employeeId) ?? 0) * factor);
    const allowance = r.paidSalaryTotal - base; // 吸收捨入；base+allowance＝實付固定薪資
    const ot = r.overtimePay;
    const bonus = bonusByEmp.get(r.employeeId) ?? 0;
    const other = otherByEmp.get(r.employeeId) ?? 0;
    const burden = r.employerBurden;
    companyTotal += r.employerTotalCost;

    // 解析權重與對應 projectId（含未分攤殘量）
    const alloc = allocOf.get(r.employeeId);
    let ids: string[];
    let weights: number[];
    let lineHours: number[] = []; // 與 ids 對齊（hours 模式；未分攤桶也記殘時數）
    if (alloc && alloc.lines.length > 0) {
      ids = alloc.lines.map((l) => l.projectId);
      weights = alloc.lines.map((l) => Math.max(0, l.value));
      if (alloc.mode === "hours") {
        lineHours = [...weights];
        const residual = monthlyWorkHours - weights.reduce((a, b) => a + b, 0);
        if (residual > 0) { ids.push(UNALLOCATED_ID); weights.push(residual); lineHours.push(residual); }
        totalDirectHours += weights.reduce((a, b, i) => a + (ids[i] === UNALLOCATED_ID ? 0 : b), 0);
        totalHours += monthlyWorkHours;
      } else {
        const residual = 100 - weights.reduce((a, b) => a + b, 0);
        if (residual > 0) { ids.push(UNALLOCATED_ID); weights.push(residual); }
        lineHours = ids.map(() => 0);
      }
    } else {
      const pid = defaultProjectByEmp.get(r.employeeId) || UNALLOCATED_ID;
      ids = [pid];
      weights = [1];
      lineHours = [0];
    }

    const split = (pool: number) => distributeRounded(pool, weights);
    const sBase = split(base), sAllow = split(allowance), sOt = split(ot), sOther = split(other), sBurden = split(burden);
    // 獎金：預設依比例；設 bonusProjectId 則整筆直接歸屬
    let sBonus: number[];
    if (alloc?.bonusProjectId) {
      sBonus = ids.map((pid) => (pid === alloc.bonusProjectId ? bonus : 0));
      if (!ids.includes(alloc.bonusProjectId) && bonus > 0) {
        ids = [...ids, alloc.bonusProjectId]; weights = [...weights, 0]; lineHours = [...lineHours, 0];
        sBase.push(0); sAllow.push(0); sOt.push(0); sOther.push(0); sBurden.push(0);
        sBonus = ids.map((pid) => (pid === alloc.bonusProjectId ? bonus : 0));
      }
    } else {
      sBonus = split(bonus);
    }

    ids.forEach((pid, i) => {
      const a = bump(pid);
      a.base += sBase[i]; a.allowance += sAllow[i]; a.ot += sOt[i]; a.other += sOther[i];
      a.burden += sBurden[i]; a.bonus += sBonus[i]; a.hours += lineHours[i] ?? 0;
      a.totalCost += sBase[i] + sAllow[i] + sOt[i] + sOther[i] + sBurden[i] + sBonus[i];
    });
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
