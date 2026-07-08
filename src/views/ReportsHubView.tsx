// 報表與申報中心（/reports）＝所有「對外（員工／主管機關）實際報表」的**單一出口**。
// 設計原理：
//  - 兩大群組：月結報表（ReportsView：薪資條/匯總/代扣稅）與年度申報名冊（FilingView：扣繳
//    憑單/繳費清單/級距申報/加退保）。規劃試算類報表刻意放「規劃與分析」，與 actual 分流。
//  - 報表沿用全域月份，但在此醒目顯示並可直接切換（避免印錯月份）；未確認月標「暫定」。
//  - 支援 ?tab= 深連結（工作台待辦一鍵跳到對應報表），消化後即清除參數避免殘留。
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { cn, formatPeriod } from "@/lib/utils";
import { usePayrollStore } from "@/store/usePayrollStore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ReportsView, type ReportsTab } from "@/views/ReportsView";
import { FilingView, type FilingTab } from "@/views/FilingView";
import { HelpHint } from "@/components/HelpHint";
import { FileText } from "lucide-react";

type Group = "monthly" | "filing";
const GROUPS: [Group, string, string][] = [
  ["monthly", "月結報表", "本月薪資條、部門/成本中心/專案匯總、代扣所得稅"],
  ["filing", "年度申報與名冊", "年度扣繳憑單、勞健退繳費清單、投保級距申報、加退保作業"],
];
const MONTHLY_TABS = new Set(["summary", "tax", "payslip"]);
const FILING_TABS = new Set(["withholding", "insurance", "bracket", "enrollment"]);

/** 報表與申報中心：所有對外（員工/主管機關）的「實際」報表單一出口。支援 ?tab= 深連結（工作台跳轉用）。 */
export function ReportsHubView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [group, setGroup] = useState<Group>(tabParam && FILING_TABS.has(tabParam) ? "filing" : "monthly");
  const [monthlyTab, setMonthlyTab] = useState<ReportsTab | undefined>(tabParam && MONTHLY_TABS.has(tabParam) ? (tabParam as ReportsTab) : undefined);
  const [filingTab, setFilingTab] = useState<FilingTab | undefined>(tabParam && FILING_TABS.has(tabParam) ? (tabParam as FilingTab) : undefined);
  const { currentPeriod, setCurrentPeriod, confirmations } = usePayrollStore();
  const confirmed = Boolean(confirmations[currentPeriod]);

  // 消化過的 ?tab= 參數即清除，避免殘留影響後續切換
  useEffect(() => {
    if (tabParam) {
      if (FILING_TABS.has(tabParam)) { setGroup("filing"); setFilingTab(tabParam as FilingTab); }
      else if (MONTHLY_TABS.has(tabParam)) { setGroup("monthly"); setMonthlyTab(tabParam as ReportsTab); }
      setSearchParams({}, { replace: true });
    }
  }, [tabParam, setSearchParams]);

  const desc = GROUPS.find(([g]) => g === group)?.[2] ?? "";
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-bold"><FileText className="size-5 text-primary" /> 報表與申報 <HelpHint id="reports" /></h1>
          <p className="text-sm text-muted-foreground">對外（員工／主管機關）的實際報表都在這裡：月結報表與年度申報／名冊作業。規劃試算報表請見「規劃與分析」。</p>
        </div>
        {/* 期間可視可控：報表沿用全域月份，這裡醒目顯示並可直接切換，避免印錯月份 */}
        <div className="space-y-1 print:hidden">
          <Label className="text-xs">報表月份</Label>
          <div className="flex items-center gap-2">
            <Input type="month" className="h-9 w-40 col-input" value={currentPeriod}
              onChange={(e) => e.target.value && setCurrentPeriod(e.target.value)} />
            {confirmed ? <Badge variant="success">已確認</Badge> : <Badge variant="warning">未確認・暫定</Badge>}
          </div>
          <p className="text-[11px] text-muted-foreground">{formatPeriod(currentPeriod)}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1 print:hidden">
        {GROUPS.map(([g, label]) => (
          <button key={g} onClick={() => setGroup(g)}
            className={cn("rounded-md px-3 py-1.5 text-sm", group === g ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-accent")}>
            {label}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground print:hidden">{desc}</p>
      {group === "monthly"
        ? <ReportsView key={monthlyTab ?? "d"} initialTab={monthlyTab} />
        : <FilingView key={filingTab ?? "d"} initialTab={filingTab} />}
    </div>
  );
}
