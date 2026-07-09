// 薪酬分析與試算 — 純函數（統計、級距指標、分配、獎金/調薪試算）。
// 只讀既有薪資資料；試算結果不寫回 events/payroll（規劃沙盒）。
import type {
  AnalyticsConfig,
  BonusScenario,
  RaiseScenario,
  PayGrade,
  PayrollSnapshot,
} from "./types";
import type { Parameters } from "@/config/parameters";
import type { InsuranceBrackets } from "@/config/brackets";
import type { PayrollRow } from "@/store/selectors";
import { round } from "./rounding";
import { lookupInsuredAmounts } from "./calc/brackets";
import { insurancePremiums } from "./calc/insurance";
import { personalSupplementary } from "./calc/supplementary";

/* ───────────── 統計（操作於 number[]） ───────────── */

/** 百分位（p∈[0,1]，線性內插）；空陣列回 0 */
export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length === 1) return sorted[0];
  const idx = p * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

export interface PercentileSet {
  p10: number;
  p25: number;
  median: number;
  p75: number;
  p90: number;
}

export function percentileSet(values: number[]): PercentileSet {
  return {
    p10: percentile(values, 0.1),
    p25: percentile(values, 0.25),
    median: percentile(values, 0.5),
    p75: percentile(values, 0.75),
    p90: percentile(values, 0.9),
  };
}

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** 母體標準差 */
export function stddevPop(values: number[]): number {
  if (values.length === 0) return 0;
  const m = mean(values);
  return Math.sqrt(mean(values.map((v) => (v - m) ** 2)));
}

/** 變異係數＝標準差/平均；平均為 0 回 0 */
export function coefficientOfVariation(values: number[]): number {
  const m = mean(values);
  if (m === 0) return 0;
  return stddevPop(values) / m;
}

/** Gini 係數（0＝完全平均、趨近 1＝極不均）；n<2 或總和 0 回 0 */
export function gini(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const total = sorted.reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  let cumWeighted = 0;
  sorted.forEach((v, i) => {
    cumWeighted += (i + 1) * v;
  });
  // G = (2·Σ i·x_i)/(n·Σx) − (n+1)/n
  return (2 * cumWeighted) / (n * total) - (n + 1) / n;
}

/** Lorenz 曲線點（累積人口比 x、累積薪資比 y）；含起點 (0,0)、終點 (1,1) */
export function lorenzPoints(values: number[]): { x: number; y: number }[] {
  const n = values.length;
  if (n === 0) return [{ x: 0, y: 0 }, { x: 1, y: 1 }];
  const sorted = [...values].sort((a, b) => a - b);
  const total = sorted.reduce((a, b) => a + b, 0);
  const pts = [{ x: 0, y: 0 }];
  let cum = 0;
  sorted.forEach((v, i) => {
    cum += v;
    pts.push({ x: (i + 1) / n, y: total === 0 ? (i + 1) / n : cum / total });
  });
  return pts;
}

export interface HistogramBin {
  start: number;
  end: number;
  count: number;
}

/** 等寬直方圖；bins≥1。空陣列回空。 */
export function histogram(values: number[], bins = 8): HistogramBin[] {
  if (values.length === 0 || bins < 1) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return [{ start: min, end: max, count: values.length }];
  const width = (max - min) / bins;
  const out: HistogramBin[] = Array.from({ length: bins }, (_, i) => ({
    start: min + i * width,
    end: min + (i + 1) * width,
    count: 0,
  }));
  for (const v of values) {
    let idx = Math.floor((v - min) / width);
    if (idx >= bins) idx = bins - 1; // 最大值歸最後一桶
    out[idx].count += 1;
  }
  return out;
}

/* ───────────── 級距指標 ───────────── */

/** compa-ratio＝實薪 ÷ 級距中位；mid≤0 回 null */
export function compaRatio(pay: number, mid: number): number | null {
  if (mid <= 0) return null;
  return pay / mid;
}

/** 區間滲透率＝(實薪−min)/(max−min)，夾 0..1；max≤min 回 null */
export function rangePenetration(pay: number, min: number, max: number): number | null {
  if (max <= min) return null;
  const r = (pay - min) / (max - min);
  return Math.max(0, Math.min(1, r));
}

/* ───────────── 分配（四捨五入後以最大餘額法補足，確保加總＝pool） ───────────── */

/** 依權重把 pool 分配為整數金額；總權重 0 → 均分 */
export function distributeRounded(pool: number, weights: number[]): number[] {
  const n = weights.length;
  if (n === 0) return [];
  const totalW = weights.reduce((a, b) => a + b, 0);
  const raw = totalW > 0 ? weights.map((w) => (pool * w) / totalW) : weights.map(() => pool / n);
  const floored = raw.map((x) => Math.floor(x));
  let remainder = round(pool) - floored.reduce((a, b) => a + b, 0);
  // 餘額依小數部分由大到小逐 1 元分配
  const order = raw
    .map((x, i) => ({ i, frac: x - Math.floor(x) }))
    .sort((a, b) => b.frac - a.frac);
  const out = [...floored];
  for (let k = 0; k < order.length && remainder > 0; k++) {
    out[order[k].i] += 1;
    remainder -= 1;
  }
  return out;
}

/* ───────────── 共用：每人權重基礎 ───────────── */

export interface EmpBasis {
  employeeId: string;
  name: string;
  base: number; // 月薪資總額（作為本薪/分配基礎）
  department: string;
  ratingKey: string;
  coefficient: number;
  grade: PayGrade | null;
  compaRatio: number | null; // 對內部級距中位
  rangePenetration: number | null;
  marketCompaRatio: number | null; // 對市場中位（grade.marketMid 填了才有）
}

export function gradeForEmployee(cfg: AnalyticsConfig, employeeId: string): PayGrade | null {
  const gid = cfg.gradeByEmployee[employeeId];
  return cfg.payGrades.find((g) => g.id === gid) ?? null;
}

export function ratingFor(cfg: AnalyticsConfig, employeeId: string): { key: string; coefficient: number } {
  const key = cfg.performanceByEmployee[employeeId] ?? "B";
  const tier = cfg.ratingTiers.find((t) => t.key === key) ?? cfg.ratingTiers.find((t) => t.key === "B");
  return { key, coefficient: tier?.coefficient ?? 1 };
}

export function buildBasis(rows: PayrollRow[], cfg: AnalyticsConfig): EmpBasis[] {
  return rows.map((r) => {
    const grade = gradeForEmployee(cfg, r.employeeId);
    const { key, coefficient } = ratingFor(cfg, r.employeeId);
    return {
      employeeId: r.employeeId,
      name: r.name,
      base: r.salaryTotal,
      department: r.department,
      ratingKey: key,
      coefficient,
      grade,
      compaRatio: grade ? compaRatio(r.salaryTotal, grade.mid) : null,
      rangePenetration: grade ? rangePenetration(r.salaryTotal, grade.min, grade.max) : null,
      marketCompaRatio: grade?.marketMid ? compaRatio(r.salaryTotal, grade.marketMid) : null,
    };
  });
}

/** merit 加碼：級距內偏低者加碼（無級距→1） */
function rangeAdjust(rp: number | null): number {
  if (rp == null) return 1;
  return Math.max(0.8, Math.min(1.2, 1.2 - 0.4 * rp));
}

function allocationWeights(basis: EmpBasis[], method: BonusScenario["method"] | RaiseScenario["method"]): number[] {
  switch (method) {
    case "equal":
    case "uniformPercent":
      return basis.map(() => 1);
    case "proRataBase":
      return basis.map((b) => b.base);
    case "byPerformance":
      return basis.map((b) => b.base * b.coefficient);
    case "meritMatrix":
      return basis.map((b) => b.base * b.coefficient * rangeAdjust(b.rangePenetration));
    default:
      return basis.map(() => 1);
  }
}

/* ───────────── 獎金／分紅試算 ───────────── */

export interface BonusSimRow {
  employeeId: string;
  name: string;
  department: string;
  base: number;
  ratingKey: string;
  coefficient: number;
  weight: number;
  bonus: number;
  supplementary: number; // 個人二代健保概估（含本次）
}

export interface BonusSimResult {
  rows: BonusSimRow[];
  pool: number;
  totalBonus: number;
  totalSupplementary: number;
  targetBudget: number;
  variance: number; // totalBonus − targetBudget
}

export function resolveBonusPool(scenario: BonusScenario, sumBase: number): number {
  return scenario.poolMode === "amount"
    ? Math.max(0, scenario.poolAmount)
    : round((sumBase * Math.max(0, scenario.poolPercent)) / 100);
}

export function simulateBonusPool(
  rows: PayrollRow[],
  cfg: AnalyticsConfig,
  parameters: Parameters,
  brackets: InsuranceBrackets,
): BonusSimResult {
  const basis = buildBasis(rows, cfg);
  const sumBase = basis.reduce((a, b) => a + b.base, 0);
  const pool = resolveBonusPool(cfg.scenario, sumBase);
  const weights = allocationWeights(basis, cfg.scenario.method);
  const bonuses = distributeRounded(pool, weights);

  const rowsOut: BonusSimRow[] = basis.map((b, i) => {
    const bonus = bonuses[i];
    // 個人二代健保概估：以該員工健保投保金額為門檻基準，假設本次為當年首次獎金
    const health = lookupInsuredAmounts(brackets, b.base).health;
    const supplementary = cfg.scenario.includeSupplementary
      ? personalSupplementary(bonus, bonus, health, parameters)
      : 0;
    return {
      employeeId: b.employeeId,
      name: b.name,
      department: b.department,
      base: b.base,
      ratingKey: b.ratingKey,
      coefficient: b.coefficient,
      weight: weights[i],
      bonus,
      supplementary,
    };
  });

  const totalBonus = rowsOut.reduce((a, r) => a + r.bonus, 0);
  return {
    rows: rowsOut,
    pool,
    totalBonus,
    totalSupplementary: rowsOut.reduce((a, r) => a + r.supplementary, 0),
    targetBudget: cfg.scenario.targetBudget,
    variance: totalBonus - cfg.scenario.targetBudget,
  };
}

/* ───────────── 年度／季度調薪試算（會改變投保金額 → 重算保費） ───────────── */

export interface RaiseSimRow {
  employeeId: string;
  name: string;
  department: string;
  ratingKey: string;
  currentSalary: number;
  raisePct: number; // 調幅 %
  newSalary: number;
  monthlyIncrease: number; // 加薪額（不含雇主負擔）
  employerDelta: number; // Δ雇主四險負擔（月）
  monthlyCostDelta: number; // 月增額＝加薪額＋雇主 Δ
  annualizedCostDelta: number; // 年化（×12）
  newCompaRatio: number | null;
}

export interface RaiseSimResult {
  rows: RaiseSimRow[];
  cadence: RaiseScenario["cadence"];
  totalMonthlyIncrease: number;
  totalMonthlyCostDelta: number;
  totalAnnualizedCostDelta: number;
  avgRaisePct: number;
  targetBudget: number;
  variance: number; // annualized − targetBudget
  giniBefore: number;
  giniAfter: number;
  cvBefore: number;
  cvAfter: number;
}

/** 員工現職的雇主四險負擔（月）：依投保金額重算雇主端 */
function employerBurdenOf(salaryTotal: number, billableDeps: number, parameters: Parameters, brackets: InsuranceBrackets): number {
  const insured = lookupInsuredAmounts(brackets, salaryTotal);
  const pr = insurancePremiums(insured, billableDeps, 0, parameters);
  return pr.laborEmployer + pr.occupationalEmployer + pr.healthEmployer + pr.pensionEmployer;
}

export function simulateRaise(
  rows: PayrollRow[],
  cfg: AnalyticsConfig,
  parameters: Parameters,
  brackets: InsuranceBrackets,
): RaiseSimResult {
  const rs = cfg.raiseScenario;
  const basis = buildBasis(rows, cfg);
  const sumBase = basis.reduce((a, b) => a + b.base, 0);

  // 計算各員工「月增額（加薪額）」
  let increases: number[];
  if (rs.method === "uniformPercent") {
    increases = basis.map((b) => round((b.base * Math.max(0, rs.uniformPct)) / 100));
  } else {
    const pool =
      rs.budgetMode === "amount"
        ? Math.max(0, rs.budgetValue)
        : round((sumBase * Math.max(0, rs.budgetValue)) / 100);
    const weights = allocationWeights(basis, rs.method);
    increases = distributeRounded(pool, weights);
  }

  const billableByEmp = new Map(rows.map((r) => [r.employeeId, r.dependents.billableDependents]));
  const periodMul = 12; // 年化（年/季皆以年化呈現；季增額另於 UI ×3 顯示）

  const rowsOut: RaiseSimRow[] = basis.map((b, i) => {
    const inc = increases[i];
    const newSalary = b.base + inc;
    const billable = billableByEmp.get(b.employeeId) ?? 0;
    const burdenBefore = employerBurdenOf(b.base, billable, parameters, brackets);
    const burdenAfter = employerBurdenOf(newSalary, billable, parameters, brackets);
    const employerDelta = burdenAfter - burdenBefore;
    const monthlyCostDelta = inc + employerDelta;
    return {
      employeeId: b.employeeId,
      name: b.name,
      department: b.department,
      ratingKey: b.ratingKey,
      currentSalary: b.base,
      raisePct: b.base > 0 ? (inc / b.base) * 100 : 0,
      newSalary,
      monthlyIncrease: inc,
      employerDelta,
      monthlyCostDelta,
      annualizedCostDelta: monthlyCostDelta * periodMul,
      newCompaRatio: b.grade ? compaRatio(newSalary, b.grade.mid) : null,
    };
  });

  const beforeVals = basis.map((b) => b.base);
  const afterVals = rowsOut.map((r) => r.newSalary);
  const totalMonthlyIncrease = rowsOut.reduce((a, r) => a + r.monthlyIncrease, 0);
  const totalMonthlyCostDelta = rowsOut.reduce((a, r) => a + r.monthlyCostDelta, 0);
  const totalAnnualizedCostDelta = totalMonthlyCostDelta * periodMul;

  return {
    rows: rowsOut,
    cadence: rs.cadence,
    totalMonthlyIncrease,
    totalMonthlyCostDelta,
    totalAnnualizedCostDelta,
    avgRaisePct: mean(rowsOut.map((r) => r.raisePct)),
    targetBudget: rs.targetBudget,
    variance: totalAnnualizedCostDelta - rs.targetBudget,
    giniBefore: gini(beforeVals),
    giniAfter: gini(afterVals),
    cvBefore: coefficientOfVariation(beforeVals),
    cvAfter: coefficientOfVariation(afterVals),
  };
}

/* ───────────── 薪酬趨勢快照 ───────────── */

/** 由當期結算列＋當月獎金合計，計算可保存的趨勢快照（不含個資） */
export function buildSnapshot(rows: PayrollRow[], period: string, bonusTotal: number): PayrollSnapshot {
  const salaries = rows.map((r) => r.salaryTotal);
  // 外幣：獨立序列（**不併入 totalCost**），供年報/趨勢以獨立線呈現。無外幣＝undefined（不佔快照）。
  const foreignTwdTotal = rows.reduce((a, r) => a + (r.foreignPay?.twd ?? 0), 0);
  const foreignByCurrency: Record<string, number> = {};
  for (const r of rows) if (r.foreignPay && r.foreignPay.amount) {
    foreignByCurrency[r.foreignPay.currency] = (foreignByCurrency[r.foreignPay.currency] ?? 0) + r.foreignPay.amount;
  }
  const hasForeign = foreignTwdTotal > 0 || Object.keys(foreignByCurrency).length > 0;
  return {
    period,
    savedAt: new Date().toISOString(),
    headcount: rows.length,
    totalSalary: salaries.reduce((a, b) => a + b, 0),
    meanSalary: round(mean(salaries)),
    medianSalary: round(percentile(salaries, 0.5)),
    totalCost: rows.reduce((a, r) => a + r.employerTotalCost, 0),
    employerBurden: rows.reduce((a, r) => a + r.employerBurden, 0),
    overtimePay: rows.reduce((a, r) => a + r.overtimePay, 0),
    bonusTotal,
    gini: gini(salaries),
    ...(hasForeign ? { foreignTwdTotal, foreignByCurrency } : {}),
  };
}

/* ───────────── 調薪方案並排比較（同預算下比較分配法） ───────────── */

export interface RaiseMethodCompareRow {
  method: RaiseScenario["method"];
  label: string;
  totalMonthlyIncrease: number;
  totalAnnualizedCostDelta: number;
  avgRaisePct: number;
  giniAfter: number;
  variance: number; // 年化 − 目標預算
}

const RAISE_METHOD_LABELS: Record<RaiseScenario["method"], string> = {
  uniformPercent: "一致調幅 %",
  proRataBase: "按本薪分配",
  byPerformance: "按績效係數",
  meritMatrix: "merit matrix",
};

/**
 * 以目前情境的預算/調幅設定，分別套用四種分配法跑 simulateRaise，
 * 回傳各法的年化成本、平均調幅、調後 Gini 與預算差異，供並排比較。
 */
export function compareRaiseMethods(
  rows: PayrollRow[],
  cfg: AnalyticsConfig,
  parameters: Parameters,
  brackets: InsuranceBrackets,
): RaiseMethodCompareRow[] {
  const methods: RaiseScenario["method"][] = ["uniformPercent", "proRataBase", "byPerformance", "meritMatrix"];
  return methods.map((method) => {
    const r = simulateRaise(rows, { ...cfg, raiseScenario: { ...cfg.raiseScenario, method } }, parameters, brackets);
    return {
      method,
      label: RAISE_METHOD_LABELS[method],
      totalMonthlyIncrease: r.totalMonthlyIncrease,
      totalAnnualizedCostDelta: r.totalAnnualizedCostDelta,
      avgRaisePct: r.avgRaisePct,
      giniAfter: r.giniAfter,
      variance: r.variance,
    };
  });
}
