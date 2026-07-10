// 薪酬分析（/analytics）＝規劃與試算中心（「試算」徽章，與 actual 報表分流）。設計原理：
//  - 三層內容：月報（成本結構/分布公平/等級/市場 compa）、規劃試算沙盒（獎金池/調薪方案/
//    預算試算）、年報（累計＋以 simulateAnnual 補估未來月）。
//  - **沙盒即時輸入、不寫回薪資**（刻意例外：唯讀-送出會破壞試算體驗）；唯一會寫回的是
//    RaiseTab 核定套用（呼叫 store.applyRaise／scheduleRaises，並記稽核）。
//  - 判讀文字全部委給純函數 insights（analyzeXxx），本頁只組裝圖表卡（ChartCard）與表格
//    （DataTable）＋輸入控制；計算量大者用既有 selectors 逐期重算。
import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Callout, type CalloutVariant } from "@/components/ui/callout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { usePayrollStore, resolveSettingVersion } from "@/store/usePayrollStore";
import { DEFAULT_PARAMETERS } from "@/config/parameters";
import { DEFAULT_BRACKETS } from "@/config/brackets";
import { usePayrollRows, usePayrollRowsFor, buildPayrollRows, type PayrollRow } from "@/store/selectors";
import { annualMonths, annualTotals, simulateAnnual } from "@/lib/reports/annual";
import { saveBlob } from "@/lib/payslipPdf";
import { csvSerialize } from "@/lib/csv";
import { cn, ntd, pct, pctOf, ratioPct, formatPeriod } from "@/lib/utils";
import {
  percentileSet, coefficientOfVariation, gini, lorenzPoints, histogram,
  buildBasis, simulateBonusPool, simulateRaise, buildSnapshot, compareRaiseMethods,
  type BonusSimResult, type RaiseSimResult,
} from "@/lib/analytics";
import { StackedBar, BarChart, LineChart, Pareto, Scatter, Bullet, Heatmap, TrendChart, PALETTE } from "@/components/charts";
import { Delta } from "@/components/ui/delta";
import { DataTable } from "@/components/ui/data-table";
import { ChartCard } from "@/components/ui/chart-card";
import { TabPills } from "@/components/ui/tab-pills";
import {
  analyzeCost, analyzeDistribution, analyzeGrades, analyzeBonus, analyzeRaise,
  analyzeMarket, analyzeTrend, analyzeBudget, analyzeProjectCost, type Insight,
} from "@/lib/insights";
import { addMonths } from "@/data/seed";
import { useNavigate } from "react-router-dom";
import { computeProjectCost, projectDeptMatrix, chargeOutVariance, UNALLOCATED_ID } from "@/lib/reports/projectCost";
import { projectCostByPeriod, projectEac } from "@/lib/reports/projectTrend";
import { downloadNodeAsPdf } from "@/lib/reportPdf";
import { HelpHint } from "@/components/HelpHint";
import { BarChart3, Plus, Trash2, Download, Info, FileDown, Printer, CheckCircle2, Lightbulb, Save, TrendingUp, FlaskConical } from "lucide-react";

/** 規劃試算沙盒提示：明示「不寫回薪資」（除非另行核定），避免誤把規劃數字當實際。 */
function SandboxNotice({ applyHint = false }: { applyHint?: boolean }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-info/30 bg-info/10 p-2.5 text-xs text-info print:hidden">
      <FlaskConical className="mt-0.5 size-4 shrink-0" />
      <p>
        <span className="font-medium">規劃試算沙盒</span>
        ：以下為情境模擬，<span className="font-medium">不會寫回實際薪資</span>。
        {applyHint ? "如需採用，請於下方「核定並套用」明確寫回並留稽核軌跡。" : "可任意調整參數比較，不影響月結。"}
      </p>
    </div>
  );
}

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
              {g.title}{g.tag && <span className={cn("ml-1 rounded px-1 py-0.5 text-[9px]", g.tag === "例行" ? "bg-success/15 text-success" : "bg-info/15 text-info")}>{g.tag}</span>}
            </p>
            <TabPills tabs={g.tabs.map((k) => ({ key: k, label: TAB_LABEL[k] }))} value={tab} onChange={(k) => setTab(k as typeof tab)} />
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

  const exportCsv = () => csvDownload(
    ["員工編號", "姓名", "部門", "本薪", "加給/津貼", "加班費", "獎金", "其他加項", "雇主負擔", "雇主總成本"],
    rows.map((r) => { const c = comp(r); return [r.employeeId, r.name, r.department, c.base, c.allowance, c.ot, c.bonus, c.other, c.burden, r.employerTotalCost]; }),
    `成本結構_${period}.csv`,
  );

  return (
    <div className="space-y-4">
      <InsightList insights={insights} />
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="人事總成本（含雇主負擔）" value={`${ntd(totalCost)} 元`} />
        <Stat label="平均每人成本" value={`${ntd(rows.length ? totalCost / rows.length : 0)} 元`} />
        <Stat label="中位每人成本" value={`${ntd(median)} 元`} />
        <Stat label="人數" value={`${rows.length} 人`} />
      </div>

      <ChartCard title="人事成本組成（全公司）" legend={SEGS.map((s) => ({ label: s.label, color: s.color }))}>
        <StackedBar rows={[{ label: "全公司", segments: SEGS.map((s) => ({ label: s.label, value: totals[s.key], color: s.color })) }]} />
        <p className="text-xs text-muted-foreground">
          獎金/變動占比過高或加班費偏大，常是結構檢討重點；雇主負擔約為投保金額×費率×負擔比例。
        </p>
      </ChartCard>

      <ChartCard title="部門別成本組成" description="點任一部門列，下方展開該部門逐人成本明細。" legend={SEGS.map((s) => ({ label: s.label, color: s.color }))}>
        <StackedBar
          rows={[...deptMap.entries()].map(([d, t]) => ({ label: d, segments: SEGS.map((s) => ({ label: s.label, value: t[s.key], color: s.color })) }))}
          onSelectRow={(d) => { setSelDept((cur) => (cur === d ? null : d)); setSelEmp(null); }}
          selectedRow={selDept}
        />
      </ChartCard>

      {selDept && (
        <DetailPanel title={`部門明細：${selDept}`} onClose={() => setSelDept(null)}>
          <DataTable
            rows={rows.filter((r) => (r.department || "（未填）") === selDept)}
            getRowKey={(r) => r.employeeId}
            searchPlaceholder="搜尋員工…"
            columns={[
              { key: "name", header: "員工", freeze: true, sortValue: (r) => r.name, filterText: (r) => r.name, cell: (r) => r.name },
              ...SEGS.map((s) => ({ key: s.key, header: s.label, numeric: true, sortValue: (r: PayrollRow) => comp(r)[s.key], cell: (r: PayrollRow) => ntd(comp(r)[s.key]), total: (rs: PayrollRow[]) => ntd(rs.reduce((a, r) => a + comp(r)[s.key], 0)) })),
              { key: "total", header: "總成本", numeric: true, sortValue: (r) => r.employerTotalCost, cell: (r) => <span className="font-medium">{ntd(r.employerTotalCost)}</span>, total: (rs) => <span className="font-bold">{ntd(rs.reduce((a, r) => a + r.employerTotalCost, 0))}</span> },
            ]}
          />
        </DetailPanel>
      )}

      <ChartCard
        title="員工成本 Pareto（集中度 80/20）"
        description="少數高成本人力佔總成本比例，評估關鍵人力與集中風險。點任一長條看該員成本組成。"
        toolbar={<Button variant="outline" size="sm" onClick={exportCsv}><Download /> 匯出 CSV</Button>}
      >
        <Pareto data={rows.map((r) => ({ label: r.name, value: r.employerTotalCost, id: r.employeeId }))} onSelect={(it) => { setSelEmp((cur) => (cur === it.id ? null : it.id ?? null)); setSelDept(null); }} />
      </ChartCard>

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

  const exportCsv = () => csvDownload(
    ["員工編號", "姓名", "部門", "年資(月)", "月薪資總額", "實發", "雇主總成本"],
    rows.map((r) => [r.employeeId, r.name, r.department, r.seniorityMonths, r.salaryTotal, r.netPay, r.employerTotalCost]),
    `分布與公平_${period}.csv`,
  );

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
        <ChartCard
          title="月薪資總額分布（直方圖）"
          description="點任一桶，看落在該薪資區間的員工。"
          toolbar={<Button variant="outline" size="sm" onClick={exportCsv}><Download /> 匯出 CSV</Button>}
        >
          <BarChart data={hist.map((b) => ({ label: `${ntd(b.start)}–${ntd(b.end)}`, value: b.count }))} valueFmt={(n) => `${n} 人`} showValues color={PALETTE[0]} selectedIndex={selBin} onSelect={(_, i) => { setSelBin((cur) => (cur === i ? null : i)); setSelDept(null); setSelEmp(null); }} />
        </ChartCard>
        <ChartCard title="Lorenz 曲線（薪資不均）" description={`曲線越偏離對角線，分配越不均（對應 Gini ${g.toFixed(3)}）。`}>
          <LineChart points={lorenz} diagonal />
        </ChartCard>
      </div>

      {selBin !== null && hist[selBin] && (
        <DetailPanel title={`薪資區間 ${ntd(Math.round(hist[selBin].start))} ～ ${ntd(Math.round(hist[selBin].end))} 的員工`} onClose={() => setSelBin(null)}>
          <EmployeeMiniTable rows={rows.filter((r) => r.salaryTotal >= hist[selBin].start && (selBin === hist.length - 1 ? r.salaryTotal <= hist[selBin].end : r.salaryTotal < hist[selBin].end))} />
        </DetailPanel>
      )}

      <ChartCard title="部門薪資中位數比較" description="點任一部門長條，看該部門員工薪資。">
        <BarChart data={deptMedian} color={PALETTE[1]} selectedIndex={selDept ? deptMedian.findIndex((d) => d.label === selDept) : null} onSelect={(it) => { setSelDept((cur) => (cur === it.label ? null : it.label)); setSelBin(null); setSelEmp(null); }} />
      </ChartCard>

      {selDept && (
        <DetailPanel title={`部門明細：${selDept}`} onClose={() => setSelDept(null)}>
          <EmployeeMiniTable rows={rows.filter((r) => (r.department || "（未填）") === selDept)} />
        </DetailPanel>
      )}

      <ChartCard title="薪資 vs 年資（薪資壓縮檢視）" description="年資高但薪資未相稱，可能為薪資壓縮（pay compression）。點任一點看該員。">
        <Scatter xLabel="年資(月)" yLabel="月薪"
          points={rows.map((r) => ({ x: r.seniorityMonths, y: r.salaryTotal, id: r.employeeId, label: `${r.name}：年資 ${r.seniorityMonths} 月、${ntd(r.salaryTotal)}` }))}
          onSelect={(p) => { setSelEmp((cur) => (cur === p.id ? null : p.id ?? null)); setSelBin(null); setSelDept(null); }} />
      </ChartCard>

      {selEmp && (() => {
        const r = rows.find((x) => x.employeeId === selEmp);
        return r ? <DetailPanel title={`員工明細：${r.name}`} onClose={() => setSelEmp(null)}><EmployeeMiniTable rows={[r]} /></DetailPanel> : null;
      })()}
    </div>
  );
}

/** 共用：員工薪資小表（鑽取明細用） */
function EmployeeMiniTable({ rows }: { rows: PayrollRow[] }) {
  return (
    <DataTable
      rows={rows}
      getRowKey={(r) => r.employeeId}
      searchable={rows.length > 8}
      searchPlaceholder="搜尋員工／部門…"
      empty={{ title: "此範圍沒有員工" }}
      columns={[
        { key: "name", header: "員工", freeze: true, sortValue: (r) => r.name, filterText: (r) => `${r.name} ${r.department}`, cell: (r) => r.name },
        { key: "dept", header: "部門", sortValue: (r) => r.department, cell: (r) => <span className="text-sm">{r.department}</span> },
        { key: "sen", header: "年資(月)", numeric: true, sortValue: (r) => r.seniorityMonths, cell: (r) => r.seniorityMonths },
        { key: "salary", header: "月薪資總額", numeric: true, sortValue: (r) => r.salaryTotal, cell: (r) => ntd(r.salaryTotal) },
        { key: "net", header: "實發", numeric: true, sortValue: (r) => r.netPay, cell: (r) => ntd(r.netPay) },
        { key: "cost", header: "雇主總成本", numeric: true, sortValue: (r) => r.employerTotalCost, cell: (r) => ntd(r.employerTotalCost) },
      ]}
    />
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
        <div className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 p-2.5 text-xs text-warning">
          <Info className="mt-0.5 size-4 shrink-0" />未設定薪資級距，compa-ratio／區間滲透率顯示「—」。請先新增級距並指派員工。
        </div>
      )}

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">員工級距指派與 compa-ratio</CardTitle></CardHeader>
        <CardContent>
          <DataTable
            rows={basis}
            getRowKey={(b) => b.employeeId}
            searchPlaceholder="搜尋員工／部門…"
            columns={[
              { key: "name", header: "員工", freeze: true, sortValue: (b) => b.name, filterText: (b) => `${b.name} ${b.department}`, cell: (b) => b.name },
              { key: "dept", header: "部門", sortValue: (b) => b.department, cell: (b) => <span className="text-sm">{b.department}</span> },
              { key: "base", header: "月薪", numeric: true, sortValue: (b) => b.base, cell: (b) => ntd(b.base) },
              { key: "grade", header: "級距", sortValue: (b) => b.grade?.name ?? "", cell: (b) => (
                <Select value={b.grade?.id ?? NONE} onValueChange={(v) => setEmployeeGrade(b.employeeId, v === NONE ? null : v)}>
                  <SelectTrigger className="h-8 w-32 col-input"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>未指派</SelectItem>
                    {grades.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) },
              { key: "compa", header: "compa-ratio", numeric: true, sortValue: (b) => b.compaRatio ?? -1, cell: (b) => (b.compaRatio == null ? "—" : ratioPct(b.compaRatio)) },
              { key: "mcompa", header: "市場 compa", numeric: true, sortValue: (b) => b.marketCompaRatio ?? -1, cell: (b) => <span className={cn(b.marketCompaRatio != null && b.marketCompaRatio < 0.9 && "text-warning font-medium")}>{b.marketCompaRatio == null ? "—" : ratioPct(b.marketCompaRatio)}</span> },
              { key: "pen", header: "區間滲透率", numeric: true, sortValue: (b) => b.rangePenetration ?? -1, cell: (b) => (b.rangePenetration == null ? "—" : pctOf(b.rangePenetration, 0)) },
            ]}
          />
        </CardContent>
      </Card>

      {hasGrades && (
        <ChartCard title="部門 × 級距 compa-ratio 熱圖" description="綠＝接近中位(1.0)，藍＝偏低、紅＝偏高。">
          <Heatmap rowLabels={depts} colLabels={grades.map((g) => g.name)} cells={cells} fmt={(n) => ratioPct(n)} />
        </ChartCard>
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
      <SandboxNotice />
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
          <DataTable
            rows={result.rows}
            getRowKey={(r) => r.employeeId}
            searchPlaceholder="搜尋員工／部門…"
            columns={[
              { key: "name", header: "員工", freeze: true, sortValue: (r) => r.name, filterText: (r) => `${r.name} ${r.department}`, cell: (r) => r.name },
              { key: "dept", header: "部門", sortValue: (r) => r.department, cell: (r) => <span className="text-sm">{r.department}</span> },
              { key: "rating", header: "績效", sortValue: (r) => r.ratingKey, cell: (r) => (
                <Select value={r.ratingKey} onValueChange={(v) => setEmployeeRating(r.employeeId, v)}>
                  <SelectTrigger className="h-8 w-24 col-input"><SelectValue /></SelectTrigger>
                  <SelectContent>{analytics.ratingTiers.map((t) => <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              ) },
              { key: "base", header: "月薪", numeric: true, sortValue: (r) => r.base, cell: (r) => ntd(r.base) },
              { key: "bonus", header: "試算獎金", numeric: true, sortValue: (r) => r.bonus, cell: (r) => <span className="font-medium">{ntd(r.bonus)}</span>, total: () => <span className="font-bold">{ntd(result.totalBonus)}</span> },
              { key: "supp", header: "二代健保", numeric: true, sortValue: (r) => r.supplementary, cell: (r) => <span className="text-muted-foreground">{ntd(r.supplementary)}</span>, total: () => ntd(result.totalSupplementary) },
            ]}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="試算獎金分布" description="點任一長條看該員試算細項。">
          <BarChart data={result.rows.map((r) => ({ label: r.name, value: r.bonus, id: r.employeeId }))} color={PALETTE[3]} selectedIndex={selEmp ? result.rows.findIndex((r) => r.employeeId === selEmp) : null} onSelect={(it) => setSelEmp((cur) => (cur === it.id ? null : it.id ?? null))} />
        </ChartCard>
        <ChartCard title="績效係數 vs 試算獎金" description="檢視 pay-for-performance 對齊度。點任一點看該員。">
          <Scatter xLabel="績效係數" yLabel="獎金" color={PALETTE[3]} points={result.rows.map((r) => ({ x: r.coefficient, y: r.bonus, id: r.employeeId, label: `${r.name}：${r.ratingKey}、${ntd(r.bonus)}` }))} onSelect={(p) => setSelEmp((cur) => (cur === p.id ? null : p.id ?? null))} />
        </ChartCard>
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
  const { analytics, parameters, brackets, setRaiseScenario, applyRaise, scheduleRaises, currentPeriod, confirmations } = usePayrollStore();
  const rs = analytics.raiseScenario;
  const result: RaiseSimResult = simulateRaise(rows, analytics, parameters, brackets);
  const quarterly = rs.cadence === "quarterly";
  const [applyOpen, setApplyOpen] = useState(false);
  const [effectivePeriod, setEffectivePeriod] = useState(() => addMonths(currentPeriod, 1)); // 預設下月生效
  const [applyMsg, setApplyMsg] = useState<string | null>(null);
  const navigate = useNavigate();
  const changedRows = result.rows.filter((r) => r.monthlyIncrease !== 0);
  const note = `${RAISE_LABEL[rs.method]}・平均 ${result.avgRaisePct.toFixed(1)}%`;
  const doApply = () => {
    if (effectivePeriod <= currentPeriod) {
      // 當期（或過往）生效 → 立即寫回；硬鎖定時擋下
      if (confirmations[currentPeriod]) {
        alert(`本月（${currentPeriod}）已確認結算，無法立即寫回調薪。\n請改選未來生效月份（存為排程），或先取消本月確認。`);
        return;
      }
      applyRaise(changedRows.map((r) => ({ employeeId: r.employeeId, newSalary: r.newSalary })), note);
      setApplyMsg(`已將 ${changedRows.length} 人的調薪寫回薪資結構（差額套在本薪）。`);
    } else {
      // 未來月份 → 存為排程，到期由「工作台」套用
      scheduleRaises(changedRows.map((r) => ({
        employeeId: r.employeeId, name: r.name, newSalary: r.newSalary,
        effectivePeriod, note, decidedAt: new Date().toISOString(),
      })));
      setApplyMsg(`已排程 ${changedRows.length} 人的調薪，自 ${effectivePeriod} 生效；到期後可在「工作台」一鍵套用。`);
    }
    setApplyOpen(false);
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
      <SandboxNotice applyHint />
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-info/30 bg-info/10 p-2.5 text-sm">
        <span className="text-info">要對「單位或全公司」批次調整薪資結構、加津貼或發區間補貼？用主檔的「批次薪資」作業。</span>
        <Button variant="outline" size="sm" onClick={() => navigate("/master?tab=batch")}>前往批次薪資</Button>
      </div>
      {applyMsg && (
        <div className="flex items-center justify-between gap-2 rounded-md border border-success/30 bg-success/10 p-2.5 text-sm text-success">
          <span className="flex items-center gap-2"><CheckCircle2 className="size-4 shrink-0" />{applyMsg}</span>
          <span className="flex shrink-0 gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/master")}>前往基本資料查看</Button>
            <Button variant="ghost" size="sm" onClick={() => setApplyMsg(null)}>關閉</Button>
          </span>
        </div>
      )}
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
          <DataTable
            rows={result.rows}
            getRowKey={(r) => r.employeeId}
            searchPlaceholder="搜尋員工…"
            columns={[
              { key: "name", header: "員工", freeze: true, sortValue: (r) => r.name, filterText: (r) => `${r.name} ${r.ratingKey}`, cell: (r) => r.name },
              { key: "rating", header: "績效", sortValue: (r) => r.ratingKey, cell: (r) => <Badge variant="outline">{r.ratingKey}</Badge> },
              { key: "cur", header: "現職月薪", numeric: true, sortValue: (r) => r.currentSalary, cell: (r) => ntd(r.currentSalary) },
              { key: "pct", header: "調幅%", numeric: true, sortValue: (r) => r.raisePct, cell: (r) => `${r.raisePct.toFixed(1)}%` },
              { key: "new", header: "調後月薪", numeric: true, sortValue: (r) => r.newSalary, cell: (r) => <span className="font-medium">{ntd(r.newSalary)}</span> },
              { key: "inc", header: "月增額", numeric: true, sortValue: (r) => r.monthlyIncrease, cell: (r) => ntd(r.monthlyIncrease), total: () => <span className="font-bold">{ntd(result.totalMonthlyIncrease)}</span> },
              { key: "edelta", header: "Δ雇主負擔", numeric: true, sortValue: (r) => r.employerDelta, cell: (r) => <span className="text-muted-foreground">{ntd(r.employerDelta)}</span> },
              { key: "annual", header: "年化成本增額", numeric: true, sortValue: (r) => r.annualizedCostDelta, cell: (r) => ntd(r.annualizedCostDelta), total: () => <span className="font-bold">{ntd(result.totalAnnualizedCostDelta)}</span> },
              { key: "compa", header: "調後compa", numeric: true, sortValue: (r) => r.newCompaRatio ?? -1, cell: (r) => (r.newCompaRatio == null ? "—" : ratioPct(r.newCompaRatio)) },
            ]}
          />
        </CardContent>
      </Card>

      <ChartCard title="平均調幅% by 績效" description="點任一評等，看該評等員工的逐人調薪。">
        <BarChart data={raiseByRating} valueFmt={(n) => `${n.toFixed(1)}%`} color={PALETTE[2]} selectedIndex={selRating ? raiseByRating.findIndex((d) => d.label === selRating) : null} onSelect={(it) => setSelRating((cur) => (cur === it.label ? null : it.label))} />
      </ChartCard>

      {selRating && (
        <DetailPanel title={`評等 ${selRating} 的逐人調薪`} onClose={() => setSelRating(null)}>
          <DataTable
            rows={result.rows.filter((r) => r.ratingKey === selRating)}
            getRowKey={(r) => r.employeeId}
            searchable={false}
            columns={[
              { key: "name", header: "員工", freeze: true, sortValue: (r) => r.name, cell: (r) => r.name },
              { key: "cur", header: "現職月薪", numeric: true, sortValue: (r) => r.currentSalary, cell: (r) => ntd(r.currentSalary) },
              { key: "pct", header: "調幅%", numeric: true, sortValue: (r) => r.raisePct, cell: (r) => `${r.raisePct.toFixed(1)}%` },
              { key: "new", header: "調後月薪", numeric: true, sortValue: (r) => r.newSalary, cell: (r) => ntd(r.newSalary) },
              { key: "inc", header: "月增額", numeric: true, sortValue: (r) => r.monthlyIncrease, cell: (r) => ntd(r.monthlyIncrease) },
              { key: "ann", header: "年化成本增額", numeric: true, sortValue: (r) => r.annualizedCostDelta, cell: (r) => ntd(r.annualizedCostDelta) },
            ]}
          />
        </DetailPanel>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">分配方法並排比較</CardTitle>
          <CardDescription>用目前的預算/調幅設定，把四種分配法跑一遍並列；同樣花費下，哪種更公平、是否在預算內，一眼比較。目前選用：<Badge variant="outline">{compare.find((c) => c.method === rs.method)?.label}</Badge></CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            rows={compare}
            getRowKey={(c) => c.method}
            searchable={false}
            rowClassName={(c) => cn(c.method === rs.method && "bg-accent/50")}
            columns={[
              { key: "label", header: "分配法", sortValue: (c) => c.label, cell: (c) => (<>{c.label}{c.method === rs.method && <Badge variant="outline" className="ml-1.5 text-[10px]">目前</Badge>}</>) },
              { key: "mi", header: "月增額合計", numeric: true, sortValue: (c) => c.totalMonthlyIncrease, cell: (c) => ntd(c.totalMonthlyIncrease) },
              { key: "ac", header: "年化成本增額", numeric: true, sortValue: (c) => c.totalAnnualizedCostDelta, cell: (c) => ntd(c.totalAnnualizedCostDelta) },
              { key: "avg", header: "平均調幅", numeric: true, sortValue: (c) => c.avgRaisePct, cell: (c) => `${c.avgRaisePct.toFixed(1)}%` },
              { key: "gini", header: "調後 Gini", numeric: true, sortValue: (c) => c.giniAfter, cell: (c) => <span className={cn(c.giniAfter === bestFair && "font-bold text-success")}>{c.giniAfter.toFixed(3)}</span> },
              ...(rs.targetBudget > 0 ? [{ key: "var", header: "預算差異", numeric: true, sortValue: (c: (typeof compare)[number]) => c.variance, cell: (c: (typeof compare)[number]) => <Delta value={c.variance} goodWhen="negative" posLabel="超 " negLabel="餘 " /> }] : []),
            ]}
          />
          <p className="mt-2 text-xs text-muted-foreground">綠色＝四法中調後最公平（Gini 最低）。一致調幅與按本薪不看績效；按績效/merit matrix 會向高績效（與級距偏低者）傾斜。切換上方「分配方法」即可套用。</p>
        </CardContent>
      </Card>

      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>核定並套用調薪方案</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 p-2.5 text-xs text-warning">
              <Info className="mt-0.5 size-4 shrink-0" />
              此操作會把 {changedRows.length} 人的調後月薪<strong>寫回薪資結構（差額套在本薪）</strong>，並留下稽核紀錄。
              生效月份為<strong>未來月份</strong>時先存為排程，到期後於「工作台」一鍵套用；為當月時立即寫回。
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <Field label="生效月份" help={effectivePeriod <= currentPeriod ? "＝當月：確認後立即寫回薪資結構" : `未來月份：先存排程，${effectivePeriod} 到期後套用`}>
                <Input type="month" className="h-9 w-40 col-input" min={currentPeriod} value={effectivePeriod}
                  onChange={(e) => e.target.value && setEffectivePeriod(e.target.value)} />
              </Field>
              <Badge variant={effectivePeriod <= currentPeriod ? "warning" : "secondary"}>
                {effectivePeriod <= currentPeriod ? "立即寫回" : `排程・${effectivePeriod} 生效`}
              </Badge>
            </div>
            <DataTable
              rows={changedRows}
              getRowKey={(r) => r.employeeId}
              maxHeight="max-h-[50vh]"
              searchable={changedRows.length > 8}
              searchPlaceholder="搜尋員工…"
              columns={[
                { key: "name", header: "員工", freeze: true, sortValue: (r) => r.name, filterText: (r) => r.name, cell: (r) => r.name },
                { key: "cur", header: "現職月薪", numeric: true, sortValue: (r) => r.currentSalary, cell: (r) => ntd(r.currentSalary) },
                { key: "new", header: "調後月薪", numeric: true, sortValue: (r) => r.newSalary, cell: (r) => <span className="font-medium">{ntd(r.newSalary)}</span> },
                { key: "pct", header: "調幅", numeric: true, sortValue: (r) => r.raisePct, cell: (r) => `${r.raisePct.toFixed(1)}%` },
              ]}
            />
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

      <ChartCard
        title="各專案成本組成"
        description="每位員工全載成本依工時分攤；合計＝全公司總成本（勾稽）。"
        toolbar={<Button variant="outline" size="sm" onClick={exportCsv}><Download /> 匯出 CSV</Button>}
        legend={SEGS.map((s) => ({ label: s.label, color: s.color }))}
      >
        <StackedBar rows={shown.map((p) => ({ label: p.name, segments: SEGS.map((s) => ({ label: s.label, value: p[s.key], color: s.color })) }))} />
      </ChartCard>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">逐專案明細（含預算 vs 實際）</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            rows={shown}
            getRowKey={(p) => p.projectId}
            initialSort={{ key: "cost", dir: "desc" }}
            searchable={false}
            rowClassName={(p) => cn(p.projectId === UNALLOCATED_ID && "text-muted-foreground")}
            columns={[
              { key: "name", header: "專案", sortValue: (p) => p.name, cell: (p) => p.name },
              { key: "hours", header: "工時", numeric: true, sortValue: (p) => p.hours, cell: (p) => p.hours || "—", total: () => result.totalDirectHours || "—" },
              { key: "fte", header: "FTE", numeric: true, sortValue: (p) => p.fte, cell: (p) => (p.hours ? p.fte.toFixed(2) : "—") },
              { key: "cost", header: "總成本", numeric: true, sortValue: (p) => p.totalCost, cell: (p) => <span className="font-medium">{ntd(p.totalCost)}</span>, total: () => <span className="font-bold">{ntd(result.companyTotal)}</span> },
              { key: "pct", header: "占比", numeric: true, sortValue: (p) => p.pctOfCompany, cell: (p) => pctOf(p.pctOfCompany), total: () => "100%" },
              { key: "budget", header: "期間預算", numeric: true, sortValue: (p) => p.budget, cell: (p) => (p.budget ? ntd(p.budget) : "—") },
              { key: "var", header: "差異", numeric: true, sortValue: (p) => p.variance, cell: (p) => (p.budget ? <Delta value={p.variance} posLabel="餘 " negLabel="超 " /> : "—") },
            ]}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="成本集中度（Pareto 80/20）">
          <Pareto data={shown.filter((p) => p.projectId !== UNALLOCATED_ID).map((p) => ({ label: p.name, value: p.totalCost }))} />
        </ChartCard>
        <ChartCard title="預算 vs 實際" contentClassName="space-y-3">
          {shown.filter((p) => p.budget > 0).length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">尚未設定專案預算（系統設定 → 專案主檔）。</p>
          ) : shown.filter((p) => p.budget > 0).map((p) => (
            <Bullet key={p.projectId} label={p.name} value={p.totalCost} target={p.budget} />
          ))}
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="專案 × 部門成本矩陣" description="各專案人事成本由哪些部門投入；每列加總＝該專案總成本。">
          <Heatmap rowLabels={matrix.rowLabels} colLabels={matrix.colLabels} cells={matrix.cells} domain={[0, maxCell]} fmt={(n) => ntd(n)} />
        </ChartCard>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">標準工率差異（charge-out）</CardTitle>
            <CardDescription>標準工率＝全載成本÷標準工時；應計＝工率×投入工時。差異為負＝投入工時少於標準（吸收不足）。</CardDescription>
          </CardHeader>
          <CardContent>
            {charge.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">尚無可比較的專案工時。</p>
            ) : (
              <DataTable
                rows={charge}
                getRowKey={(c) => c.projectId}
                searchable={false}
                initialSort={{ key: "variance", dir: "asc" }}
                columns={[
                  { key: "name", header: "專案", sortValue: (c) => c.name, cell: (c) => c.name },
                  { key: "std", header: "應計(標準)", numeric: true, sortValue: (c) => c.standard, cell: (c) => ntd(c.standard), total: (rs) => ntd(rs.reduce((a, c) => a + c.standard, 0)) },
                  { key: "act", header: "實際", numeric: true, sortValue: (c) => c.actual, cell: (c) => ntd(c.actual), total: (rs) => ntd(rs.reduce((a, c) => a + c.actual, 0)) },
                  { key: "var", header: "差異", numeric: true, sortValue: (c) => c.variance, cell: (c) => <Delta value={c.variance} />, total: (rs) => <Delta value={rs.reduce((a, c) => a + c.variance, 0)} /> },
                ]}
              />
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
          <DataTable
            rows={eac}
            getRowKey={(e) => e.projectId}
            searchable={false}
            initialSort={{ key: "ac", dir: "desc" }}
            columns={[
              { key: "name", header: "專案", sortValue: (e) => e.name, cell: (e) => e.name },
              { key: "ac", header: "累計實際", numeric: true, sortValue: (e) => e.ac, cell: (e) => ntd(e.ac), total: (rs) => <span className="font-bold">{ntd(rs.reduce((a, e) => a + e.ac, 0))}</span> },
              { key: "burn", header: "燃燒率/月", numeric: true, sortValue: (e) => e.burnRate, cell: (e) => ntd(e.burnRate) },
              { key: "eacb", header: "EAC(燃燒率)", numeric: true, sortValue: (e) => e.runRateEac, cell: (e) => (e.budget ? ntd(e.runRateEac) : "—"), total: (rs) => ntd(rs.reduce((a, e) => a + (e.budget ? e.runRateEac : 0), 0)) },
              { key: "eacevm", header: "EAC(EVM)", numeric: true, sortValue: (e) => e.eacEvm ?? -1, cell: (e) => (e.eacEvm != null ? ntd(e.eacEvm) : "—") },
              { key: "vfin", header: "完工差異", numeric: true, sortValue: (e) => e.varianceRunRate, cell: (e) => (e.budget ? <Delta value={e.varianceRunRate} posLabel="餘 " negLabel="超 " /> : "—") },
              { key: "cons", header: "%消耗", numeric: true, sortValue: (e) => e.pctConsumed, cell: (e) => (e.budget ? pct(e.pctConsumed) : "—") },
            ]}
          />
          <p className="text-xs text-muted-foreground">EAC(燃燒率)＝月均×專案總月數；EAC(EVM)＝預算÷CPI（需填「%完成」）。完工差異＝預算−EAC(燃燒率)。</p>
        </CardContent>
      </Card>
    );
  }
}

/* ───────── 趨勢與預算 ───────── */
function TrendTab({ rows }: { rows: PayrollRow[] }) {
  const { snapshots, saveSnapshot, removeSnapshot, currentPeriod, events, analytics, parameterVersions, bracketVersions, setPlanning, loadDemoData, employees, salaries, dependents, leavePolicy, subsidies, fxPolicy, fxRates } = usePayrollStore();
  const parameters = resolveSettingVersion(parameterVersions, currentPeriod, DEFAULT_PARAMETERS);
  const brackets = resolveSettingVersion(bracketVersions, currentPeriod, DEFAULT_BRACKETS);

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
  // 逐期重算須「與 live 計薪路徑同款輸入」，否則估算月與已確認月不一致：
  // 除逐期解析參數/級距外，也要帶 leavePolicy／subsidies／外幣（fxPolicy/fxRates），
  // 讓破月、區間補貼、外幣台幣約當在重算月一致（比照 selectors.usePayrollRowsFor）。
  const recompute = (p: string) =>
    buildSnapshot(buildPayrollRows(p, { employees, salaries, dependents, events, parameters: resolveSettingVersion(parameterVersions, p, DEFAULT_PARAMETERS), brackets: resolveSettingVersion(bracketVersions, p, DEFAULT_BRACKETS), leavePolicy, subsidies, fxPolicy, fxRates }), p, events.filter((e) => e.period === p).reduce((a, e) => a + e.monthlyBonus, 0));
  const aMonths = annualMonths(year, currentPeriod, snapshots, candidatePeriods, recompute);
  const aTot = annualTotals(aMonths);
  const estimatedCount = aMonths.filter((m) => m.estimated).length;
  const sim = simulateAnnual(year, currentPeriod, currentMonthlyCost, snapshots);

  const exportAnnualCsv = () => csvDownload(
    ["期間", "人數", "月薪資總額", "中位薪資", "總成本", "加班費", "獎金", "估算"],
    aMonths.map((m) => [m.period, m.snapshot.headcount, m.snapshot.totalSalary, m.snapshot.medianSalary, m.snapshot.totalCost, m.snapshot.overtimePay, m.snapshot.bonusTotal, m.estimated ? "是" : ""]),
    `年度累計_${year}.csv`,
  );

  return (
    <div className="space-y-4">
      {/* 年報：當年累計與全年推估 */}
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-2 pb-2">
          <div>
            <CardTitle className="text-base">{year} 年累計與全年推估</CardTitle>
            <CardDescription>
              「實際累計」為當年各月已確認月結快照之加總（缺快照月份以目前資料回推、標示估算）；
              「模擬全年」＝當年已實際 ＋ 剩餘月以本月 run-rate 外推。
              {estimatedCount > 0 && <span className="text-warning">　含 {estimatedCount} 個估算月份（建議於各月結算後確認以留存快照）。</span>}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" className="shrink-0 print:hidden" disabled={aMonths.length === 0} onClick={exportAnnualCsv}>
            <Download /> 匯出 CSV
          </Button>
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
                  <TrendChart data={sorted.map((s) => ({ label: s.period, value: Number(s.gini.toFixed(3)) }))} color={PALETTE[3]} valueFmt={(n) => n.toFixed(3)} zeroBased={false} selectedIndex={selIdx} onSelect={(it) => togglePeriod(it.label)} />
                </div>
              </div>
              <DataTable
                rows={sorted}
                getRowKey={(s) => s.period}
                searchable={false}
                initialSort={{ key: "period", dir: "desc" }}
                csv={{
                  headers: ["期間", "人數", "月薪資總額", "中位薪資", "總成本", "加班費", "獎金", "Gini"],
                  row: (s) => [s.period, s.headcount, s.totalSalary, s.medianSalary, s.totalCost, s.overtimePay, s.bonusTotal, s.gini.toFixed(3)],
                  fileName: `薪酬趨勢快照_${currentPeriod}.csv`,
                }}
                rowClassName={(s) => cn(selPeriod === s.period && "bg-accent/60")}
                onRowClick={(s) => togglePeriod(s.period)}
                columns={[
                  { key: "period", header: "期間", sortValue: (s) => s.period, cell: (s) => <span className="font-medium">{s.period}</span> },
                  { key: "hc", header: "人數", numeric: true, sortValue: (s) => s.headcount, cell: (s) => s.headcount },
                  { key: "tsal", header: "月薪資總額", numeric: true, sortValue: (s) => s.totalSalary, cell: (s) => ntd(s.totalSalary) },
                  { key: "med", header: "中位薪資", numeric: true, sortValue: (s) => s.medianSalary, cell: (s) => ntd(s.medianSalary) },
                  { key: "cost", header: "總成本", numeric: true, sortValue: (s) => s.totalCost, cell: (s) => ntd(s.totalCost) },
                  { key: "ot", header: "加班費", numeric: true, sortValue: (s) => s.overtimePay, cell: (s) => ntd(s.overtimePay) },
                  { key: "bonus", header: "獎金", numeric: true, sortValue: (s) => s.bonusTotal, cell: (s) => ntd(s.bonusTotal) },
                  { key: "gini", header: "Gini", numeric: true, sortValue: (s) => s.gini, cell: (s) => s.gini.toFixed(3) },
                  { key: "del", header: "", headerClassName: "w-10", cell: (s) => <Button variant="ghost" size="icon" className="size-7 text-destructive" onClick={(e) => { e.stopPropagation(); removeSnapshot(s.period); }}><Trash2 className="size-3.5" /></Button> },
                ]}
              />
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
      reading: "以 100% 為基準（剛好在級距中位）。落在 90%～110% 算健康；低於 90% 代表偏低、留才風險高，可優先調薪；高於 110% 代表已偏高、再調空間有限，宜改用獎金激勵。",
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
      reading: "以 100% 為市場中位。低於 90% 代表明顯落後同業、挖角風險高；90%～110% 與市場相當；高於 110% 領先市場、留才有利但成本較高。需先在級距填入『市場中位』才會顯示。",
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
const INSIGHT_VARIANT: Record<Insight["level"], { variant: CalloutVariant; tag: string }> = {
  good: { variant: "success", tag: "良好" },
  info: { variant: "info", tag: "提醒" },
  warn: { variant: "warning", tag: "需注意" },
};

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
          const s = INSIGHT_VARIANT[it.level];
          return (
            <Callout key={i} variant={s.variant} tag={s.tag} title={it.title}>
              {it.detail}
              {it.evidence && <p className="mt-1 text-[11px] text-muted-foreground/80">佐證：{it.evidence}</p>}
            </Callout>
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
function Field({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      {children}
      {help && <p className="text-[11px] leading-snug text-muted-foreground">{help}</p>}
    </div>
  );
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
