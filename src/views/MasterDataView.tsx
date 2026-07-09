// 基本資料（員工主檔，/master）＝情境化維護＋異動紀錄（可稽核）。
// 設計原理（使用者拍板）：
//  - 不再用「一張大表單一次改全部」；改為**情境化申請單**：從員工檔案面板挑情境（人員異動〔到職/離職/
//    留停/復職〕、薪資結構調整、眷屬異動、扣繳設定、基本聯絡資料），只顯示該情境欄位＋必填「異動原因」，
//    送出即透過 `applyChangeTicket` 套用大表並留一筆帶 scenario/reason 的結構化稽核（可回復/匯出）。
//  - 逐欄編輯沿用 EditableField（唯讀→點欄編輯→變更標色→ChangeSummary 列舊→新）；硬鎖定：計薪情境於
//    當期已確認時擋下（contact 免鎖）。
//  - 頂部兩分頁：員工清單／異動紀錄（後者＝帶 scenario 的稽核透鏡，回復沿用既有機制）。
//  - 支援 ?emp= 深連結（工作台/每月作業跳轉直接開啟該員檔案面板）。
import { useEffect, useMemo, useRef, useState, type ReactNode, type ElementType } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { usePayrollStore, isPeriodLocked, auditRestorable, SCENARIO_LABEL, resolveSettingVersion } from "@/store/usePayrollStore";
import { DEFAULT_PARAMETERS } from "@/config/parameters";
import { DEFAULT_BRACKETS } from "@/config/brackets";
import type { Employee, SalaryStructure, Dependent, LeaveSegment, LeaveStatus, ChangeScenario, AuditEntry } from "@/lib/types";
import { monthlySalaryTotal, lookupInsuredAmounts, seniorityMonths, seniorityRefDate, formatSeniority, annualLeaveDays, isLeaveStatus } from "@/lib/calc";
import { saveBlob } from "@/lib/payslipPdf";
import { csvSerialize } from "@/lib/csv";
import { parseEmployeeCsv, IMPORT_COLUMNS, type ImportPreview } from "@/lib/import/employeeCsv";
import { cn, ntd } from "@/lib/utils";
import { HelpHint } from "@/components/HelpHint";
import { EditableField } from "@/components/form/EditableField";
import { ChangeSummary } from "@/components/form/ChangeSummary";
import { BatchSalaryPanel } from "@/views/BatchSalaryPanel";
import { TabPills } from "@/components/ui/tab-pills";
import { diffRecord, type FieldSpec, type Change, type FieldKind } from "@/lib/forms/diff";
import { Plus, Trash2, UserPlus, Upload, FileDown, Download, RotateCcw, LogOut, PauseCircle, PlayCircle, Wallet, Users, Receipt, Contact } from "lucide-react";

const LEAVE_STATUSES = ["留停", "停職", "暫離"];
const today = () => new Date().toISOString().slice(0, 10);

export type SalaryNumKey = Exclude<keyof Omit<SalaryStructure, "employeeId">, "customAllowances" | "foreignPay">;
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

const RESIDENCY_OPTS = [{ value: "居住者", label: "居住者" }, { value: "非居住者", label: "非居住者（6%／18%）" }];
const WITHHOLD_OPTS = [{ value: "固定5%", label: "固定 5%" }, { value: "依扣繳稅額表", label: "依扣繳稅額表（查表）" }];

// 送出前變更摘要用的欄位中繼（label/kind/format）；key 對映 Employee/SalaryStructure 欄位
const EMP_SPECS: FieldSpec[] = [
  { key: "name", label: "姓名", kind: "text" },
  { key: "department", label: "部門", kind: "text" },
  { key: "title", label: "職稱", kind: "text" },
  { key: "hireDate", label: "到職日", kind: "date" },
  { key: "status", label: "任職狀態", kind: "select" },
  { key: "leaveDate", label: "離職日", kind: "date" },
  { key: "voluntaryPensionRate", label: "勞退自提率", kind: "rate" },
  { key: "costCenter", label: "成本中心", kind: "text" },
  { key: "project", label: "專案別", kind: "text" },
  { key: "nationalId", label: "身分證字號", kind: "text" },
  { key: "email", label: "Email", kind: "text" },
  { key: "note", label: "備註", kind: "text" },
  { key: "taxResidency", label: "稅務身分", kind: "select" },
  { key: "withholdingMethod", label: "扣繳方式", kind: "select" },
  { key: "exemptionFormReceivedDate", label: "免稅額申報表收件日", kind: "date" },
];
const SAL_SPECS: FieldSpec[] = SALARY_ITEMS.map((it) => ({ key: it.key, label: it.label, kind: "money" as const }));
// 調職欄位（部門/職稱/成本中心/專案）＝計薪相關（影響成本分攤/報表），納入當期確認鎖。
const TRANSFER_KEYS = ["department", "title", "costCenter", "project"];
const PAY_EMP_KEYS = new Set(["hireDate", "status", "leaveDate", "returnDate", "leavePaidRatio", "voluntaryPensionRate", "taxResidency", "withholdingMethod", "exemptionFormReceivedDate", ...TRANSFER_KEYS]);
const LOCK_HINT = "本月已確認結算、此欄已鎖定；請先至「查核與確認」取消確認。";

// 各情境涵蓋的員工欄位（供 ChangeSummary 只顯示該情境的變更）
const CONTACT_KEYS = ["name", "nationalId", "email", "note"]; // 聯絡與識別（免鎖）
const WITHHOLD_KEYS = ["taxResidency", "withholdingMethod", "exemptionFormReceivedDate", "voluntaryPensionRate"];

const blankEmployee = (): Employee => ({
  id: "", name: "", department: "", title: "", hireDate: today(),
  costCenter: "", project: "", taxResidency: "居住者", withholdingMethod: "固定5%",
  exemptionFormReceivedDate: null, voluntaryPensionRate: 0, nationalId: "", email: "", status: "在職", leaveDate: null,
});
const blankSalary = (id: string): SalaryStructure => ({
  employeeId: id, baseSalary: 0, managerAllowance: 0, dutyAllowance: 0, professionalAllowance: 0,
  mealAllowance: 0, transportAllowance: 0, attendanceBonus: 0, otherFixedAllowance: 0,
});

const currentSegs = (e: Employee): LeaveSegment[] =>
  e.leaveRecords ??
  (isLeaveStatus(e.status)
    ? [{ status: e.status, from: e.leaveDate ?? "", to: e.returnDate ?? null, paidRatio: e.leavePaidRatio ?? null }]
    : []);
const openSegment = (e: Employee) => currentSegs(e).find((s) => s.to == null);

/** 情境：8 種申請單（含 onboard 到職＝新增員工）。 */
type Scenario = ChangeScenario;
type TopTab = "list" | "batch" | "log";

export function MasterDataView() {
  const {
    employees, salaries, dependents, parameterVersions, bracketVersions,
    applyChangeTicket, removeEmployee, importEmployees,
    currentPeriod, confirmations, leavePolicy, salaryDefaults,
    auditLog, restoreAudit, fxPolicy, currencies,
  } = usePayrollStore();
  const parameters = resolveSettingVersion(parameterVersions, currentPeriod, DEFAULT_PARAMETERS);
  const brackets = resolveSettingVersion(bracketVersions, currentPeriod, DEFAULT_BRACKETS);
  const locked = Boolean(confirmations[currentPeriod]); // 硬鎖定：當期已確認

  const [topTab, setTopTab] = useState<TopTab>("list");
  const [importOpen, setImportOpen] = useState(false);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  // 員工檔案面板／情境表單狀態
  const [profileEmp, setProfileEmp] = useState<Employee | null>(null); // 開啟中的員工（null＝關閉）
  const [scenario, setScenario] = useState<Scenario | null>(null); // 進行中的情境表單（null＝顯示檔案摘要）
  const [reason, setReason] = useState("");
  const [draftEmp, setDraftEmp] = useState<Employee>(blankEmployee());
  const [draftSalary, setDraftSalary] = useState<SalaryStructure>(blankSalary(""));
  const [draftDeps, setDraftDeps] = useState<Dependent[]>([]);
  const isNew = scenario === "onboard";

  const downloadTemplate = () => {
    const sample = ["E999", "範例員工", "資訊部", "工程師", "2026-01-01", "A123456789", "name@example.com", "居住者", "固定5%", "0", "40000", "0", "0", "0", "3000", "0", "0", "0"];
    saveBlob(new Blob([csvSerialize([...IMPORT_COLUMNS], [sample])], { type: "text/csv;charset=utf-8" }), "員工匯入模板.csv");
  };
  const onImportFile = async (file: File) => {
    setPreview(parseEmployeeCsv(await file.text(), parameters.minWageMonthly));
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

  const loadDrafts = (emp: Employee) => {
    setDraftEmp({ ...emp });
    setDraftSalary({ ...(salaries.find((s) => s.employeeId === emp.id) ?? blankSalary(emp.id)) });
    setDraftDeps(dependents.filter((d) => d.employeeId === emp.id).map((d) => ({ ...d })));
  };
  const openProfile = (emp: Employee) => { setProfileEmp(emp); setScenario(null); setReason(""); loadDrafts(emp); };
  const closeProfile = () => { setProfileEmp(null); setScenario(null); };
  const openOnboard = () => {
    setProfileEmp(null);
    setDraftEmp(blankEmployee());
    setDraftSalary({
      ...blankSalary(""),
      ...salaryDefaults.standard,
      customAllowances: salaryDefaults.custom.map((c) => ({ id: `CA${Date.now()}${Math.random().toString(36).slice(2, 6)}`, name: c.name, amount: c.amount })),
    });
    setDraftDeps([]);
    setReason("");
    setScenario("onboard");
  };

  // 挑情境：先以最新 store 值重載草稿（避免上一情境未送出的殘留），再依情境預帶
  const pickScenario = (s: Scenario) => {
    if (!profileEmp) return;
    const fresh = employees.find((e) => e.id === profileEmp.id) ?? profileEmp;
    loadDrafts(fresh);
    setReason("");
    if (s === "terminate") setDraftEmp((d) => ({ ...d, status: "離職", leaveDate: d.leaveDate ?? today() }));
    if (s === "leave") setDraftEmp((d) => ({ ...d, status: "留停", leaveRecords: [...currentSegs(d), { status: "留停", from: today(), to: null, paidRatio: null }] }));
    setScenario(s);
  };
  const backToProfile = () => { if (profileEmp) { const fresh = employees.find((e) => e.id === profileEmp.id) ?? profileEmp; setProfileEmp(fresh); } setScenario(null); };

  const setEmp = <K extends keyof Employee>(k: K, v: Employee[K]) => setDraftEmp((d) => ({ ...d, [k]: v }));

  // B-1 多段區間編輯（供 leave/reinstate 情境）
  const draftSegs = currentSegs(draftEmp);
  const setSegs = (updater: (segs: LeaveSegment[]) => LeaveSegment[]) => setDraftEmp((d) => ({ ...d, leaveRecords: updater(currentSegs(d)) }));
  const updateSeg = (i: number, patch: Partial<LeaveSegment>) => setSegs((segs) => segs.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const removeSeg = (i: number) => setSegs((segs) => segs.filter((_, j) => j !== i));
  const addSeg = () => setSegs((segs) => [...segs, { status: "留停" as LeaveStatus, from: today(), to: null, paidRatio: null }]);

  // 原始記錄（供逐欄比對/標色/還原）；onboard 無原始
  const origEmp = isNew ? undefined : employees.find((e) => e.id === draftEmp.id);
  const origSalary = isNew ? undefined : salaries.find((s) => s.employeeId === draftEmp.id);
  const origDeps = isNew ? [] : dependents.filter((d) => d.employeeId === draftEmp.id);
  // 計薪情境於鎖定期禁改；contact 免鎖
  const payScenario = scenario != null && scenario !== "contact";
  const lockEmp = (k: string) => locked && !isNew && payScenario && PAY_EMP_KEYS.has(k);
  const lockSal = locked && !isNew;
  const lockLeave = locked && !isNew;

  // 送出前變更摘要（依情境過濾欄位）
  const empChanges = origEmp ? diffRecord(origEmp as unknown as Record<string, unknown>, draftEmp as unknown as Record<string, unknown>, EMP_SPECS) : [];
  const salChanges = origSalary ? diffRecord(origSalary as unknown as Record<string, unknown>, draftSalary as unknown as Record<string, unknown>, SAL_SPECS) : [];
  const caKey = (ca?: { name: string; amount: number }[]) => JSON.stringify((ca ?? []).map((c) => ({ name: c.name, amount: c.amount })));
  const caChanged = !isNew && caKey(origSalary?.customAllowances) !== caKey(draftSalary.customAllowances);
  const depKey = (ds: Dependent[]) => JSON.stringify(ds.map((d) => ({ name: d.name, relationship: d.relationship, hi: d.enrolledInHealthInsurance, tax: d.taxDependent })));
  const depsChanged = !isNew && depKey(origDeps) !== depKey(draftDeps);
  const segKey = (segs: LeaveSegment[]) => JSON.stringify(segs.map((s) => ({ s: s.status, f: s.from, t: s.to ?? null, r: s.paidRatio ?? null })));
  const leaveChanged = !isNew && !!origEmp && segKey(currentSegs(origEmp)) !== segKey(draftSegs);

  const changes: Change[] = useMemo(() => {
    const list: Change[] = [];
    if (scenario === "salary") {
      list.push(...salChanges);
      if (caChanged) list.push({ field: "__ca__", label: "自訂津貼", before: null, after: null, beforeText: `${origSalary?.customAllowances?.length ?? 0} 項`, afterText: `${draftSalary.customAllowances?.length ?? 0} 項` });
    } else if (scenario === "dependents") {
      if (depsChanged) list.push({ field: "__deps__", label: "眷屬名單", before: null, after: null, beforeText: `${origDeps.length} 人`, afterText: `${draftDeps.length} 人` });
    } else if (scenario === "leave" || scenario === "reinstate") {
      list.push(...empChanges.filter((c) => c.field === "status"));
      if (leaveChanged) list.push({ field: "__leave__", label: "留停/停職/暫離 區間", before: null, after: null, beforeText: `${origEmp ? currentSegs(origEmp).length : 0} 段`, afterText: `${draftSegs.length} 段` });
    } else if (scenario === "terminate") {
      list.push(...empChanges.filter((c) => c.field === "status" || c.field === "leaveDate"));
    } else if (scenario === "contact") {
      list.push(...empChanges.filter((c) => CONTACT_KEYS.includes(c.field)));
    } else if (scenario === "transfer") {
      list.push(...empChanges.filter((c) => TRANSFER_KEYS.includes(c.field)));
    } else if (scenario === "withholding") {
      list.push(...empChanges.filter((c) => WITHHOLD_KEYS.includes(c.field)));
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario, JSON.stringify(draftEmp), JSON.stringify(draftSalary), JSON.stringify(draftDeps)]);

  const revertField = (field: string) => {
    if (field === "__ca__") { setDraftSalary((s) => ({ ...s, customAllowances: origSalary?.customAllowances?.map((c) => ({ ...c })) })); return; }
    if (field === "__deps__") { setDraftDeps(origDeps.map((d) => ({ ...d }))); return; }
    if (field === "__leave__") { setDraftEmp((d) => ({ ...d, status: origEmp?.status, leaveRecords: origEmp?.leaveRecords })); return; }
    if (SAL_SPECS.some((s) => s.key === field)) { setDraftSalary((s) => ({ ...s, [field]: (origSalary as Record<string, unknown> | undefined)?.[field] ?? 0 })); return; }
    setDraftEmp((d) => ({ ...d, [field]: (origEmp as Record<string, unknown> | undefined)?.[field] ?? null }));
  };
  const revertAll = () => { if (origEmp) setDraftEmp({ ...origEmp }); if (origSalary) setDraftSalary({ ...origSalary }); setDraftDeps(origDeps.map((d) => ({ ...d }))); };

  // 員工欄位（唯讀預設；onboard alwaysEdit）
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

  // 深連結 ?emp=E001（開該員檔案）／?tab=batch（開批次薪資分頁，供規劃頁 CTA 導向）
  const [searchParams, setSearchParams] = useSearchParams();
  const empParam = searchParams.get("emp");
  const tabParam = searchParams.get("tab");
  useEffect(() => {
    if (!empParam && !tabParam) return;
    if (empParam) { const target = employees.find((e) => e.id === empParam); if (target) openProfile(target); }
    if (tabParam === "batch" || tabParam === "log") setTopTab(tabParam);
    setSearchParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empParam, tabParam]);

  const draftTotal = monthlySalaryTotal(draftSalary);
  const draftInsured = lookupInsuredAmounts(brackets, draftTotal);
  const healthDeps = draftDeps.filter((d) => d.enrolledInHealthInsurance).length;
  const taxDeps = draftDeps.filter((d) => d.taxDependent).length;

  const addDep = () =>
    setDraftDeps((ds) => [...ds, { id: `D${Date.now()}${ds.length}`, employeeId: draftEmp.id, name: "", relationship: "配偶", birthDate: "", nationalId: "", enrolledInHealthInsurance: true, taxDependent: true }]);

  // ── 送出（依情境呼叫 applyChangeTicket）─────────────────────────
  const changeSummaryText = () => changes.map((c) => `${c.label} ${c.beforeText}→${c.afterText}`).join("；");
  const canSubmit = reason.trim().length > 0 && (isNew || changes.length > 0);
  const guardLock = () => {
    if (payScenario && locked) {
      alert(`本月（${currentPeriod}）已確認結算，此類異動已鎖定。\n請先至「每月作業 → 查核與確認」取消確認再辦理。`);
      return false;
    }
    return true;
  };
  const submit = () => {
    if (!scenario || !canSubmit) return;
    const id = draftEmp.id.trim();
    if (scenario === "onboard") {
      if (!id || !draftEmp.name.trim()) { alert("請填員工編號與姓名。"); return; }
      if (employees.some((e) => e.id === id)) { alert(`員工編號「${id}」已存在（${employees.find((e) => e.id === id)?.name}）。`); return; }
      applyChangeTicket({ scenario: "onboard", employeeId: id, reason, summary: `新增員工 ${draftEmp.name}（${id}）`, newEmployee: { ...draftEmp, id }, salary: { ...draftSalary, employeeId: id }, dependents: draftDeps.map((d) => ({ ...d, employeeId: id })) });
      closeProfile();
      return;
    }
    if (!guardLock()) return;
    if (scenario === "salary") { applyChangeTicket({ scenario, employeeId: id, reason, summary: changeSummaryText(), salary: { ...draftSalary, employeeId: id } }); backToProfile(); return; }
    if (scenario === "dependents") { applyChangeTicket({ scenario, employeeId: id, reason, summary: changeSummaryText(), dependents: draftDeps.map((d) => ({ ...d, employeeId: id })) }); backToProfile(); return; }
    // 員工類：contact / withholding / terminate / leave / reinstate
    let employee = { ...draftEmp, id };
    let summary = changeSummaryText();
    let effectivePeriod: string | undefined;
    if (scenario === "leave" || scenario === "reinstate") {
      // 狀態依開放區間自動衍生：仍有開放段→該段狀態；全數關閉→在職。
      const os = openSegment(employee);
      employee = { ...employee, status: os ? os.status : "在職" };
      if (scenario === "leave" && os) { summary = `辦理${os.status}（${os.from} 起${os.paidRatio != null ? `・給薪 ${Math.round(os.paidRatio * 100)}%` : ""}）`; effectivePeriod = os.from.slice(0, 7) || undefined; }
      if (scenario === "reinstate") { const closed = currentSegs(employee).filter((s) => s.to).sort((a, b) => (a.to! < b.to! ? 1 : -1))[0]; summary = `辦理復職${closed?.to ? `（${closed.to}）` : ""}`; effectivePeriod = closed?.to?.slice(0, 7) || undefined; }
    }
    if (scenario === "terminate") effectivePeriod = (draftEmp.leaveDate ?? "").slice(0, 7) || undefined;
    applyChangeTicket({ scenario, employeeId: id, reason, summary, employee, effectivePeriod });
    backToProfile();
  };

  // ── 員工清單 ─────────────────────────────────────────────────
  type EmpRow = { emp: Employee; total: number; months: number; leaveDays: number; hd: number; td: number; lowWage: boolean; noForm: boolean };
  const empRows: EmpRow[] = employees.map((emp) => {
    const s = salaries.find((x) => x.employeeId === emp.id) ?? blankSalary(emp.id);
    const total = monthlySalaryTotal(s);
    const months = seniorityMonths(emp.hireDate, seniorityRefDate(parameters.seniorityBasis, parameters.seniorityBaseDate, currentPeriod));
    return {
      emp, total, months, leaveDays: annualLeaveDays(months),
      hd: dependents.filter((d) => d.employeeId === emp.id && d.enrolledInHealthInsurance).length,
      td: dependents.filter((d) => d.employeeId === emp.id && d.taxDependent).length,
      lowWage: total < parameters.minWageMonthly,
      noForm: emp.taxResidency === "居住者" && !emp.exemptionFormReceivedDate,
    };
  });
  const empColumns: Column<EmpRow>[] = [
    { key: "name", header: "員工", freeze: true, sortValue: (r) => r.emp.name, filterText: (r) => `${r.emp.name} ${r.emp.id}`, cell: (r) => (<><span className="font-medium">{r.emp.name}</span><span className="ml-1.5 text-xs text-muted-foreground">{r.emp.id}</span></>) },
    { key: "dept", header: "部門／職稱", sortValue: (r) => r.emp.department, filterText: (r) => `${r.emp.department} ${r.emp.title}`, cell: (r) => (<span className="text-sm">{r.emp.department}{r.emp.title && <span className="text-muted-foreground">・{r.emp.title}</span>}</span>) },
    { key: "hire", header: "到職日", sortValue: (r) => r.emp.hireDate, cell: (r) => <span className="text-sm">{r.emp.hireDate}</span> },
    { key: "sen", header: "年資", numeric: true, sortValue: (r) => r.months, cell: (r) => <span className="text-sm">{formatSeniority(r.months)}</span> },
    { key: "leave", header: "特休", numeric: true, sortValue: (r) => r.leaveDays, cell: (r) => <span className="text-sm">{r.leaveDays} 天</span> },
    { key: "total", header: "月薪總額", numeric: true, sortValue: (r) => r.total, cell: (r) => <span className="font-medium">{ntd(r.total)}</span>, total: (rs) => ntd(rs.reduce((a, r) => a + r.total, 0)) },
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
      key: "ops", header: "", headerClassName: "w-10",
      cell: (r) => (
        <Button variant="ghost" size="icon" className="size-7 text-destructive" onClick={(e) => { e.stopPropagation(); if (confirm(`刪除 ${r.emp.name} 的所有資料（含薪資、眷屬與結算紀錄）？`)) removeEmployee(r.emp.id); }}><Trash2 className="size-3.5" /></Button>
      ),
    },
  ];

  // ── 異動紀錄（帶 scenario 的稽核透鏡）──────────────────────────
  const nameById = useMemo(() => new Map(employees.map((e) => [e.id, e.name])), [employees]);
  type LogRow = AuditEntry;
  const logRows = useMemo(() => auditLog.filter((a) => a.scenario), [auditLog]);
  const logColumns: Column<LogRow>[] = [
    { key: "at", header: "時間", sortValue: (a) => a.at, cell: (a) => <span className="text-xs text-muted-foreground">{new Date(a.at).toLocaleString()}</span> },
    { key: "emp", header: "員工", sortValue: (a) => a.targetId ?? "", filterText: (a) => `${a.targetId ?? ""} ${nameById.get(a.targetId ?? "") ?? ""}`, cell: (a) => <span className="text-sm">{nameById.get(a.targetId ?? "") ?? a.targetId}</span> },
    { key: "scenario", header: "情境", sortValue: (a) => a.scenario ?? "", filterText: (a) => SCENARIO_LABEL[a.scenario!] ?? "", cell: (a) => <Badge variant="secondary">{SCENARIO_LABEL[a.scenario!]}</Badge> },
    { key: "reason", header: "原因", sortValue: (a) => a.reason ?? "", filterText: (a) => a.reason ?? "", cell: (a) => <span className="text-sm">{a.reason || "—"}</span> },
    { key: "summary", header: "摘要", filterText: (a) => a.summary, cell: (a) => <span className="text-xs text-muted-foreground">{a.summary}</span> },
    { key: "actor", header: "操作者", sortValue: (a) => a.actor, cell: (a) => <span className="text-sm">{a.actor}</span> },
    {
      key: "restore", header: "", headerClassName: "w-20",
      cell: (a) => {
        if (!auditRestorable(a)) return null;
        const rowLocked = isPeriodLocked(confirmations, currentPeriod);
        return (
          <Button variant="outline" size="sm" className="tap-target h-7" disabled={rowLocked}
            title={rowLocked ? "該期已確認鎖定，請先取消確認再回復" : "把此筆變更還原成變更前的值"}
            onClick={() => { if (confirm(`確定回復此筆變更？\n\n${a.summary}\n\n將還原成變更前的值，並另記一筆稽核。`)) restoreAudit(a.id); }}>
            <RotateCcw className="size-3.5" /> 回復
          </Button>
        );
      },
    },
  ];
  const exportLog = () => {
    saveBlob(new Blob([csvSerialize(["時間", "員工", "情境", "原因", "摘要", "操作者"],
      logRows.map((a) => [new Date(a.at).toLocaleString(), nameById.get(a.targetId ?? "") ?? a.targetId ?? "", SCENARIO_LABEL[a.scenario!] ?? "", a.reason ?? "", a.summary, a.actor]))],
      { type: "text/csv;charset=utf-8" }), "異動紀錄.csv");
  };

  // 檔案面板可辦理的情境（依目前狀態）
  const prof = profileEmp ? (employees.find((e) => e.id === profileEmp.id) ?? profileEmp) : null;
  const profOpenSeg = prof ? openSegment(prof) : undefined;
  const profTerminated = prof?.status === "離職";

  const SC_ICON: Partial<Record<Scenario, ElementType>> = { salary: Wallet, dependents: Users, withholding: Receipt, contact: Contact, terminate: LogOut, leave: PauseCircle, reinstate: PlayCircle };
  const scenarioBtn = (s: Scenario, label: string, variant: "outline" | "default" = "outline") => {
    const Icon = SC_ICON[s];
    return <Button key={s} variant={variant} size="sm" onClick={() => pickScenario(s)}>{Icon && <Icon className="size-4" />} {label}</Button>;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-bold">基本資料 <HelpHint id="master" /></h1>
          <p className="text-sm text-muted-foreground">員工檔案依「情境」維護：挑情境→只填該情境欄位＋異動原因→送出更新並留可稽核紀錄。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={downloadTemplate}><FileDown /> 匯入模板</Button>
          <input ref={importFileRef} type="file" accept="application/json,.csv,text/csv" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onImportFile(f); e.target.value = ""; }} />
          <Button variant="outline" size="sm" onClick={() => importFileRef.current?.click()}><Upload /> 批次匯入</Button>
          <Button size="sm" onClick={openOnboard}><UserPlus /> 新進到職</Button>
        </div>
      </div>

      <div data-tour="master-tabs"><TabPills
        tabs={[{ key: "list", label: "員工清單" }, { key: "batch", label: "批次薪資" }, { key: "log", label: `異動紀錄${logRows.length ? `（${logRows.length}）` : ""}` }]}
        value={topTab}
        onChange={(k) => setTopTab(k as TopTab)}
      /></div>

      {topTab === "list" && (
        <Card data-tour="master-emp-list">
          <CardContent className="pt-6">
            <DataTable
              rows={empRows} columns={empColumns} getRowKey={(r) => r.emp.id}
              initialSort={{ key: "name", dir: "asc" }} searchPlaceholder="搜尋姓名／編號／部門…"
              onRowClick={(r) => openProfile(r.emp)}
              empty={{ title: "尚未建立員工", hint: "按右上角「新進到職」開始，或到「系統設定 → 資料與安全」載入示範公司資料。", action: <Button size="sm" onClick={openOnboard}><UserPlus /> 新進到職</Button> }}
            />
          </CardContent>
        </Card>
      )}

      {topTab === "batch" && <BatchSalaryPanel />}

      {topTab === "log" && (
        <Card>
          <CardContent className="space-y-2 pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">基本資料的每次情境異動（含原因、前後值、操作者）；可逐筆回復（回復另記一筆）。</p>
              {logRows.length > 0 && <Button variant="outline" size="sm" onClick={exportLog}><Download /> 匯出 CSV</Button>}
            </div>
            <DataTable
              rows={logRows} columns={logColumns} getRowKey={(a) => a.id}
              initialSort={{ key: "at", dir: "desc" }} searchPlaceholder="搜尋員工／情境／原因…"
              empty={{ title: "尚無異動紀錄", hint: "從員工清單開啟員工、辦理任一情境異動後，這裡會留下可稽核的紀錄。" }}
            />
          </CardContent>
        </Card>
      )}

      {/* 員工檔案面板：摘要＋情境動作鈕；挑情境後於同一視窗顯示聚焦表單 */}
      <Dialog open={!!profileEmp || isNew} onOpenChange={(o) => { if (!o) closeProfile(); }}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isNew ? "新進到職（新增員工）" : scenario ? `${SCENARIO_LABEL[scenario]}・${prof?.name}` : `${prof?.name} 的員工檔案`}
            </DialogTitle>
          </DialogHeader>

          {/* 檔案摘要＋情境選單（未進入情境時） */}
          {!scenario && prof && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 rounded-md border bg-muted/30 p-3 text-sm sm:grid-cols-3">
                <Info label="員工編號" value={prof.id} />
                <Info label="部門／職稱" value={`${prof.department}${prof.title ? `・${prof.title}` : ""}`} />
                <Info label="到職日" value={prof.hireDate} />
                <Info label="任職狀態" value={<>{prof.status ?? "在職"}{profOpenSeg && <span className="text-muted-foreground">（{profOpenSeg.from} 起）</span>}{profTerminated && prof.leaveDate && <span className="text-muted-foreground">（{prof.leaveDate}）</span>}</>} />
                <Info label="月薪資總額" value={ntd(monthlySalaryTotal(salaries.find((s) => s.employeeId === prof.id) ?? blankSalary(prof.id)))} />
                <Info label="眷屬（健保/扶養）" value={`${dependents.filter((d) => d.employeeId === prof.id && d.enrolledInHealthInsurance).length}／${dependents.filter((d) => d.employeeId === prof.id && d.taxDependent).length}`} />
                <Info label="稅務身分" value={prof.taxResidency} />
                <Info label="扣繳方式" value={prof.taxResidency === "居住者" ? prof.withholdingMethod : "非居住者"} />
              </div>

              <div className="space-y-3">
                <div>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">人員異動</p>
                  <div className="flex flex-wrap gap-2">
                    {!profTerminated && !profOpenSeg && scenarioBtn("leave", "留停／停職／暫離")}
                    {!!profOpenSeg && scenarioBtn("reinstate", "復職")}
                    {!profTerminated && scenarioBtn("terminate", "離職")}
                    {profTerminated && <span className="text-xs text-muted-foreground">此員工已離職（如需更正請由聯絡資料/薪資情境處理）。</span>}
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">資料維護</p>
                  <div className="flex flex-wrap gap-2">
                    {scenarioBtn("salary", "薪資結構調整")}
                    {scenarioBtn("transfer", "調職／部門異動")}
                    {scenarioBtn("dependents", "眷屬異動")}
                    {scenarioBtn("withholding", "扣繳設定")}
                    {scenarioBtn("contact", "聯絡與識別")}
                  </div>
                </div>
              </div>
              {locked && <p className="rounded-md border border-warning/30 bg-warning/10 p-2 text-xs text-warning">本月（{currentPeriod}）已確認結算：計薪相關情境（人員異動／薪資／眷屬／扣繳）暫時鎖定，僅「基本聯絡資料」可修改。請先於查核頁取消確認。</p>}
              <DialogFooter>
                <Button variant="outline" onClick={closeProfile}>關閉</Button>
              </DialogFooter>
            </div>
          )}

          {/* 情境聚焦表單 */}
          {scenario && (
            <div className="space-y-4">
              {/* onboard：基本＋薪資＋眷屬（新增） */}
              {scenario === "onboard" && (
                <>
                  <SectionTitle>基本資料</SectionTitle>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <EditableField label="員工編號 *" kind="text" value={draftEmp.id} alwaysEdit disabled={false} trackChanges={false} onChange={(v) => setEmp("id", String(v))} />
                    {empField("name", { label: "姓名 *", kind: "text" })}
                    {empField("department", { label: "部門", kind: "text" })}
                    {empField("title", { label: "職稱", kind: "text" })}
                    {empField("hireDate", { label: "到職日", kind: "date", help: "用於年資與特休；到職當月固定薪資按比例（破月）" })}
                    {empField("nationalId", { label: "身分證字號", kind: "text", placeholder: "A123456789", help: "薪資條加密 PDF 密碼；英文大寫" })}
                    {empField("email", { label: "Email", kind: "text", placeholder: "name@example.com" })}
                  </div>
                  <SectionTitle>固定薪資項目</SectionTitle>
                  {salaryForm()}
                  <SectionTitle>眷屬與扣繳</SectionTitle>
                  {withholdingFields()}
                  {dependentsForm()}
                </>
              )}

              {scenario === "transfer" && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">調職／部門異動：部門、職稱、成本中心、專案別。<strong>影響成本分攤與匯總報表分類，屬計薪相關</strong>——當月已確認時鎖定，須先取消確認。</p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {empField("department", { label: "部門", kind: "text" })}
                    {empField("title", { label: "職稱", kind: "text" })}
                    {empField("costCenter", { label: "成本中心（選填）", kind: "text", help: "供匯總報表分類" })}
                    {empField("project", { label: "專案別（選填）", kind: "text", help: "供匯總報表分類" })}
                  </div>
                </div>
              )}

              {scenario === "contact" && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {empField("name", { label: "姓名", kind: "text" })}
                  {empField("nationalId", { label: "身分證字號", kind: "text", placeholder: "A123456789", help: "薪資條加密 PDF 密碼；英文大寫" })}
                  {empField("email", { label: "Email", kind: "text", placeholder: "name@example.com" })}
                  {empField("note", { label: "備註", kind: "text", nullable: true })}
                </div>
              )}

              {scenario === "withholding" && withholdingFields()}

              {scenario === "salary" && salaryForm()}

              {scenario === "dependents" && dependentsForm()}

              {scenario === "terminate" && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">辦理離職：狀態改為「離職」、計至離職日（含），當月固定薪資按在職天數破月、名冊列入退保。</p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {empField("leaveDate", { label: "離職日 *", kind: "date", nullable: true })}
                  </div>
                </div>
              )}

              {(scenario === "leave" || scenario === "reinstate") && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {scenario === "leave" ? "辦理留停／停職／暫離：登記一段非在職期間（生效日、給薪比例）；復職日留白＝尚未復職。" : "辦理復職：於開放區間補填復職日；復職後自動恢復在職與全額計薪。"}
                  </p>
                  {segmentEditor()}
                </div>
              )}

              {/* 異動原因（申請單）＋變更摘要＋送出 */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium">異動原因 *</label>
                <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder={isNew ? "例：新進到職報到" : "例：年度調薪／自請離職／更新聯絡資料"} className="col-input" />
              </div>
              {!isNew && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">送出前確認變更</p>
                  <ChangeSummary changes={changes} onRevertField={revertField} onRevertAll={revertAll} />
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => (isNew ? closeProfile() : backToProfile())}>{isNew ? "取消" : "返回"}</Button>
                <Button onClick={submit} disabled={!canSubmit}>{isNew ? "建立員工" : "送出異動"}</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 批次匯入預覽 */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader><DialogTitle>批次匯入員工（預覽）</DialogTitle></DialogHeader>
          {preview && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="success">可匯入 {preview.valid.length} 筆</Badge>
                {preview.issues.some((i) => i.level === "error") && (<Badge variant="destructive">錯誤 {preview.issues.filter((i) => i.level === "error").length} 項（需修正後重匯）</Badge>)}
                {preview.issues.some((i) => i.level === "warning") && (<Badge variant="warning">提醒 {preview.issues.filter((i) => i.level === "warning").length} 項</Badge>)}
                <span className="text-xs text-muted-foreground">同編號將覆蓋既有員工。</span>
              </div>
              <DataTable
                rows={preview.rows} getRowKey={(r) => String(r.row)} maxHeight="max-h-[50vh]" searchPlaceholder="搜尋編號／姓名…"
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
            <Button onClick={commitImport} disabled={!preview || preview.hasError || preview.valid.length === 0}>確認匯入 {preview?.valid.length ?? 0} 筆</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  // ── 情境表單片段（closure 重用 draft/helpers）──────────────────
  function withholdingFields() {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {empField("taxResidency", { label: "稅務身分", kind: "radio", options: RESIDENCY_OPTS, help: "該年度在台滿 183 天為居住者" })}
        {draftEmp.taxResidency === "居住者" && (
          <>
            {empField("withholdingMethod", { label: "每月扣繳方式", kind: "radio", options: WITHHOLD_OPTS, help: "由員工在免稅額申報表上勾選" })}
            {empField("exemptionFormReceivedDate", { label: "免稅額申報表收件日", kind: "date", nullable: true, help: "未收件者依規定按固定 5% 扣繳" })}
          </>
        )}
        {empField("voluntaryPensionRate", { label: "勞退自願提繳率", kind: "rate", help: "0～6%，此金額免稅" })}
      </div>
    );
  }

  function salaryForm() {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SALARY_ITEMS.map((it) => <div key={it.key}>{salField(it.key, it.label, it.help)}</div>)}
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">自訂固定津貼</p>
              <p className="text-xs text-muted-foreground">8 項標準項目外的每月固定津貼，可自行命名；皆屬工資、計入月薪資總額與投保級距。</p>
            </div>
            <Button variant="outline" size="sm" disabled={lockSal} onClick={() => setDraftSalary((s) => ({ ...s, customAllowances: [...(s.customAllowances ?? []), { id: `CA${Date.now()}${(s.customAllowances?.length ?? 0)}`, name: "", amount: 0 }] }))}><Plus /> 新增津貼</Button>
          </div>
          {(draftSalary.customAllowances?.length ?? 0) === 0 ? (
            <p className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">無自訂津貼。如語言津貼、值班津貼、危險津貼等，按「新增津貼」命名建立。</p>
          ) : (
            <div className="space-y-2">
              {(draftSalary.customAllowances ?? []).map((c, i) => (
                <div key={c.id} className="flex flex-wrap items-center gap-2 rounded-md border p-2">
                  <Input placeholder="津貼名稱（如語言津貼）" className="col-input h-8 w-44" disabled={lockSal} value={c.name}
                    onChange={(e) => setDraftSalary((s) => ({ ...s, customAllowances: (s.customAllowances ?? []).map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) }))} />
                  <Input type="number" placeholder="金額" className="col-input h-8 w-28 text-right tabular-nums" disabled={lockSal} value={c.amount || ""}
                    onChange={(e) => setDraftSalary((s) => ({ ...s, customAllowances: (s.customAllowances ?? []).map((x, j) => (j === i ? { ...x, amount: Number(e.target.value) || 0 } : x)) }))} />
                  <Button variant="ghost" size="icon" className="ml-auto size-7 text-destructive" disabled={lockSal}
                    onClick={() => setDraftSalary((s) => ({ ...s, customAllowances: (s.customAllowances ?? []).filter((_, j) => j !== i) }))}><Trash2 className="size-3.5" /></Button>
                </div>
              ))}
            </div>
          )}
        </div>
        {fxPolicy.enabled && currencies.some((c) => c.enabled) && (
          <div className="space-y-2 rounded-md border p-3">
            <div>
              <p className="text-sm font-medium">固定每月外幣（選填）</p>
              <p className="text-xs text-muted-foreground">與台幣分開計算、視作獎金；<strong>不計入月薪資總額與勞健保投保</strong>。每月自動帶入，可於月結逐月微調。</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={draftSalary.foreignPay?.currency ?? "__none"} disabled={lockSal}
                onValueChange={(v) => setDraftSalary((s) => ({ ...s, foreignPay: v === "__none" ? undefined : { currency: v, amount: s.foreignPay?.amount ?? 0 } }))}>
                <SelectTrigger className="col-input h-8 w-40"><SelectValue placeholder="無外幣" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">無外幣</SelectItem>
                  {currencies.filter((c) => c.enabled).map((c) => <SelectItem key={c.code} value={c.code}>{c.code}（{c.name}）</SelectItem>)}
                </SelectContent>
              </Select>
              {draftSalary.foreignPay && (
                <Input type="number" className="col-input h-8 w-36 text-right tabular-nums" placeholder="每月金額" disabled={lockSal}
                  value={draftSalary.foreignPay.amount || ""}
                  onChange={(e) => setDraftSalary((s) => ({ ...s, foreignPay: { currency: s.foreignPay?.currency ?? "", amount: Number(e.target.value) || 0 } }))} />
              )}
            </div>
          </div>
        )}
        <div className="rounded-md border bg-muted/40 p-3 text-sm">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
            <span>月薪資總額：<span className="font-bold tabular-nums">{ntd(draftTotal)}</span> 元</span>
            {draftTotal > 0 && draftTotal < parameters.minWageMonthly && (<Badge variant="destructive">低於最低工資 {ntd(parameters.minWageMonthly)}</Badge>)}
          </div>
          {draftTotal > 0 && (<p className="mt-1.5 text-xs text-muted-foreground">依此薪資自動投保：勞保 {ntd(draftInsured.labor)}・職保 {ntd(draftInsured.occupational)}・健保 {ntd(draftInsured.health)}・勞退 {ntd(draftInsured.pension)}</p>)}
        </div>
      </div>
    );
  }

  function dependentsForm() {
    return (
      <div>
        <div className="mb-2 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">眷屬名單</p>
            <p className="text-xs text-muted-foreground">「依附健保」影響員工自付健保費（最多計 3 口）；「報稅扶養」影響所得稅起扣點——兩者可分開勾選。</p>
          </div>
          <Button variant="outline" size="sm" onClick={addDep}><Plus /> 新增眷屬</Button>
        </div>
        {draftDeps.length === 0 ? (
          <p className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">無眷屬。若員工的配偶、子女或父母依附在其健保下，或申報為扶養親屬，請新增。</p>
        ) : (
          <div className="space-y-2">
            {draftDeps.map((d, i) => (
              <div key={d.id} className="flex flex-wrap items-center gap-2 rounded-md border p-2">
                <Input placeholder="姓名" className="col-input h-8 w-28" value={d.name}
                  onChange={(e) => setDraftDeps((ds) => ds.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                <Select value={d.relationship} onValueChange={(v) => setDraftDeps((ds) => ds.map((x, j) => (j === i ? { ...x, relationship: v } : x)))}>
                  <SelectTrigger className="h-8 w-24"><SelectValue /></SelectTrigger>
                  <SelectContent>{["配偶", "子女", "父母", "祖父母", "其他"].map((r) => (<SelectItem key={r} value={r}>{r}</SelectItem>))}</SelectContent>
                </Select>
                <label className="flex items-center gap-1.5 text-xs"><Checkbox checked={d.enrolledInHealthInsurance} onCheckedChange={(v) => setDraftDeps((ds) => ds.map((x, j) => (j === i ? { ...x, enrolledInHealthInsurance: v === true } : x)))} />依附健保</label>
                <label className="flex items-center gap-1.5 text-xs"><Checkbox checked={d.taxDependent} onCheckedChange={(v) => setDraftDeps((ds) => ds.map((x, j) => (j === i ? { ...x, taxDependent: v === true } : x)))} />報稅扶養</label>
                <Button variant="ghost" size="icon" className="ml-auto size-7 text-destructive" onClick={() => setDraftDeps((ds) => ds.filter((_, j) => j !== i))}><Trash2 className="size-3.5" /></Button>
              </div>
            ))}
          </div>
        )}
        {draftDeps.length > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">統計：依附健保 {healthDeps} 口{healthDeps > parameters.healthDependentCap && `（自付保費以 ${parameters.healthDependentCap} 口計）`}・報稅扶養 {taxDeps} 人</p>
        )}
      </div>
    );
  }

  function segmentEditor() {
    return (
      <div>
        <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
          <p className="text-xs text-muted-foreground">可登記多段非在職期間，每段各自的類別、生效日、復職日與給薪比例；破月計薪與停保/復保名冊皆逐段計算。</p>
          <Button variant="outline" size="sm" onClick={addSeg} disabled={lockLeave}><Plus /> 新增區間</Button>
        </div>
        {draftSegs.length === 0 ? (
          <p className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">尚無區間。按「新增區間」建立；每段可分別設定生效日與復職日。</p>
        ) : (
          <div className="space-y-2">
            {draftSegs.map((seg, i) => (
              <div key={i} className="rounded-md border p-2">
                <div className="flex flex-wrap items-end gap-2">
                  <label className="text-xs"><span className="mb-0.5 block text-muted-foreground">類別</span>
                    <Select value={seg.status} disabled={lockLeave} onValueChange={(v) => updateSeg(i, { status: v as LeaveStatus })}>
                      <SelectTrigger className="h-8 w-24"><SelectValue /></SelectTrigger>
                      <SelectContent>{LEAVE_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </label>
                  <label className="text-xs"><span className="mb-0.5 block text-muted-foreground">生效日</span>
                    <Input type="date" className="col-input h-8 w-36" disabled={lockLeave} value={seg.from} onChange={(e) => updateSeg(i, { from: e.target.value })} />
                  </label>
                  <label className="text-xs"><span className="mb-0.5 block text-muted-foreground">復職日（空＝尚未復職）</span>
                    <Input type="date" className="col-input h-8 w-36" disabled={lockLeave} value={seg.to ?? ""} onChange={(e) => updateSeg(i, { to: e.target.value || null })} />
                  </label>
                  <label className="text-xs"><span className="mb-0.5 block text-muted-foreground">給薪比例</span>
                    <Select value={seg.paidRatio == null ? "policy" : String(seg.paidRatio)} disabled={lockLeave} onValueChange={(v) => updateSeg(i, { paidRatio: v === "policy" ? null : Number(v) })}>
                      <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="policy">沿用公司政策（{Math.round(leavePolicy[seg.status] * 100)}%）</SelectItem>
                        <SelectItem value="0">無給（0%）</SelectItem>
                        <SelectItem value="0.5">半薪（50%）</SelectItem>
                        <SelectItem value="1">全薪（100%）</SelectItem>
                      </SelectContent>
                    </Select>
                  </label>
                  <Button variant="ghost" size="icon" className="ml-auto size-7 text-destructive" disabled={lockLeave} onClick={() => removeSeg(i)}><Trash2 className="size-3.5" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
        {lockLeave && <p className="mt-1 text-xs text-muted-foreground">{LOCK_HINT}</p>}
      </div>
    );
  }
}

function Info({ label, value }: { label: string; value: ReactNode }) {
  return (<div><span className="text-xs text-muted-foreground">{label}</span><div className="font-medium">{value}</div></div>);
}
function SectionTitle({ children }: { children: ReactNode }) {
  return <p className="border-b pb-1 text-sm font-semibold">{children}</p>;
}
