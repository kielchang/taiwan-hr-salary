import type { Meta, StoryObj } from "@storybook/react";
import { ChangeSummary } from "./ChangeSummary";
import type { Change } from "@/lib/forms/diff";

const meta: Meta<typeof ChangeSummary> = {
  title: "元件/表單/ChangeSummary",
  component: ChangeSummary,
  parameters: { layout: "centered" },
};
export default meta;
type Story = StoryObj<typeof ChangeSummary>;

const sample: Change[] = [
  { field: "name", label: "姓名", before: "王小明", after: "王大明", beforeText: "王小明", afterText: "王大明" },
  { field: "baseSalary", label: "本薪", before: 40000, after: 45000, beforeText: "40,000", afterText: "45,000" },
  { field: "status", label: "任職狀態", before: "在職", after: "留停", beforeText: "在職", afterText: "留停" },
];

export const 有變更: Story = {
  render: () => <div className="w-96"><ChangeSummary changes={sample} onRevertField={() => {}} onRevertAll={() => {}} /></div>,
};
export const 尚無變更: Story = {
  render: () => <div className="w-96"><ChangeSummary changes={[]} /></div>,
};
