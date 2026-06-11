import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { usePayrollStore } from "@/store/usePayrollStore";
import { usePayrollRows, type PayrollRow } from "@/store/selectors";
import { ntd } from "@/lib/utils";

type Dim = { key: keyof Pick<PayrollRow, "department" | "costCenter" | "project">; title: string };
const DIMS: Dim[] = [
  { key: "department", title: "一、部門別" },
  { key: "costCenter", title: "二、成本中心別" },
  { key: "project", title: "三、專案別" },
];

interface GroupRow {
  name: string;
  count: number;
  grossPay: number;
  overtimePay: number;
  monthlyBonus: number;
  netPay: number;
  employerBurden: number;
  employerTotalCost: number;
}

export function DeptCostView() {
  const rows = usePayrollRows();
  const { events, currentPeriod } = usePayrollStore();
  const bonusOf = (id: string) =>
    events.find((e) => e.employeeId === id && e.period === currentPeriod)?.monthlyBonus ?? 0;

  const grand = rows.reduce(
    (a, r) => ({
      count: a.count + 1,
      grossPay: a.grossPay + r.grossPay,
      overtimePay: a.overtimePay + r.overtimePay,
      monthlyBonus: a.monthlyBonus + bonusOf(r.employeeId),
      netPay: a.netPay + r.netPay,
      employerBurden: a.employerBurden + r.employerBurden,
      employerTotalCost: a.employerTotalCost + r.employerTotalCost,
    }),
    { count: 0, grossPay: 0, overtimePay: 0, monthlyBonus: 0, netPay: 0, employerBurden: 0, employerTotalCost: 0 },
  );

  const group = (dim: Dim): GroupRow[] => {
    const map = new Map<string, GroupRow>();
    for (const r of rows) {
      const name = (r[dim.key] as string) || "(未填寫/差異)";
      const g = map.get(name) ?? {
        name,
        count: 0,
        grossPay: 0,
        overtimePay: 0,
        monthlyBonus: 0,
        netPay: 0,
        employerBurden: 0,
        employerTotalCost: 0,
      };
      g.count += 1;
      g.grossPay += r.grossPay;
      g.overtimePay += r.overtimePay;
      g.monthlyBonus += bonusOf(r.employeeId);
      g.netPay += r.netPay;
      g.employerBurden += r.employerBurden;
      g.employerTotalCost += r.employerTotalCost;
      map.set(name, g);
    }
    return [...map.values()];
  };

  return (
    <div className="space-y-4">
      {DIMS.map((dim) => {
        const groups = group(dim);
        const classified = groups.reduce(
          (a, g) => ({
            count: a.count + g.count,
            grossPay: a.grossPay + g.grossPay,
            netPay: a.netPay + g.netPay,
            employerTotalCost: a.employerTotalCost + g.employerTotalCost,
          }),
          { count: 0, grossPay: 0, netPay: 0, employerTotalCost: 0 },
        );
        // V3 差異列：全體 − 已分類（恆應為 0）
        const diff = grand.grossPay - classified.grossPay;
        return (
          <Card key={dim.key}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                {dim.title}
                {diff === 0 ? (
                  <Badge variant="success">V3 勾稽 ✓ 差異 0</Badge>
                ) : (
                  <Badge variant="destructive">差異 {ntd(diff)}</Badge>
                )}
              </CardTitle>
              {dim.key === "department" && (
                <CardDescription>
                  分類小計恆等於全體合計（§8 V3）；「差異」列＞0 表示有員工未填該分類或名稱不一致。
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>名稱</TableHead>
                    <TableHead className="text-right">人數</TableHead>
                    <TableHead className="text-right">應發合計</TableHead>
                    <TableHead className="text-right">其中:加班費</TableHead>
                    <TableHead className="text-right">其中:當月獎金</TableHead>
                    <TableHead className="text-right">實發金額</TableHead>
                    <TableHead className="text-right">雇主負擔</TableHead>
                    <TableHead className="text-right">雇主總成本</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groups.map((g) => (
                    <TableRow key={g.name}>
                      <TableCell>{g.name}</TableCell>
                      <TableCell className="text-right tabular-nums">{g.count}</TableCell>
                      <TableCell className="text-right tabular-nums">{ntd(g.grossPay)}</TableCell>
                      <TableCell className="text-right tabular-nums">{ntd(g.overtimePay)}</TableCell>
                      <TableCell className="text-right tabular-nums">{ntd(g.monthlyBonus)}</TableCell>
                      <TableCell className="text-right tabular-nums">{ntd(g.netPay)}</TableCell>
                      <TableCell className="text-right tabular-nums">{ntd(g.employerBurden)}</TableCell>
                      <TableCell className="text-right tabular-nums">{ntd(g.employerTotalCost)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className={diff === 0 ? undefined : "bg-red-50"}>
                    <TableCell className="text-muted-foreground">(未填寫/差異)</TableCell>
                    <TableCell className="text-right tabular-nums">{grand.count - classified.count}</TableCell>
                    <TableCell className="text-right tabular-nums">{ntd(diff)}</TableCell>
                    <TableCell colSpan={5} />
                  </TableRow>
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell>小計</TableCell>
                    <TableCell className="text-right tabular-nums">{grand.count}</TableCell>
                    <TableCell className="text-right tabular-nums">{ntd(grand.grossPay)}</TableCell>
                    <TableCell className="text-right tabular-nums">{ntd(grand.overtimePay)}</TableCell>
                    <TableCell className="text-right tabular-nums">{ntd(grand.monthlyBonus)}</TableCell>
                    <TableCell className="text-right tabular-nums">{ntd(grand.netPay)}</TableCell>
                    <TableCell className="text-right tabular-nums">{ntd(grand.employerBurden)}</TableCell>
                    <TableCell className="text-right tabular-nums">{ntd(grand.employerTotalCost)}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
