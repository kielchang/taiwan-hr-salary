// 表單欄位比對工具：供「變更偵測 / 送出前摘要 / 稽核 before→after」共用。
import { pctOf } from "@/lib/utils";

export type FieldKind = "text" | "number" | "money" | "rate" | "date" | "select" | "checkbox";

/** 一個欄位的中繼資料（各表單宣告，驅動比對與顯示） */
export interface FieldSpec {
  key: string;
  label: string;
  kind: FieldKind;
  /** 覆寫顯示格式（如 select 值→標籤）；優先於 kind 預設格式 */
  format?: (v: unknown) => string;
}

/** 一筆欄位變更（含格式化後字串，供摘要與稽核直接顯示） */
export interface Change {
  field: string;
  label: string;
  before: unknown;
  after: unknown;
  beforeText: string;
  afterText: string;
}

/** 空值：null / undefined / "" 視為等價 */
export function isEmptyValue(v: unknown): boolean {
  return v === null || v === undefined || v === "";
}

/** 欄位等值判定（供變更偵測與還原）：空值等價、數字以數值比較、其餘嚴格。 */
export function eqValue(a: unknown, b: unknown): boolean {
  if (isEmptyValue(a) && isEmptyValue(b)) return true;
  if (typeof a === "number" || typeof b === "number") {
    const na = Number(a);
    const nb = Number(b);
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na === nb;
  }
  return a === b;
}

/** 依 kind 產生顯示字串（空值→「—」）。 */
export function fmtValue(v: unknown, kind: FieldKind, format?: (v: unknown) => string): string {
  if (format) return format(v);
  if (isEmptyValue(v)) return "—";
  switch (kind) {
    case "money":
      // 金額：整數千分位（如 45,000）
      return Number(v).toLocaleString("zh-TW", { maximumFractionDigits: 0 });
    case "rate":
      // 比率：百分比（如 6.0%）
      return pctOf(Number(v));
    case "number":
      // 一般數字：千分位並保留小數（如 8.5、1,250、0.06）
      return Number(v).toLocaleString("zh-TW", { maximumFractionDigits: 4 });
    case "checkbox":
      return v ? "是" : "否";
    default:
      return String(v);
  }
}

/** 比對原始物件與草稿，回傳有變更的欄位（依 specs 順序）。 */
export function diffRecord<T extends Record<string, unknown>>(
  original: T | undefined,
  draft: T,
  specs: FieldSpec[],
): Change[] {
  const out: Change[] = [];
  for (const s of specs) {
    const before = original ? original[s.key] : undefined;
    const after = draft[s.key];
    if (eqValue(before, after)) continue;
    out.push({
      field: s.key,
      label: s.label,
      before,
      after,
      beforeText: fmtValue(before, s.kind, s.format),
      afterText: fmtValue(after, s.kind, s.format),
    });
  }
  return out;
}
