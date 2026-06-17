// 年度彙整（純函數）：把各月「月結快照」累加為年累計（實際）；缺快照的月份以 recompute 估算並標示。
// 另提供「模擬年度」＝當年已實際月累計 ＋ 剩餘月以當月 run-rate 外推。
import type { PayrollSnapshot } from "@/lib/types";

export interface AnnualMonth {
  period: string;
  snapshot: PayrollSnapshot;
  estimated: boolean; // true＝無月結快照、由目前資料回推（標示估算）
}

export interface AnnualTotals {
  months: number;
  totalCost: number;
  totalSalary: number;
  employerBurden: number;
  overtimePay: number;
  bonusTotal: number;
}

/** 收集某年度、≤ upToPeriod 的各月（快照優先，缺則 recompute 並標 estimated） */
export function annualMonths(
  year: string,
  upToPeriod: string,
  snapshots: PayrollSnapshot[],
  candidatePeriods: string[],
  recompute: (period: string) => PayrollSnapshot | null,
): AnnualMonth[] {
  const snapBy = new Map(snapshots.map((s) => [s.period, s]));
  const periods = [...new Set([...snapBy.keys(), ...candidatePeriods])]
    .filter((p) => p.startsWith(`${year}-`) && p <= upToPeriod)
    .sort((a, b) => a.localeCompare(b));
  const out: AnnualMonth[] = [];
  for (const p of periods) {
    const snap = snapBy.get(p);
    if (snap) out.push({ period: p, snapshot: snap, estimated: false });
    else {
      const r = recompute(p);
      if (r) out.push({ period: p, snapshot: r, estimated: true });
    }
  }
  return out;
}

export function annualTotals(months: AnnualMonth[]): AnnualTotals {
  return months.reduce<AnnualTotals>(
    (a, m) => ({
      months: a.months + 1,
      totalCost: a.totalCost + m.snapshot.totalCost,
      totalSalary: a.totalSalary + m.snapshot.totalSalary,
      employerBurden: a.employerBurden + m.snapshot.employerBurden,
      overtimePay: a.overtimePay + m.snapshot.overtimePay,
      bonusTotal: a.bonusTotal + m.snapshot.bonusTotal,
    }),
    { months: 0, totalCost: 0, totalSalary: 0, employerBurden: 0, overtimePay: 0, bonusTotal: 0 },
  );
}

export interface SimAnnual {
  ytdBefore: number; // 當月之前的當年實際累計（雇主總成本）
  monthsBefore: number; // 當月之前已有實際的月數
  currentMonthCost: number; // 當月（試算）雇主總成本
  remainingMonths: number; // 含當月之剩餘月數（12 − 之前月數）
  projectedAnnual: number; // 模擬全年＝ytdBefore ＋ 當月成本 × 剩餘月
}

/** 模擬年度：以「當月」為 run-rate 外推剩餘月份，接上之前已實際月份 */
export function simulateAnnual(year: string, currentPeriod: string, currentMonthCost: number, snapshots: PayrollSnapshot[]): SimAnnual {
  const before = snapshots.filter((s) => s.period.startsWith(`${year}-`) && s.period < currentPeriod);
  const ytdBefore = before.reduce((a, s) => a + s.totalCost, 0);
  const monthsBefore = before.length;
  const remainingMonths = Math.max(0, 12 - monthsBefore);
  return { ytdBefore, monthsBefore, currentMonthCost, remainingMonths, projectedAnnual: ytdBefore + currentMonthCost * remainingMonths };
}
