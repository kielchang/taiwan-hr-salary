import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { HelpHint } from "./HelpHint";
import { NumberInput } from "./NumberInput";
import { PrintHeader } from "./PrintHeader";
import { BracketTables } from "./BracketTables";
import { BracketTableCards } from "./BracketTableCards";
import { DEFAULT_BRACKETS } from "@/config/brackets";

const meta: Meta = { title: "元件/其他", parameters: { layout: "padded" } };
export default meta;
type S = StoryObj;

export const 情境說明_HelpHint: S = {
  render: () => (
    <div className="flex items-center gap-2 text-lg font-bold">
      基本資料 <HelpHint id="master" />
      <span className="ml-4 text-sm font-normal text-muted-foreground">（點 ℹ 展開情境式說明）</span>
    </div>
  ),
};

export const 數字輸入_NumberInput: S = {
  render: () => {
    const Demo = () => {
      const [v, setV] = useState(45000);
      return <div className="w-40"><NumberInput value={v} onChange={setV} /></div>;
    };
    return <Demo />;
  },
};

/** 互動 Playground：右側 Controls 調整初始值/步進/最小值/停用。 */
export const 數字輸入_互動: StoryObj<{ 初始值: number; 步進: number; 最小值: number; 停用: boolean }> = {
  args: { 初始值: 45000, 步進: 1000, 最小值: 0, 停用: false },
  argTypes: {
    初始值: { control: "number" }, 步進: { control: { type: "range", min: 1, max: 5000, step: 1 } },
    最小值: { control: "number" }, 停用: { control: "boolean" },
  },
  render: (a) => {
    const Demo = () => {
      const [v, setV] = useState(a.初始值);
      return <div className="w-44"><NumberInput value={v} onChange={setV} step={a.步進} min={a.最小值} disabled={a.停用} /></div>;
    };
    return <Demo key={`${a.初始值}`} />;
  },
};

export const 列印頁首頁尾_PrintHeader: S = {
  render: () => (
    <div className="rounded border p-4">
      {/* 平時 .print-header 僅列印顯示；此處強制顯示以便檢視版式 */}
      <style>{`.print-header{display:block !important}`}</style>
      <PrintHeader title="薪資明細表" period="2026-06" company="示範公司" />
      <p className="mt-2 text-xs text-muted-foreground">（實際僅於列印時顯示；此為版式預覽）</p>
    </div>
  ),
};

export const 投保級距表_分頁版_BracketTables: S = {
  render: () => (
    <div className="max-w-3xl">
      <BracketTables brackets={DEFAULT_BRACKETS} initial="labor" />
    </div>
  ),
};

export const 投保級距卡_設定用_BracketTableCards: S = {
  render: () => (
    <div className="max-w-3xl">
      <BracketTableCards brackets={DEFAULT_BRACKETS} />
    </div>
  ),
};
