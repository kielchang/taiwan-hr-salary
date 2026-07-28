// 模擬畫面積木（Mockup primitives）：文件/手冊「零截圖」操作示意的基礎元件。
// 設計原則（UX 規範，見 docs/ui-kit/mock-screens.md）：
//   重點控制項＝元件庫真元件包 <Spotlight>；非重點區域＝<Placeholder> 佔位留白。
// 聚光視覺＝系統內導覽同一套 tour-pulse 主色脈動環（index.css；含 prefers-reduced-motion 靜態降級）
// ——讀者在手冊與系統內看到同一種「看這裡」語言。琥珀色專屬「已改動未送出」，不得用於聚光。
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** 佔位塊：非重點區域一律留白（muted 圓角塊，可帶淡字標籤）。寬高為版面數值，保留 style 傳入。 */
export function Placeholder({
  w, h = 14, label, className,
}: { w?: number | string; h?: number; label?: string; className?: string }) {
  return (
    <div
      className={cn("mock-ph flex shrink-0 items-center justify-center overflow-hidden whitespace-nowrap rounded-md bg-muted text-[11px] text-muted-foreground", className)}
      style={{ width: w ?? "100%", height: h }}
    >
      {label ?? ""}
    </div>
  );
}

/** 聚光：包住「重點元件」——主色脈動環（tour-pulse，與系統內導覽同視覺）＋可選浮動標籤。 */
export function Spotlight({ children, label, className }: { children: ReactNode; label?: string; className?: string }) {
  return (
    <span className={cn("tour-pulse-ring relative inline-block rounded-lg p-1", className)}>
      {children}
      {label && (
        <span
          className="absolute left-2 whitespace-nowrap rounded-md bg-primary px-2 py-0.5 text-[11px] text-primary-foreground"
          style={{ top: -10, transform: "translateY(-100%)" }}
        >
          {label}
        </span>
      )}
    </span>
  );
}

/** 畫面框：模擬系統版面（側欄/頂欄＝佔位），children 放該步驟的排版。
 *  min-w 保底＝小螢幕靠外層容器橫向捲動，不擠壞排版。 */
export function MockScreenFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-w-[460px] gap-2.5 bg-background p-3 text-foreground", className)} style={{ minHeight: 230 }}>
      <div className="flex w-[90px] flex-col gap-1.5">
        <Placeholder h={22} label="選單" />
        <Placeholder h={14} /><Placeholder h={14} /><Placeholder h={14} /><Placeholder h={14} /><Placeholder h={14} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        <Placeholder h={20} label="頂部狀態列" />
        <div className="flex flex-col items-stretch gap-2.5">{children}</div>
      </div>
    </div>
  );
}

/** 表格假列（可帶重點格 focus） */
export function MockRow({ focus }: { focus?: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <Placeholder w={64} /><Placeholder w={90} /><Placeholder /><Placeholder w={70} />
      {focus ?? <Placeholder w={64} h={22} />}
    </div>
  );
}
