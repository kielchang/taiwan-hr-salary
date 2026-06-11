import { useState } from "react";
import { usePayrollStore } from "@/store/usePayrollStore";
import { validateAll } from "@/lib/validation";
import { Badge } from "@/components/ui/badge";
import { cn, formatPeriod } from "@/lib/utils";
import { SetupWizard } from "@/views/SetupWizard";
import { SettingsView } from "@/views/SettingsView";
import { MasterDataView } from "@/views/MasterDataView";
import { MonthlyView } from "@/views/MonthlyView";
import { ReviewView } from "@/views/ReviewView";
import { ReportsView } from "@/views/ReportsView";
import { HelpView } from "@/views/HelpView";
import { SourcesView } from "@/views/SourcesView";
import {
  Settings,
  Users,
  CalendarClock,
  ClipboardCheck,
  FileSpreadsheet,
  BookOpen,
  Scale,
  Building2,
} from "lucide-react";

export type PageKey =
  | "settings"
  | "master"
  | "monthly"
  | "review"
  | "reports"
  | "help"
  | "sources";

const NAV: {
  group: string;
  items: { key: PageKey; label: string; icon: React.ElementType; hint?: string }[];
}[] = [
  {
    group: "系統",
    items: [{ key: "settings", label: "系統設定", icon: Settings, hint: "費率與基本參數" }],
  },
  {
    group: "資料維護",
    items: [{ key: "master", label: "基本資料", icon: Users, hint: "員工・薪資・眷屬" }],
  },
  {
    group: "每月作業",
    items: [
      { key: "monthly", label: "① 薪資結算", icon: CalendarClock, hint: "出勤與獎金輸入" },
      { key: "review", label: "② 結算查核", icon: ClipboardCheck, hint: "總覽確認・獎金試算" },
      { key: "reports", label: "③ 報表與薪資條", icon: FileSpreadsheet, hint: "匯總・扣繳・薪資條" },
    ],
  },
  {
    group: "說明",
    items: [
      { key: "help", label: "使用說明", icon: BookOpen },
      { key: "sources", label: "法規與費率依據", icon: Scale },
    ],
  },
];

export default function App() {
  const [page, setPage] = useState<PageKey>("monthly");
  const {
    setupCompleted,
    employees,
    salaries,
    dependents,
    events,
    parameters,
    currentPeriod,
    confirmations,
  } = usePayrollStore();

  if (!setupCompleted) {
    return <SetupWizard onDone={() => setPage("monthly")} />;
  }

  const periodEvents = events.filter((e) => e.period === currentPeriod);
  const issues = validateAll(employees, salaries, dependents, periodEvents, parameters);
  const errors = issues.filter((i) => i.severity === "error").length;
  const confirmed = Boolean(confirmations[currentPeriod]);

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* 側邊導覽：依每月作業流程排序 */}
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-background md:flex print:hidden">
        <div className="flex items-center gap-2 border-b px-4 py-4">
          <Building2 className="size-6 text-primary" />
          <div>
            <p className="text-sm font-bold leading-tight">薪資管理系統</p>
            <p className="text-[11px] text-muted-foreground">115年度（2026）</p>
          </div>
        </div>
        <nav className="flex-1 space-y-4 overflow-y-auto p-3">
          {NAV.map((g) => (
            <div key={g.group}>
              <p className="px-2 pb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {g.group}
              </p>
              <div className="space-y-0.5">
                {g.items.map((it) => (
                  <button
                    key={it.key}
                    onClick={() => setPage(it.key)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors",
                      page === it.key
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-accent",
                    )}
                  >
                    <it.icon className="size-4 shrink-0" />
                    <span className="flex-1">
                      {it.label}
                      {it.hint && (
                        <span
                          className={cn(
                            "block text-[11px]",
                            page === it.key ? "text-primary-foreground/70" : "text-muted-foreground",
                          )}
                        >
                          {it.hint}
                        </span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t p-3 text-[11px] text-muted-foreground">
          資料儲存在這台電腦的瀏覽器中，不會上傳。
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* 頂列：行動版導覽＋目前期間與狀態 */}
        <header className="border-b bg-background px-4 py-3 print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1 md:hidden">
              {NAV.flatMap((g) => g.items).map((it) => (
                <button
                  key={it.key}
                  onClick={() => setPage(it.key)}
                  className={cn(
                    "rounded-md px-2 py-1 text-xs",
                    page === it.key ? "bg-primary text-primary-foreground" : "bg-muted",
                  )}
                >
                  {it.label}
                </button>
              ))}
            </div>
            <div className="hidden text-sm text-muted-foreground md:block">
              發薪期間：<span className="font-medium text-foreground">{formatPeriod(currentPeriod)}</span>
            </div>
            <div className="flex items-center gap-2">
              {errors > 0 ? (
                <Badge variant="destructive">{errors} 項資料需處理</Badge>
              ) : (
                <Badge variant="success">資料檢查通過</Badge>
              )}
              {confirmed ? (
                <Badge variant="success">本月已確認</Badge>
              ) : (
                <Badge variant="outline">本月尚未確認</Badge>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-5">
          {page === "settings" && <SettingsView />}
          {page === "master" && <MasterDataView />}
          {page === "monthly" && <MonthlyView onNavigate={setPage} />}
          {page === "review" && <ReviewView onNavigate={setPage} />}
          {page === "reports" && <ReportsView />}
          {page === "help" && <HelpView onNavigate={setPage} />}
          {page === "sources" && <SourcesView />}
        </main>
      </div>
    </div>
  );
}
