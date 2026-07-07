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
export const 勾選: Story = { render: () => <Demo label="依附健保" kind="checkbox" value={true} original={true} /> };
export const 日期: Story = { render: () => <Demo label="到職日" kind="date" value="2020-01-01" original="2020-01-01" /> };
export const 鎖定: Story = { render: () => <Demo label="員工編號" kind="text" value="E001" disabled lockHint="本月已確認結算、此欄已鎖定" /> };
export const 新增模式: Story = { render: () => <Demo label="姓名" kind="text" value="" alwaysEdit trackChanges={false} placeholder="輸入姓名" /> };
