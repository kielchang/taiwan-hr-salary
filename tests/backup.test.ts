import { describe, it, expect } from "vitest";
import { serializeState, parseBackup, summarizeBackup, BACKUP_SCHEMA, BACKUP_KEYS } from "../src/lib/backup";
import { usePayrollStore } from "../src/store/usePayrollStore";

const VERSION = 1;

/* 模擬一份 store 狀態（含函數，序列化時應被剔除） */
const fakeState = {
  parameters: { minWageMonthly: 29500 },
  brackets: { labor: [] },
  employees: [{ id: "E001", name: "甲" }],
  salaries: [{ employeeId: "E001", baseSalary: 40000 }],
  dependents: [],
  events: [{ employeeId: "E001", period: "2026-01" }, { employeeId: "E001", period: "2026-02" }],
  currentPeriod: "2026-02",
  attendance: { radiusMeters: 200 },
  punches: [],
  analytics: { payGrades: [] },
  snapshots: [{ period: "2026-01" }],
  confirmations: { "2026-01": "t" },
  setupCompleted: true,
  projects: [{ id: "P1", code: "PJ-A", name: "甲案", manager: "", client: "", budget: 100, startDate: "", endDate: "", status: "進行中" }],
  allocations: [{ employeeId: "E001", period: "2026-01", mode: "hours", lines: [{ projectId: "P1", value: 120 }] }],
  // 以下應被剔除
  someAction: () => 1,
  resetToSeed: () => 2,
};

describe("serializeState", () => {
  it("只挑資料切片、剔除函數，並帶上 schema/版本/時間", () => {
    const env = serializeState(fakeState, VERSION);
    expect(env.schema).toBe(BACKUP_SCHEMA);
    expect(env.schemaVersion).toBe(VERSION);
    expect(typeof env.exportedAt).toBe("string");
    expect(Object.keys(env.state).sort()).toEqual([...BACKUP_KEYS].filter((k) => k in fakeState).sort());
    expect("someAction" in env.state).toBe(false);
    expect("resetToSeed" in env.state).toBe(false);
  });
});

describe("parseBackup", () => {
  it("往返一致：serialize → JSON → parse（含專案/分攤）", () => {
    const env = serializeState(fakeState, VERSION);
    const res = parseBackup(JSON.stringify(env), VERSION);
    expect(res.ok).toBe(true);
    expect(res.env?.state.employees).toEqual(fakeState.employees);
    expect(res.env?.state.projects).toEqual(fakeState.projects);
    expect(res.env?.state.allocations).toEqual(fakeState.allocations);
  });
  it("非 JSON → 失敗", () => {
    expect(parseBackup("not json{", VERSION).ok).toBe(false);
  });
  it("schema 不符 → 失敗", () => {
    expect(parseBackup(JSON.stringify({ schema: "other", schemaVersion: 1, state: { employees: [] } }), VERSION).ok).toBe(false);
  });
  it("版本高於目前系統 → 拒絕", () => {
    const env = serializeState(fakeState, VERSION + 5);
    const res = parseBackup(JSON.stringify(env), VERSION);
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/版本/);
  });
  it("缺員工資料 → 失敗", () => {
    expect(parseBackup(JSON.stringify({ schema: BACKUP_SCHEMA, schemaVersion: 1, exportedAt: "", state: {} }), VERSION).ok).toBe(false);
  });
});

describe("BACKUP_KEYS 涵蓋關鍵切片（防再度漏存 → 還原即資料遺失）", () => {
  it("必含多幣別、費率版本、排程/政策/預設等切片", () => {
    const critical = [
      "currencies", "fxRates", "fxPolicy",
      "parameterVersions", "bracketVersions",
      "scheduledRaises", "leavePolicy", "salaryDefaults",
    ];
    for (const k of critical) expect(BACKUP_KEYS).toContain(k);
  });
});

describe("整檔備份 exportAll → importAll 逐切片存活（store 整合）", () => {
  it("外幣設定＋費率版本＋排程/政策 匯出→清空→匯入後完整還原", () => {
    const st = () => usePayrollStore.getState();
    // 佈置一份含關鍵切片的狀態（含兩個生效月費率版本＝驗證版本史不被壓成單一哨兵）
    const currencies = [{ code: "USD", name: "美金", symbol: "$", decimals: 2, enabled: true }];
    const fxRates = { "2026-06": { USD: 32 }, "2026-07": { USD: 31.5 } };
    const fxPolicy = { enabled: true, incomeTax: false, supplementary: true };
    const parameterVersions = [
      { effectiveFrom: "0000-01", value: { ...st().parameters } },
      { effectiveFrom: "2026-07", value: { ...st().parameters, laborInsuranceRate: 0.13 } },
    ];
    const scheduledRaises = [{ id: "R1", employeeId: "E001", effectiveFrom: "2026-08", newBase: 50000 }];
    const salaryDefaults = { standard: { mealAllowance: 3000 }, custom: [{ name: "交通", amount: 1200 }] };

    usePayrollStore.setState({
      currencies, fxRates, fxPolicy,
      parameterVersions,
      scheduledRaises,
      salaryDefaults,
    } as never);

    const env = st().exportAll();
    // 序列化端有帶上（先前 bug＝這裡整段是 undefined）
    expect(env.state.currencies).toEqual(currencies);
    expect(env.state.fxRates).toEqual(fxRates);
    expect(env.state.fxPolicy).toEqual(fxPolicy);
    expect((env.state.parameterVersions as unknown[]).length).toBe(2);
    expect(env.state.scheduledRaises).toEqual(scheduledRaises);
    expect(env.state.salaryDefaults).toEqual(salaryDefaults);

    // 清空（模擬換機/清瀏覽器後的全新狀態）
    usePayrollStore.setState({
      currencies: [], fxRates: {}, fxPolicy: { enabled: false, incomeTax: false, supplementary: false },
      parameterVersions: [{ effectiveFrom: "0000-01", value: { ...st().parameters } }],
      scheduledRaises: [],
    } as never);
    expect(st().currencies).toEqual([]);

    // 還原
    st().importAll(env);
    expect(st().currencies).toEqual(currencies);
    expect(st().fxRates).toEqual(fxRates);
    expect(st().fxPolicy.enabled).toBe(true);
    expect(st().fxPolicy.supplementary).toBe(true);
    expect(st().parameterVersions.length).toBe(2); // 版本史保留、未被壓成單一哨兵
    expect(st().scheduledRaises).toEqual(scheduledRaises);
    expect(st().salaryDefaults).toEqual(salaryDefaults);
  });
});

describe("summarizeBackup", () => {
  it("統計員工/結算筆數/月份數/快照數", () => {
    const env = serializeState(fakeState, VERSION);
    const s = summarizeBackup(env);
    expect(s.employees).toBe(1);
    expect(s.events).toBe(2);
    expect(s.periods).toBe(2); // 2026-01, 2026-02
    expect(s.snapshots).toBe(1);
  });
});
