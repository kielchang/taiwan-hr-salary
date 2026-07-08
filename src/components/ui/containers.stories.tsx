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

// 較大資料集：足以展示分頁（5/15/30/50）、數值範圍篩選、十字對準
const DEPTS = ["研發部", "業務部", "行銷部", "財務部", "客服部", "品保部"];
const TITLES = ["工程師", "資深工程師", "業務代表", "專員", "經理", "助理"];
const big = Array.from({ length: 42 }, (_, i) => ({
  id: `E${String(i + 1).padStart(3, "0")}`,
  name: `員工${i + 1}`,
  dept: DEPTS[i % DEPTS.length],
  title: TITLES[i % TITLES.length],
  total: 30000 + ((i * 3700) % 180000),
  tenure: (i * 7) % 130,
}));

export const 資料表_DataTable: S = {
  render: () => (
    <div className="max-w-3xl space-y-2">
      <p className="text-xs text-muted-foreground">
        互動：指向儲存格看**十字對準**；點欄位表頭漏斗做**單欄篩選**（文字＝包含、數字＝範圍）；下方切換**每頁 5/15/30/50**。
      </p>
      <DataTable
        rows={big}
        getRowKey={(r) => r.id}
        searchPlaceholder="搜尋姓名／部門…"
        columns={[
          { key: "name", header: "員工", freeze: true, sortValue: (r) => r.name, filterText: (r) => `${r.name} ${r.id}`, cell: (r) => <><span className="font-medium">{r.name}</span><span className="ml-1.5 text-xs text-muted-foreground">{r.id}</span></> },
          { key: "dept", header: "部門", sortValue: (r) => r.dept, cell: (r) => r.dept },
          { key: "title", header: "職稱", sortValue: (r) => r.title, cell: (r) => r.title },
          { key: "tenure", header: "年資（月）", numeric: true, sortValue: (r) => r.tenure, cell: (r) => `${r.tenure} 月` },
          { key: "total", header: "月薪總額", numeric: true, sortValue: (r) => r.total, cell: (r) => ntd(r.total), total: (rs) => ntd(rs.reduce((a, r) => a + r.total, 0)) },
        ]}
      />
    </div>
  ),
};

/** 小資料集（無分頁）：純示範欄位設定與合計列 */
export const 資料表_精簡: S = {
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
