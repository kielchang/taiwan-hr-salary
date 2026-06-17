// 零相依 SVG 圖表元件（薪酬分析用）。純展示、接 data props、viewBox 自適應寬度。
// 互動：以 Pointer Events 統一滑鼠與觸控 —— 移入/點擊高亮目標、浮動提示顯示數據，
// 並可透過 onSelect 回呼讓上層做「點擊鑽取明細清單」。
import { useState } from "react";
import type { ReactNode } from "react";
import { ntd } from "@/lib/utils";

export const PALETTE = ["#0ea5e9", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#64748b", "#14b8a6", "#ec4899"];

const AXIS = "#cbd5e1";
const GRID = "#e2e8f0";
const TEXT = "#475569";

/* ───────────── 互動共用 ───────────── */

/** 追蹤指標位置（相對容器）與目前 hover 的索引；滑鼠與觸控共用 Pointer Events。 */
function useHover() {
  const [idx, setIdx] = useState<number | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const onMove = (e: React.PointerEvent) => {
    const r = e.currentTarget.getBoundingClientRect();
    setPos({ x: e.clientX - r.left, y: e.clientY - r.top });
  };
  return { idx, setIdx, pos, onMove };
}

/** 浮動提示泡泡（HTML 疊在 SVG 之上，依指標位置定位；近頂端時改顯示於下方） */
function ChartTip({ pos, show, children }: { pos: { x: number; y: number }; show: boolean; children: ReactNode }) {
  if (!show) return null;
  const below = pos.y < 52;
  return (
    <div
      className="pointer-events-none absolute z-30 max-w-[220px] rounded-md border bg-popover px-2 py-1 text-[11px] leading-snug text-popover-foreground shadow-md"
      style={{ left: pos.x, top: pos.y + (below ? 14 : -10), transform: `translate(-50%, ${below ? "0" : "-100%"})` }}
    >
      {children}
    </div>
  );
}

const selectHint = (on: boolean) => (on ? <div className="mt-0.5 text-[10px] text-muted-foreground">點擊看明細</div> : null);

export interface Segment {
  label: string;
  value: number;
  color: string;
}

/** 水平堆疊長條（成本組成、部門成本）。每列一類別、內部分段；可點整列鑽取（onSelectRow）。 */
export function StackedBar({
  rows, height = 28, onSelectRow, selectedRow = null,
}: {
  rows: { label: string; segments: Segment[] }[];
  height?: number;
  onSelectRow?: (label: string) => void;
  selectedRow?: string | null;
}) {
  const [hover, setHover] = useState<{ ri: number; si: number } | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const max = Math.max(1, ...rows.map((r) => r.segments.reduce((a, s) => a + s.value, 0)));
  const onMove = (e: React.PointerEvent) => {
    const r = e.currentTarget.getBoundingClientRect();
    setPos({ x: e.clientX - r.left, y: e.clientY - r.top });
  };
  const seg = hover ? rows[hover.ri]?.segments[hover.si] : null;
  return (
    <div className="relative select-none" onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
      <div className="space-y-1.5">
        {rows.map((r, ri) => {
          const total = r.segments.reduce((a, s) => a + s.value, 0);
          const sel = selectedRow === r.label;
          let x = 0;
          return (
            <div
              key={r.label}
              className={`flex items-center gap-2 rounded ${onSelectRow ? "cursor-pointer hover:bg-accent/40" : ""} ${sel ? "bg-accent/60 ring-1 ring-primary/40" : ""}`}
              onPointerDown={() => onSelectRow?.(r.label)}
            >
              <span className="w-28 shrink-0 truncate pl-1 text-xs text-muted-foreground" title={r.label}>{r.label}</span>
              <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="h-6 flex-1" role="img">
                {r.segments.map((s, si) => {
                  const w = max > 0 ? (s.value / max) * 100 : 0;
                  const active = hover?.ri === ri && hover?.si === si;
                  const rect = (
                    <rect key={si} x={x} y={2} width={Math.max(0, w)} height={height - 4} fill={s.color}
                      fillOpacity={hover && !active ? 0.55 : 1}
                      onPointerEnter={() => setHover({ ri, si })}
                      onPointerDown={() => setHover({ ri, si })} />
                  );
                  x += w;
                  return rect;
                })}
              </svg>
              <span className="w-20 shrink-0 pr-1 text-right text-xs tabular-nums">{ntd(total)}</span>
            </div>
          );
        })}
      </div>
      <ChartTip pos={pos} show={!!seg}>
        {seg && (
          <>
            <div className="font-medium">{rows[hover!.ri].label} · {seg.label}</div>
            <div className="tabular-nums">{ntd(seg.value)}</div>
            {selectHint(!!onSelectRow)}
          </>
        )}
      </ChartTip>
    </div>
  );
}

/** 圖例 */
export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1">
      {items.map((it) => (
        <span key={it.label} className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <span className="size-2.5 rounded-sm" style={{ background: it.color }} />
          {it.label}
        </span>
      ))}
    </div>
  );
}

export interface BarDatum { label: string; value: number; id?: string }

/** 垂直長條圖（直方圖、部門中位、調幅%）。hover 高亮＋提示；可 onSelect 鑽取。 */
export function BarChart({
  data, height = 160, color = PALETTE[0], valueFmt = ntd, onSelect, selectedIndex = null,
}: {
  data: BarDatum[];
  height?: number;
  color?: string;
  valueFmt?: (n: number) => string;
  onSelect?: (item: BarDatum, index: number) => void;
  selectedIndex?: number | null;
}) {
  const { idx, setIdx, pos, onMove } = useHover();
  if (data.length === 0) return <Empty />;
  const W = 320, H = height;
  const pad = { l: 8, r: 8, t: 10, b: 28 };
  const max = Math.max(1, ...data.map((d) => d.value));
  const bw = (W - pad.l - pad.r) / data.length;
  const activeI = idx ?? selectedIndex;
  return (
    <div className="relative select-none" onPointerMove={onMove} onPointerDown={onMove} onPointerLeave={() => setIdx(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img">
        {data.map((d, i) => {
          const h = ((H - pad.t - pad.b) * d.value) / max;
          const x = pad.l + i * bw;
          const y = H - pad.b - h;
          const hl = activeI === null || activeI === i;
          return (
            <g key={i}>
              <rect x={x + bw * 0.12} y={y} width={bw * 0.76} height={Math.max(0, h)} fill={color} rx={1} fillOpacity={hl ? 1 : 0.3} pointerEvents="none" />
              {selectedIndex === i && <rect x={x + bw * 0.12} y={y} width={bw * 0.76} height={Math.max(0, h)} fill="none" stroke="#0f172a" strokeWidth={1} rx={1} pointerEvents="none" />}
              <rect x={x} y={pad.t} width={bw} height={H - pad.t - pad.b} fill="transparent"
                style={{ cursor: onSelect ? "pointer" : "default" }}
                onPointerEnter={() => setIdx(i)}
                onPointerDown={() => { setIdx(i); onSelect?.(d, i); }} />
              <text x={x + bw / 2} y={H - pad.b + 10} textAnchor="middle" fontSize="7" fill={TEXT}>
                {d.label.length > 6 ? d.label.slice(0, 6) : d.label}
              </text>
            </g>
          );
        })}
        <line x1={pad.l} y1={H - pad.b} x2={W - pad.r} y2={H - pad.b} stroke={AXIS} strokeWidth={0.5} />
      </svg>
      <ChartTip pos={pos} show={idx !== null}>
        {idx !== null && (
          <>
            <div className="font-medium">{data[idx].label}</div>
            <div className="tabular-nums">{valueFmt(data[idx].value)}</div>
            {selectHint(!!onSelect)}
          </>
        )}
      </ChartTip>
    </div>
  );
}

/** 折線圖（Lorenz 曲線：可加對角線基準）。hover 顯示累積人口/薪資比。 */
export function LineChart({
  points, diagonal = false, height = 200,
}: {
  points: { x: number; y: number }[]; // x,y ∈ [0,1]
  diagonal?: boolean;
  height?: number;
}) {
  const { idx, setIdx, pos, onMove } = useHover();
  const W = 240, H = height, pad = 24;
  const sx = (x: number) => pad + x * (W - 2 * pad);
  const sy = (y: number) => H - pad - y * (H - 2 * pad);
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join(" ");
  return (
    <div className="relative select-none" onPointerMove={onMove} onPointerLeave={() => setIdx(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img">
        <rect x={pad} y={pad} width={W - 2 * pad} height={H - 2 * pad} fill="none" stroke={GRID} strokeWidth={0.5} />
        {diagonal && <line x1={sx(0)} y1={sy(0)} x2={sx(1)} y2={sy(1)} stroke={AXIS} strokeDasharray="3 2" strokeWidth={0.8} />}
        <path d={path} fill="none" stroke={PALETTE[0]} strokeWidth={1.5} />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={sx(p.x)} cy={sy(p.y)} r={idx === i ? 3 : 1.4} fill={PALETTE[0]} />
            <circle cx={sx(p.x)} cy={sy(p.y)} r={7} fill="transparent"
              onPointerEnter={() => setIdx(i)} onPointerDown={() => setIdx(i)} />
          </g>
        ))}
      </svg>
      <ChartTip pos={pos} show={idx !== null}>
        {idx !== null && <div>累積人口 {(points[idx].x * 100).toFixed(0)}%<br />取得薪資 {(points[idx].y * 100).toFixed(0)}%</div>}
      </ChartTip>
    </div>
  );
}

/** Pareto：長條（由大到小）＋累積百分比折線。hover 提示佔比；可 onSelect 鑽取。 */
export function Pareto({
  data, height = 180, onSelect,
}: {
  data: BarDatum[];
  height?: number;
  onSelect?: (item: BarDatum, index: number) => void;
}) {
  const { idx, setIdx, pos, onMove } = useHover();
  if (data.length === 0) return <Empty />;
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const total = sorted.reduce((a, d) => a + d.value, 0) || 1;
  const W = 320, H = height;
  const pad = { l: 8, r: 8, t: 10, b: 24 };
  const max = Math.max(1, ...sorted.map((d) => d.value));
  const bw = (W - pad.l - pad.r) / sorted.length;
  let cum = 0;
  const cumArr: number[] = [];
  const cumPts = sorted.map((d, i) => {
    cum += d.value;
    cumArr.push(cum / total);
    return { x: pad.l + i * bw + bw / 2, y: pad.t + (1 - cum / total) * (H - pad.t - pad.b) };
  });
  const linePath = cumPts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  return (
    <div className="relative select-none" onPointerMove={onMove} onPointerDown={onMove} onPointerLeave={() => setIdx(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img">
        {sorted.map((d, i) => {
          const h = ((H - pad.t - pad.b) * d.value) / max;
          const hl = idx === null || idx === i;
          return (
            <g key={i}>
              <rect x={pad.l + i * bw + bw * 0.12} y={H - pad.b - h} width={bw * 0.76} height={Math.max(0, h)} fill={PALETTE[5]} rx={1} fillOpacity={hl ? 1 : 0.3} pointerEvents="none" />
              <rect x={pad.l + i * bw} y={pad.t} width={bw} height={H - pad.t - pad.b} fill="transparent"
                style={{ cursor: onSelect ? "pointer" : "default" }}
                onPointerEnter={() => setIdx(i)} onPointerDown={() => { setIdx(i); onSelect?.(d, i); }} />
            </g>
          );
        })}
        <path d={linePath} fill="none" stroke={PALETTE[2]} strokeWidth={1.5} pointerEvents="none" />
        {cumPts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={idx === i ? 2.6 : 1.6} fill={PALETTE[2]} pointerEvents="none" />)}
        <line x1={pad.l} y1={H - pad.b} x2={W - pad.r} y2={H - pad.b} stroke={AXIS} strokeWidth={0.5} />
      </svg>
      <ChartTip pos={pos} show={idx !== null}>
        {idx !== null && (
          <>
            <div className="font-medium">{sorted[idx].label}</div>
            <div className="tabular-nums">{ntd(sorted[idx].value)}（{((sorted[idx].value / total) * 100).toFixed(1)}%）</div>
            <div className="text-muted-foreground">累積至此 {(cumArr[idx] * 100).toFixed(0)}%</div>
            {selectHint(!!onSelect)}
          </>
        )}
      </ChartTip>
    </div>
  );
}

export interface ScatterPoint { x: number; y: number; label?: string; id?: string }

/** 散布圖。hover 放大＋提示；可 onSelect 鑽取。 */
export function Scatter({
  points, xLabel, yLabel, height = 200, onSelect, color = PALETTE[0],
}: {
  points: ScatterPoint[];
  xLabel?: string;
  yLabel?: string;
  height?: number;
  onSelect?: (point: ScatterPoint, index: number) => void;
  color?: string;
}) {
  const { idx, setIdx, pos, onMove } = useHover();
  if (points.length === 0) return <Empty />;
  const W = 320, H = height;
  const pad = { l: 36, r: 10, t: 10, b: 26 };
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const yMin = Math.min(...ys), yMax = Math.max(...ys);
  const sx = (x: number) => pad.l + (xMax === xMin ? 0.5 : (x - xMin) / (xMax - xMin)) * (W - pad.l - pad.r);
  const sy = (y: number) => H - pad.b - (yMax === yMin ? 0.5 : (y - yMin) / (yMax - yMin)) * (H - pad.t - pad.b);
  return (
    <div className="relative select-none" onPointerMove={onMove} onPointerDown={onMove} onPointerLeave={() => setIdx(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img">
        <line x1={pad.l} y1={pad.t} x2={pad.l} y2={H - pad.b} stroke={AXIS} strokeWidth={0.5} />
        <line x1={pad.l} y1={H - pad.b} x2={W - pad.r} y2={H - pad.b} stroke={AXIS} strokeWidth={0.5} />
        {points.map((p, i) => {
          const active = idx === i;
          return (
            <g key={i}>
              <circle cx={sx(p.x)} cy={sy(p.y)} r={active ? 4.5 : 2.6} fill={color} fillOpacity={idx === null || active ? 0.85 : 0.4} stroke={active ? "#0f172a" : "none"} strokeWidth={active ? 0.8 : 0} pointerEvents="none" />
              <circle cx={sx(p.x)} cy={sy(p.y)} r={8} fill="transparent"
                style={{ cursor: onSelect ? "pointer" : "default" }}
                onPointerEnter={() => setIdx(i)} onPointerDown={() => { setIdx(i); onSelect?.(p, i); }} />
            </g>
          );
        })}
        {yLabel && <text x={4} y={pad.t + 4} fontSize="7" fill={TEXT}>{yLabel}</text>}
        {xLabel && <text x={W - pad.r} y={H - 4} textAnchor="end" fontSize="7" fill={TEXT}>{xLabel}</text>}
      </svg>
      <ChartTip pos={pos} show={idx !== null}>
        {idx !== null && (
          <>
            <div>{points[idx].label ?? `(${points[idx].x}, ${points[idx].y})`}</div>
            {selectHint(!!onSelect)}
          </>
        )}
      </ChartTip>
    </div>
  );
}

/** 子彈圖：實際 vs 目標 */
export function Bullet({ value, target, label, height = 34 }: { value: number; target: number; label?: string; height?: number }) {
  const max = Math.max(value, target, 1) * 1.1;
  const W = 320;
  const vW = (value / max) * W;
  const tX = (target / max) * W;
  const over = target > 0 && value > target;
  return (
    <div className="space-y-1 select-none">
      {label && <p className="text-xs text-muted-foreground">{label}</p>}
      <svg viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" className="h-7 w-full" role="img">
        <rect x={0} y={height * 0.25} width={W} height={height * 0.5} fill={GRID} rx={2} />
        <rect x={0} y={height * 0.3} width={Math.max(0, vW)} height={height * 0.4} fill={over ? PALETTE[4] : PALETTE[1]} rx={2}>
          <title>{`實際 ${ntd(value)}`}</title>
        </rect>
        {target > 0 && <line x1={tX} y1={height * 0.15} x2={tX} y2={height * 0.85} stroke="#0f172a" strokeWidth={1.5}><title>{`目標 ${ntd(target)}`}</title></line>}
      </svg>
      <div className="flex justify-between text-[11px] text-muted-foreground">
        <span>實際 {ntd(value)}</span>
        {target > 0 && <span>目標 {ntd(target)}（{over ? "超支" : "未達"} {ntd(Math.abs(value - target))}）</span>}
      </div>
    </div>
  );
}

/** 熱圖：rows × cols，cell 值（null＝無資料），色階以 [domainMin,domainMax] 內插；可點格鑽取。 */
export function Heatmap({
  rowLabels, colLabels, cells, domain = [0.8, 1.2], fmt = (n: number) => n.toFixed(2), onSelect,
}: {
  rowLabels: string[];
  colLabels: string[];
  cells: (number | null)[][];
  domain?: [number, number];
  fmt?: (n: number) => string;
  onSelect?: (rowLabel: string, colLabel: string, value: number) => void;
}) {
  const colorOf = (v: number) => {
    const t = Math.max(0, Math.min(1, (v - domain[0]) / (domain[1] - domain[0])));
    if (t < 0.5) return `hsl(${210 - t * 2 * 90}, 70%, 75%)`;
    return `hsl(${120 - (t - 0.5) * 2 * 120}, 70%, 72%)`;
  };
  return (
    <div className="overflow-auto select-none">
      <table className="border-collapse text-xs">
        <thead>
          <tr>
            <th className="p-1" />
            {colLabels.map((c) => <th key={c} className="p-1 font-medium text-muted-foreground">{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rowLabels.map((r, ri) => (
            <tr key={r}>
              <td className="whitespace-nowrap p-1 pr-2 text-muted-foreground">{r}</td>
              {colLabels.map((c, ci) => {
                const v = cells[ri]?.[ci];
                const clickable = onSelect && v != null;
                return (
                  <td key={ci} className="p-0.5">
                    <div
                      className={`flex h-8 w-14 items-center justify-center rounded text-[11px] tabular-nums transition-transform ${clickable ? "cursor-pointer hover:scale-105 hover:ring-2 hover:ring-primary/50" : ""}`}
                      style={{ background: v == null ? "#f1f5f9" : colorOf(v), color: v == null ? "#94a3b8" : "#0f172a" }}
                      title={v == null ? "無資料" : `${r} × ${c}：${fmt(v)}`}
                      onPointerDown={() => clickable && onSelect!(r, c, v as number)}
                    >
                      {v == null ? "—" : fmt(v)}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** 時間序列折線（趨勢用）：x 為類別標籤、y 自動縮放。hover 高亮＋提示；可 onSelect 鑽取。 */
export function TrendChart({
  data, height = 170, color = PALETTE[0], valueFmt = ntd, zeroBased = true, onSelect, selectedIndex = null,
}: {
  data: BarDatum[];
  height?: number;
  color?: string;
  valueFmt?: (n: number) => string;
  zeroBased?: boolean;
  onSelect?: (item: BarDatum, index: number) => void;
  selectedIndex?: number | null;
}) {
  const { idx, setIdx, pos, onMove } = useHover();
  if (data.length === 0) return <Empty />;
  const W = 320, H = height;
  const pad = { l: 44, r: 12, t: 12, b: 24 };
  const vals = data.map((d) => d.value);
  const rawMin = Math.min(...vals);
  const rawMax = Math.max(...vals);
  const yMin = zeroBased ? Math.min(0, rawMin) : rawMin;
  const yMax = rawMax === yMin ? yMin + 1 : rawMax;
  const n = data.length;
  const sx = (i: number) => pad.l + (n === 1 ? 0.5 : i / (n - 1)) * (W - pad.l - pad.r);
  const sy = (v: number) => H - pad.b - ((v - yMin) / (yMax - yMin)) * (H - pad.t - pad.b);
  const path = data.map((d, i) => `${i === 0 ? "M" : "L"}${sx(i).toFixed(1)},${sy(d.value).toFixed(1)}`).join(" ");
  const band = (W - pad.l - pad.r) / Math.max(1, n);
  const activeI = idx ?? selectedIndex;
  return (
    <div className="relative select-none" onPointerMove={onMove} onPointerDown={onMove} onPointerLeave={() => setIdx(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img">
        <line x1={pad.l} y1={pad.t} x2={pad.l} y2={H - pad.b} stroke={AXIS} strokeWidth={0.5} />
        <line x1={pad.l} y1={H - pad.b} x2={W - pad.r} y2={H - pad.b} stroke={AXIS} strokeWidth={0.5} />
        <text x={pad.l - 4} y={sy(yMax) + 3} textAnchor="end" fontSize="7" fill={TEXT}>{valueFmt(Math.round(yMax))}</text>
        <text x={pad.l - 4} y={sy(yMin) + 3} textAnchor="end" fontSize="7" fill={TEXT}>{valueFmt(Math.round(yMin))}</text>
        {activeI !== null && <line x1={sx(activeI)} y1={pad.t} x2={sx(activeI)} y2={H - pad.b} stroke={AXIS} strokeDasharray="2 2" strokeWidth={0.6} />}
        <path d={path} fill="none" stroke={color} strokeWidth={1.5} pointerEvents="none" />
        {data.map((d, i) => (
          <g key={i}>
            <circle cx={sx(i)} cy={sy(d.value)} r={idx === i || selectedIndex === i ? 3.4 : 2.2} fill={color} stroke={selectedIndex === i ? "#0f172a" : "none"} strokeWidth={selectedIndex === i ? 0.8 : 0} pointerEvents="none" />
            <rect x={sx(i) - band / 2} y={pad.t} width={band} height={H - pad.t - pad.b} fill="transparent"
              style={{ cursor: onSelect ? "pointer" : "default" }}
              onPointerEnter={() => setIdx(i)} onPointerDown={() => { setIdx(i); onSelect?.(d, i); }} />
            <text x={sx(i)} y={H - pad.b + 9} textAnchor="middle" fontSize="6.5" fill={TEXT}>
              {d.label.length > 7 ? d.label.slice(2) : d.label}
            </text>
          </g>
        ))}
      </svg>
      <ChartTip pos={pos} show={idx !== null}>
        {idx !== null && (
          <>
            <div className="font-medium">{data[idx].label}</div>
            <div className="tabular-nums">{valueFmt(data[idx].value)}</div>
            {selectHint(!!onSelect)}
          </>
        )}
      </ChartTip>
    </div>
  );
}

function Empty() {
  return <p className="py-8 text-center text-xs text-muted-foreground">無資料</p>;
}
