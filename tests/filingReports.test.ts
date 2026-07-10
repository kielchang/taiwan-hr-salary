import { describe, it, expect } from "vitest";
import { enrollmentWorklist } from "../src/lib/reports/enrollment";
import { bracketWorklist } from "../src/lib/reports/bracketAdjust";
import type { Employee, DeclaredInsured, LeaveSegment } from "../src/lib/types";
import type { InsuredAmounts } from "../src/lib/calc/brackets";

// 只讀特定欄位 → 以 partial 造 Employee（其餘欄位不影響這兩支報表）
const emp = (over: Partial<Employee>): Employee => ({
  id: "E", name: "員工", department: "", title: "", hireDate: "2020-01-01", costCenter: "",
  project: "", taxResidency: "居住者", withholdingMethod: "固定5%", exemptionFormReceivedDate: null,
  voluntaryPensionRate: 0, nationalId: "", email: "", status: "在職", ...over,
});

describe("enrollmentWorklist（加/退/停/復保作業清單）", () => {
  it("當月到職→加保；當月離職→退保", () => {
    const employees = [
      emp({ id: "A", hireDate: "2026-06-10" }),        // 本月到職
      emp({ id: "B", hireDate: "2025-01-01" }),        // 舊員工
      emp({ id: "C", status: "離職", leaveDate: "2026-06-20" }), // 本月離職
      emp({ id: "D", status: "離職", leaveDate: "2026-05-30" }), // 上月離職
    ];
    const w = enrollmentWorklist(employees, "2026-06");
    expect(w.newHires.map((e) => e.id)).toEqual(["A"]);
    expect(w.leavers.map((e) => e.id)).toEqual(["C"]);
  });

  it("留停段落當月生效→停保；當月復職→復保（多段 leaveRecords）", () => {
    const seg = (from: string, to: string | null): LeaveSegment => ({ status: "留停", from, to, paidRatio: null });
    const employees = [
      emp({ id: "S", status: "留停", leaveRecords: [seg("2026-06-01", null)] }),   // 本月生效停保
      emp({ id: "R", status: "在職", leaveRecords: [seg("2026-03-01", "2026-06-15")] }), // 本月復職
      emp({ id: "N", status: "留停", leaveRecords: [seg("2026-02-01", null)] }),   // 舊停保、非本月
    ];
    const w = enrollmentWorklist(employees, "2026-06");
    expect(w.suspends.map((e) => e.id)).toEqual(["S"]);
    expect(w.returns.map((e) => e.id)).toEqual(["R"]);
  });

  it("無異動月＝四類皆空", () => {
    const w = enrollmentWorklist([emp({ id: "X", hireDate: "2020-01-01" })], "2026-06");
    expect(w.newHires).toHaveLength(0);
    expect(w.leavers).toHaveLength(0);
    expect(w.suspends).toHaveLength(0);
    expect(w.returns).toHaveLength(0);
  });
});

describe("bracketWorklist（投保級距申報調整對照）", () => {
  const ins = (labor: number, health: number, pension: number): InsuredAmounts =>
    ({ labor, health, pension } as InsuredAmounts);
  const rows = [
    { employeeId: "A", name: "甲", insured: ins(45800, 45800, 45800) },
    { employeeId: "B", name: "乙", insured: ins(30300, 30300, 30300) },
    { employeeId: "C", name: "丙", insured: ins(40100, 40100, 40100) },
  ];

  it("與基準不同→changed；相同→未變", () => {
    const declared: DeclaredInsured[] = [
      { employeeId: "A", labor: 43900, health: 43900, pension: 43900, declaredAt: "2026-02-01" }, // 調高
      { employeeId: "B", labor: 30300, health: 30300, pension: 30300, declaredAt: "2026-02-01" }, // 相同
    ];
    const w = bracketWorklist(rows, declared);
    const byId = Object.fromEntries(w.map((r) => [r.employeeId, r]));
    expect(byId.A.changed).toBe(true);
    expect(byId.A.declared).toEqual({ labor: 43900, health: 43900, pension: 43900 });
    expect(byId.B.changed).toBe(false);
    expect(byId.C.changed).toBe(true); // 無基準
    expect(byId.C.declared).toBeNull();
  });

  it("無任何基準→全部 changed（尚未設申報基準）", () => {
    const w = bracketWorklist(rows, []);
    expect(w.every((r) => r.changed)).toBe(true);
    expect(w.every((r) => r.declared === null)).toBe(true);
  });
});
