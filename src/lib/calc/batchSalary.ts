// 批次薪資作業：把一個 BatchSalaryOp 套到單一員工的薪資結構，回傳新結構（純函數，供 store 套用與 UI 預覽共用）。
import type { SalaryStructure, BatchSalaryOp } from "@/lib/types";
import { monthlySalaryTotal } from "./wage";
import { round } from "@/lib/rounding";

/** 標準津貼欄位的中文標籤（供操作摘要）。 */
export const SAL_FIELD_LABEL: Record<string, string> = {
  baseSalary: "本薪", managerAllowance: "主管加給", dutyAllowance: "職務加給",
  professionalAllowance: "專業／技術加給", mealAllowance: "伙食津貼", transportAllowance: "交通津貼",
  attendanceBonus: "全勤獎金", otherFixedAllowance: "其他固定津貼",
};

/** 操作的一句話描述（族群摘要用）。 */
export function batchOpLabel(op: BatchSalaryOp): string {
  if (op.kind === "addAllowance") {
    return `新增津貼「${op.name}」＝${op.amountKind === "fixed" ? `${op.value.toLocaleString()} 元` : `本薪 ${op.value}%`}`;
  }
  const amt = op.amountKind === "fixed" ? `${op.value.toLocaleString()} 元` : op.amountKind === "pctBase" ? `本薪 ${op.value}%` : `月薪資總額 ${op.value}%`;
  const verb = op.mode === "add" ? "加" : op.mode === "subtract" ? "減" : "設為";
  return `${SAL_FIELD_LABEL[op.target] ?? op.target} ${verb} ${amt}`;
}

/**
 * 把批次操作套到單一員工薪資結構。
 * - adjust：對指定標準欄位加/減/設為，量＝定額／本薪%／月薪資總額%（各欄位下限 0，四捨五入到元）。
 * - addAllowance：以定額或本薪% 併入一筆命名 customAllowance（id 由呼叫端提供以利可測/唯一）。
 */
export function applyBatchOp(s: SalaryStructure, op: BatchSalaryOp, opts?: { allowanceId?: string }): SalaryStructure {
  if (op.kind === "addAllowance") {
    const amount = op.amountKind === "fixed" ? Math.round(op.value) : round((s.baseSalary * op.value) / 100);
    const ca = [...(s.customAllowances ?? []), { id: opts?.allowanceId ?? `CA${s.employeeId}${(s.customAllowances?.length ?? 0)}`, name: op.name, amount }];
    return { ...s, customAllowances: ca };
  }
  const basis = op.amountKind === "pctBase" ? s.baseSalary : op.amountKind === "pctTotal" ? monthlySalaryTotal(s) : 0;
  const magnitude = op.amountKind === "fixed" ? Math.round(op.value) : round((basis * op.value) / 100);
  const cur = s[op.target];
  const next = op.mode === "set" ? magnitude : op.mode === "add" ? cur + magnitude : cur - magnitude;
  return { ...s, [op.target]: Math.max(0, Math.round(next)) };
}
