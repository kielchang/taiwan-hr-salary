import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { usePayrollStore } from "@/store/usePayrollStore";
import { usePayrollRows, type PayrollRow } from "@/store/selectors";
import { saveBlob } from "@/lib/payslipPdf";
import { cn, ntd, pct } from "@/lib/utils";
import {
  percentileSet, coefficientOfVariation, gini, lorenzPoints, histogram,
  buildBasis, simulateBonusPool, simulateRaise, type BonusSimResult, type RaiseSimResult,
} from "@/lib/analytics";
import { StackedBar, Legend, BarChart, LineChart, Pareto, Scatter, Bullet, Heatmap, PALETTE } from "@/components/charts";
import { BarChart3, Plus, Trash2, Download, Info } from "lucide-react";

type Tab = "cost" | "dist" | "grade" | "bonus" | "raise" | "glossary";
const TABS: [Tab, string][] = [
  ["cost", "成本結構"], ["dist", "分布與公平"], ["grade", "級距與 compa-ratio"],
  ["bonus", "獎金／分紅試算"], ["raise", "年度／季度調薪試算"], ["glossary", "指標說明"],
];

function csvDownload(headers: string[], rows: (string | number)[][], fileName: string) {
  const cell = (v: string | number) => { const s = String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const text = "﻿" + [headers, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
  saveBlob(new Blob([text], { type: "text/csv;charset=utf-8" }), fileName);
}

export function AnalyticsView() {
  const [tab, setTab] = useState<Tab>("cost");
  const rows = usePayrollRows();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-lg font-bold"><BarChart3 className="size-5 text-primary" /> 薪酬分析</h1>
        <p className="text-sm text-muted-foreground">
          以「自我檢討」角度分析薪資結構、獎金、分紅與績效換算，並做預算試算。僅讀取當期薪資資料；
          試算為規劃沙盒，<strong>不會寫回薪資結算</strong>。
        </p>
      </div>

      <div className="flex flex-wrap gap-1">
        {TABS.map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            className={cn("rounded-md px-3 py-1.5 text-sm", tab === k ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-accent")}>
            {label}
          </button>
        ))}
      </div>

      {rows.length === 0 && tab !== "glossary" ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
          尚無薪資資料。請先到「基本資料」建立員工與薪資結構，並於「每月薪資作業」確認當期。
        </CardContent></Card>
      ) : (
        <>
          {tab === "cost" && <CostTab rows={rows} />}
          {tab === "dist" && <DistTab rows={rows} />}
          {tab === "grade" && <GradeTab rows={rows} />}
          {tab === "bonus" && <BonusTab rows={rows} />}
          {tab === "raise" && <RaiseTab rows={rows} />}
          {tab === "glossary" && <GlossaryTab />}
        </>
      )}
    </div>
  );
}

/* ───────── 成本結構 ───────── */
function CostTab({ rows }: { rows: PayrollRow[] }) {
  const { salaries, events, currentPeriod } = usePayrollStore();
  const baseOf = (id: string) => salaries.find((s) => s.employeeId === id)?.baseSalary ?? 0;
  const bonusOf = (id: string) => events.find((e) => e.employeeId === id && e.period === currentPeriod)?.monthlyBonus ?? 0;
  const otherOf = (id: string) => events.find((e) => e.employeeId === id && e.period === currentPeriod)?.otherAddition ?? 0;

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

  return (
    <div className="space-y-4">
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
        <CardHeader className="pb-2"><CardTitle className="text-base">部門別成本組成</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <StackedBar rows={[...deptMap.entries()].map(([d, t]) => ({ label: d, segments: SEGS.map((s) => ({ label: s.label, value: t[s.key], color: s.color })) }))} />
          <Legend items={SEGS.map((s) => ({ label: s.label, color: s.color }))} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">員工成本 Pareto（集中度 80/20）</CardTitle>
          <CardDescription>少數高成本人力佔總成本比例，評估關鍵人力與集中風險。</CardDescription>
        </CardHeader>
        <CardContent><Pareto data={rows.map((r) => ({ label: r.name, value: r.employerTotalCost }))} /></CardContent>
      </Card>
    </div>
  );
}

/* ───────── 分布與公平 ───────── */
function DistTab({ rows }: { rows: PayrollRow[] }) {
  const { events, currentPeriod } = usePayrollStore();
  const pays = rows.map((r) => r.salaryTotal);
  const ps = percentileSet(pays);
  const cv = coefficientOfVariation(pays);
  const g = gini(pays);
  const lorenz = lorenzPoints(pays);
  const hist = histogram(pays, 8);
  const sumBase = pays.reduce((a, b) => a + b, 0);
  const sumBonus = rows.reduce((a, r) => a + (events.find((e) => e.employeeId === r.employeeId && e.period === currentPeriod)?.monthlyBonus ?? 0), 0);
  const sumVariable = sumBonus + rows.reduce((a, r) => a + r.overtimePay, 0);
  const sumGross = rows.reduce((a, r) => a + r.grossPay, 0);

  // 部門中位數
  const deptMap = new Map<string, number[]>();
  rows.forEach((r) => { const d = r.department || "（未填）"; deptMap.set(d, [...(deptMap.get(d) ?? []), r.salaryTotal]); });
  const deptMedian = [...deptMap.entries()].map(([d, arr]) => {
    const s = [...arr].sort((a, b) => a - b);
    return { label: d, value: s[Math.floor((s.length - 1) / 2)] ?? 0 };
  });

  return (
    <div className="space-y-4">
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
          <CardHeader className="pb-2"><CardTitle className="text-base">月薪資總額分布（直方圖）</CardTitle></CardHeader>
          <CardContent><BarChart data={hist.map((b) => ({ label: ntd(b.start), value: b.count }))} valueFmt={(n) => `${n} 人`} color={PALETTE[0]} /></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Lorenz 曲線（薪資不均）</CardTitle>
            <CardDescription>曲線越偏離對角線，分配越不均（對應 Gini {g.toFixed(3)}）。</CardDescription>
          </CardHeader>
          <CardContent><LineChart points={lorenz} diagonal /></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">部門薪資中位數比較</CardTitle></CardHeader>
        <CardContent><BarChart data={deptMedian} color={PALETTE[1]} /></CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">薪資 vs 年資（薪資壓縮檢視）</CardTitle>
          <CardDescription>年資高但薪資未相稱，可能為薪資壓縮（pay compression）。</CardDescription>
        </CardHeader>
        <CardContent>
          <Scatter xLabel="年資(月)" yLabel="月薪" points={rows.map((r) => ({ x: r.seniorityMonths, y: r.salaryTotal, label: `${r.name}：年資 ${r.seniorityMonths} 月、${ntd(r.salaryTotal)}` }))} />
        </CardContent>
      </Card>
    </div>
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
  const patchGrade = (id: string, patch: Partial<{ name: string; min: number; mid: number; max: number }>) => {
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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base">薪資級距（min / 中位 / max）</CardTitle>
            <CardDescription>用於計算 compa-ratio 與區間滲透率；未設定時下方僅顯示內部分布。</CardDescription>
          </div>
          <Button size="sm" onClick={addGrade}><Plus /> 新增級距</Button>
        </CardHeader>
        <CardContent>
          {grades.length === 0 ? (
            <p className="text-sm text-muted-foreground">尚未建立級距。</p>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>名稱</TableHead><TableHead className="text-right">下限</TableHead><TableHead className="text-right">中位</TableHead><TableHead className="text-right">上限</TableHead><TableHead className="w-10" /></TableRow></TableHeader>
              <TableBody>
                {grades.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell><Input className="h-8 w-28 col-input" value={g.name} onChange={(e) => patchGrade(g.id, { name: e.target.value })} /></TableCell>
                    <TableCell className="text-right"><Input type="number" className="h-8 w-24 col-input text-right" value={g.min} onChange={(e) => patchGrade(g.id, { min: Number(e.target.value) || 0 })} /></TableCell>
                    <TableCell className="text-right"><Input type="number" className="h-8 w-24 col-input text-right" value={g.mid} onChange={(e) => patchGrade(g.id, { mid: Number(e.target.value) || 0 })} /></TableCell>
                    <TableCell className="text-right"><Input type="number" className="h-8 w-24 col-input text-right" value={g.max} onChange={(e) => patchGrade(g.id, { max: Number(e.target.value) || 0 })} /></TableCell>
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
            <TableHeader><TableRow><TableHead>員工</TableHead><TableHead>部門</TableHead><TableHead className="text-right">月薪</TableHead><TableHead>級距</TableHead><TableHead className="text-right">compa-ratio</TableHead><TableHead className="text-right">區間滲透率</TableHead></TableRow></TableHeader>
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

  const exportCsv = () => csvDownload(
    ["員工編號", "姓名", "部門", "月薪", "績效", "係數", "權重", "試算獎金", "二代健保概估"],
    result.rows.map((r) => [r.employeeId, r.name, r.department, r.base, r.ratingKey, r.coefficient, Math.round(r.weight), r.bonus, r.supplementary]),
    `獎金試算_${new Date().toISOString().slice(0, 10)}.csv`,
  );

  return (
    <div className="space-y-4">
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
          <CardHeader className="pb-2"><CardTitle className="text-base">試算獎金分布</CardTitle></CardHeader>
          <CardContent><BarChart data={result.rows.map((r) => ({ label: r.name, value: r.bonus }))} color={PALETTE[3]} /></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">績效係數 vs 試算獎金</CardTitle>
            <CardDescription>檢視 pay-for-performance 對齊度。</CardDescription>
          </CardHeader>
          <CardContent><Scatter xLabel="績效係數" yLabel="獎金" points={result.rows.map((r) => ({ x: r.coefficient, y: r.bonus, label: `${r.name}：${r.ratingKey}、${ntd(r.bonus)}` }))} /></CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ───────── 年度／季度調薪試算 ───────── */
function RaiseTab({ rows }: { rows: PayrollRow[] }) {
  const { analytics, parameters, brackets, setRaiseScenario } = usePayrollStore();
  const rs = analytics.raiseScenario;
  const result: RaiseSimResult = simulateRaise(rows, analytics, parameters, brackets);
  const quarterly = rs.cadence === "quarterly";

  // 調幅% by 績效
  const byRating = new Map<string, number[]>();
  result.rows.forEach((r) => byRating.set(r.ratingKey, [...(byRating.get(r.ratingKey) ?? []), r.raisePct]));
  const raiseByRating = [...byRating.entries()].map(([k, arr]) => ({ label: k, value: arr.reduce((a, b) => a + b, 0) / arr.length }));

  const exportCsv = () => csvDownload(
    ["員工編號", "姓名", "部門", "績效", "現職月薪", "調幅%", "調後月薪", "月增額", "Δ雇主負擔", "年化成本增額", "調後compa"],
    result.rows.map((r) => [r.employeeId, r.name, r.department, r.ratingKey, r.currentSalary, r.raisePct.toFixed(2), r.newSalary, r.monthlyIncrease, r.employerDelta, r.annualizedCostDelta, r.newCompaRatio == null ? "" : r.newCompaRatio.toFixed(2)]),
    `調薪試算_${new Date().toISOString().slice(0, 10)}.csv`,
  );

  return (
    <div className="space-y-4">
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
          <Button variant="outline" size="sm" onClick={exportCsv}><Download /> 匯出 CSV</Button>
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
        <CardHeader className="pb-2"><CardTitle className="text-base">平均調幅% by 績效</CardTitle></CardHeader>
        <CardContent><BarChart data={raiseByRating} valueFmt={(n) => `${n.toFixed(1)}%`} color={PALETTE[2]} /></CardContent>
      </Card>
    </div>
  );
}

/* ───────── 指標說明 ───────── */
function GlossaryTab() {
  const items: [string, string][] = [
    ["compa-ratio（薪酬比較比）", "實際薪資 ÷ 級距中位。1.0＝在中位；<0.9 偏低、>1.1 偏高，用於檢視市場/內部定位。"],
    ["range penetration（區間滲透率）", "(實薪 − 級距下限) ÷ (上限 − 下限)。看員工在級距內的進程位置（0%～100%）。"],
    ["百分位 P10–P90", "把全體薪資排序後的分位點，看整體水準與差距結構。"],
    ["變異係數 CV", "標準差 ÷ 平均。衡量薪資離散程度，越小越集中。"],
    ["Gini 係數 / Lorenz 曲線", "薪資不均度指標（0 完全平均、趨近 1 極不均）；Lorenz 曲線越偏離對角線越不均。"],
    ["獎金/本薪比、變動薪酬比", "獎金或（加班＋獎金）占比，評估薪酬中固定 vs 變動的結構。"],
    ["merit matrix（績效×級距）", "綜合績效評等與級距位置決定獎金/調幅：高績效且級距偏低者加碼，兼顧績效與內部公平。"],
    ["分配方法", "均分／按本薪比例／按績效係數／merit matrix；績效係數預設 S1.3、A1.1、B1.0、C0.8（可調）。"],
    ["年化成本增額", "調薪每月增額（含投保保費重算後的雇主負擔變化）×12，估算全年人事成本影響。"],
  ];
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">指標與分析方法說明</CardTitle>
        <CardDescription>借鑑業界薪酬分析常用指標（compa-ratio、merit matrix、利潤分享 pro-rata 等）。</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {items.map(([t, d]) => (
          <div key={t} className="rounded-md border p-3">
            <p className="text-sm font-medium">{t}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{d}</p>
          </div>
        ))}
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
