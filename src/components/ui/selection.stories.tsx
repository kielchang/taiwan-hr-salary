import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { SegGroup, type SegOption } from "./seg-group";
import { Chips } from "./chips";

const meta: Meta = { title: "元件/選擇", parameters: { layout: "centered" } };
export default meta;
type S = StoryObj;

const 狀態: SegOption[] = [
  { value: "active", label: "在職" },
  { value: "leave", label: "留停" },
  { value: "terminated", label: "離職" },
];
const 津貼: SegOption[] = [
  { value: "meal", label: "伙食" },
  { value: "transport", label: "交通" },
  { value: "duty", label: "職務" },
  { value: "skill", label: "技術" },
];

// ── 分段選擇（少量互斥選項）──────────────────────────────────────────────
export const 分段選擇_互動: StoryObj<{ 已改動: boolean; 鎖定: boolean }> = {
  args: { 已改動: false, 鎖定: false },
  argTypes: { 已改動: { control: "boolean" }, 鎖定: { control: "boolean" } },
  render: (a) => {
    const [v, setV] = useState("active");
    return (
      <SegGroup
        label="員工狀態"
        options={狀態}
        value={v}
        onPick={setV}
        changed={a.已改動}
        disabled={a.鎖定}
        lockHint="本月已確認，需先取消確認才能修改"
      />
    );
  },
};

export const 分段選擇_三態: S = {
  parameters: { layout: "padded" },
  render: () => {
    const [v, setV] = useState("active");
    return (
      <div className="flex flex-col gap-3">
        <SegGroup label="預設" options={狀態} value={v} onPick={setV} />
        <SegGroup label="已改動未送出" options={狀態} value="leave" onPick={() => {}} changed />
        <SegGroup label="鎖定" options={狀態} value="active" onPick={() => {}} disabled lockHint="本月已確認" />
      </div>
    );
  },
};

// ── 多選標籤片 ──────────────────────────────────────────────────────────
export const 標籤片_互動: StoryObj<{ 已改動: boolean; 鎖定: boolean }> = {
  args: { 已改動: false, 鎖定: false },
  argTypes: { 已改動: { control: "boolean" }, 鎖定: { control: "boolean" } },
  render: (a) => {
    const [sel, setSel] = useState<string[]>(["meal"]);
    return (
      <Chips
        label="固定津貼"
        options={津貼}
        selected={sel}
        onToggle={(v) => setSel((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]))}
        changed={a.已改動}
        disabled={a.鎖定}
        lockHint="本月已確認，需先取消確認才能修改"
      />
    );
  },
};

export const 標籤片_四態: S = {
  parameters: { layout: "padded" },
  render: () => {
    const [sel, setSel] = useState<string[]>(["meal", "transport"]);
    return (
      <div className="flex flex-col gap-3">
        <Chips label="預設" options={津貼} selected={sel}
          onToggle={(v) => setSel((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]))} />
        <Chips label="已改動未送出" options={津貼} selected={["duty"]} onToggle={() => {}} changed />
        <Chips label="鎖定" options={津貼} selected={["meal"]} onToggle={() => {}} disabled lockHint="本月已確認" />
        <Chips label="無選項（emptyHint）" options={[]} selected={[]} onToggle={() => {}} emptyHint="尚未設定任何津貼項目" />
      </div>
    );
  },
};
