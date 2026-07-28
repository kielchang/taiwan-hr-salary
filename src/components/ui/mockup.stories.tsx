import type { Meta, StoryObj } from "@storybook/react";
import { Placeholder, Spotlight, MockScreenFrame, MockRow } from "./mockup";
import { Button } from "./button";
import { Badge } from "./badge";
import { Callout } from "./callout";

const meta: Meta = { title: "元件/模擬畫面", parameters: { layout: "centered" } };
export default meta;
type S = StoryObj;

// ── 互動 Playground ──────────────────────────────────────────────────────
export const 佔位塊_互動: StoryObj<{ 寬: number; 高: number; 標籤: string }> = {
  args: { 寬: 220, 高: 40, 標籤: "內容區（略）" },
  argTypes: { 寬: { control: { type: "range", min: 40, max: 480, step: 10 } }, 高: { control: { type: "range", min: 10, max: 120, step: 2 } }, 標籤: { control: "text" } },
  render: (a) => <Placeholder w={a.寬} h={a.高} label={a.標籤} />,
};

export const 聚光_互動: StoryObj<{ 標籤: string }> = {
  args: { 標籤: "按這裡" },
  argTypes: { 標籤: { control: "text" } },
  render: (a) => (
    <div className="p-10">
      <Spotlight label={a.標籤 || undefined}><Button size="sm">確認本月結算</Button></Spotlight>
    </div>
  ),
};

export const 假列_重點格: S = {
  render: () => (
    <div className="flex w-[520px] flex-col gap-2">
      <MockRow />
      <MockRow focus={<Spotlight label="完成後你會看到"><Badge variant="secondary">加班 8 小時</Badge></Spotlight>} />
      <MockRow />
    </div>
  ),
};

// ── 組合示例：一張完整的模擬步驟畫面（手冊 MockFlow/MockScreen 的內容單位）──
export const 組合示例_模擬步驟: S = {
  parameters: { layout: "padded" },
  render: () => (
    <div className="w-[640px] overflow-x-auto rounded-lg border">
      <MockScreenFrame>
        <div className="flex justify-between">
          <Placeholder w={200} h={26} label="員工清單" />
          <Spotlight label="從這裡建檔"><Button size="sm">新進到職</Button></Spotlight>
        </div>
        <MockRow /><MockRow />
        <Callout variant="info" title="完成後你會看到">員工清單多出這位新人；工作台「本月應加保」+1。</Callout>
      </MockScreenFrame>
    </div>
  ),
};
