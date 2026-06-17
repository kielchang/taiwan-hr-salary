import { describe, it, expect } from "vitest";
import { computeProjectCost, monthlyBudgetShare, projectDeptMatrix, chargeOutVariance, UNALLOCATED_ID } from "../src/lib/reports/projectCost";
import type { PayrollRow } from "../src/store/selectors";
import type { Project, Allocation } from "../src/lib/types";

const P = "2026-03";
const projects: Project[] = [
  { id: "P1", code: "PJ-A", name: "專案A", manager: "", client: "", budget: 1200000, startDate: "2026-01-01", endDate: "2026-12-31", status: "進行中" },
  { id: "P2", code: "PJ-B", name: "專案B", manager: "", client: "", budget: 0, startDate: "", endDate: "", status: "進行中" },
];

/** 最小 PayrollRow（只填引擎用到的欄位） */
function row(id: string, opts: { paid: number; ot?: number; burden?: number; totalCost: number }): PayrollRow {
  return {
    employeeId: id, name: id, department: id === "E1" ? "研發" : "業務", costCenter: "", project: "",
    salaryTotal: opts.paid, prorationFactor: 1, paidSalaryTotal: opts.paid,
    overtimePay: opts.ot ?? 0, employerBurden: opts.burden ?? 0, employerTotalCost: opts.totalCost,
  } as PayrollRow;
}

// E1：實付40000、加班0、雇主8000 → 48000；E2：實付60000、加班2000、獎金10000、雇主12000 → 84000
const rows = [
  row("E1", { paid: 40000, burden: 8000, totalCost: 48000 }),
  row("E2", { paid: 60000, ot: 2000, burden: 12000, totalCost: 84000 }),
];
const baseByEmp = new Map([["E1", 40000], ["E2", 60000]]);
const bonusByEmp = new Map([["E2", 10000]]);
const otherByEmp = new Map<string, number>();
const COMPANY = 48000 + 84000;

function run(allocations: Allocation[], defaults: [string, string][] = []) {
  return computeProjectCost({
    rows, allocations, projects, period: P, monthlyWorkHours: 240,
    baseByEmp, bonusByEmp, otherByEmp, defaultProjectByEmp: new Map(defaults),
  });
}
const sum = (r: ReturnType<typeof run>, k: "totalCost" | "base" | "bonus") => r.projects.reduce((a, p) => a + p[k], 0);

describe("computeProjectCost 勾稽不變量", () => {
  it("Σ各專案成本（含未分攤）＝ 公司總成本；逐元件 tie-out", () => {
    const r = run([
      { employeeId: "E1", period: P, mode: "hours", lines: [{ projectId: "P1", value: 120 }, { projectId: "P2", value: 120 }] },
      { employeeId: "E2", period: P, mode: "pct", lines: [{ projectId: "P1", value: 50 }, { projectId: "P2", value: 50 }] },
    ]);
    expect(r.companyTotal).toBe(COMPANY);
    expect(sum(r, "totalCost")).toBe(COMPANY);
    expect(sum(r, "base")).toBe(100000); // 40000+60000
    expect(sum(r, "bonus")).toBe(10000);
    expect(r.projects.find((p) => p.projectId === UNALLOCATED_ID)).toBeUndefined(); // 全額分攤
  });

  it("hours 與 pct 等價（120/120 ＝ 50/50）", () => {
    const h = run([{ employeeId: "E1", period: P, mode: "hours", lines: [{ projectId: "P1", value: 120 }, { projectId: "P2", value: 120 }] }]);
    const p = run([{ employeeId: "E1", period: P, mode: "pct", lines: [{ projectId: "P1", value: 50 }, { projectId: "P2", value: 50 }] }]);
    const totOf = (r: ReturnType<typeof run>, pid: string) => r.projects.find((x) => x.projectId === pid)!.totalCost;
    expect(totOf(h, "P1")).toBe(totOf(p, "P1"));
    expect(totOf(h, "P2")).toBe(totOf(p, "P2"));
  });

  it("殘量歸未分攤桶；FTE 與稼動率", () => {
    // E2 給預設專案 P2，避免其無分攤也落入桶，以單獨檢驗 E1 殘量
    const r = run([{ employeeId: "E1", period: P, mode: "hours", lines: [{ projectId: "P1", value: 120 }] }], [["E2", "P2"]]);
    const bucket = r.projects.find((p) => p.projectId === UNALLOCATED_ID)!;
    expect(bucket.totalCost).toBe(24000); // E1 一半
    expect(r.projects.find((p) => p.projectId === "P1")!.fte).toBeCloseTo(0.5, 6);
    expect(r.totalDirectHours).toBe(120);
    expect(r.totalHours).toBe(240);
    expect(r.utilization).toBeCloseTo(0.5, 6);
    expect(sum(r, "totalCost")).toBe(COMPANY); // 仍勾稽
  });

  it("availableHours（由出勤帶入）：作為稼動率分母與殘量上限，仍勾稽", () => {
    // E1 可用工時 160，全投 P1 → 無殘量、utilization=1（只計 E1 hours 模式）
    const full = run([{ employeeId: "E1", period: P, mode: "hours", lines: [{ projectId: "P1", value: 160 }], availableHours: 160 }], [["E2", "P2"]]);
    expect(full.projects.find((p) => p.projectId === UNALLOCATED_ID)).toBeUndefined();
    expect(full.totalHours).toBe(160);
    expect(full.utilization).toBeCloseTo(1, 6);
    expect(sum(full, "totalCost")).toBe(COMPANY);
    // 部分分配：可用 160、投 100 → 殘量 60 入未分攤
    const part = run([{ employeeId: "E1", period: P, mode: "hours", lines: [{ projectId: "P1", value: 100 }], availableHours: 160 }], [["E2", "P2"]]);
    expect(part.totalDirectHours).toBe(100);
    expect(part.totalHours).toBe(160);
    expect(part.utilization).toBeCloseTo(100 / 160, 6);
    expect(sum(part, "totalCost")).toBe(COMPANY);
  });

  it("獎金直接指定：整筆歸該專案、其餘元件仍依比例、總額不變", () => {
    const r = run([{ employeeId: "E2", period: P, mode: "pct", lines: [{ projectId: "P1", value: 50 }, { projectId: "P2", value: 50 }], bonusProjectId: "P1" }]);
    expect(r.projects.find((p) => p.projectId === "P1")!.bonus).toBe(10000);
    expect(r.projects.find((p) => p.projectId === "P2")!.bonus).toBe(0);
    expect(sum(r, "totalCost")).toBe(COMPANY);
  });

  it("向後相容：無分攤→預設專案；無預設→未分攤桶", () => {
    const r = run([], [["E1", "P1"]]); // E1 預設 P1、E2 無預設
    expect(r.projects.find((p) => p.projectId === "P1")!.totalCost).toBe(48000);
    expect(r.projects.find((p) => p.projectId === UNALLOCATED_ID)!.totalCost).toBe(84000);
    expect(sum(r, "totalCost")).toBe(COMPANY);
  });
});

describe("monthlyBudgetShare", () => {
  it("整案預算依起訖平均攤到當期；期間外回 0", () => {
    expect(monthlyBudgetShare(projects[0], "2026-03")).toBe(100000); // 1,200,000 / 12
    expect(monthlyBudgetShare(projects[0], "2025-12")).toBe(0);
    expect(monthlyBudgetShare(projects[1], "2026-03")).toBe(0); // 無預算/起訖
  });
});

function inp(allocations: Allocation[], defaults: [string, string][] = []) {
  return {
    rows, allocations, projects, period: P, monthlyWorkHours: 240,
    baseByEmp, bonusByEmp, otherByEmp, defaultProjectByEmp: new Map(defaults),
  };
}

describe("projectDeptMatrix", () => {
  it("每列(專案)和＝該專案總成本；總和＝公司總成本", () => {
    const allocations: Allocation[] = [
      { employeeId: "E1", period: P, mode: "hours", lines: [{ projectId: "P1", value: 120 }, { projectId: "P2", value: 120 }] },
      { employeeId: "E2", period: P, mode: "pct", lines: [{ projectId: "P1", value: 50 }, { projectId: "P2", value: 50 }] },
    ];
    const m = projectDeptMatrix(inp(allocations));
    const cc = computeProjectCost(inp(allocations));
    // 每列和對應專案 totalCost
    m.rowLabels.forEach((label, ri) => {
      const rowSum = m.cells[ri].reduce<number>((a, v) => a + (v ?? 0), 0);
      const proj = cc.projects.find((p) => p.name === label);
      if (proj) expect(rowSum).toBe(proj.totalCost);
    });
    const grand = m.cells.flat().reduce<number>((a, v) => a + (v ?? 0), 0);
    expect(grand).toBe(COMPANY);
    expect(m.colLabels.sort()).toEqual(["研發", "業務"].sort());
  });
});

describe("chargeOutVariance", () => {
  it("工時＝標準工時 → 差異 0", () => {
    const allocations: Allocation[] = [
      { employeeId: "E1", period: P, mode: "hours", lines: [{ projectId: "P1", value: 120 }, { projectId: "P2", value: 120 }] }, // 滿 240
      { employeeId: "E2", period: P, mode: "pct", lines: [{ projectId: "P1", value: 50 }, { projectId: "P2", value: 50 }] }, // 等量 240
    ];
    const v = chargeOutVariance(inp(allocations));
    v.forEach((r) => expect(r.variance).toBe(0));
  });
  it("工時少於標準 → 差異為負（吸收不足）", () => {
    const allocations: Allocation[] = [
      { employeeId: "E1", period: P, mode: "hours", lines: [{ projectId: "P1", value: 120 }], availableHours: 120 },
    ];
    const v = chargeOutVariance(inp(allocations, [["E2", "P2"]]));
    const p1 = v.find((r) => r.projectId === "P1")!;
    expect(p1.variance).toBeLessThan(0); // 標準(rate×120) < 實際(全額)
  });
});
