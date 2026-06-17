import { describe, it, expect } from "vitest";
import { yearlyWithholding, availableYears } from "../src/lib/reports/withholding";
import { bracketWorklist } from "../src/lib/reports/bracketAdjust";
import { enrollmentWorklist } from "../src/lib/reports/enrollment";
import { isActiveInPeriod } from "../src/store/selectors";
import { DEFAULT_PARAMETERS as P } from "../src/config/parameters";
import { DEFAULT_BRACKETS as B } from "../src/config/brackets";
import { SEED_EMPLOYEES, SEED_SALARIES, SEED_DEPENDENTS, SEED_EVENTS } from "../src/data/seed";
import type { Employee, DeclaredInsured } from "../src/lib/types";

describe("yearlyWithholding / availableYears", () => {
  it("聚合 2026 年事件，只納入有結算者，月數與已扣稅加總正確", () => {
    const rows = yearlyWithholding(SEED_EMPLOYEES, SEED_SALARIES, SEED_DEPENDENTS, SEED_EVENTS, P, B, "2026");
    expect(rows.length).toBe(SEED_EMPLOYEES.length); // 種子每人皆有 2026-01 事件
    rows.forEach((r) => expect(r.months).toBe(1));
    const e008 = rows.find((r) => r.employeeId === "E008")!;
    expect(e008.withheld).toBe(12000); // 種子 E008 代扣 12000
    expect(availableYears(SEED_EVENTS)).toContain("2026");
  });
  it("非該年度 → 空", () => {
    expect(yearlyWithholding(SEED_EMPLOYEES, SEED_SALARIES, SEED_DEPENDENTS, SEED_EVENTS, P, B, "2099")).toHaveLength(0);
  });
});

describe("bracketWorklist", () => {
  const rows = [
    { employeeId: "E1", name: "甲", insured: { labor: 45800, occupational: 45800, health: 45800, pension: 46000 } },
    { employeeId: "E2", name: "乙", insured: { labor: 30000, occupational: 30000, health: 30000, pension: 30300 } },
  ];
  it("無基準 → 全部標記需調整", () => {
    const w = bracketWorklist(rows, []);
    expect(w.every((r) => r.changed)).toBe(true);
  });
  it("基準一致 → 不需調整；不同 → 需調整", () => {
    const declared: DeclaredInsured[] = [
      { employeeId: "E1", labor: 45800, health: 45800, pension: 46000, declaredAt: "" },
      { employeeId: "E2", labor: 28800, health: 28800, pension: 28800, declaredAt: "" },
    ];
    const w = bracketWorklist(rows, declared);
    expect(w.find((r) => r.employeeId === "E1")!.changed).toBe(false);
    expect(w.find((r) => r.employeeId === "E2")!.changed).toBe(true);
  });
});

describe("enrollmentWorklist", () => {
  const emps: Employee[] = [
    { ...SEED_EMPLOYEES[0], id: "N1", hireDate: "2026-03-05" },
    { ...SEED_EMPLOYEES[0], id: "L1", status: "離職", leaveDate: "2026-03-20" },
    { ...SEED_EMPLOYEES[0], id: "X1", hireDate: "2025-01-01", status: "在職" },
  ];
  it("依到職/離職日落在當期分類", () => {
    const { newHires, leavers } = enrollmentWorklist(emps, "2026-03");
    expect(newHires.map((e) => e.id)).toEqual(["N1"]);
    expect(leavers.map((e) => e.id)).toEqual(["L1"]);
  });
});

describe("isActiveInPeriod", () => {
  const base = SEED_EMPLOYEES[0];
  it("在職/undefined → 在職", () => {
    expect(isActiveInPeriod(base, "2026-03")).toBe(true);
  });
  it("留停 → 不在職；期前離職 → 不在職；當月離職 → 仍在職（破月）", () => {
    expect(isActiveInPeriod({ ...base, status: "留停" }, "2026-03")).toBe(false);
    expect(isActiveInPeriod({ ...base, status: "離職", leaveDate: "2026-01-31" }, "2026-03")).toBe(false);
    expect(isActiveInPeriod({ ...base, status: "離職", leaveDate: "2026-03-15" }, "2026-03")).toBe(true);
  });
  it("尚未到職 → 不在職", () => {
    expect(isActiveInPeriod({ ...base, hireDate: "2026-05-01" }, "2026-03")).toBe(false);
  });
});
