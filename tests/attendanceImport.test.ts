import { describe, it, expect } from "vitest";
import { parseAttendanceCsv, PUNCH_TEMPLATE, HOURS_TEMPLATE } from "../src/lib/import/attendanceCsv";
import { csvSerialize } from "../src/lib/csv";
import { monthWorkedHours } from "../src/lib/attendance";
import type { AttendanceConfig } from "../src/lib/types";

const known = new Set(["E001", "E002"]);
const BREAK = 60;
const cfg = (): AttendanceConfig => ({
  companyLat: null, companyLng: null, radiusMeters: 200, blockOutOfFence: false, ipCheckEnabled: false, allowedIps: [],
  flexEnabled: true, flexEarliestIn: "08:00", flexLatestIn: "10:00", requiredWorkMinutes: 480, breakMinutes: BREAK, coreStart: "10:00", coreEnd: "16:00",
});

describe("parseAttendanceCsv 打卡格式", () => {
  it("上/下班各一筆 → 2 筆有效", () => {
    const csv = csvSerialize([...PUNCH_TEMPLATE], [["E001", "2026-01-05", "上班", "09:00"], ["E001", "2026-01-05", "下班", "18:00"]]);
    const p = parseAttendanceCsv(csv, known, BREAK);
    expect(p.format).toBe("punch");
    expect(p.hasError).toBe(false);
    expect(p.valid).toHaveLength(2);
    expect(p.valid[0].type).toBe("in");
  });
  it("未知員工 → 警告但仍可匯入；類型/時間錯誤 → 錯誤", () => {
    const csv = csvSerialize([...PUNCH_TEMPLATE], [["E999", "2026-01-05", "上班", "09:00"], ["E001", "2026-01-05", "亂填", "25:99"]]);
    const p = parseAttendanceCsv(csv, known, BREAK);
    expect(p.issues.some((i) => i.level === "warning" && /E999/.test(i.message))).toBe(true);
    expect(p.hasError).toBe(true);
  });
});

describe("parseAttendanceCsv 工時格式", () => {
  it("8 小時 → 合成上/下班，月工時還原為 8", () => {
    const csv = csvSerialize([...HOURS_TEMPLATE], [["E001", "2026-01-05", "8", "09:00"]]);
    const p = parseAttendanceCsv(csv, known, BREAK);
    expect(p.format).toBe("hours");
    expect(p.hasError).toBe(false);
    expect(p.valid).toHaveLength(2);
    expect(monthWorkedHours(cfg(), "2026-01", p.valid).get("E001")).toBe(8);
  });
  it("工時非正數 → 錯誤", () => {
    const csv = csvSerialize([...HOURS_TEMPLATE], [["E001", "2026-01-05", "0", "09:00"]]);
    expect(parseAttendanceCsv(csv, known, BREAK).hasError).toBe(true);
  });
  it("上班時間預設 09:00（未填欄）", () => {
    const csv = csvSerialize(["員工編號", "日期", "工時"], [["E002", "2026-02-03", "7.5"]]);
    const p = parseAttendanceCsv(csv, known, BREAK);
    expect(p.valid).toHaveLength(2);
    expect(monthWorkedHours(cfg(), "2026-02", p.valid).get("E002")).toBe(8); // 7.5h 四捨五入
  });
});
