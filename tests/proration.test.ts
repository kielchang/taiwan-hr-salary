import { describe, it, expect } from "vitest";
import { prorationFactor } from "../src/lib/calc/wage";
import { calculatePayroll } from "../src/lib/calc";
import { DEFAULT_PARAMETERS as P } from "../src/config/parameters";
import { DEFAULT_BRACKETS as B } from "../src/config/brackets";
import { SEED_EMPLOYEES, SEED_SALARIES, SEED_DEPENDENTS, SEED_EVENTS, SEED_PERIOD } from "../src/data/seed";

const emp = SEED_EMPLOYEES[0]; // E001 全月在職
const sal = SEED_SALARIES.find((s) => s.employeeId === emp.id)!;
const ev = SEED_EVENTS.find((e) => e.employeeId === emp.id)!;

describe("prorationFactor", () => {
  it("全月在職 → 1", () => {
    expect(prorationFactor("2026-03", "2020-01-01", null)).toBe(1);
  });
  it("月中到職（3/16，31 天）→ 16/31", () => {
    expect(prorationFactor("2026-03", "2026-03-16", null)).toBeCloseTo(16 / 31, 6);
  });
  it("月中離職（3/10）→ 10/31", () => {
    expect(prorationFactor("2026-03", "2020-01-01", "2026-03-10")).toBeCloseTo(10 / 31, 6);
  });
  it("留停 → 0；當月尚未到職 → 0", () => {
    expect(prorationFactor("2026-03", "2020-01-01", null, "留停")).toBe(0);
    expect(prorationFactor("2026-03", "2026-05-01", null)).toBe(0);
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
  it("月中到職：固定薪資按比例、投保金額仍為全月", () => {
    const midHire = { ...emp, hireDate: "2026-01-16" }; // 1 月 31 天
    const full = calculatePayroll(emp, sal, SEED_DEPENDENTS, ev, P, B, { period: SEED_PERIOD });
    const pro = calculatePayroll(midHire, sal, SEED_DEPENDENTS, ev, P, B, { period: SEED_PERIOD });
    expect(pro.prorationFactor).toBeCloseTo(16 / 31, 6);
    expect(pro.paidSalaryTotal).toBeLessThan(full.paidSalaryTotal);
    expect(pro.grossPay).toBeLessThan(full.grossPay);
    expect(pro.insured.health).toBe(full.insured.health); // 投保依全月薪資
    expect(pro.salaryTotal).toBe(full.salaryTotal);
  });
});
