import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { usePayrollStore } from "@/store/usePayrollStore";
import type { Dependent } from "@/lib/types";
import { Plus, Trash2 } from "lucide-react";

export function DependentsView() {
  const { employees, dependents, upsertDependent, removeDependent } = usePayrollStore();
  const empIds = new Set(employees.map((e) => e.id));

  const addRow = () => {
    const id = `D${Date.now().toString().slice(-8)}`;
    upsertDependent({
      id,
      employeeId: employees[0]?.id ?? "",
      name: "",
      relationship: "配偶",
      birthDate: "",
      nationalId: "",
      enrolledInHealthInsurance: false,
      taxDependent: false,
    });
  };

  const patch = (d: Dependent, p: Partial<Dependent>) => upsertDependent({ ...d, ...p });

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between">
        <div>
          <CardTitle>眷屬名冊（§3.2、P4 分流眷屬模型）</CardTitle>
          <CardDescription>
            同一眷屬有兩個獨立法律身分：健保依附（影響保費）與稅務扶養（影響扣繳起扣點）。
            兩旗標各自統計，絕不在主檔手動維護兩個數字。員編查無＝V2 孤兒警示。
          </CardDescription>
        </div>
        <Button size="sm" onClick={addRow} disabled={employees.length === 0}>
          <Plus /> 新增眷屬
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>所屬員工</TableHead>
              <TableHead>姓名</TableHead>
              <TableHead>關係</TableHead>
              <TableHead>出生年月日</TableHead>
              <TableHead className="text-center">依附健保</TableHead>
              <TableHead className="text-center">報稅扶養</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dependents.map((d) => {
              const orphan = !empIds.has(d.employeeId);
              return (
                <TableRow key={d.id} className={orphan ? "bg-red-50" : undefined}>
                  <TableCell>
                    <Select value={d.employeeId} onValueChange={(v) => patch(d, { employeeId: v })}>
                      <SelectTrigger className="h-8 w-40 col-input">
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
                    {orphan && <Badge variant="destructive" className="ml-1">⚠查無此員編</Badge>}
                  </TableCell>
                  <TableCell>
                    <Input className="h-8 w-28 col-input" value={d.name} onChange={(e) => patch(d, { name: e.target.value })} />
                  </TableCell>
                  <TableCell>
                    <Input className="h-8 w-24 col-input" value={d.relationship} onChange={(e) => patch(d, { relationship: e.target.value })} />
                  </TableCell>
                  <TableCell>
                    <Input type="date" className="h-8 w-36 col-input" value={d.birthDate} onChange={(e) => patch(d, { birthDate: e.target.value })} />
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={d.enrolledInHealthInsurance}
                      onCheckedChange={(v) => patch(d, { enrolledInHealthInsurance: v === true })}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={d.taxDependent}
                      onCheckedChange={(v) => patch(d, { taxDependent: v === true })}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-destructive"
                      onClick={() => removeDependent(d.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {dependents.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  尚無眷屬資料
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
