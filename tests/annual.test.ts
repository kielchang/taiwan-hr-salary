import { describe, it, expect } from "vitest";
import { annualMonths, annualTotals, simulateAnnual } from "../src/lib/reports/annual";
import type { PayrollSnapshot } from "../src/lib/types";

const snap = (period: string, totalCost: number, bonus = 0): PayrollSnapshot => ({
  period, savedAt: "", headcount: 5, totalSalary: totalCost * 0.7, meanSalary: 0, medianSalary: 0,
  totalCost, employerBurden: totalCost * 0.15, overtimePay: 0, bonusTotal: bonus, gini: 0.3,
});

describe("annualMonths", () => {
  const snaps = [snap("2026-01", 100), snap("2026-02", 110), snap("2025-12", 90)];
  it("快照優先、缺月以 recompute 估算並標 estimated；限當年且 ≤ upTo", () => {
    const months = annualMonths("2026", "2026-03", snaps, ["2026-03"], (p) => snap(p, 120));
    expect(months.map((m) => m.period)).toEqual(["2026-01", "2026-02", "2026-03"]); // 不含 2025-12
    expect(months.find((m) => m.period === "2026-03")!.estimated).toBe(true);
    expect(months.find((m) => m.period === "2026-01")!.estimated).toBe(false);
  });
  it("upTo 之後的月份不納入", () => {
    const months = annualMonths("2026", "2026-01", snaps, [], () => null);
    expect(months.map((m) => m.period)).toEqual(["2026-01"]);
  });
});

describe("annualTotals", () => {
  it("累加各月", () => {
    const months = annualMonths("2026", "2026-12", [snap("2026-01", 100, 5), snap("2026-02", 110, 0)], [], () => null);
    const t = annualTotals(months);
    expect(t.months).toBe(2);
    expect(t.totalCost).toBe(210);
    expect(t.bonusTotal).toBe(5);
  });
});

describe("simulateAnnual", () => {
  it("YTD 之前實際 ＋ 剩餘月×當月 run-rate", () => {
    const snaps = [snap("2026-01", 100), snap("2026-02", 100)]; // 當月＝2026-03
    const s = simulateAnnual("2026", "2026-03", 120, snaps);
    expect(s.monthsBefore).toBe(2);
    expect(s.ytdBefore).toBe(200);
    expect(s.remainingMonths).toBe(10);
    expect(s.projectedAnnual).toBe(200 + 120 * 10); // 1400
  });
  it("年初無前期 → 當月×12", () => {
    const s = simulateAnnual("2026", "2026-01", 100, []);
    expect(s.monthsBefore).toBe(0);
    expect(s.projectedAnnual).toBe(1200);
  });
});
