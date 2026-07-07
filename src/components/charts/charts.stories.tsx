import type { Meta, StoryObj } from "@storybook/react";
import { StackedBar, Pareto, TrendChart, Bullet, Heatmap, PALETTE } from "./index";

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
