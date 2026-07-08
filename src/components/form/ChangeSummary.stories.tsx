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

/** 互動 Playground：右側 Controls 調整變更筆數（含捲動門檻），即時看樣式。 */
export const 互動: StoryObj<{ 變更筆數: number }> = {
  args: { 變更筆數: 3 },
  argTypes: { 變更筆數: { control: { type: "range", min: 0, max: 30, step: 1 } } },
  render: (a) => {
    const changes: Change[] = Array.from({ length: a.變更筆數 }, (_, i) => ({
      field: `f${i}`, label: `欄位${i + 1}`, before: i, after: i + 1, beforeText: `舊值${i}`, afterText: `新值${i + 1}`,
    }));
    return <div className="w-96"><ChangeSummary changes={changes} onRevertField={() => {}} onRevertAll={() => {}} /></div>;
  },
};

export const 有變更: Story = {
  render: () => <div className="w-96"><ChangeSummary changes={sample} onRevertField={() => {}} onRevertAll={() => {}} /></div>,
};
export const 尚無變更: Story = {
  render: () => <div className="w-96"><ChangeSummary changes={[]} /></div>,
};
