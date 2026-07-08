import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { CheckCircle2, AlertTriangle, Lightbulb, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type CalloutVariant = "success" | "warning" | "info" | "danger";

const VARIANT: Record<CalloutVariant, { wrap: string; color: string; icon: LucideIcon }> = {
  success: { wrap: "border-success/30 bg-success/10", color: "text-success", icon: CheckCircle2 },
  warning: { wrap: "border-warning/40 bg-warning/10", color: "text-warning", icon: AlertTriangle },
  info: { wrap: "border-info/30 bg-info/10", color: "text-info", icon: Lightbulb },
  danger: { wrap: "border-danger/30 bg-danger/10", color: "text-danger", icon: AlertCircle },
};

/** 統一狀態提示框（良好/警示/提醒/危險）：圖示＋（可選）標籤＋標題＋內文。取代各處零散手刻的
 * 原始調色盤色塊（原本各畫面各自 border/bg/text 三件套硬編色），改走語意 token——換圖表色票主題
 * 或深色模式都不會漂移（狀態語意與分類色票脫鉤，同 Bullet 圖表的處理原則）。 */
export function Callout({
  variant,
  title,
  tag,
  icon,
  children,
  className,
}: {
  variant: CalloutVariant;
  title: ReactNode;
  tag?: string;
  icon?: LucideIcon;
  children?: ReactNode;
  className?: string;
}) {
  const v = VARIANT[variant];
  const Icon = icon ?? v.icon;
  return (
    <div className={cn("flex items-start gap-2.5 rounded-md border p-3", v.wrap, className)}>
      <Icon className={cn("mt-0.5 size-4 shrink-0", v.color)} />
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-semibold", v.color)}>
          {tag && (
            <span className="mr-1.5 rounded bg-background/70 px-1 py-0.5 align-middle text-[10px] font-medium">
              {tag}
            </span>
          )}
          {title}
        </p>
        {children && <div className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{children}</div>}
      </div>
    </div>
  );
}
