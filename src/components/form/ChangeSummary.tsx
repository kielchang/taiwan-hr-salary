import { cn } from "@/lib/utils";
import type { Change } from "@/lib/forms/diff";
import { Undo2, ArrowRight } from "lucide-react";

/** 送出前的變更摘要：逐列「舊值→新值」，可逐欄或全部還原。空＝尚無變更。 */
export function ChangeSummary({
  changes, onRevertField, onRevertAll, className,
}: {
  changes: Change[];
  onRevertField?: (field: string) => void;
  onRevertAll?: () => void;
  className?: string;
}) {
  if (changes.length === 0) {
    return (
      <div className={cn("rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground", className)}>
        尚無變更
      </div>
    );
  }
  return (
    <div className={cn("rounded-md border border-amber-300 bg-amber-50/60 p-3", className)}>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-amber-900">本次變更（{changes.length}）</p>
        {onRevertAll && (
          <button type="button" onClick={onRevertAll} className="flex items-center gap-1 text-xs text-amber-700 hover:underline">
            <Undo2 className="size-3.5" /> 全部還原
          </button>
        )}
      </div>
      <ul className="space-y-1">
        {changes.map((c) => (
          <li key={c.field} className="flex items-center gap-2 text-xs">
            <span className="w-24 shrink-0 truncate text-muted-foreground" title={c.label}>{c.label}</span>
            <span className="truncate text-muted-foreground line-through">{c.beforeText}</span>
            <ArrowRight className="size-3 shrink-0 text-amber-500" />
            <span className="truncate font-medium text-amber-900">{c.afterText}</span>
            {onRevertField && (
              <button type="button" onClick={() => onRevertField(c.field)} title="還原此欄" aria-label="還原此欄" className="ml-auto shrink-0 rounded p-0.5 text-amber-600 hover:bg-amber-100">
                <Undo2 className="size-3.5" />
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
