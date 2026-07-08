import { useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** 桌機 hover、行動長壓（約 0.35s）顯示；放開後短暫保留再消失。 */
function useHoverTouch() {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clear = () => { if (timer.current) { clearTimeout(timer.current); timer.current = null; } };
  const handlers = {
    onMouseEnter: () => setOpen(true),
    onMouseLeave: () => setOpen(false),
    onTouchStart: () => { clear(); timer.current = setTimeout(() => setOpen(true), 350); },
    onTouchEnd: () => { clear(); timer.current = setTimeout(() => setOpen(false), 1500); },
    onTouchMove: () => clear(),
  };
  return { open, handlers };
}

const bubbleCls =
  "pointer-events-none absolute bottom-full left-0 z-50 mb-1 w-max max-w-[260px] whitespace-normal break-words rounded-md bg-slate-900 px-2 py-1 text-xs font-normal leading-snug text-white shadow-lg";

/** 提示泡泡：包住觸發元素，hover/長壓顯示 content（放上滑鼠或手機長壓看完整內容）。 */
export function Tooltip({ content, children, className }: { content: ReactNode; children: ReactNode; className?: string }) {
  const { open, handlers } = useHoverTouch();
  if (content == null || content === "") return <>{children}</>;
  return (
    <span className={cn("relative inline-flex max-w-full", className)} {...handlers}>
      {children}
      {open && <span role="tooltip" className={bubbleCls}>{content}</span>}
    </span>
  );
}

/** 單行截斷文字＋提示泡泡：超出以 … 表示，hover/長壓看完整內容。 */
export function TruncatedText({ text, className, numeric }: { text: string; className?: string; numeric?: boolean }) {
  const { open, handlers } = useHoverTouch();
  const hasTip = Boolean(text) && text !== "—";
  return (
    <span className={cn("relative block min-w-0 flex-1", numeric && "text-right")} {...handlers}>
      <span className={cn("block truncate", numeric && "tabular-nums", className)}>{text}</span>
      {open && hasTip && <span role="tooltip" className={bubbleCls}>{text}</span>}
    </span>
  );
}
