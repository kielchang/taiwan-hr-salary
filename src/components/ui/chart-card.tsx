import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Legend } from "@/components/charts";
import { cn } from "@/lib/utils";

/**
 * 統一圖表容器（全站規範）：一致的標題、描述、工具列、圖例與空狀態，
 * 讓所有圖表外觀與留白一致；圖例用共用 <Legend>，色彩取自 charts 的 PALETTE。
 */
export function ChartCard({
  title,
  description,
  toolbar,
  legend,
  children,
  className,
  contentClassName,
}: {
  title: ReactNode;
  description?: ReactNode;
  toolbar?: ReactNode;
  legend?: { label: string; color: string }[];
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <Card className={cn("print-block", className)}>
      <CardHeader className="flex-row items-start justify-between gap-2 pb-2">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {toolbar && <div className="shrink-0 print:hidden">{toolbar}</div>}
      </CardHeader>
      <CardContent className={cn("space-y-2", contentClassName)}>
        {children}
        {legend && legend.length > 0 && <Legend items={legend} />}
      </CardContent>
    </Card>
  );
}
