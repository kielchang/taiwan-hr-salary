import { createPortal } from "react-dom";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";
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
}

const PAD = 12;
const GAP = 12;
const HOLE = 6; // 聚光洞比目標外擴的邊距

export function Coachmark({
  targetRect, title, body, stepIndex, stepCount, isFirst, isLast, onNext, onPrev, onSkip, finishLabel = "完成", secondaryAction, actionHint,
}: CoachmarkProps) {
  const popRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

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
        style={pos ? { top: pos.top, left: pos.left } : { opacity: 0 }}
        className={cn(
          // 卡片本身要能接收點擊（root 已 pointer-events-none 讓聚光洞可穿透點到真實控制項）
          "pointer-events-auto fixed w-[min(340px,calc(100vw-24px))] rounded-lg border bg-popover p-3 text-popover-foreground shadow-lg",
        )}
      >
        <div className="mb-1 flex items-start justify-between gap-2">
          <p className="text-sm font-semibold">{title}</p>
          <button type="button" onClick={onSkip} aria-label="略過導引" className="tap-target -m-1 rounded p-1 text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>
        <div className="text-sm text-muted-foreground [&_strong]:text-foreground">{body}</div>
        {actionHint && (
          <p className="mt-2 flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-1.5 text-xs font-medium text-primary">
            <span className="inline-block size-2 shrink-0 animate-pulse rounded-full bg-primary" aria-hidden />
            {actionHint}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs tabular-nums text-muted-foreground">{stepIndex + 1} / {stepCount}</span>
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
