// 零相依 SVG 圖表元件（薪酬分析用）。純展示、接 data props、viewBox 自適應寬度。
import { ntd } from "@/lib/utils";

export const PALETTE = ["#0ea5e9", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#64748b", "#14b8a6", "#ec4899"];

const AXIS = "#cbd5e1";
const GRID = "#e2e8f0";
const TEXT = "#475569";

export interface Segment {
  label: string;
  value: number;
  color: string;
}

/** 水平堆疊長條（成本組成、部門成本）。每列一類別，內部分段。 */
export function StackedBar({ rows, height = 28 }: { rows: { label: string; segments: Segment[] }[]; height?: number }) {
  const max = Math.max(1, ...rows.map((r) => r.segments.reduce((a, s) => a + s.value, 0)));
  return (
    <div className="space-y-1.5">
      {rows.map((r) => {
        const total = r.segments.reduce((a, s) => a + s.value, 0);
        let x = 0;
        return (
          <div key={r.label} className="flex items-center gap-2">
            <span className="w-28 shrink-0 truncate text-xs text-muted-foreground" title={r.label}>{r.label}</span>
            <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="h-6 flex-1" role="img">
              {r.segments.map((s, i) => {
                const w = max > 0 ? (s.value / max) * 100 : 0;
                const rect = (
                  <rect key={i} x={x} y={2} width={Math.max(0, w)} height={height - 4} fill={s.color}>
                    <title>{`${s.label}：${ntd(s.value)}`}</title>
                  </rect>
                );
                x += w;
                return rect;
              })}
            </svg>
            <span className="w-20 shrink-0 text-right text-xs tabular-nums">{ntd(total)}</span>
          </div>
        );
      })}
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

/** 垂直長條圖（直方圖、部門中位、調幅%）。 */
export function BarChart({
  data, height = 160, color = PALETTE[0], valueFmt = ntd,
}: {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  valueFmt?: (n: number) => string;
}) {
  if (data.length === 0) return <Empty />;
  const W = 320;
  const H = height;
  const pad = { l: 8, r: 8, t: 10, b: 28 };
  const max = Math.max(1, ...data.map((d) => d.value));
  const bw = (W - pad.l - pad.r) / data.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img">
      {data.map((d, i) => {
        const h = ((H - pad.t - pad.b) * d.value) / max;
        const x = pad.l + i * bw;
        const y = H - pad.b - h;
        return (
          <g key={i}>
            <rect x={x + bw * 0.12} y={y} width={bw * 0.76} height={Math.max(0, h)} fill={color} rx={1}>
              <title>{`${d.label}：${valueFmt(d.value)}`}</title>
            </rect>
            <text x={x + bw / 2} y={H - pad.b + 10} textAnchor="middle" fontSize="7" fill={TEXT}>
              {d.label.length > 6 ? d.label.slice(0, 6) : d.label}
            </text>
          </g>
        );
      })}
      <line x1={pad.l} y1={H - pad.b} x2={W - pad.r} y2={H - pad.b} stroke={AXIS} strokeWidth={0.5} />
    </svg>
  );
}

/** 折線圖（Lorenz 曲線：可加對角線基準） */
export function LineChart({
  points, diagonal = false, height = 200,
}: {
  points: { x: number; y: number }[]; // x,y ∈ [0,1]
  diagonal?: boolean;
  height?: number;
}) {
  const W = 240;
  const H = height;
  const pad = 24;
  const sx = (x: number) => pad + x * (W - 2 * pad);
  const sy = (y: number) => H - pad - y * (H - 2 * pad);
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img">
      <rect x={pad} y={pad} width={W - 2 * pad} height={H - 2 * pad} fill="none" stroke={GRID} strokeWidth={0.5} />
      {diagonal && <line x1={sx(0)} y1={sy(0)} x2={sx(1)} y2={sy(1)} stroke={AXIS} strokeDasharray="3 2" strokeWidth={0.8} />}
      <path d={path} fill="none" stroke={PALETTE[0]} strokeWidth={1.5} />
    </svg>
  );
}

/** Pareto：長條（由大到小）＋累積百分比折線 */
export function Pareto({ data, height = 180 }: { data: { label: string; value: number }[]; height?: number }) {
  if (data.length === 0) return <Empty />;
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const total = sorted.reduce((a, d) => a + d.value, 0) || 1;
  const W = 320;
  const H = height;
  const pad = { l: 8, r: 8, t: 10, b: 24 };
  const max = Math.max(1, ...sorted.map((d) => d.value));
  const bw = (W - pad.l - pad.r) / sorted.length;
  let cum = 0;
  const cumPts = sorted.map((d, i) => {
    cum += d.value;
    return { x: pad.l + i * bw + bw / 2, y: pad.t + (1 - cum / total) * (H - pad.t - pad.b) };
  });
  const linePath = cumPts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img">
      {sorted.map((d, i) => {
        const h = ((H - pad.t - pad.b) * d.value) / max;
        return (
          <rect key={i} x={pad.l + i * bw + bw * 0.12} y={H - pad.b - h} width={bw * 0.76} height={Math.max(0, h)} fill={PALETTE[5]} rx={1}>
            <title>{`${d.label}：${ntd(d.value)}（${((d.value / total) * 100).toFixed(1)}%）`}</title>
          </rect>
        );
      })}
      <path d={linePath} fill="none" stroke={PALETTE[2]} strokeWidth={1.5} />
      {cumPts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={1.6} fill={PALETTE[2]} />)}
      <line x1={pad.l} y1={H - pad.b} x2={W - pad.r} y2={H - pad.b} stroke={AXIS} strokeWidth={0.5} />
    </svg>
  );
}

/** 散布圖 */
export function Scatter({
  points, xLabel, yLabel, height = 200,
}: {
  points: { x: number; y: number; label?: string }[];
  xLabel?: string;
  yLabel?: string;
  height?: number;
}) {
  if (points.length === 0) return <Empty />;
  const W = 320;
  const H = height;
  const pad = { l: 36, r: 10, t: 10, b: 26 };
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const yMin = Math.min(...ys), yMax = Math.max(...ys);
  const sx = (x: number) => pad.l + (xMax === xMin ? 0.5 : (x - xMin) / (xMax - xMin)) * (W - pad.l - pad.r);
  const sy = (y: number) => H - pad.b - (yMax === yMin ? 0.5 : (y - yMin) / (yMax - yMin)) * (H - pad.t - pad.b);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img">
      <line x1={pad.l} y1={pad.t} x2={pad.l} y2={H - pad.b} stroke={AXIS} strokeWidth={0.5} />
      <line x1={pad.l} y1={H - pad.b} x2={W - pad.r} y2={H - pad.b} stroke={AXIS} strokeWidth={0.5} />
      {points.map((p, i) => (
        <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={2.6} fill={PALETTE[0]} fillOpacity={0.75}>
          <title>{p.label ?? `(${p.x}, ${p.y})`}</title>
        </circle>
      ))}
      {yLabel && <text x={4} y={pad.t + 4} fontSize="7" fill={TEXT}>{yLabel}</text>}
      {xLabel && <text x={W - pad.r} y={H - 4} textAnchor="end" fontSize="7" fill={TEXT}>{xLabel}</text>}
    </svg>
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
    <div className="space-y-1">
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

/** 熱圖：rows × cols，cell 值（null＝無資料），色階以 [domainMin,domainMax] 內插 */
export function Heatmap({
  rowLabels, colLabels, cells, domain = [0.8, 1.2], fmt = (n: number) => n.toFixed(2),
}: {
  rowLabels: string[];
  colLabels: string[];
  cells: (number | null)[][];
  domain?: [number, number];
  fmt?: (n: number) => string;
}) {
  const colorOf = (v: number) => {
    const t = Math.max(0, Math.min(1, (v - domain[0]) / (domain[1] - domain[0])));
    // 低（藍）→中（綠）→高（紅）
    if (t < 0.5) return `hsl(${210 - t * 2 * 90}, 70%, 75%)`; // 210→120
    return `hsl(${120 - (t - 0.5) * 2 * 120}, 70%, 72%)`; // 120→0
  };
  return (
    <div className="overflow-auto">
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
              {colLabels.map((_, ci) => {
                const v = cells[ri]?.[ci];
                return (
                  <td key={ci} className="p-0.5">
                    <div
                      className="flex h-8 w-14 items-center justify-center rounded text-[11px] tabular-nums"
                      style={{ background: v == null ? "#f1f5f9" : colorOf(v), color: v == null ? "#94a3b8" : "#0f172a" }}
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

function Empty() {
  return <p className="py-8 text-center text-xs text-muted-foreground">無資料</p>;
}
