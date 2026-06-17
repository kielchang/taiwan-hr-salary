import { useState } from "react";
import { cn } from "@/lib/utils";
import { ReportsView } from "@/views/ReportsView";
import { FilingView } from "@/views/FilingView";
import { HelpHint } from "@/components/HelpHint";
import { FileText } from "lucide-react";

type Group = "monthly" | "filing";
const GROUPS: [Group, string, string][] = [
  ["monthly", "月結報表", "本月薪資條、部門/成本中心/專案匯總、代扣所得稅"],
  ["filing", "年度申報與名冊", "年度扣繳憑單、勞健退繳費清單、投保級距申報、加退保作業"],
];

/** 報表與申報中心：所有對外（員工/主管機關）的「實際」報表單一出口 */
export function ReportsHubView() {
  const [group, setGroup] = useState<Group>("monthly");
  const desc = GROUPS.find(([g]) => g === group)?.[2] ?? "";
  return (
    <div className="space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-lg font-bold"><FileText className="size-5 text-primary" /> 報表與申報 <HelpHint id="reports" /></h1>
        <p className="text-sm text-muted-foreground">對外（員工／主管機關）的實際報表都在這裡：月結報表與年度申報／名冊作業。規劃試算報表請見「規劃與分析」。</p>
      </div>
      <div className="flex flex-wrap gap-1">
        {GROUPS.map(([g, label]) => (
          <button key={g} onClick={() => setGroup(g)}
            className={cn("rounded-md px-3 py-1.5 text-sm", group === g ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-accent")}>
            {label}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{desc}</p>
      {group === "monthly" ? <ReportsView /> : <FilingView />}
    </div>
  );
}
