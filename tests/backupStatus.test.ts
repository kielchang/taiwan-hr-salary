import { describe, it, expect } from "vitest";
import {
  daysSinceBackup, isDirtySinceBackup, backupReminderDue,
  estimateStorageBytes, storageUsageRatio, storageNearCap,
  BACKUP_REMINDER_DAYS, STORAGE_SOFT_CAP_BYTES,
} from "../src/lib/backupStatus";

const now = Date.parse("2026-07-10T00:00:00.000Z");

describe("daysSinceBackup", () => {
  it("null（從未備份）→ null", () => {
    expect(daysSinceBackup(null, now)).toBeNull();
  });
  it("同日 → 0；N 天前 → N（無條件捨去）", () => {
    expect(daysSinceBackup("2026-07-10T00:00:00.000Z", now)).toBe(0);
    expect(daysSinceBackup("2026-07-03T00:00:00.000Z", now)).toBe(7);
    expect(daysSinceBackup("2026-07-02T12:00:00.000Z", now)).toBe(7); // 7.5 天 → 7
  });
  it("非法時間字串 → null", () => {
    expect(daysSinceBackup("not-a-date", now)).toBeNull();
  });
});

describe("isDirtySinceBackup", () => {
  const log = (at: string) => ({ at });
  it("無稽核紀錄 → 乾淨", () => {
    expect(isDirtySinceBackup([], "2026-07-01T00:00:00Z")).toBe(false);
  });
  it("有紀錄但從未備份 → dirty", () => {
    expect(isDirtySinceBackup([log("2026-07-01T00:00:00Z")], null)).toBe(true);
  });
  it("末筆稽核晚於備份 → dirty；早於備份 → 乾淨", () => {
    const entries = [log("2026-07-01T00:00:00Z"), log("2026-07-05T00:00:00Z")];
    expect(isDirtySinceBackup(entries, "2026-07-03T00:00:00Z")).toBe(true);
    expect(isDirtySinceBackup(entries, "2026-07-09T00:00:00Z")).toBe(false);
  });
});

describe("backupReminderDue", () => {
  it("乾淨 → 不提醒", () => {
    expect(backupReminderDue(false, null)).toBe(false);
    expect(backupReminderDue(false, 999)).toBe(false);
  });
  it("dirty 且（從未備份 或 達門檻天）→ 提醒", () => {
    expect(backupReminderDue(true, null)).toBe(true);
    expect(backupReminderDue(true, BACKUP_REMINDER_DAYS)).toBe(true);
    expect(backupReminderDue(true, BACKUP_REMINDER_DAYS + 5)).toBe(true);
  });
  it("dirty 但未達門檻天 → 不提醒", () => {
    expect(backupReminderDue(true, BACKUP_REMINDER_DAYS - 1)).toBe(false);
  });
});

describe("儲存空間估算", () => {
  const fakeStorage = (entries: Record<string, string>) => {
    const keys = Object.keys(entries);
    return {
      length: keys.length,
      key: (i: number) => keys[i] ?? null,
      getItem: (k: string) => entries[k] ?? null,
    };
  };
  it("estimateStorageBytes＝Σ(key+value 長度)×2", () => {
    expect(estimateStorageBytes(fakeStorage({ ab: "cd" }))).toBe((2 + 2) * 2); // 8
    expect(estimateStorageBytes(fakeStorage({}))).toBe(0);
  });
  it("storageUsageRatio 與 storageNearCap（0.8 門檻）", () => {
    expect(storageUsageRatio(STORAGE_SOFT_CAP_BYTES / 2)).toBeCloseTo(0.5, 5);
    expect(storageNearCap(STORAGE_SOFT_CAP_BYTES * 0.7)).toBe(false);
    expect(storageNearCap(STORAGE_SOFT_CAP_BYTES * 0.85)).toBe(true);
  });
});
