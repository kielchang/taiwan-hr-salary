import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { usePayrollStore } from "@/store/usePayrollStore";
import { usePayrollRows } from "@/store/selectors";
import { ntd } from "@/lib/utils";
import { Printer } from "lucide-react";

export function PayslipView() {
  const { employees, currentPeriod } = usePayrollStore();
  const rows = usePayrollRows();
  const [selected, setSelected] = useState(employees[0]?.id ?? "");

  const r = rows.find((x) => x.employeeId === selected);
  const emp = employees.find((e) => e.id === selected);

  if (!r || !emp) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">尚無員工資料</CardContent>
      </Card>
    );
  }

  // 當月獎金＝應發合計 − 月薪資總額 − 加班費 − 其他加項（薪資條以差額回推獎金顯示）
  const monthlyBonus = r.grossPay - r.salaryTotal - r.overtimePay;
  const deductions: [string, number][] = [
    ["請假扣款", r.leaveDeduction],
    ["勞保費（自付）", r.premiums.laborEmployee],
    ["健保費（自付含眷屬）", r.premiums.healthEmployee],
    ["勞退自提", r.premiums.pensionVoluntary],
    ["個人補充保費", r.personalSupplementary],
    ["代扣所得稅", r.withheldTax],
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 print:hidden">
        <Select value={selected} onValueChange={setSelected}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {employees.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.id} {e.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer /> 列印 / 匯出 PDF
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>薪資明細表（薪資條）</CardTitle>
              <CardDescription>勞基法 §23 薪資明細義務；工資清冊應保存 5 年。</CardDescription>
            </div>
            <Badge variant="outline">{currentPeriod}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <Info label="員工編號" value={emp.id} />
            <Info label="姓名" value={emp.name} />
            <Info label="部門" value={emp.department} />
            <Info label="職稱" value={emp.title} />
            <Info label="年資" value={`${Math.floor(r.seniorityMonths / 12)}年${r.seniorityMonths % 12}月`} />
            <Info label="本年特休" value={`${r.annualLeaveDays} 日`} />
            <Info label="稅務身分" value={emp.taxResidency} />
            <Info label="勞退自提率" value={`${(emp.voluntaryPensionRate * 100).toFixed(0)}%`} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Section title="應發項目" rows={[["月薪資總額", r.salaryTotal], ["加班費", r.overtimePay], ["當月獎金", monthlyBonus]]} total={["應發合計", r.grossPay]} totalClass="text-emerald-700" />
            <Section title="代扣項目" rows={deductions} total={["扣款合計", r.totalDeductions]} totalClass="text-rose-700" />
          </div>

          <div className="flex items-center justify-between rounded-md border-2 border-primary/20 bg-primary/5 p-4">
            <span className="text-lg font-semibold">實發金額</span>
            <span className="text-2xl font-bold tabular-nums">{ntd(r.netPay)} 元</span>
          </div>

          <div className="rounded-md border p-3 text-sm">
            <p className="mb-2 font-medium text-muted-foreground">雇主負擔（參考，不影響實發）</p>
            <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
              <Info label="勞保費（雇主）" value={ntd(r.premiums.laborEmployer)} />
              <Info label="職保費（雇主）" value={ntd(r.premiums.occupationalEmployer)} />
              <Info label="健保費（雇主）" value={ntd(r.premiums.healthEmployer)} />
              <Info label="勞退提繳（雇主6%）" value={ntd(r.premiums.pensionEmployer)} />
              <Info label="雇主負擔合計" value={ntd(r.employerBurden)} />
              <Info label="雇主總成本" value={ntd(r.employerTotalCost)} />
              <Info label="投保級距(勞/職/健/退)" value={`${ntd(r.insured.labor)}/${ntd(r.insured.occupational)}/${ntd(r.insured.health)}/${ntd(r.insured.pension)}`} />
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
  title,
  rows,
  total,
  totalClass,
}: {
  title: string;
  rows: [string, number][];
  total: [string, number];
  totalClass?: string;
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
