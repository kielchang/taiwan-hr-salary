import { cn, ntd } from "@/lib/utils";

/**
 * 差異／變異顯示：以「箭頭符號＋文字標籤＋色彩」三重編碼，
 * 不只靠顏色（色盲與灰階列印仍可辨義）。
 * goodWhen 決定何種方向視為「好」（綠）：例如預算差異 = 預算 − 實際，正值（有餘）為好。
 */
export function Delta({
  value,
  goodWhen = "positive",
  posLabel = "",
  negLabel = "",
  format = ntd,
  zeroLabel = "持平",
  className,
}: {
  value: number;
  goodWhen?: "positive" | "negative";
  posLabel?: string;
  negLabel?: string;
  format?: (n: number) => string;
  zeroLabel?: string;
  className?: string;
}) {
  const r = Math.round(value);
  if (r === 0) {
    return <span className={cn("tabular-nums text-muted-foreground", className)}>— {zeroLabel}</span>;
  }
  const positive = r > 0;
  const good = goodWhen === "positive" ? positive : !positive;
  const arrow = positive ? "▲" : "▼";
  const label = positive ? posLabel : negLabel;
  return (
    <span
      className={cn("inline-flex items-center gap-0.5 tabular-nums", good ? "text-success" : "text-danger", className)}
      title={`${label}${format(Math.abs(r))}`}
    >
      <span aria-hidden>{arrow}</span>
      {label && <span>{label}</span>}
      {format(Math.abs(r))}
    </span>
  );
}
