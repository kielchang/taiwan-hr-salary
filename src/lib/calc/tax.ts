// §5.8 當月應稅薪資（估算）、§5.9 所得稅扣繳（分流規則）— 純函數（來源04）
import type { Parameters } from "@/config/parameters";
import type { TaxResidency, WithholdingMethod } from "@/lib/types";
import { round } from "@/lib/rounding";

/**
 * §5.8 當月應稅薪資（估，P6 標示）
 * ＝ 應發合計 − 加班費 − 當月獎金 − 勞退自提 − min(伙食津貼, 免稅額 3,000)
 * 對照 Excel 所得稅扣繳對照 G4（附錄A §A2）。
 */
export function taxableSalary(
  grossPay: number,
  overtimePay: number,
  monthlyBonus: number,
  pensionVoluntary: number,
  mealAllowance: number,
  p: Parameters,
): number {
  return (
    grossPay -
    overtimePay -
    monthlyBonus -
    pensionVoluntary -
    Math.min(mealAllowance, p.mealAllowanceExemption)
  );
}

/**
 * §5.9 估算起扣點（查表分支）＝ 起扣標準 90,501 ＋ 扶養人數 × 每名提高額 8,417（P6 估算）。
 * 非居住者無起扣標準，回傳 null。
 */
export function estimatedTaxThreshold(
  residency: TaxResidency,
  dependents: number,
  p: Parameters,
): number | null {
  if (residency === "非居住者") return null;
  return p.taxThresholdBase + dependents * p.taxThresholdPerDependent;
}

/** 建議代扣稅額：全自動金額，或查表人工控制點（§5.9、§7） */
export type WithholdingSuggestion =
  | { type: "auto"; amount: number } // 全自動：直接給數值
  | { type: "manual-lookup"; hint: string }; // 人工控制點：查官方稅額表

/**
 * §5.9 居住者／非居住者每月扣繳分流（對照 Excel 所得稅扣繳對照 I4，附錄A §A2）：
 *  - 非居住者：≤ 門檻 44,250 → 6%；＞ 門檻 → 18%（全自動）
 *  - 居住者・固定5%：round(應稅×5%) > 免扣上限 2,000 → 扣；否則 0（全自動）
 *  - 居住者・查表：應稅 < 估算起扣點 → 0；≥ → 查官方稅額表（人工控制點）
 */
export function withholdingSuggestion(
  taxable: number,
  residency: TaxResidency,
  method: WithholdingMethod,
  dependents: number,
  p: Parameters,
): WithholdingSuggestion {
  if (residency === "非居住者") {
    const rate = taxable <= p.nonResidentThreshold ? p.nonResidentRateLow : p.nonResidentRateHigh;
    return { type: "auto", amount: round(taxable * rate) };
  }
  if (method === "固定5%") {
    const temp = round(taxable * p.fixedWithholdingRate);
    return { type: "auto", amount: temp <= p.withholdingExemptionCap ? 0 : temp };
  }
  // 居住者・查表
  const threshold = p.taxThresholdBase + dependents * p.taxThresholdPerDependent;
  if (taxable < threshold) return { type: "auto", amount: 0 };
  return { type: "manual-lookup", hint: "查115年扣繳稅額表" };
}

/** 獎金（非每月給付）扣繳 — 5% 分支（§5.9 末段，對照 Excel 獎金試算 J4） */
export type BonusWithholding =
  | { type: "auto"; amount: number }
  | { type: "merge-monthly"; hint: string }; // 非居住者：併當月薪資依 6%/18%

export function bonusWithholding(
  thisBonus: number,
  residency: TaxResidency,
  p: Parameters,
): BonusWithholding {
  if (residency === "非居住者") return { type: "merge-monthly", hint: "併當月薪資依6%/18%" };
  if (thisBonus >= p.taxThresholdBase) {
    return { type: "auto", amount: round(thisBonus * p.fixedWithholdingRate) };
  }
  return { type: "auto", amount: 0 }; // 未達起扣標準免扣（仍應列單申報）
}
