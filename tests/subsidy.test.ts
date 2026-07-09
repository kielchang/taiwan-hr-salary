import { describe, it, expect } from "vitest";
import { buildPayrollRows, type PayrollData } from "../src/store/selectors";
import { DEFAULT_PARAMETERS } from "../src/config/parameters";
import { DEFAULT_BRACKETS } from "../src/config/brackets";
import type { Employee, SalaryStructure, Subsidy } from "../src/lib/types";

const emp: Employee = {
  id: "E1", name: "員工", department: "研發", title: "", hireDate: "2020-01-01", costCenter: "",
  project: "", taxResidency: "居住者", withholdingMethod: "固定5%", exemptionFormReceivedDate: null,
  voluntaryPensionRate: 0, nationalId: "", email: "", status: "在職",
};
const sal: SalaryStructure = {
  employeeId: "E1", baseSalary: 30000, managerAllowance: 0, dutyAllowance: 0, professionalAllowance: 0,
  mealAllowance: 0, transportAllowance: 0, attendanceBonus: 0, otherFixedAllowance: 0,
};
const base = (subsidies: Subsidy[]): PayrollData => ({
  employees: [emp], salaries: [sal], dependents: [], events: [],
  parameters: DEFAULT_PARAMETERS, brackets: DEFAULT_BRACKETS, subsidies,
});
const sub = (over: Partial<Subsidy>): Subsidy => ({
  id: "S1", name: "專案補貼", amount: 5000, from: "2026-03", to: "2026-05", insured: false,
  targetEmployeeIds: ["E1"], scopeLabel: "研發部", reason: "專案", createdAt: "2026-03-01T00:00:00Z", ...over,
});

describe("區間補貼注入計薪", () => {
  it("無補貼＝基準（TC-9 不變量）", () => {
    const r0 = buildPayrollRows("2026-03", base([]))[0];
    expect(r0.salaryTotal).toBe(30000);
  });

  it("不計投保：區間內加進實發、不動月薪資總額/級距", () => {
    const withSub = buildPayrollRows("2026-03", base([sub({ insured: false })]))[0];
    const without = buildPayrollRows("2026-03", base([]))[0];
    expect(withSub.salaryTotal).toBe(30000); // 月薪資總額不變
    expect(withSub.insured.health).toBe(without.insured.health); // 投保級距不變
    expect(withSub.grossPay).toBe(without.grossPay + 5000); // 只加進應發
  });

  it("計入投保：區間內墊高月薪資總額（影響級距/保費）", () => {
    const insuredSub = buildPayrollRows("2026-03", base([sub({ insured: true })]))[0];
    expect(insuredSub.salaryTotal).toBe(35000); // 併入月薪資總額
    expect(insuredSub.grossPay).toBeGreaterThan(30000);
  });

  it("區間外（訖月之後）自動歸零", () => {
    const after = buildPayrollRows("2026-06", base([sub({ from: "2026-03", to: "2026-05", insured: true })]))[0];
    expect(after.salaryTotal).toBe(30000); // 6 月已過訖月
  });

  it("區間外（起月之前）不生效", () => {
    const before = buildPayrollRows("2026-02", base([sub({ from: "2026-03", to: "2026-05", insured: false })]))[0];
    const plain = buildPayrollRows("2026-02", base([]))[0];
    expect(before.grossPay).toBe(plain.grossPay);
  });

  it("未命中族群不生效", () => {
    const other = buildPayrollRows("2026-03", base([sub({ targetEmployeeIds: ["E999"], insured: false })]))[0];
    expect(other.grossPay).toBe(buildPayrollRows("2026-03", base([]))[0].grossPay);
  });
});
