import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { usePayrollStore, blankEvent } from "@/store/usePayrollStore";
import { calculatePayroll } from "@/lib/calc";
import type { MonthlyEvent } from "@/lib/types";
import { ntd, formatPeriod } from "@/lib/utils";
import { AllocationEditor } from "@/views/AllocationEditor";
import { Pencil, ArrowRight, Wand2, Info } from "lucide-react";

/** 將當月異動濃縮為 HR 一眼可讀的摘要 */
function summarize(e: MonthlyEvent): string[] {
  const chips: string[] = [];
  const ot = e.overtimeWeekday1 + e.overtimeWeekday2 + e.overtimeRestday1 + e.overtimeRestday2 + e.overtimeHoliday;
  if (ot > 0) chips.push(`加班 ${ot} 小時`);
  if (e.personalLeaveHours > 0) chips.push(`事假 ${e.personalLeaveHours} 小時`);
  if (e.sickLeaveHours > 0) chips.push(`病假 ${e.sickLeaveHours} 小時`);
  if (e.monthlyBonus > 0) chips.push(`獎金 ${ntd(e.monthlyBonus)}`);
  if (e.otherAddition > 0) chips.push(`加項 ${ntd(e.otherAddition)}`);
  if (e.otherDeduction > 0) chips.push(`扣款 ${ntd(e.otherDeduction)}`);
  return chips;
}

export function MonthlyView({
  showPeriodPicker = true,
  onNext,
}: {
  showPeriodPicker?: boolean;
  onNext?: () => void;
}) {
  const {
    employees, dependents, events, parameters, brackets,
    currentPeriod, setCurrentPeriod, upsertEvent, getSalary,
  } = usePayrollStore();

  const [editing, setEditing] = useState<string | null>(null); // employeeId
  const [draft, setDraft] = useState<MonthlyEvent | null>(null);

  const getEvent = (id: string): MonthlyEvent =>
    events.find((e) => e.employeeId === id && e.period === currentPeriod) ?? blankEvent(id, currentPeriod);

  const openEdit = (id: string) => {
    setDraft({ ...getEvent(id) });
    setEditing(id);
  };
  const saveDraft = () => {
    if (draft) upsertEvent(draft);
    setEditing(null);
    setDraft(null);
  };

  const rows = employees.map((emp) => {
    const ev = getEvent(emp.id);
    const r = calculatePayroll(emp, getSalary(emp.id), dependents, ev, parameters, brackets);
    return { emp, ev, r };
  });
  // 編輯視窗的即時試算（含稅額建議）
  const editingEmp = employees.find((e) => e.id === editing);
  const liveResult =
    editingEmp && draft
      ? calculatePayroll(editingEmp, getSalary(editingEmp.id), dependents, draft, parameters, brackets)
      : null;

  const patchDraft = (p: Partial<MonthlyEvent>) => setDraft((d) => (d ? { ...d, ...p } : d));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">輸入當月異動</h2>
          <p className="text-sm text-muted-foreground">
            固定薪資與保費已自動帶入。大多數員工不需要動；只要替「有加班、請假或獎金」的人按「編輯」補上異動即可。
          </p>
        </div>
        {showPeriodPicker && (
          <div className="space-y-1">
            <Label className="text-xs">發薪月份</Label>
            <Input
              type="month"
              className="h-9 w-40 col-input"
              value={currentPeriod}
              onChange={(e) => e.target.value && setCurrentPeriod(e.target.value)}
            />
          </div>
        )}
      </div>

      {employees.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            尚未建立員工，請先到「基本資料」新增。
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <DataTable
              rows={rows}
              getRowKey={({ emp }) => emp.id}
              searchPlaceholder="搜尋姓名／部門…"
              columns={[
                { key: "name", header: "員工", freeze: true, sortValue: ({ emp }) => emp.name, filterText: ({ emp }) => `${emp.name} ${emp.department}`, cell: ({ emp }) => (<><span className="font-medium">{emp.name}</span><span className="ml-1.5 text-xs text-muted-foreground">{emp.department}</span></>) },
                { key: "events", header: "本月異動", filterText: ({ ev }) => summarize(ev).join(" "), cell: ({ ev, r }) => {
                  const chips = summarize(ev);
                  const needTax = r.withholdingSuggestion.type === "manual-lookup" && ev.withheldTax === null;
                  return (
                    <>
                      {chips.length === 0 ? <span className="text-xs text-muted-foreground">無異動（固定薪資）</span> : <div className="flex flex-wrap gap-1">{chips.map((c) => <Badge key={c} variant="secondary">{c}</Badge>)}</div>}
                      {needTax && <Badge variant="warning" className="mt-1">需查稅額表填稅額</Badge>}
                    </>
                  );
                } },
                { key: "gross", header: "應發", numeric: true, sortValue: ({ r }) => r.grossPay, cell: ({ r }) => ntd(r.grossPay), total: (rs) => ntd(rs.reduce((a, { r }) => a + r.grossPay, 0)) },
                { key: "ded", header: "代扣合計", numeric: true, sortValue: ({ r }) => r.totalDeductions, cell: ({ r }) => <span className="text-muted-foreground">−{ntd(r.totalDeductions)}</span>, total: (rs) => `−${ntd(rs.reduce((a, { r }) => a + r.totalDeductions, 0))}` },
                { key: "net", header: "實發", numeric: true, sortValue: ({ r }) => r.netPay, cell: ({ r }) => <span className="font-semibold">{ntd(r.netPay)}</span>, total: (rs) => <span className="font-bold">{ntd(rs.reduce((a, { r }) => a + r.netPay, 0))}</span> },
                { key: "ops", header: "", headerClassName: "w-24", cell: ({ emp }) => <Button variant="outline" size="sm" onClick={() => openEdit(emp.id)}><Pencil className="size-3.5" /> 編輯</Button> },
              ]}
            />

            {onNext && (
              <div className="mt-4 flex justify-end">
                <Button onClick={onNext}>
                  完成輸入，前往查核 <ArrowRight />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {employees.length > 0 && <AllocationEditor />}

      {/* 單人異動編輯視窗 */}
      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          {editingEmp && draft && liveResult && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {editingEmp.name}｜{formatPeriod(currentPeriod)} 異動
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-5">
                <section>
                  <p className="mb-2 text-sm font-semibold">加班時數</p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <Num label="平日加班・前 2 小時" help="每小時 ×1⅓" v={draft.overtimeWeekday1} on={(v) => patchDraft({ overtimeWeekday1: v })} />
                    <Num label="平日加班・第 3–4 小時" help="每小時 ×1⅔" v={draft.overtimeWeekday2} on={(v) => patchDraft({ overtimeWeekday2: v })} />
                    <Num label="休息日加班・前 2 小時" help="每小時 ×1⅓" v={draft.overtimeRestday1} on={(v) => patchDraft({ overtimeRestday1: v })} />
                    <Num label="休息日加班・第 3 小時起" help="每小時 ×1⅔" v={draft.overtimeRestday2} on={(v) => patchDraft({ overtimeRestday2: v })} />
                    <Num label="國定假日出勤" help="整天出勤填 8（加發一日工資）" v={draft.overtimeHoliday} on={(v) => patchDraft({ overtimeHoliday: v })} />
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    本月加班費試算：<span className="font-medium text-foreground">{ntd(liveResult.overtimePay)}</span> 元
                    {draft.overtimeWeekday1 + draft.overtimeWeekday2 + draft.overtimeRestday1 + draft.overtimeRestday2 > 46 && (
                      <Badge variant="warning" className="ml-2">超過每月 46 小時上限，請留意</Badge>
                    )}
                  </p>
                </section>

                <section>
                  <p className="mb-2 text-sm font-semibold">請假</p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <Num label="事假（小時）" help="不給薪，整段扣薪" v={draft.personalLeaveHours} on={(v) => patchDraft({ personalLeaveHours: v })} />
                    <Num label="病假（小時）" help="半薪，扣一半" v={draft.sickLeaveHours} on={(v) => patchDraft({ sickLeaveHours: v })} />
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    請假扣款試算：<span className="font-medium text-foreground">{ntd(liveResult.leaveDeduction)}</span> 元。
                    特休、婚喪、公假等有薪假不扣款，不必輸入。
                  </p>
                </section>

                <section>
                  <p className="mb-2 text-sm font-semibold">獎金（年終、三節、績效等一次性給付）</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Num
                      label="本月發放獎金" wide v={draft.monthlyBonus}
                      on={(v) => patchDraft({ monthlyBonus: v, cumulativeBonus: Math.max(draft.cumulativeBonus, v) })}
                    />
                    <Num
                      label="今年累計獎金（含本月）" wide help="供二代健保補充保費「年度累計」判斷；首次發放填同本月金額"
                      v={draft.cumulativeBonus} on={(v) => patchDraft({ cumulativeBonus: v })}
                    />
                  </div>
                  {draft.monthlyBonus > 0 && (
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      二代健保補充保費：<span className="font-medium text-foreground">{ntd(liveResult.personalSupplementary)}</span> 元
                      （超過投保金額 4 倍門檻的部分 × 2.11%）
                    </p>
                  )}
                </section>

                <section>
                  <p className="mb-2 text-sm font-semibold">其他調整</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Num label="其他加項" wide help="例：實報實銷代墊還款" v={draft.otherAddition} on={(v) => patchDraft({ otherAddition: v })} />
                    <Num label="其他扣款" wide help="例：借支、團保自付" v={draft.otherDeduction} on={(v) => patchDraft({ otherDeduction: v })} />
                  </div>
                </section>

                <section className="rounded-md border p-3">
                  <p className="mb-2 text-sm font-semibold">代扣所得稅</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">本月代扣金額</Label>
                      <Input
                        type="number" className="h-8 w-32 col-input text-right tabular-nums"
                        value={draft.withheldTax ?? ""}
                        placeholder="0"
                        onChange={(e) => patchDraft({ withheldTax: e.target.value === "" ? null : Number(e.target.value) })}
                      />
                    </div>
                    {liveResult.withholdingSuggestion.type === "auto" ? (
                      <div className="text-xs text-muted-foreground">
                        系統建議：<span className="font-medium text-foreground">{ntd(liveResult.withholdingSuggestion.amount)}</span> 元
                        <Button
                          variant="outline" size="sm" className="ml-2 h-7"
                          onClick={() =>
                            patchDraft({
                              withheldTax:
                                liveResult.withholdingSuggestion.type === "auto"
                                  ? liveResult.withholdingSuggestion.amount
                                  : null,
                            })
                          }
                        >
                          <Wand2 className="size-3.5" /> 帶入建議值
                        </Button>
                      </div>
                    ) : (
                      <p className="max-w-sm text-xs text-amber-700">
                        <Info className="mr-1 inline size-3.5" />
                        此員工選「依扣繳稅額表」且薪資已達起扣點（約 {ntd(liveResult.estimatedTaxThreshold ?? 0)} 元）：
                        請至財政部「薪資所得扣繳稅額表」依扶養 {liveResult.dependents.taxDependents} 人欄查出金額後填入。
                      </p>
                    )}
                  </div>
                </section>

                {/* 即時結果摘要 */}
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted/50 p-3 text-sm">
                  <span>應發 <b className="tabular-nums">{ntd(liveResult.grossPay)}</b></span>
                  <span>代扣 <b className="tabular-nums">−{ntd(liveResult.totalDeductions)}</b></span>
                  <span>實發 <b className="tabular-nums text-base">{ntd(liveResult.netPay)}</b> 元</span>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setEditing(null)}>取消</Button>
                <Button onClick={saveDraft}>儲存本月異動</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Num({
  label, help, v, on, wide,
}: {
  label: string; help?: string; v: number; on: (v: number) => void; wide?: boolean;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input
        type="number" min="0"
        className={`h-8 col-input text-right tabular-nums ${wide ? "w-36" : "w-24"}`}
        value={v}
        onChange={(e) => on(e.target.value === "" ? 0 : Number(e.target.value))}
      />
      {help && <p className="text-[11px] leading-snug text-muted-foreground">{help}</p>}
    </div>
  );
}
