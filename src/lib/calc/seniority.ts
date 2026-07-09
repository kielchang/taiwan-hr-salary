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

/** 當期（yyyy-mm）月底日 ISO（純算，由 y/m 決定）。 */
function periodMonthEnd(period: string): string | null {
  const [y, m] = period.split("-").map(Number);
  if (!y || !m) return null;
  return `${period}-${String(new Date(y, m, 0).getDate()).padStart(2, "0")}`;
}

/**
 * 解析年資/特休的「基準（截止）日」：
 * - hireDate（週年制）：以「當期（period）月底」為截止日 → 每位員工依到職日算到當月的實際年資（逐月累進）。
 * - fixedDate（曆年制）：`fixedBaseDate` 以**月-日**（"MM-DD"）表示的年度基準日（相容舊的完整 "YYYY-MM-DD"）；
 *   截止日＝「當期月底之前、最近一次的基準日」（即當前休假年度的起算點）。例：基準 06-01、當期 2026-03 → 2025-06-01。
 * 未提供 period（如 TC-9 無期間路徑；年資僅顯示、不入總額）時回退：完整日期原樣、月-日則給哨兵年（年資 0，不影響 TC-9）。
 */
export function seniorityRefDate(basis: SeniorityBasis | undefined, fixedBaseDate: string, period?: string): string {
  if (basis === "hireDate") {
    return (period && periodMonthEnd(period)) || fixedBaseDate;
  }
  const mmdd = fixedBaseDate.length >= 8 ? fixedBaseDate.slice(-5) : fixedBaseDate; // 相容 "YYYY-MM-DD"→取 MM-DD
  if (!/^\d{2}-\d{2}$/.test(mmdd)) return fixedBaseDate; // 非預期格式：保守原樣
  if (!period) return fixedBaseDate.length >= 10 ? fixedBaseDate : `0001-${mmdd}`;
  const py = Number(period.slice(0, 4));
  const pEnd = periodMonthEnd(period)!;
  const thisYear = `${py}-${mmdd}`;
  return thisYear <= pEnd ? thisYear : `${py - 1}-${mmdd}`; // 取當期月底前最近一次
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
