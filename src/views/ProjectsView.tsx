import { useState } from "react";
import { usePayrollStore } from "@/store/usePayrollStore";
import { usePayrollRows } from "@/store/selectors";
import { cn } from "@/lib/utils";
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

      <div className="flex flex-wrap gap-1">
        {TABS.map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            className={cn("rounded-md px-3 py-1.5 text-sm", tab === k ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-accent")}>
            {label}
          </button>
        ))}
      </div>

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
