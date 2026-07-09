import { describe, it, expect } from "vitest";
import { resolveSettingVersion, latestSettingVersion, SETTINGS_BASE_PERIOD } from "../src/store/usePayrollStore";

type P = { rate: number };
const versions = [
  { effectiveFrom: "2026-01", value: { rate: 0.05 } },
  { effectiveFrom: "2027-01", value: { rate: 0.06 } },
];

describe("設定生效月版本解析（P2-a）", () => {
  it("取 effectiveFrom ≤ period 的最後一個版本", () => {
    expect(resolveSettingVersion(versions, "2026-06", { rate: 0 }).rate).toBe(0.05);
    expect(resolveSettingVersion(versions, "2027-01", { rate: 0 }).rate).toBe(0.06);
    expect(resolveSettingVersion(versions, "2027-08", { rate: 0 }).rate).toBe(0.06);
  });

  it("period 早於最早版本 → 回最早版本（不回 fallback）", () => {
    expect(resolveSettingVersion(versions, "2025-12", { rate: 99 }).rate).toBe(0.05);
  });

  it("空清單 → fallback；未排序輸入仍正確", () => {
    expect(resolveSettingVersion([], "2026-06", { rate: 99 }).rate).toBe(99);
    expect(resolveSettingVersion(undefined as unknown as { effectiveFrom: string; value: P }[], "2026-06", { rate: 99 }).rate).toBe(99);
    const unsorted = [versions[1], versions[0]];
    expect(resolveSettingVersion(unsorted, "2026-06", { rate: 0 }).rate).toBe(0.05);
  });

  it("latestSettingVersion 取最大 effectiveFrom", () => {
    expect(latestSettingVersion(versions, { rate: 0 }).rate).toBe(0.06);
    expect(latestSettingVersion([], { rate: 7 }).rate).toBe(7);
  });

  it("單一哨兵版本（遷移後）＝所有期別都解析到它（行為中性）", () => {
    const single = [{ effectiveFrom: SETTINGS_BASE_PERIOD, value: { rate: 0.0517 } }];
    for (const period of ["2020-01", "2026-06", "2099-12"]) {
      expect(resolveSettingVersion(single, period, { rate: 0 }).rate).toBe(0.0517);
    }
  });
});
