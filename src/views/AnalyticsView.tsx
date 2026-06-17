import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { usePayrollStore } from "@/store/usePayrollStore";
import { usePayrollRows, usePayrollRowsFor, buildPayrollRows, type PayrollRow } from "@/store/selectors";
import { annualMonths, annualTotals, simulateAnnual } from "@/lib/reports/annual";
import { saveBlob } from "@/lib/payslipPdf";
import { csvSerialize } from "@/lib/csv";
import { cn, ntd, pct, formatPeriod } from "@/lib/utils";
import {
  percentileSet, coefficientOfVariation, gini, lorenzPoints, histogram,
  buildBasis, simulateBonusPool, simulateRaise, buildSnapshot, compareRaiseMethods,
  type BonusSimResult, type RaiseSimResult,
} from "@/lib/analytics";
import { StackedBar, Legend, BarChart, LineChart, Pareto, Scatter, Bullet, Heatmap, TrendChart, PALETTE } from "@/components/charts";
import {
  analyzeCost, analyzeDistribution, analyzeGrades, analyzeBonus, analyzeRaise,
  analyzeMarket, analyzeTrend, analyzeBudget, analyzeProjectCost, type Insight,
} from "@/lib/insights";
import { computeProjectCost, projectDeptMatrix, chargeOutVariance, UNALLOCATED_ID } from "@/lib/reports/projectCost";
import { projectCostByPeriod, projectEac } from "@/lib/reports/projectTrend";
import { downloadNodeAsPdf } from "@/lib/reportPdf";
import { HelpHint } from "@/components/HelpHint";
import { BarChart3, Plus, Trash2, Download, Info, FileDown, Printer, CheckCircle2, AlertTriangle, Lightbulb, Save, TrendingUp } from "lucide-react";

type Tab = "cost" | "dist" | "grade" | "bonus" | "raise" | "trend" | "glossary";
const TAB_LABEL: Record<Tab, string> = {
  cost: "成本結構", dist: "分布與公平", grade: "級距與 compa-ratio",
  bonus: "獎金／分紅試算", raise: "調薪試算", trend: "趨勢·預算", glossary: "指標說明",
};
const TABS: [Tab, string][] = (Object.keys(TAB_LABEL) as Tab[]).map((k) => [k, TAB_LABEL[k]]);
// 兩層分組：月報（依檢視月份的實際回顧）／規劃試算（沙盒）／年報／說明
const GROUPS: { title: string; tag?: "例行" | "試算"; tabs: Tab[] }[] = [
  { title: "月報", tag: "例行", tabs: ["cost", "dist", "grade"] },
  { title: "規劃試算", tag: "試算", tabs: ["bonus", "raise"] },
  { title: "年報", tag: "例行", tabs: ["trend"] },
  { title: "說明", tabs: ["glossary"] },
];
const RAISE_LABEL: Record<string, string> = {
  uniformPercent: "一致調幅 %", proRataBase: "按本薪分配", byPerformance: "按績效係數", meritMatrix: "merit matrix",
};

function csvDownload(headers: string[], rows: (string | number)[][], fileName: string) {
  saveBlob(new Blob([csvSerialize(headers, rows)], { type: "text/csv;charset=utf-8" }), fileName);
}

// 月報（描述性、依選定月份）vs 規劃/年報（依當期或跨期）
const MONTH_TABS: Tab[] = ["cost", "dist", "grade"];

export function AnalyticsView() {
  const [tab, setTab] = useState<Tab>("cost");
  const currentPeriod = usePayrollStore((s) => s.currentPeriod);
  const confirmations = usePayrollStore((s) => s.confirmations);
  const [viewPeriod, setViewPeriod] = useState(currentPeriod);
  const currentRows = usePayrollRows();
  const viewRows = usePayrollRowsFor(viewPeriod);
  const reportRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const isMonthTab = MONTH_TABS.includes(tab);
  const shownPeriod = isMonthTab ? viewPeriod : currentPeriod;
  const activeRows = isMonthTab ? viewRows : currentRows;
  const confirmedView = !!confirmations[viewPeriod];
  const isTrial = viewPeriod === currentPeriod && !confirmedView;

  const tabLabel = TABS.find(([k]) => k === tab)?.[1] ?? "";
  const exportPdf = async () => {
    if (!reportRef.current) return;
    setExporting(true);
    try {
      await downloadNodeAsPdf(reportRef.current, `薪酬分析_${tabLabel}_${shownPeriod}.pdf`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-bold"><BarChart3 className="size-5 text-primary" /> 薪酬分析 <HelpHint id="analytics" /></h1>
          <p className="text-sm text-muted-foreground">
            月報依「檢視月份」呈現該月數據；獎金/調薪為規劃沙盒、<strong>不寫回薪資</strong>；年報為跨月累計與全年推估。
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer /> 列印
          </Button>
          <Button size="sm" onClick={exportPdf} disabled={exporting || (activeRows.length === 0 && tab !== "glossary" && tab !== "trend")}>
            <FileDown /> {exporting ? "產生中…" : "匯出 PDF"}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-x-4 gap-y-2 print:hidden">
        {GROUPS.map((g) => (
          <div key={g.title}>
            <p className="mb-0.5 px-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {g.title}{g.tag && <span className={cn("ml-1 rounded px-1 py-0.5 text-[9px]", g.tag === "例行" ? "bg-emerald-100 text-emerald-700" : "bg-sky-100 text-sky-700")}>{g.tag}</span>}
            </p>
            <div className="flex flex-wrap gap-1">
              {g.tabs.map((k) => (
                <button key={k} onClick={() => setTab(k)}
                  className={cn("rounded-md px-3 py-1.5 text-sm", tab === k ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-accent")}>
                  {TAB_LABEL[k]}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 月份選擇器與情境（僅月報相關分頁） */}
      {isMonthTab && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/30 p-2 print:hidden">
          <label className="text-xs text-muted-foreground">檢視月份</label>
          <Input type="month" className="h-8 w-36 col-input" value={viewPeriod} onChange={(e) => e.target.value && setViewPeriod(e.target.value)} />
          {isTrial ? <Badge variant="warning">試算暫定（當期未確認）</Badge>
            : confirmedView ? <Badge variant="success">已確認實際</Badge>
            : <Badge variant="outline">未確認月份</Badge>}
          {viewPeriod !== currentPeriod && (
            <Button variant="ghost" size="sm" onClick={() => setViewPeriod(currentPeriod)}>回到當期</Button>
          )}
        </div>
      )}

      <div ref={reportRef} className="space-y-4 bg-background">
        {/* PDF/列印標題（畫面上以較小字呈現） */}
        <div className="border-b pb-2">
          <p className="text-sm font-semibold">薪酬分析 — {tabLabel}{isMonthTab ? `（${isTrial ? "試算暫定" : confirmedView ? "已確認" : "未確認"}）` : ""}</p>
          <p className="text-xs text-muted-foreground">期間 {formatPeriod(shownPeriod)}（資料基於本機；月報依檢視月份、年報為跨月累計）</p>
        </div>

        {activeRows.length === 0 && tab !== "glossary" && tab !== "trend" ? (
          <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
            {isMonthTab ? "此月份尚無薪資資料。請改選其他月份，或先於「每月薪資作業」建立。" : "尚無薪資資料。請先到「基本資料」建立員工與薪資結構。"}
          </CardContent></Card>
        ) : (
          <>
            {tab === "cost" && <CostTab rows={viewRows} period={viewPeriod} />}
            {tab === "dist" && <DistTab rows={viewRows} period={viewPeriod} />}
            {tab === "grade" && <GradeTab rows={viewRows} />}
            {tab === "bonus" && <BonusTab rows={currentRows} />}
            {tab === "raise" && <RaiseTab rows={currentRows} />}
            {tab === "trend" && <TrendTab rows={currentRows} />}
            {tab === "glossary" && <GlossaryTab />}
          </>
        )}
      </div>
    </div>
  );
}

/* ───────── 成本結構 ───────── */
function CostTab({ rows, period }: { rows: PayrollRow[]; period: string }) {
  const { salaries, events } = usePayrollStore();
  const [selDept, setSelDept] = useState<string | null>(null);
  const [selEmp, setSelEmp] = useState<string | null>(null);
  const baseOf = (id: string) => salaries.find((s) => s.employeeId === id)?.baseSalary ?? 0;
  const bonusOf = (id: string) => events.find((e) => e.employeeId === id && e.period === period)?.monthlyBonus ?? 0;
  const otherOf = (id: string) => events.find((e) => e.employeeId === id && e.period === period)?.otherAddition ?? 0;

  const comp = (r: PayrollRow) => {
    const base = baseOf(r.employeeId);
    return {
      base,
      allowance: Math.max(0, r.salaryTotal - base),
      ot: r.overtimePay,
      bonus: bonusOf(r.employeeId),
      other: otherOf(r.employeeId),
      burden: r.employerBurden,
    };
  };
  const SEGS = [
    { key: "base", label: "本薪", color: PALETTE[0] },
    { key: "allowance", label: "加給/津貼", color: PALETTE[1] },
    { key: "ot", label: "加班費", color: PALETTE[2] },
    { key: "bonus", label: "獎金", color: PALETTE[3] },
    { key: "other", label: "其他加項", color: PALETTE[7] },
    { key: "burden", label: "雇主負擔", color: PALETTE[5] },
  ] as const;

  const totalCost = rows.reduce((a, r) => a + r.employerTotalCost, 0);
  const perHead = rows.map((r) => r.employerTotalCost).sort((a, b) => a - b);
  const median = perHead.length ? perHead[Math.floor((perHead.length - 1) / 2)] : 0;
  const totals = rows.reduce((acc, r) => {
    const c = comp(r);
    (Object.keys(c) as (keyof typeof c)[]).forEach((k) => (acc[k] += c[k]));
    return acc;
  }, { base: 0, allowance: 0, ot: 0, bonus: 0, other: 0, burden: 0 });

  // 部門彙總
  const deptMap = new Map<string, typeof totals>();
  rows.forEach((r) => {
    const c = comp(r);
    const d = r.department || "（未填）";
    const cur = deptMap.get(d) ?? { base: 0, allowance: 0, ot: 0, bonus: 0, other: 0, burden: 0 };
    (Object.keys(c) as (keyof typeof c)[]).forEach((k) => (cur[k] += c[k]));
    deptMap.set(d, cur);
  });

  const insights = analyzeCost({
    totalCost,
    ot: totals.ot,
    bonus: totals.bonus,
    burden: totals.burden,
    costPerHead: rows.map((r) => r.employerTotalCost),
  });

  return (
    <div className="space-y-4">
      <InsightList insights={insights} />
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="人事總成本（含雇主負擔）" value={`${ntd(totalCost)} 元`} />
        <Stat label="平均每人成本" value={`${ntd(rows.length ? totalCost / rows.length : 0)} 元`} />
        <Stat label="中位每人成本" value={`${ntd(median)} 元`} />
        <Stat label="人數" value={`${rows.length} 人`} />
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">人事成本組成（全公司）</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <StackedBar rows={[{ label: "全公司", segments: SEGS.map((s) => ({ label: s.label, value: totals[s.key], color: s.color })) }]} />
          <Legend items={SEGS.map((s) => ({ label: s.label, color: s.color }))} />
          <p className="text-xs text-muted-foreground">
            獎金/變動占比過高或加班費偏大，常是結構檢討重點；雇主負擔約為投保金額×費率×負擔比例。
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">部門別成本組成</CardTitle>
          <CardDescription>點任一部門列，下方展開該部門逐人成本明細。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <StackedBar
            rows={[...deptMap.entries()].map(([d, t]) => ({ label: d, segments: SEGS.map((s) => ({ label: s.label, value: t[s.key], color: s.color })) }))}
            onSelectRow={(d) => { setSelDept((cur) => (cur === d ? null : d)); setSelEmp(null); }}
            selectedRow={selDept}
          />
          <Legend items={SEGS.map((s) => ({ label: s.label, color: s.color }))} />
        </CardContent>
      </Card>

      {selDept && (
        <DetailPanel title={`部門明細：${selDept}`} onClose={() => setSelDept(null)}>
          <Table>
            <TableHeader><TableRow><TableHead>員工</TableHead>{SEGS.map((s) => <TableHead key={s.key} className="text-right">{s.label}</TableHead>)}<TableHead className="text-right">總成本</TableHead></TableRow></TableHeader>
            <TableBody>
              {rows.filter((r) => (r.department || "（未填）") === selDept).map((r) => {
                const c = comp(r);
                return (
                  <TableRow key={r.employeeId}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    {SEGS.map((s) => <TableCell key={s.key} className="text-right tabular-nums">{ntd(c[s.key])}</TableCell>)}
                    <TableCell className="text-right font-medium tabular-nums">{ntd(r.employerTotalCost)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </DetailPanel>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">員工成本 Pareto（集中度 80/20）</CardTitle>
          <CardDescription>少數高成本人力佔總成本比例，評估關鍵人力與集中風險。點任一長條看該員成本組成。</CardDescription>
        </CardHeader>
        <CardContent><Pareto data={rows.map((r) => ({ label: r.name, value: r.employerTotalCost, id: r.employeeId }))} onSelect={(it) => { setSelEmp((cur) => (cur === it.id ? null : it.id ?? null)); setSelDept(null); }} /></CardContent>
      </Card>

      {selEmp && (() => {
        const r = rows.find((x) => x.employeeId === selEmp);
        if (!r) return null;
        const c = comp(r);
        return (
          <DetailPanel title={`員工成本明細：${r.name}`} onClose={() => setSelEmp(null)}>
            <div className="grid gap-2 sm:grid-cols-3">
              {SEGS.map((s) => (
                <div key={s.key} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground"><span className="size-2.5 rounded-sm" style={{ background: s.color }} />{s.label}</span>
                  <span className="font-medium tabular-nums">{ntd(c[s.key])}</span>
                </div>
              ))}
              <div className="flex items-center justify-between rounded-md border-2 border-primary/30 px-3 py-2 text-sm">
                <span className="text-muted-foreground">雇主總成本</span>
                <span className="font-bold tabular-nums">{ntd(r.employerTotalCost)}</span>
              </div>
            </div>
          </DetailPanel>
        );
      })()}
    </div>
  );
}

/* ───────── 分布與公平 ───────── */
function DistTab({ rows, period }: { rows: PayrollRow[]; period: string }) {
  const { events } = usePayrollStore();
  const [selBin, setSelBin] = useState<number | null>(null);
  const [selDept, setSelDept] = useState<string | null>(null);
  const [selEmp, setSelEmp] = useState<string | null>(null);
  const pays = rows.map((r) => r.salaryTotal);
  const ps = percentileSet(pays);
  const cv = coefficientOfVariation(pays);
  const g = gini(pays);
  const lorenz = lorenzPoints(pays);
  const hist = histogram(pays, 8);
  const sumBase = pays.reduce((a, b) => a + b, 0);
  const sumBonus = rows.reduce((a, r) => a + (events.find((e) => e.employeeId === r.employeeId && e.period === period)?.monthlyBonus ?? 0), 0);
  const sumVariable = sumBonus + rows.reduce((a, r) => a + r.overtimePay, 0);
  const sumGross = rows.reduce((a, r) => a + r.grossPay, 0);

  // 部門中位數
  const deptMap = new Map<string, number[]>();
  rows.forEach((r) => { const d = r.department || "（未填）"; deptMap.set(d, [...(deptMap.get(d) ?? []), r.salaryTotal]); });
  const deptMedian = [...deptMap.entries()].map(([d, arr]) => {
    const s = [...arr].sort((a, b) => a - b);
    return { label: d, value: s[Math.floor((s.length - 1) / 2)] ?? 0 };
  });

  const insights = analyzeDistribution(pays, deptMedian);

  return (
    <div className="space-y-4">
      <InsightList insights={insights} />
      <div className="grid gap-3 sm:grid-cols-5">
        <Stat label="P10" value={ntd(ps.p10)} /><Stat label="P25" value={ntd(ps.p25)} />
        <Stat label="中位數" value={ntd(ps.median)} /><Stat label="P75" value={ntd(ps.p75)} /><Stat label="P90" value={ntd(ps.p90)} />
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="變異係數 CV" value={pct(cv)} hint="離散程度，越小越集中" />
        <Stat label="Gini 係數" value={g.toFixed(3)} hint="0 平均、趨近 1 不均" />
        <Stat label="獎金/本薪比" value={pct(sumBase ? sumBonus / sumBase : 0)} />
        <Stat label="變動薪酬比" value={pct(sumGross ? sumVariable / sumGross : 0)} hint="（加班＋獎金）/應發" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">月薪資總額分布（直方圖）</CardTitle>
            <CardDescription>點任一桶，看落在該薪資區間的員工。</CardDescription>
          </CardHeader>
          <CardContent><BarChart data={hist.map((b) => ({ label: ntd(b.start), value: b.count }))} valueFmt={(n) => `${n} 人`} color={PALETTE[0]} selectedIndex={selBin} onSelect={(_, i) => { setSelBin((cur) => (cur === i ? null : i)); setSelDept(null); setSelEmp(null); }} /></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Lorenz 曲線（薪資不均）</CardTitle>
            <CardDescription>曲線越偏離對角線，分配越不均（對應 Gini {g.toFixed(3)}）。</CardDescription>
          </CardHeader>
          <CardContent><LineChart points={lorenz} diagonal /></CardContent>
        </Card>
      </div>

      {selBin !== null && hist[selBin] && (
        <DetailPanel title={`薪資區間 ${ntd(Math.round(hist[selBin].start))} ～ ${ntd(Math.round(hist[selBin].end))} 的員工`} onClose={() => setSelBin(null)}>
          <EmployeeMiniTable rows={rows.filter((r) => r.salaryTotal >= hist[selBin].start && (selBin === hist.length - 1 ? r.salaryTotal <= hist[selBin].end : r.salaryTotal < hist[selBin].end))} />
        </DetailPanel>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">部門薪資中位數比較</CardTitle>
          <CardDescription>點任一部門長條，看該部門員工薪資。</CardDescription>
        </CardHeader>
        <CardContent><BarChart data={deptMedian} color={PALETTE[1]} selectedIndex={selDept ? deptMedian.findIndex((d) => d.label === selDept) : null} onSelect={(it) => { setSelDept((cur) => (cur === it.label ? null : it.label)); setSelBin(null); setSelEmp(null); }} /></CardContent>
      </Card>

      {selDept && (
        <DetailPanel title={`部門明細：${selDept}`} onClose={() => setSelDept(null)}>
          <EmployeeMiniTable rows={rows.filter((r) => (r.department || "（未填）") === selDept)} />
        </DetailPanel>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">薪資 vs 年資（薪資壓縮檢視）</CardTitle>
          <CardDescription>年資高但薪資未相稱，可能為薪資壓縮（pay compression）。點任一點看該員。</CardDescription>
        </CardHeader>
        <CardContent>
          <Scatter xLabel="年資(月)" yLabel="月薪"
            points={rows.map((r) => ({ x: r.seniorityMonths, y: r.salaryTotal, id: r.employeeId, label: `${r.name}：年資 ${r.seniorityMonths} 月、${ntd(r.salaryTotal)}` }))}
            onSelect={(p) => { setSelEmp((cur) => (cur === p.id ? null : p.id ?? null)); setSelBin(null); setSelDept(null); }} />
        </CardContent>
      </Card>

      {selEmp && (() => {
        const r = rows.find((x) => x.employeeId === selEmp);
        return r ? <DetailPanel title={`員工明細：${r.name}`} onClose={() => setSelEmp(null)}><EmployeeMiniTable rows={[r]} /></DetailPanel> : null;
      })()}
    </div>
  );
}

/** 共用：員工薪資小表（鑽取明細用） */
function EmployeeMiniTable({ rows }: { rows: PayrollRow[] }) {
  if (rows.length === 0) return <p className="py-4 text-center text-sm text-muted-foreground">此範圍沒有員工。</p>;
  return (
    <Table>
      <TableHeader><TableRow><TableHead>員工</TableHead><TableHead>部門</TableHead><TableHead className="text-right">年資(月)</TableHead><TableHead className="text-right">月薪資總額</TableHead><TableHead className="text-right">實發</TableHead><TableHead className="text-right">雇主總成本</TableHead></TableRow></TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.employeeId}>
            <TableCell className="font-medium">{r.name}</TableCell>
            <TableCell className="text-sm">{r.department}</TableCell>
            <TableCell className="text-right tabular-nums">{r.seniorityMonths}</TableCell>
            <TableCell className="text-right tabular-nums">{ntd(r.salaryTotal)}</TableCell>
            <TableCell className="text-right tabular-nums">{ntd(r.netPay)}</TableCell>
            <TableCell className="text-right tabular-nums">{ntd(r.employerTotalCost)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/* ───────── 級距與 compa-ratio ───────── */
const NONE = "__none__";
function GradeTab({ rows }: { rows: PayrollRow[] }) {
  const { analytics, upsertPayGrade, removePayGrade, setEmployeeGrade } = usePayrollStore();
  const grades = analytics.payGrades;
  const basis = buildBasis(rows, analytics);
  const hasGrades = grades.length > 0;

  const addGrade = () => upsertPayGrade({ id: `G${Date.now()}`, name: `級距${grades.length + 1}`, min: 30000, mid: 40000, max: 50000 });
  const patchGrade = (id: string, patch: Partial<{ name: string; min: number; mid: number; max: number; marketMid: number }>) => {
    const g = grades.find((x) => x.id === id); if (g) upsertPayGrade({ ...g, ...patch });
  };

  // 熱圖：部門 × 級距 的平均 compa-ratio
  const depts = [...new Set(rows.map((r) => r.department || "（未填）"))];
  const cells = depts.map((d) =>
    grades.map((g) => {
      const vals = basis.filter((b) => (b.department || "（未填）") === d && b.grade?.id === g.id && b.compaRatio != null).map((b) => b.compaRatio as number);
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    }),
  );

  const insights = [
    ...analyzeGrades(
      basis.map((b) => ({ compaRatio: b.compaRatio, pay: b.base, min: b.grade?.min ?? null, max: b.grade?.max ?? null })),
      hasGrades,
    ),
    ...(hasGrades ? analyzeMarket(basis.map((b) => ({ marketCompaRatio: b.marketCompaRatio }))) : []),
  ];

  return (
    <div className="space-y-4">
      <InsightList insights={insights} />
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base">薪資級距（min / 中位 / max ＋市場中位）</CardTitle>
            <CardDescription>內部 min/中位/max 用於 compa-ratio 與區間滲透率；「市場中位」選填，填了才算「對市場」compa-ratio（競爭力）。</CardDescription>
          </div>
          <Button size="sm" onClick={addGrade}><Plus /> 新增級距</Button>
        </CardHeader>
        <CardContent>
          {grades.length === 0 ? (
            <p className="text-sm text-muted-foreground">尚未建立級距。</p>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>名稱</TableHead><TableHead className="text-right">下限</TableHead><TableHead className="text-right">中位</TableHead><TableHead className="text-right">上限</TableHead><TableHead className="text-right">市場中位</TableHead><TableHead className="w-10" /></TableRow></TableHeader>
              <TableBody>
                {grades.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell><Input className="h-8 w-28 col-input" value={g.name} onChange={(e) => patchGrade(g.id, { name: e.target.value })} /></TableCell>
                    <TableCell className="text-right"><Input type="number" className="h-8 w-24 col-input text-right" value={g.min} onChange={(e) => patchGrade(g.id, { min: Number(e.target.value) || 0 })} /></TableCell>
                    <TableCell className="text-right"><Input type="number" className="h-8 w-24 col-input text-right" value={g.mid} onChange={(e) => patchGrade(g.id, { mid: Number(e.target.value) || 0 })} /></TableCell>
                    <TableCell className="text-right"><Input type="number" className="h-8 w-24 col-input text-right" value={g.max} onChange={(e) => patchGrade(g.id, { max: Number(e.target.value) || 0 })} /></TableCell>
                    <TableCell className="text-right"><Input type="number" placeholder="選填" className="h-8 w-24 col-input text-right" value={g.marketMid ?? ""} onChange={(e) => patchGrade(g.id, { marketMid: Number(e.target.value) || 0 })} /></TableCell>
                    <TableCell><Button variant="ghost" size="icon" className="size-7 text-destructive" onClick={() => removePayGrade(g.id)}><Trash2 className="size-3.5" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {!hasGrades && (
        <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-900">
          <Info className="mt-0.5 size-4 shrink-0" />未設定薪資級距，compa-ratio／區間滲透率顯示「—」。請先新增級距並指派員工。
        </div>
      )}

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">員工級距指派與 compa-ratio</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>員工</TableHead><TableHead>部門</TableHead><TableHead className="text-right">月薪</TableHead><TableHead>級距</TableHead><TableHead className="text-right">compa-ratio</TableHead><TableHead className="text-right">市場 compa</TableHead><TableHead className="text-right">區間滲透率</TableHead></TableRow></TableHeader>
            <TableBody>
              {basis.map((b) => (
                <TableRow key={b.employeeId}>
                  <TableCell className="font-medium">{b.name}</TableCell>
                  <TableCell className="text-sm">{b.department}</TableCell>
                  <TableCell className="text-right tabular-nums">{ntd(b.base)}</TableCell>
                  <TableCell>
                    <Select value={b.grade?.id ?? NONE} onValueChange={(v) => setEmployeeGrade(b.employeeId, v === NONE ? null : v)}>
                      <SelectTrigger className="h-8 w-32 col-input"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>未指派</SelectItem>
                        {grades.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{b.compaRatio == null ? "—" : b.compaRatio.toFixed(2)}</TableCell>
                  <TableCell className={cn("text-right tabular-nums", b.marketCompaRatio != null && b.marketCompaRatio < 0.9 && "text-amber-600 font-medium")}>{b.marketCompaRatio == null ? "—" : b.marketCompaRatio.toFixed(2)}</TableCell>
                  <TableCell className="text-right tabular-nums">{b.rangePenetration == null ? "—" : pct(b.rangePenetration)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {hasGrades && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">部門 × 級距 compa-ratio 熱圖</CardTitle>
            <CardDescription>綠＝接近中位(1.0)，藍＝偏低、紅＝偏高。</CardDescription>
          </CardHeader>
          <CardContent><Heatmap rowLabels={depts} colLabels={grades.map((g) => g.name)} cells={cells} /></CardContent>
        </Card>
      )}
    </div>
  );
}

/* ───────── 獎金／分紅試算 ───────── */
function BonusTab({ rows }: { rows: PayrollRow[] }) {
  const { analytics, parameters, brackets, setBonusScenario, setEmployeeRating, setRatingTiers } = usePayrollStore();
  const sc = analytics.scenario;
  const result: BonusSimResult = simulateBonusPool(rows, analytics, parameters, brackets);
  const [selEmp, setSelEmp] = useState<string | null>(null);

  const exportCsv = () => csvDownload(
    ["員工編號", "姓名", "部門", "月薪", "績效", "係數", "權重", "試算獎金", "二代健保概估"],
    result.rows.map((r) => [r.employeeId, r.name, r.department, r.base, r.ratingKey, r.coefficient, Math.round(r.weight), r.bonus, r.supplementary]),
    `獎金試算_${new Date().toISOString().slice(0, 10)}.csv`,
  );

  const insights = analyzeBonus({
    method: sc.method,
    totalBonus: result.totalBonus,
    targetBudget: sc.targetBudget,
    rows: result.rows.map((r) => ({ coefficient: r.coefficient, bonus: r.bonus })),
  });

  return (
    <div className="space-y-4">
      <InsightList insights={insights} />
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">情境設定</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="獎金池來源">
            <Select value={sc.poolMode} onValueChange={(v) => setBonusScenario({ poolMode: v as "amount" | "percentOfPayroll" })}>
              <SelectTrigger className="col-input"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="amount">固定金額</SelectItem><SelectItem value="percentOfPayroll">占月薪資總額 %</SelectItem></SelectContent>
            </Select>
          </Field>
          {sc.poolMode === "amount" ? (
            <Field label="獎金池金額"><Input type="number" className="col-input" value={sc.poolAmount} onChange={(e) => setBonusScenario({ poolAmount: Number(e.target.value) || 0 })} /></Field>
          ) : (
            <Field label="占月薪資總額 %"><Input type="number" step="0.5" className="col-input" value={sc.poolPercent} onChange={(e) => setBonusScenario({ poolPercent: Number(e.target.value) || 0 })} /></Field>
          )}
          <Field label="分配方法">
            <Select value={sc.method} onValueChange={(v) => setBonusScenario({ method: v as typeof sc.method })}>
              <SelectTrigger className="col-input"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="equal">均分</SelectItem><SelectItem value="proRataBase">按本薪比例</SelectItem>
                <SelectItem value="byPerformance">按績效係數</SelectItem><SelectItem value="meritMatrix">merit matrix（績效×級距）</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="目標預算（差異基準）"><Input type="number" className="col-input" value={sc.targetBudget} onChange={(e) => setBonusScenario({ targetBudget: Number(e.target.value) || 0 })} /></Field>
          <label className="col-span-full flex items-center gap-2 text-sm">
            <Checkbox checked={sc.includeSupplementary} onCheckedChange={(v) => setBonusScenario({ includeSupplementary: v === true })} />
            計入個人二代健保補充費概估（獎金超過投保金額 4 倍門檻部分 × 2.11%）
          </label>
        </CardContent>
      </Card>

      <RatingEditor tiers={analytics.ratingTiers} onChange={setRatingTiers} />

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="獎金池" value={`${ntd(result.pool)} 元`} />
        <Stat label="試算發放合計" value={`${ntd(result.totalBonus)} 元`} />
        <Stat label="二代健保概估合計" value={`${ntd(result.totalSupplementary)} 元`} />
      </div>

      {sc.targetBudget > 0 && (
        <Card><CardContent className="pt-4"><Bullet label="獎金池 vs 目標預算" value={result.totalBonus} target={sc.targetBudget} /></CardContent></Card>
      )}

      <Card>
        <CardHeader className="flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">逐人試算</CardTitle>
          <Button variant="outline" size="sm" onClick={exportCsv}><Download /> 匯出 CSV</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>員工</TableHead><TableHead>部門</TableHead><TableHead>績效</TableHead><TableHead className="text-right">月薪</TableHead><TableHead className="text-right">試算獎金</TableHead><TableHead className="text-right">二代健保</TableHead></TableRow></TableHeader>
            <TableBody>
              {result.rows.map((r) => (
                <TableRow key={r.employeeId}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="text-sm">{r.department}</TableCell>
                  <TableCell>
                    <Select value={r.ratingKey} onValueChange={(v) => setEmployeeRating(r.employeeId, v)}>
                      <SelectTrigger className="h-8 w-24 col-input"><SelectValue /></SelectTrigger>
                      <SelectContent>{analytics.ratingTiers.map((t) => <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{ntd(r.base)}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{ntd(r.bonus)}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">{ntd(r.supplementary)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter><TableRow><TableCell colSpan={4}>合計</TableCell><TableCell className="text-right font-bold tabular-nums">{ntd(result.totalBonus)}</TableCell><TableCell className="text-right tabular-nums">{ntd(result.totalSupplementary)}</TableCell></TableRow></TableFooter>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">試算獎金分布</CardTitle>
            <CardDescription>點任一長條看該員試算細項。</CardDescription>
          </CardHeader>
          <CardContent><BarChart data={result.rows.map((r) => ({ label: r.name, value: r.bonus, id: r.employeeId }))} color={PALETTE[3]} selectedIndex={selEmp ? result.rows.findIndex((r) => r.employeeId === selEmp) : null} onSelect={(it) => setSelEmp((cur) => (cur === it.id ? null : it.id ?? null))} /></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">績效係數 vs 試算獎金</CardTitle>
            <CardDescription>檢視 pay-for-performance 對齊度。點任一點看該員。</CardDescription>
          </CardHeader>
          <CardContent><Scatter xLabel="績效係數" yLabel="獎金" color={PALETTE[3]} points={result.rows.map((r) => ({ x: r.coefficient, y: r.bonus, id: r.employeeId, label: `${r.name}：${r.ratingKey}、${ntd(r.bonus)}` }))} onSelect={(p) => setSelEmp((cur) => (cur === p.id ? null : p.id ?? null))} /></CardContent>
        </Card>
      </div>

      {selEmp && (() => {
        const r = result.rows.find((x) => x.employeeId === selEmp);
        return r ? (
          <DetailPanel title={`獎金試算明細：${r.name}`} onClose={() => setSelEmp(null)}>
            <div className="grid gap-2 sm:grid-cols-3">
              {[["部門", r.department], ["績效評等", r.ratingKey], ["績效係數", r.coefficient.toFixed(2)], ["月薪資總額", ntd(r.base)], ["分配權重", ntd(Math.round(r.weight))], ["試算獎金", ntd(r.bonus)], ["二代健保概估", ntd(r.supplementary)]].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <span className="text-muted-foreground">{k}</span><span className="font-medium tabular-nums">{v}</span>
                </div>
              ))}
            </div>
          </DetailPanel>
        ) : null;
      })()}
    </div>
  );
}

/* ───────── 年度／季度調薪試算 ───────── */
function RaiseTab({ rows }: { rows: PayrollRow[] }) {
  const { analytics, parameters, brackets, setRaiseScenario, applyRaise } = usePayrollStore();
  const rs = analytics.raiseScenario;
  const result: RaiseSimResult = simulateRaise(rows, analytics, parameters, brackets);
  const quarterly = rs.cadence === "quarterly";
  const [applyOpen, setApplyOpen] = useState(false);
  const changedRows = result.rows.filter((r) => r.monthlyIncrease !== 0);
  const doApply = () => {
    applyRaise(changedRows.map((r) => ({ employeeId: r.employeeId, newSalary: r.newSalary })), `${RAISE_LABEL[rs.method]}・平均 ${result.avgRaisePct.toFixed(1)}%`);
    setApplyOpen(false);
    alert(`已將 ${changedRows.length} 人的調薪寫回薪資結構。差額套用在本薪，可至「基本資料」或「每月薪資作業」確認。`);
  };
  const [selRating, setSelRating] = useState<string | null>(null);

  // 調幅% by 績效
  const byRating = new Map<string, number[]>();
  result.rows.forEach((r) => byRating.set(r.ratingKey, [...(byRating.get(r.ratingKey) ?? []), r.raisePct]));
  const raiseByRating = [...byRating.entries()].map(([k, arr]) => ({ label: k, value: arr.reduce((a, b) => a + b, 0) / arr.length }));

  // 方案並排比較：同預算/調幅設定下，四種分配法的結果
  const compare = compareRaiseMethods(rows, analytics, parameters, brackets);
  const bestFair = Math.min(...compare.map((c) => c.giniAfter));

  const exportCsv = () => csvDownload(
    ["員工編號", "姓名", "部門", "績效", "現職月薪", "調幅%", "調後月薪", "月增額", "Δ雇主負擔", "年化成本增額", "調後compa"],
    result.rows.map((r) => [r.employeeId, r.name, r.department, r.ratingKey, r.currentSalary, r.raisePct.toFixed(2), r.newSalary, r.monthlyIncrease, r.employerDelta, r.annualizedCostDelta, r.newCompaRatio == null ? "" : r.newCompaRatio.toFixed(2)]),
    `調薪試算_${new Date().toISOString().slice(0, 10)}.csv`,
  );

  const insights = analyzeRaise({
    totalAnnualizedCostDelta: result.totalAnnualizedCostDelta,
    targetBudget: rs.targetBudget,
    giniBefore: result.giniBefore,
    giniAfter: result.giniAfter,
    avgRaisePct: result.avgRaisePct,
  });

  return (
    <div className="space-y-4">
      <InsightList insights={insights} />
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">調薪情境設定</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="期間別">
            <Select value={rs.cadence} onValueChange={(v) => setRaiseScenario({ cadence: v as "annual" | "quarterly" })}>
              <SelectTrigger className="col-input"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="annual">年度</SelectItem><SelectItem value="quarterly">季度</SelectItem></SelectContent>
            </Select>
          </Field>
          <Field label="分配方法">
            <Select value={rs.method} onValueChange={(v) => setRaiseScenario({ method: v as typeof rs.method })}>
              <SelectTrigger className="col-input"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="uniformPercent">一致調幅 %</SelectItem><SelectItem value="proRataBase">按本薪分配加薪池</SelectItem>
                <SelectItem value="byPerformance">按績效係數</SelectItem><SelectItem value="meritMatrix">merit matrix（績效×級距）</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          {rs.method === "uniformPercent" ? (
            <Field label="一致調幅 %"><Input type="number" step="0.5" className="col-input" value={rs.uniformPct} onChange={(e) => setRaiseScenario({ uniformPct: Number(e.target.value) || 0 })} /></Field>
          ) : (
            <>
              <Field label="加薪預算來源">
                <Select value={rs.budgetMode} onValueChange={(v) => setRaiseScenario({ budgetMode: v as "pct" | "amount" })}>
                  <SelectTrigger className="col-input"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="pct">占月薪資總額 %</SelectItem><SelectItem value="amount">固定加薪池（月）</SelectItem></SelectContent>
                </Select>
              </Field>
              <Field label={rs.budgetMode === "pct" ? "占月薪資總額 %" : "加薪池金額（月）"}>
                <Input type="number" step={rs.budgetMode === "pct" ? "0.5" : "1000"} className="col-input" value={rs.budgetValue} onChange={(e) => setRaiseScenario({ budgetValue: Number(e.target.value) || 0 })} />
              </Field>
            </>
          )}
          <Field label="目標年化預算（差異基準）"><Input type="number" className="col-input" value={rs.targetBudget} onChange={(e) => setRaiseScenario({ targetBudget: Number(e.target.value) || 0 })} /></Field>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="月增額合計（加薪）" value={`${ntd(result.totalMonthlyIncrease)} 元`} />
        <Stat label={quarterly ? "季增額（含雇主負擔）" : "月增額（含雇主負擔）"} value={`${ntd(quarterly ? result.totalMonthlyCostDelta * 3 : result.totalMonthlyCostDelta)} 元`} hint="含投保保費重算" />
        <Stat label="年化成本增額" value={`${ntd(result.totalAnnualizedCostDelta)} 元`} />
        <Stat label="平均調幅" value={pct(result.avgRaisePct / 100)} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Stat label="Gini（調薪前 → 後）" value={`${result.giniBefore.toFixed(3)} → ${result.giniAfter.toFixed(3)}`} hint="公平性變化" />
        <Stat label="CV（調薪前 → 後）" value={`${pct(result.cvBefore)} → ${pct(result.cvAfter)}`} />
      </div>

      {rs.targetBudget > 0 && (
        <Card><CardContent className="pt-4"><Bullet label="年化成本增額 vs 目標年化預算" value={result.totalAnnualizedCostDelta} target={rs.targetBudget} /></CardContent></Card>
      )}

      <Card>
        <CardHeader className="flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">逐人調薪試算</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCsv}><Download /> 匯出 CSV</Button>
            <Button size="sm" disabled={changedRows.length === 0} onClick={() => setApplyOpen(true)}>
              <CheckCircle2 /> 核定套用此方案
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>員工</TableHead><TableHead>績效</TableHead><TableHead className="text-right">現職月薪</TableHead><TableHead className="text-right">調幅%</TableHead><TableHead className="text-right">調後月薪</TableHead><TableHead className="text-right">月增額</TableHead><TableHead className="text-right">Δ雇主負擔</TableHead><TableHead className="text-right">年化成本增額</TableHead><TableHead className="text-right">調後compa</TableHead></TableRow></TableHeader>
            <TableBody>
              {result.rows.map((r) => (
                <TableRow key={r.employeeId}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell><Badge variant="outline">{r.ratingKey}</Badge></TableCell>
                  <TableCell className="text-right tabular-nums">{ntd(r.currentSalary)}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.raisePct.toFixed(1)}%</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{ntd(r.newSalary)}</TableCell>
                  <TableCell className="text-right tabular-nums">{ntd(r.monthlyIncrease)}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">{ntd(r.employerDelta)}</TableCell>
                  <TableCell className="text-right tabular-nums">{ntd(r.annualizedCostDelta)}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.newCompaRatio == null ? "—" : r.newCompaRatio.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter><TableRow><TableCell colSpan={5}>合計</TableCell><TableCell className="text-right font-bold tabular-nums">{ntd(result.totalMonthlyIncrease)}</TableCell><TableCell /><TableCell className="text-right font-bold tabular-nums">{ntd(result.totalAnnualizedCostDelta)}</TableCell><TableCell /></TableRow></TableFooter>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">平均調幅% by 績效</CardTitle>
          <CardDescription>點任一評等，看該評等員工的逐人調薪。</CardDescription>
        </CardHeader>
        <CardContent><BarChart data={raiseByRating} valueFmt={(n) => `${n.toFixed(1)}%`} color={PALETTE[2]} selectedIndex={selRating ? raiseByRating.findIndex((d) => d.label === selRating) : null} onSelect={(it) => setSelRating((cur) => (cur === it.label ? null : it.label))} /></CardContent>
      </Card>

      {selRating && (
        <DetailPanel title={`評等 ${selRating} 的逐人調薪`} onClose={() => setSelRating(null)}>
          <Table>
            <TableHeader><TableRow><TableHead>員工</TableHead><TableHead className="text-right">現職月薪</TableHead><TableHead className="text-right">調幅%</TableHead><TableHead className="text-right">調後月薪</TableHead><TableHead className="text-right">月增額</TableHead><TableHead className="text-right">年化成本增額</TableHead></TableRow></TableHeader>
            <TableBody>
              {result.rows.filter((r) => r.ratingKey === selRating).map((r) => (
                <TableRow key={r.employeeId}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{ntd(r.currentSalary)}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.raisePct.toFixed(1)}%</TableCell>
                  <TableCell className="text-right tabular-nums">{ntd(r.newSalary)}</TableCell>
                  <TableCell className="text-right tabular-nums">{ntd(r.monthlyIncrease)}</TableCell>
                  <TableCell className="text-right tabular-nums">{ntd(r.annualizedCostDelta)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DetailPanel>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">分配方法並排比較</CardTitle>
          <CardDescription>用目前的預算/調幅設定，把四種分配法跑一遍並列；同樣花費下，哪種更公平、是否在預算內，一眼比較。目前選用：<Badge variant="outline">{compare.find((c) => c.method === rs.method)?.label}</Badge></CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>分配法</TableHead><TableHead className="text-right">月增額合計</TableHead><TableHead className="text-right">年化成本增額</TableHead><TableHead className="text-right">平均調幅</TableHead><TableHead className="text-right">調後 Gini</TableHead>{rs.targetBudget > 0 && <TableHead className="text-right">預算差異</TableHead>}</TableRow></TableHeader>
            <TableBody>
              {compare.map((c) => (
                <TableRow key={c.method} className={cn(c.method === rs.method && "bg-accent/50")}>
                  <TableCell className="font-medium">
                    {c.label}{c.method === rs.method && <Badge variant="outline" className="ml-1.5 text-[10px]">目前</Badge>}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{ntd(c.totalMonthlyIncrease)}</TableCell>
                  <TableCell className="text-right tabular-nums">{ntd(c.totalAnnualizedCostDelta)}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.avgRaisePct.toFixed(1)}%</TableCell>
                  <TableCell className={cn("text-right tabular-nums", c.giniAfter === bestFair && "font-bold text-emerald-600")}>{c.giniAfter.toFixed(3)}</TableCell>
                  {rs.targetBudget > 0 && <TableCell className={cn("text-right tabular-nums", c.variance > 0 ? "text-red-600" : "text-emerald-600")}>{c.variance > 0 ? `超 ${ntd(c.variance)}` : `餘 ${ntd(-c.variance)}`}</TableCell>}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="mt-2 text-xs text-muted-foreground">綠色＝四法中調後最公平（Gini 最低）。一致調幅與按本薪不看績效；按績效/merit matrix 會向高績效（與級距偏低者）傾斜。切換上方「分配方法」即可套用。</p>
        </CardContent>
      </Card>

      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>核定並套用調薪方案</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-900">
              <Info className="mt-0.5 size-4 shrink-0" />
              此操作會把 {changedRows.length} 人的調後月薪<strong>寫回薪資結構（差額套在本薪）</strong>，並留下稽核紀錄；之後當月結算會自動以新薪資計算。試算僅本次套用，請確認無誤。
            </div>
            <div className="max-h-[50vh] overflow-auto rounded-md border">
              <Table>
                <TableHeader><TableRow><TableHead>員工</TableHead><TableHead className="text-right">現職月薪</TableHead><TableHead className="text-right">調後月薪</TableHead><TableHead className="text-right">調幅</TableHead></TableRow></TableHeader>
                <TableBody>
                  {changedRows.map((r) => (
                    <TableRow key={r.employeeId}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell className="text-right tabular-nums">{ntd(r.currentSalary)}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{ntd(r.newSalary)}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.raisePct.toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApplyOpen(false)}>取消</Button>
            <Button onClick={doApply}><CheckCircle2 /> 確認核定寫回</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ───────── 專案成本 ───────── */
export function ProjectCostTab({ rows, period }: { rows: PayrollRow[]; period: string }) {
  const { salaries, events, dependents, brackets, projects, allocations, parameters, employees } = usePayrollStore();
  const currentPeriod = period;
  const bonusOf = (id: string) => events.find((e) => e.employeeId === id && e.period === period)?.monthlyBonus ?? 0;
  const otherOf = (id: string) => events.find((e) => e.employeeId === id && e.period === period)?.otherAddition ?? 0;
  const codeToId = new Map(projects.map((p) => [p.code, p.id]));
  const input = {
    rows, allocations, projects, period: currentPeriod, monthlyWorkHours: parameters.monthlyWorkHours,
    baseByEmp: new Map(salaries.map((s) => [s.employeeId, s.baseSalary])),
    bonusByEmp: new Map(rows.map((r) => [r.employeeId, bonusOf(r.employeeId)])),
    otherByEmp: new Map(rows.map((r) => [r.employeeId, otherOf(r.employeeId)])),
    defaultProjectByEmp: new Map(employees.filter((e) => e.project && codeToId.has(e.project)).map((e) => [e.id, codeToId.get(e.project) as string])),
  };
  const result = computeProjectCost(input);
  const matrix = projectDeptMatrix(input);
  const maxCell = Math.max(1, ...matrix.cells.flat().map((v) => v ?? 0));
  const charge = chargeOutVariance(input).filter((c) => c.projectId !== UNALLOCATED_ID && (c.actual > 0 || c.standard > 0));
  const shown = result.projects.filter((p) => p.totalCost > 0 || p.budget > 0);
  const insights = analyzeProjectCost({ projects: result.projects, companyTotal: result.companyTotal, utilization: result.utilization });

  const SEGS = [
    { key: "base", label: "本薪", color: PALETTE[0] },
    { key: "allowance", label: "加給/津貼", color: PALETTE[1] },
    { key: "ot", label: "加班費", color: PALETTE[2] },
    { key: "bonus", label: "獎金", color: PALETTE[3] },
    { key: "other", label: "其他加項", color: PALETTE[7] },
    { key: "burden", label: "雇主負擔", color: PALETTE[5] },
  ] as const;

  if (projects.length === 0) {
    return <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">尚未建立專案。請到「系統設定 → 專案主檔」新增專案，並在「每月薪資作業」設定工時分攤。</CardContent></Card>;
  }

  const exportCsv = () => csvDownload(
    ["專案", "投入工時", "FTE", "本薪", "加給", "加班", "獎金", "其他", "雇主負擔", "總成本", "占比%", "期間預算", "差異"],
    result.projects.map((p) => [p.name, p.hours, p.fte.toFixed(2), p.base, p.allowance, p.ot, p.bonus, p.other, p.burden, p.totalCost, (p.pctOfCompany * 100).toFixed(1), p.budget, p.variance]),
    `專案成本_${currentPeriod}.csv`,
  );

  return (
    <div className="space-y-4">
      <InsightList insights={insights} />
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="人事總成本" value={`${ntd(result.companyTotal)} 元`} />
        <Stat label="專案數" value={`${shown.filter((p) => p.projectId !== UNALLOCATED_ID).length} 個`} />
        <Stat label="工時稼動率" value={pct(result.utilization)} hint="直接工時/總工時" />
        <Stat label="未分攤占比" value={pct(result.companyTotal ? (result.projects.find((p) => p.projectId === UNALLOCATED_ID)?.totalCost ?? 0) / result.companyTotal : 0)} />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base">各專案成本組成</CardTitle>
            <CardDescription>每位員工全載成本依工時分攤；合計＝全公司總成本（勾稽）。</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={exportCsv}><Download /> 匯出 CSV</Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <StackedBar rows={shown.map((p) => ({ label: p.name, segments: SEGS.map((s) => ({ label: s.label, value: p[s.key], color: s.color })) }))} />
          <Legend items={SEGS.map((s) => ({ label: s.label, color: s.color }))} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">逐專案明細（含預算 vs 實際）</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>專案</TableHead><TableHead className="text-right">工時</TableHead><TableHead className="text-right">FTE</TableHead><TableHead className="text-right">總成本</TableHead><TableHead className="text-right">占比</TableHead><TableHead className="text-right">期間預算</TableHead><TableHead className="text-right">差異</TableHead></TableRow></TableHeader>
            <TableBody>
              {shown.map((p) => (
                <TableRow key={p.projectId} className={cn(p.projectId === UNALLOCATED_ID && "text-muted-foreground")}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{p.hours || "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{p.hours ? p.fte.toFixed(2) : "—"}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{ntd(p.totalCost)}</TableCell>
                  <TableCell className="text-right tabular-nums">{(p.pctOfCompany * 100).toFixed(1)}%</TableCell>
                  <TableCell className="text-right tabular-nums">{p.budget ? ntd(p.budget) : "—"}</TableCell>
                  <TableCell className={cn("text-right tabular-nums", p.budget > 0 && (p.variance < 0 ? "text-red-600" : "text-emerald-600"))}>{p.budget ? (p.variance < 0 ? `超 ${ntd(-p.variance)}` : `餘 ${ntd(p.variance)}`) : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter><TableRow><TableCell>合計</TableCell><TableCell className="text-right tabular-nums">{result.totalDirectHours || "—"}</TableCell><TableCell /><TableCell className="text-right font-bold tabular-nums">{ntd(result.companyTotal)}</TableCell><TableCell className="text-right">100%</TableCell><TableCell colSpan={2} /></TableRow></TableFooter>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">成本集中度（Pareto 80/20）</CardTitle></CardHeader>
          <CardContent><Pareto data={shown.filter((p) => p.projectId !== UNALLOCATED_ID).map((p) => ({ label: p.name, value: p.totalCost }))} /></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">預算 vs 實際</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {shown.filter((p) => p.budget > 0).length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">尚未設定專案預算（系統設定 → 專案主檔）。</p>
            ) : shown.filter((p) => p.budget > 0).map((p) => (
              <Bullet key={p.projectId} label={p.name} value={p.totalCost} target={p.budget} />
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">專案 × 部門成本矩陣</CardTitle>
            <CardDescription>各專案人事成本由哪些部門投入；每列加總＝該專案總成本。</CardDescription>
          </CardHeader>
          <CardContent>
            <Heatmap rowLabels={matrix.rowLabels} colLabels={matrix.colLabels} cells={matrix.cells} domain={[0, maxCell]} fmt={(n) => ntd(n)} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">標準工率差異（charge-out）</CardTitle>
            <CardDescription>標準工率＝全載成本÷標準工時；應計＝工率×投入工時。差異為負＝投入工時少於標準（吸收不足）。</CardDescription>
          </CardHeader>
          <CardContent>
            {charge.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">尚無可比較的專案工時。</p>
            ) : (
              <Table>
                <TableHeader><TableRow><TableHead>專案</TableHead><TableHead className="text-right">應計(標準)</TableHead><TableHead className="text-right">實際</TableHead><TableHead className="text-right">差異</TableHead></TableRow></TableHeader>
                <TableBody>
                  {charge.map((c) => (
                    <TableRow key={c.projectId}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-right tabular-nums">{ntd(c.standard)}</TableCell>
                      <TableCell className="text-right tabular-nums">{ntd(c.actual)}</TableCell>
                      <TableCell className={cn("text-right tabular-nums", c.variance < 0 ? "text-red-600" : c.variance > 0 ? "text-emerald-600" : "")}>{ntd(c.variance)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <ProjectEacSection />
    </div>
  );

  function ProjectEacSection() {
    const periods = [...new Set([...events.map((e) => e.period), currentPeriod])].filter((p) => p <= currentPeriod).sort((a, b) => a.localeCompare(b));
    const byPeriod = projectCostByPeriod({ employees, salaries, dependents, events, allocations, projects, parameters, brackets }, periods);
    const eac = projectEac(byPeriod, projects, currentPeriod).filter((e) => e.ac > 0);
    if (periods.length < 2 || eac.length === 0) {
      return (
        <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">
          EAC／燃燒率需要至少兩個月的專案成本資料。請於不同月份建立分攤（或載入多月示範資料）。
        </CardContent></Card>
      );
    }
    const top = [...eac].sort((a, b) => b.ac - a.ac).slice(0, 4);
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">EAC／燃燒率（跨月累計）</CardTitle>
          <CardDescription>逐月累計各專案實際成本，算燃燒率與完工預估（EAC）；填「%完成」則另以 EVM（CPI）推估。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {top.map((e) => (
              <div key={e.projectId}>
                <p className="mb-1 truncate text-xs font-medium text-muted-foreground" title={e.name}>{e.name}</p>
                <TrendChart data={e.monthly.map((m) => ({ label: m.period, value: m.cost }))} color={PALETTE[4]} />
              </div>
            ))}
          </div>
          <Table>
            <TableHeader><TableRow><TableHead>專案</TableHead><TableHead className="text-right">累計實際</TableHead><TableHead className="text-right">燃燒率/月</TableHead><TableHead className="text-right">EAC(燃燒率)</TableHead><TableHead className="text-right">EAC(EVM)</TableHead><TableHead className="text-right">完工差異</TableHead><TableHead className="text-right">%消耗</TableHead></TableRow></TableHeader>
            <TableBody>
              {eac.map((e) => (
                <TableRow key={e.projectId}>
                  <TableCell className="font-medium">{e.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{ntd(e.ac)}</TableCell>
                  <TableCell className="text-right tabular-nums">{ntd(e.burnRate)}</TableCell>
                  <TableCell className="text-right tabular-nums">{e.budget ? ntd(e.runRateEac) : "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{e.eacEvm != null ? ntd(e.eacEvm) : "—"}</TableCell>
                  <TableCell className={cn("text-right tabular-nums", e.budget > 0 && (e.varianceRunRate < 0 ? "text-red-600" : "text-emerald-600"))}>{e.budget ? (e.varianceRunRate < 0 ? `超 ${ntd(-e.varianceRunRate)}` : `餘 ${ntd(e.varianceRunRate)}`) : "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{e.budget ? pct(e.pctConsumed) : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="text-xs text-muted-foreground">EAC(燃燒率)＝月均×專案總月數；EAC(EVM)＝預算÷CPI（需填「%完成」）。完工差異＝預算−EAC(燃燒率)。</p>
        </CardContent>
      </Card>
    );
  }
}

/* ───────── 趨勢與預算 ───────── */
function TrendTab({ rows }: { rows: PayrollRow[] }) {
  const { snapshots, saveSnapshot, removeSnapshot, currentPeriod, events, analytics, parameters, brackets, setPlanning, loadDemoData, employees, salaries, dependents } = usePayrollStore();

  const bonusTotal = rows.reduce((a, r) => a + (events.find((e) => e.employeeId === r.employeeId && e.period === currentPeriod)?.monthlyBonus ?? 0), 0);
  const canSave = rows.length > 0;
  const sorted = [...snapshots].sort((a, b) => a.period.localeCompare(b.period));
  const alreadySaved = snapshots.some((s) => s.period === currentPeriod);

  // 年度預算追蹤
  const annualBudget = analytics.planning.annualPayrollBudget;
  const currentMonthlyCost = rows.reduce((a, r) => a + r.employerTotalCost, 0);
  const currentAnnualizedCost = currentMonthlyCost * 12;
  const raise = simulateRaise(rows, analytics, parameters, brackets);
  const bonus = simulateBonusPool(rows, analytics, parameters, brackets);
  const plannedDelta = raise.totalAnnualizedCostDelta + bonus.totalBonus; // 調薪年化 + 獎金（一次性）
  const projected = currentAnnualizedCost + plannedDelta;

  const trendInsights = analyzeTrend(snapshots);
  const budgetInsights = analyzeBudget({ annualBudget, currentAnnualizedCost, plannedDelta });
  const [selPeriod, setSelPeriod] = useState<string | null>(null);
  const selIdx = selPeriod ? sorted.findIndex((s) => s.period === selPeriod) : null;
  const togglePeriod = (label: string) => setSelPeriod((cur) => (cur === label ? null : label));

  const save = () => saveSnapshot(buildSnapshot(rows, currentPeriod, bonusTotal));

  // 年報：當年累計（實際，快照優先、缺則回推估算）＋模擬全年（YTD＋剩餘月 run-rate）
  const year = currentPeriod.slice(0, 4);
  const candidatePeriods = [...new Set(events.map((e) => e.period))];
  const recompute = (p: string) =>
    buildSnapshot(buildPayrollRows(p, { employees, salaries, dependents, events, parameters, brackets }), p, events.filter((e) => e.period === p).reduce((a, e) => a + e.monthlyBonus, 0));
  const aMonths = annualMonths(year, currentPeriod, snapshots, candidatePeriods, recompute);
  const aTot = annualTotals(aMonths);
  const estimatedCount = aMonths.filter((m) => m.estimated).length;
  const sim = simulateAnnual(year, currentPeriod, currentMonthlyCost, snapshots);

  return (
    <div className="space-y-4">
      {/* 年報：當年累計與全年推估 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{year} 年累計與全年推估</CardTitle>
          <CardDescription>
            「實際累計」為當年各月已確認月結快照之加總（缺快照月份以目前資料回推、標示估算）；
            「模擬全年」＝當年已實際 ＋ 剩餘月以本月 run-rate 外推。
            {estimatedCount > 0 && <span className="text-amber-700">　含 {estimatedCount} 個估算月份（建議於各月結算後確認以留存快照）。</span>}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-4">
            <Stat label={`實際累計成本（${aTot.months} 個月）`} value={`${ntd(aTot.totalCost)} 元`} />
            <Stat label="實際累計獎金" value={`${ntd(aTot.bonusTotal)} 元`} />
            <Stat label="模擬全年總成本" value={`${ntd(sim.projectedAnnual)} 元`} hint={`剩餘 ${sim.remainingMonths} 月以本月推估`} />
            <Stat label="年度預算" value={annualBudget > 0 ? `${ntd(annualBudget)} 元` : "未設定"} />
          </div>
          {annualBudget > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Bullet label="實際累計 vs 年度預算" value={aTot.totalCost} target={annualBudget} />
              <Bullet label="模擬全年 vs 年度預算" value={sim.projectedAnnual} target={annualBudget} />
            </div>
          )}
          {aMonths.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">各月人事成本（實際／估算）</p>
              <TrendChart data={aMonths.map((m) => ({ label: m.period, value: m.snapshot.totalCost }))} color={PALETTE[4]} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 年度預算追蹤 */}
      <InsightList insights={budgetInsights} />
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">年度人事預算追蹤</CardTitle>
          <CardDescription>把「目前薪資年化」加上「試算中的調薪＋獎金」與年度預算相比，看還剩多少、會不會超支（規劃用，不影響實際薪資）。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:max-w-xs">
            <Field label="年度人事預算（雇主總成本，全年）">
              <Input type="number" step="100000" className="col-input" value={annualBudget} onChange={(e) => setPlanning({ annualPayrollBudget: Number(e.target.value) || 0 })} />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <Stat label="目前年化成本" value={`${ntd(currentAnnualizedCost)} 元`} hint="當期雇主總成本 ×12" />
            <Stat label="試算調薪（年化）" value={`${ntd(raise.totalAnnualizedCostDelta)} 元`} hint="含投保保費重算" />
            <Stat label="試算獎金（一次性）" value={`${ntd(bonus.totalBonus)} 元`} />
            <Stat label="預估全年合計" value={`${ntd(projected)} 元`} />
          </div>
          {annualBudget > 0 && <Bullet label="預估全年人事成本 vs 年度預算" value={projected} target={annualBudget} />}
        </CardContent>
      </Card>

      {/* 薪酬趨勢 */}
      <InsightList insights={trendInsights} />
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="size-4 text-primary" /> 薪酬趨勢（歷期快照）</CardTitle>
            <CardDescription>每期結算後按右側保存一次彙總，累積即可看走勢。快照只存彙總數字、不含個資，留在本機。</CardDescription>
          </div>
          <Button size="sm" onClick={save} disabled={!canSave}>
            <Save /> {alreadySaved ? `更新 ${currentPeriod} 快照` : `保存 ${currentPeriod} 快照`}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {sorted.length === 0 ? (
            <div className="space-y-3 py-6 text-center">
              <p className="text-sm text-muted-foreground">尚無快照。{canSave ? "按右上角保存本期，或一鍵載入多月示範資料看趨勢。" : "請先於「每月薪資作業」建立當期薪資。"}</p>
              {canSave && (
                <Button variant="outline" size="sm" onClick={() => loadDemoData(6)}>
                  <TrendingUp /> 載入多月示範資料（6 個月）
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="grid gap-4 lg:grid-cols-3">
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">人事總成本</p>
                  <TrendChart data={sorted.map((s) => ({ label: s.period, value: s.totalCost }))} color={PALETTE[4]} selectedIndex={selIdx} onSelect={(it) => togglePeriod(it.label)} />
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">薪資中位數</p>
                  <TrendChart data={sorted.map((s) => ({ label: s.period, value: s.medianSalary }))} color={PALETTE[0]} selectedIndex={selIdx} onSelect={(it) => togglePeriod(it.label)} />
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Gini（公平性）</p>
                  <TrendChart data={sorted.map((s) => ({ label: s.period, value: Number(s.gini.toFixed(3)) }))} color={PALETTE[3]} valueFmt={(n) => n.toFixed(2)} zeroBased={false} selectedIndex={selIdx} onSelect={(it) => togglePeriod(it.label)} />
                </div>
              </div>
              <Table>
                <TableHeader><TableRow><TableHead>期間</TableHead><TableHead className="text-right">人數</TableHead><TableHead className="text-right">月薪資總額</TableHead><TableHead className="text-right">中位薪資</TableHead><TableHead className="text-right">總成本</TableHead><TableHead className="text-right">加班費</TableHead><TableHead className="text-right">獎金</TableHead><TableHead className="text-right">Gini</TableHead><TableHead className="w-10" /></TableRow></TableHeader>
                <TableBody>
                  {sorted.map((s) => (
                    <TableRow key={s.period} className={cn("cursor-pointer", selPeriod === s.period && "bg-accent/60")} onClick={() => togglePeriod(s.period)}>
                      <TableCell className="font-medium">{s.period}</TableCell>
                      <TableCell className="text-right tabular-nums">{s.headcount}</TableCell>
                      <TableCell className="text-right tabular-nums">{ntd(s.totalSalary)}</TableCell>
                      <TableCell className="text-right tabular-nums">{ntd(s.medianSalary)}</TableCell>
                      <TableCell className="text-right tabular-nums">{ntd(s.totalCost)}</TableCell>
                      <TableCell className="text-right tabular-nums">{ntd(s.overtimePay)}</TableCell>
                      <TableCell className="text-right tabular-nums">{ntd(s.bonusTotal)}</TableCell>
                      <TableCell className="text-right tabular-nums">{s.gini.toFixed(3)}</TableCell>
                      <TableCell><Button variant="ghost" size="icon" className="size-7 text-destructive" onClick={() => removeSnapshot(s.period)}><Trash2 className="size-3.5" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ───────── 指標說明（用途＋怎麼看，非公式） ───────── */
interface GlossaryItem {
  term: string;
  purpose: string; // 這個數字想表達什麼（用途）
  reading: string; // 該怎麼讀、落在哪些區間代表什麼
}
function GlossaryTab() {
  const items: GlossaryItem[] = [
    {
      term: "compa-ratio（薪酬比較比）",
      purpose: "回答「這個人薪水相對於同職級的『標準價』是高還是低」，用來檢查薪資定位是否合理、有沒有人被低估或過度給付。",
      reading: "以 1.0 為基準（剛好在級距中位）。落在 0.9～1.1 算健康；低於 0.9 代表偏低、留才風險高，可優先調薪；高於 1.1 代表已偏高、再調空間有限，宜改用獎金激勵。",
    },
    {
      term: "range penetration（區間滲透率）",
      purpose: "看一個人在自己職級的薪資帶裡「走到哪了」，判斷還有多少往上的空間，常用於規劃調薪幅度。",
      reading: "0% 在下限、100% 到上限。新人或剛升遷者通常偏低（如 20～40%）很正常；長年資者仍偏低要留意，已接近 100% 表示快觸頂、需用升級或獎金而非加薪。",
    },
    {
      term: "百分位 P10–P90",
      purpose: "把全體由低到高排隊，看不同位置的人各拿多少，用來了解整體薪資水準與「頭尾差距」，比平均數更不受極端值干擾。",
      reading: "中位數（P50）是最具代表性的「中間水準」。比較 P90 與 P10 的倍數可看差距：倍數越大代表高低拉得越開；觀察 P10 是否過低（偏低薪族群）。",
    },
    {
      term: "變異係數 CV",
      purpose: "用一個百分比總結「大家的薪水差異有多大」，方便跨部門、跨期間比較離散程度。",
      reading: "越小代表越集中、齊頭；越大代表差異越大。一般 20～40% 屬常見；過低可能是齊頭式、缺乏差異化，過高要確認是否由少數極端薪資造成。",
    },
    {
      term: "Gini 係數 / Lorenz 曲線",
      purpose: "衡量薪資分配「公不公平／平不平均」的單一指標，Lorenz 曲線則把它畫成圖，一眼看出不均程度。",
      reading: "Gini 介於 0～1：越接近 0 越平均。小於 0.25 偏平均、0.25～0.4 多數公司的常見區間、大於 0.4 差距偏大需檢視。Lorenz 曲線越貼對角線越平均、越下凹越不均。",
    },
    {
      term: "獎金/本薪比、變動薪酬比",
      purpose: "看薪酬中「固定 vs 變動」的比重，評估激勵彈性與每月成本的波動風險。",
      reading: "比例高＝激勵彈性大但成本較不穩定、編預算要留緩衝；比例低＝成本穩定但激勵空間小。沒有絕對標準，重點看是否符合公司策略與產業慣例。",
    },
    {
      term: "成本集中度（前 20% 占比／Pareto）",
      purpose: "檢視人事成本是否過度集中在少數人身上，藉以評估關鍵人力依賴與單點風險。",
      reading: "前 20% 人員若占超過一半成本，代表對少數人高度依賴，需確認接班與留任計畫；分布越分散，人力結構越平衡。",
    },
    {
      term: "merit matrix（績效×級距）",
      purpose: "把「績效高低」和「目前在級距的位置」一起納入，決定誰該多調、多給，兼顧獎優與內部公平。",
      reading: "原則：績效好且目前薪資偏低者加碼最多；績效好但已偏高者幅度收斂。用於避免「好人才卡在低薪」又不讓高薪者無限上漲。",
    },
    {
      term: "分配方法（均分／按本薪／按績效／merit matrix）",
      purpose: "決定一筆獎金池或加薪預算「怎麼分給每個人」，不同方法反映不同的管理取向。",
      reading: "均分＝最公平但與績效無關；按本薪＝與職級連動但不看當期表現；按績效／merit matrix＝獎優汰劣、與表現連動。想強化績效差異化就往後者走。",
    },
    {
      term: "年化成本增額",
      purpose: "把調薪的影響換算成「整年公司要多付多少」，且把基薪調高後連帶增加的雇主保費一併算進去，作為預算決策依據。",
      reading: "這個數字＝每月增額（含雇主負擔變化）×12。與年度預算相比即可知是否超支；季度調薪也一律換算成年化，方便不同方案放在同一基準比較。",
    },
    {
      term: "市場 compa-ratio（對外競爭力）",
      purpose: "和一般 compa-ratio 一樣是「實薪 ÷ 中位」，但分母換成『市場中位』，回答「我們相對同業是高是低」，是招募與留才決策最直接的依據。",
      reading: "以 1.0 為市場中位。低於 0.9 代表明顯落後同業、挖角風險高；0.9～1.1 與市場相當；高於 1.1 領先市場、留才有利但成本較高。需先在級距填入『市場中位』才會顯示。",
    },
    {
      term: "薪酬趨勢（歷期快照）",
      purpose: "把每期的人事成本、薪資中位、公平性留成時間序列，看「往哪個方向走」，規劃時用趨勢而非單月數字判斷。",
      reading: "看斜率與轉折：總成本持續陡升要找原因（人數/調薪/加班）；中位數穩定成長代表整體往上；Gini 往下代表差距縮小。至少要兩期快照才有趨勢。",
    },
    {
      term: "年度預算使用率",
      purpose: "把「目前薪資年化＋試算調整」對比全年預算，隨時知道預算還剩多少、這次調整會不會爆，避免年底才發現超支。",
      reading: "＝預估全年成本 ÷ 年度預算。低於 95% 尚有餘裕；95～100% 接近上限、調整要謹慎；超過 100% 表示會超支，需調降幅度或重訂預算。",
    },
  ];
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">指標怎麼用、怎麼看</CardTitle>
        <CardDescription>每個指標不講公式，只說明「能告訴你什麼（用途）」與「數字落在哪代表什麼（怎麼看）」。借鑑業界常用薪酬分析方法（compa-ratio、merit matrix、利潤分享 pro-rata 等）。</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {items.map((it) => (
          <div key={it.term} className="rounded-md border p-3">
            <p className="text-sm font-medium">{it.term}</p>
            <p className="mt-1.5 text-xs leading-relaxed">
              <span className="font-medium text-foreground">用途：</span>
              <span className="text-muted-foreground">{it.purpose}</span>
            </p>
            <p className="mt-1 text-xs leading-relaxed">
              <span className="font-medium text-foreground">怎麼看：</span>
              <span className="text-muted-foreground">{it.reading}</span>
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/* ───────── 口語化意見回饋 ───────── */
const INSIGHT_STYLE = {
  good: { wrap: "border-emerald-200 bg-emerald-50", icon: CheckCircle2, iconColor: "text-emerald-600", title: "text-emerald-900", tag: "良好" },
  info: { wrap: "border-sky-200 bg-sky-50", icon: Lightbulb, iconColor: "text-sky-600", title: "text-sky-900", tag: "提醒" },
  warn: { wrap: "border-amber-300 bg-amber-50", icon: AlertTriangle, iconColor: "text-amber-600", title: "text-amber-900", tag: "需注意" },
} as const;

function InsightList({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) return null;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base"><Lightbulb className="size-4 text-primary" /> 重點意見（白話解讀）</CardTitle>
        <CardDescription>系統根據本期數據自動判讀，給出結論與建議；下方圖表與數字為佐證依據。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {insights.map((it, i) => {
          const s = INSIGHT_STYLE[it.level];
          const Icon = s.icon;
          return (
            <div key={i} className={cn("flex items-start gap-2.5 rounded-md border p-3", s.wrap)}>
              <Icon className={cn("mt-0.5 size-4 shrink-0", s.iconColor)} />
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm font-semibold", s.title)}>
                  <span className="mr-1.5 rounded bg-white/70 px-1 py-0.5 text-[10px] font-medium align-middle">{s.tag}</span>
                  {it.title}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{it.detail}</p>
                {it.evidence && <p className="mt-1 text-[11px] text-muted-foreground/80">佐證：{it.evidence}</p>}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

/* ───────── 共用小元件 ───────── */
function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card><CardContent className="p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-bold tabular-nums">{value}</p>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </CardContent></Card>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1"><Label className="text-xs">{label}</Label>{children}</div>;
}
function DetailPanel({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <Card className="border-primary/40 ring-1 ring-primary/20">
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>關閉明細</Button>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
function RatingEditor({ tiers, onChange }: { tiers: { key: string; label: string; coefficient: number }[]; onChange: (t: typeof tiers) => void }) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">績效評等係數</CardTitle><CardDescription>可調整各評等對應係數（影響「按績效」與 merit matrix 分配）。</CardDescription></CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        {tiers.map((t, i) => (
          <div key={t.key} className="space-y-1">
            <Label className="text-xs">{t.label}</Label>
            <Input type="number" step="0.1" className="h-8 w-20 col-input" value={t.coefficient}
              onChange={(e) => onChange(tiers.map((x, j) => (j === i ? { ...x, coefficient: Number(e.target.value) || 0 } : x)))} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
