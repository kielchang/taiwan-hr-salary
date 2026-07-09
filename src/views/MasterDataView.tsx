// 基本資料（員工主檔，/master）＝每位員工單一檔案：基本／固定薪資項目／眷屬與扣繳三分頁。
// 設計原理：
//  - 編輯採**唯讀逐欄編輯範本**（EditableField）：預設唯讀、點欄才輸入、變更標色＋undo/redo、
//    送出前 ChangeSummary 列「舊→新」。新增為直接可輸入；當期已確認時薪資相關欄位顯示鎖定
//    （吃 store 硬鎖定 PAY_KEYS）。此頁是全站表單互動的示範樣板。
//  - 生命週期：狀態 5 種（在職/離職/留停/停職/暫離）＋生效日/復職日/逐案給薪比例；固定薪資
//    含 8 標準欄＋自訂津貼，公司預設（salaryDefaults）於新增時帶入。
//  - 支援 ?emp= 深連結（工作台/每月作業跳轉直接開啟該員）。
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { usePayrollStore } from "@/store/usePayrollStore";
import type { Employee, SalaryStructure, Dependent, LeaveSegment, LeaveStatus } from "@/lib/types";
import { monthlySalaryTotal, lookupInsuredAmounts, seniorityMonths, formatSeniority, annualLeaveDays, isLeaveStatus } from "@/lib/calc";
import { saveBlob } from "@/lib/payslipPdf";
import { csvSerialize } from "@/lib/csv";
import { parseEmployeeCsv, IMPORT_COLUMNS, type ImportPreview } from "@/lib/import/employeeCsv";
import { cn, ntd } from "@/lib/utils";
import { HelpHint } from "@/components/HelpHint";
import { EditableField } from "@/components/form/EditableField";
import { ChangeSummary } from "@/components/form/ChangeSummary";
import { TabPills } from "@/components/ui/tab-pills";
import { diffRecord, type FieldSpec, type Change, type FieldKind } from "@/lib/forms/diff";
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

const STATUS_OPTS = STATUS_OPTIONS.map((s) => ({ value: s as string, label: s as string }));
const RESIDENCY_OPTS = [{ value: "居住者", label: "居住者" }, { value: "非居住者", label: "非居住者（6%／18%）" }];
const WITHHOLD_OPTS = [{ value: "固定5%", label: "固定 5%" }, { value: "依扣繳稅額表", label: "依扣繳稅額表（查表）" }];
const ratioLabel = (v: unknown) => (v == null || v === "policy" || v === "" ? "沿用公司政策" : `${Math.round(Number(v) * 100)}%`);

// 送出前變更摘要用的欄位中繼（label/kind/format）；key 對映 Employee/SalaryStructure 欄位
const EMP_SPECS: FieldSpec[] = [
  { key: "name", label: "姓名", kind: "text" },
  { key: "department", label: "部門", kind: "text" },
  { key: "title", label: "職稱", kind: "text" },
  { key: "hireDate", label: "到職日", kind: "date" },
  { key: "status", label: "任職狀態", kind: "select" },
  { key: "leaveDate", label: "離職／生效日", kind: "date" },
  { key: "returnDate", label: "復職日", kind: "date" },
  { key: "leavePaidRatio", label: "給薪比例", kind: "select", format: ratioLabel },
  { key: "voluntaryPensionRate", label: "勞退自提率", kind: "rate" },
  { key: "costCenter", label: "成本中心", kind: "text" },
  { key: "project", label: "專案別", kind: "text" },
  { key: "nationalId", label: "身分證字號", kind: "text" },
  { key: "email", label: "Email", kind: "text" },
  { key: "taxResidency", label: "稅務身分", kind: "select" },
  { key: "withholdingMethod", label: "扣繳方式", kind: "select" },
  { key: "exemptionFormReceivedDate", label: "免稅額申報表收件日", kind: "date" },
];
const SAL_SPECS: FieldSpec[] = SALARY_ITEMS.map((it) => ({ key: it.key, label: it.label, kind: "money" as const }));
const PAY_EMP_KEYS = new Set(["hireDate", "status", "leaveDate", "returnDate", "leavePaidRatio", "voluntaryPensionRate", "taxResidency", "withholdingMethod", "exemptionFormReceivedDate"]);
const LOCK_HINT = "本月已確認結算、此欄已鎖定；請先至「查核與確認」取消確認。";

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
        segKey(currentSegs(prev)) !== segKey(draftSegs) || // 區間紀錄亦屬計薪資料
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

  const isLeave = draftEmp.status != null && LEAVE_STATUSES.includes(draftEmp.status); // 目前為留停/停職/暫離

  // B-1 多段區間：有 leaveRecords 直接採用；否則由舊單段欄位回退（顯示用 "" 不用哨兵日期，提示使用者補填）。
  // 所有異動一律寫回 leaveRecords（materialize）＝之後以陣列為權威來源。
  const currentSegs = (e: Employee): LeaveSegment[] =>
    e.leaveRecords ??
    (isLeaveStatus(e.status)
      ? [{ status: e.status, from: e.leaveDate ?? "", to: e.returnDate ?? null, paidRatio: e.leavePaidRatio ?? null }]
      : []);
  const draftSegs = currentSegs(draftEmp);
  // 目前在假、或曾有區間紀錄（已復職員工的歷史）皆顯示編輯器
  const showLeaveEditor = isLeave || (draftEmp.leaveRecords?.length ?? 0) > 0;
  const setSegs = (updater: (segs: LeaveSegment[]) => LeaveSegment[]) =>
    setDraftEmp((d) => ({ ...d, leaveRecords: updater(currentSegs(d)) }));
  const updateSeg = (i: number, patch: Partial<LeaveSegment>) => setSegs((segs) => segs.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const removeSeg = (i: number) => setSegs((segs) => segs.filter((_, j) => j !== i));
  const addSeg = () =>
    setSegs((segs) => [
      ...segs,
      { status: (isLeaveStatus(draftEmp.status) ? draftEmp.status : "留停") as LeaveStatus, from: new Date().toISOString().slice(0, 10), to: null, paidRatio: null },
    ]);

  // 原始記錄（編輯模式）：供逐欄比對、標色與還原
  const origEmp = isNew ? undefined : employees.find((e) => e.id === draftEmp.id);
  const origSalary = isNew ? undefined : salaries.find((s) => s.employeeId === draftEmp.id);
  const origDeps = isNew ? [] : dependents.filter((d) => d.employeeId === draftEmp.id);
  const lockEmp = (k: string) => locked && !isNew && PAY_EMP_KEYS.has(k);
  const lockSal = locked && !isNew;
  const lockLeave = locked && !isNew; // 區間紀錄影響計薪＝屬 PAY_KEYS，鎖定期不可改

  // 送出前變更摘要（純量欄位 + 陣列變更旗標）
  const empChanges = origEmp ? diffRecord(origEmp as unknown as Record<string, unknown>, draftEmp as unknown as Record<string, unknown>, EMP_SPECS) : [];
  const salChanges = origSalary ? diffRecord(origSalary as unknown as Record<string, unknown>, draftSalary as unknown as Record<string, unknown>, SAL_SPECS) : [];
  const caKey = (ca?: { name: string; amount: number }[]) => JSON.stringify((ca ?? []).map((c) => ({ name: c.name, amount: c.amount })));
  const caChanged = !isNew && caKey(origSalary?.customAllowances) !== caKey(draftSalary.customAllowances);
  const depKey = (ds: Dependent[]) => JSON.stringify(ds.map((d) => ({ name: d.name, relationship: d.relationship, hi: d.enrolledInHealthInsurance, tax: d.taxDependent })));
  const depsChanged = !isNew && depKey(origDeps) !== depKey(draftDeps);
  const segKey = (segs: LeaveSegment[]) => JSON.stringify(segs.map((s) => ({ s: s.status, f: s.from, t: s.to ?? null, r: s.paidRatio ?? null })));
  const leaveChanged = !isNew && !!origEmp && segKey(currentSegs(origEmp)) !== segKey(draftSegs);
  const changes: Change[] = [...empChanges, ...salChanges];
  if (caChanged) changes.push({ field: "__ca__", label: "自訂津貼", before: null, after: null, beforeText: `${origSalary?.customAllowances?.length ?? 0} 項`, afterText: `${draftSalary.customAllowances?.length ?? 0} 項` });
  if (depsChanged) changes.push({ field: "__deps__", label: "眷屬名單", before: null, after: null, beforeText: `${origDeps.length} 人`, afterText: `${draftDeps.length} 人` });
  if (leaveChanged) changes.push({ field: "__leave__", label: "留停/停職/暫離 區間", before: null, after: null, beforeText: `${currentSegs(origEmp).length} 段`, afterText: `${draftSegs.length} 段` });

  const revertField = (field: string) => {
    if (field === "__ca__") { setDraftSalary((s) => ({ ...s, customAllowances: origSalary?.customAllowances?.map((c) => ({ ...c })) })); return; }
    if (field === "__deps__") { setDraftDeps(origDeps.map((d) => ({ ...d }))); return; }
    if (field === "__leave__") { setDraftEmp((d) => ({ ...d, leaveRecords: origEmp?.leaveRecords })); return; }
    if (SAL_SPECS.some((s) => s.key === field)) { setDraftSalary((s) => ({ ...s, [field]: (origSalary as Record<string, unknown> | undefined)?.[field] ?? 0 })); return; }
    setDraftEmp((d) => ({ ...d, [field]: (origEmp as Record<string, unknown> | undefined)?.[field] ?? null }));
  };
  const revertAll = () => {
    if (origEmp) setDraftEmp({ ...origEmp });
    if (origSalary) setDraftSalary({ ...origSalary });
    setDraftDeps(origDeps.map((d) => ({ ...d })));
  };

  // 員工欄位（唯讀預設；新增時 alwaysEdit）
  const empField = (
    key: keyof Employee,
    p: { label: string; kind: FieldKind; help?: string; options?: { value: string; label: string }[]; format?: (v: unknown) => string; placeholder?: string; nullable?: boolean },
  ) => (
    <EditableField
      label={p.label} kind={p.kind}
      value={draftEmp[key] as string | number | boolean | null | undefined}
      original={origEmp ? (origEmp[key] as string | number | boolean | null | undefined) : undefined}
      alwaysEdit={isNew} trackChanges={!isNew}
      disabled={lockEmp(key as string)} lockHint={LOCK_HINT}
      options={p.options} format={p.format} help={p.help} placeholder={p.placeholder}
      onChange={(v) => setEmp(key, (p.nullable && v === "" ? null : v) as Employee[typeof key])}
      onRevert={() => setEmp(key, (origEmp ? origEmp[key] : null) as Employee[typeof key])}
    />
  );
  const salField = (key: SalaryNumKey, label: string, help?: string) => (
    <EditableField
      label={label} kind="money"
      value={draftSalary[key]}
      original={origSalary ? origSalary[key] : undefined}
      alwaysEdit={isNew} trackChanges={!isNew}
      disabled={lockSal} lockHint={LOCK_HINT} help={help}
      onChange={(v) => setDraftSalary((s) => ({ ...s, [key]: Number(v) || 0 }))}
      onRevert={() => setDraftSalary((s) => ({ ...s, [key]: origSalary?.[key] ?? 0 }))}
    />
  );

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

          <TabPills
            className="border-b pb-2"
            tabs={([["basic", "基本資料"], ["salary", "固定薪資項目"], ["family", "眷屬與扣繳"]] as [DialogTab, string][]).map(([k, label]) => ({ key: k, label }))}
            value={tab}
            onChange={(k) => setTab(k as DialogTab)}
          />

          {tab === "basic" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <EditableField label="員工編號 *" kind="text" value={draftEmp.id} alwaysEdit={isNew} disabled={!isNew} lockHint="員工編號建立後不可變更" trackChanges={false} onChange={(v) => setEmp("id", String(v))} />
                {empField("name", { label: "姓名 *", kind: "text" })}
                {empField("department", { label: "部門", kind: "text" })}
                {empField("title", { label: "職稱", kind: "text" })}
                {empField("hireDate", { label: "到職日", kind: "date", help: "用於年資與特休；到職當月固定薪資按比例（破月）" })}
                {empField("status", { label: "任職狀態", kind: "select", options: STATUS_OPTS, help: "離職＝計至離職日；留停/停職/暫離＝可復職之非在職區間，於下方「區間紀錄」逐段登記" })}
                {draftEmp.status === "離職" && empField("leaveDate", { label: "離職日", kind: "date", nullable: true, help: "計至此日（含）；當月按在職天數破月、辦理退保" })}
                {empField("voluntaryPensionRate", { label: "勞退自願提繳率", kind: "rate", help: "0～6%，此金額免稅" })}
                {empField("costCenter", { label: "成本中心（選填）", kind: "text", help: "供匯總報表分類" })}
                {empField("project", { label: "專案別（選填）", kind: "text", help: "供匯總報表分類" })}
                {empField("nationalId", { label: "身分證字號", kind: "text", placeholder: "A123456789", help: "薪資條加密 PDF 密碼；英文大寫" })}
                {empField("email", { label: "Email", kind: "text", placeholder: "name@example.com", help: "薪資條 email 通知收件人" })}
              </div>

              {/* B-1：留停/停職/暫離「多段」區間紀錄（每段獨立生效日/復職日/給薪比例；破月計薪與停復保名冊逐段計算） */}
              {showLeaveEditor && (
                <div>
                  <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">留停／停職／暫離 區間紀錄</p>
                      <p className="text-xs text-muted-foreground">
                        可登記多段非在職期間，每段各自的類別、生效日、復職日與給薪比例；破月計薪與停保/復保名冊皆逐段計算。
                        復職日留白＝尚未復職（開放區間，至多一段）。
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={addSeg} disabled={lockLeave}>
                      <Plus /> 新增區間
                    </Button>
                  </div>
                  {draftSegs.length === 0 ? (
                    <p className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
                      尚無區間。若此員工目前或曾經留停/停職/暫離，按「新增區間」建立；每段可分別設定生效日與復職日。
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {draftSegs.map((seg, i) => (
                        <div key={i} className="rounded-md border p-2">
                          <div className="flex flex-wrap items-end gap-2">
                            <label className="text-xs">
                              <span className="mb-0.5 block text-muted-foreground">類別</span>
                              <Select value={seg.status} disabled={lockLeave} onValueChange={(v) => updateSeg(i, { status: v as LeaveStatus })}>
                                <SelectTrigger className="h-8 w-24"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {LEAVE_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </label>
                            <label className="text-xs">
                              <span className="mb-0.5 block text-muted-foreground">生效日</span>
                              <Input type="date" className="col-input h-8 w-36" disabled={lockLeave}
                                value={seg.from} onChange={(e) => updateSeg(i, { from: e.target.value })} />
                            </label>
                            <label className="text-xs">
                              <span className="mb-0.5 block text-muted-foreground">復職日（空＝尚未復職）</span>
                              <Input type="date" className="col-input h-8 w-36" disabled={lockLeave}
                                value={seg.to ?? ""} onChange={(e) => updateSeg(i, { to: e.target.value || null })} />
                            </label>
                            <label className="text-xs">
                              <span className="mb-0.5 block text-muted-foreground">給薪比例</span>
                              <Select value={seg.paidRatio == null ? "policy" : String(seg.paidRatio)} disabled={lockLeave}
                                onValueChange={(v) => updateSeg(i, { paidRatio: v === "policy" ? null : Number(v) })}>
                                <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="policy">沿用公司政策（{Math.round(leavePolicy[seg.status] * 100)}%）</SelectItem>
                                  <SelectItem value="0">無給（0%）</SelectItem>
                                  <SelectItem value="0.5">半薪（50%）</SelectItem>
                                  <SelectItem value="1">全薪（100%）</SelectItem>
                                </SelectContent>
                              </Select>
                            </label>
                            <Button variant="ghost" size="icon" className="ml-auto size-7 text-destructive" disabled={lockLeave}
                              onClick={() => removeSeg(i)}>
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {lockLeave && <p className="mt-1 text-xs text-muted-foreground">{LOCK_HINT}</p>}
                </div>
              )}
            </div>
          )}

          {tab === "salary" && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">
                這裡填「每月固定發放」的項目；年終、三節等一次性獎金不在這裡，請於每月結算或獎金試算時輸入。
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {SALARY_ITEMS.map((it) => <div key={it.key}>{salField(it.key, it.label, it.help)}</div>)}
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
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {empField("taxResidency", { label: "稅務身分", kind: "radio", options: RESIDENCY_OPTS, help: "該年度在台滿 183 天為居住者" })}
                {draftEmp.taxResidency === "居住者" && (
                  <>
                    {empField("withholdingMethod", { label: "每月扣繳方式", kind: "radio", options: WITHHOLD_OPTS, help: "由員工在免稅額申報表上勾選" })}
                    {empField("exemptionFormReceivedDate", { label: "免稅額申報表收件日", kind: "date", nullable: true, help: "未收件者依規定按固定 5% 扣繳" })}
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

          {!isNew && (
            <div className="mt-1 space-y-1">
              <p className="text-xs font-medium text-muted-foreground">送出前確認變更</p>
              <ChangeSummary changes={changes} onRevertField={revertField} onRevertAll={revertAll} />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>取消</Button>
            <Button onClick={save} disabled={!draftEmp.id.trim() || !draftEmp.name.trim()}>
              {isNew ? "建立員工" : "儲存變更"}
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

