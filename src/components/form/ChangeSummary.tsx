import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Change } from "@/lib/forms/diff";
import { Tooltip } from "@/components/ui/tooltip";
import { Undo2, ArrowRight } from "lucide-react";

type Pending = { field: string; from: string; to: string } | { all: true };

/** 行內還原確認：顯示 現值→還原後，確認才執行（與欄位 undo 一致）。 */
function RevertConfirm({ from, to, onCancel, onConfirm }: { from: string; to: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <span className="flex flex-1 flex-wrap items-center gap-1.5 rounded border border-edit bg-edit-bg px-2 py-1">
      <span className="font-medium text-edit-foreground">還原？</span>
      <span className="text-muted-foreground line-through">{from}</span>
      <ArrowRight className="size-3 shrink-0 text-warning" />
      <span className="font-medium text-edit-foreground">{to}</span>
      <span className="ml-auto flex gap-1">
        <button type="button" onClick={onCancel} className="tap-target-y rounded border border-input bg-background px-2 py-0.5 hover:bg-accent">取消</button>
        <button type="button" onClick={onConfirm} className="tap-target-y rounded bg-primary px-2 py-0.5 text-primary-foreground">確定</button>
      </span>
    </span>
  );
}

/** 送出前的變更摘要：逐列「舊值→新值」，可逐欄或全部還原（先確認）。空＝尚無變更。 */
export function ChangeSummary({
  changes, onRevertField, onRevertAll, className,
}: {
  changes: Change[];
  onRevertField?: (field: string) => void;
  onRevertAll?: () => void;
  className?: string;
}) {
  const [pending, setPending] = useState<Pending | null>(null);

  if (changes.length === 0) {
    return (
      <div className={cn("rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground", className)}>
        尚無變更
      </div>
    );
  }
  const allPending = pending != null && "all" in pending;
  return (
    <div className={cn("rounded-md border border-edit bg-edit-bg/60 p-3", className)}>
      <div className="mb-2 flex items-center justify-between gap-2 text-xs">
        <p className="text-sm font-medium text-edit-foreground">本次變更（{changes.length}）</p>
        {onRevertAll && (allPending ? (
          <RevertConfirm
            from={`${changes.length} 項變更`}
            to="全部原始值"
            onCancel={() => setPending(null)}
            onConfirm={() => { onRevertAll(); setPending(null); }}
          />
        ) : (
          <button type="button" onClick={() => setPending({ all: true })} className="tap-target-y flex items-center gap-1 text-edit-foreground hover:underline">
            <Undo2 className="size-3.5" /> 全部還原
          </button>
        ))}
      </div>
      <ul className={cn("space-y-1", changes.length > 8 && "max-h-56 overflow-y-auto pr-1")}>
        {changes.map((c) => {
          const fieldPending = pending != null && "field" in pending && pending.field === c.field;
          return (
            <li key={c.field} className="flex items-center gap-2 text-xs">
              {fieldPending ? (
                <RevertConfirm
                  from={c.afterText}
                  to={c.beforeText}
                  onCancel={() => setPending(null)}
                  onConfirm={() => { onRevertField?.(c.field); setPending(null); }}
                />
              ) : (
                <>
                  <Tooltip content={c.label} className="w-24 shrink-0" focusable><span className="block truncate text-muted-foreground">{c.label}</span></Tooltip>
                  <Tooltip content={c.beforeText} className="min-w-0" focusable><span className="block truncate text-muted-foreground line-through">{c.beforeText}</span></Tooltip>
                  <ArrowRight className="size-3 shrink-0 text-warning" />
                  <Tooltip content={c.afterText} className="min-w-0" focusable><span className="block truncate font-medium text-edit-foreground">{c.afterText}</span></Tooltip>
                  {onRevertField && (
                    <button type="button" onClick={() => setPending({ field: c.field, from: c.afterText, to: c.beforeText })} title="還原此欄" aria-label={`還原 ${c.label}`} className="tap-target ml-auto flex shrink-0 items-center justify-center rounded p-0.5 text-warning hover:bg-edit-bg">
                      <Undo2 className="size-3.5" />
                    </button>
                  )}
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
