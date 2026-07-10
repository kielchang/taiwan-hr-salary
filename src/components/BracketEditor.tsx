import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Input } from "@/components/ui/input";
import { TabPills } from "@/components/ui/tab-pills";
import { NumberInput } from "@/components/NumberInput";
import { BracketTableCards, BRACKET_META } from "@/components/BracketTableCards";
import { Pencil, Plus, Trash2, Upload, Download, X, Check } from "lucide-react";
import { usePayrollStore, isSettingsInPlaceLocked, maxConfirmedPeriod } from "@/store/usePayrollStore";
import { validateSettings } from "@/lib/validation";
import { parseBracketCsv, serializeBracketCsv } from "@/lib/bracketCsv";
import { saveBlob } from "@/lib/download";
import type { InsuranceBrackets } from "@/config/brackets";

type BKey = keyof InsuranceBrackets;

function nextMonthOf(period: string): string {
  const [y, m] = period.split("-").map(Number);
  const d = new Date(y, m, 1); // m 為 1-based；new Date(y, m, 1) 即下一個月
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * 投保級距受管編輯（B-3，app glue）：逐格編輯＋CSV 整表匯入，走生效月版本化。
 * 編輯語意完全比照法定參數卡：最新版本未被已確認月引用＝就地改（setBrackets）；
 * 已被引用＝擋就地、導向「新增生效版本」（addBracketVersion，生效月須 > 最後已確認月）。
 * 存檔前即時跑 V13（分級遞增/非空/正值），不通過擋存。稽核由 store action 內建（parameter 類）。
 */
export function BracketEditor() {
  const { brackets, parameters, bracketVersions, confirmations, setBrackets, addBracketVersion } = usePayrollStore();
  const versionLocked = isSettingsInPlaceLocked(confirmations, bracketVersions);
  const maxC = maxConfirmedPeriod(confirmations);
  const nextEff = maxC ? nextMonthOf(maxC) : (Object.keys(confirmations).sort().pop() ?? "2026-01");

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<InsuranceBrackets>(brackets);
  const [tab, setTab] = useState<BKey>("labor");
  const [newVerMonth, setNewVerMonth] = useState(nextEff);
  const [importMsg, setImportMsg] = useState<{ tone: "danger" | "success"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // 即時 V13：只挑級距相關錯誤
  const v13 = useMemo(() => validateSettings(parameters, draft).filter((i) => i.rule === "V13"), [parameters, draft]);
  const monthTooEarly = versionLocked && !!maxC && newVerMonth <= maxC;

  const start = () => { setDraft(brackets); setTab("labor"); setNewVerMonth(nextEff); setImportMsg(null); setEditing(true); };
  const cancel = () => { setEditing(false); setImportMsg(null); };

  const setArr = (key: BKey, arr: number[]) => setDraft((d) => ({ ...d, [key]: arr }));
  const editGrade = (key: BKey, i: number, v: number) => setArr(key, draft[key].map((g, j) => (j === i ? v : g)));
  const removeGrade = (key: BKey, i: number) => setArr(key, draft[key].filter((_, j) => j !== i));
  const addGrade = (key: BKey) => { const arr = draft[key]; setArr(key, [...arr, arr.length ? arr[arr.length - 1] + 100 : 29500]); };
  const sortActive = (key: BKey) => setArr(key, [...new Set(draft[key])].sort((a, b) => a - b));

  const onImport = async (file: File) => {
    const res = parseBracketCsv(await file.text());
    if (!res.ok || !res.brackets) { setImportMsg({ tone: "danger", text: `匯入失敗：${res.error}` }); return; }
    const merged = { ...draft, ...res.brackets };
    setDraft(merged);
    const imported = (Object.keys(res.brackets) as BKey[]).map((k) => BRACKET_META.find((m) => m.key === k)?.name.slice(0, 2) ?? k);
    setImportMsg({ tone: "success", text: `已匯入 ${imported.join("、")} 級距（共 ${Object.values(res.brackets).reduce((a, b) => a + (b?.length ?? 0), 0)} 級），請確認後儲存。` });
  };
  const downloadTemplate = () => saveBlob(new Blob([serializeBracketCsv(draft)], { type: "text/csv;charset=utf-8" }), "投保級距表.csv");

  const save = () => {
    if (v13.length) return;
    // 存檔前一律排序去重，避免逐格編輯留下未排序資料
    const clean: InsuranceBrackets = {
      labor: [...new Set(draft.labor)].sort((a, b) => a - b),
      occupational: [...new Set(draft.occupational)].sort((a, b) => a - b),
      health: [...new Set(draft.health)].sort((a, b) => a - b),
      pension: [...new Set(draft.pension)].sort((a, b) => a - b),
    };
    if (versionLocked) {
      addBracketVersion(newVerMonth, clean);
      alert(`已建立自 ${newVerMonth} 起生效的投保級距新版本；先前已確認月維持原級距。`);
    } else {
      setBrackets(clean);
      alert("已更新投保級距（就地）。");
    }
    setEditing(false);
    setImportMsg(null);
  };

  if (!editing) {
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">系統依「月薪資總額」自動查表投保；下列為目前採用級距（可編輯／年度整表換版）。</p>
          <Button size="sm" variant="outline" onClick={start}><Pencil /> 編輯級距</Button>
        </div>
        <BracketTableCards brackets={brackets} />
      </div>
    );
  }

  const meta = BRACKET_META.find((m) => m.key === tab)!;
  return (
    <div className="space-y-3">
      {versionLocked ? (
        <Callout variant="warning" title="已有已確認月份 → 改用「新增生效版本」">
          直接修改會回溯改寫已確認／已申報月份的投保金額。請選一個「自指定月份起生效」的月份，新級距只影響該月之後；先前月份維持原級距。
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-xs">自</span>
            <Input type="month" className="col-input h-8 w-40" min={nextEff} value={newVerMonth} onChange={(e) => e.target.value && setNewVerMonth(e.target.value)} />
            <span className="text-xs">起生效</span>
          </div>
          <p className="mt-1 text-[11px]">目前生效版本共 {bracketVersions.length} 個；生效月須晚於最後已確認月（{maxC}）。</p>
        </Callout>
      ) : (
        <Callout variant="info" title="就地編輯目前級距">尚無已確認月引用最新級距版本，可直接就地修改（不影響歷史，因目前無已凍結月）。</Callout>
      )}

      {/* CSV 整表匯入／範本 */}
      <div className="flex flex-wrap items-center gap-2 rounded-md border p-2">
        <span className="text-xs font-medium">整表換版：</span>
        <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onImport(f); e.target.value = ""; }} />
        <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}><Upload /> 匯入 CSV</Button>
        <Button size="sm" variant="ghost" onClick={downloadTemplate}><Download /> 下載目前級距 CSV（範本）</Button>
        <span className="text-[11px] text-muted-foreground">格式：每列「保險別,月投保金額」（保險別＝勞保/職保/健保/勞退）。</span>
      </div>
      {importMsg && <p className={importMsg.tone === "danger" ? "text-xs text-danger" : "text-xs text-success"}>{importMsg.text}</p>}

      {/* 逐格編輯：分頁選表 */}
      <TabPills tabs={BRACKET_META.map((m) => ({ key: m.key, label: `${m.name.replace("投保", "").replace("薪資分級表", "").replace("金額分級表", "").replace("月提繳分級表", "")}（${draft[m.key].length}）` }))} value={tab} onChange={(k) => setTab(k as BKey)} />
      <div className="rounded-md border p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{meta.name}：逐級編輯月投保金額（存檔時自動升冪去重）。</p>
          <Button size="sm" variant="ghost" onClick={() => sortActive(tab)}>立即排序</Button>
        </div>
        <div className="grid max-h-72 grid-cols-1 gap-1.5 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
          {draft[tab].map((g, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="w-8 shrink-0 text-right text-xs tabular-nums text-muted-foreground">{i + 1}.</span>
              <NumberInput value={g} onChange={(v) => editGrade(tab, i, v)} className="w-full" min={1} />
              <button type="button" aria-label="刪除此級" className="tap-target rounded p-1 text-muted-foreground hover:text-danger" onClick={() => removeGrade(tab, i)}><Trash2 className="size-3.5" /></button>
            </div>
          ))}
        </div>
        <Button size="sm" variant="outline" className="mt-2" onClick={() => addGrade(tab)}><Plus /> 新增級距</Button>
      </div>

      {v13.length > 0 && (
        <Callout variant="danger" title="級距資料有誤，無法儲存">
          <ul className="list-disc pl-4 text-xs">{v13.map((e, i) => <li key={i}>{e.message}</li>)}</ul>
        </Callout>
      )}

      <div className="flex items-center justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={cancel}><X /> 取消</Button>
        <Button size="sm" disabled={v13.length > 0 || monthTooEarly} onClick={save}>
          <Check /> {versionLocked ? `新增自 ${newVerMonth} 起生效版本` : "儲存級距"}
        </Button>
      </div>
    </div>
  );
}
