import { describe, it, expect } from "vitest";
import { projectEac, projectCostByPeriod } from "../src/lib/reports/projectTrend";
import type { ProjectCostResult } from "../src/lib/reports/projectCost";
import type { Project } from "../src/lib/types";
import { DEFAULT_PARAMETERS as P } from "../src/config/parameters";
import { DEFAULT_BRACKETS as B } from "../src/config/brackets";
import { SEED_EMPLOYEES, SEED_SALARIES, SEED_DEPENDENTS, SEED_EVENTS, SEED_PERIOD, SEED_PROJECTS, SEED_ALLOCATIONS } from "../src/data/seed";

const proj: Project = { id: "P1", code: "PJ-A", name: "甲案", manager: "", client: "", budget: 1200000, startDate: "2026-01-01", endDate: "2026-12-31", status: "進行中", percentComplete: 0.25 };

// 建構逐期結果：P1 每期成本固定
function byPeriod(costs: Record<string, number>): Map<string, ProjectCostResult> {
  const m = new Map<string, ProjectCostResult>();
  for (const [period, cost] of Object.entries(costs)) {
    m.set(period, {
      projects: [{ projectId: "P1", name: "甲案", hours: 0, fte: 0, base: 0, allowance: 0, ot: 0, bonus: 0, other: 0, burden: 0, totalCost: cost, pctOfCompany: 1, budget: 0, variance: 0 }],
      companyTotal: cost, totalDirectHours: 0, totalHours: 0, utilization: 0,
    });
  }
  return m;
}

describe("projectEac", () => {
  it("AC／燃燒率／run-rate EAC／EVM(CPI) 正確", () => {
    const bp = byPeriod({ "2026-01": 150000, "2026-02": 150000, "2026-03": 150000 });
    const [e] = projectEac(bp, [proj], "2026-03");
    expect(e.ac).toBe(450000);
    expect(e.monthsElapsed).toBe(3);
    expect(e.burnRate).toBe(150000);
    expect(e.totalMonths).toBe(12);
    expect(e.runRateEac).toBe(1800000); // 150000 × 12
    expect(e.varianceRunRate).toBe(1200000 - 1800000);
    expect(e.pctConsumed).toBeCloseTo(0.375, 6);
    // EVM：ev＝budget×0.25＝300000；cpi＝300000/450000；eacEvm＝budget/cpi＝ac/pct＝1,800,000
    expect(e.ev).toBe(300000);
    expect(e.cpi).toBeCloseTo(300000 / 450000, 6);
    expect(e.eacEvm).toBe(1800000);
  });
  it("僅取 ≤ 當期；首次有成本後才算月數", () => {
    const bp = byPeriod({ "2026-01": 0, "2026-02": 100000, "2026-03": 100000, "2026-04": 999 });
    const [e] = projectEac(bp, [proj], "2026-03");
    expect(e.ac).toBe(200000); // 不含 2026-04
    expect(e.monthsElapsed).toBe(2); // 自 02 起
  });
  it("無 %完成 → 無 EVM 欄位", () => {
    const [e] = projectEac(byPeriod({ "2026-01": 100000 }), [{ ...proj, percentComplete: undefined }], "2026-01");
    expect(e.eacEvm).toBeUndefined();
    expect(e.cpi).toBeUndefined();
  });
});

describe("projectCostByPeriod 勾稽", () => {
  it("每期 Σ各專案成本（含未分攤）＝ 該期公司總成本", () => {
    const map = projectCostByPeriod(
      { employees: SEED_EMPLOYEES, salaries: SEED_SALARIES, dependents: SEED_DEPENDENTS, events: SEED_EVENTS, allocations: SEED_ALLOCATIONS, projects: SEED_PROJECTS, parameters: P, brackets: B },
      [SEED_PERIOD],
    );
    const r = map.get(SEED_PERIOD)!;
    const sum = r.projects.reduce((a, p) => a + p.totalCost, 0);
    expect(sum).toBe(r.companyTotal);
    expect(r.companyTotal).toBeGreaterThan(0);
  });
});
