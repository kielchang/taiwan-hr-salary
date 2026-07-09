// §5.2 年資與特別休假 — 純函數（勞基法 §38、來源03）
import { SENIORITY_LEAVE_TABLE } from "@/config/brackets";

/**
 * 年資月數＝到職日至基準日之足月數（週年制）。
 * 對應 Excel DATEDIF 之足月計算：未滿一個月不計。
 */
export function seniorityMonths(hireDate: string, baseDate: string): number {
  const h = new Date(hireDate);
  const b = new Date(baseDate);
  if (Number.isNaN(h.getTime()) || Number.isNaN(b.getTime())) return 0;
  let months =
    (b.getFullYear() - h.getFullYear()) * 12 + (b.getMonth() - h.getMonth());
  if (b.getDate() < h.getDate()) months -= 1; // 未滿足月不計
  return Math.max(0, months);
}

/** 年資/特休的基準日計算方式：fixedDate＝公司統一固定基準日；hireDate＝依到職日算實際年資（截至當期月底）。 */
export type SeniorityBasis = "fixedDate" | "hireDate";

/**
 * 解析年資/特休的「基準（截止）日」：
 * - fixedDate（預設）：回傳公司固定基準日 `fixedBaseDate`（全體同一日，行為與先前相同）。
 * - hireDate：以「當期（period）月底」為截止日 → 每位員工依到職日算到當月的實際年資（週年制、逐月累進）；
 *   未提供 period（如 TC-9 無期間路徑）時回退固定基準日，保持純函數與既有結果不變。
 */
export function seniorityRefDate(basis: SeniorityBasis | undefined, fixedBaseDate: string, period?: string): string {
  if (basis === "hireDate" && period) {
    const [y, m] = period.split("-").map(Number);
    if (y && m) {
      const lastDay = new Date(y, m, 0).getDate(); // 當期月底日（由 y/m 決定，純算）
      return `${period}-${String(lastDay).padStart(2, "0")}`;
    }
  }
  return fixedBaseDate;
}

/** 年資月數 → "N年M月" 顯示 */
export function formatSeniority(months: number): string {
  return `${Math.floor(months / 12)}年${months % 12}月`;
}

/**
 * 本年特休日數＝查特休對照表（取最後一個「年資月數下限 ≤ 年資月數」之天數）。
 * 滿 6 月→3、1 年→7、2 年→10、3 年→14、5 年→15、10 年起每滿 1 年＋1，上限 30。
 */
export function annualLeaveDays(months: number): number {
  let days = 0;
  for (const [floor, value] of SENIORITY_LEAVE_TABLE) {
    if (months >= floor) days = value;
    else break;
  }
  return days;
}
