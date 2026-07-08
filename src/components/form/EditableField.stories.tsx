import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { EditableField, type EditableFieldProps } from "./EditableField";

const meta: Meta<typeof EditableField> = {
  title: "元件/表單/EditableField",
  component: EditableField,
  parameters: { layout: "centered" },
};
export default meta;
type Story = StoryObj<typeof EditableField>;

function Demo(props: EditableFieldProps) {
  const [v, setV] = useState<EditableFieldProps["value"]>(props.value);
  return (
    <div className="w-72">
      <EditableField {...props} value={v} onChange={setV} onRevert={() => setV(props.original)} />
    </div>
  );
}

/** 互動 Playground：右側 Controls 即時切換型態（text/money/rate/select/radio/multiselect…）、
 *  改值/原值看變更態、切鎖定，快速驗證各種狀況。 */
export const 互動: StoryObj<{ label: string; kind: EditableFieldProps["kind"]; value: string; original: string; disabled: boolean; help: string; unit: string }> = {
  args: { label: "欄位名稱", kind: "text", value: "示例值", original: "示例值", disabled: false, help: "", unit: "" },
  argTypes: {
    kind: { control: "select", options: ["text", "number", "money", "rate", "date", "select", "checkbox", "radio", "multiselect"] },
    disabled: { control: "boolean" },
    label: { control: "text" }, value: { control: "text" }, original: { control: "text" }, help: { control: "text" }, unit: { control: "text" },
  },
  render: (a) => <PlayField key={`${a.kind}|${a.value}|${a.original}`} {...a} />,
};

function PlayField(a: { label: string; kind: EditableFieldProps["kind"]; value: string; original: string; disabled: boolean; help: string; unit: string }) {
  const opts = [{ value: "甲", label: "甲" }, { value: "乙", label: "乙" }, { value: "丙", label: "丙" }];
  const coerce = (v: string): EditableFieldProps["value"] => {
    switch (a.kind) {
      case "money": case "number": case "rate": return Number(v) || 0;
      case "checkbox": return v === "true" || v === "是";
      case "multiselect": return String(v).split(/[、,]/).map((s) => s.trim()).filter(Boolean);
      default: return v;
    }
  };
  const [val, setVal] = useState<EditableFieldProps["value"]>(() => coerce(a.value));
  return (
    <div className="w-72">
      <EditableField
        label={a.label} kind={a.kind} value={val} original={coerce(a.original)} options={opts}
        disabled={a.disabled} help={a.help || undefined} unit={a.unit || undefined}
        onChange={setVal} onRevert={() => setVal(coerce(a.original))}
      />
    </div>
  );
}

export const 唯讀文字: Story = { render: () => <Demo label="部門" kind="text" value="行銷部" original="行銷部" /> };
export const 已變更_文字: Story = { render: () => <Demo label="部門" kind="text" value="測試部" original="行銷部" /> };
export const 金額: Story = { render: () => <Demo label="本薪" kind="money" value={45000} original={45000} /> };
export const 已變更_金額: Story = { render: () => <Demo label="本薪" kind="money" value={48000} original={45000} /> };
export const 數字_含小數: Story = { render: () => <Demo label="本月工時" kind="number" value={168.5} original={168.5} help="千分位並保留小數" /> };
export const 已變更_數字: Story = { render: () => <Demo label="本月工時" kind="number" value={176} original={168.5} /> };
export const 比率: Story = { render: () => <Demo label="勞退自提率" kind="rate" value={0.06} original={0.06} help="0～6%" /> };
export const 下拉: Story = {
  render: () => (
    <Demo label="任職狀態" kind="select" value="在職" original="在職" options={[
      { value: "在職", label: "在職" }, { value: "離職", label: "離職" }, { value: "留停", label: "留停" },
    ]} />
  ),
};
export const 是否_分段: Story = { render: () => <Demo label="依附健保" kind="checkbox" value={true} original={true} /> };
export const 單選_Radio: Story = {
  render: () => <Demo label="每月扣繳方式" kind="radio" value="固定5%" original="固定5%" options={[
    { value: "固定5%", label: "固定 5%" }, { value: "依扣繳稅額表", label: "依扣繳稅額表" },
  ]} />,
};
export const 多選_MultiSelect: Story = {
  render: () => <Demo label="本月請假別" kind="multiselect" value={["特休", "病假"]} original={["特休"]} options={[
    { value: "特休", label: "特休" }, { value: "病假", label: "病假" }, { value: "事假", label: "事假" }, { value: "婚假", label: "婚假" }, { value: "喪假", label: "喪假" },
  ]} />,
};
export const 負金額_帳務: Story = { render: () => <Demo label="其他扣款" kind="money" value={-2000} original={-2000} help="負值以括號＋紅字呈現（帳務）" /> };
export const 數字帶單位: Story = { render: () => <Demo label="本月工時" kind="number" value={168.5} original={168.5} unit="h" /> };
export const 日期: Story = { render: () => <Demo label="到職日" kind="date" value="2020-01-01" original="2020-01-01" /> };
export const 鎖定: Story = { render: () => <Demo label="員工編號" kind="text" value="E001" disabled lockHint="本月已確認結算、此欄已鎖定" /> };
export const 新增模式: Story = { render: () => <Demo label="姓名" kind="text" value="" alwaysEdit trackChanges={false} placeholder="輸入姓名" /> };
