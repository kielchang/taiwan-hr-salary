import { describe, it, expect } from "vitest";
import { buildPayrollRows, type PayrollData } from "../src/store/selectors";
import { buildSnapshot } from "../src/lib/analytics";
import { yearlyWithholding } from "../src/lib/reports/withholding";
import { DEFAULT_PARAMETERS } from "../src/config/parameters";
import { DEFAULT_BRACKETS } from "../src/config/brackets";
import type { Employee, SalaryStructure, MonthlyEvent, FxPolicy } from "../src/lib/types";

const emp: Employee = {
  id: "E1", name: "外幣員工", department: "研發", title: "", hireDate: "2020-01-01", costCenter: "",
  project: "", taxResidency: "居住者", withholdingMethod: "固定5%", exemptionFormReceivedDate: null,
  voluntaryPensionRate: 0, nationalId: "", email: "", status: "在職",
};
const sal = (foreign?: { currency: string; amount: number }): SalaryStructure => ({
  employeeId: "E1", baseSalary: 40000, managerAllowance: 0, dutyAllowance: 0, professionalAllowance: 0,
  mealAllowance: 0, transportAllowance: 0, attendanceBonus: 0, otherFixedAllowance: 0,
  ...(foreign ? { foreignPay: foreign } : {}),
});
const OFF: FxPolicy = { enabled: false, incomeTax: false, supplementary: false };
const ON: FxPolicy = { enabled: true, incomeTax: false, supplementary: false };

const data = (over: Partial<PayrollData>): PayrollData => ({
  employees: [emp], salaries: [sal()], dependents: [], events: [],
  parameters: DEFAULT_PARAMETERS, brackets: DEFAULT_BRACKETS,
  fxRates: { USD: { "2026-03": 32 } }, fxPolicy: ON, ...over,
});

describe("多幣別薪資", () => {
  it("政策關閉＝完全無外幣分支（與無外幣逐位元相同）", () => {
    const withFxOff = buildPayrollRows("2026-03", data({ salaries: [sal({ currency: "USD", amount: 1000 })], fxPolicy: OFF }))[0];
    const plain = buildPayrollRows("2026-03", data({ salaries: [sal()], fxPolicy: OFF }))[0];
    expect(withFxOff.foreignPay).toBeUndefined();
    expect(withFxOff.grossPay).toBe(plain.grossPay);
    expect(withFxOff.netPay).toBe(plain.netPay);
  });

  it("固定外幣：回填顯示欄＋台幣約當＝round(amount×rate)，但不進台幣 gross/net/insured/premiums", () => {
    const r = buildPayrollRows("2026-03", data({ salaries: [sal({ currency: "USD", amount: 1000 })] }))[0];
    const plain = buildPayrollRows("2026-03", data({ salaries: [sal()] }))[0];
    expect(r.foreignPay).toEqual({ currency: "USD", amount: 1000, rate: 32, twd: 32000 });
    expect(r.grossPay).toBe(plain.grossPay); // 台幣應發不含外幣
    expect(r.netPay).toBe(plain.netPay);
    expect(r.insured.health).toBe(plain.insured.health); // 投保級距不受外幣影響
    expect(r.premiums.laborEmployee).toBe(plain.premiums.laborEmployee);
    expect(r.taxableSalary).toBe(plain.taxableSalary);
    expect(r.salaryTotal).toBe(40000); // 月薪資總額不含外幣
  });

  it("當期覆寫優先於固定值", () => {
    const ev: MonthlyEvent = {
      employeeId: "E1", period: "2026-03", overtimeWeekday1: 0, overtimeWeekday2: 0, overtimeRestday1: 0,
      overtimeRestday2: 0, overtimeHoliday: 0, personalLeaveHours: 0, sickLeaveHours: 0, monthlyBonus: 0,
      cumulativeBonus: 0, otherAddition: 0, otherDeduction: 0, withheldTax: null,
      foreignOverride: { currency: "USD", amount: 500 },
    };
    const r = buildPayrollRows("2026-03", data({ salaries: [sal({ currency: "USD", amount: 1000 })], events: [ev] }))[0];
    expect(r.foreignPay?.amount).toBe(500); // 覆寫 500 蓋過固定 1000
    expect(r.foreignPay?.twd).toBe(16000);
  });

  it("未設匯率＝台幣約當 0（仍回填顯示原額）", () => {
    const r = buildPayrollRows("2026-03", data({ salaries: [sal({ currency: "USD", amount: 1000 })], fxRates: {} }))[0];
    expect(r.foreignPay?.rate).toBe(0);
    expect(r.foreignPay?.twd).toBe(0);
    expect(r.foreignPay?.amount).toBe(1000);
  });

  it("補充保費政策開啟：外幣台幣約當墊高補充保費基數", () => {
    // 投保健保約 41500，門檻 4×＝約 166000；台幣約當 200000 超門檻 → 補充保費 > 0
    const suppOn: FxPolicy = { enabled: true, incomeTax: false, supplementary: true };
    const withSupp = buildPayrollRows("2026-03", data({ salaries: [sal({ currency: "USD", amount: 10000 })], fxPolicy: suppOn }))[0];
    const withoutSupp = buildPayrollRows("2026-03", data({ salaries: [sal({ currency: "USD", amount: 10000 })], fxPolicy: ON }))[0];
    expect(withSupp.personalSupplementary).toBeGreaterThan(withoutSupp.personalSupplementary);
    expect(withoutSupp.personalSupplementary).toBe(0); // 政策關＝外幣不進補充保費
  });

  it("所得稅政策關：外幣不進所得稅（foreignTaxableTwd=0、無代扣建議）", () => {
    const r = buildPayrollRows("2026-03", data({ salaries: [sal({ currency: "USD", amount: 1000 })], fxPolicy: ON }))[0];
    expect(r.foreignTaxableTwd).toBe(0);
    expect(r.foreignWithholding).toBeNull();
  });

  it("所得稅政策開：外幣視作獎金 → 應稅台幣約當＋獎金代扣稅建議（5%），仍不動台幣 gross/taxable", () => {
    const taxOn: FxPolicy = { enabled: true, incomeTax: true, supplementary: false };
    const small = buildPayrollRows("2026-03", data({ salaries: [sal({ currency: "USD", amount: 1000 })], fxPolicy: taxOn }))[0];
    const plain = buildPayrollRows("2026-03", data({ salaries: [sal()], fxPolicy: taxOn }))[0];
    expect(small.foreignTaxableTwd).toBe(32000); // 1000×32
    expect(small.foreignWithholding).toEqual({ type: "auto", amount: 0 }); // 32000 < 起扣標準 → 免扣
    expect(small.grossPay).toBe(plain.grossPay); // 台幣核心不受影響
    expect(small.taxableSalary).toBe(plain.taxableSalary);
    expect(small.netPay).toBe(plain.netPay);
    // 大額外幣（≥起扣標準）→ 建議 5%
    const big = buildPayrollRows("2026-03", data({ salaries: [sal({ currency: "USD", amount: 10000 })], fxPolicy: taxOn }))[0];
    expect(big.foreignTaxableTwd).toBe(320000);
    expect(big.foreignWithholding).toEqual({ type: "auto", amount: 16000 }); // 320000×5%
  });

  it("扣繳憑單 yearlyWithholding：政策開時 foreignTaxable 累計外幣台幣約當（獨立欄、不併入 gross/taxable）", () => {
    const taxOn: FxPolicy = { enabled: true, incomeTax: true, supplementary: false };
    const evs: MonthlyEvent[] = ["2026-01", "2026-02"].map((period) => ({
      employeeId: "E1", period, overtimeWeekday1: 0, overtimeWeekday2: 0, overtimeRestday1: 0,
      overtimeRestday2: 0, overtimeHoliday: 0, personalLeaveHours: 0, sickLeaveHours: 0, monthlyBonus: 0,
      cumulativeBonus: 0, otherAddition: 0, otherDeduction: 0, withheldTax: null,
    }));
    const fxRates = { USD: { "2026-01": 32, "2026-02": 30 } };
    const rowsOn = yearlyWithholding([emp], [sal({ currency: "USD", amount: 1000 })], [], evs, DEFAULT_PARAMETERS, DEFAULT_BRACKETS, "2026", undefined, { fxPolicy: taxOn, fxRates })[0];
    expect(rowsOn.foreignTaxable).toBe(62000); // 1000×32 + 1000×30
    const rowsOff = yearlyWithholding([emp], [sal({ currency: "USD", amount: 1000 })], [], evs, DEFAULT_PARAMETERS, DEFAULT_BRACKETS, "2026")[0];
    expect(rowsOff.foreignTaxable).toBe(0); // 無 fx＝不含外幣
    expect(rowsOn.gross).toBe(rowsOff.gross); // 台幣核心不受外幣影響
    expect(rowsOn.taxable).toBe(rowsOff.taxable);
  });

  it("buildSnapshot：外幣獨立序列，不併入 totalCost", () => {
    const rowsFx = buildPayrollRows("2026-03", data({ salaries: [sal({ currency: "USD", amount: 1000 })] }));
    const rowsPlain = buildPayrollRows("2026-03", data({ salaries: [sal()] }));
    const snapFx = buildSnapshot(rowsFx, "2026-03", 0);
    const snapPlain = buildSnapshot(rowsPlain, "2026-03", 0);
    expect(snapFx.totalCost).toBe(snapPlain.totalCost); // 外幣不進 totalCost
    expect(snapFx.foreignTwdTotal).toBe(32000);
    expect(snapFx.foreignByCurrency).toEqual({ USD: 1000 });
    expect(snapPlain.foreignTwdTotal).toBeUndefined(); // 無外幣＝不佔快照欄
  });
});
