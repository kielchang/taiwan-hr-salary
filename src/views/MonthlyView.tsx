import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { usePayrollStore, blankEvent } from "@/store/usePayrollStore";
import { calculatePayroll } from "@/lib/calc";
import { monthWorkedHours } from "@/lib/attendance";
import { ytdBonusBefore } from "@/store/selectors";
import { addMonths as addMonthsStr } from "@/data/seed";
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
    currentPeriod, setCurrentPeriod, upsertEvent, getSalary, confirmations,
    attendance, punches,
  } = usePayrollStore();
  const locked = Boolean(confirmations[currentPeriod]); // 硬鎖定：已確認月份禁止異動

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
  /** 儲存並接續編輯清單中的下一位（減少逐人開關對話框的來回） */
  const saveAndNext = () => {
    if (draft) upsertEvent(draft);
    const idx = employees.findIndex((e) => e.id === editing);
    const next = employees[idx + 1];
    if (next) openEdit(next.id);
    else { setEditing(null); setDraft(null); }
  };
  /** 帶入上月異動：加班五欄＋事/病假＋其他加扣項（獎金、累計與代扣稅不帶，避免誤重發） */
  const copyLastMonth = () => {
    if (!editing || !draft) return;
    const prevPeriod = addMonthsStr(currentPeriod, -1);
    const prev = events.find((e) => e.employeeId === editing && e.period === prevPeriod);
    if (!prev) { alert(`上月（${prevPeriod}）沒有 ${editingEmp?.name ?? editing} 的異動可帶入。`); return; }
    setDraft({
      ...draft,
      overtimeWeekday1: prev.overtimeWeekday1, overtimeWeekday2: prev.overtimeWeekday2,
      overtimeRestday1: prev.overtimeRestday1, overtimeRestday2: prev.overtimeRestday2,
      overtimeHoliday: prev.overtimeHoliday,
      personalLeaveHours: prev.personalLeaveHours, sickLeaveHours: prev.sickLeaveHours,
      otherAddition: prev.otherAddition, otherDeduction: prev.otherDeduction,
    });
  };

  // 深連結 ?emp=E001：由查核/稅表跳轉時直接開啟該員異動對話框
  const [searchParams, setSearchParams] = useSearchParams();
  const empParam = searchParams.get("emp");
  useEffect(() => {
    if (!empParam) return;
    if (employees.some((e) => e.id === empParam)) openEdit(empParam);
    setSearchParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empParam]);

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
  // 系統累計獎金（今年、本期之前）：自動帶入累計欄，取代人工記憶
  const ytdPrior = editingEmp ? ytdBonusBefore(events, editingEmp.id, currentPeriod) : 0;
  // 出勤參考：該員本月打卡工時 vs 標準工時（無資料則不顯示；僅供加班輸入參考）
  const workedHours = editingEmp ? monthWorkedHours(attendance, currentPeriod, punches).get(editingEmp.id) : undefined;

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

      {locked && (
        <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <Info className="mt-0.5 size-4 shrink-0" />
          <p>
            <span className="font-medium">{formatPeriod(currentPeriod)} 已確認結算，資料已鎖定。</span>
            如需修改加班/請假/獎金等異動，請先至「查核與確認」按「取消確認」（快照將移除，重新確認後重建）。
          </p>
        </div>
      )}

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
                { key: "ops", header: "", headerClassName: "w-24", cell: ({ emp }) => <Button variant="outline" size="sm" disabled={locked} title={locked ? "本月已確認鎖定" : undefined} onClick={() => openEdit(emp.id)}><Pencil className="size-3.5" /> 編輯</Button> },
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
        <DialogContent
          className="max-h-[90vh] max-w-2xl overflow-y-auto"
          onKeyDown={(e) => {
            // Enter＝儲存；Shift+Enter＝儲存並下一位（數字欄免滑鼠來回）
            if (e.key !== "Enter" || (e.target as HTMLElement).tagName === "BUTTON") return;
            e.preventDefault();
            if (e.shiftKey) saveAndNext();
            else saveDraft();
          }}
        >
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
                  {workedHours != null && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      出勤參考：本月打卡工時 <span className="font-medium text-foreground">{workedHours} h</span>
                      （超出應工作時數的部分請對照出勤明細，分級填入上方加班欄；系統不自動回填）。
                    </p>
                  )}
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
                      on={(v) => patchDraft({ monthlyBonus: v, cumulativeBonus: ytdPrior + v })}
                    />
                    <Num
                      label="今年累計獎金（含本月）" wide
                      help={`系統累計 ${ntd(ytdPrior + draft.monthlyBonus)} 元（今年已輸入 ${ntd(ytdPrior)}＋本月），已自動帶入，可覆寫`}
                      v={draft.cumulativeBonus} on={(v) => patchDraft({ cumulativeBonus: v })}
                    />
                  </div>
                  <div className="mt-1.5 space-y-1 text-xs text-muted-foreground">
                    {draft.cumulativeBonus < draft.monthlyBonus && (
                      <p><Badge variant="destructive">累計小於本月發放</Badge> 補充保費將少算，請修正。</p>
                    )}
                    {draft.cumulativeBonus !== ytdPrior + draft.monthlyBonus && draft.cumulativeBonus >= draft.monthlyBonus && (
                      <p><Badge variant="warning">與系統累計不同</Badge> 系統依今年已輸入獎金推得 {ntd(ytdPrior + draft.monthlyBonus)} 元；若有系統外發放才需自行覆寫。</p>
                    )}
                    {draft.monthlyBonus > 0 && (
                      <p>
                        二代健保補充保費：<span className="font-medium text-foreground">{ntd(liveResult.personalSupplementary)}</span> 元
                        （超過投保金額 4 倍門檻的部分 × 2.11%）
                      </p>
                    )}
                  </div>
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

              <DialogFooter className="flex-wrap gap-1.5 sm:justify-between">
                <Button variant="outline" size="sm" onClick={copyLastMonth} title="帶入上月的加班/請假/其他加扣項（不含獎金與代扣稅）">
                  <Wand2 className="size-3.5" /> 帶入上月異動
                </Button>
                <span className="flex gap-1.5">
                  <Button variant="outline" onClick={() => setEditing(null)}>取消</Button>
                  <Button variant="secondary" onClick={saveAndNext} title="儲存後接續編輯下一位員工">儲存並下一位</Button>
                  <Button onClick={saveDraft}>儲存本月異動</Button>
                </span>
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
