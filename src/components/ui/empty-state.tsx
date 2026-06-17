import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

/** 統一空狀態：圖示＋標題＋說明＋（可選）行動呼籲。取代各處零散的「無資料」文字。 */
export function EmptyState({
  icon,
  title,
  hint,
  action,
  className,
  compact = false,
}: {
  icon?: ReactNode;
  title: string;
  hint?: string;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center", compact ? "py-6" : "py-10", className)}>
      <div className="mb-2 text-muted-foreground/60">{icon ?? <Inbox className="size-7" />}</div>
      <p className="text-sm font-medium">{title}</p>
      {hint && <p className="mt-0.5 max-w-sm text-xs text-muted-foreground">{hint}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
