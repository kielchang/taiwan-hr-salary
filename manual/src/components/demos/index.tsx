// 活元件示例（元件本尊、非截圖）：直接 import repo 的 UI 元件庫（@ → ../src，
// 鐵律 9 保證元件不依賴 store 故可獨立渲染）。各示例＝小型有狀態 wrapper，讓讀者實際互動。
// 樣式來自 kit.css（tailwind utilities＋tokens 副本）；Demo 容器提供 bg-background token 脈絡。
import React, { useState } from "react";
import { EditableField } from "@/components/form/EditableField";
import { Delta } from "@/components/ui/delta";
import { Stepper } from "@/components/Stepper";
import { TabPills } from "@/components/ui/tab-pills";
import { Callout } from "@/components/ui/callout";
import { NumberInput } from "@/components/NumberInput";

/** 示例容器：token 背景＋邊框＋標題列（「可操作」提示） */
function Demo({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <figure style={{ margin: "1rem 0", border: "1px solid var(--ifm-color-emphasis-300)", borderRadius: 8, overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 12px", background: "var(--ifm-color-emphasis-100)", fontSize: 13 }}>
        <strong>{title}</strong>
        <span style={{ color: "var(--ifm-color-emphasis-600)" }}>元件本尊・可操作</span>
      </div>
      <div className="bg-background text-foreground" style={{ padding: 16 }}>{children}</div>
    </figure>
  );
}

/** 逐欄編輯欄位：點鉛筆→輸入→琥珀「已變更」＋還原（與系統完全相同的元件） */
export function DemoEditableField() {
  const [name, setName] = useState<string>("蔡佩珊");
  const [salary, setSalary] = useState<number>(48000);
  return (
    <Demo title="逐欄編輯（EditableField）">
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <EditableField label="姓名" kind="text" value={name} original="蔡佩珊"
          onChange={(v) => setName(String(v))} onRevert={() => setName("蔡佩珊")} />
        <EditableField label="本薪（月）" kind="money" value={salary} original={48000}
          onChange={(v) => setSalary(Number(v))} onRevert={() => setSalary(48000)} />
      </div>
      <p style={{ margin: "10px 0 0", fontSize: 13, color: "var(--ifm-color-emphasis-600)" }}>
        點欄位（或鉛筆）進入編輯；改動後欄位轉琥珀色＝「已變更未送出」，可按還原鍵回到原值。
      </p>
    </Demo>
  );
}

/** 變異顯示：▲▼＋文字＋色（非只靠顏色） */
export function DemoDelta() {
  return (
    <Demo title="變異顯示（Delta）">
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center" }}>
        <span>總成本 <Delta value={35200} /></span>
        <span>離職率 <Delta value={-2} goodWhen="negative" format={(v) => `${v}%`} /></span>
        <span>人數 <Delta value={0} /></span>
      </div>
    </Demo>
  );
}

/** 步驟列：可點步驟切換 */
export function DemoStepper() {
  const [cur, setCur] = useState("2");
  return (
    <Demo title="步驟列（Stepper）">
      <Stepper
        steps={[{ key: "1", label: "歡迎" }, { key: "2", label: "公司設定" }, { key: "3", label: "薪資結構預設" }, { key: "4", label: "員工資料" }, { key: "5", label: "完成" }]}
        current={cur}
        completed={{ "1": true }}
        onStep={setCur}
      />
    </Demo>
  );
}

/** 分頁列：切分頁 */
export function DemoTabPills() {
  const [tab, setTab] = useState("overview");
  return (
    <Demo title="分頁列（TabPills）">
      <TabPills
        tabs={[{ key: "overview", label: "試算總覽" }, { key: "checks", label: "統計查核" }, { key: "bonus", label: "獎金試算" }]}
        value={tab}
        onChange={setTab}
      />
      <p style={{ margin: "10px 0 0", fontSize: 13, color: "var(--ifm-color-emphasis-600)" }}>目前分頁：{tab}</p>
    </Demo>
  );
}

/** 狀態提示框：四種語意 */
export function DemoCallout() {
  return (
    <Demo title="狀態提示框（Callout）">
      <div style={{ display: "grid", gap: 8 }}>
        <Callout variant="info" title="小技巧">帶入上月異動不會帶入獎金與代扣稅，防止誤重發。</Callout>
        <Callout variant="warning" title="注意">本月已確認：編輯前請先到查核頁取消確認。</Callout>
        <Callout variant="danger" title="不可回復">清空員工資料無法復原，請先匯出備份。</Callout>
        <Callout variant="success" title="完成">本月結算已確認，快照已留存。</Callout>
      </div>
    </Demo>
  );
}

/** 數字輸入（可編輯欄位統一長相） */
export function DemoNumberInput() {
  const [v, setV] = useState(8);
  return (
    <Demo title="數字輸入（NumberInput）">
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span>平日加班</span><NumberInput value={v} onChange={setV} min={0} /><span>小時</span>
      </div>
    </Demo>
  );
}
