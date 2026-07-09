import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { usePayrollStore } from "@/store/usePayrollStore";
import { Coachmark } from "@/components/ui/coachmark";
import { TOURS } from "@/content/tours";

/**
 * 導引引擎（app glue，刻意不入元件庫 barrel；可 import store/router/content）。
 * 讀 store.activeTourId → 取對應導引；每步：可自動導覽路由、輪詢等目標元素出現後量 rect 交給 Coachmark；
 * 找不到目標（如尚未點開分頁）＝置中說明卡（導引不代填，等使用者照做再「下一步」）。掛於 App Layout 一次。
 */
export function TourRunner() {
  const activeTourId = usePayrollStore((s) => s.activeTourId);
  const endTour = usePayrollStore((s) => s.endTour);
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
      const el = step.target ? document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`) : null;
      if (el) {
        el.scrollIntoView({ block: "center", behavior: "smooth" });
        setRect(el.getBoundingClientRect());
        return;
      }
      if (step.target && tries < 90) { tries++; raf = requestAnimationFrame(tick); }
      else setRect(null);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [tour, step, stepIndex, location.pathname]);

  // 捲動/縮放時聚光框跟隨
  useEffect(() => {
    if (!step?.target) return;
    const update = () => {
      const el = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
      if (el) setRect(el.getBoundingClientRect());
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
  return (
    <Coachmark
      targetRect={rect}
      title={step.title}
      body={step.body}
      stepIndex={stepIndex}
      stepCount={tour.steps.length}
      isFirst={stepIndex === 0}
      isLast={isLast}
      onPrev={() => setStepIndex((i) => Math.max(0, i - 1))}
      onNext={() => { if (isLast) endTour(tour.id, true); else setStepIndex((i) => i + 1); }}
      onSkip={() => endTour(tour.id, false)}
    />
  );
}
