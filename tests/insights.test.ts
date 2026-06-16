import { describe, it, expect } from "vitest";
import {
  top20Share, analyzeCost, analyzeDistribution, analyzeGrades, analyzeBonus, analyzeRaise,
  analyzeMarket, analyzeTrend, analyzeBudget,
} from "../src/lib/insights";
import type { PayrollSnapshot } from "../src/lib/types";

describe("top20Share", () => {
  it("空陣列回 0", () => expect(top20Share([])).toBe(0));
  it("全相等時，前 20%（至少 1 人）占比合理", () => {
    // 5 人各 100 → 前 1 人 = 100/500 = 0.2
    expect(top20Share([100, 100, 100, 100, 100])).toBeCloseTo(0.2, 5);
  });
  it("高度集中時占比高", () => {
    expect(top20Share([1000, 10, 10, 10, 10])).toBeGreaterThan(0.9);
  });
});

describe("analyzeCost", () => {
  it("totalCost<=0 回空", () => {
    expect(analyzeCost({ totalCost: 0, ot: 0, bonus: 0, burden: 0, costPerHead: [] })).toEqual([]);
  });
  it("加班占比過高 → warn", () => {
    const out = analyzeCost({ totalCost: 1000, ot: 150, bonus: 0, burden: 0, costPerHead: [500, 500] });
    expect(out.some((i) => i.level === "warn" && /加班/.test(i.title))).toBe(true);
  });
  it("加班占比低 → good，且每條意見都有結論文字與佐證", () => {
    const out = analyzeCost({ totalCost: 1000, ot: 10, bonus: 0, burden: 100, costPerHead: [400, 350, 250] });
    expect(out.some((i) => i.level === "good" && /加班/.test(i.title))).toBe(true);
    out.forEach((i) => { expect(i.title.length).toBeGreaterThan(0); expect(i.detail.length).toBeGreaterThan(0); });
    // 有雇主負擔 → 應提到法定負擔
    expect(out.some((i) => /法定負擔/.test(i.title))).toBe(true);
  });
  it("成本集中於少數人 → warn", () => {
    const out = analyzeCost({ totalCost: 1000, ot: 0, bonus: 0, burden: 0, costPerHead: [800, 100, 50, 50] });
    expect(out.some((i) => i.level === "warn" && /集中/.test(i.title))).toBe(true);
  });
});

describe("analyzeDistribution", () => {
  it("少於 2 筆回空", () => {
    expect(analyzeDistribution([50000], [])).toEqual([]);
  });
  it("分布平均 → good", () => {
    const out = analyzeDistribution([40000, 40000, 41000, 39000, 40000], []);
    expect(out.some((i) => i.level === "good")).toBe(true);
  });
  it("差距偏大 → warn", () => {
    const out = analyzeDistribution([20000, 25000, 30000, 200000, 500000], []);
    expect(out.some((i) => i.level === "warn")).toBe(true);
  });
  it("含部門中位差距大 → 產生部門意見", () => {
    const out = analyzeDistribution(
      [30000, 35000, 90000, 100000],
      [{ label: "業務", value: 95000 }, { label: "行政", value: 32000 }],
    );
    expect(out.some((i) => /部門/.test(i.title))).toBe(true);
  });
});

describe("analyzeGrades", () => {
  it("無級距 → info 提示先建立", () => {
    const out = analyzeGrades([], false);
    expect(out).toHaveLength(1);
    expect(out[0].level).toBe("info");
  });
  it("有偏低者 → warn", () => {
    const out = analyzeGrades([{ compaRatio: 0.8, pay: 32000, min: 30000, max: 50000 }], true);
    expect(out.some((i) => i.level === "warn" && /偏低/.test(i.title))).toBe(true);
  });
  it("全部健康 → good", () => {
    const out = analyzeGrades([
      { compaRatio: 1.0, pay: 40000, min: 30000, max: 50000 },
      { compaRatio: 0.95, pay: 38000, min: 30000, max: 50000 },
    ], true);
    expect(out.some((i) => i.level === "good")).toBe(true);
  });
  it("超出級距上下限 → warn", () => {
    const out = analyzeGrades([{ compaRatio: 1.0, pay: 60000, min: 30000, max: 50000 }], true);
    expect(out.some((i) => /超出/.test(i.title))).toBe(true);
  });
});

describe("analyzeBonus", () => {
  it("均分法 → 提示與績效無關", () => {
    const out = analyzeBonus({ method: "equal", totalBonus: 100, targetBudget: 0, rows: [] });
    expect(out.some((i) => /均分/.test(i.title))).toBe(true);
  });
  it("按績效 → good", () => {
    const out = analyzeBonus({ method: "byPerformance", totalBonus: 100, targetBudget: 0, rows: [] });
    expect(out.some((i) => i.level === "good")).toBe(true);
  });
  it("超出預算 → warn；在預算內 → good", () => {
    expect(analyzeBonus({ method: "equal", totalBonus: 1200, targetBudget: 1000, rows: [] }).some((i) => i.level === "warn")).toBe(true);
    expect(analyzeBonus({ method: "equal", totalBonus: 800, targetBudget: 1000, rows: [] }).some((i) => i.level === "good")).toBe(true);
  });
});

describe("analyzeRaise", () => {
  it("差距縮小 → good", () => {
    const out = analyzeRaise({ totalAnnualizedCostDelta: 100000, targetBudget: 0, giniBefore: 0.35, giniAfter: 0.32, avgRaisePct: 3 });
    expect(out.some((i) => i.level === "good" && /縮小/.test(i.title))).toBe(true);
  });
  it("差距擴大 → warn", () => {
    const out = analyzeRaise({ totalAnnualizedCostDelta: 100000, targetBudget: 0, giniBefore: 0.30, giniAfter: 0.34, avgRaisePct: 3 });
    expect(out.some((i) => i.level === "warn" && /擴大/.test(i.title))).toBe(true);
  });
  it("超出年度預算 → warn", () => {
    const out = analyzeRaise({ totalAnnualizedCostDelta: 200000, targetBudget: 100000, giniBefore: 0.3, giniAfter: 0.3, avgRaisePct: 3 });
    expect(out.some((i) => i.level === "warn" && /預算/.test(i.title))).toBe(true);
  });
  it("永遠先報平均調幅", () => {
    const out = analyzeRaise({ totalAnnualizedCostDelta: 0, targetBudget: 0, giniBefore: 0.3, giniAfter: 0.3, avgRaisePct: 2.5 });
    expect(out[0].title).toMatch(/平均調幅/);
  });
});

describe("analyzeMarket", () => {
  it("無市場資料 → info 提示先填市場中位", () => {
    const out = analyzeMarket([{ marketCompaRatio: null }, { marketCompaRatio: null }]);
    expect(out).toHaveLength(1);
    expect(out[0].level).toBe("info");
  });
  it("低於市場者 → warn", () => {
    const out = analyzeMarket([{ marketCompaRatio: 0.8 }, { marketCompaRatio: 0.85 }]);
    expect(out.some((i) => i.level === "warn" && /低於市場/.test(i.title))).toBe(true);
  });
  it("與市場相當 → good", () => {
    const out = analyzeMarket([{ marketCompaRatio: 1.0 }, { marketCompaRatio: 1.02 }]);
    expect(out.some((i) => i.level === "good")).toBe(true);
  });
});

describe("analyzeTrend", () => {
  const snap = (period: string, totalCost: number, medianSalary: number, g: number): PayrollSnapshot => ({
    period, savedAt: "", headcount: 5, totalSalary: 0, meanSalary: 0, medianSalary,
    totalCost, employerBurden: 0, overtimePay: 0, bonusTotal: 0, gini: g,
  });
  it("少於兩期 → info", () => {
    expect(analyzeTrend([snap("2026-01", 100, 40000, 0.3)])[0].level).toBe("info");
  });
  it("成本大幅上升 → warn", () => {
    const out = analyzeTrend([snap("2026-01", 1000000, 40000, 0.3), snap("2026-06", 1200000, 42000, 0.3)]);
    expect(out.some((i) => i.level === "warn" && /人事總成本/.test(i.title))).toBe(true);
  });
  it("Gini 下降 → good（差距縮小）", () => {
    const out = analyzeTrend([snap("2026-01", 1000000, 40000, 0.35), snap("2026-06", 1010000, 41000, 0.30)]);
    expect(out.some((i) => i.level === "good" && /縮小/.test(i.title))).toBe(true);
  });
});

describe("analyzeBudget", () => {
  it("未設預算 → info", () => {
    expect(analyzeBudget({ annualBudget: 0, currentAnnualizedCost: 100, plannedDelta: 0 })[0].level).toBe("info");
  });
  it("超出預算 → warn", () => {
    const out = analyzeBudget({ annualBudget: 1000000, currentAnnualizedCost: 950000, plannedDelta: 100000 });
    expect(out.some((i) => i.level === "warn")).toBe(true);
  });
  it("尚有空間 → good", () => {
    const out = analyzeBudget({ annualBudget: 2000000, currentAnnualizedCost: 1000000, plannedDelta: 100000 });
    expect(out.some((i) => i.level === "good")).toBe(true);
  });
});
