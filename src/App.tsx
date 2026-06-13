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
import { CalendarClock, Users, Settings, BookOpen, Scale, Building2, Clock } from "lucide-react";

/** 上排主選單：各自獨立主題，對應路由路徑 */
const NAV: { to: string; match: string; label: string; icon: React.ElementType }[] = [
  { to: "/payroll/monthly", match: "/payroll", label: "每月薪資作業", icon: CalendarClock },
  { to: "/attendance", match: "/attendance", label: "出勤打卡", icon: Clock },
  { to: "/master", match: "/master", label: "基本資料", icon: Users },
  { to: "/settings", match: "/settings", label: "系統設定", icon: Settings },
  { to: "/help", match: "/help", label: "使用說明", icon: BookOpen },
  { to: "/sources", match: "/sources", label: "法規依據", icon: Scale },
];

const PAYROLL_STEPS: PayrollStep[] = ["monthly", "review", "reports"];

export default function App() {
  return (
    <Routes>
      <Route path="/setup" element={<SetupRoute />} />
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/payroll/monthly" replace />} />
        <Route path="/payroll/:step" element={<PayrollRoute />} />
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

/** 每月薪資作業路由：由網址 :step 控制目前步驟 */
function PayrollRoute() {
  const { step } = useParams();
  const navigate = useNavigate();
  if (!PAYROLL_STEPS.includes(step as PayrollStep)) {
    return <Navigate to="/payroll/monthly" replace />;
  }
  return (
    <PayrollFlow step={step as PayrollStep} onStep={(s) => navigate(`/payroll/${s}`)} />
  );
}

/** 主版面：上排主選單＋內容 Outlet；未完成初始設定則導向設定引導 */
function Layout() {
  const { setupCompleted, employees, salaries, dependents, events, parameters, currentPeriod, confirmations } =
    usePayrollStore();
  const location = useLocation();

  if (!setupCompleted) return <Navigate to="/setup" replace />;

  const periodEvents = events.filter((e) => e.period === currentPeriod);
  const issues = validateAll(employees, salaries, dependents, periodEvents, parameters);
  const errors = issues.filter((i) => i.severity === "error").length;
  const confirmed = Boolean(confirmations[currentPeriod]);
  const onPayroll = location.pathname.startsWith("/payroll");

  return (
    <div className="min-h-screen bg-muted/30">
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
              {onPayroll &&
                (confirmed ? <Badge variant="success">已確認</Badge> : <Badge variant="outline">未確認</Badge>)}
            </div>
          </div>

          <nav className="flex gap-1 overflow-x-auto">
            {NAV.map((m) => {
              const active = location.pathname.startsWith(m.match);
              return (
                <NavLink
                  key={m.to}
                  to={m.to}
                  className={cn(
                    "flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  <m.icon className="size-4" />
                  {m.label}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-4 py-5">
        <Outlet />
      </main>
    </div>
  );
}
