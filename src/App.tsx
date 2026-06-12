import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { usePayrollStore } from "@/store/usePayrollStore";
import { validateAll } from "@/lib/validation";
import { cn, formatPeriod } from "@/lib/utils";
import { SetupWizard } from "@/views/SetupWizard";
import { SettingsView } from "@/views/SettingsView";
import { MasterDataView } from "@/views/MasterDataView";
import { PayrollFlow, type PayrollStep } from "@/views/PayrollFlow";
import { HelpView } from "@/views/HelpView";
import { SourcesView } from "@/views/SourcesView";
import { CalendarClock, Users, Settings, BookOpen, Scale, Building2 } from "lucide-react";

/** 上排選單的主題（各自獨立、聚焦單一主題） */
export type Section = "payroll" | "master" | "settings" | "help" | "sources";

const MENU: { key: Section; label: string; icon: React.ElementType }[] = [
  { key: "payroll", label: "每月薪資作業", icon: CalendarClock },
  { key: "master", label: "基本資料", icon: Users },
  { key: "settings", label: "系統設定", icon: Settings },
  { key: "help", label: "使用說明", icon: BookOpen },
  { key: "sources", label: "法規依據", icon: Scale },
];

export default function App() {
  const [section, setSection] = useState<Section>("payroll");
  const [payrollStep, setPayrollStep] = useState<PayrollStep>("monthly");
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
    return (
      <SetupWizard
        onDone={() => {
          setSection("payroll");
          setPayrollStep("monthly");
        }}
      />
    );
  }

  const periodEvents = events.filter((e) => e.period === currentPeriod);
  const issues = validateAll(employees, salaries, dependents, periodEvents, parameters);
  const errors = issues.filter((i) => i.severity === "error").length;
  const confirmed = Boolean(confirmations[currentPeriod]);

  return (
    <div className="min-h-screen bg-muted/30">
      {/* 上排主選單：聚焦各主題 */}
      <header className="sticky top-0 z-40 border-b bg-background print:hidden">
        <div className="mx-auto max-w-[1280px] px-4">
          <div className="flex items-center justify-between gap-3 py-2.5">
            <div className="flex items-center gap-2">
              <Building2 className="size-6 text-primary" />
              <div className="leading-tight">
                <p className="text-sm font-bold">薪資管理系統</p>
                <p className="text-[11px] text-muted-foreground">115 年度（2026）</p>
              </div>
            </div>
            <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
              <span>本月：{formatPeriod(currentPeriod)}</span>
              {errors > 0 ? (
                <Badge variant="destructive">{errors} 項待處理</Badge>
              ) : (
                <Badge variant="success">資料正常</Badge>
              )}
              {section === "payroll" &&
                (confirmed ? <Badge variant="success">已確認</Badge> : <Badge variant="outline">未確認</Badge>)}
            </div>
          </div>

          {/* 主題選單列 */}
          <nav className="flex gap-1 overflow-x-auto">
            {MENU.map((m) => {
              const active = section === m.key;
              return (
                <button
                  key={m.key}
                  onClick={() => setSection(m.key)}
                  className={cn(
                    "flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  <m.icon className="size-4" />
                  {m.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* 內容：每個主題只顯示自己的選項 */}
      <main className="mx-auto max-w-[1280px] px-4 py-5">
        {section === "payroll" && <PayrollFlow step={payrollStep} onStep={setPayrollStep} />}
        {section === "master" && <MasterDataView />}
        {section === "settings" && <SettingsView />}
        {section === "help" && <HelpView onNavigate={setSection} />}
        {section === "sources" && <SourcesView />}
      </main>
    </div>
  );
}
