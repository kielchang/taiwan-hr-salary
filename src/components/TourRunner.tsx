import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { usePayrollStore } from "@/store/usePayrollStore";
import { Coachmark } from "@/components/ui/coachmark";
import { TOURS, type TourStep } from "@/content/tours";

// 選有效目標：窄螢幕（<768，行動抽屜）優先用 mobileTarget（如側邊欄→左上選單鈕），否則用桌機 target。
function pickTarget(step: TourStep, width: number): string | undefined {
  return width < 768 && step.mobileTarget ? step.mobileTarget : step.target;
}

/**
 * 導引引擎（app glue，刻意不入元件庫 barrel；可 import store/router/content）。
 * 讀 store.activeTourId → 取對應導引；每步：可自動導覽路由、輪詢等目標元素出現後量 rect 交給 Coachmark；
 * 找不到目標（如尚未點開分頁）＝置中說明卡（導引不代填，等使用者照做再「下一步」）。掛於 App Layout 一次。
 */
export function TourRunner() {
  const activeTourId = usePayrollStore((s) => s.activeTourId);
  const endTour = usePayrollStore((s) => s.endTour);
  const startTour = usePayrollStore((s) => s.startTour);
  const confirmations = usePayrollStore((s) => s.confirmations);
  const currentPeriod = usePayrollStore((s) => s.currentPeriod);
  const navigate = useNavigate();
  const location = useLocation();
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const navigatedFor = useRef<string>("");

  const tour = activeTourId ? TOURS[activeTourId] : null;
  const step = tour?.steps[stepIndex];

  // 換導引時歸零
  useEffect(() => { setStepIndex(0); navigatedFor.current = ""; }, [activeTourId]);

  // 進入某步：需要時自動導覽路由（每步只導一次，避免迴圈）
  useEffect(() => {
    if (!tour || !step?.route) return;
    const key = `${activeTourId}#${stepIndex}`;
    if (navigatedFor.current === key) return;
    if (location.pathname !== step.route) navigate(step.route);
    navigatedFor.current = key;
  }, [tour, step, stepIndex, activeTourId, location.pathname, navigate]);

  // 輪詢等目標元素出現（route/tab 切換後），量 rect；逾時→置中卡
  useEffect(() => {
    if (!tour || !step) { setRect(null); return; }
    let raf = 0;
    let tries = 0;
    setRect(null);
    const tick = () => {
      const targetId = pickTarget(step, window.innerWidth);
      const el = targetId ? document.querySelector<HTMLElement>(`[data-tour="${targetId}"]`) : null;
      if (el) {
        // 只有目標不在視窗內才捲動，且用即時（非平滑）避免「先量到捲動前位置→聚光環跳一下」的競態
        const r = el.getBoundingClientRect();
        if (r.top < 0 || r.bottom > window.innerHeight) {
          el.scrollIntoView({ block: "center", behavior: "auto" });
        }
        setRect(el.getBoundingClientRect());
        return;
      }
      if (targetId && tries < 90) { tries++; raf = requestAnimationFrame(tick); }
      else setRect(null);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [tour, step, stepIndex, location.pathname]);

  // 互動：此步標記 advanceOn:"click" 時，使用者實際點到圈選處即自動前進（會盯著你操作，而非只換頁）。
  // 用文件層委派監聽（capture），避免元素因重繪換節點而漏接；點在 [data-tour=target] 內即前進。
  useEffect(() => {
    if (!tour || !step?.advanceOn) return;
    const targetId = pickTarget(step, window.innerWidth);
    if (!targetId) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest(`[data-tour="${targetId}"]`)) {
        // 讓 app 自身的點擊處理（換分頁/開對話框）先跑，再前進到下一步
        setTimeout(() => {
          setStepIndex((i) => {
            if (i === tour.steps.length - 1) { endTour(tour.id, true); return i; }
            return i + 1;
          });
        }, 0);
      }
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [tour, step, stepIndex, endTour]);

  // 捲動/縮放時聚光框跟隨
  useEffect(() => {
    if (!step) return;
    const update = () => {
      const targetId = pickTarget(step, window.innerWidth);
      const el = targetId ? document.querySelector<HTMLElement>(`[data-tour="${targetId}"]`) : null;
      setRect(el ? el.getBoundingClientRect() : null);
    };
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [step]);

  if (!tour || !step) return null;
  const isLast = stepIndex === tour.steps.length - 1;
  // 末步若有 next：先把本支記為完成，再啟動下一支（上手三支柱串成一條路徑）
  const nextTour = tour.next && TOURS[tour.next];
  const secondaryAction = isLast && nextTour
    ? { label: tour.nextLabel ?? "接著看下一支 →", onClick: () => { endTour(tour.id, true); startTour(nextTour.id); } }
    : undefined;
  // 需點圈選處才前進的步驟，且目標已量到 rect：顯示互動提示（否則只是投影片）
  const actionHint = step.advanceOn === "click" && rect
    ? (step.actionHint ?? "👆 點上方圈選處即可繼續（或按「下一步」）")
    : undefined;
  // 狀態感知：需可編輯前提的步驟，若當期示範月已確認（硬鎖定），先提示去取消確認，免得「照做卻沒反應」。
  const locked = !!confirmations[currentPeriod];
  const warning = step.requireUnconfirmed && locked
    ? <>此示範月（{currentPeriod}）已確認，<strong>計薪相關情境會被鎖定</strong>：請先到「薪資結算 → 查核與確認」按<strong>取消本月確認</strong>再操作。</>
    : undefined;
  return (
    <Coachmark
      targetRect={rect}
      title={step.title}
      body={step.body}
      stepIndex={stepIndex}
      stepCount={tour.steps.length}
      isFirst={stepIndex === 0}
      isLast={isLast}
      secondaryAction={secondaryAction}
      actionHint={actionHint}
      warning={warning}
      onPrev={() => setStepIndex((i) => Math.max(0, i - 1))}
      onNext={() => { if (isLast) endTour(tour.id, true); else setStepIndex((i) => i + 1); }}
      onSkip={() => endTour(tour.id, false)}
    />
  );
}
