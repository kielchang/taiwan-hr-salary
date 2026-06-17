import { describe, it, expect } from "vitest";
import { serializeState, parseBackup, summarizeBackup, BACKUP_SCHEMA, BACKUP_KEYS } from "../src/lib/backup";

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
  it("往返一致：serialize → JSON → parse", () => {
    const env = serializeState(fakeState, VERSION);
    const res = parseBackup(JSON.stringify(env), VERSION);
    expect(res.ok).toBe(true);
    expect(res.env?.state.employees).toEqual(fakeState.employees);
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
