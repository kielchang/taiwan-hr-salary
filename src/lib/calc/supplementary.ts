// §5.7 二代健保補充保費（健保法 §31、§34）— 純函數（來源05）
import type { Parameters } from "@/config/parameters";
import { round } from "@/lib/rounding";

/**
 * 個人補充保費（獎金類，年度累計制）— 截斷形式。
 * 對照 Excel 薪資總表 U4（附錄A §A2）：
 *   門檻 ＝ 健保投保金額 × 4
 *   本次計費基礎 ＝ min(本次獎金, max(0, 累計獎金 − 門檻))
 *   補充保費 ＝ round(計費基礎 × 2.11%)，單次計費上限 1,000 萬。
 */
export function personalSupplementary(
  monthlyBonus: number,
  cumulativeBonus: number,
  healthInsured: number,
  p: Parameters,
): number {
  const threshold = healthInsured * 4;
  let base = Math.min(monthlyBonus, Math.max(0, cumulativeBonus - threshold));
  base = Math.min(base, p.supplementaryCap);
  return round(base * p.supplementaryRate);
}

/**
 * 個人補充保費 — 差分形式（與截斷形式等價，可互為驗算）。
 * 對照 Excel 獎金扣繳試算 H4＋I4（附錄A §A2）：
 *   計費基礎 ＝ max(0, 累計後獎金 − 門檻) − max(0, 發放前累計 − 門檻)
 */
export function supplementaryBaseDifferential(
  priorCumulativeBonus: number, // 本次發放前年度累計獎金
  thisBonus: number, // 本次獎金金額
  healthInsured: number,
  p: Parameters,
): { base: number; premium: number } {
  const threshold = healthInsured * 4;
  const after = priorCumulativeBonus + thisBonus; // 累計後獎金
  let base = Math.max(0, after - threshold) - Math.max(0, priorCumulativeBonus - threshold);
  base = Math.min(base, p.supplementaryCap);
  return { base, premium: round(base * p.supplementaryRate) };
}

/**
 * 投保單位（公司）補充保費 — 差額制。
 * 對照 Excel 薪資總表 E56（附錄A §A2）：
 *   round(max(0, 當月支付薪資所得總額 − 全體投保金額合計) × 2.11%)
 * 估算標示（P6）：以「應發合計」概算當月公司補充保費；申報應依扣繳憑單薪資總額核計。
 */
export function companySupplementary(
  totalGrossPay: number, // Σ 應發合計（概算）
  totalHealthInsured: number, // Σ 健保投保金額
  p: Parameters,
): number {
  return round(Math.max(0, totalGrossPay - totalHealthInsured) * p.supplementaryRate);
}
