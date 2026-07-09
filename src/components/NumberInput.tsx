import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface NumberInputProps {
  value: number;
  onChange: (v: number) => void;
  className?: string;
  step?: number;
  min?: number;
  disabled?: boolean;
}

/** 數字輸入（col-input＝「可編輯欄位」統一長相：淡冷底＋清楚邊框，見 index.css 欄位用色） */
export function NumberInput({ value, onChange, className, step, min, disabled }: NumberInputProps) {
  return (
    <Input
      type="number"
      inputMode="numeric"
      step={step}
      min={min}
      disabled={disabled}
      value={Number.isFinite(value) ? value : 0}
      onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
      className={cn("h-8 w-28 text-right tabular-nums col-input", className)}
    />
  );
}
