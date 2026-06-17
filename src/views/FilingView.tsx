import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Scale, Download } from "lucide-react";

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
  return (
    <div className="space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-lg font-bold"><Scale className="size-5 text-primary" /> 法規申報報表</h1>
        <p className="text-sm text-muted-foreground">
          產出年度扣繳、勞健退繳費、投保級距申報調整與加退保作業清單，供人工核對與上傳主管機關平台
          （本系統不直接介接政府申報，報表可匯出 CSV）。
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
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base">年度各類所得扣繳暨免扣繳憑單（彙總）</CardTitle>
          <CardDescription>聚合該年度所有結算月份；金額為系統估算，正式申報請依官方平台核對。</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
            <SelectContent>{(years.length ? years : [year]).map((y) => <SelectItem key={y} value={y}>{y} 年</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={exportCsv}><Download /> 匯出 CSV</Button>
        </div>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">該年度尚無結算資料。</p>
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead>員工</TableHead><TableHead className="text-right">月數</TableHead><TableHead className="text-right">全年應發</TableHead><TableHead className="text-right">全年應稅(估)</TableHead><TableHead className="text-right">全年獎金</TableHead><TableHead className="text-right">全年代扣稅</TableHead><TableHead className="text-right">補充保費</TableHead></TableRow></TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.employeeId}>
                  <TableCell className="font-medium">{r.name}<span className="ml-1.5 text-xs text-muted-foreground">{r.employeeId}</span></TableCell>
                  <TableCell className="text-right tabular-nums">{r.months}</TableCell>
                  <TableCell className="text-right tabular-nums">{ntd(r.gross)}</TableCell>
                  <TableCell className="text-right tabular-nums">{ntd(r.taxable)}</TableCell>
                  <TableCell className="text-right tabular-nums">{ntd(r.bonus)}</TableCell>
                  <TableCell className="text-right tabular-nums">{ntd(r.withheld)}</TableCell>
                  <TableCell className="text-right tabular-nums">{ntd(r.supplementary)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter><TableRow><TableCell>合計</TableCell><TableCell /><TableCell className="text-right tabular-nums">{ntd(tot.gross)}</TableCell><TableCell className="text-right tabular-nums">{ntd(tot.taxable)}</TableCell><TableCell className="text-right tabular-nums">{ntd(tot.bonus)}</TableCell><TableCell className="text-right tabular-nums">{ntd(tot.withheld)}</TableCell><TableCell className="text-right tabular-nums">{ntd(tot.supp)}</TableCell></TableRow></TableFooter>
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
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base">勞健退繳費／提繳清單（{formatPeriod(currentPeriod)}）</CardTitle>
          <CardDescription>當期各員工投保金額與勞保、健保、勞退之員工自付與雇主負擔，供對帳繳款單。</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv}><Download /> 匯出 CSV</Button>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">當期無在職員工資料。</p>
        ) : (
          <div className="overflow-auto">
            <Table>
              <TableHeader><TableRow><TableHead>員工</TableHead><TableHead className="text-right">勞保投保</TableHead><TableHead className="text-right">健保投保</TableHead><TableHead className="text-right">勞退提繳</TableHead><TableHead className="text-right">勞保自付</TableHead><TableHead className="text-right">健保自付</TableHead><TableHead className="text-right">勞保雇主</TableHead><TableHead className="text-right">健保雇主</TableHead><TableHead className="text-right">勞退雇主</TableHead></TableRow></TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.employeeId}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="text-right tabular-nums">{ntd(r.insured.labor)}</TableCell>
                    <TableCell className="text-right tabular-nums">{ntd(r.insured.health)}</TableCell>
                    <TableCell className="text-right tabular-nums">{ntd(r.insured.pension)}</TableCell>
                    <TableCell className="text-right tabular-nums">{ntd(r.premiums.laborEmployee)}</TableCell>
                    <TableCell className="text-right tabular-nums">{ntd(r.premiums.healthEmployee)}</TableCell>
                    <TableCell className="text-right tabular-nums">{ntd(r.premiums.laborEmployer)}</TableCell>
                    <TableCell className="text-right tabular-nums">{ntd(r.premiums.healthEmployer)}</TableCell>
                    <TableCell className="text-right tabular-nums">{ntd(r.premiums.pensionEmployer)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
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

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base">投保級距申報調整工作清單</CardTitle>
          <CardDescription>
            比對「目前薪資算出的投保金額」與「已申報基準」，找出 2／8 月應辦理調整者。
            {hasBaseline ? `（已設基準，待調整 ${changed.length} 人）` : "（尚未設基準，請先設定）"}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={setBaseline}>以目前為申報基準</Button>
          <Button variant="outline" size="sm" onClick={exportCsv}><Download /> 匯出 CSV</Button>
        </div>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">當期無在職員工資料。</p>
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead>員工</TableHead><TableHead className="text-right">勞保（目前/申報）</TableHead><TableHead className="text-right">健保（目前/申報）</TableHead><TableHead className="text-right">勞退（目前/申報）</TableHead><TableHead>狀態</TableHead></TableRow></TableHeader>
            <TableBody>
              {work.map((w) => (
                <TableRow key={w.employeeId} className={cn(w.changed && hasBaseline && "bg-amber-50")}>
                  <TableCell className="font-medium">{w.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{ntd(w.current.labor)}{w.declared ? ` / ${ntd(w.declared.labor)}` : ""}</TableCell>
                  <TableCell className="text-right tabular-nums">{ntd(w.current.health)}{w.declared ? ` / ${ntd(w.declared.health)}` : ""}</TableCell>
                  <TableCell className="text-right tabular-nums">{ntd(w.current.pension)}{w.declared ? ` / ${ntd(w.declared.pension)}` : ""}</TableCell>
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
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">本月應加保（新進）</CardTitle>
          <CardDescription>到職日落在 {formatPeriod(currentPeriod)} 者，請於到職當日辦理加保。</CardDescription>
        </CardHeader>
        <CardContent>
          {newHires.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">本月無新進。</p> : (
            <ul className="space-y-1 text-sm">
              {newHires.map((e) => <li key={e.id} className="flex justify-between rounded border p-2"><span>{e.name}（{e.id}）{e.department}</span><Badge variant="success">加保・{e.hireDate}</Badge></li>)}
            </ul>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">本月應退保（離職）</CardTitle>
          <CardDescription>離職生效日落在 {formatPeriod(currentPeriod)} 者，請於離職當日辦理退保。</CardDescription>
        </CardHeader>
        <CardContent>
          {leavers.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">本月無退保。</p> : (
            <ul className="space-y-1 text-sm">
              {leavers.map((e) => <li key={e.id} className="flex justify-between rounded border p-2"><span>{e.name}（{e.id}）{e.department}</span><Badge variant="secondary">退保・{e.leaveDate}</Badge></li>)}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
