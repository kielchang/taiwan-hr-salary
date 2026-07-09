import { describe, it, expect } from "vitest";
import { resolveSettingVersion, latestSettingVersion, SETTINGS_BASE_PERIOD } from "../src/store/usePayrollStore";
import { buildPayrollRows } from "../src/store/selectors";
import { DEFAULT_PARAMETERS } from "../src/config/parameters";
import { DEFAULT_BRACKETS } from "../src/config/brackets";
import type { Employee, SalaryStructure } from "../src/lib/types";

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

describe("逐期版本 → 保費隨期別版本改變（P2-b 治本效果）", () => {
  const emp: Employee = {
    id: "E1", name: "員工", department: "研發", title: "", hireDate: "2020-01-01", costCenter: "",
    project: "", taxResidency: "居住者", withholdingMethod: "固定5%", exemptionFormReceivedDate: null,
    voluntaryPensionRate: 0, nationalId: "", email: "", status: "在職",
  };
  const sal: SalaryStructure = {
    employeeId: "E1", baseSalary: 60000, managerAllowance: 0, dutyAllowance: 0, professionalAllowance: 0,
    mealAllowance: 0, transportAllowance: 0, attendanceBonus: 0, otherFixedAllowance: 0,
  };
  const versions = [
    { effectiveFrom: "2026-01", value: { ...DEFAULT_PARAMETERS, healthRate: 0.0517 } },
    { effectiveFrom: "2027-01", value: { ...DEFAULT_PARAMETERS, healthRate: 0.08 } },
  ];

  it("2026 月用舊健保費率、2027 月用新費率（同一員工，健保費不同）", () => {
    const p26 = resolveSettingVersion(versions, "2026-06", DEFAULT_PARAMETERS);
    const p27 = resolveSettingVersion(versions, "2027-03", DEFAULT_PARAMETERS);
    const base = { employees: [emp], salaries: [sal], dependents: [], events: [], brackets: DEFAULT_BRACKETS };
    const r26 = buildPayrollRows("2026-06", { ...base, parameters: p26 })[0];
    const r27 = buildPayrollRows("2027-03", { ...base, parameters: p27 })[0];
    expect(r27.premiums.healthEmployee).toBeGreaterThan(r26.premiums.healthEmployee); // 8% > 5.17%
    // 投保金額相同（同薪），差異純來自費率版本
    expect(r27.insured.health).toBe(r26.insured.health);
  });
});
