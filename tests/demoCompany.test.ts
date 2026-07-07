// 示範公司資料的覆蓋度與健全性測試（不影響 TC-9：本檔只測 demoCompany，不碰 SEED_*）。
import { describe, it, expect } from "vitest";
import { DEFAULT_PARAMETERS as P } from "@/config/parameters";
import { DEFAULT_BRACKETS as B } from "@/config/brackets";
import { calculatePayroll } from "@/lib/calc";
import { validateAll } from "@/lib/validation";
import { evt } from "@/data/seed";
import { buildDemoCompany, DEMO_PERIOD } from "@/data/demoCompany";

const demo = buildDemoCompany();
const salById = new Map(demo.salaries.map((s) => [s.employeeId, s]));
const curEvents = demo.events.filter((e) => e.period === DEMO_PERIOD);
const evById = new Map(curEvents.map((e) => [e.employeeId, e]));

describe("示範公司 — 規模與組織複雜度", () => {
  it("約 60 名員工", () => {
    expect(demo.employees.length).toBe(62);
  });
  it("≥12 部門、≥6 成本中心、≥6 專案、4 職等", () => {
    expect(new Set(demo.employees.map((e) => e.department)).size).toBeGreaterThanOrEqual(12);
    expect(new Set(demo.employees.map((e) => e.costCenter)).size).toBeGreaterThanOrEqual(6);
    expect(demo.projects.length).toBeGreaterThanOrEqual(6);
    expect(demo.analytics.payGrades.length).toBe(4);
  });
  it("每位員工都有薪資與級距對映", () => {
    for (const e of demo.employees) {
      expect(salById.has(e.id)).toBe(true);
      expect(demo.analytics.gradeByEmployee[e.id]).toBeTruthy();
    }
  });
});

describe("示範公司 — 生命週期狀態", () => {
  it("含離職、留停、停職、復職、期中到職", () => {
    expect(demo.employees.some((e) => e.status === "離職" && e.leaveDate?.startsWith(DEMO_PERIOD))).toBe(true);
    expect(demo.employees.some((e) => e.status === "留停")).toBe(true);
    expect(demo.employees.some((e) => e.status === "停職" && e.leavePaidRatio === 0.5)).toBe(true);
    expect(demo.employees.some((e) => e.status === "留停" && e.returnDate?.startsWith(DEMO_PERIOD))).toBe(true);
    expect(demo.employees.some((e) => e.hireDate.startsWith(DEMO_PERIOD))).toBe(true);
  });
  it("含非居住者", () => {
    expect(demo.employees.some((e) => e.taxResidency === "非居住者")).toBe(true);
  });
});

describe("示範公司 — 多月歷史、確認、申報基準、出勤、稽核", () => {
  it("快照 ≥12 期且含去年同月與上月、不含當月", () => {
    const periods = new Set(demo.snapshots.map((s) => s.period));
    expect(demo.snapshots.length).toBeGreaterThanOrEqual(12);
    expect(periods.has("2025-06")).toBe(true); // 同比
    expect(periods.has("2026-05")).toBe(true); // 環比
    expect(periods.has(DEMO_PERIOD)).toBe(false);
  });
  it("歷史人數隨到職成長（首期 < 末期）", () => {
    const sorted = [...demo.snapshots].sort((a, b) => a.period.localeCompare(b.period));
    expect(sorted[0].headcount).toBeLessThan(sorted[sorted.length - 1].headcount);
  });
  it("過去月份已確認、當月未確認", () => {
    expect(demo.confirmations["2026-05"]).toBeTruthy();
    expect(demo.confirmations[DEMO_PERIOD]).toBeUndefined();
  });
  it("申報基準/出勤/稽核皆非空，且稽核含多種動作", () => {
    expect(demo.declaredInsured.length).toBeGreaterThan(0);
    expect(demo.punches.length).toBeGreaterThan(0);
    expect(new Set(demo.auditLog.map((a) => a.action)).size).toBeGreaterThanOrEqual(5);
  });
  it("部分申報基準與當期級距不同 → 投保級距申報有可調整列", () => {
    const diff = demo.declaredInsured.some((d) => {
      const sal = salById.get(d.employeeId)!;
      const r = calculatePayroll(demo.employees.find((e) => e.id === d.employeeId)!, sal, demo.dependents, evById.get(d.employeeId) ?? evt(d.employeeId, {}), P, B, { period: DEMO_PERIOD });
      return r.insured.health !== d.health || r.insured.labor !== d.labor;
    });
    expect(diff).toBe(true);
  });
});

describe("示範公司 — 驗證警告/錯誤狀態", () => {
  const issues = validateAll(demo.employees, demo.salaries, demo.dependents, curEvents, P);
  it("當期同時存在 error 與 warning", () => {
    expect(issues.some((i) => i.severity === "error")).toBe(true); // V1 低於最低工資
    expect(issues.some((i) => i.severity === "warning")).toBe(true); // V4 加班超時 / V6 未收免稅證明
  });
});

describe("示範公司 — 全員計算健全性（不丟例外、皆為有限數）", () => {
  it("每位員工 calculatePayroll 皆得有限的應發/實發/雇主成本", () => {
    for (const e of demo.employees) {
      const sal = salById.get(e.id)!;
      const ev = evById.get(e.id) ?? evt(e.id, {});
      const r = calculatePayroll(e, sal, demo.dependents, ev, P, B, { period: DEMO_PERIOD });
      expect(Number.isFinite(r.grossPay)).toBe(true);
      expect(Number.isFinite(r.netPay)).toBe(true);
      expect(Number.isFinite(r.employerTotalCost)).toBe(true);
      expect(r.employerTotalCost).toBeGreaterThanOrEqual(0);
    }
  });
});
