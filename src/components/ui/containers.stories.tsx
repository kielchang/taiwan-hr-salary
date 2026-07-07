import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { ChartCard } from "./chart-card";
import { DataTable } from "./data-table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs";
import { Button } from "./button";
import { Badge } from "./badge";
import { StackedBar, PALETTE } from "@/components/charts";
import { ntd } from "@/lib/utils";

const meta: Meta = { title: "元件/容器", parameters: { layout: "padded" } };
export default meta;
type S = StoryObj;

const people = [
  { id: "E001", name: "王小明", dept: "研發部", total: 68000 },
  { id: "E002", name: "李美華", dept: "業務部", total: 52000 },
  { id: "E003", name: "陳大文", dept: "行銷部", total: 47000 },
];

export const 資料表_DataTable: S = {
  render: () => (
    <div className="max-w-2xl">
      <DataTable
        rows={people}
        getRowKey={(r) => r.id}
        searchPlaceholder="搜尋姓名／部門…"
        columns={[
          { key: "name", header: "員工", freeze: true, sortValue: (r) => r.name, filterText: (r) => `${r.name} ${r.id}`, cell: (r) => <><span className="font-medium">{r.name}</span><span className="ml-1.5 text-xs text-muted-foreground">{r.id}</span></> },
          { key: "dept", header: "部門", sortValue: (r) => r.dept, cell: (r) => r.dept },
          { key: "total", header: "月薪總額", numeric: true, sortValue: (r) => r.total, cell: (r) => ntd(r.total), total: (rs) => ntd(rs.reduce((a, r) => a + r.total, 0)) },
        ]}
      />
    </div>
  ),
};

export const 圖表卡_ChartCard: S = {
  render: () => (
    <div className="max-w-lg">
      <ChartCard title="人事成本組成" description="依項目分段" legend={[{ label: "本薪", color: PALETTE[0] }, { label: "雇主負擔", color: PALETTE[1] }]}>
        <StackedBar rows={[{ label: "全公司", segments: [{ label: "本薪", value: 4200000, color: PALETTE[0] }, { label: "雇主負擔", value: 900000, color: PALETTE[1] }] }]} />
      </ChartCard>
    </div>
  ),
};

export const 對話框_Dialog: S = {
  render: () => {
    const Demo = () => {
      const [open, setOpen] = useState(true);
      return (
        <>
          <Button onClick={() => setOpen(true)}>開啟對話框</Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
              <DialogHeader><DialogTitle>對話框標題</DialogTitle></DialogHeader>
              <p className="text-sm text-muted-foreground">置中卡片、自畫面中央縮放彈出（見行動版修正）。</p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>取消</Button>
                <Button onClick={() => setOpen(false)}>確定</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      );
    };
    return <Demo />;
  },
};

export const 分頁_Tabs: S = {
  render: () => (
    <Tabs defaultValue="a" className="w-96">
      <TabsList>
        <TabsTrigger value="a">總覽</TabsTrigger>
        <TabsTrigger value="b">明細</TabsTrigger>
        <TabsTrigger value="c">設定</TabsTrigger>
      </TabsList>
      <TabsContent value="a" className="pt-3 text-sm">總覽內容 <Badge variant="secondary">shadcn Tabs 元件</Badge></TabsContent>
      <TabsContent value="b" className="pt-3 text-sm">明細內容</TabsContent>
      <TabsContent value="c" className="pt-3 text-sm">設定內容</TabsContent>
    </Tabs>
  ),
};
