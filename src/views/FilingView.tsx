import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PrintHeader } from "@/components/PrintHeader";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { usePayrollStore } from "@/store/usePayrollStore";
import { usePayrollRows } from "@/store/selectors";
import { cn, ntd, formatPeriod } from "@/lib/utils";
import { yearlyWithholding, availableYears } from "@/lib/reports/withholding";
import { bracketWorklist } from "@/lib/reports/bracketAdjust";
import { enrollmentWorklist } from "@/lib/reports/enrollment";
import type { DeclaredInsured } from "@/lib/types";
import { Scale, UserPlus, UserMinus, ArrowRight } from "lucide-react";

export type FilingTab = "withholding" | "insurance" | "bracket" | "enrollment";
type Tab = FilingTab;
const TABS: [Tab, string][] = [
  ["withholding", "年度扣繳憑單"],
  ["insurance", "勞健退繳費清單"],
  ["bracket", "投保級距申報調整"],
  ["enrollment", "加退保作業清單"],
];

export function FilingView({ initialTab }: { initialTab?: FilingTab } = {}) {
  const [tab, setTab] = useState<Tab>(initialTab ?? "withholding");
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
  type R = (typeof rows)[number];
  const money = (key: string, header: string, get: (r: R) => number): Column<R> =>
    ({ key, header, numeric: true, sortValue: get, cell: (r) => ntd(get(r)), total: (rs) => ntd(rs.reduce((a, r) => a + get(r), 0)) });
  const columns: Column<R>[] = [
    { key: "emp", header: "員工", freeze: true, sortValue: (r) => r.name, filterText: (r) => `${r.name} ${r.employeeId}`, cell: (r) => (<>{r.name}<span className="ml-1.5 text-xs text-muted-foreground">{r.employeeId}</span></>) },
    { key: "months", header: "月數", numeric: true, sortValue: (r) => r.months, cell: (r) => r.months },
    money("gross", "全年應發", (r) => r.gross),
    money("taxable", "全年應稅(估)", (r) => r.taxable),
    money("bonus", "全年獎金", (r) => r.bonus),
    money("withheld", "全年代扣稅", (r) => r.withheld),
    money("supp", "補充保費", (r) => r.supplementary),
  ];
  return (
    <Card className="print-block">
      <CardHeader className="flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base">年度各類所得扣繳暨免扣繳憑單（彙總）</CardTitle>
          <CardDescription>聚合該年度所有結算月份；金額為系統估算，正式申報請依官方平台核對。</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <DataTable
          rows={rows}
          columns={columns}
          getRowKey={(r) => r.employeeId}
          searchPlaceholder="搜尋員工…"
          toolbar={
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
              <SelectContent>{(years.length ? years : [year]).map((y) => <SelectItem key={y} value={y}>{y} 年</SelectItem>)}</SelectContent>
            </Select>
          }
          csv={{
            headers: ["員工編號", "姓名", "結算月數", "全年應發", "全年應稅(估)", "全年獎金", "全年代扣稅", "全年補充保費"],
            row: (r) => [r.employeeId, r.name, r.months, r.gross, r.taxable, r.bonus, r.withheld, r.supplementary],
            fileName: `年度扣繳彙總_${year}.csv`,
          }}
          empty={{ title: "該年度尚無結算資料", hint: "選擇其他年度，或先在「每月薪資作業」完成至少一個月的結算。" }}
        />
      </CardContent>
    </Card>
  );
}

/* B2 勞健退繳費/提繳清單（當期） */
function InsuranceTab() {
  const rows = usePayrollRows();
  const currentPeriod = usePayrollStore((s) => s.currentPeriod);
  type R = (typeof rows)[number];
  const ins = (key: string, header: string, get: (r: R) => number, total = false): Column<R> =>
    ({ key, header, numeric: true, sortValue: get, cell: (r) => ntd(get(r)), ...(total ? { total: (rs) => ntd(rs.reduce((a, r) => a + get(r), 0)) } : {}) });
  const columns: Column<R>[] = [
    { key: "emp", header: "員工", freeze: true, sortValue: (r) => r.name, filterText: (r) => r.name, cell: (r) => r.name },
    ins("il", "勞保投保", (r) => r.insured.labor),
    ins("ih", "健保投保", (r) => r.insured.health),
    ins("ip", "勞退提繳", (r) => r.insured.pension),
    ins("le", "勞保自付", (r) => r.premiums.laborEmployee, true),
    ins("he", "健保自付", (r) => r.premiums.healthEmployee, true),
    ins("lr", "勞保雇主", (r) => r.premiums.laborEmployer, true),
    ins("oe", "職保雇主", (r) => r.premiums.occupationalEmployer, true),
    ins("hr", "健保雇主", (r) => r.premiums.healthEmployer, true),
    ins("pr", "勞退雇主", (r) => r.premiums.pensionEmployer, true),
  ];
  return (
    <Card className="print-block">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">勞健退繳費／提繳清單（{formatPeriod(currentPeriod)}）</CardTitle>
        <CardDescription>當期各員工投保金額與勞保、職保、健保、勞退之員工自付與雇主負擔，供對帳繳款單。</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          rows={rows}
          columns={columns}
          getRowKey={(r) => r.employeeId}
          searchPlaceholder="搜尋員工…"
          csv={{
            headers: ["員工編號", "姓名", "勞保投保", "健保投保", "勞退提繳", "勞保自付", "健保自付", "勞退自提", "勞保雇主", "職保雇主", "健保雇主", "勞退雇主"],
            row: (r) => [r.employeeId, r.name, r.insured.labor, r.insured.health, r.insured.pension, r.premiums.laborEmployee, r.premiums.healthEmployee, r.premiums.pensionVoluntary, r.premiums.laborEmployer, r.premiums.occupationalEmployer, r.premiums.healthEmployer, r.premiums.pensionEmployer],
            fileName: `勞健退繳費清單_${currentPeriod}.csv`,
          }}
          empty={{ title: "當期無在職員工資料", hint: "先在「每月薪資作業」建立當月在職名單。" }}
        />
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
  type W = (typeof work)[number];
  const columns: Column<W>[] = [
    { key: "emp", header: "員工", freeze: true, sortValue: (w) => w.name, filterText: (w) => w.name, cell: (w) => w.name },
    { key: "labor", header: "勞保（現 → 報）", numeric: true, sortValue: (w) => w.current.labor, cell: (w) => cmp(w.current.labor, w.declared?.labor) },
    { key: "health", header: "健保（現 → 報）", numeric: true, sortValue: (w) => w.current.health, cell: (w) => cmp(w.current.health, w.declared?.health) },
    { key: "pension", header: "勞退（現 → 報）", numeric: true, sortValue: (w) => w.current.pension, cell: (w) => cmp(w.current.pension, w.declared?.pension) },
    { key: "status", header: "狀態", sortValue: (w) => (w.changed ? 1 : 0), filterText: (w) => (w.changed ? "需調整" : "一致"), cell: (w) => (!hasBaseline ? <span className="text-xs text-muted-foreground">—</span> : w.changed ? <Badge variant="warning">需調整</Badge> : <Badge variant="success">一致</Badge>) },
  ];

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
      </CardHeader>
      <CardContent>
        <DataTable
          rows={work}
          columns={columns}
          getRowKey={(w) => w.employeeId}
          searchPlaceholder="搜尋員工…"
          rowClassName={(w) => cn(w.changed && hasBaseline && "bg-amber-50")}
          toolbar={<Button variant="outline" size="sm" onClick={setBaseline}>以目前為申報基準</Button>}
          csv={{
            headers: ["員工編號", "姓名", "目前勞保", "申報勞保", "目前健保", "申報健保", "目前勞退", "申報勞退", "需調整"],
            row: (w) => [w.employeeId, w.name, w.current.labor, w.declared?.labor ?? "", w.current.health, w.declared?.health ?? "", w.current.pension, w.declared?.pension ?? "", w.changed ? "是" : ""],
            fileName: `投保級距申報調整.csv`,
          }}
          empty={{ title: "當期無在職員工資料", hint: "先在「每月薪資作業」建立當月在職名單。" }}
        />
      </CardContent>
    </Card>
  );
}

/* B4 加退保作業清單 */
function EnrollmentTab() {
  const { employees, currentPeriod } = usePayrollStore();
  const { newHires, leavers } = enrollmentWorklist(employees, currentPeriod);
  const navigate = useNavigate();
  /** 名冊列可點：直接開該員檔案核對投保金額/薪資（免回主檔搜尋） */
  const row = (e: (typeof newHires)[number], badge: React.ReactNode) => (
    <li key={e.id}>
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 rounded border p-2 text-left hover:bg-accent/50"
        onClick={() => navigate(`/master?emp=${e.id}`)}
        title="開啟員工檔案核對投保資料"
      >
        <span>{e.name}（{e.id}）{e.department}</span>
        <span className="flex items-center gap-1.5">{badge}<ArrowRight className="size-3.5 text-muted-foreground" /></span>
      </button>
    </li>
  );
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
              {newHires.map((e) => row(e, <Badge variant="success">加保・{e.hireDate}</Badge>))}
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
              {leavers.map((e) => row(e, <Badge variant="warning">退保・{e.leaveDate}</Badge>))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
