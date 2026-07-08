import { useEffect, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { eqValue, fmtValue, type FieldKind } from "@/lib/forms/diff";
import { Undo2, Redo2, Lock, ArrowRight } from "lucide-react";

export interface EditableFieldOption {
  value: string;
  label: string;
}

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

  const display = fmtValue(value, kind, format, unit);
  const isEmpty = display === "—";
  const negMoney = kind === "money" && Number(value) < 0; // 帳務：負值紅字

  // checkbox（是/否）：分段切換
  if (kind === "checkbox") {
    return shell(
      <SegGroup
        options={[{ value: "true", label: "是" }, { value: "false", label: "否" }]}
        value={value ? "true" : "false"}
        onPick={(v) => onChange(v === "true")}
        disabled={disabled} lockHint={lockHint} changed={changed}
      />,
    );
  }

  // radio（單選）：分段按鈕
  if (kind === "radio") {
    return shell(
      <SegGroup
        options={options ?? []}
        value={value == null ? "" : String(value)}
        onPick={(v) => onChange(v)}
        disabled={disabled} lockHint={lockHint} changed={changed}
      />,
    );
  }

  // multiselect（多選）：可切換標籤片
  if (kind === "multiselect") {
    const sel = Array.isArray(value) ? value.map(String) : [];
    return shell(
      <Chips
        options={options ?? []}
        selected={sel}
        onToggle={(v) => onChange(sel.includes(v) ? sel.filter((x) => x !== v) : [...sel, v])}
        disabled={disabled} lockHint={lockHint} changed={changed}
      />,
    );
  }

  if (disabled) {
    return shell(
      <div title={lockHint} className={cn(fieldBtnCls(false, true))}>
        <span className={cn(isEmpty && "text-muted-foreground", negMoney && "text-rose-600 font-medium")}>{display}</span>
        <Lock className="ml-auto size-3.5 opacity-60" />
      </div>,
    );
  }

  // select
  if (kind === "select") {
    if (showInput) {
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
    return shell(
      <button type="button" onClick={() => setEditing(true)} className={cn(fieldBtnCls(changed, false))}>
        <span className={cn(isEmpty && "text-muted-foreground", negMoney && "text-rose-600 font-medium")}>{display}</span>
      </button>,
    );
  }

  // text / number / money / rate / date
  if (showInput) {
    const type = kind === "date" ? "date" : (kind === "number" || kind === "money" || kind === "rate") ? "number" : "text";
    const numeric = kind === "money" || kind === "number" || kind === "rate";
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
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); exit(); } }}
      />,
    );
  }
  const numeric = kind === "money" || kind === "number" || kind === "rate";
  return shell(
    <button type="button" onClick={() => setEditing(true)} className={cn(fieldBtnCls(changed, false))}>
      <span className={cn(isEmpty && "text-muted-foreground", numeric && "ml-auto tabular-nums", negMoney && "text-rose-600 font-medium")}>{display}</span>
    </button>,
  );
}

function fieldBtnCls(changed: boolean, locked: boolean) {
  return cn(
    "flex h-9 w-full items-center gap-2 rounded-md border px-3 text-left text-sm transition-colors",
    locked ? "cursor-not-allowed border-input bg-muted/50 text-muted-foreground" : "border-input bg-background hover:bg-accent",
    changed && "border-amber-400 bg-amber-50 text-amber-900 hover:bg-amber-100",
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
        {changed && <span className="rounded bg-amber-100 px-1 text-[10px] font-medium text-amber-700">已變更</span>}
      </div>
      <div className="flex items-center gap-1">
        <div className="min-w-0 flex-1">{children}</div>
        {onUndo && (
          <button type="button" onClick={onUndo} title="還原為原始值（會先確認）" aria-label="還原" className="shrink-0 rounded-md p-1.5 text-amber-600 hover:bg-amber-100">
            <Undo2 className="size-4" />
          </button>
        )}
        {onRedo && (
          <button type="button" onClick={onRedo} title="重做（回到修改後的值，會先確認）" aria-label="重做" className="shrink-0 rounded-md p-1.5 text-sky-600 hover:bg-sky-100">
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
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-amber-400 bg-amber-50 px-2 py-1.5 text-xs">
      <span className="font-medium text-amber-900">{action === "undo" ? "還原" : "重做"}？</span>
      <span className="text-muted-foreground line-through">{fromText}</span>
      <ArrowRight className="size-3 shrink-0 text-amber-500" />
      <span className="font-medium text-amber-900">{toText}</span>
      <span className="ml-auto flex gap-1">
        <button type="button" onClick={onCancel} className="rounded border border-input bg-background px-2 py-0.5 hover:bg-accent">取消</button>
        <button type="button" onClick={onConfirm} className="rounded bg-primary px-2 py-0.5 text-primary-foreground">確定</button>
      </span>
    </div>
  );
}

/** 分段選擇（是/否、單選 radio）：一列按鈕，選中者高亮 */
function SegGroup({
  options, value, onPick, disabled, lockHint, changed,
}: {
  options: EditableFieldOption[]; value: string; onPick: (v: string) => void; disabled?: boolean; lockHint?: string; changed: boolean;
}) {
  return (
    <div
      title={disabled ? lockHint : undefined}
      className={cn(
        "inline-flex flex-wrap items-center gap-0.5 rounded-md border p-0.5",
        changed ? "border-amber-400 bg-amber-50" : "border-input bg-background",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            disabled={disabled}
            onClick={() => !disabled && onPick(o.value)}
            className={cn(
              "rounded px-3 py-1 text-sm transition-colors",
              active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent",
            )}
          >
            {o.label}
          </button>
        );
      })}
      {disabled && <Lock className="mx-1 size-3.5 opacity-60" />}
    </div>
  );
}

/** 多選標籤片：每個選項一顆可切換的 chip，選中者填色 */
function Chips({
  options, selected, onToggle, disabled, lockHint, changed,
}: {
  options: EditableFieldOption[]; selected: string[]; onToggle: (v: string) => void; disabled?: boolean; lockHint?: string; changed: boolean;
}) {
  return (
    <div
      title={disabled ? lockHint : undefined}
      className={cn(
        "flex flex-wrap items-center gap-1.5 rounded-md border p-1.5",
        changed ? "border-amber-400 bg-amber-50" : "border-input bg-background",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      {options.map((o) => {
        const on = selected.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            disabled={disabled}
            onClick={() => !disabled && onToggle(o.value)}
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-xs transition-colors",
              on ? "border-primary bg-primary/10 font-medium text-primary" : "border-input text-muted-foreground hover:bg-accent",
            )}
          >
            {o.label}
          </button>
        );
      })}
      {options.length === 0 && <span className="px-1 text-xs text-muted-foreground">（無選項）</span>}
      {disabled && <Lock className="size-3.5 opacity-60" />}
    </div>
  );
}
