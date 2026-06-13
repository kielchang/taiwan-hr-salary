import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { usePayrollStore, blankEvent } from "@/store/usePayrollStore";
import { usePayrollRows, useCompanySupplementary, type PayrollRow } from "@/store/selectors";
import { cn, ntd, formatPeriod } from "@/lib/utils";
import { downloadEncryptedPayslip } from "@/lib/payslipPdf";
import { buildPayslipMailto } from "@/lib/payslipEmail";
import { Printer, Wand2, Lock, Mail, AlertTriangle } from "lucide-react";

type Tab = "summary" | "tax" | "payslip";

export function ReportsView() {
  const [tab, setTab] = useState<Tab>("summary");
  const { currentPeriod, confirmations } = usePayrollStore();
  const confirmed = Boolean(confirmations[currentPeriod]);

  return (
    <div className="space-y-4">
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

  const dims: { key: keyof Pick<PayrollRow, "department" | "costCenter" | "project">; title: string }[] = [
    { key: "department", title: "部門別" },
    { key: "costCenter", title: "成本中心別" },
    { key: "project", title: "專案別" },
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
        return (
          <Card key={dim.key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{dim.title}人事成本</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>名稱</TableHead>
                    <TableHead className="text-right">人數</TableHead>
                    <TableHead className="text-right">應發合計</TableHead>
                    <TableHead className="text-right">其中加班費</TableHead>
                    <TableHead className="text-right">其中獎金</TableHead>
                    <TableHead className="text-right">實發金額</TableHead>
                    <TableHead className="text-right">公司負擔保費</TableHead>
                    <TableHead className="text-right">公司總成本</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...map.entries()].map(([name, g]) => (
                    <TableRow key={name}>
                      <TableCell>{name}</TableCell>
                      <TableCell className="text-right tabular-nums">{g.count}</TableCell>
                      <TableCell className="text-right tabular-nums">{ntd(g.gross)}</TableCell>
                      <TableCell className="text-right tabular-nums">{ntd(g.ot)}</TableCell>
                      <TableCell className="text-right tabular-nums">{ntd(g.bonus)}</TableCell>
                      <TableCell className="text-right tabular-nums">{ntd(g.net)}</TableCell>
                      <TableCell className="text-right tabular-nums">{ntd(g.burden)}</TableCell>
                      <TableCell className="text-right tabular-nums">{ntd(g.cost)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell>合計</TableCell>
                    <TableCell className="text-right tabular-nums">{grand.count}</TableCell>
                    <TableCell className="text-right tabular-nums">{ntd(grand.gross)}</TableCell>
                    <TableCell className="text-right tabular-nums">{ntd(grand.ot)}</TableCell>
                    <TableCell className="text-right tabular-nums">{ntd(grand.bonus)}</TableCell>
                    <TableCell className="text-right tabular-nums">{ntd(grand.net)}</TableCell>
                    <TableCell className="text-right tabular-nums">{ntd(grand.burden)}</TableCell>
                    <TableCell className="text-right tabular-nums">{ntd(grand.cost)}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>
        );
      })}
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

/* ---------- 所得稅扣繳 ---------- */

function TaxReport() {
  const { employees, events, currentPeriod, upsertEvent } = usePayrollStore();
  const rows = usePayrollRows();

  const getEvent = (id: string) =>
    events.find((e) => e.employeeId === id && e.period === currentPeriod) ?? blankEvent(id, currentPeriod);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">本月代扣所得稅清單</CardTitle>
        <CardDescription>
          代扣稅款須於次月 10 日前繳庫。「建議金額」由系統計算；實際代扣以「已填金額」為準，
          可按「帶入」採用建議值，或於「薪資結算」逐人修改。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>員工</TableHead>
              <TableHead>身分／方式</TableHead>
              <TableHead className="text-right">扶養人數</TableHead>
              <TableHead className="text-right">本月應稅薪資（估）</TableHead>
              <TableHead className="text-right">起扣點（估）</TableHead>
              <TableHead className="text-right">建議金額</TableHead>
              <TableHead className="text-right">已填金額</TableHead>
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

  const r = rows.find((x) => x.employeeId === selected);
  const emp = employees.find((e) => e.id === selected);

  if (!r || !emp) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">尚無員工資料。</CardContent>
      </Card>
    );
  }

  const monthlyBonus = r.grossPay - r.salaryTotal - r.overtimePay;
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
      </div>

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

      <Card ref={slipRef} className="bg-card">
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle>薪資明細表</CardTitle>
            <Badge variant="outline">{formatPeriod(currentPeriod)}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <Info label="員工編號" value={emp.id} />
            <Info label="姓名" value={emp.name} />
            <Info label="部門" value={emp.department || "—"} />
            <Info label="職稱" value={emp.title || "—"} />
            <Info label="年資" value={`${Math.floor(r.seniorityMonths / 12)} 年 ${r.seniorityMonths % 12} 個月`} />
            <Info label="本年特休" value={`${r.annualLeaveDays} 天`} />
            <Info label="健保投保金額" value={ntd(r.insured.health)} />
            <Info label="勞退自提率" value={`${Math.round(emp.voluntaryPensionRate * 100)}%`} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Section
              title="應發項目"
              rows={[["固定薪資合計", r.salaryTotal], ["加班費", r.overtimePay], ["獎金與其他加項", monthlyBonus]]}
              total={["應發合計", r.grossPay]}
              totalClass="text-emerald-700"
            />
            <Section
              title="代扣項目"
              rows={[
                ["請假扣款", r.leaveDeduction],
                ["勞保費", r.premiums.laborEmployee],
                ["健保費（含眷屬）", r.premiums.healthEmployee],
                ["勞退自願提繳", r.premiums.pensionVoluntary],
                ["二代健保補充保費", r.personalSupplementary],
                ["代扣所得稅", r.withheldTax],
              ]}
              total={["代扣合計", r.totalDeductions]}
              totalClass="text-rose-700"
            />
          </div>

          <div className="flex items-center justify-between rounded-md border-2 border-primary/20 bg-primary/5 p-4">
            <span className="text-lg font-semibold">實發金額</span>
            <span className="text-2xl font-bold tabular-nums">{ntd(r.netPay)} 元</span>
          </div>

          <div className="rounded-md border p-3 text-sm">
            <p className="mb-2 font-medium text-muted-foreground">公司另行負擔（不從薪資扣除）</p>
            <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
              <Info label="勞保費" value={ntd(r.premiums.laborEmployer)} />
              <Info label="職災保險費" value={ntd(r.premiums.occupationalEmployer)} />
              <Info label="健保費" value={ntd(r.premiums.healthEmployer)} />
              <Info label="勞退提繳 6%" value={ntd(r.premiums.pensionEmployer)} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="font-medium tabular-nums">{value}</p>
    </div>
  );
}

function Section({
  title, rows, total, totalClass,
}: {
  title: string; rows: [string, number][]; total: [string, number]; totalClass?: string;
}) {
  return (
    <div className="rounded-md border">
      <div className="border-b bg-muted/40 px-3 py-2 text-sm font-medium">{title}</div>
      <div className="divide-y">
        {rows.map(([label, v]) => (
          <div key={label} className="flex justify-between px-3 py-1.5 text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="tabular-nums">{ntd(v)}</span>
          </div>
        ))}
        <div className={`flex justify-between px-3 py-2 text-sm font-semibold ${totalClass ?? ""}`}>
          <span>{total[0]}</span>
          <span className="tabular-nums">{ntd(total[1])}</span>
        </div>
      </div>
    </div>
  );
}
