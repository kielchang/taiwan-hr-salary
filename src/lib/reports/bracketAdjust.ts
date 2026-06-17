// B3 投保級距申報調整工作清單（純函數）：比對「目前薪資算出的投保金額」與「已申報基準」，
// 找出 2/8 月應辦理級距調整者（調高/調低）。
import type { DeclaredInsured } from "@/lib/types";
import type { InsuredAmounts } from "@/lib/calc/brackets";

export interface BracketAdjustRow {
  employeeId: string;
  name: string;
  current: { labor: number; health: number; pension: number };
  declared: { labor: number; health: number; pension: number } | null;
  changed: boolean; // 與基準不同（或無基準）
}

export interface BracketInput {
  employeeId: string;
  name: string;
  insured: InsuredAmounts;
}

/** 回傳所有員工的對照；changed=true 者即需申報調整（或尚未設基準） */
export function bracketWorklist(rows: BracketInput[], declared: DeclaredInsured[]): BracketAdjustRow[] {
  const map = new Map(declared.map((d) => [d.employeeId, d]));
  return rows.map((r) => {
    const d = map.get(r.employeeId);
    const current = { labor: r.insured.labor, health: r.insured.health, pension: r.insured.pension };
    const declaredVals = d ? { labor: d.labor, health: d.health, pension: d.pension } : null;
    const changed =
      !declaredVals ||
      declaredVals.labor !== current.labor ||
      declaredVals.health !== current.health ||
      declaredVals.pension !== current.pension;
    return { employeeId: r.employeeId, name: r.name, current, declared: declaredVals, changed };
  });
}
