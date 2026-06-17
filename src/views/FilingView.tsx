import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter, NumHead, NumCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PrintHeader } from "@/components/PrintHeader";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { usePayrollStore } from "@/store/usePayrollStore";
import { usePayrollRows } from "@/store/selectors";
import { saveBlob } from "@/lib/payslipPdf";
import { csvSerialize } from "@/lib/csv";
import { cn, ntd, formatPeriod } from "@/lib/utils";
import { yearlyWithholding, availableYears } from "@/lib/reports/withholding";
import { bracketWorklist } from "@/lib/reports/bracketAdjust";
import { enrollmentWorklist } from "@/lib/reports/enrollment";
import type { DeclaredInsured } from "@/lib/types";
import { Scale, Download, UserPlus, UserMinus, ArrowRight } from "lucide-react";

type Tab = "withholding" | "insurance" | "bracket" | "enrollment";
const TABS: [Tab, string][] = [
  ["withholding", "年度扣繳憑單"],
  ["insurance", "勞健退繳費清單"],
  ["bracket", "投保級距申報調整"],
  ["enrollment", "加退保作業清單"],
];

function dl(headers: string[], rows: (string | number)[][], name: string) {
  saveBlob(new Blob([csvSerialize(headers, rows)], { type: "text/csv;charset=utf-8" }), name);
}

export function FilingView() {
  const [tab, setTab] = useState<Tab>("withholding");
  const currentPeriod = usePayrollStore((s) => s.currentPeriod);
  return (
    <div className="space-y-4">
      <PrintHeader title="年度申報與名冊" period={currentPeriod} />
      <div className="print:hidden">
        <h1 className="flex items-center gap-2 text-lg font-bold"><Scale className="size-5 text-primary" /> 法規申報報表</h1>
        <p className="text-sm text-muted-foreground">
          產出年度扣繳、勞健退繳費、投保級距申報調整與加退保作業清單，供人工核對與上傳主管機關平台
          （本系統不直接介接政府申報，報表可匯出 CSV）。
        </p>
      </div>
      <div className="flex flex-wrap gap-1 print:hidden">
        {TABS.map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            className={cn("rounded-md px-3 py-1.5 text-sm", tab === k ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-accent")}>
            {label}
          </button>
        ))}
      </div>
      {tab === "withholding" && <WithholdingTab />}
      {tab === "insurance" && <InsuranceTab />}
      {tab === "bracket" && <BracketTab />}
      {tab === "enrollment" && <EnrollmentTab />}
    </div>
  );
}

/* B1 年度扣繳憑單彙總 */
function WithholdingTab() {
  const { employees, salaries, dependents, events, parameters, brackets, currentPeriod } = usePayrollStore();
  const years = availableYears(events);
  const [year, setYear] = useState(years[0] ?? currentPeriod.slice(0, 4));
  const rows = yearlyWithholding(employees, salaries, dependents, events, parameters, brackets, year);
  const tot = rows.reduce((a, r) => ({ gross: a.gross + r.gross, taxable: a.taxable + r.taxable, bonus: a.bonus + r.bonus, withheld: a.withheld + r.withheld, supp: a.supp + r.supplementary }), { gross: 0, taxable: 0, bonus: 0, withheld: 0, supp: 0 });

  const exportCsv = () => dl(
    ["員工編號", "姓名", "結算月數", "全年應發", "全年應稅(估)", "全年獎金", "全年代扣稅", "全年補充保費"],
    rows.map((r) => [r.employeeId, r.name, r.months, r.gross, r.taxable, r.bonus, r.withheld, r.supplementary]),
    `年度扣繳彙總_${year}.csv`,
  );

  return (
    <Card className="print-block">
      <CardHeader className="flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base">年度各類所得扣繳暨免扣繳憑單（彙總）</CardTitle>
          <CardDescription>聚合該年度所有結算月份；金額為系統估算，正式申報請依官方平台核對。</CardDescription>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
            <SelectContent>{(years.length ? years : [year]).map((y) => <SelectItem key={y} value={y}>{y} 年</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={exportCsv}><Download /> 匯出 CSV</Button>
        </div>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <EmptyState title="該年度尚無結算資料" hint="選擇其他年度，或先在「每月薪資作業」完成至少一個月的結算。" compact />
        ) : (
          <Table zebra>
            <TableHeader sticky><TableRow><TableHead>員工</TableHead><NumHead>月數</NumHead><NumHead>全年應發</NumHead><NumHead>全年應稅(估)</NumHead><NumHead>全年獎金</NumHead><NumHead>全年代扣稅</NumHead><NumHead>補充保費</NumHead></TableRow></TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.employeeId}>
                  <TableCell className="font-medium">{r.name}<span className="ml-1.5 text-xs text-muted-foreground">{r.employeeId}</span></TableCell>
                  <NumCell>{r.months}</NumCell>
                  <NumCell>{ntd(r.gross)}</NumCell>
                  <NumCell>{ntd(r.taxable)}</NumCell>
                  <NumCell>{ntd(r.bonus)}</NumCell>
                  <NumCell>{ntd(r.withheld)}</NumCell>
                  <NumCell>{ntd(r.supplementary)}</NumCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell>合計</TableCell>
                <TableCell />
                <NumCell>{ntd(tot.gross)}</NumCell>
                <NumCell>{ntd(tot.taxable)}</NumCell>
                <NumCell>{ntd(tot.bonus)}</NumCell>
                <NumCell>{ntd(tot.withheld)}</NumCell>
                <NumCell>{ntd(tot.supp)}</NumCell>
              </TableRow>
            </TableFooter>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

/* B2 勞健退繳費/提繳清單（當期） */
function InsuranceTab() {
  const rows = usePayrollRows();
  const currentPeriod = usePayrollStore((s) => s.currentPeriod);
  const exportCsv = () => dl(
    ["員工編號", "姓名", "勞保投保", "健保投保", "勞退提繳", "勞保自付", "健保自付", "勞退自提", "勞保雇主", "職保雇主", "健保雇主", "勞退雇主"],
    rows.map((r) => [r.employeeId, r.name, r.insured.labor, r.insured.health, r.insured.pension, r.premiums.laborEmployee, r.premiums.healthEmployee, r.premiums.pensionVoluntary, r.premiums.laborEmployer, r.premiums.occupationalEmployer, r.premiums.healthEmployer, r.premiums.pensionEmployer]),
    `勞健退繳費清單_${currentPeriod}.csv`,
  );
  const tot = rows.reduce(
    (a, r) => ({
      le: a.le + r.premiums.laborEmployee, he: a.he + r.premiums.healthEmployee,
      lr: a.lr + r.premiums.laborEmployer, oe: a.oe + r.premiums.occupationalEmployer,
      hr: a.hr + r.premiums.healthEmployer, pr: a.pr + r.premiums.pensionEmployer,
    }),
    { le: 0, he: 0, lr: 0, oe: 0, hr: 0, pr: 0 },
  );
  return (
    <Card className="print-block">
      <CardHeader className="flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base">勞健退繳費／提繳清單（{formatPeriod(currentPeriod)}）</CardTitle>
          <CardDescription>當期各員工投保金額與勞保、職保、健保、勞退之員工自付與雇主負擔，供對帳繳款單。</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv} className="print:hidden"><Download /> 匯出 CSV</Button>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <EmptyState title="當期無在職員工資料" hint="先在「每月薪資作業」建立當月在職名單。" compact />
        ) : (
          <Table zebra>
            <TableHeader sticky><TableRow><TableHead>員工</TableHead><NumHead>勞保投保</NumHead><NumHead>健保投保</NumHead><NumHead>勞退提繳</NumHead><NumHead>勞保自付</NumHead><NumHead>健保自付</NumHead><NumHead>勞保雇主</NumHead><NumHead>職保雇主</NumHead><NumHead>健保雇主</NumHead><NumHead>勞退雇主</NumHead></TableRow></TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.employeeId}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <NumCell>{ntd(r.insured.labor)}</NumCell>
                  <NumCell>{ntd(r.insured.health)}</NumCell>
                  <NumCell>{ntd(r.insured.pension)}</NumCell>
                  <NumCell>{ntd(r.premiums.laborEmployee)}</NumCell>
                  <NumCell>{ntd(r.premiums.healthEmployee)}</NumCell>
                  <NumCell>{ntd(r.premiums.laborEmployer)}</NumCell>
                  <NumCell>{ntd(r.premiums.occupationalEmployer)}</NumCell>
                  <NumCell>{ntd(r.premiums.healthEmployer)}</NumCell>
                  <NumCell>{ntd(r.premiums.pensionEmployer)}</NumCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell>合計</TableCell>
                <TableCell colSpan={3} />
                <NumCell>{ntd(tot.le)}</NumCell>
                <NumCell>{ntd(tot.he)}</NumCell>
                <NumCell>{ntd(tot.lr)}</NumCell>
                <NumCell>{ntd(tot.oe)}</NumCell>
                <NumCell>{ntd(tot.hr)}</NumCell>
                <NumCell>{ntd(tot.pr)}</NumCell>
              </TableRow>
            </TableFooter>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

/* B3 投保級距申報調整 */
function BracketTab() {
  const rows = usePayrollRows();
  const { declaredInsured, setDeclaredBaseline } = usePayrollStore();
  const work = bracketWorklist(rows.map((r) => ({ employeeId: r.employeeId, name: r.name, insured: r.insured })), declaredInsured);
  const changed = work.filter((w) => w.changed);
  const hasBaseline = declaredInsured.length > 0;

  const setBaseline = () => {
    const list: DeclaredInsured[] = rows.map((r) => ({ employeeId: r.employeeId, labor: r.insured.labor, health: r.insured.health, pension: r.insured.pension, declaredAt: new Date().toISOString() }));
    if (confirm("將以目前所有在職員工的投保金額設為『已申報基準』。日後薪資異動會與此基準比對，找出 2／8 月應辦理級距調整者。確定？")) {
      setDeclaredBaseline(list);
    }
  };
  const exportCsv = () => dl(
    ["員工編號", "姓名", "目前勞保", "申報勞保", "目前健保", "申報健保", "目前勞退", "申報勞退", "需調整"],
    work.map((w) => [w.employeeId, w.name, w.current.labor, w.declared?.labor ?? "", w.current.health, w.declared?.health ?? "", w.current.pension, w.declared?.pension ?? "", w.changed ? "是" : ""]),
    `投保級距申報調整.csv`,
  );

  const cmp = (current: number, declared?: number) => (
    <span className="inline-flex items-center justify-end gap-1">
      <span>{ntd(current)}</span>
      {declared != null && (
        <>
          <ArrowRight className={cn("size-3", current !== declared ? "text-amber-600" : "text-muted-foreground/50")} />
          <span className={cn(current !== declared && "font-medium text-amber-700")}>{ntd(declared)}</span>
        </>
      )}
    </span>
  );

  return (
    <Card className="print-block">
      <CardHeader className="flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base">投保級距申報調整工作清單</CardTitle>
          <CardDescription>
            比對「目前薪資算出的投保金額（現）」與「已申報基準（報）」，找出 2／8 月應辦理調整者。欄位格式：現 → 報。
            {hasBaseline ? `（已設基準，待調整 ${changed.length} 人）` : "（尚未設基準，請先設定）"}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <Button variant="outline" size="sm" onClick={setBaseline}>以目前為申報基準</Button>
          <Button variant="outline" size="sm" onClick={exportCsv}><Download /> 匯出 CSV</Button>
        </div>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <EmptyState title="當期無在職員工資料" hint="先在「每月薪資作業」建立當月在職名單。" compact />
        ) : (
          <Table zebra>
            <TableHeader sticky><TableRow><TableHead>員工</TableHead><NumHead>勞保（現 → 報）</NumHead><NumHead>健保（現 → 報）</NumHead><NumHead>勞退（現 → 報）</NumHead><TableHead>狀態</TableHead></TableRow></TableHeader>
            <TableBody>
              {work.map((w) => (
                <TableRow key={w.employeeId} className={cn(w.changed && hasBaseline && "bg-amber-50")}>
                  <TableCell className="font-medium">{w.name}</TableCell>
                  <NumCell>{cmp(w.current.labor, w.declared?.labor)}</NumCell>
                  <NumCell>{cmp(w.current.health, w.declared?.health)}</NumCell>
                  <NumCell>{cmp(w.current.pension, w.declared?.pension)}</NumCell>
                  <TableCell>{!hasBaseline ? <span className="text-xs text-muted-foreground">—</span> : w.changed ? <Badge variant="warning">需調整</Badge> : <Badge variant="success">一致</Badge>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

/* B4 加退保作業清單 */
function EnrollmentTab() {
  const { employees, currentPeriod } = usePayrollStore();
  const { newHires, leavers } = enrollmentWorklist(employees, currentPeriod);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="print-block">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <UserPlus className="size-4 text-emerald-600" /> 本月應加保（新進）
            <Badge variant="success">{newHires.length} 人</Badge>
          </CardTitle>
          <CardDescription>到職日落在 {formatPeriod(currentPeriod)} 者，請於到職當日辦理加保。</CardDescription>
        </CardHeader>
        <CardContent>
          {newHires.length === 0 ? <EmptyState title="本月無新進" compact /> : (
            <ul className="space-y-1 text-sm">
              {newHires.map((e) => <li key={e.id} className="flex items-center justify-between rounded border p-2"><span>{e.name}（{e.id}）{e.department}</span><Badge variant="success">加保・{e.hireDate}</Badge></li>)}
            </ul>
          )}
        </CardContent>
      </Card>
      <Card className="print-block">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <UserMinus className="size-4 text-amber-600" /> 本月應退保（離職）
            <Badge variant={leavers.length ? "warning" : "secondary"}>{leavers.length} 人</Badge>
          </CardTitle>
          <CardDescription>離職生效日落在 {formatPeriod(currentPeriod)} 者，請於離職當日辦理退保。</CardDescription>
        </CardHeader>
        <CardContent>
          {leavers.length === 0 ? <EmptyState title="本月無退保" compact /> : (
            <ul className="space-y-1 text-sm">
              {leavers.map((e) => <li key={e.id} className="flex items-center justify-between rounded border p-2"><span>{e.name}（{e.id}）{e.department}</span><Badge variant="warning">退保・{e.leaveDate}</Badge></li>)}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
