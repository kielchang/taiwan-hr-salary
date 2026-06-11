// §3.2 眷屬統計（P4 分流眷屬模型）— 純函數
// 對照 Excel 員工清單 N／V／O 欄之 COUNTIFS／MIN（附錄A §A2）。
import type { Parameters } from "@/config/parameters";
import type { Dependent } from "@/lib/types";

export interface DependentStats {
  healthDependents: number; // 健保眷屬數＝「依附健保＝是」人數
  taxDependents: number; // 扶養人數＝「報稅扶養＝是」人數
  billableDependents: number; // 計費眷口數＝min(健保眷屬數, 3)
}

export function dependentStats(
  dependents: Dependent[],
  employeeId: string,
  p: Parameters,
): DependentStats {
  const own = dependents.filter((d) => d.employeeId === employeeId);
  const healthDependents = own.filter((d) => d.enrolledInHealthInsurance).length;
  const taxDependents = own.filter((d) => d.taxDependent).length;
  return {
    healthDependents,
    taxDependents,
    billableDependents: Math.min(healthDependents, p.healthDependentCap),
  };
}
