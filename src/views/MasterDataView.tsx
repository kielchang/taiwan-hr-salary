import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { usePayrollStore } from "@/store/usePayrollStore";
import type { Employee, SalaryStructure, Dependent } from "@/lib/types";
import { monthlySalaryTotal, lookupInsuredAmounts, seniorityMonths, formatSeniority, annualLeaveDays } from "@/lib/calc";
import { saveBlob } from "@/lib/payslipPdf";
import { csvSerialize } from "@/lib/csv";
import { parseEmployeeCsv, IMPORT_COLUMNS, type ImportPreview } from "@/lib/import/employeeCsv";
import { cn, ntd } from "@/lib/utils";
import { HelpHint } from "@/components/HelpHint";
import { Pencil, Plus, Trash2, UserPlus, Upload, FileDown } from "lucide-react";

const STATUS_OPTIONS: Employee["status"][] = ["在職", "離職", "留停", "停職", "暫離"];
const LEAVE_STATUSES = ["留停", "停職", "暫離"];

export type SalaryNumKey = Exclude<keyof Omit<SalaryStructure, "employeeId">, "customAllowances">;
export const SALARY_ITEMS: { key: SalaryNumKey; label: string; help?: string }[] = [
  { key: "baseSalary", label: "本薪" },
  { key: "managerAllowance", label: "主管加給" },
  { key: "dutyAllowance", label: "職務加給" },
  { key: "professionalAllowance", label: "專業／技術加給" },
  { key: "mealAllowance", label: "伙食津貼", help: "3,000 元內免稅，仍計入投保級距" },
  { key: "transportAllowance", label: "交通津貼（固定）" },
  { key: "attendanceBonus", label: "全勤獎金" },
  { key: "otherFixedAllowance", label: "其他固定津貼" },
];

const blankEmployee = (): Employee => ({
  id: "",
  name: "",
  department: "",
  title: "",
  hireDate: new Date().toISOString().slice(0, 10),
  costCenter: "",
  project: "",
  taxResidency: "居住者",
  withholdingMethod: "固定5%",
  exemptionFormReceivedDate: null,
  voluntaryPensionRate: 0,
  nationalId: "",
  email: "",
  status: "在職",
  leaveDate: null,
});

const blankSalary = (id: string): SalaryStructure => ({
  employeeId: id,
  baseSalary: 0,
  managerAllowance: 0,
  dutyAllowance: 0,
  professionalAllowance: 0,
  mealAllowance: 0,
  transportAllowance: 0,
  attendanceBonus: 0,
  otherFixedAllowance: 0,
});

type DialogTab = "basic" | "salary" | "family";

export function MasterDataView() {
  const {
    employees, salaries, dependents, parameters, brackets,
    upsertEmployee, upsertSalary, setEmployeeDependents, removeEmployee, importEmployees,
    currentPeriod, confirmations, leavePolicy, salaryDefaults,
  } = usePayrollStore();
  const locked = Boolean(confirmations[currentPeriod]); // 硬鎖定：當期已確認

  const [importOpen, setImportOpen] = useState(false);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const sample = ["E999", "範例員工", "資訊部", "工程師", "2026-01-01", "A123456789", "name@example.com", "居住者", "固定5%", "0", "40000", "0", "0", "0", "3000", "0", "0", "0"];
    saveBlob(new Blob([csvSerialize([...IMPORT_COLUMNS], [sample])], { type: "text/csv;charset=utf-8" }), "員工匯入模板.csv");
  };
  const onImportFile = async (file: File) => {
    const text = await file.text();
    setPreview(parseEmployeeCsv(text, parameters.minWageMonthly));
    setImportOpen(true);
  };
  const commitImport = () => {
    if (preview && !preview.hasError) {
      importEmployees(preview.valid);
      setImportOpen(false);
      setPreview(null);
      alert(`已匯入 ${preview.valid.length} 名員工。`);
    }
  };

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<DialogTab>("basic");
  const [isNew, setIsNew] = useState(true);
  const [draftEmp, setDraftEmp] = useState<Employee>(blankEmployee());
  const [draftSalary, setDraftSalary] = useState<SalaryStructure>(blankSalary(""));
  const [draftDeps, setDraftDeps] = useState<Dependent[]>([]);

  const openNew = () => {
    setDraftEmp(blankEmployee());
    // 帶入公司預設固定薪資/津貼（可再改）
    setDraftSalary({
      ...blankSalary(""),
      ...salaryDefaults.standard,
      customAllowances: salaryDefaults.custom.map((c) => ({ id: `CA${Date.now()}${Math.random().toString(36).slice(2, 6)}`, name: c.name, amount: c.amount })),
    });
    setDraftDeps([]);
    setIsNew(true);
    setTab("basic");
    setOpen(true);
  };

  const openEdit = (emp: Employee) => {
    setDraftEmp({ ...emp });
    setDraftSalary({ ...(salaries.find((s) => s.employeeId === emp.id) ?? blankSalary(emp.id)) });
    setDraftDeps(dependents.filter((d) => d.employeeId === emp.id).map((d) => ({ ...d })));
    setIsNew(false);
    setTab("basic");
    setOpen(true);
  };

  const save = () => {
    const id = draftEmp.id.trim();
    if (!id || !draftEmp.name.trim()) {
      setTab("basic");
      return;
    }
    // 防呆：新增時員編不可與既有員工重複（否則會靜默覆蓋他人資料）
    if (isNew && employees.some((e) => e.id === id)) {
      alert(`員工編號「${id}」已存在（${employees.find((e) => e.id === id)?.name}）。請改用其他編號，或由清單開啟該員編輯。`);
      setTab("basic");
      return;
    }
    // 硬鎖定：當期已確認時，影響薪資之欄位（薪資結構/眷屬/到離職/扣繳設定）不可變更
    if (locked) {
      const prev = employees.find((e) => e.id === id);
      const prevSalary = salaries.find((s) => s.employeeId === id);
      const prevDeps = dependents.filter((d) => d.employeeId === id);
      const PAY_KEYS = ["hireDate", "status", "leaveDate", "returnDate", "leavePaidRatio", "voluntaryPensionRate", "taxResidency", "withholdingMethod", "exemptionFormReceivedDate"] as const;
      const payChanged =
        !prev || PAY_KEYS.some((k) => (prev[k] ?? null) !== (draftEmp[k] ?? null)) ||
        JSON.stringify(prevSalary ?? blankSalary(id)) !== JSON.stringify({ ...draftSalary, employeeId: id }) ||
        JSON.stringify(prevDeps) !== JSON.stringify(draftDeps.map((d) => ({ ...d, employeeId: id })));
      if (payChanged) {
        alert(`本月（${currentPeriod}）已確認結算，薪資相關資料已鎖定。\n請先至「每月作業 → 查核與確認」取消確認，再修改到離職、薪資結構、眷屬或扣繳設定。`);
        return;
      }
    }
    upsertEmployee({ ...draftEmp, id });
    upsertSalary({ ...draftSalary, employeeId: id });
    setEmployeeDependents(id, draftDeps.map((d) => ({ ...d, employeeId: id })));
    setOpen(false);
  };

  const setEmp = <K extends keyof Employee>(k: K, v: Employee[K]) =>
    setDraftEmp((d) => ({ ...d, [k]: v }));

  const isLeave = draftEmp.status != null && LEAVE_STATUSES.includes(draftEmp.status); // 留停/停職/暫離
  const policyRatio = isLeave ? leavePolicy[draftEmp.status as "留停" | "停職" | "暫離"] : 0; // 該狀態公司預設比例

  // 深連結 ?emp=E001：由查核/名冊等處跳轉時直接開啟該員檔案，免再搜尋
  const [searchParams, setSearchParams] = useSearchParams();
  const empParam = searchParams.get("emp");
  useEffect(() => {
    if (!empParam) return;
    const target = employees.find((e) => e.id === empParam);
    if (target) openEdit(target);
    setSearchParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empParam]);

  const draftTotal = monthlySalaryTotal(draftSalary);
  const draftInsured = lookupInsuredAmounts(brackets, draftTotal);
  const healthDeps = draftDeps.filter((d) => d.enrolledInHealthInsurance).length;
  const taxDeps = draftDeps.filter((d) => d.taxDependent).length;

  const addDep = () =>
    setDraftDeps((ds) => [
      ...ds,
      {
        id: `D${Date.now()}${ds.length}`,
        employeeId: draftEmp.id,
        name: "",
        relationship: "配偶",
        birthDate: "",
        nationalId: "",
        enrolledInHealthInsurance: true,
        taxDependent: true,
      },
    ]);

  type EmpRow = {
    emp: Employee; total: number; months: number; leaveDays: number;
    hd: number; td: number; lowWage: boolean; noForm: boolean;
  };
  const empRows: EmpRow[] = employees.map((emp) => {
    const s = salaries.find((x) => x.employeeId === emp.id) ?? blankSalary(emp.id);
    const total = monthlySalaryTotal(s);
    const months = seniorityMonths(emp.hireDate, parameters.seniorityBaseDate);
    return {
      emp, total, months, leaveDays: annualLeaveDays(months),
      hd: dependents.filter((d) => d.employeeId === emp.id && d.enrolledInHealthInsurance).length,
      td: dependents.filter((d) => d.employeeId === emp.id && d.taxDependent).length,
      lowWage: total < parameters.minWageMonthly,
      noForm: emp.taxResidency === "居住者" && !emp.exemptionFormReceivedDate,
    };
  });
  const empColumns: Column<EmpRow>[] = [
    {
      key: "name", header: "員工", freeze: true,
      sortValue: (r) => r.emp.name, filterText: (r) => `${r.emp.name} ${r.emp.id}`,
      cell: (r) => (<><span className="font-medium">{r.emp.name}</span><span className="ml-1.5 text-xs text-muted-foreground">{r.emp.id}</span></>),
    },
    {
      key: "dept", header: "部門／職稱", sortValue: (r) => r.emp.department,
      filterText: (r) => `${r.emp.department} ${r.emp.title}`,
      cell: (r) => (<span className="text-sm">{r.emp.department}{r.emp.title && <span className="text-muted-foreground">・{r.emp.title}</span>}</span>),
    },
    { key: "hire", header: "到職日", sortValue: (r) => r.emp.hireDate, cell: (r) => <span className="text-sm">{r.emp.hireDate}</span> },
    { key: "sen", header: "年資", numeric: true, sortValue: (r) => r.months, cell: (r) => <span className="text-sm">{formatSeniority(r.months)}</span> },
    { key: "leave", header: "特休", numeric: true, sortValue: (r) => r.leaveDays, cell: (r) => <span className="text-sm">{r.leaveDays} 天</span> },
    {
      key: "total", header: "月薪總額", numeric: true, sortValue: (r) => r.total,
      cell: (r) => <span className="font-medium">{ntd(r.total)}</span>,
      total: (rs) => ntd(rs.reduce((a, r) => a + r.total, 0)),
    },
    { key: "deps", header: "眷屬（健保/扶養）", numeric: true, sortValue: (r) => r.hd, cell: (r) => <span className="text-sm">{r.hd}／{r.td}</span> },
    {
      key: "flags", header: "提醒",
      filterText: (r) => [r.emp.status !== "在職" ? r.emp.status : "", r.lowWage ? "低於最低工資" : "", r.noForm ? "免稅額申報表未收" : ""].join(" "),
      cell: (r) => (
        <div className="flex flex-wrap gap-1">
          {r.emp.status && r.emp.status !== "在職" && <Badge variant="secondary">{r.emp.status}{r.emp.leaveDate ? `・${r.emp.leaveDate}` : ""}</Badge>}
          {r.lowWage && <Badge variant="destructive">低於最低工資</Badge>}
          {r.noForm && <Badge variant="warning">免稅額申報表未收</Badge>}
        </div>
      ),
    },
    {
      key: "ops", header: "", headerClassName: "w-20",
      cell: (r) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="size-7" onClick={(e) => { e.stopPropagation(); openEdit(r.emp); }}><Pencil className="size-3.5" /></Button>
          <Button variant="ghost" size="icon" className="size-7 text-destructive" onClick={(e) => { e.stopPropagation(); if (confirm(`刪除 ${r.emp.name} 的所有資料（含薪資、眷屬與結算紀錄）？`)) removeEmployee(r.emp.id); }}><Trash2 className="size-3.5" /></Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-bold">基本資料 <HelpHint id="master" /></h1>
          <p className="text-sm text-muted-foreground">
            每位員工一份檔案：基本資料、固定薪資項目與眷屬都在同一個視窗維護。
            年資、特休與投保級距由系統自動計算。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <FileDown /> 匯入模板
          </Button>
          <input
            ref={importFileRef}
            type="file"
            accept="application/json,.csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImportFile(f);
              e.target.value = "";
            }}
          />
          <Button variant="outline" size="sm" onClick={() => importFileRef.current?.click()}>
            <Upload /> 批次匯入
          </Button>
          <Button size="sm" onClick={openNew}>
            <UserPlus /> 新增員工
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <DataTable
            rows={empRows}
            columns={empColumns}
            getRowKey={(r) => r.emp.id}
            initialSort={{ key: "name", dir: "asc" }}
            searchPlaceholder="搜尋姓名／編號／部門…"
            onRowClick={(r) => openEdit(r.emp)}
            empty={{ title: "尚未建立員工", hint: "按右上角「新增員工」開始，或到「系統設定 → 資料與安全」載入示範公司資料。", action: <Button size="sm" onClick={openNew}><UserPlus /> 新增員工</Button> }}
          />
        </CardContent>
      </Card>

      {/* 員工檔案編輯視窗（基本／薪資／眷屬三分頁） */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isNew ? "新增員工" : `${draftEmp.name} 的員工檔案`}</DialogTitle>
          </DialogHeader>

          <div className="flex gap-1 border-b pb-2">
            {(
              [
                ["basic", "基本資料"],
                ["salary", "固定薪資項目"],
                ["family", "眷屬與扣繳"],
              ] as [DialogTab, string][]
            ).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm",
                  tab === k ? "bg-primary text-primary-foreground" : "hover:bg-accent",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === "basic" && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="員工編號 *">
                <Input className="col-input" value={draftEmp.id} disabled={!isNew} onChange={(e) => setEmp("id", e.target.value)} />
              </Field>
              <Field label="姓名 *">
                <Input className="col-input" value={draftEmp.name} onChange={(e) => setEmp("name", e.target.value)} />
              </Field>
              <Field label="部門">
                <Input className="col-input" value={draftEmp.department} onChange={(e) => setEmp("department", e.target.value)} />
              </Field>
              <Field label="職稱">
                <Input className="col-input" value={draftEmp.title} onChange={(e) => setEmp("title", e.target.value)} />
              </Field>
              <Field label="到職日" help="用於計算年資與特休天數；到職當月固定薪資按比例（破月）">
                <Input type="date" className="col-input" value={draftEmp.hireDate} onChange={(e) => setEmp("hireDate", e.target.value)} />
              </Field>
              <Field label="任職狀態" help="離職＝終止契約（計至離職日）；留停/停職/暫離＝可復職之非在職區間，依生效日/復職日破月、給薪比例計薪">
                <Select value={draftEmp.status ?? "在職"} onValueChange={(v) => setEmp("status", v as Employee["status"])}>
                  <SelectTrigger className="col-input"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s!}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              {draftEmp.status === "離職" && (
                <Field label="離職日" help="計至此日（含）；當月按在職天數破月、辦理退保">
                  <Input type="date" className="col-input" value={draftEmp.leaveDate ?? ""} onChange={(e) => setEmp("leaveDate", e.target.value || null)} />
                </Field>
              )}
              {isLeave && (
                <>
                  <Field label={`${draftEmp.status}生效日`} help="區間起日；此日起依給薪比例計薪、辦理停保">
                    <Input type="date" className="col-input" value={draftEmp.leaveDate ?? ""} onChange={(e) => setEmp("leaveDate", e.target.value || null)} />
                  </Field>
                  <Field label="復職日（空＝尚未復職）" help="復職日起恢復全額計薪並辦理復保；填此即閉合區間">
                    <Input type="date" className="col-input" value={draftEmp.returnDate ?? ""} onChange={(e) => setEmp("returnDate", e.target.value || null)} />
                  </Field>
                  <Field label="給薪比例" help={`留白＝沿用公司政策（目前 ${draftEmp.status}：${Math.round(policyRatio * 100)}%）；可逐案覆寫`}>
                    <Select
                      value={draftEmp.leavePaidRatio == null ? "policy" : String(draftEmp.leavePaidRatio)}
                      onValueChange={(v) => setEmp("leavePaidRatio", v === "policy" ? null : Number(v))}
                    >
                      <SelectTrigger className="col-input"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="policy">沿用公司政策（{Math.round(policyRatio * 100)}%）</SelectItem>
                        <SelectItem value="0">無給（0%）</SelectItem>
                        <SelectItem value="0.5">半薪（50%）</SelectItem>
                        <SelectItem value="1">全薪（100%）</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </>
              )}
              <Field label="勞退自願提繳率（%）" help="員工自願從薪資提繳 0～6% 到退休金專戶，此金額免稅">
                <Input
                  type="number" step="1" min="0" max="6" className="col-input"
                  value={Math.round(draftEmp.voluntaryPensionRate * 100)}
                  onChange={(e) => setEmp("voluntaryPensionRate", Math.min(6, Math.max(0, Number(e.target.value))) / 100)}
                />
              </Field>
              <Field label="成本中心（選填）" help="供匯總報表分類">
                <Input className="col-input" value={draftEmp.costCenter} onChange={(e) => setEmp("costCenter", e.target.value)} />
              </Field>
              <Field label="專案別（選填）" help="供匯總報表分類">
                <Input className="col-input" value={draftEmp.project} onChange={(e) => setEmp("project", e.target.value)} />
              </Field>
              <Field label="身分證字號" help="作為薪資條加密 PDF 的開啟密碼；英文字母請大寫">
                <Input
                  className="col-input"
                  value={draftEmp.nationalId}
                  onChange={(e) => setEmp("nationalId", e.target.value.toUpperCase())}
                  placeholder="A123456789"
                />
              </Field>
              <Field label="Email" help="薪資條 email 通知的收件人">
                <Input
                  type="email"
                  className="col-input"
                  value={draftEmp.email}
                  onChange={(e) => setEmp("email", e.target.value)}
                  placeholder="name@example.com"
                />
              </Field>
            </div>
          )}

          {tab === "salary" && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">
                這裡填「每月固定發放」的項目；年終、三節等一次性獎金不在這裡，請於每月結算或獎金試算時輸入。
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {SALARY_ITEMS.map((it) => (
                  <Field key={it.key} label={it.label} help={it.help}>
                    <Input
                      type="number" className="col-input text-right tabular-nums"
                      value={draftSalary[it.key]}
                      onChange={(e) => setDraftSalary((s) => ({ ...s, [it.key]: e.target.value === "" ? 0 : Number(e.target.value) }))}
                    />
                  </Field>
                ))}
              </div>

              {/* 自訂固定津貼（命名項目，如語言/值班/危險津貼）；計入月薪資總額與級距 */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">自訂固定津貼</p>
                    <p className="text-xs text-muted-foreground">8 項標準項目外的每月固定津貼，可自行命名；皆屬工資、計入月薪資總額與投保級距。</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setDraftSalary((s) => ({ ...s, customAllowances: [...(s.customAllowances ?? []), { id: `CA${Date.now()}${(s.customAllowances?.length ?? 0)}`, name: "", amount: 0 }] }))}>
                    <Plus /> 新增津貼
                  </Button>
                </div>
                {(draftSalary.customAllowances?.length ?? 0) === 0 ? (
                  <p className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">無自訂津貼。如語言津貼、值班津貼、危險津貼等，按「新增津貼」命名建立。</p>
                ) : (
                  <div className="space-y-2">
                    {(draftSalary.customAllowances ?? []).map((c, i) => (
                      <div key={c.id} className="flex flex-wrap items-center gap-2 rounded-md border p-2">
                        <Input placeholder="津貼名稱（如語言津貼）" className="col-input h-8 w-44"
                          value={c.name}
                          onChange={(e) => setDraftSalary((s) => ({ ...s, customAllowances: (s.customAllowances ?? []).map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) }))} />
                        <Input type="number" placeholder="金額" className="col-input h-8 w-28 text-right tabular-nums"
                          value={c.amount || ""}
                          onChange={(e) => setDraftSalary((s) => ({ ...s, customAllowances: (s.customAllowances ?? []).map((x, j) => (j === i ? { ...x, amount: Number(e.target.value) || 0 } : x)) }))} />
                        <Button variant="ghost" size="icon" className="ml-auto size-7 text-destructive"
                          onClick={() => setDraftSalary((s) => ({ ...s, customAllowances: (s.customAllowances ?? []).filter((_, j) => j !== i) }))}>
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-md border bg-muted/40 p-3 text-sm">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                  <span>
                    月薪資總額：<span className="font-bold tabular-nums">{ntd(draftTotal)}</span> 元
                  </span>
                  {draftTotal > 0 && draftTotal < parameters.minWageMonthly && (
                    <Badge variant="destructive">低於最低工資 {ntd(parameters.minWageMonthly)}</Badge>
                  )}
                </div>
                {draftTotal > 0 && (
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    依此薪資自動投保：勞保 {ntd(draftInsured.labor)}・職保 {ntd(draftInsured.occupational)}・
                    健保 {ntd(draftInsured.health)}・勞退 {ntd(draftInsured.pension)}
                  </p>
                )}
              </div>
            </div>
          )}

          {tab === "family" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Field label="稅務身分" help="該年度在台滿 183 天為居住者">
                  <Select value={draftEmp.taxResidency} onValueChange={(v) => setEmp("taxResidency", v as Employee["taxResidency"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="居住者">居住者</SelectItem>
                      <SelectItem value="非居住者">非居住者（6%／18%）</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                {draftEmp.taxResidency === "居住者" && (
                  <>
                    <Field label="每月扣繳方式" help="由員工在免稅額申報表上勾選">
                      <Select value={draftEmp.withholdingMethod} onValueChange={(v) => setEmp("withholdingMethod", v as Employee["withholdingMethod"])}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="固定5%">固定 5%</SelectItem>
                          <SelectItem value="依扣繳稅額表">依扣繳稅額表（查表）</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="免稅額申報表收件日" help="到職時與每年 1 月收件；未收件者依規定按固定 5% 扣繳">
                      <Input
                        type="date" className="col-input"
                        value={draftEmp.exemptionFormReceivedDate ?? ""}
                        onChange={(e) => setEmp("exemptionFormReceivedDate", e.target.value || null)}
                      />
                    </Field>
                  </>
                )}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">眷屬名單</p>
                    <p className="text-xs text-muted-foreground">
                      「依附健保」影響員工自付健保費（最多計 3 口）；「報稅扶養」影響所得稅起扣點——兩者可分開勾選。
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={addDep}>
                    <Plus /> 新增眷屬
                  </Button>
                </div>
                {draftDeps.length === 0 ? (
                  <p className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
                    無眷屬。若員工的配偶、子女或父母依附在其健保下，或申報為扶養親屬，請新增。
                  </p>
                ) : (
                  <div className="space-y-2">
                    {draftDeps.map((d, i) => (
                      <div key={d.id} className="flex flex-wrap items-center gap-2 rounded-md border p-2">
                        <Input
                          placeholder="姓名" className="col-input h-8 w-28"
                          value={d.name}
                          onChange={(e) => setDraftDeps((ds) => ds.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                        />
                        <Select
                          value={d.relationship}
                          onValueChange={(v) => setDraftDeps((ds) => ds.map((x, j) => (j === i ? { ...x, relationship: v } : x)))}
                        >
                          <SelectTrigger className="h-8 w-24"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {["配偶", "子女", "父母", "祖父母", "其他"].map((r) => (
                              <SelectItem key={r} value={r}>{r}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <label className="flex items-center gap-1.5 text-xs">
                          <Checkbox
                            checked={d.enrolledInHealthInsurance}
                            onCheckedChange={(v) => setDraftDeps((ds) => ds.map((x, j) => (j === i ? { ...x, enrolledInHealthInsurance: v === true } : x)))}
                          />
                          依附健保
                        </label>
                        <label className="flex items-center gap-1.5 text-xs">
                          <Checkbox
                            checked={d.taxDependent}
                            onCheckedChange={(v) => setDraftDeps((ds) => ds.map((x, j) => (j === i ? { ...x, taxDependent: v === true } : x)))}
                          />
                          報稅扶養
                        </label>
                        <Button
                          variant="ghost" size="icon" className="ml-auto size-7 text-destructive"
                          onClick={() => setDraftDeps((ds) => ds.filter((_, j) => j !== i))}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                {draftDeps.length > 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    統計：依附健保 {healthDeps} 口
                    {healthDeps > parameters.healthDependentCap && `（自付保費以 ${parameters.healthDependentCap} 口計）`}
                    ・報稅扶養 {taxDeps} 人
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>取消</Button>
            <Button onClick={save} disabled={!draftEmp.id.trim() || !draftEmp.name.trim()}>
              儲存員工檔案
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 批次匯入預覽 */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>批次匯入員工（預覽）</DialogTitle>
          </DialogHeader>
          {preview && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="success">可匯入 {preview.valid.length} 筆</Badge>
                {preview.issues.some((i) => i.level === "error") && (
                  <Badge variant="destructive">錯誤 {preview.issues.filter((i) => i.level === "error").length} 項（需修正後重匯）</Badge>
                )}
                {preview.issues.some((i) => i.level === "warning") && (
                  <Badge variant="warning">提醒 {preview.issues.filter((i) => i.level === "warning").length} 項</Badge>
                )}
                <span className="text-xs text-muted-foreground">同編號將覆蓋既有員工。</span>
              </div>
              <DataTable
                rows={preview.rows}
                getRowKey={(r) => String(r.row)}
                maxHeight="max-h-[50vh]"
                searchPlaceholder="搜尋編號／姓名…"
                rowClassName={(r) => cn(r.errors.length && "bg-destructive/5")}
                columns={[
                  { key: "row", header: "列", numeric: true, sortValue: (r) => r.row, cell: (r) => <span className="text-xs text-muted-foreground">{r.row}</span> },
                  { key: "emp", header: "編號／姓名", sortValue: (r) => r.employee.name, filterText: (r) => `${r.employee.name} ${r.employee.id}`, cell: (r) => (<span className="text-sm"><span className="font-medium">{r.employee.name || "（缺姓名）"}</span><span className="ml-1.5 text-xs text-muted-foreground">{r.employee.id || "（缺編號）"}</span></span>) },
                  { key: "total", header: "月薪總額", numeric: true, sortValue: (r) => monthlySalaryTotal(r.salary), cell: (r) => ntd(monthlySalaryTotal(r.salary)) },
                  { key: "check", header: "檢查", filterText: (r) => [...r.errors, ...r.warnings].join(" "), cell: (r) => (
                    <div className="flex flex-wrap gap-1">
                      {r.errors.map((m, i) => <Badge key={`e${i}`} variant="destructive">{m}</Badge>)}
                      {r.warnings.map((m, i) => <Badge key={`w${i}`} variant="warning">{m}</Badge>)}
                      {r.errors.length === 0 && r.warnings.length === 0 && <span className="text-xs text-muted-foreground">OK</span>}
                    </div>
                  ) },
                ]}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>取消</Button>
            <Button onClick={commitImport} disabled={!preview || preview.hasError || preview.valid.length === 0}>
              確認匯入 {preview?.valid.length ?? 0} 筆
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
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
