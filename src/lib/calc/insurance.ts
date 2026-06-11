// §5.6 法定社會保險（員工自付／雇主負擔）— 純函數
import type { Parameters } from "@/config/parameters";
import { round } from "@/lib/rounding";
import type { InsuredAmounts } from "./brackets";

export interface InsurancePremiums {
  // 員工自付
  laborEmployee: number; // 勞保自付
  healthEmployee: number; // 健保自付（含眷屬）
  pensionVoluntary: number; // 勞退自提（免稅）
  // 雇主負擔
  laborEmployer: number; // 勞保雇主
  occupationalEmployer: number; // 職保雇主（全額）
  healthEmployer: number; // 健保雇主（×1.56）
  pensionEmployer: number; // 勞退雇主 6%
}

/**
 * 四險保費（對照 Excel 薪資總表 Q/R/S/Z/AA/AB/AC 欄，附錄A §A2）。
 *
 * 乘法順序刻意與 Excel 公式逐字一致，使 IEEE-754 中間值位元等價、
 * 捨入結果與繳款單／參考實作相同（例：45800×0.125×0.7＝4007.4999… → 4007）。
 *
 * ⚠ 健保自付採「先 round 單口金額、再乘 (1＋計費眷口數)」（§5.6、§6）：
 *    順序顛倒會與健保署分擔金額表產生系統性偏差。
 */
export function insurancePremiums(
  insured: InsuredAmounts,
  billableDependents: number, // 計費眷口數＝min(健保眷屬數, 3)
  voluntaryPensionRate: number, // 勞退自提率 0~0.06
  p: Parameters,
): InsurancePremiums {
  return {
    laborEmployee: round(
      insured.labor * p.laborEmploymentRate * p.laborEmployeeShare,
    ),
    healthEmployee:
      round(insured.health * p.healthRate * p.healthEmployeeShare) *
      (1 + billableDependents),
    pensionVoluntary: round(insured.pension * voluntaryPensionRate),

    laborEmployer: round(
      insured.labor * p.laborEmploymentRate * p.laborEmployerShare,
    ),
    occupationalEmployer: round(insured.occupational * p.occupationalRate),
    healthEmployer: round(
      insured.health *
        p.healthRate *
        p.healthEmployerShare *
        (1 + p.healthAvgDependents),
    ),
    pensionEmployer: round(insured.pension * p.pensionEmployerRate),
  };
}
