// 零相依 SVG 圖表元件（薪酬分析用）。純展示、接 data props、viewBox 自適應寬度。
// 互動：以 Pointer Events 統一滑鼠與觸控 —— 移入/點擊高亮目標、浮動提示顯示數據，
// 並可透過 onSelect 回呼讓上層做「點擊鑽取明細清單」。
import { useState } from "react";
import type { ReactNode } from "react";
import { ntd } from "@/lib/utils";

// 色票讀取 index.css 的 --chart-1..8／--chart-axis/grid/text（Gem 寶石色票，經 dataviz 技能
// 驗證器驗證通過 CVD 分離／彩度/對比；深色步階已備於 .dark，切換未啟用時 var() 直接吃 :root 值）。
// SVG 的 fill/stroke 屬性可直接解析 var()，故色票只需在 CSS 單一來源改一次即可全站同步。
// 鐵律：PALETTE[N] 只能代表「類別身分」（本薪/加給/部門…），不可拿來表示好壞/超標等狀態語意——
// 換色票主題或改排序時色相會變，狀態意義不能跟著漂移。狀態一律走 --success/--warning/--info/--danger。
export const PALETTE = [
  "var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)",
  "var(--chart-5)", "var(--chart-6)", "var(--chart-7)", "var(--chart-8)",
];

const AXIS = "var(--chart-axis)";
const GRID = "var(--chart-grid)";
const TEXT = "var(--chart-text)";

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

/* ───────────── 無障礙：圖表的文字等價 ─────────────
 * `role="img"` 不是中性標記：它把 svg 當成一張圖，並使**子樹對輔助技術隱藏**——
 * 圖內 <text> 畫的類別名與數值，螢幕報讀器一個都讀不到。因此凡是掛 role="img" 的圖，
 * 都必須補「名稱（aria-label 摘要）」＋「資料出口（同資料的無障礙表格）」，否則
 * 資訊對報讀器使用者等於完全消失（WCAG 1.1.1 Level A）。
 *
 * 為什麼用表格而不是讓 SVG 可逐點瀏覽：SVG 內部的焦點與無障礙樹支援在各瀏覽器 ×
 * 各報讀器之間很不一致；<table> 的語意則是普世的（報讀器有專門的表格瀏覽指令）。
 *
 * 例外：數值**已經在鄰近的可見文字**裡（Bullet 的實際/目標、Heatmap 的格內數字）時，
 * 圖形改標 aria-hidden，避免同一份資料被唸兩次。 */

/** 螢幕報讀器專用的資料表（視覺上不可見，不佔版面）。首欄為列標頭。 */
function SrTable({ caption, cols, rows }: { caption: string; cols: string[]; rows: (string | number)[][] }) {
  if (rows.length === 0) return null;
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>{cols.map((c) => <th key={c} scope="col">{c}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            {r.map((cell, j) => (j === 0
              ? <th key={j} scope="row">{cell}</th>
              : <td key={j}>{cell}</td>))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** 組出 aria-label 摘要：「圖種：主題，共 N 項，＜重點＞」。caption 未給時仍可用。 */
function chartLabel(kind: string, caption: string | undefined, parts: (string | false | undefined)[]) {
  return [caption ? `${kind}：${caption}` : kind, ...parts.filter(Boolean)].join("，");
}

export interface Segment {
  label: string;
  value: number;
  color: string;
}

/** 水平堆疊長條（成本組成、部門成本）。每列一類別、內部分段；可點整列鑽取（onSelectRow）。 */
export function StackedBar({
  rows, height = 28, onSelectRow, selectedRow = null, caption,
}: {
  rows: { label: string; segments: Segment[] }[];
  height?: number;
  onSelectRow?: (label: string) => void;
  selectedRow?: string | null;
  /** 這張圖在講什麼（供螢幕報讀器的表格 caption 用）；未給時用通用字樣 */
  caption?: string;
}) {
  const [hover, setHover] = useState<{ ri: number; si: number } | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const max = Math.max(1, ...rows.map((r) => r.segments.reduce((a, s) => a + s.value, 0)));
  const onMove = (e: React.PointerEvent) => {
    const r = e.currentTarget.getBoundingClientRect();
    setPos({ x: e.clientX - r.left, y: e.clientY - r.top });
  };
  const seg = hover ? rows[hover.ri]?.segments[hover.si] : null;
  // 各列的分段名稱聯集（保留首見順序）＝ 無障礙表格的欄位
  const segCols = [...new Set(rows.flatMap((r) => r.segments.map((s) => s.label)))];
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
              {/* 每列的長條是「把數字畫成長度」的視覺呈現；列標籤與合計已是可見文字，
                  分段明細由下方 SrTable 提供，故此處標裝飾性避免重複播報。 */}
              <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="h-6 flex-1" aria-hidden="true">
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
      {/* 分段明細原本只有 hover 拿得到 → 補文字出口 */}
      <SrTable
        caption={caption ?? "堆疊長條圖資料"}
        cols={["項目", ...segCols, "合計"]}
        rows={rows.map((r) => [
          r.label,
          ...segCols.map((c) => ntd(r.segments.find((s) => s.label === c)?.value ?? 0)),
          ntd(r.segments.reduce((a, s) => a + s.value, 0)),
        ])}
      />
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

/** 類別過多時只保留前 max-1 名，其餘彙總為「其他（N 項）」，避免標籤糊成一團。 */
export function capItems(data: BarDatum[], max: number): BarDatum[] {
  if (!max || data.length <= max) return data;
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const head = sorted.slice(0, max - 1);
  const restCount = data.length - head.length;
  const restSum = sorted.slice(max - 1).reduce((a, d) => a + d.value, 0);
  return [...head, { label: `其他（${restCount} 項）`, value: restSum, id: "__other__" }];
}

/** 垂直長條圖（直方圖、部門中位、調幅%）。hover 高亮＋提示；可 onSelect 鑽取。 */
export function BarChart({
  data, height = 160, color = PALETTE[0], valueFmt = ntd, onSelect, selectedIndex = null, showValues = false, maxItems = 12, caption,
}: {
  data: BarDatum[];
  height?: number;
  color?: string;
  valueFmt?: (n: number) => string;
  onSelect?: (item: BarDatum, index: number) => void;
  selectedIndex?: number | null;
  showValues?: boolean; // 於長條頂端標數值（列印/觸控不靠 hover 也能讀）
  maxItems?: number; // 類別過多時只顯示前 N，其餘彙總「其他」
  /** 這張圖在講什麼（供 aria-label 摘要與無障礙表格用） */
  caption?: string;
}) {
  const { idx, setIdx, pos, onMove } = useHover();
  if (data.length === 0) return <Empty />;
  const shown = capItems(data, maxItems);
  const top = shown.reduce((a, d) => (d.value > a.value ? d : a), shown[0]);
  const W = 320, H = height;
  const pad = { l: 8, r: 8, t: 10, b: 28 };
  const max = Math.max(1, ...shown.map((d) => d.value));
  const bw = (W - pad.l - pad.r) / shown.length;
  const activeI = idx ?? selectedIndex;
  return (
    <div className="relative select-none" onPointerMove={onMove} onPointerDown={onMove} onPointerLeave={() => setIdx(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img"
        aria-label={chartLabel("長條圖", caption, [`共 ${shown.length} 項`, `最高為 ${top.label} ${valueFmt(top.value)}`])}>
        {shown.map((d, i) => {
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
              {showValues && d.value > 0 && (
                <text x={x + bw / 2} y={y - 2} textAnchor="middle" fontSize="6.5" fill={TEXT} pointerEvents="none">
                  {valueFmt(d.value)}
                </text>
              )}
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
            <div className="font-medium">{shown[idx].label}</div>
            <div className="tabular-nums">{valueFmt(shown[idx].value)}</div>
            {selectHint(!!onSelect)}
          </>
        )}
      </ChartTip>
      <SrTable caption={caption ?? "長條圖資料"} cols={["項目", "數值"]}
        rows={shown.map((d) => [d.label, valueFmt(d.value)])} />
    </div>
  );
}

/** 折線圖（Lorenz 曲線：可加對角線基準）。hover 顯示累積比例。 */
export function LineChart({
  points, diagonal = false, height = 200, xLabel = "累積人口", yLabel = "取得薪資", caption,
}: {
  points: { x: number; y: number }[]; // x,y ∈ [0,1]
  diagonal?: boolean;
  height?: number;
  /** 兩軸的意義；同時供提示泡泡與無障礙表格使用（預設值＝既有文案，不改行為） */
  xLabel?: string;
  yLabel?: string;
  caption?: string;
}) {
  const { idx, setIdx, pos, onMove } = useHover();
  const W = 240, H = height, pad = 24;
  const sx = (x: number) => pad + x * (W - 2 * pad);
  const sy = (y: number) => H - pad - y * (H - 2 * pad);
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join(" ");
  return (
    <div className="relative select-none" onPointerMove={onMove} onPointerLeave={() => setIdx(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img"
        aria-label={chartLabel("折線圖", caption, [`${xLabel} 對 ${yLabel}`, `共 ${points.length} 個點`])}>
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
        {idx !== null && <div>{xLabel} {(points[idx].x * 100).toFixed(0)}%<br />{yLabel} {(points[idx].y * 100).toFixed(0)}%</div>}
      </ChartTip>
      <SrTable caption={caption ?? "折線圖資料"} cols={[`${xLabel}（%）`, `${yLabel}（%）`]}
        rows={points.map((pt) => [(pt.x * 100).toFixed(0), (pt.y * 100).toFixed(0)])} />
    </div>
  );
}

/** Pareto：長條（由大到小）＋累積百分比折線。hover 提示佔比；可 onSelect 鑽取。 */
export function Pareto({
  data, height = 180, onSelect, maxItems = 12, caption,
}: {
  data: BarDatum[];
  height?: number;
  onSelect?: (item: BarDatum, index: number) => void;
  maxItems?: number; // 類別過多時只顯示前 N，其餘彙總「其他」
  caption?: string;
}) {
  const { idx, setIdx, pos, onMove } = useHover();
  if (data.length === 0) return <Empty />;
  const sorted = capItems(data, maxItems).sort((a, b) => b.value - a.value);
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
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img"
        aria-label={chartLabel("柏拉圖", caption, [`共 ${sorted.length} 項，由大到小排序`,
          `前 ${Math.min(3, sorted.length)} 項累積 ${(cumArr[Math.min(2, cumArr.length - 1)] * 100).toFixed(0)}%`])}>
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
      <SrTable caption={caption ?? "柏拉圖資料"} cols={["項目", "數值", "佔比", "累積佔比"]}
        rows={sorted.map((d, i) => [d.label, ntd(d.value),
          `${((d.value / total) * 100).toFixed(1)}%`, `${(cumArr[i] * 100).toFixed(0)}%`])} />
    </div>
  );
}

export interface ScatterPoint { x: number; y: number; label?: string; id?: string }

/** 散布圖。hover 放大＋提示；可 onSelect 鑽取。 */
export function Scatter({
  points, xLabel, yLabel, height = 200, onSelect, color = PALETTE[0], caption,
}: {
  points: ScatterPoint[];
  xLabel?: string;
  yLabel?: string;
  height?: number;
  onSelect?: (point: ScatterPoint, index: number) => void;
  color?: string;
  caption?: string;
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
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img"
        aria-label={chartLabel("散布圖", caption, [xLabel && yLabel && `${xLabel} 對 ${yLabel}`, `共 ${points.length} 個點`])}>
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
      <SrTable caption={caption ?? "散布圖資料"} cols={["項目", xLabel ?? "X", yLabel ?? "Y"]}
        rows={points.map((pt, i) => [pt.label ?? `第 ${i + 1} 點`, pt.x, pt.y])} />
    </div>
  );
}

/** 子彈圖：實際 vs 目標。超支/未達是「好壞」語意，走 --danger/--success 狀態 token（非 PALETTE
 * 分類色）——分類色票換主題或重排時色相會變，狀態色的好壞意義不能跟著漂移。 */
export function Bullet({ value, target, label, height = 34 }: { value: number; target: number; label?: string; height?: number }) {
  const max = Math.max(value, target, 1) * 1.1;
  const W = 320;
  const vW = (value / max) * W;
  const tX = (target / max) * W;
  const over = target > 0 && value > target;
  return (
    <div className="space-y-1 select-none">
      {label && <p className="text-xs text-muted-foreground">{label}</p>}
      {/* 實際/目標/差額已是下方的可見文字，圖形只是「把差距畫成長度」→ 標裝飾性避免唸兩次 */}
      <svg viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" className="h-7 w-full" aria-hidden="true">
        <rect x={0} y={height * 0.25} width={W} height={height * 0.5} fill={GRID} rx={2} />
        <rect x={0} y={height * 0.3} width={Math.max(0, vW)} height={height * 0.4} fill={over ? "hsl(var(--danger))" : "hsl(var(--success))"} rx={2}>
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
function heatColor(v: number, domain: [number, number]) {
  const t = Math.max(0, Math.min(1, (v - domain[0]) / (domain[1] - domain[0])));
  if (t < 0.5) return `hsl(${210 - t * 2 * 90}, 70%, 75%)`;
  return `hsl(${120 - (t - 0.5) * 2 * 120}, 70%, 72%)`;
}

export function Heatmap({
  rowLabels, colLabels, cells, domain, fmt = (n: number) => n.toFixed(2), onSelect, legend = true, caption,
}: {
  rowLabels: string[];
  colLabels: string[];
  cells: (number | null)[][];
  domain?: [number, number]; // 未給時依資料自動取 [min,max]
  fmt?: (n: number) => string;
  onSelect?: (rowLabel: string, colLabel: string, value: number) => void;
  legend?: boolean;
  caption?: string;
}) {
  const flat = cells.flat().filter((v): v is number => v != null);
  const auto: [number, number] = flat.length ? [Math.min(...flat), Math.max(...flat)] : [0.8, 1.2];
  const dom: [number, number] = domain ?? (auto[0] === auto[1] ? [auto[0] - 0.1, auto[1] + 0.1] : auto);
  const colorOf = (v: number) => heatColor(v, dom);
  return (
    <div className="space-y-2">
    <div className="overflow-auto select-none">
      {/* 這張圖本來就是真表格：數值是可見文字、顏色只是輔助編碼。
          因此不需要額外的 SrTable，只需把表格語意補正確（caption／scope／列標頭用 th）。 */}
      <table className="border-collapse text-xs">
        <caption className="sr-only">{caption ?? "熱圖資料（顏色僅為輔助，數值以文字呈現）"}</caption>
        <thead>
          <tr>
            <th className="p-1" scope="col"><span className="sr-only">項目</span></th>
            {colLabels.map((c) => <th key={c} scope="col" className="p-1 font-medium text-muted-foreground">{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rowLabels.map((r, ri) => (
            <tr key={r}>
              <th scope="row" className="whitespace-nowrap p-1 pr-2 text-left font-normal text-muted-foreground">{r}</th>
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
    {legend && (
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        <span>低 {fmt(dom[0])}</span>
        <span
          className="h-2 w-28 rounded"
          style={{ background: `linear-gradient(to right, ${heatColor(dom[0], dom)}, ${heatColor((dom[0] + dom[1]) / 2, dom)}, ${heatColor(dom[1], dom)})` }}
        />
        <span>高 {fmt(dom[1])}</span>
        <span className="ml-1">（灰＝無資料）</span>
      </div>
    )}
    </div>
  );
}

/** 時間序列折線（趨勢用）：x 為類別標籤、y 自動縮放。hover 高亮＋提示；可 onSelect 鑽取。 */
export function TrendChart({
  data, height = 170, color = PALETTE[0], valueFmt = ntd, zeroBased = true, onSelect, selectedIndex = null, caption,
}: {
  data: BarDatum[];
  height?: number;
  color?: string;
  valueFmt?: (n: number) => string;
  zeroBased?: boolean;
  onSelect?: (item: BarDatum, index: number) => void;
  selectedIndex?: number | null;
  caption?: string;
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
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img"
        aria-label={chartLabel("趨勢圖", caption, [`${data.length} 個時間點`,
          `從 ${data[0].label} ${valueFmt(data[0].value)} 到 ${data[data.length - 1].label} ${valueFmt(data[data.length - 1].value)}`])}>
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
      <SrTable caption={caption ?? "趨勢圖資料"} cols={["時間", "數值"]}
        rows={data.map((d) => [d.label, valueFmt(d.value)])} />
    </div>
  );
}

function Empty() {
  return <p className="py-8 text-center text-xs text-muted-foreground">無資料</p>;
}
