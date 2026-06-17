// 出勤/工時批次匯入（純函數）：把 CSV 解析為打卡紀錄並產生驗證預覽（不寫入 store）。
// 支援兩種格式（依表頭自動判別）：
//  1) 打卡格式：員工編號, 日期, 類型(上班/下班), 時間(HH:mm)
//  2) 工時格式：員工編號, 日期, 工時(小時)[, 上班時間] → 合成上/下班兩筆（下班＝上班＋工時＋午休）
import type { PunchRecord } from "@/lib/types";
import { csvParse } from "@/lib/csv";

export const PUNCH_TEMPLATE = ["員工編號", "日期", "類型", "時間"] as const;
export const HOURS_TEMPLATE = ["員工編號", "日期", "工時", "上班時間"] as const;

export type AttImportFormat = "punch" | "hours";
type Level = "error" | "warning";
export interface AttIssue { row: number; level: Level; message: string }
export interface AttImportPreview {
  format: AttImportFormat;
  valid: PunchRecord[];
  rows: { row: number; summary: string; errors: string[]; warnings: string[] }[];
  issues: AttIssue[];
  hasError: boolean;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** 由日期(yyyy-mm-dd 或 yyyy/m/d)＋時間(HH:mm) 組本機時間戳 ISO；無效回 null */
function toIso(dateStr: string, timeStr: string): string | null {
  const dm = dateStr.trim().match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  const tm = timeStr.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!dm || !tm) return null;
  const [, y, mo, d] = dm.map(Number);
  const [, hh, mm] = tm.map(Number);
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || hh > 23 || mm > 59) return null;
  return new Date(y, mo - 1, d, hh, mm, 0).toISOString();
}

function mkPunch(employeeId: string, type: "in" | "out", iso: string): PunchRecord {
  return {
    id: `imp-${employeeId}-${iso}-${type}`,
    employeeId, type, timestamp: iso,
    lat: null, lng: null, accuracy: null, distanceM: null, withinFence: true, ip: null, ipAllowed: null,
    note: "CSV 匯入",
  };
}

const TYPE_IN = new Set(["上班", "in", "IN", "In", "進", "上"]);
const TYPE_OUT = new Set(["下班", "out", "OUT", "Out", "出", "退"]);

/** 解析出勤/工時 CSV → 預覽。knownIds 用於提示未知員工；breakMinutes 供工時格式合成下班時間。 */
export function parseAttendanceCsv(text: string, knownIds: Set<string>, breakMinutes: number): AttImportPreview {
  const grid = csvParse(text);
  const issues: AttIssue[] = [];
  const rows: AttImportPreview["rows"] = [];
  const valid: PunchRecord[] = [];
  if (grid.length < 2) {
    return { format: "punch", valid, rows, issues: [{ row: 0, level: "error", message: "檔案沒有資料列（需含表頭）" }], hasError: true };
  }
  const header = grid[0].map((h) => h.trim());
  const idx = (name: string) => header.findIndex((h) => h === name);
  const get = (cols: string[], name: string) => { const i = idx(name); return i >= 0 ? (cols[i] ?? "").trim() : ""; };
  const format: AttImportFormat = idx("工時") >= 0 ? "hours" : "punch";

  for (let r = 1; r < grid.length; r++) {
    const cols = grid[r];
    const errors: string[] = [];
    const warnings: string[] = [];
    const emp = get(cols, "員工編號");
    const date = get(cols, "日期");
    if (!emp) errors.push("缺員工編號");
    else if (!knownIds.has(emp)) warnings.push(`查無員工編號 ${emp}（仍會匯入）`);

    let summary = "";
    if (format === "hours") {
      const hours = Number(get(cols, "工時"));
      const startRaw = get(cols, "上班時間") || "09:00";
      const inIso = toIso(date, startRaw);
      if (!inIso) errors.push("日期或上班時間格式錯誤（需 yyyy-mm-dd 與 HH:mm）");
      if (!Number.isFinite(hours) || hours <= 0) errors.push("工時需為正數");
      if (errors.length === 0 && inIso) {
        const outMs = new Date(inIso).getTime() + (hours * 60 + breakMinutes) * 60000;
        const outIso = new Date(outMs).toISOString();
        valid.push(mkPunch(emp, "in", inIso), mkPunch(emp, "out", outIso));
        summary = `${emp}　${date}　${hours} 小時（${startRaw}–${pad(new Date(outMs).getHours())}:${pad(new Date(outMs).getMinutes())}）`;
      }
    } else {
      const typeRaw = get(cols, "類型");
      const time = get(cols, "時間");
      const type = TYPE_IN.has(typeRaw) ? "in" : TYPE_OUT.has(typeRaw) ? "out" : null;
      const iso = toIso(date, time);
      if (!type) errors.push("類型需為 上班/下班");
      if (!iso) errors.push("日期或時間格式錯誤（需 yyyy-mm-dd 與 HH:mm）");
      if (errors.length === 0 && iso && type) {
        valid.push(mkPunch(emp, type, iso));
        summary = `${emp}　${date}　${type === "in" ? "上班" : "下班"} ${time}`;
      }
    }
    errors.forEach((m) => issues.push({ row: r, level: "error", message: m }));
    warnings.forEach((m) => issues.push({ row: r, level: "warning", message: m }));
    rows.push({ row: r, summary: summary || `第 ${r} 列`, errors, warnings });
  }
  return { format, valid, rows, issues, hasError: issues.some((i) => i.level === "error") };
}
