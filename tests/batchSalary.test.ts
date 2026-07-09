// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { usePayrollStore } from "../src/store/usePayrollStore";
import { applyBatchOp } from "../src/lib/calc/batchSalary";
import { monthlySalaryTotal } from "../src/lib/calc";
import type { Employee, SalaryStructure } from "../src/lib/types";

const st = () => usePayrollStore.getState();
const emp = (id: string, dept: string): Employee => ({
  id, name: `員工${id}`, department: dept, title: "", hireDate: "2020-01-01", costCenter: "",
  project: "", taxResidency: "居住者", withholdingMethod: "固定5%", exemptionFormReceivedDate: null,
  voluntaryPensionRate: 0, nationalId: "", email: "", status: "在職",
});
const sal = (id: string, base: number): SalaryStructure => ({
  employeeId: id, baseSalary: base, managerAllowance: 0, dutyAllowance: 0, professionalAllowance: 0,
  mealAllowance: 3000, transportAllowance: 0, attendanceBonus: 0, otherFixedAllowance: 0,
});

describe("applyBatchOp 純函數", () => {
  const s = sal("E1", 40000); // 月薪資總額 43000（含伙食 3000）
  it("調整本薪：加定額", () => {
    expect(applyBatchOp(s, { kind: "adjust", target: "baseSalary", mode: "add", amountKind: "fixed", value: 2000 }).baseSalary).toBe(42000);
  });
  it("調整本薪：加 本薪%（10% of 40000 = 4000）", () => {
    expect(applyBatchOp(s, { kind: "adjust", target: "baseSalary", mode: "add", amountKind: "pctBase", value: 10 }).baseSalary).toBe(44000);
  });
  it("調整本薪：加 月薪資總額%（10% of 43000 = 4300）", () => {
    expect(applyBatchOp(s, { kind: "adjust", target: "baseSalary", mode: "add", amountKind: "pctTotal", value: 10 }).baseSalary).toBe(44300);
  });
  it("調整：設為定額", () => {
    expect(applyBatchOp(s, { kind: "adjust", target: "baseSalary", mode: "set", amountKind: "fixed", value: 50000 }).baseSalary).toBe(50000);
  });
  it("調整：減不低於 0", () => {
    expect(applyBatchOp(s, { kind: "adjust", target: "managerAllowance", mode: "subtract", amountKind: "fixed", value: 999 }).managerAllowance).toBe(0);
  });
  it("新增津貼：定額，併入 customAllowances", () => {
    const r = applyBatchOp(s, { kind: "addAllowance", name: "危險津貼", amountKind: "fixed", value: 3000 }, { allowanceId: "X1" });
    expect(r.customAllowances).toEqual([{ id: "X1", name: "危險津貼", amount: 3000 }]);
    expect(monthlySalaryTotal(r)).toBe(monthlySalaryTotal(s) + 3000);
  });
  it("新增津貼：本薪%（5% of 40000 = 2000）", () => {
    const r = applyBatchOp(s, { kind: "addAllowance", name: "語言津貼", amountKind: "pctBase", value: 5 }, { allowanceId: "X2" });
    expect(r.customAllowances?.[0].amount).toBe(2000);
  });
});

describe("applyBatchSalary store（批次即時套用＋摘要稽核＋硬鎖定）", () => {
  beforeEach(() => {
    usePayrollStore.setState({
      employees: [emp("E1", "研發"), emp("E2", "研發"), emp("E3", "業務")],
      salaries: [sal("E1", 40000), sal("E2", 50000), sal("E3", 60000)],
      confirmations: {}, currentPeriod: "2026-03", auditLog: [], operatorName: "測試", scheduledSalaryChanges: [], subsidies: [],
    });
  });
  it("對研發部加本薪 3000 → 只動 E1/E2、留一筆帶 scenario 的摘要稽核", () => {
    st().applyBatchSalary({ employeeIds: ["E1", "E2"], op: { kind: "adjust", target: "baseSalary", mode: "add", amountKind: "fixed", value: 3000 }, reason: "部門調整", scopeLabel: "研發部" });
    const byId = Object.fromEntries(st().salaries.map((s) => [s.employeeId, s.baseSalary]));
    expect(byId.E1).toBe(43000);
    expect(byId.E2).toBe(53000);
    expect(byId.E3).toBe(60000); // 業務不動
    const a = st().auditLog[0];
    expect(a.scenario).toBe("salary");
    expect(a.summary).toContain("研發部");
    expect(a.summary).toContain("2 人");
    expect(a.summary).toContain("原因：部門調整");
  });
  it("新增津貼批次：全公司加 500 元誤餐費", () => {
    st().applyBatchSalary({ employeeIds: ["E1", "E2", "E3"], op: { kind: "addAllowance", name: "誤餐費", amountKind: "fixed", value: 500 }, reason: "全體", scopeLabel: "全公司" });
    expect(st().salaries.every((s) => s.customAllowances?.some((c) => c.name === "誤餐費" && c.amount === 500))).toBe(true);
  });
  it("已確認月份 no-op", () => {
    usePayrollStore.setState({ confirmations: { "2026-03": "x" } });
    st().applyBatchSalary({ employeeIds: ["E1"], op: { kind: "adjust", target: "baseSalary", mode: "add", amountKind: "fixed", value: 3000 }, reason: "x", scopeLabel: "研發部" });
    expect(st().salaries.find((s) => s.employeeId === "E1")!.baseSalary).toBe(40000);
    expect(st().auditLog.length).toBe(0);
  });
});

describe("排程薪資變更（未來生效月）", () => {
  beforeEach(() => {
    usePayrollStore.setState({
      employees: [emp("E1", "研發")], salaries: [sal("E1", 40000)],
      confirmations: {}, currentPeriod: "2026-03", auditLog: [], operatorName: "測試", scheduledSalaryChanges: [], subsidies: [],
    });
  });
  it("排程→套用寫回整份結構＋移除排程", () => {
    const target = applyBatchOp(sal("E1", 40000), { kind: "adjust", target: "baseSalary", mode: "add", amountKind: "fixed", value: 5000 });
    st().scheduleSalaryChanges([{ employeeId: "E1", name: "員工E1", salary: target, effectivePeriod: "2026-07", note: "研發部・本薪加 5000", decidedAt: "2026-03-01T00:00:00Z" }], "研發部・本薪加 5000");
    expect(st().scheduledSalaryChanges.length).toBe(1);
    const sid = st().scheduledSalaryChanges[0].id;
    st().applyScheduledSalaryChange(sid);
    expect(st().salaries.find((s) => s.employeeId === "E1")!.baseSalary).toBe(45000);
    expect(st().scheduledSalaryChanges.length).toBe(0);
  });
  it("取消排程", () => {
    st().scheduleSalaryChanges([{ employeeId: "E1", name: "員工E1", salary: sal("E1", 40000), effectivePeriod: "2026-07", note: "x", decidedAt: "2026-03-01T00:00:00Z" }], "x");
    st().cancelScheduledSalaryChange(st().scheduledSalaryChanges[0].id);
    expect(st().scheduledSalaryChanges.length).toBe(0);
  });
});
