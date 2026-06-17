// 整檔備份/還原（純函數）：把整個 store 狀態序列化成可攜檔，及還原前的解析與驗證。
// 不 import store（避免循環相依）；store 端呼叫 serializeState(get())、UI 端呼叫 parseBackup。

export const BACKUP_SCHEMA = "taiwan-hr-salary";

/** 備份檔信封：含 schema 識別、版本、匯出時間與資料切片 */
export interface BackupEnvelope {
  schema: typeof BACKUP_SCHEMA;
  schemaVersion: number;
  exportedAt: string;
  state: Record<string, unknown>;
}

/** 納入備份的資料切片鍵（只含資料、不含 actions/函數） */
export const BACKUP_KEYS = [
  "parameters",
  "brackets",
  "employees",
  "salaries",
  "dependents",
  "events",
  "currentPeriod",
  "attendance",
  "punches",
  "analytics",
  "snapshots",
  "confirmations",
  "setupCompleted",
] as const;

/** 由完整 store 狀態（含函數）挑出資料切片，包成信封 */
export function serializeState(state: Record<string, unknown>, schemaVersion: number): BackupEnvelope {
  const picked: Record<string, unknown> = {};
  for (const k of BACKUP_KEYS) if (k in state) picked[k] = state[k];
  return {
    schema: BACKUP_SCHEMA,
    schemaVersion,
    exportedAt: new Date().toISOString(),
    state: picked,
  };
}

/** 還原前所見的內容摘要（供確認對話框） */
export interface BackupSummary {
  employees: number;
  events: number;
  periods: number;
  snapshots: number;
  exportedAt: string;
}

export function summarizeBackup(env: BackupEnvelope): BackupSummary {
  const s = env.state as {
    employees?: unknown[];
    events?: { period?: string }[];
    snapshots?: unknown[];
  };
  const periods = new Set((s.events ?? []).map((e) => e.period).filter(Boolean));
  return {
    employees: s.employees?.length ?? 0,
    events: s.events?.length ?? 0,
    periods: periods.size,
    snapshots: s.snapshots?.length ?? 0,
    exportedAt: env.exportedAt,
  };
}

export interface ParseResult {
  ok: boolean;
  env?: BackupEnvelope;
  error?: string;
}

/** 解析並驗證備份文字；currentVersion＝目前系統的 schema 版本（高於即拒絕還原） */
export function parseBackup(text: string, currentVersion: number): ParseResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: "檔案不是有效的 JSON" };
  }
  const d = data as Partial<BackupEnvelope> | null;
  if (!d || typeof d !== "object") return { ok: false, error: "檔案內容無法辨識" };
  if (d.schema !== BACKUP_SCHEMA) return { ok: false, error: "檔案格式不符，這不是本系統的備份檔" };
  if (typeof d.schemaVersion !== "number") return { ok: false, error: "備份檔缺少版本資訊" };
  if (d.schemaVersion > currentVersion)
    return { ok: false, error: `備份版本（v${d.schemaVersion}）高於目前系統（v${currentVersion}），請先更新系統再還原` };
  const state = d.state as { employees?: unknown } | undefined;
  if (!state || !Array.isArray(state.employees))
    return { ok: false, error: "備份內容不完整（缺少員工資料）" };
  return { ok: true, env: d as BackupEnvelope };
}
