// 批次薪資作業（公司面）：對「單位或全公司」族群批次調整既有項目／新增固定津貼／發區間補貼。
// 設計原理：族群選擇→操作設定→影響預覽（月薪資總額 before→after、低於最低工資標示）→即時套用或排程未來月。
// 純計算重用 applyBatchOp（lib/calc）；套用/排程/補貼皆走 store（硬鎖定守衛＋摘要稽核）。
import { useMemo, useState, type ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { TabPills } from "@/components/ui/tab-pills";
import { Callout } from "@/components/ui/callout";
import { Delta } from "@/components/ui/delta";
import { usePayrollStore } from "@/store/usePayrollStore";
import { applyBatchOp, batchOpLabel, monthlySalaryTotal, SAL_FIELD_LABEL } from "@/lib/calc";
import type { Employee, SalaryStructure, BatchSalaryOp, ScheduledSalaryChange, Subsidy, Currency } from "@/lib/types";
import { ntd, foreignMoney } from "@/lib/utils";
import { Users, CalendarClock, Trash2, Wallet } from "lucide-react";

type Tab = "adjust" | "foreign" | "subsidy" | "scheduled";
type ScopeMode = "all" | "dept" | "costCenter";
const today = () => new Date().toISOString().slice(0, 10);
const thisMonth = () => today().slice(0, 7);
const ADJ_TARGETS = ["baseSalary", "managerAllowance", "dutyAllowance", "professionalAllowance", "mealAllowance", "transportAllowance", "attendanceBonus", "otherFixedAllowance"] as const;
type Scope = { emps: Employee[]; label: string };

export function BatchSalaryPanel() {
  const {
    employees, salaries, parameters, currentPeriod, confirmations,
    applyBatchSalary, scheduleSalaryChanges, scheduledSalaryChanges, cancelScheduledSalaryChange, applyScheduledSalaryChange,
    subsidies, addSubsidy, cancelSubsidy,
    fxPolicy, currencies, fxRates, applyBatchForeign,
  } = usePayrollStore();
  const locked = Boolean(confirmations[currentPeriod]);
  const [tab, setTab] = useState<Tab>("adjust");

  // 族群（排除離職）
  const active = useMemo(() => employees.filter((e) => e.status !== "離職"), [employees]);
  const [scopeMode, setScopeMode] = useState<ScopeMode>("all");
  const [units, setUnits] = useState<string[]>([]);
  const unitField: keyof Employee = scopeMode === "costCenter" ? "costCenter" : "department";
  const distinctUnits = useMemo(() => [...new Set(active.map((e) => (e[unitField] as string) || "（未填）"))].sort(), [active, unitField]);
  const scope: Scope = scopeMode === "all"
    ? { emps: active, label: "全公司" }
    : { emps: active.filter((e) => units.includes((e[unitField] as string) || "（未填）")), label: units.join("・") || "（未選單位）" };
  const toggleUnit = (u: string) => setUnits((us) => (us.includes(u) ? us.filter((x) => x !== u) : [...us, u]));

  const scopePicker = (
    <div className="space-y-2 rounded-md border p-3">
      <div className="flex items-center gap-2 text-sm font-medium"><Users className="size-4 text-primary" /> 適用族群</div>
      <TabPills tabs={[{ key: "all", label: "全公司" }, { key: "dept", label: "依部門" }, { key: "costCenter", label: "依成本中心" }]} value={scopeMode} onChange={(k) => { setScopeMode(k as ScopeMode); setUnits([]); }} />
      {scopeMode !== "all" && (
        <div className="flex flex-wrap gap-2">
          {distinctUnits.map((u) => (
            <label key={u} className="tap-target flex items-center gap-1.5 rounded-md border px-2 py-1 text-sm">
              <Checkbox checked={units.includes(u)} onCheckedChange={() => toggleUnit(u)} />{u}
            </label>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground">命中 <span className="font-medium text-foreground">{scope.emps.length}</span> 人（{scope.label}）</p>
    </div>
  );

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <TabPills
          tabs={[{ key: "adjust", label: "批次調整" }, ...(fxPolicy.enabled ? [{ key: "foreign", label: "外幣薪資" }] : []), { key: "subsidy", label: "區間補貼" }, { key: "scheduled", label: `排程${scheduledSalaryChanges.length ? `（${scheduledSalaryChanges.length}）` : ""}` }]}
          value={tab} onChange={(k) => setTab(k as Tab)}
        />
        {tab === "foreign" && fxPolicy.enabled && (
          <ForeignBatchTab scope={scope} scopePicker={scopePicker} salaries={salaries} currencies={currencies} fxRates={fxRates}
            currentPeriod={currentPeriod} locked={locked} applyBatchForeign={applyBatchForeign} />
        )}
        {tab === "adjust" && (
          <AdjustTab scope={scope} scopePicker={scopePicker} salaries={salaries} minWage={parameters.minWageMonthly}
            currentPeriod={currentPeriod} locked={locked} applyBatchSalary={applyBatchSalary} scheduleSalaryChanges={scheduleSalaryChanges} />
        )}
        {tab === "subsidy" && (
          <SubsidyTab scope={scope} scopePicker={scopePicker} subsidies={subsidies} addSubsidy={addSubsidy} cancelSubsidy={cancelSubsidy} currentPeriod={currentPeriod} />
        )}
        {tab === "scheduled" && (
          <ScheduledList items={scheduledSalaryChanges} currentPeriod={currentPeriod} locked={locked} onApply={applyScheduledSalaryChange} onCancel={cancelScheduledSalaryChange} />
        )}
      </CardContent>
    </Card>
  );
}

// ── 批次調整/新增津貼 ─────────────────────────────────────────
function AdjustTab({ scope, scopePicker, salaries, minWage, currentPeriod, locked, applyBatchSalary, scheduleSalaryChanges }: {
  scope: Scope; scopePicker: ReactNode; salaries: SalaryStructure[]; minWage: number; currentPeriod: string; locked: boolean;
  applyBatchSalary: (input: { employeeIds: string[]; op: BatchSalaryOp; reason: string; scopeLabel: string }) => void;
  scheduleSalaryChanges: (items: Omit<ScheduledSalaryChange, "id">[], note: string) => void;
}) {
  const [kind, setKind] = useState<"adjust" | "addAllowance">("adjust");
  const [target, setTarget] = useState<(typeof ADJ_TARGETS)[number]>("baseSalary");
  const [mode, setMode] = useState<"add" | "subtract" | "set">("add");
  const [amountKind, setAmountKind] = useState<"fixed" | "pctBase" | "pctTotal">("fixed");
  const [value, setValue] = useState<number>(0);
  const [allowName, setAllowName] = useState("");
  const [reason, setReason] = useState("");
  const [effective, setEffective] = useState(currentPeriod);

  const op: BatchSalaryOp = kind === "addAllowance"
    ? { kind: "addAllowance", name: allowName.trim(), amountKind: amountKind === "pctTotal" ? "pctBase" : amountKind, value }
    : { kind: "adjust", target, mode, amountKind, value };

  const preview = useMemo(() => scope.emps.map((e) => {
    const s = salaries.find((x) => x.employeeId === e.id);
    if (!s) return null;
    const before = monthlySalaryTotal(s);
    const after = monthlySalaryTotal(applyBatchOp(s, op, { allowanceId: "preview" }));
    return { id: e.id, name: e.name, dept: e.department, before, after, low: after < minWage };
  }).filter((x): x is NonNullable<typeof x> => x != null), [scope.emps, salaries, op, minWage]);

  const totalBefore = preview.reduce((a, r) => a + r.before, 0);
  const totalAfter = preview.reduce((a, r) => a + r.after, 0);
  const lowCount = preview.filter((r) => r.low).length;
  const valid = preview.length > 0 && !!reason.trim() && (kind !== "addAllowance" || !!allowName.trim()) && (mode === "set" || value !== 0 || kind === "addAllowance");
  const isFuture = effective > currentPeriod;

  const doApply = () => {
    if (!valid) return;
    const ids = preview.map((r) => r.id);
    if (isFuture) {
      const items = preview.map((r) => {
        const s = salaries.find((x) => x.employeeId === r.id)!;
        return { employeeId: r.id, name: r.name, salary: applyBatchOp(s, op), effectivePeriod: effective, note: `${scope.label}・${batchOpLabel(op)}`, decidedAt: new Date().toISOString() };
      });
      scheduleSalaryChanges(items, `${scope.label}・${batchOpLabel(op)}`);
      alert(`已排程 ${items.length} 人，自 ${effective} 生效；到期可於「排程」分頁套用。`);
    } else {
      if (locked) { alert(`本月（${currentPeriod}）已確認結算，無法立即套用；請改排程未來月，或先取消確認。`); return; }
      applyBatchSalary({ employeeIds: ids, op, reason, scopeLabel: scope.label });
      alert(`已將 ${ids.length} 人套用：${batchOpLabel(op)}。`);
    }
    setValue(0); setAllowName(""); setReason("");
  };

  const cols: Column<(typeof preview)[number]>[] = [
    { key: "name", header: "員工", freeze: true, sortValue: (r) => r.name, filterText: (r) => `${r.name} ${r.dept}`, cell: (r) => <span className="font-medium">{r.name}</span> },
    { key: "dept", header: "部門", sortValue: (r) => r.dept, cell: (r) => <span className="text-sm text-muted-foreground">{r.dept}</span> },
    { key: "before", header: "調整前月薪資總額", numeric: true, sortValue: (r) => r.before, cell: (r) => ntd(r.before), total: () => ntd(totalBefore) },
    { key: "after", header: "調整後", numeric: true, sortValue: (r) => r.after, cell: (r) => <span className="font-medium">{ntd(r.after)}</span>, total: () => ntd(totalAfter) },
    { key: "delta", header: "增減", numeric: true, sortValue: (r) => r.after - r.before, cell: (r) => <Delta value={r.after - r.before} format={ntd} />, total: () => <Delta value={totalAfter - totalBefore} format={ntd} /> },
    { key: "flag", header: "", cell: (r) => (r.low ? <Badge variant="destructive">低於最低工資</Badge> : null) },
  ];

  return (
    <div className="space-y-4">
      {scopePicker}
      <div className="space-y-3 rounded-md border p-3">
        <div className="flex items-center gap-2 text-sm font-medium"><Wallet className="size-4 text-primary" /> 操作</div>
        <TabPills tabs={[{ key: "adjust", label: "調整既有項目" }, { key: "addAllowance", label: "新增固定津貼" }]} value={kind} onChange={(k) => setKind(k as typeof kind)} />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {kind === "adjust" ? (
            <>
              <LabeledSelect label="項目" value={target} onChange={(v) => setTarget(v as typeof target)} options={ADJ_TARGETS.map((t) => ({ value: t, label: SAL_FIELD_LABEL[t] }))} />
              <LabeledSelect label="方式" value={mode} onChange={(v) => setMode(v as typeof mode)} options={[{ value: "add", label: "加" }, { value: "subtract", label: "減" }, { value: "set", label: "設為" }]} />
              <LabeledSelect label="量" value={amountKind} onChange={(v) => setAmountKind(v as typeof amountKind)} options={[{ value: "fixed", label: "定額（元）" }, { value: "pctBase", label: "本薪 %" }, { value: "pctTotal", label: "月薪資總額 %" }]} />
              <LabeledInput label={amountKind === "fixed" ? "金額（元）" : "百分比（%）"} value={value} onChange={setValue} />
            </>
          ) : (
            <>
              <div className="sm:col-span-2"><LabeledText label="津貼名稱" value={allowName} onChange={setAllowName} placeholder="如：語言津貼、危險津貼" /></div>
              <LabeledSelect label="量" value={amountKind === "pctTotal" ? "pctBase" : amountKind} onChange={(v) => setAmountKind(v as typeof amountKind)} options={[{ value: "fixed", label: "定額（元）" }, { value: "pctBase", label: "本薪 %" }]} />
              <LabeledInput label={amountKind === "fixed" ? "金額（元）" : "百分比（%）"} value={value} onChange={setValue} />
            </>
          )}
        </div>
        <p className="text-xs text-muted-foreground">預覽操作：{batchOpLabel(op)}</p>
      </div>

      {preview.length > 0 && (
        <>
          {lowCount > 0 && <Callout variant="danger" title={`${lowCount} 人調整後低於最低工資（${ntd(minWage)}）`}>請調整幅度或個別處理。</Callout>}
          <DataTable rows={preview} columns={cols} getRowKey={(r) => r.id} initialSort={{ key: "name", dir: "asc" }} searchPlaceholder="搜尋員工／部門…" pageSize={5} />
        </>
      )}

      <div className="space-y-3 rounded-md border p-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <LabeledText label="異動原因 *" value={reason} onChange={setReason} placeholder="例：年度調整／專案加給" />
          <div>
            <label className="text-xs font-medium">生效月份</label>
            <Input type="month" min={currentPeriod} value={effective} onChange={(e) => setEffective(e.target.value || currentPeriod)} className="col-input h-9" />
            <p className="mt-1 text-[11px] text-muted-foreground">{isFuture ? "未來月份→存為排程，到期於「排程」分頁套用。" : "＝當期→立即套用（已確認月會擋下）。"}</p>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={doApply} disabled={!valid}><CalendarClock /> {isFuture ? "排程套用" : "立即套用"}（{preview.length} 人）</Button>
        </div>
      </div>
    </div>
  );
}

// ── 批次外幣（族群發放/調整固定每月外幣） ──────────────────────
function ForeignBatchTab({ scope, scopePicker, salaries, currencies, fxRates, currentPeriod, locked, applyBatchForeign }: {
  scope: Scope; scopePicker: ReactNode; salaries: SalaryStructure[]; currencies: Currency[]; fxRates: Record<string, Record<string, number>>;
  currentPeriod: string; locked: boolean;
  applyBatchForeign: (input: { employeeIds: string[]; currency: string; mode: "set" | "addPct" | "addAmt"; value: number; reason: string; scopeLabel: string }) => void;
}) {
  const enabled = currencies.filter((c) => c.enabled);
  const [currency, setCurrency] = useState(enabled[0]?.code ?? "");
  const [mode, setMode] = useState<"set" | "addPct" | "addAmt">("set");
  const [value, setValue] = useState(0);
  const [reason, setReason] = useState("");
  const cur = currencies.find((c) => c.code === currency);
  const rate = fxRates[currency]?.[currentPeriod] ?? 0;
  const salById = new Map(salaries.map((s) => [s.employeeId, s]));
  const valid = !!currency && !!reason.trim() && scope.emps.length > 0 && (mode !== "set" || value >= 0);
  type Row = { id: string; name: string; before: number; after: number };
  const preview: Row[] = scope.emps.map((e) => {
    const fp = salById.get(e.id)?.foreignPay;
    const before = fp?.currency === currency ? fp.amount : 0;
    let after = before;
    if (mode === "set") after = value;
    else if (fp?.currency === currency) after = mode === "addPct" ? Math.round(before * (1 + value / 100)) : Math.max(0, before + value);
    return { id: e.id, name: e.name, before, after };
  });
  const affected = mode === "set" ? preview.length : preview.filter((r) => r.before > 0).length;
  const doApply = () => {
    if (!valid) return;
    if (!confirm(`確定對「${scope.label}」${affected} 人套用外幣${mode === "set" ? "發放/設定" : "調整"}？`)) return;
    applyBatchForeign({ employeeIds: scope.emps.map((e) => e.id), currency, mode, value, reason, scopeLabel: scope.label });
    setReason("");
    alert("已套用批次外幣薪資。");
  };
  const cols: Column<Row>[] = [
    { key: "name", header: "員工", freeze: true, sortValue: (r) => r.name, cell: (r) => r.name },
    { key: "before", header: `原 ${currency}`, numeric: true, sortValue: (r) => r.before, cell: (r) => foreignMoney(r.before, { symbol: cur?.symbol, decimals: cur?.decimals, code: currency }) },
    { key: "after", header: `新 ${currency}`, numeric: true, sortValue: (r) => r.after, cell: (r) => <span className="font-medium">{foreignMoney(r.after, { symbol: cur?.symbol, decimals: cur?.decimals, code: currency })}</span> },
    { key: "twd", header: "新台幣約當", numeric: true, sortValue: (r) => r.after, cell: (r) => rate > 0 ? `≈ ${ntd(Math.round(r.after * rate))}` : "—" },
  ];
  if (enabled.length === 0) return <div className="space-y-4">{scopePicker}<Callout variant="info" title="尚無啟用幣別">請先至「系統設定 → 幣別與匯率」新增並啟用幣別、設定匯率。</Callout></div>;
  return (
    <div className="space-y-4">
      {scopePicker}
      <div className="space-y-3 rounded-md border p-3">
        <p className="text-sm font-medium">對族群發放／調整固定每月外幣</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div><label className="text-xs font-medium">幣別</label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="col-input h-9"><SelectValue /></SelectTrigger>
              <SelectContent>{enabled.map((c) => <SelectItem key={c.code} value={c.code}>{c.code}（{c.name}）</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><label className="text-xs font-medium">方式</label>
            <Select value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
              <SelectTrigger className="col-input h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="set">發放/設為固定金額</SelectItem>
                <SelectItem value="addPct">調整既有 %（加/減）</SelectItem>
                <SelectItem value="addAmt">調整既有定額（加/減）</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><label className="text-xs font-medium">{mode === "addPct" ? "百分比（%）" : "金額"}</label>
            <Input type="number" className="col-input h-9 text-right tabular-nums" value={value || ""} onChange={(e) => setValue(Number(e.target.value) || 0)} /></div>
          <div><label className="text-xs font-medium">異動原因 *</label>
            <Input className="col-input h-9" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="如：外派津貼調整" /></div>
        </div>
        <Callout variant="info" title="外幣獨立於勞健保">外幣與台幣分開計算、視作獎金，不計入投保級距與勞健保保費；是否計所得稅／二代健保補充保費依「幣別與匯率」政策。{rate <= 0 && "（本期尚未設匯率，台幣約當暫以 0 計。）"}</Callout>
        <div className="flex justify-end"><Button onClick={doApply} disabled={!valid || locked}><Wallet /> 套用（{affected} 人）</Button></div>
      </div>
      <DataTable rows={preview} columns={cols} getRowKey={(r) => r.id} initialSort={{ key: "name", dir: "asc" }} pageSize={5} searchPlaceholder="搜尋員工…" />
    </div>
  );
}

// ── 區間補貼 ─────────────────────────────────────────────────
function SubsidyTab({ scope, scopePicker, subsidies, addSubsidy, cancelSubsidy, currentPeriod }: {
  scope: Scope; scopePicker: ReactNode; subsidies: Subsidy[];
  addSubsidy: (s: Omit<Subsidy, "id" | "createdAt">) => void; cancelSubsidy: (id: string) => void; currentPeriod: string;
}) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState(0);
  const [from, setFrom] = useState(thisMonth());
  const [to, setTo] = useState(thisMonth());
  const [insured, setInsured] = useState<"yes" | "no">("no");
  const [reason, setReason] = useState("");
  const valid = !!name.trim() && amount > 0 && !!from && !!to && from <= to && scope.emps.length > 0 && !!reason.trim();
  const create = () => {
    if (!valid) return;
    addSubsidy({ name: name.trim(), amount, from, to, insured: insured === "yes", targetEmployeeIds: scope.emps.map((e) => e.id), scopeLabel: scope.label, reason });
    setName(""); setAmount(0); setReason("");
    alert(`已建立區間補貼「${name}」，${from}～${to}，${scope.emps.length} 人。`);
  };
  const statusOf = (s: Subsidy) => (currentPeriod < s.from ? "未開始" : currentPeriod > s.to ? "已到期" : "生效中");
  const cols: Column<Subsidy>[] = [
    { key: "name", header: "名稱", freeze: true, sortValue: (s) => s.name, filterText: (s) => `${s.name} ${s.scopeLabel}`, cell: (s) => <span className="font-medium">{s.name}</span> },
    { key: "amount", header: "每月金額", numeric: true, sortValue: (s) => s.amount, cell: (s) => ntd(s.amount) },
    { key: "range", header: "區間", sortValue: (s) => s.from, cell: (s) => <span className="text-sm">{s.from} ～ {s.to}</span> },
    { key: "insured", header: "投保", cell: (s) => <Badge variant={s.insured ? "warning" : "secondary"}>{s.insured ? "計入投保" : "不計投保"}</Badge> },
    { key: "scope", header: "族群", sortValue: (s) => s.scopeLabel, filterText: (s) => s.scopeLabel, cell: (s) => <span className="text-sm">{s.scopeLabel}（{s.targetEmployeeIds.length} 人）</span> },
    { key: "status", header: "狀態", cell: (s) => { const st = statusOf(s); return <Badge variant={st === "生效中" ? "success" : "outline"}>{st}</Badge>; } },
    { key: "ops", header: "", headerClassName: "w-10", cell: (s) => <Button variant="ghost" size="icon" className="size-7 text-destructive" onClick={() => { if (confirm(`取消區間補貼「${s.name}」？之後月份將不再加發。`)) cancelSubsidy(s.id); }}><Trash2 className="size-3.5" /></Button> },
  ];
  return (
    <div className="space-y-4">
      {scopePicker}
      <div className="space-y-3 rounded-md border p-3">
        <p className="text-sm font-medium">新增區間補貼</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <LabeledText label="名稱 *" value={name} onChange={setName} placeholder="如：專案津貼、輪班補貼" />
          <LabeledInput label="每月金額（元）*" value={amount} onChange={setAmount} />
          <LabeledSelect label="是否計入投保薪資" value={insured} onChange={(v) => setInsured(v as typeof insured)} options={[{ value: "no", label: "只加發、不動投保級距" }, { value: "yes", label: "計入投保薪資/級距" }]} />
          <div><label className="text-xs font-medium">起月 *</label><Input type="month" value={from} onChange={(e) => setFrom(e.target.value)} className="col-input h-9" /></div>
          <div><label className="text-xs font-medium">訖月 *（含）</label><Input type="month" value={to} onChange={(e) => setTo(e.target.value)} className="col-input h-9" /></div>
          <LabeledText label="異動原因 *" value={reason} onChange={setReason} />
        </div>
        <Callout variant="info" title="投保性質提醒">「計入投保」於區間內墊高月薪資總額、影響勞健保級距與加班時薪（可能牽動 2/8 月申報）；「只加發」僅加入當月實發、不動級距。</Callout>
        <div className="flex justify-end"><Button onClick={create} disabled={!valid}>建立補貼（{scope.emps.length} 人）</Button></div>
      </div>
      <DataTable rows={subsidies} columns={cols} getRowKey={(s) => s.id} initialSort={{ key: "range", dir: "desc" }} searchPlaceholder="搜尋名稱／族群…"
        empty={{ title: "尚無區間補貼", hint: "填上方表單建立；區間內每月自動加發，訖月後自動停止。" }} />
    </div>
  );
}

// ── 排程清單 ─────────────────────────────────────────────────
function ScheduledList({ items, currentPeriod, locked, onApply, onCancel }: {
  items: ScheduledSalaryChange[]; currentPeriod: string; locked: boolean; onApply: (id: string) => void; onCancel: (id: string) => void;
}) {
  const cols: Column<ScheduledSalaryChange>[] = [
    { key: "name", header: "員工", freeze: true, sortValue: (r) => r.name, filterText: (r) => `${r.name} ${r.note}`, cell: (r) => <span className="font-medium">{r.name}</span> },
    { key: "eff", header: "生效月", sortValue: (r) => r.effectivePeriod, cell: (r) => <span className="text-sm">{r.effectivePeriod}{r.effectivePeriod <= currentPeriod ? <Badge variant="success" className="ml-1.5">已到期</Badge> : <Badge variant="outline" className="ml-1.5">未到期</Badge>}</span> },
    { key: "target", header: "調後月薪資總額", numeric: true, sortValue: (r) => monthlySalaryTotal(r.salary), cell: (r) => ntd(monthlySalaryTotal(r.salary)) },
    { key: "note", header: "方案", filterText: (r) => r.note, cell: (r) => <span className="text-xs text-muted-foreground">{r.note}</span> },
    { key: "ops", header: "", headerClassName: "w-40", cell: (r) => {
      const due = r.effectivePeriod <= currentPeriod;
      return (
        <div className="flex gap-1">
          <Button variant="outline" size="sm" className="h-7" disabled={!due || locked} title={!due ? "未到生效月" : locked ? "本月已確認，先取消確認" : "套用寫回薪資"} onClick={() => onApply(r.id)}>套用</Button>
          <Button variant="ghost" size="sm" className="h-7 text-destructive" onClick={() => { if (confirm(`取消排程：${r.name}（${r.effectivePeriod}）？`)) onCancel(r.id); }}>取消</Button>
        </div>
      );
    } },
  ];
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">未來生效月的批次薪資變更；到生效月後按「套用」寫回薪資結構。</p>
      <DataTable rows={items} columns={cols} getRowKey={(r) => r.id} initialSort={{ key: "eff", dir: "asc" }} searchPlaceholder="搜尋員工／方案…"
        empty={{ title: "尚無排程", hint: "在「批次調整」選未來生效月即會建立排程。" }} />
    </div>
  );
}

// ── 小工具 ───────────────────────────────────────────────────
function LabeledSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div><label className="text-xs font-medium">{label}</label>
      <Select value={value} onValueChange={onChange}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
        <SelectContent>{options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}
function LabeledInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (<div><label className="text-xs font-medium">{label}</label><Input type="number" className="col-input h-9 text-right tabular-nums" value={value || ""} onChange={(e) => onChange(Number(e.target.value) || 0)} /></div>);
}
function LabeledText({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (<div><label className="text-xs font-medium">{label}</label><Input className="col-input h-9" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} /></div>);
}
