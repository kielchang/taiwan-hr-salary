import { describe, it, expect } from "vitest";
import { haversineMeters, evaluateFence, isIpAllowed, parseIpList, punchesToCsv } from "@/lib/attendance";
import type { AttendanceConfig, PunchRecord } from "@/lib/types";

const cfg = (over: Partial<AttendanceConfig> = {}): AttendanceConfig => ({
  companyLat: 25.0339, companyLng: 121.5645, radiusMeters: 200,
  blockOutOfFence: false, ipCheckEnabled: false, allowedIps: [], ...over,
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
