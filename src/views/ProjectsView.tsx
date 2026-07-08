// 專案之家（/projects）＝專案主檔 ＋ 工時分攤 ＋ 成本/EAC 分析的整合入口。設計原理：
//  - 主檔（ProjectMasterCard）維護專案基本資料/預算/起訖；分攤（AllocationEditor）記每人每月
//    投入各專案的工時或百分比；成本頁以 projectCost/projectTrend 純函數算專案別全載成本與 EAC。
//  - 未投入專案的殘量歸「未分攤/間接」桶，確保 Σ專案成本＝Σ全公司雇主總成本（勾稽恆等）。
import { useState } from "react";
import { usePayrollStore } from "@/store/usePayrollStore";
import { usePayrollRows } from "@/store/selectors";
import { TabPills } from "@/components/ui/tab-pills";
import { ProjectMasterCard } from "@/views/SettingsView";
import { ProjectCostTab } from "@/views/AnalyticsView";
import { AllocationEditor } from "@/views/AllocationEditor";
import { Card, CardContent } from "@/components/ui/card";
import { HelpHint } from "@/components/HelpHint";
import { FolderKanban } from "lucide-react";

type Tab = "cost" | "alloc" | "master";
const TABS: [Tab, string][] = [
  ["cost", "成本與分析"],
  ["alloc", "工時分攤"],
  ["master", "專案主檔"],
];

/** 專案之家：主檔、工時分攤、成本/EAC/矩陣/charge-out 集中一頁 */
export function ProjectsView() {
  const [tab, setTab] = useState<Tab>("cost");
  const rows = usePayrollRows();
  const currentPeriod = usePayrollStore((s) => s.currentPeriod);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-lg font-bold"><FolderKanban className="size-5 text-primary" /> 專案 <HelpHint id="projects" /></h1>
        <p className="text-sm text-muted-foreground">
          專案主檔、每月工時分攤與專案人事成本/EAC 集中於此。成本依當月工時/百分比分攤全載成本（含雇主負擔）；
          各專案合計等於全公司人事成本。
        </p>
      </div>

      <TabPills tabs={TABS.map(([k, label]) => ({ key: k, label }))} value={tab} onChange={(k) => setTab(k as Tab)} />

      {tab === "master" && <ProjectMasterCard />}
      {tab === "alloc" && <AllocationEditor />}
      {tab === "cost" && (
        rows.length === 0
          ? <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">尚無當期薪資資料，無法分攤。請先於「每月薪資作業」建立。</CardContent></Card>
          : <ProjectCostTab rows={rows} period={currentPeriod} />
      )}
    </div>
  );
}
