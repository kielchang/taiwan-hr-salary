import type { Meta, StoryObj } from "@storybook/react";
import { Stepper } from "./Stepper";

const meta: Meta<typeof Stepper> = {
  title: "元件/基礎/Stepper",
  component: Stepper,
  parameters: { layout: "padded" },
};
export default meta;
type Story = StoryObj<typeof Stepper>;

const steps = [
  { key: "basic", label: "基本資料" },
  { key: "salary", label: "固定薪資" },
  { key: "family", label: "眷屬與扣繳" },
  { key: "confirm", label: "確認" },
];

/** 互動 Playground：右側 Controls 調整步驟數與目前步驟，即時看樣式。 */
export const 互動: StoryObj<{ 步驟數: number; 目前步驟: number }> = {
  args: { 步驟數: 4, 目前步驟: 1 },
  argTypes: {
    步驟數: { control: { type: "range", min: 2, max: 8, step: 1 } },
    目前步驟: { control: { type: "range", min: 0, max: 7, step: 1 } },
  },
  render: (a) => {
    const items = Array.from({ length: a.步驟數 }, (_, i) => ({ key: String(i), label: `步驟${i + 1}` }));
    const cur = Math.min(a.目前步驟, a.步驟數 - 1);
    const completed = Object.fromEntries(items.map((_, i) => [String(i), i < cur]));
    return <div className="w-[560px]"><Stepper steps={items} current={String(cur)} completed={completed} /></div>;
  },
};

export const 第二步: Story = {
  render: () => <Stepper steps={steps} current="salary" completed={{ basic: true }} />,
};
export const 最後一步: Story = {
  render: () => <Stepper steps={steps} current="confirm" completed={{ basic: true, salary: true, family: true }} />,
};
