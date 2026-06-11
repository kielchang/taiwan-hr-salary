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
