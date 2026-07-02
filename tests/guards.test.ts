// @vitest-environment jsdom
// 資料正確性防護測試：硬鎖定守衛、驗證新規則（V7–V12）、累計獎金推算、分攤超額。
import { describe, it, expect } from "vitest";
import { DEFAULT_PARAMETERS as P } from "@/config/parameters";
import { DEFAULT_BRACKETS as B } from "@/config/brackets";
import {
  validateAll, allocationIssues, checkLifecycleDates, checkNationalIds, checkCumulativeBonus,
} from "@/lib/validation";
import { ytdBonusBefore } from "@/store/selectors";
import { usePayrollStore, isPeriodLocked, blankEvent } from "@/store/usePayrollStore";
import { SEED_EMPLOYEES, SEED_SALARIES, evt, salary } from "@/data/seed";
import type { Allocation, Employee } from "@/lib/types";

const emp = (over: Partial<Employee>): Employee => ({ ...SEED_EMPLOYEES[0], ...over });

describe("驗證新規則", () => {
  it("V8：離職未填生效日＝error；生效日早於到職日＝error", () => {
    expect(checkLifecycleDates(emp({ id: "T1", status: "離職", leaveDate: null }))
      .some((i) => i.rule === "V8" && i.severity === "error")).toBe(true);
    expect(checkLifecycleDates(emp({ id: "T2", hireDate: "2026-05-01", status: "離職", leaveDate: "2026-04-01" }))
      .some((i) => i.rule === "V8")).toBe(true);
    expect(checkLifecycleDates(emp({ id: "T3", status: "在職", leaveDate: null }))).toHaveLength(0);
  });

  it("V7：居住者身分證格式異常與跨員工重複＝warning", () => {
    const a = emp({ id: "A", nationalId: "A123456789" });
    const bad = emp({ id: "B", name: "格式錯", nationalId: "AB12345678" });
    const dup = emp({ id: "C", name: "重複者", nationalId: "A123456789" });
    const issues = checkNationalIds([a, bad, dup]);
    expect(issues.some((i) => i.message.includes("格式疑異常"))).toBe(true);
    expect(issues.some((i) => i.message.includes("重複"))).toBe(true);
    expect(issues.every((i) => i.severity === "warning")).toBe(true);
  });

  it("V10：累計獎金小於本月發放＝error", () => {
    expect(checkCumulativeBonus(evt("X", { monthlyBonus: 50000, cumulativeBonus: 10000 }), "測試")?.rule).toBe("V10");
    expect(checkCumulativeBonus(evt("X", { monthlyBonus: 50000, cumulativeBonus: 50000 }), "測試")).toBeNull();
  });

  it("V9：大額扣款導致實發為負＝error（需提供 brackets）", () => {
    const e = emp({ id: "N1", status: "在職", leaveDate: null });
    const s = salary("N1", { baseSalary: 40000 });
    const ev = { ...evt("N1", { otherDeduction: 99999 }), period: "2026-01" };
    const issues = validateAll([e], [s], [], [ev], P, B);
    expect(issues.some((i) => i.rule === "V9" && i.severity === "error")).toBe(true);
    // 未提供 brackets → 不驗 V9（向後相容）
    expect(validateAll([e], [s], [], [ev], P).some((i) => i.rule === "V9")).toBe(false);
  });

  it("V11：分攤 pct>100 或時數超可用工時＝warning", () => {
    const allocs: Allocation[] = [
      { employeeId: "E1", period: "2026-01", mode: "pct", lines: [{ projectId: "P1", value: 70 }, { projectId: "P2", value: 50 }] },
      { employeeId: "E2", period: "2026-01", mode: "hours", availableHours: 160, lines: [{ projectId: "P1", value: 200 }] },
      { employeeId: "E3", period: "2026-01", mode: "pct", lines: [{ projectId: "P1", value: 100 }] },
    ];
    const issues = allocationIssues(allocs, P, "2026-01");
    expect(issues).toHaveLength(2);
    expect(issues.every((i) => i.rule === "V11")).toBe(true);
  });
});

describe("累計獎金推算 ytdBonusBefore", () => {
  it("同年、本期之前的 monthlyBonus 合計；跨年不計", () => {
    const events = [
      { ...evt("E1", { monthlyBonus: 10000 }), period: "2026-01" },
      { ...evt("E1", { monthlyBonus: 20000 }), period: "2026-03" },
      { ...evt("E1", { monthlyBonus: 99999 }), period: "2025-12" }, // 前一年不計
      { ...evt("E2", { monthlyBonus: 5555 }), period: "2026-02" }, // 他人不計
    ];
    expect(ytdBonusBefore(events, "E1", "2026-06")).toBe(30000);
    expect(ytdBonusBefore(events, "E1", "2026-02")).toBe(10000);
    expect(ytdBonusBefore(events, "E1", "2026-01")).toBe(0);
  });
});

describe("硬鎖定守衛（store）", () => {
  const st = () => usePayrollStore.getState();

  it("isPeriodLocked：已確認即鎖定", () => {
    expect(isPeriodLocked({ "2026-06": "ts" }, "2026-06")).toBe(true);
    expect(isPeriodLocked({}, "2026-06")).toBe(false);
  });

  it("已確認月份的事件異動被拒絕；取消確認後可改且快照被移除", () => {
    const period = "2027-03";
    const empId = st().employees[0].id;
    st().setCurrentPeriod(period);
    st().upsertEvent({ ...blankEvent(empId, period), overtimeWeekday1: 4 });
    st().saveSnapshot({ period, savedAt: "t", headcount: 1, totalSalary: 1, meanSalary: 1, medianSalary: 1, totalCost: 1, employerBurden: 0, overtimePay: 0, bonusTotal: 0, gini: 0 });
    st().confirmPeriod(period);

    // 鎖定中：事件與薪資異動都 no-op
    st().upsertEvent({ ...blankEvent(empId, period), overtimeWeekday1: 40 });
    expect(st().events.find((e) => e.employeeId === empId && e.period === period)?.overtimeWeekday1).toBe(4);
    const beforeSalary = st().salaries.find((s) => s.employeeId === empId)!;
    st().upsertSalary({ ...beforeSalary, baseSalary: beforeSalary.baseSalary + 1234 });
    expect(st().salaries.find((s) => s.employeeId === empId)!.baseSalary).toBe(beforeSalary.baseSalary);

    // 取消確認 → 快照移除、可再編輯
    st().unconfirmPeriod(period);
    expect(st().snapshots.some((s) => s.period === period)).toBe(false);
    st().upsertEvent({ ...blankEvent(empId, period), overtimeWeekday1: 6 });
    expect(st().events.find((e) => e.employeeId === empId && e.period === period)?.overtimeWeekday1).toBe(6);
  });

  it("刪除員工連鎖清除分攤/申報基準/職等/績效/排程調薪", () => {
    const id = "ZZ_DEL";
    st().setCurrentPeriod("2027-05");
    st().upsertEmployee({ ...SEED_EMPLOYEES[0], id, name: "待刪者" });
    st().upsertAllocation({ employeeId: id, period: "2027-05", mode: "pct", lines: [{ projectId: st().projects[0]?.id ?? "P", value: 50 }] });
    st().setDeclaredBaseline([{ employeeId: id, labor: 1, health: 1, pension: 1, declaredAt: "t" }]);
    st().setEmployeeGrade(id, st().analytics.payGrades[0]?.id ?? null);
    st().scheduleRaises([{ employeeId: id, name: "待刪者", newSalary: 99999, effectivePeriod: "2027-09", note: "n", decidedAt: "t" }]);
    st().removeEmployee(id);
    expect(st().allocations.some((a) => a.employeeId === id)).toBe(false);
    expect(st().declaredInsured.some((d) => d.employeeId === id)).toBe(false);
    expect(st().analytics.gradeByEmployee[id]).toBeUndefined();
    expect(st().scheduledRaises.some((r) => r.employeeId === id)).toBe(false);
  });

  it("排程調薪：到期套用寫回本薪並移除排程", () => {
    const period = "2027-07";
    st().setCurrentPeriod(period);
    const empId = st().employees[0].id;
    const before = st().salaries.find((s) => s.employeeId === empId)!;
    const sumOf = (s: typeof before) => s.baseSalary + s.managerAllowance + s.dutyAllowance + s.professionalAllowance + s.mealAllowance + s.transportAllowance + s.attendanceBonus + s.otherFixedAllowance;
    const target = sumOf(before) + 2000;
    st().scheduleRaises([{ employeeId: empId, name: "測試", newSalary: target, effectivePeriod: period, note: "n", decidedAt: "t" }]);
    const item = st().scheduledRaises.find((r) => r.employeeId === empId)!;
    st().applyScheduledRaise(item.id);
    expect(sumOf(st().salaries.find((s) => s.employeeId === empId)!)).toBe(target);
    expect(st().scheduledRaises.some((r) => r.id === item.id)).toBe(false);
  });
});
