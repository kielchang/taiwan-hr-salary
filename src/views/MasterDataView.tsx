import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { cn, ntd } from "@/lib/utils";
import { Pencil, Plus, Trash2, UserPlus } from "lucide-react";

const SALARY_ITEMS: { key: keyof Omit<SalaryStructure, "employeeId">; label: string; help?: string }[] = [
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
    upsertEmployee, upsertSalary, setEmployeeDependents, removeEmployee,
  } = usePayrollStore();

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<DialogTab>("basic");
  const [isNew, setIsNew] = useState(true);
  const [draftEmp, setDraftEmp] = useState<Employee>(blankEmployee());
  const [draftSalary, setDraftSalary] = useState<SalaryStructure>(blankSalary(""));
  const [draftDeps, setDraftDeps] = useState<Dependent[]>([]);

  const openNew = () => {
    setDraftEmp(blankEmployee());
    setDraftSalary(blankSalary(""));
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
    upsertEmployee({ ...draftEmp, id });
    upsertSalary({ ...draftSalary, employeeId: id });
    setEmployeeDependents(id, draftDeps.map((d) => ({ ...d, employeeId: id })));
    setOpen(false);
  };

  const setEmp = <K extends keyof Employee>(k: K, v: Employee[K]) =>
    setDraftEmp((d) => ({ ...d, [k]: v }));

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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold">基本資料</h1>
          <p className="text-sm text-muted-foreground">
            每位員工一份檔案：基本資料、固定薪資項目與眷屬都在同一個視窗維護。
            年資、特休與投保級距由系統自動計算。
          </p>
        </div>
        <Button size="sm" onClick={openNew}>
          <UserPlus /> 新增員工
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {employees.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              尚未建立員工。按右上角「新增員工」開始，或到「系統設定」載入範例公司資料。
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>員工</TableHead>
                  <TableHead>部門／職稱</TableHead>
                  <TableHead>到職日</TableHead>
                  <TableHead className="text-right">年資</TableHead>
                  <TableHead className="text-right">特休</TableHead>
                  <TableHead className="text-right">月薪總額</TableHead>
                  <TableHead className="text-center">眷屬（健保/扶養）</TableHead>
                  <TableHead>提醒</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp) => {
                  const s = salaries.find((x) => x.employeeId === emp.id) ?? blankSalary(emp.id);
                  const total = monthlySalaryTotal(s);
                  const months = seniorityMonths(emp.hireDate, parameters.seniorityBaseDate);
                  const hd = dependents.filter((d) => d.employeeId === emp.id && d.enrolledInHealthInsurance).length;
                  const td = dependents.filter((d) => d.employeeId === emp.id && d.taxDependent).length;
                  const lowWage = total < parameters.minWageMonthly;
                  const noForm = emp.taxResidency === "居住者" && !emp.exemptionFormReceivedDate;
                  return (
                    <TableRow key={emp.id}>
                      <TableCell>
                        <span className="font-medium">{emp.name}</span>
                        <span className="ml-1.5 text-xs text-muted-foreground">{emp.id}</span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {emp.department}
                        {emp.title && <span className="text-muted-foreground">・{emp.title}</span>}
                      </TableCell>
                      <TableCell className="text-sm">{emp.hireDate}</TableCell>
                      <TableCell className="text-right text-sm tabular-nums">{formatSeniority(months)}</TableCell>
                      <TableCell className="text-right text-sm tabular-nums">{annualLeaveDays(months)} 天</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{ntd(total)}</TableCell>
                      <TableCell className="text-center text-sm tabular-nums">{hd}／{td}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {lowWage && <Badge variant="destructive">低於最低工資</Badge>}
                          {noForm && <Badge variant="warning">免稅額申報表未收</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="size-7" onClick={() => openEdit(emp)}>
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-destructive"
                            onClick={() => {
                              if (confirm(`刪除 ${emp.name} 的所有資料（含薪資、眷屬與結算紀錄）？`))
                                removeEmployee(emp.id);
                            }}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
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
              <Field label="到職日" help="用於計算年資與特休天數">
                <Input type="date" className="col-input" value={draftEmp.hireDate} onChange={(e) => setEmp("hireDate", e.target.value)} />
              </Field>
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
