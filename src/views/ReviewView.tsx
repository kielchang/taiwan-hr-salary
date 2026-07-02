import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PrintHeader } from "@/components/PrintHeader";
import { useNavigate } from "react-router-dom";
import { usePayrollStore } from "@/store/usePayrollStore";
import { usePayrollRows, useCompanySupplementary } from "@/store/selectors";
import { validateAll, allocationIssues } from "@/lib/validation";
import { lookupBracket, monthlySalaryTotal, supplementaryBaseDifferential, bonusWithholding } from "@/lib/calc";
import { buildSnapshot } from "@/lib/analytics";
import { simulateAnnual } from "@/lib/reports/annual";
import { Bullet } from "@/components/charts";
import { cn, ntd, pct } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, ArrowRight, Undo2, Users, Banknote, Wallet, Building, TrendingUp } from "lucide-react";

type Tab = "overview" | "checks" | "bonus";

export function ReviewView({ onNext }: { onBack?: () => void; onNext?: () => void }) {
  const {
    employees, salaries, dependents, events, parameters, brackets,
    currentPeriod, confirmations, confirmPeriod, unconfirmPeriod,
    snapshots, saveSnapshot, analytics, allocations, projects,
  } = usePayrollStore();
  const [tab, setTab] = useState<Tab>("overview");
  const navigate = useNavigate();

  const rows = usePayrollRows();
  const companySupp = useCompanySupplementary(rows);
  const periodEvents = events.filter((e) => e.period === currentPeriod);
  const nameById = new Map(employees.map((e) => [e.id, e.name]));
  const issues = [
    ...validateAll(employees, salaries, dependents, periodEvents, parameters, brackets),
    ...allocationIssues(allocations, parameters, currentPeriod, nameById),
  ];
  const errors = issues.filter((i) => i.severity === "error");

  const pendingTax = rows.filter(
    (r) =>
      r.withholdingSuggestion.type === "manual-lookup" &&
      (periodEvents.find((e) => e.employeeId === r.employeeId)?.withheldTax ?? null) === null,
  );

  const confirmed = confirmations[currentPeriod];
  const totals = rows.reduce(
    (a, r) => ({
      gross: a.gross + r.grossPay,
      net: a.net + r.netPay,
      employer: a.employer + r.employerTotalCost,
    }),
    { gross: 0, net: 0, employer: 0 },
  );

  // 模擬年度（以本月為 run-rate 外推）＋月結確認時自動保存快照
  const bonusTotal = rows.reduce((a, r) => a + (periodEvents.find((e) => e.employeeId === r.employeeId)?.monthlyBonus ?? 0), 0);
  const year = currentPeriod.slice(0, 4);
  const sim = simulateAnnual(year, currentPeriod, totals.employer, snapshots);
  const annualBudget = analytics.planning.annualPayrollBudget;
  // 環比（上月）/同比（去年同月）：取月結快照之雇主總成本對比
  const [yy, mm] = currentPeriod.split("-").map(Number);
  const prevD = new Date(yy, mm - 2, 1);
  const prevPeriod = `${prevD.getFullYear()}-${String(prevD.getMonth() + 1).padStart(2, "0")}`;
  const lastYearPeriod = `${yy - 1}-${String(mm).padStart(2, "0")}`;
  const snapBy = new Map(snapshots.map((s) => [s.period, s]));
  const prevSnap = snapBy.get(prevPeriod);
  const lySnap = snapBy.get(lastYearPeriod);
  const mom = prevSnap && prevSnap.totalCost > 0 ? (totals.employer - prevSnap.totalCost) / prevSnap.totalCost : null;
  const yoy = lySnap && lySnap.totalCost > 0 ? (totals.employer - lySnap.totalCost) / lySnap.totalCost : null;
  const deltaText = (d: number | null, base: string) => d == null ? `無${base}快照可比` : `${d >= 0 ? "+" : ""}${pct(d)}`;
  const doConfirm = () => {
    saveSnapshot(buildSnapshot(rows, currentPeriod, bonusTotal)); // 留存當月實際，供年報累計
    confirmPeriod(currentPeriod);
  };

  type OvRow = { r: (typeof rows)[number]; bonus: number; other: number };
  const ovRows: OvRow[] = rows.map((r) => {
    const ev = periodEvents.find((e) => e.employeeId === r.employeeId);
    return { r, bonus: ev?.monthlyBonus ?? 0, other: r.leaveDeduction + (ev?.otherDeduction ?? 0) };
  });
  const sumOf = (f: (o: OvRow) => number) => (rs: OvRow[]) => ntd(rs.reduce((a, o) => a + f(o), 0));
  const num = (key: string, header: string, get: (o: OvRow) => number, opts: { total?: boolean; className?: string } = {}): Column<OvRow> => ({
    key, header, numeric: true, sortValue: (o) => get(o), cell: (o) => <span className={opts.className}>{ntd(get(o))}</span>,
    ...(opts.total ? { total: sumOf(get) } : {}),
  });
  const ovColumns: Column<OvRow>[] = [
    { key: "name", header: "員工", freeze: true, sortValue: (o) => o.r.name, filterText: (o) => `${o.r.name} ${o.r.department}`, cell: (o) => o.r.name },
    num("salary", "月薪總額", (o) => o.r.salaryTotal, { total: true }),
    num("ot", "加班費", (o) => o.r.overtimePay, { total: true }),
    num("bonus", "獎金", (o) => o.bonus, { total: true }),
    num("gross", "應發", (o) => o.r.grossPay, { total: true }),
    num("labor", "勞保", (o) => o.r.premiums.laborEmployee),
    num("health", "健保", (o) => o.r.premiums.healthEmployee),
    num("pension", "勞退自提", (o) => o.r.premiums.pensionVoluntary),
    num("supp", "補充保費", (o) => o.r.personalSupplementary),
    num("tax", "所得稅", (o) => o.r.withheldTax),
    num("other", "請假/其他", (o) => o.other),
    num("net", "實發", (o) => o.r.netPay, { total: true, className: "font-semibold" }),
    num("employer", "公司成本", (o) => o.r.employerTotalCost, { total: true, className: "text-muted-foreground" }),
  ];

  return (
    <div className="space-y-4">
      <PrintHeader title="結算查核總覽" period={currentPeriod} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">查核與確認</h2>
          <p className="text-sm text-muted-foreground">
            請檢視全公司試算結果與系統檢查，確認無誤後按「確認本月結算」，再產出報表。
          </p>
        </div>
        {confirmed ? (
          <div className="flex items-center gap-2">
            <Badge variant="success">已於 {new Date(confirmed).toLocaleString("zh-TW")} 確認</Badge>
            <Button variant="outline" size="sm" onClick={() => unconfirmPeriod(currentPeriod)}>
              <Undo2 /> 取消確認
            </Button>
          </div>
        ) : (
          <Button
            onClick={doConfirm}
            disabled={errors.length > 0 || pendingTax.length > 0}
          >
            <CheckCircle2 /> 確認本月結算
          </Button>
        )}
      </div>

      {(errors.length > 0 || pendingTax.length > 0) && !confirmed && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertTriangle className="mr-1 inline size-4" />
          確認前請先處理：
          {errors.length > 0 && <span className="ml-1">{errors.length} 項資料錯誤（見「統計查核」）</span>}
          {pendingTax.length > 0 && (
            <span className="ml-1">
              {pendingTax.map((r) => r.name).join("、")} 需查稅額表填入代扣所得稅（回「薪資結算」編輯）
            </span>
          )}
        </div>
      )}

      {/* 摘要卡 */}
      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard icon={Users} label="結算人數" value={`${rows.length} 人`} />
        <StatCard icon={Banknote} label="應發總額" value={`${ntd(totals.gross)} 元`} />
        <StatCard icon={Wallet} label="實發總額" value={`${ntd(totals.net)} 元`} />
        <StatCard icon={Building} label="公司總成本" value={`${ntd(totals.employer)} 元`} hint="含公司負擔之四項保費" />
      </div>

      {/* 本月分析＋模擬年度（試算情境：以本月暫定數字外推全年） */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="size-4 text-primary" /> 模擬年度（以本月推估）
            <Badge variant={confirmed ? "success" : "warning"}>{confirmed ? "已確認實際" : "試算暫定"}</Badge>
          </CardTitle>
          <CardDescription>
            以本月{confirmed ? "" : "（暫定）"}公司總成本為 run-rate，接上當年已確認月份外推全年；正式年報（實際累計）見「薪酬分析 → 年報」。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-4">
            <MiniStat label="本月公司總成本" value={`${ntd(totals.employer)} 元`} />
            <MiniStat label={`當年已實際累計（${sim.monthsBefore} 個月）`} value={`${ntd(sim.ytdBefore)} 元`} />
            <MiniStat label="剩餘月數（含本月）" value={`${sim.remainingMonths} 個月`} />
            <MiniStat label="模擬全年總成本" value={`${ntd(sim.projectedAnnual)} 元`} hint="已實際＋剩餘月×本月" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <MiniStat label={`環比（vs 上月 ${prevPeriod}）`} value={deltaText(mom, "上月")} hint={prevSnap ? `上月 ${ntd(prevSnap.totalCost)} 元` : "上月未保存快照"} />
            <MiniStat label={`同比（vs 去年同月 ${lastYearPeriod}）`} value={deltaText(yoy, "去年同月")} hint={lySnap ? `去年同月 ${ntd(lySnap.totalCost)} 元` : "去年同月未保存快照"} />
          </div>
          {annualBudget > 0 && <Bullet label="模擬全年 vs 年度預算" value={sim.projectedAnnual} target={annualBudget} />}
        </CardContent>
      </Card>

      <div className="flex gap-1">
        {(
          [
            ["overview", "試算總覽"],
            ["checks", `統計查核${issues.length > 0 ? `（${issues.length}）` : ""}`],
            ["bonus", "獎金試算"],
          ] as [Tab, string][]
        ).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm",
              tab === k ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-accent",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <Card className="print-block">
          <CardContent className="pt-6">
            <DataTable
              rows={ovRows}
              columns={ovColumns}
              getRowKey={(o) => o.r.employeeId}
              searchPlaceholder="搜尋員工／部門…"
              csv={{
                headers: ["員工", "月薪總額", "加班費", "獎金", "應發", "勞保", "健保", "勞退自提", "補充保費", "所得稅", "請假/其他", "實發", "公司成本"],
                row: (o) => [o.r.name, o.r.salaryTotal, o.r.overtimePay, o.bonus, o.r.grossPay, o.r.premiums.laborEmployee, o.r.premiums.healthEmployee, o.r.premiums.pensionVoluntary, o.r.personalSupplementary, o.r.withheldTax, o.other, o.r.netPay, o.r.employerTotalCost],
                fileName: `結算總覽_${currentPeriod}.csv`,
              }}
              empty={{ title: "本期尚無結算資料" }}
            />
            {onNext && (
              <div className="mt-4 flex justify-end">
                <Button variant="outline" onClick={onNext}>
                  前往報表與申報 <ArrowRight />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "checks" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">資料檢查</CardTitle>
              <CardDescription>系統自動檢查法規與資料完整性，紅色必須處理、黃色建議確認。</CardDescription>
            </CardHeader>
            <CardContent>
              {issues.length === 0 ? (
                <p className="flex items-center gap-2 text-sm text-emerald-600">
                  <CheckCircle2 className="size-4" /> 全部通過，沒有需要處理的項目。
                </p>
              ) : (
                <ul className="space-y-2">
                  {issues.map((i, idx) => (
                    <li key={idx} className="flex items-start gap-2 rounded-md border p-2 text-sm">
                      <AlertTriangle
                        className={cn("mt-0.5 size-4 shrink-0", i.severity === "error" ? "text-destructive" : "text-amber-500")}
                      />
                      <span className="flex-1">{i.message}</span>
                      {i.employeeId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 shrink-0 px-2 text-xs print:hidden"
                          onClick={() =>
                            // 事件類問題（加班超時/累計獎金/分攤）到結算對話框；主檔類到員工檔案 — 直接開該員，免再搜尋
                            navigate(
                              ["V4", "V10", "V11"].includes(i.rule)
                                ? `/payroll/monthly?emp=${i.employeeId}`
                                : `/master?emp=${i.employeeId}`,
                            )
                          }
                        >
                          前往修正 <ArrowRight className="size-3" />
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">統計數據勾稽</CardTitle>
              <CardDescription>各分類合計應等於全公司合計；差額為 0 才正常。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {(["department", "costCenter", "project"] as const).map((dim) => {
                const label = { department: "部門別", costCenter: "成本中心別", project: "專案別" }[dim];
                const sum = rows.reduce((a, r) => a + r.grossPay, 0);
                // 專案別以「主檔代碼存在」為準：自由字串打錯的代碼視為未分類（與專案成本分攤一致）
                const projectCodes = new Set(projects.map((p) => p.code));
                const classified = (r: (typeof rows)[number]) =>
                  dim === "project" ? Boolean(r.project && projectCodes.has(r.project)) : Boolean(r[dim]);
                const grouped = rows.reduce((a, r) => a + (classified(r) ? r.grossPay : 0), 0);
                const unclassified = sum - grouped;
                return (
                  <div key={dim} className="flex items-center justify-between rounded-md border px-3 py-2">
                    <span>{label}應發合計勾稽</span>
                    {unclassified === 0 ? (
                      <Badge variant="success">一致 ✓</Badge>
                    ) : (
                      <Badge variant="warning">未分類 {ntd(unclassified)} 元</Badge>
                    )}
                  </div>
                );
              })}
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <span>
                  公司二代健保補充保費（概算）
                  <span className="block text-xs text-muted-foreground">
                    （當月支付總額 − 全體投保金額）× 2.11%，次月底前繳納
                  </span>
                </span>
                <span className="font-semibold tabular-nums">{ntd(companySupp)} 元</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "bonus" && <BonusCalculator />}
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, hint,
}: {
  icon: React.ElementType; label: string; value: string; hint?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <Icon className="size-8 rounded-md bg-primary/10 p-1.5 text-primary" />
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="font-bold tabular-nums">{value}</p>
          {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-bold tabular-nums">{value}</p>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** 獎金試算機：發放前先試算補充保費與所得稅 */
function BonusCalculator() {
  const { employees, salaries, brackets, parameters } = usePayrollStore();
  const [inputs, setInputs] = useState<Record<string, { prior: number; amount: number }>>({});

  const get = (id: string) => inputs[id] ?? { prior: 0, amount: 0 };
  const set = (id: string, p: Partial<{ prior: number; amount: number }>) =>
    setInputs((s) => ({ ...s, [id]: { ...get(id), ...p } }));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">獎金試算（發放前先算）</CardTitle>
        <CardDescription>
          輸入預計發放金額，系統試算「二代健保補充保費」與「所得稅 5%」，得到實際入帳金額。
          確定發放後，再到「薪資結算」把獎金填入該員工的本月異動。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>員工</TableHead>
              <TableHead className="text-right">補充保費門檻</TableHead>
              <TableHead className="text-right">今年已發獎金</TableHead>
              <TableHead className="text-right">本次預計發放</TableHead>
              <TableHead className="text-right">補充保費</TableHead>
              <TableHead className="text-right">所得稅</TableHead>
              <TableHead className="text-right">實際入帳</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((emp) => {
              const s = salaries.find((x) => x.employeeId === emp.id);
              const health = s ? lookupBracket(brackets.health, monthlySalaryTotal(s)) : 0;
              const inp = get(emp.id);
              const supp = supplementaryBaseDifferential(inp.prior, inp.amount, health, parameters);
              const tax = bonusWithholding(inp.amount, emp.taxResidency, parameters);
              const taxAmt = tax.type === "auto" ? tax.amount : 0;
              return (
                <TableRow key={emp.id}>
                  <TableCell className="font-medium">{emp.name}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">{ntd(health * 4)}</TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number" className="h-8 w-28 col-input text-right tabular-nums"
                      value={inp.prior}
                      onChange={(e) => set(emp.id, { prior: Number(e.target.value) || 0 })}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number" className="h-8 w-28 col-input text-right tabular-nums"
                      value={inp.amount}
                      onChange={(e) => set(emp.id, { amount: Number(e.target.value) || 0 })}
                    />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{ntd(supp.premium)}</TableCell>
                  <TableCell className="text-right">
                    {tax.type === "auto" ? (
                      <span className="tabular-nums">{ntd(taxAmt)}</span>
                    ) : (
                      <Badge variant="warning">併當月薪資計稅</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {tax.type === "auto" ? ntd(inp.amount - supp.premium - taxAmt) : "—"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <p className="mt-3 text-xs text-muted-foreground">
          說明：獎金單次達 {ntd(parameters.taxThresholdBase)} 元才需扣 5% 所得稅（未達者免扣但年底仍列入扣繳憑單）；
          補充保費則看「今年累計」是否超過個人健保投保金額的 4 倍——兩者分開判斷，互不影響。
        </p>
      </CardContent>
    </Card>
  );
}
