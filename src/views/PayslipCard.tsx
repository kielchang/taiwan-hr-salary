import { forwardRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Employee } from "@/lib/types";
import type { PayrollRow } from "@/store/selectors";
import { ntd, formatPeriod } from "@/lib/utils";

/**
 * 薪資明細表卡片（單一員工）。抽成獨立元件供「畫面檢視」「下載加密 PDF」
 * 「批次離屏渲染」共用，確保三者版面完全一致。
 */
export const PayslipCard = forwardRef<HTMLDivElement, { emp: Employee; r: PayrollRow; period: string }>(
  ({ emp, r, period }, ref) => {
    const monthlyBonus = r.grossPay - r.salaryTotal - r.overtimePay;
    return (
      <Card ref={ref} className="bg-card">
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle>薪資明細表</CardTitle>
            <Badge variant="outline">{formatPeriod(period)}</Badge>
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
    );
  },
);
PayslipCard.displayName = "PayslipCard";

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
