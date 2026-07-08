// 工時分攤編輯（專案之家內）。設計原理：
//  - 逐員逐月記「投入各專案」的比例：mode＝pct（百分比合計 ≤100%）或 hours（時數 ≤可用工時）；
//    超額由 V11 驗證警示（成本占比/稼動率會失真）。可「沿用上月」快速帶入。
//  - 只記分攤權重、不算錢；金額分攤由 projectCost 依此權重把全載成本拆到各專案。
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { usePayrollStore } from "@/store/usePayrollStore";
import { monthWorkedHours } from "@/lib/attendance";
import { addMonths } from "@/data/seed";
import type { Allocation, AllocationMode } from "@/lib/types";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Pencil, FolderKanban, Clock } from "lucide-react";

const NONE = "__none__";

/** 每月工時分攤輸入（在每月薪資作業中使用）：逐員工設定各專案時數/百分比 */
export function AllocationEditor() {
  const { employees, projects, currentPeriod, parameters, attendance, punches, getAllocation, upsertAllocation } = usePayrollStore();
  const navigate = useNavigate();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Allocation | null>(null);
  const nameOf = (pid: string) => projects.find((p) => p.id === pid)?.name ?? pid;
  const codeToId = new Map(projects.map((p) => [p.code, p.id]));
  const defaultIdOf = (empId: string) => {
    const code = employees.find((e) => e.id === empId)?.project;
    return code ? codeToId.get(code) : undefined;
  };

  const fromAttendance = () => {
    if (!editing || !draft) return;
    const H = monthWorkedHours(attendance, currentPeriod, punches).get(editing) ?? 0;
    if (!H) { alert("該員工本月無打卡工時可帶入。"); return; }
    const defId = defaultIdOf(editing);
    if (draft.lines.length === 0 && defId) {
      setDraft({ ...draft, mode: "hours", lines: [{ projectId: defId, value: H }], availableHours: H });
    } else {
      setDraft({ ...draft, mode: "hours", availableHours: H });
    }
  };

  const open = (employeeId: string) => {
    const cur = getAllocation(employeeId, currentPeriod);
    setDraft(cur ? { ...cur, lines: cur.lines.map((l) => ({ ...l })) } : { employeeId, period: currentPeriod, mode: "hours", lines: [] });
    setEditing(employeeId);
  };

  /** 沿用上月分攤：穩定編制的團隊每月免重打（複製 lines/模式/獎金歸屬；可用工時仍建議由出勤帶入） */
  const copyLastMonth = () => {
    if (!editing || !draft) return;
    const prevPeriod = addMonths(currentPeriod, -1);
    const prev = getAllocation(editing, prevPeriod);
    if (!prev || prev.lines.length === 0) { alert(`上月（${prevPeriod}）沒有分攤設定可沿用。`); return; }
    setDraft({
      ...draft,
      mode: prev.mode,
      lines: prev.lines.map((l) => ({ ...l })),
      bonusProjectId: prev.bonusProjectId,
    });
  };
  const save = () => { if (draft) upsertAllocation(draft); setEditing(null); setDraft(null); };

  const cap = draft?.mode === "pct" ? 100 : (draft?.availableHours ?? parameters.monthlyWorkHours);
  const used = draft ? draft.lines.reduce((a, l) => a + (Number(l.value) || 0), 0) : 0;
  const residual = cap - used;

  const summary = (employeeId: string): string => {
    const a = getAllocation(employeeId, currentPeriod);
    if (!a || a.lines.length === 0) return "未設定（依預設專案）";
    const unit = a.mode === "pct" ? "%" : "h";
    const parts = a.lines.map((l) => `${nameOf(l.projectId)} ${l.value}${unit}`);
    const tot = a.lines.reduce((x, l) => x + l.value, 0);
    const capE = a.mode === "pct" ? 100 : parameters.monthlyWorkHours;
    if (capE - tot > 0) parts.push(`未分攤 ${capE - tot}${unit}`);
    return parts.join("・");
  };

  if (projects.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">工時分攤</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
          尚未建立專案，無法分攤工時。
          <Button variant="outline" size="sm" onClick={() => navigate("/settings")}><FolderKanban /> 前往建立專案</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">工時分攤（{currentPeriod}）</CardTitle>
        <CardDescription>設定每位員工當月投入各專案的時數或百分比；未設定者整筆計入其預設專案。未投入部分歸「未分攤／間接」。</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>員工</TableHead><TableHead>本月分攤</TableHead><TableHead className="w-20" /></TableRow></TableHeader>
          <TableBody>
            {employees.map((emp) => (
              <TableRow key={emp.id}>
                <TableCell><span className="font-medium">{emp.name}</span><span className="ml-1.5 text-xs text-muted-foreground">{emp.department}</span></TableCell>
                <TableCell className="text-sm text-muted-foreground">{summary(emp.id)}</TableCell>
                <TableCell><Button variant="ghost" size="sm" onClick={() => open(emp.id)}><Pencil className="size-3.5" /> 分攤</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{employees.find((e) => e.id === editing)?.name} 的工時分攤</DialogTitle></DialogHeader>
          {draft && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <Label className="text-xs">輸入方式</Label>
                <Select value={draft.mode} onValueChange={(v) => setDraft({ ...draft, mode: v as AllocationMode })}>
                  <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="hours">時數</SelectItem><SelectItem value="pct">百分比</SelectItem></SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground">上限 {cap}{draft.mode === "pct" ? "%" : " 小時"}</span>
                <span className="ml-auto flex gap-1.5">
                  <Button variant="outline" size="sm" onClick={copyLastMonth} title="複製上月的專案分攤（模式/明細/獎金歸屬）"><Pencil /> 沿用上月</Button>
                  <Button variant="outline" size="sm" onClick={fromAttendance}><Clock /> 由出勤帶入</Button>
                </span>
              </div>
              {draft.mode === "hours" && (
                <div className="flex items-center gap-3">
                  <Label className="text-xs whitespace-nowrap">當月可用工時（基礎/分母）</Label>
                  <Input type="number" className="h-8 w-28 col-input text-right"
                    value={draft.availableHours ?? ""} placeholder={String(parameters.monthlyWorkHours)}
                    onChange={(e) => setDraft({ ...draft, availableHours: e.target.value === "" ? undefined : Number(e.target.value) || 0 })} />
                  <span className="text-xs text-muted-foreground">空白＝用標準 {parameters.monthlyWorkHours} 小時；可由出勤帶入實際工時</span>
                </div>
              )}

              <div className="space-y-2">
                {draft.lines.map((l, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Select value={l.projectId || NONE} onValueChange={(v) => setDraft({ ...draft, lines: draft.lines.map((x, j) => (j === i ? { ...x, projectId: v } : x)) })}>
                      <SelectTrigger className="h-8 flex-1 col-input"><SelectValue placeholder="選擇專案" /></SelectTrigger>
                      <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input type="number" className="h-8 w-24 col-input text-right" value={l.value}
                      onChange={(e) => setDraft({ ...draft, lines: draft.lines.map((x, j) => (j === i ? { ...x, value: Number(e.target.value) || 0 } : x)) })} />
                    <Button variant="ghost" size="icon" className="size-7 text-destructive" onClick={() => setDraft({ ...draft, lines: draft.lines.filter((_, j) => j !== i) })}><Trash2 className="size-3.5" /></Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => setDraft({ ...draft, lines: [...draft.lines, { projectId: projects[0].id, value: 0 }] })}><Plus /> 新增專案</Button>
              </div>

              <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 p-2 text-sm">
                <span>已分攤 {used}{draft.mode === "pct" ? "%" : "h"}</span>
                {residual > 0 && <Badge variant="secondary">未分攤 {residual}{draft.mode === "pct" ? "%" : "h"}</Badge>}
                {residual < 0 && <Badge variant="destructive">超出上限 {-residual}{draft.mode === "pct" ? "%" : "h"}</Badge>}
              </div>

              <div className="flex items-center gap-3">
                <Label className="text-xs whitespace-nowrap">獎金直接歸屬</Label>
                <Select value={draft.bonusProjectId ?? NONE} onValueChange={(v) => setDraft({ ...draft, bonusProjectId: v === NONE ? undefined : v })}>
                  <SelectTrigger className="h-8 flex-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>依工時比例分攤</SelectItem>
                    {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>取消</Button>
            <Button onClick={save} disabled={!draft || draft.lines.some((l) => !l.projectId) || residual < 0}>儲存分攤</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
