import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type TabPill = { key: string; label: ReactNode; badge?: ReactNode; dataTour?: string };

/**
 * 分頁膠囊列（全站分頁切換的統一元件）：取代各畫面手刻的 `<button>` 分頁列，
 * 確保樣式集中、一改全站同步。含 tablist/tab 語意與觸控目標。
 */
export function TabPills({
  tabs, value, onChange, className,
}: {
  tabs: TabPill[];
  value: string;
  onChange: (key: string) => void;
  className?: string;
}) {
  return (
    <div role="tablist" className={cn("flex flex-wrap gap-1", className)}>
      {tabs.map((t) => {
        const active = t.key === value;
        return (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={active}
            data-tour={t.dataTour}
            onClick={() => onChange(t.key)}
            className={cn(
              "tap-target-y inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
              active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-accent",
            )}
          >
            {t.label}
            {t.badge}
          </button>
        );
      })}
    </div>
  );
}
