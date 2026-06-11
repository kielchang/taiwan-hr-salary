import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { NumberInput } from "@/components/NumberInput";
import { usePayrollStore } from "@/store/usePayrollStore";
import type { SalaryStructure } from "@/lib/types";
import { monthlySalaryTotal } from "@/lib/calc";
import { ntd } from "@/lib/utils";

const ITEMS: { key: keyof Omit<SalaryStructure, "employeeId">; label: string; meal?: boolean }[] = [
  { key: "baseSalary", label: "本薪" },
  { key: "managerAllowance", label: "主管加給" },
  { key: "dutyAllowance", label: "職務加給" },
  { key: "professionalAllowance", label: "專業/技術加給" },
  { key: "mealAllowance", label: "伙食津貼", meal: true },
  { key: "transportAllowance", label: "交通津貼" },
  { key: "attendanceBonus", label: "全勤獎金" },
  { key: "otherFixedAllowance", label: "其他固定津貼" },
];

export function SalaryStructureView() {
  const { employees, salaries, upsertSalary, parameters } = usePayrollStore();

  const getSalary = (id: string): SalaryStructure =>
    salaries.find((s) => s.employeeId === id) ?? {
      employeeId: id,
      baseSalary: 0,
      managerAllowance: 0,
      dutyAllowance: 0,
      professionalAllowance: 0,
      mealAllowance: 0,
      transportAllowance: 0,
      attendanceBonus: 0,
      otherFixedAllowance: 0,
    };

  const colTotal = (key: keyof Omit<SalaryStructure, "employeeId">) =>
    employees.reduce((a, e) => a + getSalary(e.id)[key], 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>薪資結構（§3.2、P3 屬性驅動）</CardTitle>
        <CardDescription>
          八項皆「屬工資＝是」，合計即投保級距／加班費／平均工資之基礎（§5.0）。伙食津貼掛免稅上限屬性
          （§5.8 免稅 min(伙食, {ntd(parameters.mealAllowanceExemption)})）。年終／三節等非經常性獎金請於「獎金扣繳試算」處理。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 bg-background">員工</TableHead>
              {ITEMS.map((it) => (
                <TableHead key={it.key} className="text-right">
                  {it.label}
                  {it.meal && <Badge variant="outline" className="ml-1 text-[10px]">免稅上限</Badge>}
                </TableHead>
              ))}
              <TableHead className="text-right col-formula">月薪資總額</TableHead>
              <TableHead className="text-right col-formula">最低工資檢核</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((emp) => {
              const s = getSalary(emp.id);
              const total = monthlySalaryTotal(s);
              const ok = total >= parameters.minWageMonthly;
              return (
                <TableRow key={emp.id}>
                  <TableCell className="sticky left-0 bg-background whitespace-nowrap font-medium">
                    {emp.id} {emp.name}
                  </TableCell>
                  {ITEMS.map((it) => (
                    <TableCell key={it.key} className="text-right">
                      <NumberInput
                        value={s[it.key]}
                        onChange={(v) => upsertSalary({ ...s, [it.key]: v })}
                        className="w-24"
                      />
                    </TableCell>
                  ))}
                  <TableCell className="text-right tabular-nums font-semibold col-formula">
                    {ntd(total)}
                  </TableCell>
                  <TableCell className="text-right col-formula">
                    {ok ? (
                      <Badge variant="success">✓</Badge>
                    ) : (
                      <Badge variant="destructive">⚠ 低於最低工資</Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="sticky left-0 bg-muted/50">合計</TableCell>
              {ITEMS.map((it) => (
                <TableCell key={it.key} className="text-right tabular-nums">
                  {ntd(colTotal(it.key))}
                </TableCell>
              ))}
              <TableCell className="text-right tabular-nums">
                {ntd(employees.reduce((a, e) => a + monthlySalaryTotal(getSalary(e.id)), 0))}
              </TableCell>
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
}
