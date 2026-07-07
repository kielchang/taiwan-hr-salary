import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./button";
import { Badge } from "./badge";
import { Delta } from "./delta";
import { EmptyState } from "./empty-state";
import { Input } from "./input";
import { Checkbox } from "./checkbox";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Inbox } from "lucide-react";

const meta: Meta = { title: "元件/基礎", parameters: { layout: "centered" } };
export default meta;
type S = StoryObj;

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
