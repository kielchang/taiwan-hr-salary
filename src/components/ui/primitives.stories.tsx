import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./button";
import { Badge } from "./badge";
import { Callout } from "./callout";
import { Delta } from "./delta";
import { EmptyState } from "./empty-state";
import { Input } from "./input";
import { Checkbox } from "./checkbox";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Tooltip, TruncatedText } from "./tooltip";
import { Inbox } from "lucide-react";

const meta: Meta = { title: "元件/基礎", parameters: { layout: "centered" } };
export default meta;
type S = StoryObj;

// ── 互動 Playground（右側 Controls 即時調整）──────────────────────────────
export const 按鈕_互動: StoryObj<{ 樣式: "default" | "secondary" | "outline" | "ghost" | "destructive" | "link"; 尺寸: "default" | "sm" | "lg" | "icon"; 文字: string; 停用: boolean }> = {
  args: { 樣式: "default", 尺寸: "default", 文字: "按鈕", 停用: false },
  argTypes: {
    樣式: { control: "select", options: ["default", "secondary", "outline", "ghost", "destructive", "link"] },
    尺寸: { control: "inline-radio", options: ["default", "sm", "lg", "icon"] },
    文字: { control: "text" }, 停用: { control: "boolean" },
  },
  render: (a) => <Button variant={a.樣式} size={a.尺寸} disabled={a.停用}>{a.文字}</Button>,
};

export const 標籤_互動: StoryObj<{ 樣式: "default" | "secondary" | "outline" | "success" | "warning" | "destructive"; 文字: string }> = {
  args: { 樣式: "success", 文字: "已確認" },
  argTypes: { 樣式: { control: "select", options: ["default", "secondary", "outline", "success", "warning", "destructive"] }, 文字: { control: "text" } },
  render: (a) => <Badge variant={a.樣式}>{a.文字}</Badge>,
};

export const 差異_互動: StoryObj<{ 數值: number; 格式: "數字" | "百分比" | "金額"; 增標籤: string; 減標籤: string }> = {
  args: { 數值: 12000, 格式: "數字", 增標籤: "增加", 減標籤: "減少" },
  argTypes: { 數值: { control: { type: "range", min: -50000, max: 50000, step: 1000 } }, 格式: { control: "inline-radio", options: ["數字", "百分比", "金額"] }, 增標籤: { control: "text" }, 減標籤: { control: "text" } },
  render: (a) => {
    const fmt = a.格式 === "百分比" ? (n: number) => `${n}%` : a.格式 === "金額" ? (n: number) => `$${n.toLocaleString()}` : undefined;
    return <Delta value={a.數值} format={fmt} posLabel={a.增標籤} negLabel={a.減標籤} />;
  },
};

export const 狀態提示框_互動: StoryObj<{ 樣式: "success" | "warning" | "info" | "danger"; 標籤: string; 標題: string; 內文: string }> = {
  args: { 樣式: "success", 標籤: "良好", 標題: "加班成本低、工時穩定", 內文: "加班佔比很低，人力配置與工時看來穩定。" },
  argTypes: {
    樣式: { control: "inline-radio", options: ["success", "warning", "info", "danger"] },
    標籤: { control: "text" }, 標題: { control: "text" }, 內文: { control: "text" },
  },
  render: (a) => (
    <div className="w-96">
      <Callout variant={a.樣式} tag={a.標籤} title={a.標題}>{a.內文}</Callout>
    </div>
  ),
};

export const 空狀態_互動: StoryObj<{ 標題: string; 提示: string; 有動作: boolean; 精簡: boolean }> = {
  args: { 標題: "尚未建立資料", 提示: "按「新增」開始，或載入示範資料。", 有動作: true, 精簡: false },
  argTypes: { 標題: { control: "text" }, 提示: { control: "text" }, 有動作: { control: "boolean" }, 精簡: { control: "boolean" } },
  render: (a) => (
    <div className="w-96 rounded-md border">
      <EmptyState icon={<Inbox className="size-6" />} title={a.標題} hint={a.提示} compact={a.精簡} action={a.有動作 ? <Button size="sm">新增</Button> : undefined} />
    </div>
  ),
};

export const 提示泡泡_互動: StoryObj<{ 提示內容: string; 觸發文字: string; 可鍵盤聚焦: boolean }> = {
  args: { 提示內容: "這是完整的說明內容，hover / 鍵盤聚焦 / 長壓皆可顯示。", 觸發文字: "滑鼠移上來看提示", 可鍵盤聚焦: true },
  argTypes: { 提示內容: { control: "text" }, 觸發文字: { control: "text" }, 可鍵盤聚焦: { control: "boolean" } },
  render: (a) => (
    <div className="flex flex-col items-start gap-4">
      <Tooltip content={a.提示內容} focusable={a.可鍵盤聚焦}>
        <span className="cursor-help rounded border border-dashed px-2 py-1 text-sm">{a.觸發文字}</span>
      </Tooltip>
      <div className="w-40"><TruncatedText text={a.提示內容} /></div>
    </div>
  ),
};

export const 按鈕_Button: S = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {(["default", "secondary", "outline", "ghost", "destructive", "link"] as const).map((v) => (
        <Button key={v} variant={v}>{v}</Button>
      ))}
    </div>
  ),
};

export const 標籤_Badge: S = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {(["default", "secondary", "outline", "success", "warning", "destructive"] as const).map((v) => (
        <Badge key={v} variant={v}>{v}</Badge>
      ))}
    </div>
  ),
};

export const 差異_Delta: S = {
  render: () => (
    <div className="flex gap-6">
      <Delta value={12000} posLabel="增加" negLabel="減少" />
      <Delta value={-8000} posLabel="增加" negLabel="減少" />
      <Delta value={0} />
    </div>
  ),
};

export const 狀態提示框_Callout: S = {
  render: () => (
    <div className="w-96 space-y-2">
      <Callout variant="success" tag="良好" title="加班成本低、工時穩定">加班佔比很低，人力配置與工時看來穩定。佐證：加班費佔總成本 0.76%</Callout>
      <Callout variant="info" tag="提醒" title="別忘了雇主法定負擔">薪資之外，公司還要負擔勞健保、勞退、職災等法定成本，編預算時要連同計入。</Callout>
      <Callout variant="warning" tag="需注意" title="獎金/變動占比偏高">獎金/變動占比過高或加班費偏大，常是結構檢討重點。</Callout>
      <Callout variant="danger" tag="異常" title="本月實發為負值">請檢查扣項是否超過應發總額，確認後才能確認本期。</Callout>
    </div>
  ),
};

export const 空狀態_EmptyState: S = {
  render: () => (
    <div className="w-96 rounded-md border">
      <EmptyState icon={<Inbox className="size-6" />} title="尚未建立資料" hint="按「新增」開始，或載入示範資料。" action={<Button size="sm">新增</Button>} />
    </div>
  ),
};

export const 表單控制項_Controls: S = {
  render: () => (
    <div className="w-80 space-y-3">
      <Input placeholder="文字輸入" />
      <Input type="number" placeholder="數字" className="text-right tabular-nums" />
      <Select defaultValue="a">
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="a">選項 A</SelectItem>
          <SelectItem value="b">選項 B</SelectItem>
        </SelectContent>
      </Select>
      <label className="flex items-center gap-2 text-sm"><Checkbox defaultChecked /> 勾選項目</label>
    </div>
  ),
};

export const 卡片_Card: S = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle className="text-base">卡片標題</CardTitle>
        <CardDescription>卡片說明文字。</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">卡片內容區。</CardContent>
    </Card>
  ),
};
