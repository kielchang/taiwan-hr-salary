// 初始設定引導（/setup，首次使用時 App 守門導向）。設計原理：
//  - 五步：歡迎 → 公司設定 → 薪資結構預設 → 員工資料 → 完成；完成時設 setupCompleted＝true，之後不再進入。
//  - 兩條入門路徑：「載入範例公司」（demo 資料，快速體驗）或「從空白開始」（自行建檔）。
//  - 「薪資結構預設」步驟設定公司新進員工的固定津貼預設（伙食津貼預帶 3,000 免稅額；寫入 salaryDefaults），
//    空白建立模式快速新增的員工即自動帶入這些預設（本薪逐人填）。之後於「系統設定 → 公司」仍可調整。
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { usePayrollStore } from "@/store/usePayrollStore";
import { Stepper } from "@/components/Stepper";
import type { Employee } from "@/lib/types";
import { ntd } from "@/lib/utils";
import { SALARY_ITEMS } from "@/views/MasterDataView";
import { Trash2, Plus } from "lucide-react";
import { monthlySalaryTotal } from "@/lib/calc";
import {
  Building2,
  Users,
  CalendarClock,
  ClipboardCheck,
  FileSpreadsheet,
  Check,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  FilePlus2,
} from "lucide-react";

const STEPS = ["歡迎", "公司設定", "薪資結構預設", "員工資料", "完成"];

interface QuickEmployee {
  id: string;
  name: string;
  department: string;
  hireDate: string;
  baseSalary: number;
}

export function SetupWizard({ onDone }: { onDone: () => void }) {
  const {
    parameters,
    setParameters,
    currentPeriod,
    setCurrentPeriod,
    resetToSeed,
    clearAll,
    employees,
    completeSetup,
    upsertEmployee,
    upsertSalary,
    salaryDefaults,
    setSalaryDefaults,
  } = usePayrollStore();

  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<"sample" | "blank" | null>(null);
  const [quick, setQuick] = useState<QuickEmployee>({
    id: "A001",
    name: "",
    department: "",
    hireDate: new Date().toISOString().slice(0, 10),
    baseSalary: 35000,
  });
  const [added, setAdded] = useState<QuickEmployee[]>([]);

  const chooseMode = (m: "sample" | "blank") => {
    setMode(m);
    if (m === "sample") resetToSeed();
    else clearAll();
    setStep(1);
  };

  // ── 公司薪資結構預設（salaryDefaults）：進入該步驟時，若伙食津貼未設過，預帶 3,000（免稅額）。
  const [mealPrefilled, setMealPrefilled] = useState(false);
  useEffect(() => {
    if (step === 2 && !mealPrefilled) {
      setMealPrefilled(true);
      if (salaryDefaults.standard.mealAllowance == null) {
        setSalaryDefaults({ ...salaryDefaults, standard: { ...salaryDefaults.standard, mealAllowance: 3000 } });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);
  const setStd = (k: (typeof SALARY_ITEMS)[number]["key"], v: number | undefined) =>
    setSalaryDefaults({ ...salaryDefaults, standard: { ...salaryDefaults.standard, [k]: v } });
  const setCustom = (custom: { name: string; amount: number }[]) => setSalaryDefaults({ ...salaryDefaults, custom });
  // 預設固定津貼合計（不含本薪；供該步驟示意）
  const defaultsPreview = monthlySalaryTotal({
    employeeId: "", managerAllowance: 0, dutyAllowance: 0, professionalAllowance: 0,
    mealAllowance: 0, transportAllowance: 0, attendanceBonus: 0, otherFixedAllowance: 0,
    ...salaryDefaults.standard,
    baseSalary: 0, // 排除本薪（逐人填）；放 spread 之後覆蓋
    customAllowances: salaryDefaults.custom.map((c, i) => ({ id: `d${i}`, name: c.name, amount: c.amount })),
  });

  const addQuick = () => {
    if (!quick.id.trim() || !quick.name.trim()) return;
    const emp: Employee = {
      id: quick.id.trim(),
      name: quick.name.trim(),
      department: quick.department.trim() || "未分類",
      title: "",
      hireDate: quick.hireDate,
      costCenter: "",
      project: "",
      taxResidency: "居住者",
      withholdingMethod: "固定5%",
      exemptionFormReceivedDate: null,
      voluntaryPensionRate: 0,
      nationalId: "",
      email: "",
    };
    upsertEmployee(emp);
    // 帶入公司薪資結構預設（伙食津貼等）；本薪以快速輸入為準（放在 spread 之後覆蓋）
    upsertSalary({
      employeeId: emp.id,
      managerAllowance: 0,
      dutyAllowance: 0,
      professionalAllowance: 0,
      mealAllowance: 0,
      transportAllowance: 0,
      attendanceBonus: 0,
      otherFixedAllowance: 0,
      ...salaryDefaults.standard,
      baseSalary: quick.baseSalary,
      customAllowances: salaryDefaults.custom.map((c, i) => ({ id: `CA${emp.id}${i}`, name: c.name, amount: c.amount })),
    });
    setAdded((a) => [...a, quick]);
    // 員編自動遞增建議
    const m = /^([A-Za-z]*)(\d+)$/.exec(quick.id.trim());
    const nextId = m ? `${m[1]}${String(Number(m[2]) + 1).padStart(m[2].length, "0")}` : "";
    setQuick({ id: nextId, name: "", department: quick.department, hireDate: quick.hireDate, baseSalary: 35000 });
  };

  const finish = () => {
    completeSetup();
    onDone();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-2xl">
        <CardContent className="p-6 sm:p-8">
          {/* 步驟指示（共用 Stepper 元件；已完成步驟可點擊回上一步） */}
          <div className="mb-6">
            <Stepper
              steps={STEPS.map((label, i) => ({ key: String(i), label }))}
              current={String(step)}
              completed={Object.fromEntries(STEPS.map((_, i) => [String(i), i < step]))}
              onStep={(k) => { const n = Number(k); if (n < step) setStep(n); }}
            />
          </div>

          {step === 0 && (
            <div className="space-y-5 text-center">
              <Building2 className="mx-auto size-12 text-primary" />
              <div>
                <h1 className="text-xl font-bold">歡迎使用薪資管理系統</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  這套系統協助您完成台灣月薪制的每月薪資結算：勞健保、勞退、二代健保補充保費、
                  所得稅扣繳到薪資條，全部自動計算。115 年度的法定費率與投保級距已內建。
                  <br />
                  所有資料只儲存在這台電腦的瀏覽器中。
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  onClick={() => chooseMode("sample")}
                  className="rounded-lg border-2 p-4 text-left transition-colors hover:border-primary hover:bg-accent"
                >
                  <Sparkles className="mb-2 size-5 text-warning" />
                  <p className="font-medium">載入範例公司體驗</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    內含 8 名範例員工與完整薪資情境，適合先熟悉操作，之後可隨時清空改填自己的資料。
                  </p>
                </button>
                <button
                  onClick={() => chooseMode("blank")}
                  className="rounded-lg border-2 p-4 text-left transition-colors hover:border-primary hover:bg-accent"
                >
                  <FilePlus2 className="mb-2 size-5 text-info" />
                  <p className="font-medium">從空白開始建立</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    直接輸入貴公司的員工與薪資資料，引導完成後即可開始當月結算。
                  </p>
                </button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold">公司設定</h2>
                <p className="text-sm text-muted-foreground">
                  只需要確認三項與貴公司有關的設定，其餘法定費率與投保級距（115 年度）系統已內建，
                  之後都可以在「系統設定」頁調整。
                </p>
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label>本次要結算的發薪月份</Label>
                  <Input
                    type="month"
                    className="col-input"
                    value={currentPeriod}
                    onChange={(e) => setCurrentPeriod(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>職業災害保險費率（%）</Label>
                  <Input
                    type="number"
                    step="0.01"
                    className="col-assumption"
                    value={parameters.occupationalRate * 100}
                    onChange={(e) => setParameters({ occupationalRate: Number(e.target.value) / 100 })}
                  />
                  <p className="text-xs text-muted-foreground">
                    每家公司不同，請依勞保局寄發的核定通知書填寫；不確定可先用全產業平均 0.21%，之後再改。
                  </p>
                </div>
                <div className="space-y-1">
                  <Label>年資與特休的計算方式</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setParameters({ seniorityBasis: "hireDate" })}
                      className={`rounded-md border-2 p-2.5 text-left text-sm transition-colors ${parameters.seniorityBasis === "hireDate" ? "border-primary bg-primary/5" : "hover:border-primary/40"}`}>
                      <p className="font-medium">依到職日（週年制）</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">每位員工依自己到職日算實際年資（算至當月），特休隨週年逐年增加。</p>
                    </button>
                    <button type="button" onClick={() => setParameters({ seniorityBasis: "fixedDate" })}
                      className={`rounded-md border-2 p-2.5 text-left text-sm transition-colors ${(parameters.seniorityBasis ?? "fixedDate") === "fixedDate" ? "border-primary bg-primary/5" : "hover:border-primary/40"}`}>
                      <p className="font-medium">固定基準日</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">全體以同一基準日計算年資（曆年制常用，如統一設為 1/1）。</p>
                    </button>
                  </div>
                  {(parameters.seniorityBasis ?? "fixedDate") === "fixedDate" && (
                    <div className="pt-1">
                      <Label className="text-xs">固定基準日</Label>
                      <Input type="date" className="col-assumption" value={parameters.seniorityBaseDate}
                        onChange={(e) => setParameters({ seniorityBaseDate: e.target.value })} />
                      <p className="text-xs text-muted-foreground">通常設為當月 1 日或年度 1/1；系統以此日計算每位員工的年資與特休天數。</p>
                    </div>
                  )}
                </div>
                <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
                  已內建（115 年度）：最低工資 {ntd(parameters.minWageMonthly)} 元、勞就保 12.5%、健保
                  5.17%、勞退 6%、二代補充保費 2.11%、四種投保級距表、所得稅起扣標準等。
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold">公司薪資結構預設</h2>
                <p className="text-sm text-muted-foreground">
                  設定「新進員工」建檔時自動帶入的固定津貼預設（本薪逐人填）。最常見的是<strong>伙食津貼</strong>（每月 3,000 元內免稅），已預帶 3,000，可改；留空＝0。之後在「系統設定 → 公司」還能調整。
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {SALARY_ITEMS.filter((it) => it.key !== "baseSalary").map((it) => (
                  <div key={it.key} className="space-y-1">
                    <Label className="text-xs">{it.label}{it.help ? <span className="ml-1 text-[10px] text-muted-foreground">（{it.help}）</span> : null}</Label>
                    <Input type="number" className="col-assumption text-right tabular-nums"
                      value={salaryDefaults.standard[it.key] ?? ""}
                      onChange={(e) => setStd(it.key, e.target.value === "" ? undefined : Number(e.target.value) || 0)} />
                  </div>
                ))}
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium">自訂津貼範本（選填）</p>
                  <Button variant="outline" size="sm" onClick={() => setCustom([...salaryDefaults.custom, { name: "", amount: 0 }])}><Plus /> 新增</Button>
                </div>
                {salaryDefaults.custom.length === 0 ? (
                  <p className="text-xs text-muted-foreground">無。可新增公司通用之自訂津貼（如語言/值班津貼），新進自動帶入。</p>
                ) : (
                  <div className="space-y-2">
                    {salaryDefaults.custom.map((c, i) => (
                      <div key={i} className="flex flex-wrap items-center gap-2 rounded-md border p-2">
                        <Input placeholder="津貼名稱" className="col-assumption h-8 w-40" value={c.name}
                          onChange={(e) => setCustom(salaryDefaults.custom.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                        <Input type="number" placeholder="金額" className="col-assumption h-8 w-28 text-right tabular-nums" value={c.amount || ""}
                          onChange={(e) => setCustom(salaryDefaults.custom.map((x, j) => (j === i ? { ...x, amount: Number(e.target.value) || 0 } : x)))} />
                        <Button variant="ghost" size="icon" className="ml-auto size-7 text-destructive"
                          onClick={() => setCustom(salaryDefaults.custom.filter((_, j) => j !== i))}><Trash2 className="size-3.5" /></Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
                預設固定津貼合計（不含本薪）：<span className="font-bold tabular-nums text-foreground">{ntd(defaultsPreview)}</span> 元／月；新增員工時自動帶入，可再逐人調整。
              </div>
            </div>
          )}

          {step === 3 && mode === "sample" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold">員工資料</h2>
                <p className="text-sm text-muted-foreground">已載入 8 名範例員工，涵蓋常見情境：</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {employees.map((e) => (
                  <div key={e.id} className="rounded-md border px-3 py-2 text-sm">
                    <span className="font-medium">{e.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {e.department}・{e.title || "—"}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                之後在「基本資料」頁即可新增、修改或刪除員工，並維護薪資項目與眷屬。
              </p>
            </div>
          )}

          {step === 3 && mode === "blank" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold">新增第一批員工</h2>
                <p className="text-sm text-muted-foreground">
                  先填最基本的資料就能開始；津貼、眷屬、扣繳方式等細節之後在「基本資料」頁補齊。
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-xs">員工編號</Label>
                  <Input className="col-input" value={quick.id} onChange={(e) => setQuick({ ...quick, id: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">姓名</Label>
                  <Input className="col-input" value={quick.name} onChange={(e) => setQuick({ ...quick, name: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">部門</Label>
                  <Input className="col-input" value={quick.department} onChange={(e) => setQuick({ ...quick, department: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">到職日</Label>
                  <Input type="date" className="col-input" value={quick.hireDate} onChange={(e) => setQuick({ ...quick, hireDate: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">月薪（本薪）</Label>
                  <Input type="number" className="col-input" value={quick.baseSalary} onChange={(e) => setQuick({ ...quick, baseSalary: Number(e.target.value) })} />
                </div>
                <div className="flex items-end">
                  <Button onClick={addQuick} disabled={!quick.id.trim() || !quick.name.trim()} className="w-full">
                    加入
                  </Button>
                </div>
              </div>
              {quick.baseSalary > 0 && quick.baseSalary < parameters.minWageMonthly && (
                <p className="text-xs text-destructive">
                  注意：低於最低工資 {ntd(parameters.minWageMonthly)} 元，存檔後會出現提醒。
                </p>
              )}
              {added.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {added.map((a) => (
                    <Badge key={a.id} variant="secondary">
                      {a.id} {a.name}
                    </Badge>
                  ))}
                </div>
              )}
              {added.length === 0 && (
                <p className="text-xs text-muted-foreground">也可以先跳過，之後在「基本資料」頁新增。</p>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5 text-center">
              <Check className="mx-auto size-12 rounded-full bg-success/15 p-2 text-success" />
              <div>
                <h2 className="text-lg font-bold">設定完成！</h2>
                <p className="mt-1 text-sm text-muted-foreground">每個月從「工作台」出發，照待辦提示進行：</p>
              </div>
              <div className="grid gap-3 text-left sm:grid-cols-3">
                {[
                  { icon: CalendarClock, t: "① 薪資結算（兩步驟）", d: "輸入當月異動 → 查核與確認。系統已自動帶入固定薪資，只要替「有加班、請假或獎金」的人補上異動，查核無誤後確認本月結算。" },
                  { icon: ClipboardCheck, t: "② 工作台待辦", d: "首頁彙整資料檢查、未填代扣稅、加退保與級距調整等待辦，點卡片直達處理位置。" },
                  { icon: FileSpreadsheet, t: "③ 報表與申報", d: "確認後至「報表與申報」產出部門匯總、所得稅清單、每人薪資條與申報名冊，可直接列印。" },
                ].map((s) => (
                  <div key={s.t} className="rounded-lg border p-3">
                    <s.icon className="mb-1.5 size-5 text-primary" />
                    <p className="text-sm font-medium">{s.t}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{s.d}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 導覽按鈕 */}
          <div className="mt-7 flex items-center justify-between">
            {step > 0 ? (
              <Button variant="ghost" onClick={() => setStep(step - 1)}>
                <ChevronLeft /> 上一步
              </Button>
            ) : (
              <span />
            )}
            {step >= 1 && step < STEPS.length - 1 && (
              <Button onClick={() => setStep(step + 1)}>
                下一步 <ChevronRight />
              </Button>
            )}
            {step === STEPS.length - 1 && (
              <Button onClick={finish}>
                <Users /> 開始使用
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
