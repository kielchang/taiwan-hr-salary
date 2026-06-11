import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { usePayrollStore } from "@/store/usePayrollStore";
import { usePayrollRows } from "@/store/selectors";
import type { Employee } from "@/lib/types";
import { formatSeniority } from "@/lib/calc";
import { ntd } from "@/lib/utils";
import { Pencil, Plus, Trash2 } from "lucide-react";

const emptyEmployee = (): Employee => ({
  id: "",
  name: "",
  department: "",
  title: "",
  hireDate: "2026-01-01",
  costCenter: "",
  project: "",
  taxResidency: "居住者",
  withholdingMethod: "依扣繳稅額表",
  exemptionFormReceivedDate: null,
  voluntaryPensionRate: 0,
});

export function EmployeesView() {
  const { upsertEmployee, removeEmployee } = usePayrollStore();
  const rows = usePayrollRows();
  const employees = usePayrollStore((s) => s.employees);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Employee>(emptyEmployee());
  const [isNew, setIsNew] = useState(true);

  const openNew = () => {
    setDraft(emptyEmployee());
    setIsNew(true);
    setOpen(true);
  };
  const openEdit = (emp: Employee) => {
    setDraft({ ...emp });
    setIsNew(false);
    setOpen(true);
  };
  const save = () => {
    if (!draft.id.trim() || !draft.name.trim()) return;
    upsertEmployee(draft);
    setOpen(false);
  };

  const set = <K extends keyof Employee>(k: K, v: Employee[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between">
        <div>
          <CardTitle>員工清單（主檔，§3.2）</CardTitle>
          <CardDescription>
            橘＝人事填寫；年資／特休／投保級距／眷屬統計為自動衍生。月薪資總額由薪資結構帶入。
          </CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openNew}>
              <Plus /> 新增員工
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{isNew ? "新增員工" : `編輯 ${draft.name}`}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <Field label="員工編號">
                <Input value={draft.id} disabled={!isNew} onChange={(e) => set("id", e.target.value)} />
              </Field>
              <Field label="姓名">
                <Input value={draft.name} onChange={(e) => set("name", e.target.value)} />
              </Field>
              <Field label="部門">
                <Input value={draft.department} onChange={(e) => set("department", e.target.value)} />
              </Field>
              <Field label="職稱">
                <Input value={draft.title} onChange={(e) => set("title", e.target.value)} />
              </Field>
              <Field label="到職日">
                <Input type="date" value={draft.hireDate} onChange={(e) => set("hireDate", e.target.value)} />
              </Field>
              <Field label="勞退自提率（0–6%）">
                <Input
                  type="number"
                  step="1"
                  value={draft.voluntaryPensionRate * 100}
                  onChange={(e) => set("voluntaryPensionRate", Number(e.target.value) / 100)}
                />
              </Field>
              <Field label="成本中心">
                <Input value={draft.costCenter} onChange={(e) => set("costCenter", e.target.value)} />
              </Field>
              <Field label="專案別">
                <Input value={draft.project} onChange={(e) => set("project", e.target.value)} />
              </Field>
              <Field label="稅務身分">
                <Select value={draft.taxResidency} onValueChange={(v) => set("taxResidency", v as Employee["taxResidency"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="居住者">居住者</SelectItem>
                    <SelectItem value="非居住者">非居住者</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="扣繳方式">
                <Select value={draft.withholdingMethod} onValueChange={(v) => set("withholdingMethod", v as Employee["withholdingMethod"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="依扣繳稅額表">依扣繳稅額表</SelectItem>
                    <SelectItem value="固定5%">固定5%</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="免稅額申報表收件日（空＝V6 警示）">
                <Input
                  type="date"
                  value={draft.exemptionFormReceivedDate ?? ""}
                  onChange={(e) => set("exemptionFormReceivedDate", e.target.value || null)}
                />
              </Field>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>取消</Button>
              <Button onClick={save}>儲存</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>員編</TableHead>
              <TableHead>姓名</TableHead>
              <TableHead>部門</TableHead>
              <TableHead>到職日</TableHead>
              <TableHead className="text-right">年資</TableHead>
              <TableHead className="text-right col-formula">特休(日)</TableHead>
              <TableHead className="text-right">月薪資總額</TableHead>
              <TableHead className="text-right col-formula">勞保</TableHead>
              <TableHead className="text-right col-formula">職保</TableHead>
              <TableHead className="text-right col-formula">健保</TableHead>
              <TableHead className="text-right col-formula">勞退</TableHead>
              <TableHead className="text-right col-formula">健保眷屬/計費</TableHead>
              <TableHead>稅務身分</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => {
              const emp = employees.find((e) => e.id === r.employeeId)!;
              return (
                <TableRow key={r.employeeId}>
                  <TableCell className="font-medium">{r.employeeId}</TableCell>
                  <TableCell>{r.name}</TableCell>
                  <TableCell>{r.department}</TableCell>
                  <TableCell>{emp.hireDate}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatSeniority(r.seniorityMonths)}</TableCell>
                  <TableCell className="text-right tabular-nums col-formula">{r.annualLeaveDays}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {ntd(r.salaryTotal)}
                    {r.belowMinWage && <Badge variant="destructive" className="ml-1">低於最低工資</Badge>}
                  </TableCell>
                  <TableCell className="text-right tabular-nums col-formula">{ntd(r.insured.labor)}</TableCell>
                  <TableCell className="text-right tabular-nums col-formula">{ntd(r.insured.occupational)}</TableCell>
                  <TableCell className="text-right tabular-nums col-formula">{ntd(r.insured.health)}</TableCell>
                  <TableCell className="text-right tabular-nums col-formula">{ntd(r.insured.pension)}</TableCell>
                  <TableCell className="text-right tabular-nums col-formula">
                    {r.dependents.healthDependents} / {r.dependents.billableDependents}
                  </TableCell>
                  <TableCell>
                    <Badge variant={emp.taxResidency === "非居住者" ? "secondary" : "outline"}>
                      {emp.taxResidency}
                    </Badge>
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
                          if (confirm(`刪除員工 ${r.name}？（連同其薪資結構、眷屬、變動事件）`))
                            removeEmployee(r.employeeId);
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
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
