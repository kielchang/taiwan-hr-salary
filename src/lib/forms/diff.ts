// 表單欄位比對工具：供「變更偵測 / 送出前摘要 / 稽核 before→after」共用。

export type FieldKind = "text" | "number" | "money" | "rate" | "date" | "select" | "checkbox" | "radio" | "multiselect";

/** 一個欄位的中繼資料（各表單宣告，驅動比對與顯示） */
export interface FieldSpec {
  key: string;
  label: string;
  kind: FieldKind;
  /** 覆寫顯示格式（如 select 值→標籤）；優先於 kind 預設格式 */
  format?: (v: unknown) => string;
  /** 單位（英文/符號，如 h、hrs）；接於數字後 */
  unit?: string;
}

/** 不四捨五入的數字格式（千分位、保留實際小數）；顯示端不進位，交由計算端。 */
export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return String(n);
  return n.toLocaleString("en-US", { maximumFractionDigits: 10 });
}

/** 金額：$ 符號＋千分位；負值以帳務括號呈現（($2,000)）。紅字由 UI 套用。 */
export function formatMoney(n: number): string {
  if (!Number.isFinite(n)) return String(n);
  return n < 0 ? `($${formatNumber(-n)})` : `$${formatNumber(n)}`;
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

/** 欄位等值判定（供變更偵測與還原）：陣列比集合、空值等價、數字以數值比較、其餘嚴格。 */
export function eqValue(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) || Array.isArray(b)) {
    const sa = (Array.isArray(a) ? [...a] : []).map(String).sort();
    const sb = (Array.isArray(b) ? [...b] : []).map(String).sort();
    return sa.length === sb.length && sa.every((x, i) => x === sb[i]);
  }
  if (isEmptyValue(a) && isEmptyValue(b)) return true;
  if (typeof a === "number" || typeof b === "number") {
    const na = Number(a);
    const nb = Number(b);
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na === nb;
  }
  return a === b;
}

/** 依 kind 產生顯示字串（空值→「—」）。 */
export function fmtValue(v: unknown, kind: FieldKind, format?: (v: unknown) => string, unit?: string): string {
  if (format) return format(v);
  if (Array.isArray(v)) return v.length ? v.join("、") : "—";
  if (isEmptyValue(v)) return "—";
  const withUnit = (s: string) => (unit ? `${s} ${unit}` : s);
  switch (kind) {
    case "money":
      // 金額：$ 千分位、不進位、負值帳務括號（($2,000)）
      return formatMoney(Number(v));
    case "rate":
      // 比率：百分比符號（%）；清除浮點雜訊、不做語意進位
      return `${(Number(v) * 100).toLocaleString("en-US", { maximumFractionDigits: 6 })}%`;
    case "number":
      // 一般數字：千分位、不進位（保留實際小數）＋選填單位
      return withUnit(formatNumber(Number(v)));
    case "checkbox":
      return v ? "是" : "否";
    default:
      return withUnit(String(v));
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
      beforeText: fmtValue(before, s.kind, s.format, s.unit),
      afterText: fmtValue(after, s.kind, s.format, s.unit),
    });
  }
  return out;
}
