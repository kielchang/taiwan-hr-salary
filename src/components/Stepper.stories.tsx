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

export const 第二步: Story = {
  render: () => <Stepper steps={steps} current="salary" completed={{ basic: true }} />,
};
export const 最後一步: Story = {
  render: () => <Stepper steps={steps} current="confirm" completed={{ basic: true, salary: true, family: true }} />,
};
