// 出勤打卡：純函數（距離、圍欄、IP、CSV）。瀏覽器 API（定位、查 IP）在 view 層處理。
import type { AttendanceConfig, PunchRecord, PunchType } from "./types";

/** 兩點間大圓距離（公尺，Haversine） */
export function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** 依公司座標與半徑判斷是否在範圍；未設定公司座標則視為不限制 */
export function evaluateFence(
  cfg: AttendanceConfig,
  lat: number,
  lng: number,
): { distanceM: number | null; withinFence: boolean } {
  if (cfg.companyLat == null || cfg.companyLng == null) {
    return { distanceM: null, withinFence: true };
  }
  const distanceM = haversineMeters(lat, lng, cfg.companyLat, cfg.companyLng);
  return { distanceM, withinFence: distanceM <= cfg.radiusMeters };
}

/** IP 是否允許：未啟用檢查或清單為空 → 視為允許（避免全擋） */
export function isIpAllowed(cfg: AttendanceConfig, ip: string): boolean {
  if (!cfg.ipCheckEnabled) return true;
  const list = cfg.allowedIps.map((s) => s.trim()).filter(Boolean);
  if (list.length === 0) return true;
  return list.includes(ip.trim());
}

/** 將「公司對外 IP 允許清單」文字（換行或逗號分隔）解析為陣列 */
export function parseIpList(text: string): string[] {
  return text
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const TYPE_LABEL: Record<PunchType, string> = { in: "上班", out: "下班" };
export const punchTypeLabel = (t: PunchType) => TYPE_LABEL[t];

function csvCell(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** 打卡紀錄 → CSV（含 BOM，供 Excel 正確顯示中文） */
export function punchesToCsv(records: PunchRecord[], nameById: Record<string, string>): string {
  const header = ["時間", "員工編號", "姓名", "類型", "緯度", "經度", "精度(m)", "距公司(m)", "在範圍", "IP", "IP允許"];
  const rows = records.map((r) => [
    new Date(r.timestamp).toLocaleString("zh-TW"),
    r.employeeId,
    nameById[r.employeeId] ?? "",
    punchTypeLabel(r.type),
    r.lat ?? "",
    r.lng ?? "",
    r.accuracy != null ? Math.round(r.accuracy) : "",
    r.distanceM != null ? Math.round(r.distanceM) : "",
    r.withinFence ? "是" : "否",
    r.ip ?? "",
    r.ipAllowed == null ? "" : r.ipAllowed ? "是" : "否",
  ]);
  return "\uFEFF" + [header, ...rows].map((cols) => cols.map(csvCell).join(",")).join("\r\n");
}
