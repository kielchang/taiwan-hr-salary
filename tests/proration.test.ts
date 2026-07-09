import { describe, it, expect } from "vitest";
import { payFactor, employmentDaysFactor, monthlySalaryTotal } from "../src/lib/calc/wage";
import { calculatePayroll } from "../src/lib/calc";
import { DEFAULT_PARAMETERS as P } from "../src/config/parameters";
import { DEFAULT_BRACKETS as B } from "../src/config/brackets";
import { SEED_EMPLOYEES, SEED_SALARIES, SEED_DEPENDENTS, SEED_EVENTS, SEED_PERIOD } from "../src/data/seed";

const emp = SEED_EMPLOYEES[0]; // E001 全月在職
const sal = SEED_SALARIES.find((s) => s.employeeId === emp.id)!;
const ev = SEED_EVENTS.find((e) => e.employeeId === emp.id)!;

const POL = { 留停: 0, 停職: 0, 暫離: 0 } as const;
const seg = (from: string, to: string | null, paidRatio: number, status: "留停" | "停職" | "暫離" = "留停") => ({ status, from, to, paidRatio });

describe("payFactor 破月（多段生效日＋復職日＋給薪比例）", () => {
  it("全月在職 → 1", () => {
    expect(payFactor("2026-03", "2020-01-01", null, [], POL)).toBe(1);
  });
  it("月中到職（3/16，31 天）→ 16/31", () => {
    expect(payFactor("2026-03", "2026-03-16", null, [], POL)).toBeCloseTo(16 / 31, 6);
  });
  it("月中離職（3/10，離職日 inclusive）→ 10/31", () => {
    expect(payFactor("2026-03", "2020-01-01", "2026-03-10", [], POL)).toBeCloseTo(10 / 31, 6);
  });
  it("當月尚未到職 → 0", () => {
    expect(payFactor("2026-03", "2026-05-01", null, [], POL)).toBe(0);
  });
  it("留停 20 號生效、無給 → 付 1–19 日＝19/31", () => {
    expect(payFactor("2026-03", "2020-01-01", null, [seg("2026-03-20", null, 0)], POL)).toBeCloseTo(19 / 31, 6);
  });
  it("停職 16 號生效、半薪 → 15 日全薪＋16 日半薪＝23/31", () => {
    expect(payFactor("2026-03", "2020-01-01", null, [seg("2026-03-16", null, 0.5, "停職")], POL)).toBeCloseTo(23 / 31, 6);
  });
  it("留停含復職日（1 號留停、11 號復職、無給）→ 付 11–31 日＝21/31", () => {
    expect(payFactor("2026-03", "2020-01-01", null, [seg("2026-03-01", "2026-03-11", 0)], POL)).toBeCloseTo(21 / 31, 6);
  });
  it("整月留停無給 → 0", () => {
    expect(payFactor("2026-03", "2020-01-01", null, [seg("2026-02-01", null, 0)], POL)).toBe(0);
  });
  // B-1：多段
  it("同月兩段留停無給（1–6、16–21）→ 付其餘 21/31", () => {
    expect(payFactor("2026-03", "2020-01-01", null, [seg("2026-03-01", "2026-03-06", 0), seg("2026-03-16", "2026-03-21", 0)], POL)).toBeCloseTo(21 / 31, 6);
  });
  it("兩段不同比例（1–11 半薪、21– 無給）→ 10*0.5 + 10*1 + 11*0 = 15/31", () => {
    // 1–10 半薪(10 天×0.5=5)、11–20 全薪(10)、21–31 無給(11×0)= 15
    expect(payFactor("2026-03", "2020-01-01", null, [seg("2026-03-01", "2026-03-11", 0.5), seg("2026-03-21", null, 0)], POL)).toBeCloseTo(15 / 31, 6);
  });
  it("段落給薪比例空 → 採公司政策（停職政策 0.5）", () => {
    expect(payFactor("2026-03", "2020-01-01", null, [{ status: "停職", from: "2026-03-16", to: null, paidRatio: null }], { 留停: 0, 停職: 0.5, 暫離: 0 })).toBeCloseTo(23 / 31, 6);
  });
});

describe("employmentDaysFactor 在職天數（勞保按天用）", () => {
  it("全月在職 → 1；留停不減在職 → 1", () => {
    expect(employmentDaysFactor("2026-03", "2020-01-01", "2026-03-10", "留停")).toBe(1);
  });
  it("月中離職（3/10）→ 10/31", () => {
    expect(employmentDaysFactor("2026-03", "2020-01-01", "2026-03-10", "離職")).toBeCloseTo(10 / 31, 6);
  });
});

describe("customAllowances 自訂固定津貼併入月薪資總額", () => {
  it("monthlySalaryTotal 加總自訂津貼金額", () => {
    const base = monthlySalaryTotal(sal);
    const withAllow = monthlySalaryTotal({
      ...sal,
      customAllowances: [
        { id: "CA1", name: "交通", amount: 2000 },
        { id: "CA2", name: "伙食加給", amount: 1500 },
      ],
    });
    expect(withAllow).toBe(base + 3500);
  });
  it("無 customAllowances（TC-9 seed）與空陣列皆等同未加（不影響既有計算）", () => {
    const base = monthlySalaryTotal(sal);
    expect(base).toBe(monthlySalaryTotal({ ...sal, customAllowances: [] }));
    expect(base).toBe(monthlySalaryTotal({ ...sal, customAllowances: undefined }));
  });
  it("透過 calculatePayroll 計入固定薪資與應發", () => {
    const salWith = { ...sal, customAllowances: [{ id: "CA1", name: "交通", amount: 3000 }] };
    const before = calculatePayroll(emp, sal, SEED_DEPENDENTS, ev, P, B);
    const after = calculatePayroll(emp, salWith, SEED_DEPENDENTS, ev, P, B);
    expect(after.salaryTotal).toBe(before.salaryTotal + 3000);
    // 自訂津貼屬工資 → 同步墊高加班時薪，故應發增幅 ≥ 津貼本身
    expect(after.grossPay).toBeGreaterThanOrEqual(before.grossPay + 3000);
  });
});

describe("calculatePayroll 破月為非破壞性", () => {
  it("全月員工：有/無 opts 結果完全相同（保 TC-9）", () => {
    const a = calculatePayroll(emp, sal, SEED_DEPENDENTS, ev, P, B);
    const b = calculatePayroll(emp, sal, SEED_DEPENDENTS, ev, P, B, { period: SEED_PERIOD });
    expect(b.grossPay).toBe(a.grossPay);
    expect(b.netPay).toBe(a.netPay);
    expect(b.employerTotalCost).toBe(a.employerTotalCost);
    expect(b.prorationFactor).toBe(1);
    expect(b.paidSalaryTotal).toBe(a.salaryTotal);
  });
  it("月中到職：固定薪資按比例、投保金額全月、勞保費按在職天數", () => {
    const midHire = { ...emp, hireDate: "2026-01-16" }; // 1 月 31 天
    const full = calculatePayroll(emp, sal, SEED_DEPENDENTS, ev, P, B, { period: SEED_PERIOD });
    const pro = calculatePayroll(midHire, sal, SEED_DEPENDENTS, ev, P, B, { period: SEED_PERIOD });
    expect(pro.prorationFactor).toBeCloseTo(16 / 31, 6);
    expect(pro.paidSalaryTotal).toBeLessThan(full.paidSalaryTotal);
    expect(pro.grossPay).toBeLessThan(full.grossPay);
    expect(pro.insured.health).toBe(full.insured.health); // 投保金額（級距）依全月薪資
    expect(pro.premiums.healthEmployee).toBe(full.premiums.healthEmployee); // 健保整月
    expect(pro.premiums.laborEmployee).toBeLessThan(full.premiums.laborEmployee); // 勞保按天 → 較低
    expect(pro.premiums.laborEmployer).toBeLessThan(full.premiums.laborEmployer);
    expect(pro.salaryTotal).toBe(full.salaryTotal);
  });
});
