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
