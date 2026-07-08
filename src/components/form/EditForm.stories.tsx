import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { EditableField } from "./EditableField";
import { ChangeSummary } from "./ChangeSummary";
import { diffRecord, type FieldKind, type FieldSpec } from "@/lib/forms/diff";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// 互動式「員工編輯表單」示範：把 EditableField（唯讀逐欄編輯）＋ ChangeSummary 串成完整表單，
// 讓你實際操作看效果——點欄位進編輯、改值標色 amber、逐欄 undo/redo（先確認舊→新）、
// 送出前變更摘要（逐欄／全部還原）、儲存後原始值更新。與 MasterDataView 的實際流程一致。
const meta: Meta = { title: "元件/表單/員工編輯表單（互動）", parameters: { layout: "padded" } };
export default meta;
type S = StoryObj;

type Emp = Record<string, string | number | boolean | string[]>;

const opt = (...xs: string[]) => xs.map((x) => ({ value: x, label: x }));

type Field = {
  key: string; label: string; kind: FieldKind;
  options?: { value: string; label: string }[]; unit?: string; help?: string;
  payLock?: boolean;   // 影響薪資計算 → 當期已確認時鎖定
  fixedLock?: boolean; // 恆鎖（如員工編號）
};

const TABS: { key: string; label: string; fields: Field[] }[] = [
  { key: "basic", label: "基本資料", fields: [
    { key: "id", label: "員工編號", kind: "text", fixedLock: true, help: "建立後不可變更" },
    { key: "name", label: "姓名", kind: "text" },
    { key: "department", label: "部門", kind: "text" },
    { key: "title", label: "職稱", kind: "text" },
    { key: "hireDate", label: "到職日", kind: "date", payLock: true, help: "用於年資與特休；破月按比例" },
    { key: "status", label: "任職狀態", kind: "select", options: opt("在職", "離職", "留停", "停職", "暫離"), payLock: true },
    { key: "voluntaryPensionRate", label: "勞退自願提繳率", kind: "rate", payLock: true, help: "0～6%，此金額免稅" },
  ] },
  { key: "salary", label: "固定薪資項目", fields: [
    { key: "baseSalary", label: "本薪", kind: "money", payLock: true },
    { key: "managerAllowance", label: "主管加給", kind: "money", payLock: true },
    { key: "dutyAllowance", label: "職務津貼", kind: "money", payLock: true },
    { key: "mealAllowance", label: "伙食津貼", kind: "money", payLock: true, help: "3,000 內免稅" },
  ] },
  { key: "family", label: "眷屬與扣繳", fields: [
    { key: "taxResidency", label: "稅務身分", kind: "radio", options: opt("居住者", "非居住者"), payLock: true },
    { key: "withholdingMethod", label: "每月扣繳方式", kind: "radio", options: opt("固定5%", "依扣繳稅額表"), payLock: true },
    { key: "healthDependent", label: "依附健保", kind: "checkbox" },
    { key: "taxDependent", label: "報稅扶養", kind: "checkbox" },
    { key: "tags", label: "特殊身份標記", kind: "multiselect", options: opt("身心障礙", "原住民", "外籍", "建教生"), help: "點擊展開；影響部分補助與申報" },
  ] },
];

const SALARY_KEYS = ["baseSalary", "managerAllowance", "dutyAllowance", "mealAllowance"];
const ALL_FIELDS = TABS.flatMap((t) => t.fields);
const SPECS: FieldSpec[] = ALL_FIELDS.map((f) => ({ key: f.key, label: f.label, kind: f.kind }));

const ORIGINAL: Emp = {
  id: "G30", name: "王依潔", department: "行銷部", title: "業務代表",
  hireDate: "2018-06-01", status: "在職", voluntaryPensionRate: 0,
  baseSalary: 45000, managerAllowance: 0, dutyAllowance: 3000, mealAllowance: 2400,
  taxResidency: "居住者", withholdingMethod: "固定5%", healthDependent: true, taxDependent: true, tags: [],
};

function EmployeeForm({ locked = false }: { locked?: boolean }) {
  const [original, setOriginal] = useState<Emp>(ORIGINAL);
  const [draft, setDraft] = useState<Emp>(ORIGINAL);
  const [tab, setTab] = useState("basic");
  const [savedAt, setSavedAt] = useState(0);

  const changes = diffRecord(original, draft, SPECS);
  const set = (k: string, v: Emp[string]) => setDraft((d) => ({ ...d, [k]: v }));
  const revert = (k: string) => set(k, original[k]);
  const revertAll = () => setDraft(original);
  const save = () => { setOriginal(draft); setSavedAt((n) => n + 1); };

  const cur = TABS.find((t) => t.key === tab)!;
  const salaryTotal = SALARY_KEYS.reduce((a, k) => a + Number(draft[k] || 0), 0);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h2 className="text-lg font-bold">{String(draft.name)} 的員工檔案</h2>
        <p className="text-xs text-muted-foreground">
          {locked
            ? "本月已確認結算：影響薪資計算的欄位已鎖定（聯絡資訊等仍可修改）。"
            : "點任一欄位進入編輯；改值後該欄標黃並可 undo/redo，送出前於下方摘要確認。"}
        </p>
      </div>

      {/* 分頁 */}
      <div className="flex flex-wrap gap-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn("rounded-md px-3 py-1.5 text-sm", tab === t.key ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-accent")}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 欄位（響應式：手機單欄、桌機雙欄） */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {cur.fields.map((f) => (
          <EditableField
            key={f.key}
            label={f.label}
            kind={f.kind}
            value={draft[f.key]}
            original={original[f.key]}
            options={f.options}
            help={f.help}
            disabled={f.fixedLock || (locked && f.payLock)}
            lockHint={f.fixedLock ? "員工編號建立後不可變更" : "本月已確認結算、此欄已鎖定（先取消確認才能修改）"}
            onChange={(v) => set(f.key, v)}
            onRevert={() => revert(f.key)}
          />
        ))}
      </div>

      {tab === "salary" && (
        <div className="rounded-md border bg-muted/40 p-3 text-sm">
          月薪資總額：<span className="font-bold tabular-nums">${salaryTotal.toLocaleString("en-US")}</span>
          <span className="ml-2 text-xs text-muted-foreground">（即時併入投保級距與加班基礎）</span>
        </div>
      )}

      {/* 送出前變更摘要 */}
      <div>
        <p className="mb-1 text-xs font-medium text-muted-foreground">送出前確認變更</p>
        <ChangeSummary changes={changes} onRevertField={revert} onRevertAll={revertAll} />
      </div>

      <div className="flex items-center gap-3">
        <Button disabled={changes.length === 0} onClick={save}>儲存變更（{changes.length}）</Button>
        {savedAt > 0 && changes.length === 0 && <span className="text-xs text-emerald-600">✓ 已儲存，原始值已更新</span>}
      </div>
    </div>
  );
}

/** 一般編輯：全欄可編輯，示範唯讀→點擊→改值標色→undo/redo→摘要→儲存的完整流程。 */
export const 員工編輯_互動: S = { render: () => <EmployeeForm /> };

/** 已確認月份：影響薪資的欄位鎖定（可聚焦、有 aria-disabled 與鎖定原因），聯絡欄仍可改。 */
export const 已鎖定_本月已確認: S = { render: () => <EmployeeForm locked /> };
