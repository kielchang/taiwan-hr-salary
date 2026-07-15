import { createPortal } from "react-dom";
import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { X, Minus, Maximize2 } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

/**
 * 導引聚光框（純呈現原語）：暗化畫面、圈住目標元素、旁邊顯示彈出框
 * （標題／說明／第 n·N 步／上一步·下一步·略過）。
 *
 * ── 只呈現、不含邏輯：目標矩形 `targetRect`、內容、步進狀態與回呼全由外部（TourRunner）傳入；
 *    本元件不 import store/router/content（元件庫邊界，鐵律 9）。
 * ── 聚光挖洞用 box-shadow spread 罩住洞外、洞本身 `pointer-events:none` 讓使用者仍能點到被標示的元素
 *    （導引不代填：使用者自己操作）。`targetRect` 為 null＝置中卡（歡迎/找不到錨點時）。
 * ── 彈出框邊緣感知：優先在目標下方，空間不足翻上方；水平置中並夾在視窗內。經 portal 掛 body 避免堆疊脈絡問題。
 */
export interface CoachmarkProps {
  targetRect: DOMRect | null;
  title: string;
  body: ReactNode;
  stepIndex: number; // 0-based
  stepCount: number;
  isFirst: boolean;
  isLast: boolean;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  /** 末步的主鈕文字（預設「完成」） */
  finishLabel?: string;
  /** 選配次要動作（如末步「接著看下一支導覽」）；提供即在主鈕左側顯示一顆 outline 鈕 */
  secondaryAction?: { label: string; onClick: () => void };
  /** 選配互動提示：此步需使用者實際點圈選處才前進時，於卡片顯示脈動指示（如「👆 點上方圈選的按鈕」）。 */
  actionHint?: ReactNode;
  /** 選配警示（危險/前置條件未滿足，如「此示範月已確認，需先取消確認」）；以 danger 樣式顯示於說明下方。 */
  warning?: ReactNode;
  /** 驗收模式：顯示「通過／有問題＋備註」逐步標記列（用於 audience:"acceptance" 導覽）。純呈現，狀態由 TourRunner 保存。 */
  showVerdict?: boolean;
  verdict?: "pass" | "issue" | null;
  onVerdict?: (v: "pass" | "issue") => void;
  note?: string;
  onNote?: (s: string) => void;
}

const PAD = 12;
const GAP = 12;
const HOLE = 6; // 聚光洞比目標外擴的邊距

export function Coachmark({
  targetRect, title, body, stepIndex, stepCount, isFirst, isLast, onNext, onPrev, onSkip, finishLabel = "完成", secondaryAction, actionHint, warning,
  showVerdict, verdict, onVerdict, note, onNote,
}: CoachmarkProps) {
  const popRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  // 縮小：需要實際操作（開對話框/切子分頁）時，把導覽卡收成右下角小膠囊，整個畫面恢復可操作。
  const [collapsed, setCollapsed] = useState(false);

  // 無障礙：進入每一步把焦點移入卡片（螢幕報讀者會唸出 aria-live 的步驟內容），
  // 並讓鍵盤操作（Esc/←/→/Enter）作用在卡片上——不搶輸入框焦點（只在換步時 focus 一次）。
  // 換步一律先展開，確保每步都先看到新說明（避免上一步縮小後漏讀下一步）。
  useEffect(() => { setCollapsed(false); popRef.current?.focus(); }, [stepIndex]);
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") { e.preventDefault(); onSkip(); }
    else if (e.key === "ArrowRight") { e.preventDefault(); onNext(); }
    else if (e.key === "ArrowLeft") { if (!isFirst) { e.preventDefault(); onPrev(); } }
    // Enter 只在焦點落在卡片本體（非內部按鈕）時前進，避免與按鈕預設行為重複觸發
    else if (e.key === "Enter" && e.target === popRef.current) { e.preventDefault(); onNext(); }
  };

  useLayoutEffect(() => {
    const el = popRef.current;
    if (!el) return;
    const pw = el.offsetWidth;
    const ph = el.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (!targetRect) {
      setPos({ top: Math.max(PAD, (vh - ph) / 2), left: Math.max(PAD, (vw - pw) / 2) });
      return;
    }
    // 優先目標下方；下方空間不足→翻上方
    let top = targetRect.bottom + GAP;
    if (top + ph > vh - PAD) top = Math.max(PAD, targetRect.top - ph - GAP);
    // 水平：以目標中心對齊、夾在視窗內
    let left = targetRect.left + targetRect.width / 2 - pw / 2;
    left = Math.min(Math.max(PAD, left), Math.max(PAD, vw - pw - PAD));
    setPos({ top, left });
  }, [targetRect, title, body, stepIndex, stepCount]);

  // 縮小態：只留右下角膠囊，隱藏暗罩/聚光/卡片 → 整個畫面可操作（唯一擋點是 pointer-events-auto 的卡片）。
  if (collapsed) {
    return createPortal(
      <div className="pointer-events-none fixed inset-0 z-[200]">
        <div className="pointer-events-auto fixed bottom-4 right-4 flex items-center gap-2 rounded-full border bg-popover px-3 py-2 text-xs shadow-lg">
          <span className="tabular-nums text-muted-foreground">導引 {stepIndex + 1}/{stepCount}</span>
          <Button size="sm" variant="outline" onClick={() => setCollapsed(false)}><Maximize2 className="size-3.5" /> 展開</Button>
          <button type="button" onClick={onSkip} className="text-[11px] text-muted-foreground underline underline-offset-2">略過</button>
        </div>
      </div>,
      document.body,
    );
  }

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[200]" role="dialog" aria-modal="false" aria-label="操作導引">
      {/* 暗罩＋聚光挖洞（洞可穿透點擊到被標示的元素） */}
      {targetRect ? (
        <>
          {/* 挖洞暗罩：巨大 spread box-shadow 罩住洞外；洞本身透明可點穿 */}
          <div
            className="pointer-events-none fixed rounded-md"
            style={{
              top: targetRect.top - HOLE,
              left: targetRect.left - HOLE,
              width: targetRect.width + HOLE * 2,
              height: targetRect.height + HOLE * 2,
              boxShadow: "0 0 0 9999px rgba(15,23,42,0.55)",
            }}
          />
          {/* 脈動環：呼吸式外擴光暈，把視線拉到「該注意/該點」的控制項 */}
          <div
            className="tour-pulse-ring pointer-events-none fixed rounded-md"
            style={{
              top: targetRect.top - HOLE,
              left: targetRect.left - HOLE,
              width: targetRect.width + HOLE * 2,
              height: targetRect.height + HOLE * 2,
            }}
          />
        </>
      ) : (
        <div className="pointer-events-none fixed inset-0 bg-slate-900/55" />
      )}

      {/* 彈出框 */}
      <div
        ref={popRef}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        aria-live="polite"
        style={pos ? { top: pos.top, left: pos.left } : { opacity: 0 }}
        className={cn(
          // 卡片本身要能接收點擊（root 已 pointer-events-none 讓聚光洞可穿透點到真實控制項）
          "pointer-events-auto fixed w-[min(340px,calc(100vw-24px))] rounded-lg border bg-popover p-3 text-popover-foreground shadow-lg outline-none ring-1 ring-transparent focus-visible:ring-primary",
        )}
      >
        <div className="mb-1 flex items-start justify-between gap-2">
          <p className="text-sm font-semibold">{title}</p>
          <div className="-m-1 flex items-center gap-0.5">
            <button type="button" onClick={() => setCollapsed(true)} aria-label="縮小導引（騰出空間操作，之後可展開）" title="縮小（騰出空間操作）" className="tap-target rounded p-1 text-muted-foreground hover:text-foreground">
              <Minus className="size-4" />
            </button>
            <button type="button" onClick={onSkip} aria-label="略過導引" className="tap-target rounded p-1 text-muted-foreground hover:text-foreground">
              <X className="size-4" />
            </button>
          </div>
        </div>
        <div className="text-sm text-muted-foreground [&_strong]:text-foreground">{body}</div>
        {warning && (
          <p className="mt-2 rounded-md border border-danger/40 bg-danger/10 px-2 py-1.5 text-xs text-danger [&_strong]:text-danger">{warning}</p>
        )}
        {actionHint && (
          <p className="mt-2 flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-1.5 text-xs font-medium text-primary">
            <span className="inline-block size-2 shrink-0 animate-pulse rounded-full bg-primary" aria-hidden />
            {actionHint}
          </p>
        )}
        {showVerdict && (
          <div className="mt-2 rounded-md border bg-muted/40 p-2">
            <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">驗收此步：</p>
            <div className="flex gap-2" role="radiogroup" aria-label="驗收結果">
              <button
                type="button" role="radio" aria-checked={verdict === "pass"} onClick={() => onVerdict?.("pass")}
                className={cn("tap-target flex-1 rounded-md border px-2 py-1 text-xs font-medium",
                  verdict === "pass" ? "border-success bg-success/15 text-success" : "text-muted-foreground hover:bg-accent")}
              >✅ 通過</button>
              <button
                type="button" role="radio" aria-checked={verdict === "issue"} onClick={() => onVerdict?.("issue")}
                className={cn("tap-target flex-1 rounded-md border px-2 py-1 text-xs font-medium",
                  verdict === "issue" ? "border-danger bg-danger/15 text-danger" : "text-muted-foreground hover:bg-accent")}
              >❌ 有問題</button>
            </div>
            {verdict === "issue" && (
              <textarea
                value={note ?? ""} onChange={(e) => onNote?.(e.target.value)} rows={2}
                placeholder="（選填）問題描述，會寫進驗收報告"
                className="col-input mt-2 w-full resize-none rounded-md px-2 py-1 text-xs"
              />
            )}
          </div>
        )}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs tabular-nums text-muted-foreground">
            {stepIndex + 1} / {stepCount}
            <span className="ml-1.5 hidden text-[10px] text-muted-foreground/70 sm:inline" aria-hidden>· ← → 換步 · Esc 略過</span>
          </span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onSkip} className="text-[11px] text-muted-foreground underline underline-offset-2">略過</button>
            {!isFirst && <Button variant="outline" size="sm" onClick={onPrev}>上一步</Button>}
            {isLast && secondaryAction && <Button variant="outline" size="sm" onClick={secondaryAction.onClick}>{secondaryAction.label}</Button>}
            <Button size="sm" onClick={onNext}>{isLast ? finishLabel : "下一步"}</Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
