import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/NumberInput";
import { usePayrollStore } from "@/store/usePayrollStore";
import {
  lookupBracket,
  monthlySalaryTotal,
  supplementaryBaseDifferential,
  bonusWithholding,
} from "@/lib/calc";
import { ntd } from "@/lib/utils";

interface BonusInput {
  prior: number; // 本次發放前年度累計獎金
  amount: number; // 本次獎金金額
}

export function BonusView() {
  const { employees, salaries, brackets, parameters } = usePayrollStore();
  const [title, setTitle] = useState("年終獎金");
  const [inputs, setInputs] = useState<Record<string, BonusInput>>({});

  const getInput = (id: string): BonusInput => inputs[id] ?? { prior: 0, amount: 0 };
  const setInput = (id: string, p: Partial<BonusInput>) =>
    setInputs((s) => ({ ...s, [id]: { ...getInput(id), ...p } }));

  const healthInsured = (id: string) => {
    const s = salaries.find((x) => x.employeeId === id);
    return s ? lookupBracket(brackets.health, monthlySalaryTotal(s)) : 0;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <CardTitle>獎金扣繳試算（§5.7 差分形式、§5.9 末段）</CardTitle>
            <CardDescription>
              一次性獎金／年終／三節：補充保費採年度累計制（累計超過 健保投保金額×4 之部分 × {parameters.supplementaryRate * 100}%）；
              所得稅按 5%，單次未達起扣標準 {ntd(parameters.taxThresholdBase)} 免扣（仍應列單申報）。與所得稅門檻互相獨立（來源05）。
            </CardDescription>
          </div>
          <Input
            className="h-8 w-40 col-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="發放名目"
          />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>員工</TableHead>
              <TableHead className="text-right col-formula">健保投保金額</TableHead>
              <TableHead className="text-right col-formula">門檻(×4)</TableHead>
              <TableHead className="text-right">發放前累計</TableHead>
              <TableHead className="text-right">本次獎金</TableHead>
              <TableHead className="text-right col-formula">累計後</TableHead>
              <TableHead className="text-right col-formula">計費基礎</TableHead>
              <TableHead className="text-right col-formula">補充保費</TableHead>
              <TableHead className="text-right col-formula">代扣所得稅</TableHead>
              <TableHead className="text-right col-formula">實發金額</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((emp) => {
              const inp = getInput(emp.id);
              const health = healthInsured(emp.id);
              const threshold = health * 4;
              const after = inp.prior + inp.amount;
              const supp = supplementaryBaseDifferential(inp.prior, inp.amount, health, parameters);
              const tax = bonusWithholding(inp.amount, emp.taxResidency, parameters);
              const taxAmt = tax.type === "auto" ? tax.amount : 0;
              const net = tax.type === "auto" ? inp.amount - supp.premium - taxAmt : NaN;
              return (
                <TableRow key={emp.id}>
                  <TableCell className="font-medium">{emp.id} {emp.name}</TableCell>
                  <TableCell className="text-right tabular-nums col-formula">{ntd(health)}</TableCell>
                  <TableCell className="text-right tabular-nums col-formula">{ntd(threshold)}</TableCell>
                  <TableCell className="text-right">
                    <NumberInput value={inp.prior} onChange={(v) => setInput(emp.id, { prior: v })} />
                  </TableCell>
                  <TableCell className="text-right">
                    <NumberInput value={inp.amount} onChange={(v) => setInput(emp.id, { amount: v })} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums col-formula">{ntd(after)}</TableCell>
                  <TableCell className="text-right tabular-nums col-formula">{ntd(supp.base)}</TableCell>
                  <TableCell className="text-right tabular-nums col-formula">{ntd(supp.premium)}</TableCell>
                  <TableCell className="text-right col-formula">
                    {tax.type === "auto" ? (
                      <span className="tabular-nums">{ntd(taxAmt)}</span>
                    ) : (
                      <Badge variant="warning">{tax.hint}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums col-formula font-medium">
                    {Number.isNaN(net) ? "—" : ntd(net)}
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
