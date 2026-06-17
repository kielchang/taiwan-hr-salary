import { useState, useRef, createElement } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter, NumHead, NumCell, SortHead } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Delta } from "@/components/ui/delta";
import { EmptyState } from "@/components/ui/empty-state";
import { PrintHeader } from "@/components/PrintHeader";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { usePayrollStore, blankEvent } from "@/store/usePayrollStore";
import { usePayrollRows, useCompanySupplementary, type PayrollRow } from "@/store/selectors";
import { cn, ntd, pctOf, formatPeriod } from "@/lib/utils";
import { useSort } from "@/lib/useSort";
import { downloadEncryptedPayslip } from "@/lib/payslipPdf";
import { buildPayslipMailto } from "@/lib/payslipEmail";
import { computeProjectCost, UNALLOCATED_ID } from "@/lib/reports/projectCost";
import { PayslipCard } from "@/views/PayslipCard";
import { Printer, Wand2, Lock, Mail, AlertTriangle, Package, CheckCircle2, FileText, Users } from "lucide-react";

type Tab = "summary" | "tax" | "payslip";

export function ReportsView() {
  const [tab, setTab] = useState<Tab>("summary");
  const { currentPeriod, confirmations } = usePayrollStore();
  const confirmed = Boolean(confirmations[currentPeriod]);

  return (
    <div className="space-y-4">
      <PrintHeader title="月結報表" period={currentPeriod} />
      <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
        <div>
          <h2 className="text-base font-semibold">報表與薪資條</h2>
          <p className="text-sm text-muted-foreground">{formatPeriod(currentPeriod)} 的產出文件。</p>
        </div>
        {!confirmed && <Badge variant="warning">本月尚未在「結算查核」確認，以下為暫定數字</Badge>}
      </div>

      <div className="flex gap-1 print:hidden">
        {(
          [
            ["summary", "匯總報表"],
            ["tax", "所得稅扣繳"],
            ["payslip", "薪資條"],
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

      {tab === "summary" && <SummaryReport />}
      {tab === "tax" && <TaxReport />}
      {tab === "payslip" && <PayslipReport />}
    </div>
  );
}

/* ---------- 匯總報表 ---------- */

function SummaryReport() {
  const rows = usePayrollRows();
  const { events, currentPeriod } = usePayrollStore();
  const companySupp = useCompanySupplementary(rows);
  const bonusOf = (id: string) =>
    events.find((e) => e.employeeId === id && e.period === currentPeriod)?.monthlyBonus ?? 0;

  const dims: { key: keyof Pick<PayrollRow, "department" | "costCenter">; title: string }[] = [
    { key: "department", title: "部門別" },
    { key: "costCenter", title: "成本中心別" },
  ];

  const grand = rows.reduce(
    (a, r) => ({
      count: a.count + 1,
      gross: a.gross + r.grossPay,
      ot: a.ot + r.overtimePay,
      bonus: a.bonus + bonusOf(r.employeeId),
      net: a.net + r.netPay,
      burden: a.burden + r.employerBurden,
      cost: a.cost + r.employerTotalCost,
    }),
    { count: 0, gross: 0, ot: 0, bonus: 0, net: 0, burden: 0, cost: 0 },
  );

  if (rows.length === 0) {
    return <Card><CardContent><EmptyState icon={<Users className="size-7" />} title="本月尚無薪資資料" hint="請先到「每月薪資作業」建立當月員工與異動，匯總報表會自動帶出。" /></CardContent></Card>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end print:hidden">
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer /> 列印匯總報表
        </Button>
      </div>
      {dims.map((dim) => {
        const map = new Map<string, typeof grand>();
        for (const r of rows) {
          const name = (r[dim.key] as string) || "（未填寫）";
          const g = map.get(name) ?? { count: 0, gross: 0, ot: 0, bonus: 0, net: 0, burden: 0, cost: 0 };
          g.count++; g.gross += r.grossPay; g.ot += r.overtimePay; g.bonus += bonusOf(r.employeeId);
          g.net += r.netPay; g.burden += r.employerBurden; g.cost += r.employerTotalCost;
          map.set(name, g);
        }
        const entries = [...map.entries()].map(([name, g]) => ({ name, ...g }));
        return <GroupTable key={dim.key} title={dim.title} entries={entries} grand={grand} />;
      })}
      <ProjectPnL rows={rows} bonusOf={bonusOf} />
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
          <span>
            公司二代健保補充保費（概算，次月底前繳納）
            <span className="block text-xs text-muted-foreground">正式申報金額請依扣繳憑單之薪資總額核計</span>
          </span>
          <span className="text-base font-bold tabular-nums">{ntd(companySupp)} 元</span>
        </CardContent>
      </Card>
    </div>
  );
}

type GroupAgg = { name: string; count: number; gross: number; ot: number; bonus: number; net: number; burden: number; cost: number };

/** 部門/成本中心匯總表：可點欄頭排序、含占比欄與合計列、斑馬紋＋黏性表頭。 */
function GroupTable({ title, entries, grand }: { title: string; entries: GroupAgg[]; grand: Omit<GroupAgg, "name"> }) {
  const { sorted, sort, toggle } = useSort<GroupAgg>(
    entries,
    {
      name: (r) => r.name, count: (r) => r.count, gross: (r) => r.gross, ot: (r) => r.ot,
      bonus: (r) => r.bonus, net: (r) => r.net, burden: (r) => r.burden, cost: (r) => r.cost,
    },
    { key: "cost", dir: "desc" },
  );
  return (
    <Card className="print-block">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}人事成本</CardTitle>
        <CardDescription>點欄頭可排序（預設依公司總成本由大到小）。</CardDescription>
      </CardHeader>
      <CardContent>
        <Table zebra>
          <TableHeader sticky>
            <TableRow>
              <SortHead sortKey="name" sort={sort} onSort={toggle}>名稱</SortHead>
              <SortHead sortKey="count" sort={sort} onSort={toggle} numeric>人數</SortHead>
              <SortHead sortKey="gross" sort={sort} onSort={toggle} numeric>應發合計</SortHead>
              <SortHead sortKey="ot" sort={sort} onSort={toggle} numeric>其中加班費</SortHead>
              <SortHead sortKey="bonus" sort={sort} onSort={toggle} numeric>其中獎金</SortHead>
              <SortHead sortKey="net" sort={sort} onSort={toggle} numeric>實發金額</SortHead>
              <SortHead sortKey="burden" sort={sort} onSort={toggle} numeric>公司負擔保費</SortHead>
              <SortHead sortKey="cost" sort={sort} onSort={toggle} numeric>公司總成本</SortHead>
              <NumHead>占比</NumHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((g) => (
              <TableRow key={g.name}>
                <TableCell>{g.name}</TableCell>
                <NumCell>{g.count}</NumCell>
                <NumCell>{ntd(g.gross)}</NumCell>
                <NumCell>{ntd(g.ot)}</NumCell>
                <NumCell>{ntd(g.bonus)}</NumCell>
                <NumCell>{ntd(g.net)}</NumCell>
                <NumCell>{ntd(g.burden)}</NumCell>
                <NumCell>{ntd(g.cost)}</NumCell>
                <NumCell className="text-muted-foreground">{grand.cost ? pctOf(g.cost / grand.cost) : "—"}</NumCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell>合計</TableCell>
              <NumCell>{grand.count}</NumCell>
              <NumCell>{ntd(grand.gross)}</NumCell>
              <NumCell>{ntd(grand.ot)}</NumCell>
              <NumCell>{ntd(grand.bonus)}</NumCell>
              <NumCell>{ntd(grand.net)}</NumCell>
              <NumCell>{ntd(grand.burden)}</NumCell>
              <NumCell>{ntd(grand.cost)}</NumCell>
              <NumCell>100%</NumCell>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
}

/* 專案別人事成本（依工時/百分比分攤的 P&L） */
function ProjectPnL({ rows, bonusOf }: { rows: PayrollRow[]; bonusOf: (id: string) => number }) {
  const { salaries, events, projects, allocations, parameters, currentPeriod, employees } = usePayrollStore();
  const baseByEmp = new Map(salaries.map((s) => [s.employeeId, s.baseSalary]));
  const bonusByEmp = new Map(rows.map((r) => [r.employeeId, bonusOf(r.employeeId)]));
  const otherByEmp = new Map(rows.map((r) => [r.employeeId, events.find((e) => e.employeeId === r.employeeId && e.period === currentPeriod)?.otherAddition ?? 0]));
  const codeToId = new Map(projects.map((p) => [p.code, p.id]));
  const defaultProjectByEmp = new Map(
    employees.filter((e) => e.project && codeToId.has(e.project)).map((e) => [e.id, codeToId.get(e.project) as string]),
  );
  const result = computeProjectCost({
    rows, allocations, projects, period: currentPeriod, monthlyWorkHours: parameters.monthlyWorkHours,
    baseByEmp, bonusByEmp, otherByEmp, defaultProjectByEmp,
  });
  const shown = result.projects.filter((p) => p.totalCost > 0 || p.budget > 0);
  const totBudget = shown.reduce((a, p) => a + p.budget, 0);
  const totVariance = shown.reduce((a, p) => a + (p.budget > 0 ? p.variance : 0), 0);

  return (
    <Card className="print-block">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">專案別人事成本（依工時分攤）</CardTitle>
        <CardDescription>
          每位員工的全載成本（含雇主負擔）依當月各專案投入工時/百分比分攤；未投入專案的工時歸「未分攤／間接」。
          合計等於全公司總成本（{ntd(result.companyTotal)} 元）。稼動率 {pctOf(result.utilization, 0)}。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader sticky>
            <TableRow>
              <TableHead>專案</TableHead>
              <NumHead>投入工時</NumHead>
              <NumHead>FTE</NumHead>
              <NumHead>應發小計</NumHead>
              <NumHead>雇主負擔</NumHead>
              <NumHead>總成本</NumHead>
              <NumHead>占比</NumHead>
              <NumHead>期間預算</NumHead>
              <NumHead>差異</NumHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.map((p) => {
              const gross = p.base + p.allowance + p.ot + p.bonus + p.other;
              const isBucket = p.projectId === UNALLOCATED_ID;
              return (
                <TableRow key={p.projectId} className={cn(isBucket && "text-muted-foreground")}>
                  <TableCell>{p.name}</TableCell>
                  <NumCell>{p.hours ? ntd(p.hours) : "—"}</NumCell>
                  <NumCell>{p.hours ? p.fte.toFixed(2) : "—"}</NumCell>
                  <NumCell>{ntd(gross)}</NumCell>
                  <NumCell>{ntd(p.burden)}</NumCell>
                  <NumCell className="font-medium">{ntd(p.totalCost)}</NumCell>
                  <NumCell>{pctOf(p.pctOfCompany)}</NumCell>
                  <NumCell>{p.budget ? ntd(p.budget) : "—"}</NumCell>
                  <NumCell>{p.budget ? <Delta value={p.variance} posLabel="餘 " negLabel="超 " /> : "—"}</NumCell>
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell>合計</TableCell>
              <NumCell>{result.totalDirectHours ? ntd(result.totalDirectHours) : "—"}</NumCell>
              <TableCell />
              <TableCell colSpan={2} />
              <NumCell className="font-bold">{ntd(result.companyTotal)}</NumCell>
              <NumCell>100%</NumCell>
              <NumCell>{totBudget ? ntd(totBudget) : "—"}</NumCell>
              <NumCell>{totBudget ? <Delta value={totVariance} posLabel="餘 " negLabel="超 " /> : "—"}</NumCell>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
}

/* ---------- 所得稅扣繳 ---------- */

function TaxReport() {
  const { employees, events, currentPeriod, upsertEvent } = usePayrollStore();
  const rows = usePayrollRows();

  const getEvent = (id: string) =>
    events.find((e) => e.employeeId === id && e.period === currentPeriod) ?? blankEvent(id, currentPeriod);

  if (rows.length === 0) {
    return <Card><CardContent><EmptyState icon={<FileText className="size-7" />} title="本月尚無可代扣的薪資資料" hint="完成「每月薪資作業」後，這裡會列出每位員工的建議與實際代扣稅額。" /></CardContent></Card>;
  }

  return (
    <Card className="print-block">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">本月代扣所得稅清單</CardTitle>
        <CardDescription>
          代扣稅款須於次月 10 日前繳庫。「建議金額」由系統計算；實際代扣以「已填金額」為準，
          可按「帶入」採用建議值，或於「薪資結算」逐人修改。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table zebra>
          <TableHeader sticky>
            <TableRow>
              <TableHead>員工</TableHead>
              <TableHead>身分／方式</TableHead>
              <NumHead>扶養人數</NumHead>
              <NumHead>本月應稅薪資（估）</NumHead>
              <NumHead>起扣點（估）</NumHead>
              <NumHead>建議金額</NumHead>
              <NumHead>已填金額</NumHead>
              <TableHead className="w-24 print:hidden"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => {
              const emp = employees.find((e) => e.id === r.employeeId)!;
              const ev = getEvent(r.employeeId);
              const sug = r.withholdingSuggestion;
              return (
                <TableRow key={r.employeeId}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="text-sm">
                    {emp.taxResidency === "非居住者" ? "非居住者 6%/18%" : emp.withholdingMethod}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{r.dependents.taxDependents}</TableCell>
                  <TableCell className="text-right tabular-nums">{ntd(r.taxableSalary)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {r.estimatedTaxThreshold === null ? "—" : ntd(r.estimatedTaxThreshold)}
                  </TableCell>
                  <TableCell className="text-right">
                    {sug.type === "auto" ? (
                      <span className="tabular-nums">{ntd(sug.amount)}</span>
                    ) : (
                      <Badge variant="warning">請查官方稅額表</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {ev.withheldTax === null ? <span className="text-muted-foreground">未填</span> : ntd(ev.withheldTax)}
                  </TableCell>
                  <TableCell className="print:hidden">
                    {sug.type === "auto" && ev.withheldTax !== sug.amount && (
                      <Button
                        variant="outline" size="sm" className="h-7"
                        onClick={() => upsertEvent({ ...ev, withheldTax: sug.amount })}
                      >
                        <Wand2 className="size-3.5" /> 帶入
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={6}>本月代扣所得稅合計</TableCell>
              <TableCell className="text-right font-bold tabular-nums">
                {ntd(rows.reduce((a, r) => a + r.withheldTax, 0))}
              </TableCell>
              <TableCell className="print:hidden" />
            </TableRow>
          </TableFooter>
        </Table>
        <p className="mt-3 text-xs text-muted-foreground">
          選「依扣繳稅額表」且達起扣點的員工，系統不代為猜測金額：請至財政部公告的「薪資所得扣繳稅額表」
          依扶養人數欄查出正確稅額後填入（起扣點為估算值，接近門檻時以官方表為準）。
        </p>
      </CardContent>
    </Card>
  );
}

/* ---------- 薪資條 ---------- */

function PayslipReport() {
  const { employees, currentPeriod } = usePayrollStore();
  const rows = usePayrollRows();
  const [selected, setSelected] = useState(employees[0]?.id ?? "");
  const slipRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchMsg, setBatchMsg] = useState<string | null>(null);

  const r = rows.find((x) => x.employeeId === selected);
  const emp = employees.find((e) => e.id === selected);

  if (!r || !emp) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">尚無員工資料。</CardContent>
      </Card>
    );
  }

  const hasId = emp.nationalId.trim().length > 0;
  const hasEmail = emp.email.trim().length > 0;

  const handleDownloadPdf = async () => {
    if (!slipRef.current || !hasId) return;
    setPdfError(null);
    setGenerating(true);
    try {
      await downloadEncryptedPayslip({
        node: slipRef.current,
        password: emp.nationalId.trim(),
        fileName: `${emp.name}_薪資明細_${currentPeriod}.pdf`,
      });
    } catch (e) {
      setPdfError(`PDF 產生失敗：${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleEmailDraft = () => {
    if (!hasEmail) return;
    window.location.href = buildPayslipMailto({ to: emp.email.trim(), name: emp.name, period: currentPeriod });
  };

  // 批次：逐人離屏渲染薪資條 → 各自加密 PDF → 打包 ZIP，並附寄送對照清單 CSV
  const handleBatch = async () => {
    setBatchMsg(null);
    setPdfError(null);
    setBatchRunning(true);
    const container = document.createElement("div");
    container.style.cssText = "position:fixed; left:-10000px; top:0; width:794px; background:#ffffff;";
    document.body.appendChild(container);
    try {
      const [{ default: JSZip }, { payslipPdfBlob, saveBlob }, { createRoot }] = await Promise.all([
        import("jszip"),
        import("@/lib/payslipPdf"),
        import("react-dom/client"),
      ]);
      const root = createRoot(container);
      const zip = new JSZip();
      const csv = ["員工編號,姓名,Email,檔名,PDF密碼"];
      const skipped: string[] = [];
      let made = 0;
      for (const e of employees) {
        const row = rows.find((x) => x.employeeId === e.id);
        if (!row) continue;
        if (!e.nationalId.trim()) {
          skipped.push(e.name);
          csv.push(`${e.id},${e.name},${e.email},,（缺身分證未產生）`);
          continue;
        }
        await new Promise<void>((res) => {
          root.render(createElement(PayslipCard, { emp: e, r: row, period: currentPeriod }));
          requestAnimationFrame(() => requestAnimationFrame(() => res()));
        });
        const node = container.firstElementChild as HTMLElement;
        const blob = await payslipPdfBlob(node, e.nationalId.trim());
        const fileName = `${e.name}_${e.id}_薪資明細_${currentPeriod}.pdf`;
        zip.file(fileName, blob);
        csv.push(`${e.id},${e.name},${e.email},${fileName},身分證字號`);
        made += 1;
      }
      root.unmount();
      zip.file(`寄送清單_${currentPeriod}.csv`, "\uFEFF" + csv.join("\r\n"));
      const out = await zip.generateAsync({ type: "blob" });
      saveBlob(out, `薪資明細_${currentPeriod}.zip`);
      setBatchMsg(
        `已產生 ${made} 份加密 PDF 並打包下載（含寄送清單）` +
          (skipped.length ? `；${skipped.length} 人因缺身分證未產生：${skipped.join("、")}` : ""),
      );
    } catch (e) {
      setPdfError(`批次產生失敗：${e instanceof Error ? e.message : String(e)}`);
    } finally {
      container.remove();
      setBatchRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <Select value={selected} onValueChange={setSelected}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            {employees.map((e) => (
              <SelectItem key={e.id} value={e.id}>{e.id} {e.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer /> 列印
        </Button>
        <Button size="sm" onClick={handleDownloadPdf} disabled={!hasId || generating}>
          <Lock /> {generating ? "產生中…" : "下載加密 PDF"}
        </Button>
        <Button variant="outline" size="sm" onClick={handleEmailDraft} disabled={!hasEmail}>
          <Mail /> Email 通知草稿
        </Button>
        <Button variant="secondary" size="sm" onClick={handleBatch} disabled={batchRunning}>
          <Package /> {batchRunning ? "批次產生中…" : "批次下載全部（ZIP）"}
        </Button>
      </div>

      {batchMsg && (
        <div className="flex items-start gap-2 rounded-md border border-emerald-300 bg-emerald-50 p-2.5 text-xs text-emerald-900 print:hidden">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          <p>{batchMsg}</p>
        </div>
      )}

      {(!hasId || !hasEmail || pdfError) && (
        <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-900 print:hidden">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <div className="space-y-0.5">
            {!hasId && <p>此員工尚未填「身分證字號」，無法產生加密 PDF（密碼即身分證字號）。請至「基本資料」補填。</p>}
            {!hasEmail && <p>此員工尚未填「Email」，無法開啟通知草稿。請至「基本資料」補填。</p>}
            {pdfError && <p>{pdfError}</p>}
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground print:hidden">
        加密 PDF 的開啟密碼為員工身分證字號（英文字母大寫）；email 採 mailto 草稿，附件請於郵件軟體手動夾帶剛下載的 PDF。
      </p>

      <PayslipCard ref={slipRef} emp={emp} r={r} period={currentPeriod} />
    </div>
  );
}
