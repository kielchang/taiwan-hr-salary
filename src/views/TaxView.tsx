import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePayrollStore, blankEvent } from "@/store/usePayrollStore";
import { usePayrollRows } from "@/store/selectors";
import { ntd } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

export function TaxView() {
  const { employees, currentPeriod, events, upsertEvent } = usePayrollStore();
  const rows = usePayrollRows();

  const transfer = (employeeId: string, amount: number) => {
    const ev =
      events.find((e) => e.employeeId === employeeId && e.period === currentPeriod) ??
      blankEvent(employeeId, currentPeriod);
    upsertEvent({ ...ev, withheldTax: amount });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>所得稅扣繳對照（§5.8–§5.9）</CardTitle>
        <CardDescription>
          系統建議值與實際結算值分離（four-eyes，§7）。查表分支為人工控制點：官方稅額表非閉式，
          達起扣點者請依扶養人數欄查表後，按「轉填」或於薪資總表手動填入。起扣點為估算（P6）。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>員工</TableHead>
              <TableHead>稅務身分</TableHead>
              <TableHead>扣繳方式</TableHead>
              <TableHead className="text-right">扶養人數</TableHead>
              <TableHead>申報表收件</TableHead>
              <TableHead className="text-right col-formula">當月應稅薪資(估)</TableHead>
              <TableHead className="text-right col-formula">查表起扣點(估)</TableHead>
              <TableHead className="text-right col-formula">建議代扣稅額</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => {
              const emp = employees.find((e) => e.id === r.employeeId)!;
              const sug = r.withholdingSuggestion;
              const noForm = emp.taxResidency === "居住者" && !emp.exemptionFormReceivedDate;
              return (
                <TableRow key={r.employeeId}>
                  <TableCell className="font-medium">{r.employeeId} {r.name}</TableCell>
                  <TableCell>
                    <Badge variant={emp.taxResidency === "非居住者" ? "secondary" : "outline"}>
                      {emp.taxResidency}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {emp.taxResidency === "非居住者" ? "—(6%/18%)" : emp.withholdingMethod}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{r.dependents.taxDependents}</TableCell>
                  <TableCell>
                    {noForm ? (
                      <Badge variant="warning">⚠未收件</Badge>
                    ) : (
                      emp.exemptionFormReceivedDate ?? "—"
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums col-formula">{ntd(r.taxableSalary)}</TableCell>
                  <TableCell className="text-right tabular-nums col-formula">
                    {r.estimatedTaxThreshold === null ? "—" : ntd(r.estimatedTaxThreshold)}
                  </TableCell>
                  <TableCell className="text-right col-formula">
                    {sug.type === "auto" ? (
                      <span className="tabular-nums font-medium">{ntd(sug.amount)}</span>
                    ) : (
                      <Badge variant="warning">{sug.hint}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {sug.type === "auto" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => transfer(r.employeeId, sug.amount)}
                      >
                        <ArrowRight /> 轉填總表
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">查表後手填</span>
                    )}
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
