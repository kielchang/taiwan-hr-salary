// 本月工作台（首頁 /）＝待辦聚合儀表板。設計原理：
//  - 把散在各頁的「本月該做什麼」集中成待辦卡：待處理驗證、未確認結算、加/退/停/復保、
//    級距調整、排程調薪到期…每張卡＝數字＋說明＋一鍵直達（?tab=/?emp= 深連結）。
//  - 資料全部由既有純函數即時導出（validateAll／enrollmentWorklist／bracketWorklist…），
//    工作台不持有自己的狀態，只做聚合與導引；0 待辦時以綠色「無待辦」呈現，給明確完成感。
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePayrollStore } from "@/store/usePayrollStore";
import { usePayrollRows } from "@/store/selectors";
import { validateAll, allocationIssues } from "@/lib/validation";
import { enrollmentWorklist } from "@/lib/reports/enrollment";
import { bracketWorklist } from "@/lib/reports/bracketAdjust";
import { ntd, formatPeriod } from "@/lib/utils";
import { HelpHint } from "@/components/HelpHint";
import {
  LayoutDashboard, AlertTriangle, FileText, UserPlus, UserMinus, Scale,
  CheckCircle2, ArrowRight, CalendarClock, Banknote, TrendingUp, XCircle, PauseCircle,
} from "lucide-react";
import type { ReactNode } from "react";

/** 待辦卡：數字＋說明＋一鍵直達（0 時以綠色「無待辦」呈現） */
function TodoCard({
  icon, title, count, unit = "項", hint, to, cta, tone = "warn",
}: {
  icon: ReactNode; title: string; count: number; unit?: string; hint: string;
  to: string; cta: string; tone?: "error" | "warn";
}) {
  const navigate = useNavigate();
  const clear = count === 0;
  return (
    <Card className={clear ? "" : tone === "error" ? "border-red-300" : "border-amber-300"}>
      <CardContent className="flex h-full flex-col gap-2 p-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className={clear ? "text-emerald-600" : tone === "error" ? "text-red-600" : "text-amber-600"}>{icon}</span>
          {title}
        </div>
        <p className="text-2xl font-bold tabular-nums">
          {count}<span className="ml-1 text-sm font-normal text-muted-foreground">{unit}</span>
        </p>
        <p className="flex-1 text-xs text-muted-foreground">{clear ? "目前沒有待辦。" : hint}</p>
        <Button variant={clear ? "ghost" : "outline"} size="sm" className="justify-start px-2" onClick={() => navigate(to)}>
          {cta} <ArrowRight className="size-3.5" />
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * 本月工作台（首頁）：把散在查核/報表/申報的待辦訊號聚合成一頁，
 * 讓 HR 一進系統就知道「這個月還欠什麼」，並可一鍵直達處理位置。
 */
export function DashboardView() {
  const navigate = useNavigate();
  const {
    employees, salaries, dependents, events, parameters, brackets,
    currentPeriod, confirmations, allocations, declaredInsured,
    scheduledRaises, cancelScheduledRaise, applyScheduledRaise,
  } = usePayrollStore();
  const rows = usePayrollRows();
  const confirmed = confirmations[currentPeriod];

  // —— 五大訊號（全部重用既有驗證/名冊函式）——
  const periodEvents = events.filter((e) => e.period === currentPeriod);
  const nameById = new Map(employees.map((e) => [e.id, e.name]));
  const issues = [
    ...validateAll(employees, salaries, dependents, periodEvents, parameters, brackets),
    ...allocationIssues(allocations, parameters, currentPeriod, nameById),
  ];
  const errorCount = issues.filter((i) => i.severity === "error").length;
  const warnCount = issues.filter((i) => i.severity === "warning").length;

  const pendingTax = rows.filter((r) => {
    const ev = periodEvents.find((e) => e.employeeId === r.employeeId);
    return (ev?.withheldTax ?? null) === null &&
      (r.withholdingSuggestion.type === "manual-lookup" || (r.withholdingSuggestion.type === "auto" && r.withholdingSuggestion.amount > 0));
  }).length;

  const { newHires, leavers, suspends, returns } = enrollmentWorklist(employees, currentPeriod);
  const bracketChanged = bracketWorklist(
    rows.map((r) => ({ employeeId: r.employeeId, name: r.name, insured: r.insured })),
    declaredInsured,
  ).filter((w) => w.changed).length;

  // 排程調薪：到期（生效月 ≤ 當期）可套用；未到期列出
  const dueRaises = scheduledRaises.filter((r) => r.effectivePeriod <= currentPeriod);
  const futureRaises = scheduledRaises.filter((r) => r.effectivePeriod > currentPeriod);

  const totals = rows.reduce(
    (a, r) => ({ gross: a.gross + r.grossPay, net: a.net + r.netPay, cost: a.cost + r.employerTotalCost }),
    { gross: 0, net: 0, cost: 0 },
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-bold">
            <LayoutDashboard className="size-5 text-primary" /> 本月工作台 <HelpHint id="payroll" />
          </h1>
          <p className="text-sm text-muted-foreground">
            {formatPeriod(currentPeriod)} 的待辦與狀態一覽；點卡片直達處理位置。
          </p>
        </div>
        <div className="flex items-center gap-2">
          {confirmed ? (
            <Badge variant="success">本月已於 {new Date(confirmed).toLocaleDateString("zh-TW")} 確認</Badge>
          ) : (
            <Badge variant="warning">本月未確認</Badge>
          )}
          <Button size="sm" onClick={() => navigate(confirmed ? "/payroll/review" : "/payroll/monthly")}>
            <CalendarClock /> {confirmed ? "查看結算" : "開始本月結算"}
          </Button>
        </div>
      </div>

      {/* 當期摘要 */}
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "結算人數", value: `${rows.length} 人`, icon: <CalendarClock className="size-4" /> },
          { label: "應發總額", value: `${ntd(totals.gross)} 元`, icon: <Banknote className="size-4" /> },
          { label: "實發總額", value: `${ntd(totals.net)} 元`, icon: <Banknote className="size-4" /> },
          { label: "公司總成本", value: `${ntd(totals.cost)} 元`, icon: <TrendingUp className="size-4" /> },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">{s.icon}{s.label}</p>
              <p className="mt-0.5 font-bold tabular-nums">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 本月待辦 */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <TodoCard
          icon={<AlertTriangle className="size-4" />} tone="error"
          title="資料檢查錯誤" count={errorCount}
          hint="錯誤未排除前無法確認月結（最低工資、離職未填生效日、實發為負…）。"
          to="/payroll/review" cta="前往查核處理"
        />
        <TodoCard
          icon={<AlertTriangle className="size-4" />}
          title="檢查警告" count={warnCount}
          hint="建議確認的提醒（加班超時、身分證疑異常、眷屬資料缺漏、分攤超額…）。"
          to="/payroll/review" cta="前往查核檢視"
        />
        <TodoCard
          icon={<FileText className="size-4" />}
          title="未填代扣所得稅" count={pendingTax} unit="人"
          hint="需查稅額表或帶入建議值後，代扣清單才完整。"
          to="/reports?tab=tax" cta="前往所得稅清單"
        />
        <TodoCard
          icon={<UserPlus className="size-4" />}
          title="本月應加保（新進）" count={newHires.length} unit="人"
          hint="到職日在本月者，請於到職當日辦理加保。"
          to="/reports?tab=enrollment" cta="前往加退保名冊"
        />
        <TodoCard
          icon={<UserMinus className="size-4" />}
          title="本月應退保（離職）" count={leavers.length} unit="人"
          hint="離職生效日在本月者，請於離職當日辦理退保。"
          to="/reports?tab=enrollment" cta="前往加退保名冊"
        />
        <TodoCard
          icon={<PauseCircle className="size-4" />}
          title="本月停保/復保" count={suspends.length + returns.length} unit="人"
          hint={`留停/停職/暫離生效 ${suspends.length} 人、復職 ${returns.length} 人，請辦理停保/復保。`}
          to="/reports?tab=enrollment" cta="前往加退保名冊"
        />
        <TodoCard
          icon={<Scale className="size-4" />}
          title="投保級距需調整" count={bracketChanged} unit="人"
          hint="目前投保金額與申報基準不一致，2／8 月請辦理級距調整。"
          to="/reports?tab=bracket" cta="前往級距申報"
        />
      </div>

      {/* 排程調薪 */}
      {(dueRaises.length > 0 || futureRaises.length > 0) && (
        <Card className={dueRaises.length > 0 ? "border-sky-300" : undefined}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">排程調薪</CardTitle>
            <CardDescription>
              {dueRaises.length > 0
                ? `${dueRaises.length} 筆已到生效月，套用後寫回薪資結構（差額套在本薪）並留稽核。`
                : "尚未到生效月的排程；到期後會出現「套用」按鈕。"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {[...dueRaises, ...futureRaises].map((r) => {
              const due = r.effectivePeriod <= currentPeriod;
              return (
                <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-2 text-sm">
                  <span>
                    <span className="font-medium">{r.name}</span>
                    <span className="ml-2 tabular-nums">調至 {ntd(r.newSalary)} 元</span>
                    <Badge variant={due ? "warning" : "secondary"} className="ml-2">{due ? "已到期" : "未到期"}・{r.effectivePeriod} 生效</Badge>
                    <span className="ml-2 text-xs text-muted-foreground">{r.note}</span>
                  </span>
                  <span className="flex gap-1.5">
                    {due && (
                      <Button size="sm" className="h-7" disabled={Boolean(confirmed)} title={confirmed ? "本月已確認鎖定，請先取消確認" : undefined}
                        onClick={() => applyScheduledRaise(r.id)}>
                        <CheckCircle2 className="size-3.5" /> 套用
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="h-7 text-destructive"
                      onClick={() => { if (confirm(`取消 ${r.name} 的排程調薪（${r.effectivePeriod} 生效）？`)) cancelScheduledRaise(r.id); }}>
                      <XCircle className="size-3.5" /> 取消
                    </Button>
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* 快捷入口 */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => navigate("/payroll/monthly")}><CalendarClock /> 薪資結算</Button>
        <Button variant="outline" size="sm" onClick={() => navigate("/payroll/review")}><CheckCircle2 /> 查核與確認</Button>
        <Button variant="outline" size="sm" onClick={() => navigate("/reports")}><FileText /> 報表與申報</Button>
      </div>
    </div>
  );
}
