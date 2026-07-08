import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { EditableField, type EditableFieldProps } from "@/components/form/EditableField";
import { ChangeSummary } from "@/components/form/ChangeSummary";
import type { Change } from "@/lib/forms/diff";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Stepper } from "@/components/Stepper";
import { StackedBar, Pareto, PALETTE } from "@/components/charts";
import { ntd } from "@/lib/utils";

const meta: Meta = { title: "壓力測試", parameters: { layout: "padded" } };
export default meta;
type S = StoryObj;

// 欄位在「實際表單欄寬」下測試（模擬 grid 欄約 288px）
function Field(props: EditableFieldProps) {
  const [v, setV] = useState<EditableFieldProps["value"]>(props.value);
  return <div className="w-72 rounded border border-dashed p-2"><EditableField {...props} value={v} onChange={setV} onRevert={() => setV(props.original)} /></div>;
}

const LONG = "這是一段非常非常長的內容用來測試欄位在超長文字時會不會撐破版面AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
const longOpts = (n: number, prefix: string) => Array.from({ length: n }, (_, i) => ({ value: `o${i}`, label: `${prefix}選項${i + 1}－較長的名稱文字` }));

export const 欄位_超長文字: S = { render: () => <Field label="部門" kind="text" value={LONG} original={LONG} /> };
export const 欄位_超長標籤: S = { render: () => <Field label={"這是一個超級長的欄位標籤名稱用來測試標籤是否換行或被截斷處理" } kind="text" value="值" original="值" /> };
export const 欄位_超大金額: S = { render: () => <Field label="投保金額" kind="money" value={1234567890123} original={1234567890123} /> };
export const 欄位_radio多且長: S = { render: () => <Field label="扣繳方式" kind="radio" value="o0" original="o0" options={longOpts(6, "扣繳")} /> };
export const 欄位_多選超多項: S = { render: () => <Field label="適用津貼" kind="multiselect" value={["o0","o1","o2","o3","o4","o5","o6","o7","o8","o9","o10","o11"]} original={["o0"]} options={longOpts(24, "津貼")} /> };
export const 欄位_下拉長選項: S = { render: () => <Field label="狀態" kind="select" value="o0" original="o0" options={longOpts(3, "非常長的狀態名稱")} /> };

const manyChanges: Change[] = Array.from({ length: 24 }, (_, i) => ({
  field: `f${i}`, label: `欄位名稱${i + 1}${i % 3 === 0 ? "（較長的欄位標籤）" : ""}`,
  before: i, after: i + 1,
  beforeText: i % 4 === 0 ? LONG.slice(0, 30) : `舊值${i}`, afterText: i % 4 === 0 ? LONG.slice(0, 30) : `新值${i}`,
}));
export const 變更摘要_超多筆: S = { render: () => <div className="w-[520px]"><ChangeSummary changes={manyChanges} onRevertField={() => {}} onRevertAll={() => {}} /></div> };

const rows = Array.from({ length: 8 }, (_, i) => ({ id: `E${i}`, name: `員工姓名比較長${i}`, dept: `部門名稱${i}`, note: LONG.slice(0, 20), a: 12345 * (i + 1), b: 999 * (i + 1), c: 45800, d: 1832, e: 6, f: `2020-0${(i % 9) + 1}-01` }));
export const 資料表_多欄超寬: S = {
  render: () => (
    <DataTable rows={rows} getRowKey={(r) => r.id} searchPlaceholder="搜尋…"
      columns={[
        { key: "name", header: "員工", freeze: true, sortValue: (r) => r.name, cell: (r) => <span className="font-medium">{r.name}</span> },
        { key: "dept", header: "部門", cell: (r) => r.dept },
        { key: "note", header: "備註（長）", cell: (r) => r.note },
        { key: "a", header: "應發", numeric: true, cell: (r) => ntd(r.a) },
        { key: "b", header: "加班費", numeric: true, cell: (r) => ntd(r.b) },
        { key: "c", header: "投保", numeric: true, cell: (r) => ntd(r.c) },
        { key: "d", header: "健保", numeric: true, cell: (r) => ntd(r.d) },
        { key: "e", header: "自提率", numeric: true, cell: (r) => `${r.e}%` },
        { key: "f", header: "到職日", cell: (r) => r.f },
        { key: "x", header: "操作", cell: () => <Badge variant="outline">編輯</Badge> },
      ]} />
  ),
};

export const 標籤_超長: S = { render: () => <div className="w-64"><Badge variant="secondary">這是一個很長的標籤文字用來測試 Badge 換行或溢出</Badge></div> };
export const 步驟_很多步: S = { render: () => <Stepper current="s5" steps={Array.from({ length: 10 }, (_, i) => ({ key: `s${i}`, label: `步驟名稱${i + 1}` }))} completed={{ s0: true, s1: true, s2: true, s3: true, s4: true }} /> };

const manyBars = Array.from({ length: 20 }, (_, i) => ({ label: `部門單位名稱${i + 1}`, value: Math.round(500000 / (i + 1)) }));
export const 圖表_柏拉圖多類別: S = { render: () => <div className="w-[460px]"><Pareto data={manyBars} /></div> };
export const 圖表_堆疊多段: S = {
  render: () => (
    <div className="w-[460px]">
      <StackedBar rows={Array.from({ length: 12 }, (_, i) => ({ label: `部門${i + 1}`, segments: PALETTE.map((c, j) => ({ label: `項目${j}`, value: 10000 * (j + 1), color: c })) }))} />
    </div>
  ),
};
