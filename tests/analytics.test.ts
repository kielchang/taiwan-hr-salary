import { describe, it, expect } from "vitest";
import {
  percentile, percentileSet, mean, coefficientOfVariation, gini, lorenzPoints, histogram,
  compaRatio, rangePenetration, distributeRounded, simulateBonusPool, simulateRaise,
} from "@/lib/analytics";
import { DEFAULT_ANALYTICS } from "@/config/analytics";
import { DEFAULT_PARAMETERS as P } from "@/config/parameters";
import { DEFAULT_BRACKETS as B } from "@/config/brackets";
import type { AnalyticsConfig } from "@/lib/types";
import type { PayrollRow } from "@/store/selectors";

/* 最小 PayrollRow 工廠（只填分析會用到的欄位） */
function row(id: string, name: string, salaryTotal: number, over: Partial<PayrollRow> = {}): PayrollRow {
  return {
    employeeId: id, name, department: over.department ?? "A", costCenter: "", project: "",
    salaryTotal, seniorityMonths: 0, annualLeaveDays: 0,
    insured: { labor: 0, occupational: 0, health: 0, pension: 0 },
    dependents: { healthDependents: 0, taxDependents: 0, billableDependents: 0 },
    overtimePay: 0, grossPay: salaryTotal, leaveDeduction: 0,
    premiums: { laborEmployee: 0, healthEmployee: 0, pensionVoluntary: 0, laborEmployer: 0, occupationalEmployer: 0, healthEmployer: 0, pensionEmployer: 0 },
    personalSupplementary: 0, withheldTax: 0, totalDeductions: 0, netPay: salaryTotal,
    employerBurden: 0, employerTotalCost: salaryTotal,
    taxableSalary: salaryTotal, estimatedTaxThreshold: null,
    withholdingSuggestion: { type: "auto", amount: 0 },
    belowMinWage: false,
    ...over,
  } as PayrollRow;
}

describe("percentile / quartiles", () => {
  it("線性內插與中位數", () => {
    const v = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    expect(percentile(v, 0.5)).toBe(5.5);
    expect(percentileSet(v).median).toBe(5.5);
    expect(percentile([42], 0.9)).toBe(42); // 單值
    expect(percentile([], 0.5)).toBe(0); // 空
  });
});

describe("CV / Gini / Lorenz", () => {
  it("完全平均 → Gini 0、CV 0", () => {
    expect(gini([100, 100, 100])).toBe(0);
    expect(coefficientOfVariation([100, 100, 100])).toBe(0);
  });
  it("極不均 → Gini 趨近 (n-1)/n", () => {
    const g = gini([0, 0, 0, 100]);
    expect(g).toBeCloseTo(0.75, 2);
  });
  it("單筆/空 → Gini 0", () => {
    expect(gini([50])).toBe(0);
    expect(gini([])).toBe(0);
  });
  it("Lorenz 端點為 (0,0) 與 (1,1)", () => {
    const pts = lorenzPoints([10, 20, 30]);
    expect(pts[0]).toEqual({ x: 0, y: 0 });
    expect(pts[pts.length - 1].x).toBeCloseTo(1);
    expect(pts[pts.length - 1].y).toBeCloseTo(1);
  });
  it("mean 空陣列 0", () => expect(mean([])).toBe(0));
});

describe("histogram", () => {
  it("等寬分桶，最大值歸最後一桶，count 加總＝n", () => {
    const h = histogram([1, 2, 3, 4, 5, 6, 7, 8], 4);
    expect(h.length).toBe(4);
    expect(h.reduce((a, b) => a + b.count, 0)).toBe(8);
  });
  it("全相同 → 單桶", () => expect(histogram([5, 5, 5]).length).toBe(1));
});

describe("compaRatio / rangePenetration", () => {
  it("pay=mid→1；邊界 null", () => {
    expect(compaRatio(40000, 40000)).toBe(1);
    expect(compaRatio(40000, 0)).toBeNull();
    expect(rangePenetration(30000, 30000, 50000)).toBe(0);
    expect(rangePenetration(50000, 30000, 50000)).toBe(1);
    expect(rangePenetration(40000, 30000, 50000)).toBe(0.5);
    expect(rangePenetration(40000, 50000, 50000)).toBeNull();
  });
  it("夾在 0..1", () => {
    expect(rangePenetration(20000, 30000, 50000)).toBe(0);
    expect(rangePenetration(60000, 30000, 50000)).toBe(1);
  });
});

describe("distributeRounded", () => {
  it("加總等於 pool（最大餘額法）", () => {
    const out = distributeRounded(1000, [1, 1, 1]);
    expect(out.reduce((a, b) => a + b, 0)).toBe(1000);
  });
  it("總權重 0 → 均分", () => {
    const out = distributeRounded(900, [0, 0, 0]);
    expect(out.reduce((a, b) => a + b, 0)).toBe(900);
    expect(out).toEqual([300, 300, 300]);
  });
  it("按權重比例", () => {
    const out = distributeRounded(1000, [1, 3]); // 250 / 750
    expect(out[0] + out[1]).toBe(1000);
    expect(out[1]).toBeGreaterThan(out[0]);
  });
});

describe("simulateBonusPool", () => {
  const rows = [row("E1", "甲", 40000), row("E2", "乙", 60000)];
  it("固定金額池、按本薪比例：加總＝池、變異數＝合計−目標", () => {
    const cfg: AnalyticsConfig = {
      ...DEFAULT_ANALYTICS,
      scenario: { poolMode: "amount", poolAmount: 100000, poolPercent: 0, method: "proRataBase", targetBudget: 90000, includeSupplementary: false },
    };
    const res = simulateBonusPool(rows, cfg, P, B);
    expect(res.pool).toBe(100000);
    expect(res.totalBonus).toBe(100000);
    expect(res.variance).toBe(10000);
    expect(res.rows[1].bonus).toBeGreaterThan(res.rows[0].bonus); // 乙本薪較高
  });
  it("% 池＝Σ本薪×%", () => {
    const cfg: AnalyticsConfig = {
      ...DEFAULT_ANALYTICS,
      scenario: { poolMode: "percentOfPayroll", poolAmount: 0, poolPercent: 10, method: "equal", targetBudget: 0, includeSupplementary: false },
    };
    const res = simulateBonusPool(rows, cfg, P, B);
    expect(res.pool).toBe(10000); // (40000+60000)*10%
  });
  it("不變更輸入 rows", () => {
    const snapshot = JSON.stringify(rows);
    simulateBonusPool(rows, DEFAULT_ANALYTICS, P, B);
    expect(JSON.stringify(rows)).toBe(snapshot);
  });
  it("空資料安全", () => {
    const res = simulateBonusPool([], DEFAULT_ANALYTICS, P, B);
    expect(res.totalBonus).toBe(0);
  });
});

describe("simulateRaise", () => {
  it("一致 3% 調薪：月增額＝本薪×3%，調薪後雇主保費重算（投保上升→Δ>0）", () => {
    const rows = [row("E1", "甲", 40000)];
    const cfg: AnalyticsConfig = {
      ...DEFAULT_ANALYTICS,
      raiseScenario: { cadence: "annual", budgetMode: "pct", budgetValue: 3, method: "uniformPercent", uniformPct: 3, targetBudget: 0 },
    };
    const res = simulateRaise(rows, cfg, P, B);
    expect(res.rows[0].monthlyIncrease).toBe(1200); // 40000*3%
    expect(res.rows[0].newSalary).toBe(41200);
    expect(res.rows[0].employerDelta).toBeGreaterThan(0); // 41200 進入更高投保級距
    expect(res.totalAnnualizedCostDelta).toBe(res.totalMonthlyCostDelta * 12);
  });
  it("四險全觸頂者調薪：雇主保費不變（Δ=0）", () => {
    const rows = [row("E1", "高薪", 320000)]; // 已超四險全部上限（健保上限 313,000）
    const cfg: AnalyticsConfig = {
      ...DEFAULT_ANALYTICS,
      raiseScenario: { cadence: "annual", budgetMode: "pct", budgetValue: 5, method: "uniformPercent", uniformPct: 5, targetBudget: 0 },
    };
    const res = simulateRaise(rows, cfg, P, B);
    expect(res.rows[0].employerDelta).toBe(0);
    expect(res.rows[0].monthlyIncrease).toBe(16000);
  });
  it("不變更輸入 rows", () => {
    const rows = [row("E1", "甲", 40000)];
    const snapshot = JSON.stringify(rows);
    simulateRaise(rows, DEFAULT_ANALYTICS, P, B);
    expect(JSON.stringify(rows)).toBe(snapshot);
  });
});
