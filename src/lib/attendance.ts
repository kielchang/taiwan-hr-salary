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

/* ───────────── 彈性上下班：每日出勤彙整（純函數） ───────────── */

export interface DayAttendance {
  employeeId: string;
  date: string; // yyyy-mm-dd（本機）
  firstIn: string | null; // 首次上班 ISO
  lastOut: string | null; // 最後下班 ISO
  workedMinutes: number | null; // 在場分鐘 − 午休（需同時有上下班）
  expectedOutISO: string | null; // 建議下班時間（首次上班 ＋ 應工時 ＋ 午休）
  late: boolean; // 晚於彈性最晚上班
  missingIn: boolean; // 有下班無上班
  missingOut: boolean; // 有上班無下班
  shortHours: boolean; // 工時不足
  outsideCore: boolean; // 未涵蓋核心時段
  status: string; // 一句話狀態
}

/** 本機日期字串 yyyy-mm-dd */
export function localDateKey(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** 取某 ISO 時間的「當日分鐘數」（0–1439，本機時區） */
function minutesOfDay(iso: string): number {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

/** "HH:mm" → 當日分鐘數；格式錯誤回傳 null */
export function hhmmToMinutes(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

/**
 * 將「某員工某日」的打卡紀錄，依彈性上下班設定評估為每日彙整。
 * 配對規則：首次「上班」與最後「下班」；工時＝在場時間 − 午休。
 */
export function evaluateDay(
  cfg: AttendanceConfig,
  employeeId: string,
  date: string,
  dayPunches: PunchRecord[],
): DayAttendance {
  const ins = dayPunches.filter((p) => p.type === "in").sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const outs = dayPunches.filter((p) => p.type === "out").sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const firstIn = ins[0]?.timestamp ?? null;
  const lastOut = outs[outs.length - 1]?.timestamp ?? null;

  const missingIn = !firstIn && !!lastOut;
  const missingOut = !!firstIn && !lastOut;

  let workedMinutes: number | null = null;
  if (firstIn && lastOut) {
    const gross = (new Date(lastOut).getTime() - new Date(firstIn).getTime()) / 60000;
    workedMinutes = Math.max(0, Math.round(gross - cfg.breakMinutes));
  }

  let expectedOutISO: string | null = null;
  if (firstIn) {
    expectedOutISO = new Date(
      new Date(firstIn).getTime() + (cfg.requiredWorkMinutes + cfg.breakMinutes) * 60000,
    ).toISOString();
  }

  const latestIn = hhmmToMinutes(cfg.flexLatestIn);
  const late = cfg.flexEnabled && !!firstIn && latestIn != null && minutesOfDay(firstIn) > latestIn;

  const shortHours =
    cfg.flexEnabled && workedMinutes != null && workedMinutes < cfg.requiredWorkMinutes;

  const coreS = hhmmToMinutes(cfg.coreStart);
  const coreE = hhmmToMinutes(cfg.coreEnd);
  const outsideCore =
    cfg.flexEnabled &&
    coreS != null &&
    coreE != null &&
    !!firstIn &&
    !!lastOut &&
    !(minutesOfDay(firstIn) <= coreS && minutesOfDay(lastOut) >= coreE);

  let status = "正常";
  if (missingIn || missingOut) status = "缺卡";
  else if (!cfg.flexEnabled) status = "已打卡";
  else {
    const issues: string[] = [];
    if (late) issues.push("遲到");
    if (shortHours) issues.push("工時不足");
    if (outsideCore) issues.push("核心未滿");
    status = issues.length ? issues.join("・") : "正常";
  }

  return {
    employeeId, date, firstIn, lastOut, workedMinutes, expectedOutISO,
    late, missingIn, missingOut, shortHours, outsideCore, status,
  };
}

/** 計算某一天、全部有打卡的員工之每日彙整 */
export function evaluateAllForDate(
  cfg: AttendanceConfig,
  date: string,
  punches: PunchRecord[],
): DayAttendance[] {
  const ofDate = punches.filter((p) => localDateKey(p.timestamp) === date);
  const byEmp = new Map<string, PunchRecord[]>();
  for (const p of ofDate) {
    const arr = byEmp.get(p.employeeId) ?? [];
    arr.push(p);
    byEmp.set(p.employeeId, arr);
  }
  return [...byEmp.entries()].map(([eid, list]) => evaluateDay(cfg, eid, date, list));
}

/** 分鐘 → "Hh Mm" */
export function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}小時${m > 0 ? ` ${m}分` : ""}`;
}
