import { describe, it, expect } from "vitest";
import { seniorityMonths, seniorityRefDate, annualLeaveDays } from "../src/lib/calc/seniority";

describe("seniorityRefDate 基準日解析", () => {
  it("fixedDate（預設）→ 回固定基準日", () => {
    expect(seniorityRefDate("fixedDate", "2026-01-01", "2026-06")).toBe("2026-01-01");
    expect(seniorityRefDate(undefined, "2026-01-01", "2026-06")).toBe("2026-01-01");
  });
  it("hireDate＋period → 當期月底", () => {
    expect(seniorityRefDate("hireDate", "2026-01-01", "2026-06")).toBe("2026-06-30");
    expect(seniorityRefDate("hireDate", "2026-01-01", "2026-02")).toBe("2026-02-28");
  });
  it("hireDate 但無 period → 回退固定基準日（保純函數/TC-9）", () => {
    expect(seniorityRefDate("hireDate", "2026-01-01")).toBe("2026-01-01");
  });
});

describe("兩種計算方式對年資/特休的效果", () => {
  const hire = "2019-03-15"; // 到職日
  it("固定基準日：全體算到同一日", () => {
    // 到 2026-01-01 = 6 年 9 月 → 特休 15 天
    const m = seniorityMonths(hire, seniorityRefDate("fixedDate", "2026-01-01", "2026-06"));
    expect(m).toBe(6 * 12 + 9);
    expect(annualLeaveDays(m)).toBe(15);
  });
  it("依到職日：算到當期月底（逐月累進）", () => {
    // 到 2026-06-30 = 7 年 3 月
    const m = seniorityMonths(hire, seniorityRefDate("hireDate", "2026-01-01", "2026-06"));
    expect(m).toBe(7 * 12 + 3);
    expect(annualLeaveDays(m)).toBe(15);
  });
  it("依到職日跨週年：滿一年當月特休跳級（2020-07 到職，2021-07 滿一年→7 天）", () => {
    const h = "2020-07-10";
    const before = seniorityMonths(h, seniorityRefDate("hireDate", "x", "2021-06")); // 差一個月未滿年
    const after = seniorityMonths(h, seniorityRefDate("hireDate", "x", "2021-07"));
    expect(annualLeaveDays(before)).toBe(3); // 滿 6 月
    expect(annualLeaveDays(after)).toBe(7); // 滿 1 年
  });
});
