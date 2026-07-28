import { useEffect, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { SegGroup, type SegOption } from "@/components/ui/seg-group";
import { Chips } from "@/components/ui/chips";
import { eqValue, fmtValue, type FieldKind } from "@/lib/forms/diff";
import { Tooltip, TruncatedText } from "@/components/ui/tooltip";
import { Undo2, Redo2, Lock, ArrowRight, Pencil } from "lucide-react";

/** 選項型別＝上游 `SegOption`（結構相同）；保留此名稱維持既有匯入相容。 */
export type EditableFieldOption = SegOption;

export interface EditableFieldProps {
  label: string;
  value: string | number | boolean | string[] | null | undefined;
  /** 原始值（編輯模式傳入）；用於「已變更」標色與還原 */
  original?: string | number | boolean | string[] | null | undefined;
  kind: FieldKind;
  onChange: (v: string | number | boolean | string[]) => void;
  onRevert?: () => void;
  options?: EditableFieldOption[];
  /** 顯示格式覆寫（如 select 值→標籤） */
  format?: (v: unknown) => string;
  placeholder?: string;
  /** 鎖定（如當期已確認的薪資欄）：不可編輯、顯示鎖定提示 */
  disabled?: boolean;
  lockHint?: string;
  help?: string;
  /** 是否追蹤變更（新增模式關閉，避免全欄標為已變更） */
  trackChanges?: boolean;
  /** 恆為輸入態（新增表單用）：跳過唯讀按鈕、直接可編輯 */
  alwaysEdit?: boolean;
  /** 單位（英文/符號，如 h）；接於數字後顯示 */
  unit?: string;
  min?: number;
  step?: number;
  className?: string;
}

/**
 * 唯讀預設、逐欄開啟的欄位：
 * 平時呈現為「看起來像輸入框、值帶底線」的按鈕（暗示可點）；點擊→變真正的輸入。
 * 值 ≠ 原值時整欄標色（amber）並在右側出現 undo（↩）鈕還原該欄。鎖定時不可點。
 * alwaysEdit＝true 時恆為輸入態（新增表單用）。
 */
export function EditableField({
  label, value, original, kind, onChange, onRevert, options, format,
  placeholder, disabled, lockHint, help, trackChanges = true, alwaysEdit, unit, min, step, className,
}: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [redoValue, setRedoValue] = useState<EditableFieldProps["value"] | undefined>(undefined);
  const [confirm, setConfirm] = useState<null | { action: "undo" | "redo"; fromText: string; toText: string; apply: () => void }>(null);
  const changed = trackChanges && !alwaysEdit && !eqValue(value, original);
  const canRedo = !alwaysEdit && !changed && redoValue !== undefined && !eqValue(redoValue, original);
  const showInput = alwaysEdit || editing;

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  // 手動改值（非 undo/redo）→ 使 redo 失效
  useEffect(() => {
    if (redoValue !== undefined && !eqValue(value, original) && !eqValue(value, redoValue)) setRedoValue(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const exit = () => { if (!alwaysEdit) setEditing(false); };
  const ft = (v: EditableFieldProps["value"]) => fmtValue(v, kind, format, unit);
  const askUndo = () => setConfirm({
    action: "undo", fromText: ft(value), toText: ft(original),
    apply: () => { setRedoValue(value); onRevert?.(); setEditing(false); },
  });
  const askRedo = () => setConfirm({
    action: "redo", fromText: ft(value), toText: ft(redoValue),
    apply: () => { if (redoValue !== undefined) onChange(redoValue as string | number | boolean | string[]); },
  });
  const shell = (control: React.ReactNode) => (
    <FieldShell
      label={label} help={help} className={className} changed={changed}
      onUndo={!confirm && changed && onRevert ? askUndo : undefined}
      onRedo={!confirm && canRedo ? askRedo : undefined}
    >
      {confirm ? (
        <ConfirmBar
          action={confirm.action} fromText={confirm.fromText} toText={confirm.toText}
          onCancel={() => setConfirm(null)}
          onConfirm={() => { confirm.apply(); setConfirm(null); }}
        />
      ) : control}
    </FieldShell>
  );

  // 顯示文字：select/radio 取選項標籤；multiselect 合併選中標籤；其餘依 kind 格式化
  const optLabel = (v: string) => options?.find((o) => o.value === v)?.label ?? v;
  let display: string;
  if (kind === "select" || kind === "radio") {
    display = value == null || value === "" ? "—" : format ? format(value) : optLabel(String(value));
  } else if (kind === "multiselect") {
    const s = Array.isArray(value) ? value.map(String) : [];
    display = s.length ? s.map(optLabel).join("、") : "—";
  } else if (kind === "checkbox") {
    display = value ? "是" : "否";
  } else {
    display = fmtValue(value, kind, format, unit);
  }
  const isEmpty = display === "—";
  const numeric = kind === "money" || kind === "number" || kind === "rate";
  const negMoney = kind === "money" && Number(value) < 0; // 帳務：負值紅字

  // 唯讀值（過長截斷；hover/長壓顯示完整泡泡）
  const valueEl = (
    <TruncatedText text={display} numeric={numeric} className={cn(isEmpty && "text-muted-foreground", negMoney && "font-medium text-danger")} />
  );
  const collapsed = (
    <button
      type="button"
      onClick={() => setEditing(true)}
      aria-label={`${label}，目前 ${display}，按 Enter 編輯`}
      className={cn(fieldBtnCls(changed, false), "group")}
    >
      {valueEl}
      {!changed && <EditPencil />}
    </button>
  );

  // 鎖定：所有型態統一顯示唯讀值＋鎖頭（可聚焦讓螢幕閱讀器讀到鎖定原因）
  if (disabled) {
    return shell(
      <div
        role="group"
        tabIndex={0}
        aria-disabled
        aria-label={`${label}，${display}${lockHint ? `（已鎖定：${lockHint}）` : "（已鎖定）"}`}
        title={lockHint}
        className={cn(fieldBtnCls(false, true))}
      >
        {valueEl}
        <Lock aria-hidden className="ml-1 size-3.5 shrink-0 opacity-60" />
      </div>,
    );
  }

  // checkbox（是/否）：唯讀顯示 → 點擊展開分段
  if (kind === "checkbox") {
    if (!showInput) return shell(collapsed);
    return shell(
      <SegGroup
        label={label}
        options={[{ value: "true", label: "是" }, { value: "false", label: "否" }]}
        value={value ? "true" : "false"}
        onPick={(v) => { onChange(v === "true"); exit(); }}
        autoFocus={editing && !alwaysEdit}
        onEscape={exit}
        changed={changed}
      />,
    );
  }

  // radio（單選）：唯讀顯示 → 點擊展開分段
  if (kind === "radio") {
    if (!showInput) return shell(collapsed);
    return shell(
      <SegGroup
        label={label}
        options={options ?? []}
        value={value == null ? "" : String(value)}
        onPick={(v) => { onChange(v); exit(); }}
        autoFocus={editing && !alwaysEdit}
        onEscape={exit}
        changed={changed}
      />,
    );
  }

  // multiselect（多選）：唯讀顯示前幾項＋「其他 N 項」→ 點擊展開標籤片，「完成」收合
  if (kind === "multiselect") {
    const sel = Array.isArray(value) ? value.map(String) : [];
    if (!showInput) {
      const preview = sel.slice(0, 2);
      const rest = sel.length - preview.length;
      return shell(
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label={`${label}，目前 ${display}，按 Enter 編輯`}
          className={cn(fieldBtnCls(changed, false), "group gap-1")}
        >
          {sel.length === 0 && <span className="text-muted-foreground">—</span>}
          {preview.map((v) => (
            <Tooltip key={v} content={optLabel(v)}>
              <span className="block max-w-[88px] truncate rounded-full border border-input bg-muted px-2 py-0.5 text-xs">{optLabel(v)}</span>
            </Tooltip>
          ))}
          {rest > 0 && <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">其他 {rest} 項</span>}
          {!changed && <EditPencil />}
        </button>,
      );
    }
    return shell(
      <div className="space-y-1.5">
        <Chips
          label={label}
          options={options ?? []}
          selected={sel}
          onToggle={(v) => onChange(sel.includes(v) ? sel.filter((x) => x !== v) : [...sel, v])}
          autoFocus={editing && !alwaysEdit}
          onEscape={exit}
          changed={changed}
        />
        {!alwaysEdit && (
          <button type="button" onClick={exit} className="tap-target-y rounded border border-input bg-background px-2.5 py-0.5 text-xs hover:bg-accent">完成</button>
        )}
      </div>,
    );
  }

  // select
  if (kind === "select") {
    if (!showInput) return shell(collapsed);
    return shell(
      <Select
        open={alwaysEdit ? undefined : true}
        value={value == null || value === "" ? undefined : String(value)}
        onValueChange={(v) => { onChange(v); exit(); }}
        onOpenChange={(o) => { if (!o) exit(); }}
      >
        <SelectTrigger className="h-9"><SelectValue placeholder={placeholder} /></SelectTrigger>
        <SelectContent>
          {options?.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>,
    );
  }

  // text / number / money / rate / date
  if (showInput) {
    const type = kind === "date" ? "date" : numeric ? "number" : "text";
    const editVal = kind === "rate" && value != null && value !== "" ? Number(value) * 100 : (value ?? "");
    const commit = (raw: string) => {
      if (kind === "number" || kind === "money") onChange(raw === "" ? 0 : Number(raw));
      else if (kind === "rate") onChange(raw === "" ? 0 : Number(raw) / 100);
      else onChange(raw);
    };
    return shell(
      <Input
        ref={alwaysEdit ? undefined : inputRef}
        type={type}
        min={min}
        step={step ?? (kind === "rate" ? 0.5 : undefined)}
        className={cn("h-9", numeric && "text-right tabular-nums")}
        value={editVal as string | number}
        placeholder={placeholder}
        onChange={(e) => commit(e.target.value)}
        onBlur={exit}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") { e.preventDefault(); exit(); } }}
      />,
    );
  }
  return shell(collapsed);
}

function fieldBtnCls(changed: boolean, locked: boolean) {
  return cn(
    "flex h-9 w-full items-center gap-2 rounded-md border px-3 text-left text-sm transition-colors",
    locked ? "cursor-not-allowed border-input bg-muted/50 text-muted-foreground" : "border-input bg-background hover:bg-accent",
    changed && "border-edit bg-edit-bg text-edit-foreground hover:bg-edit-bg",
  );
}

/** 欄位外殼：標籤 + 控制項（右側預留 undo 鈕）+ 說明 */
function FieldShell({
  label, help, changed, onUndo, onRedo, children, className,
}: {
  label: string; help?: string; changed: boolean; onUndo?: () => void; onRedo?: () => void; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center gap-1.5">
        <Label className="text-xs">{label}</Label>
        {changed && <span className="rounded bg-edit-bg px-1 text-[10px] font-medium text-edit-foreground">已變更</span>}
      </div>
      <div className="flex items-center gap-1">
        <div className="min-w-0 flex-1">{children}</div>
        {onUndo && (
          <button type="button" onClick={onUndo} title="還原為原始值（會先確認）" aria-label="還原" className="tap-target flex shrink-0 items-center justify-center rounded-md p-1.5 text-warning hover:bg-edit-bg">
            <Undo2 className="size-4" />
          </button>
        )}
        {onRedo && (
          <button type="button" onClick={onRedo} title="重做（回到修改後的值，會先確認）" aria-label="重做" className="tap-target flex shrink-0 items-center justify-center rounded-md p-1.5 text-info hover:bg-info/10">
            <Redo2 className="size-4" />
          </button>
        )}
      </div>
      {help && <p className="text-[11px] leading-snug text-muted-foreground">{help}</p>}
    </div>
  );
}

/** undo/redo 前的行內確認：顯示 舊值→新值，確認才執行 */
function ConfirmBar({
  action, fromText, toText, onCancel, onConfirm,
}: {
  action: "undo" | "redo"; fromText: string; toText: string; onCancel: () => void; onConfirm: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-edit bg-edit-bg px-2 py-1.5 text-xs">
      <span className="font-medium text-edit-foreground">{action === "undo" ? "還原" : "重做"}？</span>
      <span className="text-muted-foreground line-through">{fromText}</span>
      <ArrowRight className="size-3 shrink-0 text-warning" />
      <span className="font-medium text-edit-foreground">{toText}</span>
      <span className="ml-auto flex gap-1">
        <button type="button" onClick={onCancel} className="rounded border border-input bg-background px-2 py-0.5 hover:bg-accent">取消</button>
        <button type="button" onClick={onConfirm} className="rounded bg-primary px-2 py-0.5 text-primary-foreground">確定</button>
      </span>
    </div>
  );
}

/** 唯讀欄位右側的低調鉛筆：暗示可編輯（桌機 hover 加深、觸控恆微顯）。 */
function EditPencil() {
  return (
    <Pencil
      aria-hidden
      className="ml-auto size-3.5 shrink-0 text-muted-foreground/30 transition-colors group-hover:text-muted-foreground [@media(pointer:coarse)]:text-muted-foreground/50"
    />
  );
}

