import type { Meta, StoryObj } from "@storybook/react";
import { StackedBar, Pareto, TrendChart, Bullet, Heatmap, BarChart, LineChart, Scatter, Legend, PALETTE } from "./index";

const meta: Meta = { title: "元件/圖表", parameters: { layout: "padded" } };
export default meta;
type S = StoryObj;

const bars = [
  { label: "研發部", value: 1_200_000 },
  { label: "業務部", value: 860_000 },
  { label: "行銷部", value: 540_000 },
  { label: "管理部", value: 420_000 },
  { label: "客服部", value: 260_000 },
];
const trend = ["1月", "2月", "3月", "4月", "5月", "6月"].map((label, i) => ({ label, value: 4_800_000 + i * 120_000 }));

/** 互動 Playground：右側 Controls 調整**類別數／期數**與圖表類型，即時看不同資料量下的呈現。 */
export const 互動: StoryObj<{ 圖表: "長條圖" | "柏拉圖" | "趨勢圖"; 資料點數: number; 顯示數值: boolean }> = {
  args: { 圖表: "長條圖", 資料點數: 5, 顯示數值: true },
  argTypes: {
    圖表: { control: "inline-radio", options: ["長條圖", "柏拉圖", "趨勢圖"] },
    資料點數: { control: { type: "range", min: 1, max: 24, step: 1 } },
    顯示數值: { control: "boolean" },
  },
  render: (a) => {
    const data = Array.from({ length: a.資料點數 }, (_, i) => ({ label: a.圖表 === "趨勢圖" ? `${i + 1}月` : `類別${i + 1}`, value: Math.round(1_200_000 / (i + 1)) + (i % 3) * 50_000 }));
    return (
      <div className="w-[460px]">
        {a.圖表 === "長條圖" && <BarChart data={data} showValues={a.顯示數值} />}
        {a.圖表 === "柏拉圖" && <Pareto data={data} />}
        {a.圖表 === "趨勢圖" && <TrendChart data={data} />}
      </div>
    );
  },
};

export const 堆疊長條_StackedBar: S = {
  render: () => (
    <div className="w-[420px]">
      <StackedBar rows={[
        { label: "研發部", segments: [{ label: "本薪", value: 800000, color: PALETTE[0] }, { label: "雇主負擔", value: 400000, color: PALETTE[1] }] },
        { label: "業務部", segments: [{ label: "本薪", value: 560000, color: PALETTE[0] }, { label: "雇主負擔", value: 300000, color: PALETTE[1] }] },
      ]} />
    </div>
  ),
};
export const 柏拉圖_Pareto: S = { render: () => <div className="w-[420px]"><Pareto data={bars} /></div> };
export const 趨勢_TrendChart: S = { render: () => <div className="w-[420px]"><TrendChart data={trend} /></div> };
export const 子彈圖_Bullet: S = { render: () => <div className="w-[420px]"><Bullet label="年度預算 vs 實際" value={5_400_000} target={6_000_000} /></div> };
export const 長條圖_BarChart: S = { render: () => <div className="w-[420px]"><BarChart data={bars} showValues /></div> };
export const 折線_LineChart: S = {
  render: () => (
    <div className="w-[320px]">
      <LineChart diagonal points={[0, 0.15, 0.35, 0.6, 1].map((p, i, a) => ({ x: i / (a.length - 1), y: p }))} />
    </div>
  ),
};
export const 散佈圖_Scatter: S = {
  render: () => (
    <div className="w-[420px]">
      <Scatter xLabel="年資（月）" yLabel="月薪" points={[
        { x: 12, y: 38000, label: "A" }, { x: 36, y: 52000, label: "B" }, { x: 60, y: 68000, label: "C" }, { x: 120, y: 95000, label: "D" },
      ]} />
    </div>
  ),
};
export const 圖例_Legend: S = {
  render: () => <Legend items={[{ label: "本薪", color: PALETTE[0] }, { label: "加給", color: PALETTE[1] }, { label: "雇主負擔", color: PALETTE[5] }]} />,
};
export const 熱區圖_Heatmap: S = {
  render: () => (
    <div className="w-[420px]">
      <Heatmap
        rowLabels={["研發部", "業務部", "行銷部"]}
        colLabels={["A 案", "B 案", "C 案"]}
        cells={[[40, 20, 10], [10, 50, 15], [5, 10, 35]]}
        fmt={(n) => `${n}h`}
      />
    </div>
  ),
};

// ── 無障礙：文字等價（審查用）────────────────────────────────────────────
// role="img" 會讓 svg 子樹對輔助技術隱藏，因此每張圖都必須另外提供
// 「aria-label 摘要」＋「同資料的無障礙表格」。表格平常 sr-only（看不見、不佔版面），
// 這支 story 把它顯形，方便人工審查內容是否正確——這是螢幕報讀器實際會唸到的東西。
export const 無障礙_文字等價: S = {
  parameters: { layout: "padded" },
  render: () => (
    <div className="space-y-4 [&_.sr-only]:static [&_.sr-only]:m-0 [&_.sr-only]:size-auto [&_.sr-only]:overflow-visible [&_.sr-only]:whitespace-normal [&_.sr-only]:p-0 [&_.sr-only]:[clip:auto]">
      <p className="text-xs text-muted-foreground">
        下方每張圖的表格平常是隱藏的（<code>sr-only</code>），此處顯形以供審查。
        滑鼠使用者看圖、螢幕報讀器使用者讀表格——同一份資料，兩個出口。
      </p>
      <div className="w-[420px] space-y-1">
        <p className="text-xs font-medium">趨勢圖</p>
        <TrendChart caption="各月訂單量" data={[
          { label: "1月", value: 120 }, { label: "2月", value: 150 }, { label: "3月", value: 138 },
        ]} valueFmt={(n) => `${n} 筆`} />
      </div>
      <div className="w-[420px] space-y-1">
        <p className="text-xs font-medium">柏拉圖（含佔比與累積）</p>
        <Pareto caption="各品項銷量" data={[
          { label: "品項 A", value: 90 }, { label: "品項 B", value: 45 }, { label: "品項 C", value: 15 },
        ]} />
      </div>
      <div className="w-[420px] space-y-1">
        <p className="text-xs font-medium">堆疊長條（分段明細原本只有 hover 拿得到）</p>
        <StackedBar caption="各區域成本組成" rows={[
          { label: "北區", segments: [{ label: "固定", value: 60, color: PALETTE[0] }, { label: "變動", value: 30, color: PALETTE[1] }] },
          { label: "南區", segments: [{ label: "固定", value: 40, color: PALETTE[0] }, { label: "變動", value: 45, color: PALETTE[1] }] },
        ]} />
      </div>
    </div>
  ),
};
