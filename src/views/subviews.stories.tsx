import type { Meta, StoryObj } from "@storybook/react";
import { PayslipCard } from "@/views/PayslipCard";
import { AllocationEditor } from "@/views/AllocationEditor";
import { ProjectMasterCard } from "@/views/SettingsView";
import { ReportsView } from "@/views/ReportsView";
import { PayrollFlow } from "@/views/PayrollFlow";
import { usePayrollStore } from "@/store/usePayrollStore";
import { usePayrollRows } from "@/store/selectors";

// 內嵌／子畫面元件（讀 store 內建示範資料）。
const meta: Meta = { title: "畫面/子畫面", parameters: { layout: "fullscreen" } };
export default meta;
type S = StoryObj;

function PayslipDemo() {
  const { employees, currentPeriod } = usePayrollStore();
  const rows = usePayrollRows();
  const r = rows[0];
  const emp = employees.find((e) => e.id === r?.employeeId) ?? employees[0];
  if (!emp || !r) return <div className="p-4 text-sm text-muted-foreground">無示範資料</div>;
  return <div className="mx-auto max-w-2xl p-4"><PayslipCard emp={emp} r={r} period={currentPeriod} /></div>;
}

export const 薪資條_PayslipCard: S = { render: () => <PayslipDemo /> };
export const 工時分攤_AllocationEditor: S = { render: () => <div className="mx-auto max-w-[1000px] p-4"><AllocationEditor /></div> };
export const 專案主檔_ProjectMasterCard: S = { render: () => <div className="mx-auto max-w-[1000px] p-4"><ProjectMasterCard /></div> };
export const 月結報表_ReportsView: S = { render: () => <div className="mx-auto max-w-[1120px] p-4"><ReportsView /></div> };
export const 薪資結算流程_PayrollFlow: S = { render: () => <div className="mx-auto max-w-[1120px] p-4"><PayrollFlow step="monthly" onStep={() => {}} /></div> };
