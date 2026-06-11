import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 金額顯示：千分位、整數元 */
export function ntd(value: number): string {
  return Math.round(value).toLocaleString("zh-TW");
}

/** 百分比顯示 */
export function pct(value: number): string {
  return `${(value * 100).toFixed(2).replace(/\.?0+$/, "")}%`;
}

/** 期間顯示："2026-01" → "2026年1月（民國115年）" */
export function formatPeriod(period: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(period);
  if (!m) return period;
  const year = Number(m[1]);
  return `${year}年${Number(m[2])}月（民國${year - 1911}年）`;
}
