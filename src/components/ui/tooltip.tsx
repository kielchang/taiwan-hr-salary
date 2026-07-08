import { useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** 桌機 hover／鍵盤聚焦顯示；行動長壓（約 0.35s）顯示，放開後短暫保留再消失。 */
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
  return { open, setOpen, handlers };
}

const bubbleCls =
  "pointer-events-none absolute bottom-full left-0 z-50 mb-1 w-max max-w-[260px] whitespace-normal break-words rounded-md bg-slate-900 px-2 py-1 text-xs font-normal leading-snug text-white shadow-lg";

/** 泡泡：掛載後量測自身，若溢出視窗右/左緣則水平夾擠、上緣不足則翻到下方。 */
function Bubble({ id, children }: { id?: string; children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({ visibility: "hidden" });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const pad = 8;
    let dx = 0;
    if (r.right > window.innerWidth - pad) dx = window.innerWidth - pad - r.right;
    if (r.left + dx < pad) dx = pad - r.left;
    const flipDown = r.top < pad;
    setStyle({
      visibility: "visible",
      transform: dx ? `translateX(${dx}px)` : undefined,
      ...(flipDown ? { top: "100%", bottom: "auto", marginTop: 4, marginBottom: 0 } : {}),
    });
  }, []);
  return (
    <span ref={ref} role="tooltip" id={id} style={style} className={bubbleCls}>
      {children}
    </span>
  );
}

/**
 * 提示泡泡：包住觸發元素，hover／鍵盤聚焦／長壓顯示 content。
 * `focusable` 開啟時觸發器可被 Tab 聚焦並以 aria-describedby 關聯（用於非互動的截斷內容，
 * 如表格儲存格；勿用於已是互動元素內部，避免巢狀可聚焦）。
 */
export function Tooltip({
  content, children, className, focusable,
}: {
  content: ReactNode; children: ReactNode; className?: string; focusable?: boolean;
}) {
  const { open, setOpen, handlers } = useHoverTouch();
  const id = useId();
  if (content == null || content === "") return <>{children}</>;
  return (
    <span
      className={cn("relative inline-flex max-w-full select-none", className)}
      {...handlers}
      {...(focusable
        ? { tabIndex: 0, onFocus: () => setOpen(true), onBlur: () => setOpen(false), "aria-describedby": open ? id : undefined }
        : {})}
    >
      {children}
      {open && <Bubble id={focusable ? id : undefined}>{content}</Bubble>}
    </span>
  );
}

/** 單行截斷文字＋提示泡泡：超出以 … 表示，hover／長壓看完整內容。 */
export function TruncatedText({ text, className, numeric }: { text: string; className?: string; numeric?: boolean }) {
  const { open, handlers } = useHoverTouch();
  const hasTip = Boolean(text) && text !== "—";
  return (
    <span className={cn("relative block min-w-0 flex-1 select-none", numeric && "text-right")} {...handlers}>
      <span className={cn("block truncate", numeric && "tabular-nums", className)}>{text}</span>
      {open && hasTip && <Bubble>{text}</Bubble>}
    </span>
  );
}
