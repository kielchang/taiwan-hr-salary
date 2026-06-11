import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { usePayrollStore } from "@/store/usePayrollStore";
import type { Parameters } from "@/config/parameters";
import { ntd } from "@/lib/utils";

interface Field {
  key: keyof Parameters;
  label: string;
  kind: "money" | "rate" | "int";
  note?: string;
  cell: string;
}

const FIELDS: Field[] = [
  { key: "minWageMonthly", label: "最低工資（月）", kind: "money", cell: "C4", note: "投保下限、V1 檢核" },
  { key: "minWageHourly", label: "最低工資（時）", kind: "money", cell: "C5" },
  { key: "laborEmploymentRate", label: "勞就保合計費率", kind: "rate", cell: "C8", note: "⚠ 116 年升至 13%" },
  { key: "laborEmployeeShare", label: "勞就保 勞工負擔", kind: "rate", cell: "C9" },
  { key: "laborEmployerShare", label: "勞就保 雇主負擔", kind: "rate", cell: "C10" },
  { key: "occupationalRate", label: "職保行業別費率", kind: "rate", cell: "C11", note: "公司別，全額雇主" },
  { key: "healthRate", label: "健保費率", kind: "rate", cell: "C12" },
  { key: "healthEmployeeShare", label: "健保 勞工負擔", kind: "rate", cell: "C13" },
  { key: "healthEmployerShare", label: "健保 雇主負擔", kind: "rate", cell: "C14" },
  { key: "healthAvgDependents", label: "平均眷口數（雇主）", kind: "rate", cell: "C15" },
  { key: "healthDependentCap", label: "眷屬計費上限（口）", kind: "int", cell: "C16" },
  { key: "pensionEmployerRate", label: "勞退雇主提繳率", kind: "rate", cell: "C17" },
  { key: "supplementaryRate", label: "二代健保補充保費率", kind: "rate", cell: "C18" },
  { key: "monthlyWorkHours", label: "月計薪時數", kind: "int", cell: "C19" },
  { key: "taxThresholdBase", label: "查表起扣標準（0 扶養）", kind: "money", cell: "C21" },
  { key: "taxThresholdPerDependent", label: "每名扶養提高額", kind: "money", cell: "C22", note: "估算" },
  { key: "fixedWithholdingRate", label: "固定法／獎金扣繳率", kind: "rate", cell: "C23" },
  { key: "withholdingExemptionCap", label: "單次免扣稅額上限", kind: "money", cell: "C24" },
  { key: "nonResidentThreshold", label: "非居住者門檻", kind: "money", cell: "C25" },
  { key: "nonResidentRateLow", label: "非居住者稅率（≤門檻）", kind: "rate", cell: "C26" },
  { key: "nonResidentRateHigh", label: "非居住者稅率（＞門檻）", kind: "rate", cell: "C27" },
  { key: "mealAllowanceExemption", label: "伙食費免稅額（月）", kind: "money", cell: "C28" },
];

const BRACKETS: { key: "labor" | "occupational" | "health" | "pension"; label: string }[] = [
  { key: "labor", label: "勞保（11 級，上限 45,800）" },
  { key: "occupational", label: "職保（21 級，上限 72,800）" },
  { key: "health", label: "健保（58 級，上限 313,000）" },
  { key: "pension", label: "勞退（62 級，上限 150,000）" },
];

export function ParametersView() {
  const { parameters, brackets, setParameters } = usePayrollStore();

  const fmt = (f: Field) =>
    f.kind === "rate"
      ? String((parameters[f.key] as number) * 100)
      : String(parameters[f.key]);

  const onChange = (f: Field, raw: string) => {
    const num = raw === "" ? 0 : Number(raw);
    setParameters({ [f.key]: f.kind === "rate" ? num / 100 : num } as Partial<Parameters>);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>參數設定（§4）— 全簿公式之唯一來源（P1/P2）</CardTitle>
          <CardDescription>
            計算邏輯（§5）一律引用本表參數，不寫死數字；年度更新只改此處與級距表，公式不變。
            費率以百分比輸入。逐項法源見來源01／04／05；儲存格對照見附錄A §A1。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FIELDS.map((f) => (
              <div key={f.key} className="space-y-1">
                <Label className="flex items-center gap-1 text-xs">
                  {f.label}
                  <span className="text-muted-foreground">({f.cell})</span>
                  {f.note && <Badge variant="outline" className="text-[10px]">{f.note}</Badge>}
                </Label>
                <div className="flex items-center gap-1">
                  <Input
                    className="h-8 col-input"
                    type="number"
                    value={fmt(f)}
                    onChange={(e) => onChange(f, e.target.value)}
                  />
                  <span className="text-xs text-muted-foreground">
                    {f.kind === "rate" ? "%" : f.kind === "int" ? "" : "元"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {BRACKETS.map((b) => (
          <Card key={b.key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{b.label}</CardTitle>
              <CardDescription>
                查表＝取第一個 ≥ 月薪資總額之投保金額（觸頂取最高級）。來源02。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-64 overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                      <TableHead className="w-16">級</TableHead>
                      <TableHead className="text-right">月投保金額</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {brackets[b.key].map((amt, i) => (
                      <TableRow key={i}>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell className="text-right tabular-nums">{ntd(amt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
