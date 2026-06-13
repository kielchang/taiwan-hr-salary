import { describe, it, expect } from "vitest";
import { haversineMeters, evaluateFence, isIpAllowed, parseIpList, punchesToCsv } from "@/lib/attendance";
import type { AttendanceConfig, PunchRecord } from "@/lib/types";

const cfg = (over: Partial<AttendanceConfig> = {}): AttendanceConfig => ({
  companyLat: 25.0339, companyLng: 121.5645, radiusMeters: 200,
  blockOutOfFence: false, ipCheckEnabled: false, allowedIps: [],
  flexEnabled: true, flexEarliestIn: "08:00", flexLatestIn: "10:00",
  requiredWorkMinutes: 480, breakMinutes: 60, coreStart: "10:00", coreEnd: "16:00",
  ...over,
});

describe("haversineMeters", () => {
  it("同點為 0；赤道 1 經度約 111 公里", () => {
    expect(haversineMeters(25, 121, 25, 121)).toBe(0);
    const d = haversineMeters(0, 0, 0, 1);
    expect(d).toBeGreaterThan(111000);
    expect(d).toBeLessThan(111400);
  });
});

describe("evaluateFence", () => {
  it("公司座標未設定 → 不限制（distance null, within true）", () => {
    const r = evaluateFence(cfg({ companyLat: null, companyLng: null }), 25, 121);
    expect(r.distanceM).toBeNull();
    expect(r.withinFence).toBe(true);
  });
  it("同點在範圍內；遠點超出範圍", () => {
    const near = evaluateFence(cfg(), 25.0339, 121.5645);
    expect(near.withinFence).toBe(true);
    expect(near.distanceM!).toBeLessThan(1);
    const far = evaluateFence(cfg(), 25.05, 121.60); // 數公里外
    expect(far.withinFence).toBe(false);
    expect(far.distanceM!).toBeGreaterThan(200);
  });
});

describe("isIpAllowed", () => {
  it("未啟用 → 允許", () => expect(isIpAllowed(cfg(), "1.2.3.4")).toBe(true));
  it("啟用但清單為空 → 允許（避免全擋）", () =>
    expect(isIpAllowed(cfg({ ipCheckEnabled: true }), "1.2.3.4")).toBe(true));
  it("啟用且不在清單 → 拒絕；在清單 → 允許", () => {
    const c = cfg({ ipCheckEnabled: true, allowedIps: ["203.0.113.10"] });
    expect(isIpAllowed(c, "1.2.3.4")).toBe(false);
    expect(isIpAllowed(c, "203.0.113.10")).toBe(true);
  });
});

describe("parseIpList", () => {
  it("換行或逗號分隔、去空白", () => {
    expect(parseIpList("203.0.113.10\n 203.0.113.11 , 203.0.113.12")).toEqual([
      "203.0.113.10", "203.0.113.11", "203.0.113.12",
    ]);
  });
});

describe("punchesToCsv", () => {
  it("含 BOM、表頭與姓名", () => {
    const rec: PunchRecord = {
      id: "P1", employeeId: "E001", type: "in", timestamp: "2026-06-13T01:00:00.000Z",
      lat: 25.0339, lng: 121.5645, accuracy: 12, distanceM: 8, withinFence: true, ip: null, ipAllowed: null,
    };
    const csv = punchesToCsv([rec], { E001: "王小明" });
    expect(csv.charCodeAt(0)).toBe(0xfeff); // BOM
    expect(csv).toContain("員工編號");
    expect(csv).toContain("王小明");
    expect(csv).toContain("上班");
  });
});

import { evaluateDay } from "@/lib/attendance";

// 以本機時間建構時間戳，round-trip 在同一時區下穩定
const at = (h: number, m: number) => new Date(2026, 5, 13, h, m, 0).toISOString();
const punch = (type: "in" | "out", h: number, m: number): PunchRecord => ({
  id: `${type}${h}${m}`, employeeId: "E1", type, timestamp: at(h, m),
  lat: null, lng: null, accuracy: null, distanceM: null, withinFence: true, ip: null, ipAllowed: null,
});
const DATE = "2026-06-13";

describe("evaluateDay（彈性上下班）", () => {
  it("09:00–18:00 → 工時 480 分、正常", () => {
    const d = evaluateDay(cfg(), "E1", DATE, [punch("in", 9, 0), punch("out", 18, 0)]);
    expect(d.workedMinutes).toBe(480);
    expect(d.late).toBe(false);
    expect(d.shortHours).toBe(false);
    expect(d.outsideCore).toBe(false);
    expect(d.status).toBe("正常");
  });
  it("10:30 上班 → 遲到", () => {
    const d = evaluateDay(cfg(), "E1", DATE, [punch("in", 10, 30), punch("out", 19, 30)]);
    expect(d.late).toBe(true);
    expect(d.status).toContain("遲到");
  });
  it("09:00–16:00 → 工時不足（6 小時 < 8）", () => {
    const d = evaluateDay(cfg(), "E1", DATE, [punch("in", 9, 0), punch("out", 16, 0)]);
    expect(d.workedMinutes).toBe(360);
    expect(d.shortHours).toBe(true);
    expect(d.status).toContain("工時不足");
  });
  it("只有上班卡 → 缺卡", () => {
    const d = evaluateDay(cfg(), "E1", DATE, [punch("in", 9, 0)]);
    expect(d.missingOut).toBe(true);
    expect(d.workedMinutes).toBeNull();
    expect(d.status).toBe("缺卡");
  });
  it("建議下班＝上班＋應工時＋午休（09:00＋8h＋1h＝18:00）", () => {
    const d = evaluateDay(cfg(), "E1", DATE, [punch("in", 9, 0)]);
    expect(new Date(d.expectedOutISO!).getHours()).toBe(18);
  });
});
