import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Step {
  key: string;
  label: string;
  hint?: string;
}

interface StepperProps {
  steps: Step[];
  current: string; // 目前步驟 key
  completed?: Record<string, boolean>; // 各步驟是否已完成
  onStep?: (key: string) => void;
}

/** 水平步驟提示：圓圈編號＋標題＋連接線；可點擊切換、完成步驟顯示勾選 */
export function Stepper({ steps, current, completed = {}, onStep }: StepperProps) {
  const currentIndex = steps.findIndex((s) => s.key === current);

  return (
    <ol className="flex w-full items-start overflow-x-auto pb-1">
      {steps.map((s, i) => {
        const isCurrent = s.key === current;
        const isDone = completed[s.key];
        const isPast = i < currentIndex;
        const state: "current" | "done" | "todo" =
          isCurrent ? "current" : isDone || isPast ? "done" : "todo";
        return (
          <li key={s.key} className={cn("flex flex-1 items-start", i === steps.length - 1 && "flex-none")}>
            <button
              type="button"
              onClick={() => onStep?.(s.key)}
              className="group flex flex-col items-center gap-1.5 text-center"
            >
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                  state === "current" && "border-primary bg-primary text-primary-foreground",
                  state === "done" && "border-success bg-success text-white",
                  state === "todo" && "border-muted-foreground/30 bg-background text-muted-foreground group-hover:border-primary/50",
                )}
              >
                {state === "done" ? <Check className="size-4" /> : i + 1}
              </span>
              <span className="w-24 sm:w-32">
                <span
                  className={cn(
                    "block text-xs font-medium leading-tight sm:text-sm",
                    state === "todo" ? "text-muted-foreground" : "text-foreground",
                  )}
                >
                  {s.label}
                </span>
                {s.hint && (
                  <span className="mt-0.5 hidden text-[11px] leading-tight text-muted-foreground sm:block">
                    {s.hint}
                  </span>
                )}
              </span>
            </button>
            {i < steps.length - 1 && (
              <span
                className={cn(
                  "mt-[18px] h-0.5 flex-1",
                  i < currentIndex || isDone ? "bg-success" : "bg-muted-foreground/20",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
