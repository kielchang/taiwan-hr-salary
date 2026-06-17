import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 金額顯示：千分位、整數元 */
export function ntd(value: number): string {
  return Math.round(value).toLocaleString("zh-TW");
}

/** 百分比顯示（去尾零；保留給既有呼叫者） */
export function pct(value: number): string {
  return `${(value * 100).toFixed(2).replace(/\.?0+$/, "")}%`;
}

/** 百分比顯示（固定小數位，全站統一比率/百分比格式）。value 為比值（0.085→「8.5%」）。 */
export function pctOf(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`;
}

/** compa-ratio／比率以百分比顯示（全站統一：1.05→「105%」）。 */
export function ratioPct(value: number, digits = 0): string {
  return `${(value * 100).toFixed(digits)}%`;
}

/** 帶正負號的金額（差異欄用）：1234→「+1,234」、-1234→「-1,234」 */
export function signedNtd(value: number): string {
  const r = Math.round(value);
  return `${r > 0 ? "+" : r < 0 ? "−" : ""}${ntd(Math.abs(r))}`;
}

/** 期間顯示："2026-01" → "2026年1月（民國115年）" */
export function formatPeriod(period: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(period);
  if (!m) return period;
  const year = Number(m[1]);
  return `${year}年${Number(m[2])}月（民國${year - 1911}年）`;
}
