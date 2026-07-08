// 月結報表（ReportsHub 的 monthly 群組）。設計原理：
//  - 三分頁：薪資條（可逐張列印/批次匯出加密 PDF，身分證為開啟密碼）、匯總（部門/成本中心/
//    專案）、代扣所得稅。資料沿用當期 selectors 結算列，與畫面數字一致。
//  - 列印靠 @media print＋PrintHeader/頁尾版號；批次 PDF/ZIP 以動態 import 延遲載入 jspdf。
import { useState, useRef, createElement } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Delta } from "@/components/ui/delta";
import { EmptyState } from "@/components/ui/empty-state";
import { PrintHeader } from "@/components/PrintHeader";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { usePayrollStore, blankEvent } from "@/store/usePayrollStore";
import { usePayrollRows, useCompanySupplementary, type PayrollRow } from "@/store/selectors";
import { cn, ntd, pctOf, formatPeriod } from "@/lib/utils";
import { downloadEncryptedPayslip } from "@/lib/payslipPdf";
import { buildPayslipMailto } from "@/lib/payslipEmail";
import { computeProjectCost, UNALLOCATED_ID } from "@/lib/reports/projectCost";
import { PayslipCard } from "@/views/PayslipCard";
import { Printer, Wand2, Lock, Mail, AlertTriangle, Package, CheckCircle2, FileText, Users } from "lucide-react";

export type ReportsTab = "summary" | "tax" | "payslip";
type Tab = ReportsTab;

export function ReportsView({ initialTab }: { initialTab?: ReportsTab } = {}) {
  const [tab, setTab] = useState<Tab>(initialTab ?? "summary");
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

/** 部門/成本中心匯總表：可排序、含占比欄與合計列、斑馬紋＋黏性表頭（通用 DataTable）。 */
function GroupTable({ title, entries, grand }: { title: string; entries: GroupAgg[]; grand: Omit<GroupAgg, "name"> }) {
  const money = (key: string, header: string, get: (g: GroupAgg) => number): Column<GroupAgg> =>
    ({ key, header, numeric: true, sortValue: get, cell: (g) => ntd(get(g)), total: (rs) => ntd(rs.reduce((a, g) => a + get(g), 0)) });
  const columns: Column<GroupAgg>[] = [
    { key: "name", header: "名稱", sortValue: (g) => g.name, filterText: (g) => g.name, cell: (g) => g.name },
    { key: "count", header: "人數", numeric: true, sortValue: (g) => g.count, cell: (g) => g.count, total: (rs) => rs.reduce((a, g) => a + g.count, 0) },
    money("gross", "應發合計", (g) => g.gross),
    money("ot", "其中加班費", (g) => g.ot),
    money("bonus", "其中獎金", (g) => g.bonus),
    money("net", "實發金額", (g) => g.net),
    money("burden", "公司負擔保費", (g) => g.burden),
    money("cost", "公司總成本", (g) => g.cost),
    { key: "pct", header: "占比", numeric: true, sortValue: (g) => g.cost, cell: (g) => <span className="text-muted-foreground">{grand.cost ? pctOf(g.cost / grand.cost) : "—"}</span>, total: () => "100%" },
  ];
  return (
    <Card className="print-block">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}人事成本</CardTitle>
        <CardDescription>點欄頭可排序（預設依公司總成本由大到小）。</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable rows={entries} columns={columns} getRowKey={(g) => g.name} initialSort={{ key: "cost", dir: "desc" }} searchable={false} />
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
  const totVariance = shown.reduce((a, p) => a + (p.budget > 0 ? p.variance : 0), 0);
  type P = (typeof shown)[number];
  const grossOf = (p: P) => p.base + p.allowance + p.ot + p.bonus + p.other;
  const columns: Column<P>[] = [
    { key: "name", header: "專案", sortValue: (p) => p.name, filterText: (p) => p.name, cell: (p) => p.name },
    { key: "hours", header: "投入工時", numeric: true, sortValue: (p) => p.hours, cell: (p) => (p.hours ? ntd(p.hours) : "—"), total: () => (result.totalDirectHours ? ntd(result.totalDirectHours) : "—") },
    { key: "fte", header: "FTE", numeric: true, sortValue: (p) => p.fte, cell: (p) => (p.hours ? p.fte.toFixed(2) : "—") },
    { key: "gross", header: "應發小計", numeric: true, sortValue: grossOf, cell: (p) => ntd(grossOf(p)) },
    { key: "burden", header: "雇主負擔", numeric: true, sortValue: (p) => p.burden, cell: (p) => ntd(p.burden) },
    { key: "cost", header: "總成本", numeric: true, sortValue: (p) => p.totalCost, cell: (p) => <span className="font-medium">{ntd(p.totalCost)}</span>, total: () => <span className="font-bold">{ntd(result.companyTotal)}</span> },
    { key: "pct", header: "占比", numeric: true, sortValue: (p) => p.pctOfCompany, cell: (p) => pctOf(p.pctOfCompany), total: () => "100%" },
    { key: "budget", header: "期間預算", numeric: true, sortValue: (p) => p.budget, cell: (p) => (p.budget ? ntd(p.budget) : "—") },
    { key: "variance", header: "差異", numeric: true, sortValue: (p) => p.variance, cell: (p) => (p.budget ? <Delta value={p.variance} posLabel="餘 " negLabel="超 " /> : "—"), total: () => <Delta value={totVariance} posLabel="餘 " negLabel="超 " /> },
  ];

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
        <DataTable
          rows={shown}
          columns={columns}
          getRowKey={(p) => p.projectId}
          initialSort={{ key: "cost", dir: "desc" }}
          searchable={false}
          rowClassName={(p) => cn(p.projectId === UNALLOCATED_ID && "text-muted-foreground")}
        />
      </CardContent>
    </Card>
  );
}

/* ---------- 所得稅扣繳 ---------- */

function TaxReport() {
  const { employees, events, currentPeriod, upsertEvent, confirmations } = usePayrollStore();
  const locked = Boolean(confirmations[currentPeriod]); // 硬鎖定：已確認月份不可再帶入
  const navigate = useNavigate();
  const rows = usePayrollRows();

  const getEvent = (id: string) =>
    events.find((e) => e.employeeId === id && e.period === currentPeriod) ?? blankEvent(id, currentPeriod);

  if (rows.length === 0) {
    return <Card><CardContent><EmptyState icon={<FileText className="size-7" />} title="本月尚無可代扣的薪資資料" hint="完成「每月薪資作業」後，這裡會列出每位員工的建議與實際代扣稅額。" /></CardContent></Card>;
  }

  type T = { r: PayrollRow; method: string; ev: ReturnType<typeof getEvent>; sug: PayrollRow["withholdingSuggestion"] };
  const taxRows: T[] = rows.map((r) => {
    const emp = employees.find((e) => e.id === r.employeeId)!;
    return { r, method: emp.taxResidency === "非居住者" ? "非居住者 6%/18%" : emp.withholdingMethod, ev: getEvent(r.employeeId), sug: r.withholdingSuggestion };
  });
  const columns: Column<T>[] = [
    { key: "emp", header: "員工", freeze: true, sortValue: (t) => t.r.name, filterText: (t) => t.r.name, cell: (t) => t.r.name },
    { key: "method", header: "身分／方式", sortValue: (t) => t.method, filterText: (t) => t.method, cell: (t) => <span className="text-sm">{t.method}</span> },
    { key: "deps", header: "扶養人數", numeric: true, sortValue: (t) => t.r.dependents.taxDependents, cell: (t) => t.r.dependents.taxDependents },
    { key: "taxable", header: "本月應稅薪資（估）", numeric: true, sortValue: (t) => t.r.taxableSalary, cell: (t) => ntd(t.r.taxableSalary) },
    { key: "threshold", header: "起扣點（估）", numeric: true, sortValue: (t) => t.r.estimatedTaxThreshold ?? -1, cell: (t) => (t.r.estimatedTaxThreshold === null ? "—" : ntd(t.r.estimatedTaxThreshold)) },
    { key: "suggest", header: "建議金額", numeric: true, sortValue: (t) => (t.sug.type === "auto" ? t.sug.amount : Number.MAX_SAFE_INTEGER), cell: (t) => (t.sug.type === "auto" ? ntd(t.sug.amount) : <Badge variant="warning">請查官方稅額表</Badge>) },
    { key: "filled", header: "已填金額", numeric: true, sortValue: (t) => t.ev.withheldTax ?? -1, cell: (t) => (t.ev.withheldTax === null ? <span className="text-muted-foreground">未填</span> : <span className="font-medium">{ntd(t.ev.withheldTax)}</span>), total: (rs) => <span className="font-bold">{ntd(rs.reduce((a, t) => a + t.r.withheldTax, 0))}</span> },
    { key: "ops", header: "", headerClassName: "w-28 print:hidden", cellClassName: "print:hidden", cell: (t) => {
      const { sug, ev } = t;
      if (sug.type === "auto") {
        if (ev.withheldTax === sug.amount) return null;
        return <Button variant="outline" size="sm" className="h-7" disabled={locked} title={locked ? "本月已確認鎖定" : undefined} onClick={() => upsertEvent({ ...ev, withheldTax: sug.amount })}><Wand2 className="size-3.5" /> 帶入</Button>;
      }
      // 查表類：直接跳到該員的結算對話框填入（免手動搜尋）
      return <Button variant="outline" size="sm" className="h-7" disabled={locked} title={locked ? "本月已確認鎖定" : "查官方稅額表後至結算填入"} onClick={() => navigate(`/payroll/monthly?emp=${t.r.employeeId}`)}>前往填寫</Button>;
    } },
  ];

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
        <DataTable
          rows={taxRows}
          columns={columns}
          getRowKey={(t) => t.r.employeeId}
          searchPlaceholder="搜尋員工…"
          toolbar={(() => {
            const pendingAuto = taxRows.filter((t) => t.sug.type === "auto" && t.ev.withheldTax !== (t.sug.type === "auto" ? t.sug.amount : null));
            return (
              <Button
                variant="outline" size="sm" disabled={locked || pendingAuto.length === 0}
                title={locked ? "本月已確認鎖定" : undefined}
                onClick={() => {
                  if (!confirm(`將 ${pendingAuto.length} 名員工的「建議金額」一次帶入「已填金額」？（查表類不受影響）`)) return;
                  pendingAuto.forEach((t) => { if (t.sug.type === "auto") upsertEvent({ ...t.ev, withheldTax: t.sug.amount }); });
                }}
              >
                <Wand2 /> 全部帶入建議值{pendingAuto.length > 0 ? `（${pendingAuto.length}）` : ""}
              </Button>
            );
          })()}
          csv={{
            headers: ["員工編號", "姓名", "身分／方式", "扶養人數", "應稅薪資(估)", "起扣點(估)", "建議金額", "已填金額"],
            row: (t) => [t.r.employeeId, t.r.name, t.method, t.r.dependents.taxDependents, t.r.taxableSalary, t.r.estimatedTaxThreshold ?? "", t.sug.type === "auto" ? t.sug.amount : "查表", t.ev.withheldTax ?? ""],
            fileName: `代扣所得稅清單_${currentPeriod}.csv`,
          }}
        />
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
        <div className="flex items-start gap-2 rounded-md border border-success/30 bg-success/10 p-2.5 text-xs text-success print:hidden">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          <p>{batchMsg}</p>
        </div>
      )}

      {(!hasId || !hasEmail || pdfError) && (
        <div className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 p-2.5 text-xs text-warning print:hidden">
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
