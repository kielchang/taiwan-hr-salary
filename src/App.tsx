import { useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  Outlet,
  NavLink,
  useNavigate,
  useParams,
  useLocation,
} from "react-router-dom";
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
import { AttendanceView } from "@/views/AttendanceView";
import { AnalyticsView } from "@/views/AnalyticsView";
import { ProjectsView } from "@/views/ProjectsView";
import { ReportsHubView } from "@/views/ReportsHubView";
import {
  CalendarClock, Users, Settings, BookOpen, Scale, Building2, Clock, BarChart3,
  FileText, FolderKanban, Menu,
} from "lucide-react";

type NavItem = { to: string; match: string; label: string; icon: React.ElementType; tag?: "例行" | "試算" };

/** 側邊欄：依領域分區（每月作業／規劃分析／專案／報表申報／主檔設定／說明） */
const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  { title: "每月作業", items: [
    { to: "/payroll/monthly", match: "/payroll", label: "薪資結算", icon: CalendarClock, tag: "例行" },
    { to: "/attendance", match: "/attendance", label: "出勤打卡", icon: Clock },
  ] },
  { title: "規劃與分析", items: [
    { to: "/analytics", match: "/analytics", label: "薪酬分析", icon: BarChart3, tag: "試算" },
  ] },
  { title: "專案", items: [
    { to: "/projects", match: "/projects", label: "專案", icon: FolderKanban },
  ] },
  { title: "報表與申報", items: [
    { to: "/reports", match: "/reports", label: "報表與申報", icon: FileText, tag: "例行" },
  ] },
  { title: "主檔與設定", items: [
    { to: "/master", match: "/master", label: "基本資料", icon: Users },
    { to: "/settings", match: "/settings", label: "系統設定", icon: Settings },
  ] },
  { title: "說明", items: [
    { to: "/help", match: "/help", label: "使用說明", icon: BookOpen },
    { to: "/sources", match: "/sources", label: "法規依據", icon: Scale },
  ] },
];

const PAYROLL_STEPS: PayrollStep[] = ["monthly", "review"];

export default function App() {
  return (
    <Routes>
      <Route path="/setup" element={<SetupRoute />} />
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/payroll/monthly" replace />} />
        <Route path="/payroll/:step" element={<PayrollRoute />} />
        <Route path="/analytics" element={<AnalyticsView />} />
        <Route path="/projects" element={<ProjectsView />} />
        <Route path="/reports" element={<ReportsHubView />} />
        <Route path="/filing" element={<Navigate to="/reports" replace />} />
        <Route path="/attendance" element={<AttendanceView />} />
        <Route path="/master" element={<MasterDataView />} />
        <Route path="/settings" element={<SettingsView />} />
        <Route path="/help" element={<HelpView />} />
        <Route path="/sources" element={<SourcesView />} />
        <Route path="*" element={<Navigate to="/payroll/monthly" replace />} />
      </Route>
    </Routes>
  );
}

/** 初始設定引導路由 */
function SetupRoute() {
  const navigate = useNavigate();
  return <SetupWizard onDone={() => navigate("/payroll/monthly", { replace: true })} />;
}

/** 每月薪資作業路由：由網址 :step 控制目前步驟（reports 步驟已移至報表與申報中心） */
function PayrollRoute() {
  const { step } = useParams();
  const navigate = useNavigate();
  if (step === "reports") return <Navigate to="/reports" replace />;
  if (!PAYROLL_STEPS.includes(step as PayrollStep)) {
    return <Navigate to="/payroll/monthly" replace />;
  }
  return (
    <PayrollFlow step={step as PayrollStep} onStep={(s) => navigate(`/payroll/${s}`)} />
  );
}

/** 主版面：左側邊欄分區＋內容 Outlet；未完成初始設定則導向設定引導 */
function Layout() {
  const { setupCompleted, employees, salaries, dependents, events, parameters, currentPeriod, confirmations } =
    usePayrollStore();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  if (!setupCompleted) return <Navigate to="/setup" replace />;

  const periodEvents = events.filter((e) => e.period === currentPeriod);
  const issues = validateAll(employees, salaries, dependents, periodEvents, parameters);
  const errors = issues.filter((i) => i.severity === "error").length;
  const confirmed = Boolean(confirmations[currentPeriod]);

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-40 border-b bg-background print:hidden">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <button className="rounded-md p-1.5 hover:bg-accent md:hidden" onClick={() => setOpen((v) => !v)} aria-label="選單">
              <Menu className="size-5" />
            </button>
            <Building2 className="size-6 text-primary" />
            <div className="leading-tight">
              <p className="text-sm font-bold">薪資管理系統</p>
              <p className="text-[11px] text-muted-foreground">115 年度（2026）</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="hidden sm:inline">本月：{formatPeriod(currentPeriod)}</span>
            {errors > 0 ? <Badge variant="destructive">{errors} 項待處理</Badge> : <Badge variant="success">資料正常</Badge>}
            {confirmed ? <Badge variant="success">已確認</Badge> : <Badge variant="outline">未確認</Badge>}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1280px] gap-4 px-4 py-4 md:grid md:grid-cols-[200px_1fr]">
        <aside className={cn("print:hidden", open ? "block" : "hidden md:block")}>
          <nav className="space-y-3 md:sticky md:top-[64px]">
            {NAV_SECTIONS.map((sec) => (
              <div key={sec.title}>
                <p className="px-2 pb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{sec.title}</p>
                <div className="space-y-0.5">
                  {sec.items.map((m) => {
                    const active = location.pathname.startsWith(m.match);
                    return (
                      <NavLink
                        key={m.to}
                        to={m.to}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors",
                          active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground",
                        )}
                      >
                        <m.icon className="size-4 shrink-0" />
                        <span className="flex-1">{m.label}</span>
                        {m.tag && (
                          <span className={cn("rounded px-1 py-0.5 text-[9px]", m.tag === "例行" ? "bg-emerald-100 text-emerald-700" : "bg-sky-100 text-sky-700")}>{m.tag}</span>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
