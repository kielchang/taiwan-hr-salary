// §5.1 投保級距（分段查表）— 純函數
import type { InsuranceBrackets } from "@/config/brackets";

/**
 * 級距查表：取第一個 ≥ 月薪資總額之投保金額；超過最高級則取最高級（觸頂）。
 * 等價於 Excel VLOOKUP(...,TRUE)（附錄A §A2、附錄B §B3.2）。
 */
export function lookupBracket(brackets: number[], monthlySalaryTotal: number): number {
  for (const amount of brackets) {
    if (amount >= monthlySalaryTotal) return amount;
  }
  return brackets[brackets.length - 1]; // 觸頂
}

export interface InsuredAmounts {
  labor: number; // 勞保投保薪資
  occupational: number; // 職保投保薪資
  health: number; // 健保投保金額
  pension: number; // 勞退月提繳工資
}

/** 四險各自獨立查表（§5.1）— 同一員工四個值可能不同 */
export function lookupInsuredAmounts(
  brackets: InsuranceBrackets,
  monthlySalaryTotal: number,
): InsuredAmounts {
  return {
    labor: lookupBracket(brackets.labor, monthlySalaryTotal),
    occupational: lookupBracket(brackets.occupational, monthlySalaryTotal),
    health: lookupBracket(brackets.health, monthlySalaryTotal),
    pension: lookupBracket(brackets.pension, monthlySalaryTotal),
  };
}
