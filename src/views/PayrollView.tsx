import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { NumberInput } from "@/components/NumberInput";
import { usePayrollStore, blankEvent } from "@/store/usePayrollStore";
import { usePayrollRows, useCompanySupplementary, sumTotals } from "@/store/selectors";
import type { MonthlyEvent } from "@/lib/types";
import { ntd } from "@/lib/utils";

export function PayrollView() {
  const { currentPeriod, setCurrentPeriod, events, upsertEvent } = usePayrollStore();
  const rows = usePayrollRows();
  const companySupp = useCompanySupplementary(rows);

  const getEvent = (id: string): MonthlyEvent =>
    events.find((e) => e.employeeId === id && e.period === currentPeriod) ??
    blankEvent(id, currentPeriod);

  const bonusByEmp = new Map(rows.map((r) => [r.employeeId, getEvent(r.employeeId).monthlyBonus]));
  const totals = sumTotals(rows, bonusByEmp);
  const patch = (id: string, p: Partial<MonthlyEvent>) => upsertEvent({ ...getEvent(id), ...p });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <CardTitle>薪資總表（計算層，§5.3–§5.10）</CardTitle>
              <CardDescription>
                橘＝當月手動填寫（時數、獎金、請假、稅、其他加減項）；其餘自動計算。
                「代扣所得稅」請依「所得稅扣繳對照」之建議值人工轉填（four-eyes，§7）。
              </CardDescription>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">發薪期間（yyyy-mm）</Label>
              <Input
                className="h-8 w-32 col-input"
                value={currentPeriod}
                onChange={(e) => setCurrentPeriod(e.target.value)}
                placeholder="2026-01"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-background">員工</TableHead>
                <TableHead className="text-right">月薪資</TableHead>
                <TableHead className="text-right">平日×4/3</TableHead>
                <TableHead className="text-right">平日×5/3</TableHead>
                <TableHead className="text-right">休息×4/3</TableHead>
                <TableHead className="text-right">休息×5/3</TableHead>
                <TableHead className="text-right">假日×1</TableHead>
                <TableHead className="text-right col-formula">加班費</TableHead>
                <TableHead className="text-right">其他加項</TableHead>
                <TableHead className="text-right">當月獎金</TableHead>
                <TableHead className="text-right col-formula">應發合計</TableHead>
                <TableHead className="text-right">事假h</TableHead>
                <TableHead className="text-right">病假h</TableHead>
                <TableHead className="text-right col-formula">請假扣款</TableHead>
                <TableHead className="text-right col-formula">勞保自付</TableHead>
                <TableHead className="text-right col-formula">健保自付</TableHead>
                <TableHead className="text-right col-formula">勞退自提</TableHead>
                <TableHead className="text-right">累計獎金</TableHead>
                <TableHead className="text-right col-formula">獎金補充費</TableHead>
                <TableHead className="text-right">代扣所得稅</TableHead>
                <TableHead className="text-right">其他扣款</TableHead>
                <TableHead className="text-right col-formula">扣款合計</TableHead>
                <TableHead className="text-right col-formula font-bold">實發金額</TableHead>
                <TableHead className="text-right col-formula">雇主負擔</TableHead>
                <TableHead className="text-right col-formula">雇主總成本</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => {
                const ev = getEvent(r.employeeId);
                return (
                  <TableRow key={r.employeeId}>
                    <TableCell className="sticky left-0 bg-background whitespace-nowrap font-medium">
                      {r.employeeId} {r.name}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{ntd(r.salaryTotal)}</TableCell>
                    <Num v={ev.overtimeWeekday1} on={(v) => patch(r.employeeId, { overtimeWeekday1: v })} />
                    <Num v={ev.overtimeWeekday2} on={(v) => patch(r.employeeId, { overtimeWeekday2: v })} />
                    <Num v={ev.overtimeRestday1} on={(v) => patch(r.employeeId, { overtimeRestday1: v })} />
                    <Num v={ev.overtimeRestday2} on={(v) => patch(r.employeeId, { overtimeRestday2: v })} />
                    <Num v={ev.overtimeHoliday} on={(v) => patch(r.employeeId, { overtimeHoliday: v })} />
                    <TableCell className="text-right tabular-nums col-formula">{ntd(r.overtimePay)}</TableCell>
                    <Num v={ev.otherAddition} on={(v) => patch(r.employeeId, { otherAddition: v })} wide />
                    <Num v={ev.monthlyBonus} on={(v) => patch(r.employeeId, { monthlyBonus: v })} wide />
                    <TableCell className="text-right tabular-nums col-formula font-medium">{ntd(r.grossPay)}</TableCell>
                    <Num v={ev.personalLeaveHours} on={(v) => patch(r.employeeId, { personalLeaveHours: v })} />
                    <Num v={ev.sickLeaveHours} on={(v) => patch(r.employeeId, { sickLeaveHours: v })} />
                    <TableCell className="text-right tabular-nums col-formula">{ntd(r.leaveDeduction)}</TableCell>
                    <TableCell className="text-right tabular-nums col-formula">{ntd(r.premiums.laborEmployee)}</TableCell>
                    <TableCell className="text-right tabular-nums col-formula">{ntd(r.premiums.healthEmployee)}</TableCell>
                    <TableCell className="text-right tabular-nums col-formula">{ntd(r.premiums.pensionVoluntary)}</TableCell>
                    <Num v={ev.cumulativeBonus} on={(v) => patch(r.employeeId, { cumulativeBonus: v })} wide />
                    <TableCell className="text-right tabular-nums col-formula">{ntd(r.personalSupplementary)}</TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        className="h-8 w-24 text-right tabular-nums col-input"
                        value={ev.withheldTax ?? ""}
                        placeholder="0"
                        onChange={(e) =>
                          patch(r.employeeId, {
                            withheldTax: e.target.value === "" ? null : Number(e.target.value),
                          })
                        }
                      />
                    </TableCell>
                    <Num v={ev.otherDeduction} on={(v) => patch(r.employeeId, { otherDeduction: v })} wide />
                    <TableCell className="text-right tabular-nums col-formula">{ntd(r.totalDeductions)}</TableCell>
                    <TableCell className="text-right tabular-nums col-formula font-bold">{ntd(r.netPay)}</TableCell>
                    <TableCell className="text-right tabular-nums col-formula">{ntd(r.employerBurden)}</TableCell>
                    <TableCell className="text-right tabular-nums col-formula">{ntd(r.employerTotalCost)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="sticky left-0 bg-muted/50">合計（{totals.count} 人）</TableCell>
                <TableCell className="text-right tabular-nums">{ntd(totals.grossPay - totals.overtimePay - totals.monthlyBonus)}</TableCell>
                <TableCell colSpan={6} className="text-right tabular-nums">加班費 {ntd(totals.overtimePay)}</TableCell>
                <TableCell className="text-right tabular-nums">獎金 {ntd(totals.monthlyBonus)}</TableCell>
                <TableCell></TableCell>
                <TableCell className="text-right tabular-nums font-bold">{ntd(totals.grossPay)}</TableCell>
                <TableCell colSpan={10}></TableCell>
                <TableCell className="text-right tabular-nums font-bold">{ntd(totals.netPay)}</TableCell>
                <TableCell className="text-right tabular-nums">{ntd(totals.employerBurden)}</TableCell>
                <TableCell className="text-right tabular-nums font-bold">{ntd(totals.employerTotalCost)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>

          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-md border bg-muted/30 p-3 text-sm">
            <Badge variant="secondary">投保單位（公司）二代健保補充保費</Badge>
            <span className="tabular-nums font-medium">{ntd(companySupp)} 元</span>
            <span className="text-xs text-muted-foreground">
              ＝round(max(0, Σ應發合計 − Σ健保投保金額) × {(usePayrollStore.getState().parameters.supplementaryRate * 100)}%)（§5.7 差額制，P6 概算；申報依扣繳憑單薪資總額核計）
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Num({ v, on, wide }: { v: number; on: (v: number) => void; wide?: boolean }) {
  return (
    <TableCell className="text-right">
      <NumberInput value={v} onChange={on} className={wide ? "w-24" : "w-16"} />
    </TableCell>
  );
}
