import type { Meta, StoryObj } from "@storybook/react";
import type { CSSProperties } from "react";
import { StackedBar, Legend } from "@/components/charts";

// 圖表色票「風格選項」比較＋切換器（決策用，非上線功能）：
// 目前上線色票＝index.css 的 --chart-1..8（Cobalt，見 charts/index.tsx）。這裡另外準備幾種
// 不同風格的候選色票，讓使用者在 Storybook 直接切換／並排比較，選定後才把結果寫回 index.css。
// 色彩檢查（亮度帶/彩度/CVD 分離/對比）皆用 dataviz 技能的 validate_palette.js 對「本站實際
// 淺色 #ffffff／深色 #020817 版面」實測，不是目測；下方 checksLight/checksDark 為其結果摘要。
//
// Aqua／Gem 取材自 figma.com/color-palettes 的調查（該站對自動化擷取回 403，改以搜尋結果核對）：
// Aqua＝「dashboard／專業」類命名色票的共通方向（cyan/藍灰組合）；「信任感」方向（cool gray+深綠+棕）
// 修正後會收斂到與 Deep 幾乎相同的色相，故未另外新增。
// Gem＝綜合使用者指定的 6 個寶石命名色票（Mermaid Garnet Symphony／Copper Aquamarine Dream／
// Lavender Sapphire Mist／Emerald Blush Sunset／Beryl Topaz Afternoon／Emerald Sand Dusk）研究：
// 這些色票本身只有 4–6 色、且未做 CVD 分離設計，不能直接套用；但共通點是都圍繞「寶石色調」
// （藍寶石/祖母綠/石榴石/黃玉/紫水晶/海藍寶石…），因此抽出 8 個彼此獨立的寶石色相，
// 重新設計並用驗證器 snap-to-passing 成一套通過檢查的分類色票。
const meta: Meta = { title: "元件庫 / 圖表色票主題（比較用）", parameters: { layout: "padded" } };
export default meta;

type CheckRow = [string, "pass" | "warn", string?];
interface ThemeDef {
  name: string;
  mood: string;
  light: string[];
  dark: string[];
  checksLight: CheckRow[];
  checksDark: CheckRow[];
}

const THEMES: Record<string, ThemeDef> = {
  cobalt: {
    name: "Cobalt（目前上線）",
    mood: "藍色主導、專業感；dataviz 技能內建的驗證色票。",
    light: ["#2a78d6", "#1baf7a", "#eda100", "#008300", "#4a3aa7", "#e34948", "#e87ba4", "#eb6834"],
    dark: ["#3987e5", "#199e70", "#c98500", "#008300", "#9085e9", "#e66767", "#d55181", "#d95926"],
    checksLight: [["亮度帶", "pass"], ["彩度", "pass"], ["CVD 分離", "pass", "ΔE 24.2"], ["對比", "warn", "3 色需標籤/表格"]],
    checksDark: [["亮度帶", "pass"], ["彩度", "pass"], ["CVD 分離", "warn", "ΔE 10.3 floor"], ["對比", "pass"]],
  },
  vivid: {
    name: "Vivid",
    mood: "沿用現有 Tailwind 風格；只修正撞色/過灰的 2 色。",
    light: ["#0ea5e9", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#ec4899", "#4338ca", "#14b8a6"],
    dark: ["#0284c7", "#059669", "#d97706", "#8b5cf6", "#ef4444", "#ec4899", "#6366f1", "#0d9488"],
    checksLight: [["亮度帶", "pass"], ["彩度", "pass"], ["CVD 分離", "pass", "ΔE 46.0"], ["對比", "warn", "4 色需標籤/表格"]],
    checksDark: [["亮度帶", "pass"], ["彩度", "pass"], ["CVD 分離", "pass", "ΔE 39.3"], ["對比", "pass"]],
  },
  deep: {
    name: "Deep",
    mood: "沉穩飽和的「700」色階，質感偏正式/企業軟體。",
    light: ["#1d4ed8", "#0d9488", "#b45309", "#7e22ce", "#c2410c", "#be123c", "#4f46e5", "#15803d"],
    dark: ["#1d4ed8", "#0d9488", "#b45309", "#7e22ce", "#c2410c", "#be123c", "#4f46e5", "#15803d"],
    checksLight: [["亮度帶", "pass"], ["彩度", "pass"], ["CVD 分離", "pass", "ΔE 25.1"], ["對比", "pass"]],
    checksDark: [["亮度帶", "pass"], ["彩度", "pass"], ["CVD 分離", "pass", "ΔE 25.1"], ["對比", "warn", "2 色需標籤/表格"]],
  },
  pastel: {
    name: "Pastel",
    mood: "較柔和、親和的色調；淺色模式對比偏弱，需搭配標籤/明細表閱讀。",
    light: ["#38bdf8", "#10b981", "#f59e0b", "#a78bfa", "#fb7185", "#14b8a6", "#818cf8", "#fb923c"],
    dark: ["#0284c7", "#059669", "#d97706", "#7c3aed", "#e11d48", "#0d9488", "#4f46e5", "#ea580c"],
    checksLight: [["亮度帶", "pass"], ["彩度", "pass"], ["CVD 分離", "pass", "ΔE 12.2"], ["對比", "warn", "8 色皆需標籤/表格"]],
    checksDark: [["亮度帶", "pass"], ["彩度", "pass"], ["CVD 分離", "pass", "ΔE 21.7"], ["對比", "pass"]],
  },
  aqua: {
    name: "Aqua",
    mood: "青綠/藍主導、偏 tech-dashboard 感——取材自 Figma 色票庫的 dashboard 類範例（青綠＋藍灰主色調）；原始 4–6 色的品牌情緒板不足以做 8 色分類，經 snap-to-passing 調整彩度/亮度後才通過驗證。",
    light: ["#06b6d4", "#d97706", "#0d9488", "#f43f5e", "#4f46e5", "#059669", "#0284c7", "#7e22ce"],
    dark: ["#0891b2", "#d97706", "#0d9488", "#f43f5e", "#4f46e5", "#059669", "#0284c7", "#7e22ce"],
    checksLight: [["亮度帶", "pass"], ["彩度", "pass"], ["CVD 分離", "pass", "ΔE 13.8"], ["對比", "warn", "1 色需標籤/表格"]],
    checksDark: [["亮度帶", "pass"], ["彩度", "pass"], ["CVD 分離", "pass", "ΔE 13.8"], ["對比", "warn", "1 色需標籤/表格"]],
  },
  bold: {
    name: "Bold",
    mood: "高飽和、儀表板感；淺/深色模式同一組色，且四項檢查全過、零警示——本次候選中最乾淨。",
    light: ["#2563eb", "#16a34a", "#d97706", "#9333ea", "#dc2626", "#0891b2", "#db2777", "#65a30d"],
    dark: ["#2563eb", "#16a34a", "#d97706", "#9333ea", "#dc2626", "#0891b2", "#db2777", "#65a30d"],
    checksLight: [["亮度帶", "pass"], ["彩度", "pass"], ["CVD 分離", "pass", "ΔE 16.2"], ["對比", "pass"]],
    checksDark: [["亮度帶", "pass"], ["彩度", "pass"], ["CVD 分離", "pass", "ΔE 16.2"], ["對比", "pass"]],
  },
  gem: {
    name: "Gem（推薦：綜合 6 個 Figma 寶石色票研究）",
    mood: "取材自使用者提供的 6 個 Figma 命名色票（Mermaid Garnet Symphony／Copper Aquamarine Dream／" +
      "Lavender Sapphire Mist／Emerald Blush Sunset／Beryl Topaz Afternoon／Emerald Sand Dusk）共通的" +
      "寶石色調方向，抽出 8 個各自獨立的寶石色相組成一套分類色票：藍寶石／祖母綠／石榴石／黃玉／紫水晶／" +
      "粉晶／紅玉髓／海藍寶石。淺／深色模式四項檢查皆零警示全過，本次候選中與 Bold 並列最乾淨。",
    light: ["#1d4ed8", "#0e8a5f", "#a3123a", "#a16207", "#7e3af2", "#db5a79", "#c2570d", "#0e9488"],
    dark: ["#2251e0", "#0e8a5f", "#c11f4a", "#a16207", "#7e3af2", "#db5a79", "#c2570d", "#0e9488"],
    checksLight: [["亮度帶", "pass"], ["彩度", "pass"], ["CVD 分離", "pass", "ΔE 15.7"], ["對比", "pass"]],
    checksDark: [["亮度帶", "pass"], ["彩度", "pass"], ["CVD 分離", "pass", "ΔE 13.8"], ["對比", "pass"]],
  },
};

const CATS = ["業務", "工程", "人資", "財務", "行銷", "客服", "生產", "其他"];
const HEADCOUNT = [22, 18, 9, 8, 14, 10, 12, 7];
const MONTHS = ["1月", "2月", "3月", "4月", "5月", "6月"];
const LINE_LABELS = ["加班費", "獎金", "津貼", "勞健保"];
const LINE_SERIES = [
  [12, 15, 11, 18, 14, 16],
  [5, 6, 5, 5, 32, 6],
  [8, 8, 9, 8, 9, 9],
  [20, 20, 21, 21, 21, 22],
];

const SURFACE = {
  light: { bg: "#ffffff", axis: "#cbd5e1", grid: "#eef2f6", text: "#475569", ink: "#0f172a" },
  dark: { bg: "#020817", axis: "#3a465c", grid: "#131c2b", text: "#94a3b8", ink: "#f1f5f9" },
} as const;

function MiniMultiLine({ colors, axis, grid }: { colors: string[]; axis: string; grid: string }) {
  const W = 300, H = 130, padL = 4, padR = 8, padT = 8, padB = 4;
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const max = Math.max(...LINE_SERIES.flat());
  const n = MONTHS.length;
  const xAt = (i: number) => padL + (innerW * i) / (n - 1);
  const yAt = (v: number) => padT + innerH * (1 - v / max);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <line key={f} x1={padL} x2={W - padR} y1={padT + innerH * (1 - f)} y2={padT + innerH * (1 - f)} stroke={grid} strokeWidth={1} />
      ))}
      {LINE_SERIES.map((series, si) => (
        <g key={si}>
          <polyline points={series.map((v, i) => `${xAt(i)},${yAt(v)}`).join(" ")} fill="none" stroke={colors[si]} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={xAt(n - 1)} cy={yAt(series[n - 1])} r={3} fill={colors[si]} />
        </g>
      ))}
      <line x1={padL} x2={W - padR} y1={padT + innerH} y2={padT + innerH} stroke={axis} strokeWidth={1} />
    </svg>
  );
}

function CheckChips({ rows }: { rows: CheckRow[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {rows.map(([label, verdict, note]) => (
        <span
          key={label}
          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${verdict === "pass" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}
        >
          {label}
          {note ? `（${note}）` : ""}
        </span>
      ))}
    </div>
  );
}

/** 單一主題預覽面板：8 部門人數（StackedBar，每列一色＝身分識別）＋ 4 項薪資組成 6 個月趨勢。 */
function ThemePreview({ theme, surfaceMode }: { theme: ThemeDef; surfaceMode: "light" | "dark" }) {
  const colors = surfaceMode === "light" ? theme.light : theme.dark;
  const s = SURFACE[surfaceMode];
  const panelStyle: CSSProperties = { background: s.bg, color: s.ink, borderRadius: 12, padding: 14, border: "1px solid rgba(128,128,128,0.25)" };
  return (
    <div style={panelStyle}>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide" style={{ color: s.text }}>
        {surfaceMode === "light" ? "淺色版面 #ffffff" : "深色版面 #020817"}
      </p>
      <StackedBar
        rows={CATS.map((label, i) => ({ label, segments: [{ label, value: HEADCOUNT[i], color: colors[i] }] }))}
      />
      <div className="mt-3">
        <MiniMultiLine colors={colors} axis={s.axis} grid={s.grid} />
        <div className="mt-1" style={{ color: s.text }}>
          <Legend items={LINE_LABELS.map((label, i) => ({ label, color: colors[i] }))} />
        </div>
      </div>
    </div>
  );
}

function ThemeCard({ id }: { id: keyof typeof THEMES }) {
  const t = THEMES[id];
  return (
    <div className="rounded-xl border p-4">
      <div className="mb-1 flex items-baseline gap-2">
        <h3 className="text-base font-bold">{t.name}</h3>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">{t.mood}</p>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {t.light.map((c) => (
          <span key={c} className="size-6 rounded border" style={{ background: c }} title={c} />
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <ThemePreview theme={t} surfaceMode="light" />
        <ThemePreview theme={t} surfaceMode="dark" />
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">淺色檢查</p>
          <CheckChips rows={t.checksLight} />
        </div>
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">深色檢查</p>
          <CheckChips rows={t.checksDark} />
        </div>
      </div>
    </div>
  );
}

type ThemeId = keyof typeof THEMES;
const THEME_IDS = Object.keys(THEMES) as ThemeId[];

/** 切換器：右側 Controls 選主題＋淺/深色版面，即時套到真實圖表元件（StackedBar／Legend）上比較。 */
export const 主題切換器: StoryObj<{ 主題: ThemeId; 版面: "light" | "dark" }> = {
  args: { 主題: "cobalt", 版面: "light" },
  argTypes: {
    主題: { control: "radio", options: THEME_IDS, mapping: Object.fromEntries(THEME_IDS.map((id) => [id, id])) },
    版面: { control: "inline-radio", options: ["light", "dark"] },
  },
  render: (a) => {
    const t = THEMES[a.主題];
    return (
      <div className="max-w-md space-y-3">
        <div>
          <h3 className="text-base font-bold">{t.name}</h3>
          <p className="text-xs text-muted-foreground">{t.mood}</p>
        </div>
        <ThemePreview theme={t} surfaceMode={a.版面} />
        <CheckChips rows={a.版面 === "light" ? t.checksLight : t.checksDark} />
      </div>
    );
  },
};

/** 全部並排：五種風格一次看完（不必逐一切換），決定要選哪一組再回報。 */
export const 全部並排比較: StoryObj = {
  render: () => (
    <div className="max-w-5xl space-y-5">
      <p className="text-sm text-muted-foreground">
        每組色票套同一份示範資料（8 部門人數＋4 項薪資組成 6 個月趨勢），淺/深色版面並列。
        檢查結果來自 dataviz 技能的 <code>validate_palette.js</code> 實測。選定後回報要採用哪一組（或要再調整），
        即可寫回 <code>index.css</code> 的 <code>--chart-1..8</code>。
      </p>
      {THEME_IDS.map((id) => (
        <ThemeCard key={id} id={id} />
      ))}
    </div>
  ),
};
