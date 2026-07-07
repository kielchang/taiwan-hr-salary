import { useEffect, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { eqValue, fmtValue, type FieldKind } from "@/lib/forms/diff";
import { Undo2, Lock } from "lucide-react";

export interface EditableFieldOption {
  value: string;
  label: string;
}

export interface EditableFieldProps {
  label: string;
  value: string | number | boolean | null | undefined;
  /** 原始值（編輯模式傳入）；用於「已變更」標色與還原 */
  original?: string | number | boolean | null | undefined;
  kind: FieldKind;
  onChange: (v: string | number | boolean) => void;
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
  placeholder, disabled, lockHint, help, trackChanges = true, alwaysEdit, min, step, className,
}: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const changed = trackChanges && !alwaysEdit && !eqValue(value, original);
  const showInput = alwaysEdit || editing;

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const exit = () => { if (!alwaysEdit) setEditing(false); };
  const handleRevert = () => { onRevert?.(); setEditing(false); };
  const shell = (children: React.ReactNode) => (
    <FieldShell label={label} help={help} className={className} changed={changed} onRevert={changed && onRevert ? handleRevert : undefined}>
      {children}
    </FieldShell>
  );

  const display = fmtValue(value, kind, format);
  const isEmpty = display === "—";

  // checkbox：點顯示即切換（無獨立輸入態）
  if (kind === "checkbox") {
    return shell(
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && onChange(!value)}
        title={disabled ? lockHint : undefined}
        className={cn(fieldBtnCls(changed, !!disabled))}
      >
        <span className="underline decoration-dashed underline-offset-4">{value ? "是" : "否"}</span>
        {disabled && <Lock className="ml-auto size-3.5 opacity-60" />}
      </button>,
    );
  }

  if (disabled) {
    return shell(
      <div title={lockHint} className={cn(fieldBtnCls(false, true))}>
        <span className={cn(!isEmpty && "underline decoration-dashed underline-offset-4", isEmpty && "text-muted-foreground")}>{display}</span>
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
        <span className={cn(!isEmpty && "underline decoration-dashed underline-offset-4", isEmpty && "text-muted-foreground")}>{display}</span>
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
      <span className={cn(!isEmpty && "underline decoration-dashed underline-offset-4", isEmpty && "text-muted-foreground", numeric && "ml-auto tabular-nums")}>{display}</span>
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
  label, help, changed, onRevert, children, className,
}: {
  label: string; help?: string; changed: boolean; onRevert?: () => void; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center gap-1.5">
        <Label className="text-xs">{label}</Label>
        {changed && <span className="rounded bg-amber-100 px-1 text-[10px] font-medium text-amber-700">已變更</span>}
      </div>
      <div className="flex items-center gap-1">
        <div className="min-w-0 flex-1">{children}</div>
        {onRevert && (
          <button
            type="button"
            onClick={onRevert}
            title="還原為原始值"
            aria-label="還原為原始值"
            className="shrink-0 rounded-md p-1.5 text-amber-600 hover:bg-amber-100"
          >
            <Undo2 className="size-4" />
          </button>
        )}
      </div>
      {help && <p className="text-[11px] leading-snug text-muted-foreground">{help}</p>}
    </div>
  );
}
