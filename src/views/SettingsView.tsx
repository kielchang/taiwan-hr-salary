// 系統設定（/settings）＝法定參數、公司政策、投保級距、資料維運、稽核、關於。設計原理：
//  - 法定費率/門檻（parameters）與投保級距（brackets）可調但受硬鎖定守衛（當期已確認即不可改）。
//  - 公司政策卡：LeavePolicyCard（非在職狀態給薪比例預設）、SalaryDefaultsCard（新進固定薪資
//    /津貼預設，供主檔新增帶入）。投保級距主檔（BracketTables）刻意**唯讀檢視**（年度更新流程待議）。
//  - 資料維運：整檔備份/還原（JSON envelope）、清空；稽核軌跡以 DataTable 呈現；關於卡顯示
//    app 版號/commit/建置時間（對回部署版本）。敏感異動皆入稽核。
import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { SALARY_ITEMS, type SalaryNumKey } from "@/views/MasterDataView";
import { BracketTableCards } from "@/components/BracketTableCards";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { EditableField } from "@/components/form/EditableField";
import { ChangeSummary } from "@/components/form/ChangeSummary";
import { TabPills } from "@/components/ui/tab-pills";
import { Callout } from "@/components/ui/callout";
import { validateSettings } from "@/lib/validation";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { diffRecord, type FieldSpec } from "@/lib/forms/diff";
import type { Project, ProjectStatus, Currency } from "@/lib/types";
import { usePayrollStore, STORE_VERSION, isPeriodLocked, auditRestorable, isSettingsInPlaceLocked, maxConfirmedPeriod } from "@/store/usePayrollStore";
import { useRunBackup } from "@/store/selectors";
import { useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import type { Parameters } from "@/config/parameters";
import { FEATURES } from "@/config/features";
import { parseIpList } from "@/lib/attendance";
import { saveBlob } from "@/lib/payslipPdf";
import { parseBackup, summarizeBackup } from "@/lib/backup";
import { csvSerialize } from "@/lib/csv";
import { cn, ntd } from "@/lib/utils";
import { HelpHint } from "@/components/HelpHint";
import type { AuditAction } from "@/lib/types";
import { ChevronDown, ChevronUp, RotateCcw, Trash2, Wand2, Info, Crosshair, MapPin, CalendarRange, Download, Upload, History, Plus, Pencil, FolderKanban, Sun, Moon, Monitor } from "lucide-react";
import { APP_VERSION, GIT_SHA, IS_RELEASE, COMMIT_URL, buildTimeTaipei } from "@/version";
import { useTheme, type Theme } from "@/lib/theme";

const AUDIT_LABEL: Record<AuditAction, string> = {
  salary: "薪資異動", employee: "員工異動", dependent: "眷屬異動", event: "結算異動", confirm: "月結確認",
  raiseApply: "調薪核定", import: "批次匯入", restore: "整檔還原", project: "專案異動",
  parameter: "參數異動", declare: "申報基準", allocation: "工時分攤", clear: "清空資料",
};

interface Field {
  key: keyof Parameters;
  label: string;
  kind: "money" | "rate" | "int" | "date";
  help: string;
}

const COMPANY_FIELDS: Field[] = [
  { key: "occupationalRate", label: "職業災害保險費率", kind: "rate", help: "每家公司不同，依勞保局核定通知書填寫（全產業平均約 0.21%），由公司全額負擔。" },
  { key: "seniorityBaseDate", label: "年資／特休固定基準日", kind: "date", help: "曆年制的年度基準日（月/日，每年重複）。" },
];

/** 月/日選擇器（每年重複的基準日；值＝"MM-DD"，相容舊的完整日期）。 */
// 固定基準日每月的可選天數：不設年（每年重複的月/日），故 2 月一律上限 28
// （避免選到 2/29 在平年失效／年資基準跳月）；小月 30、大月 31。
function daysInFixedMonth(m: number): number {
  if (m === 2) return 28;
  return [4, 6, 9, 11].includes(m) ? 30 : 31;
}

export function MmddPicker({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const mmdd = value && value.length >= 8 ? value.slice(-5) : value; // 相容 "YYYY-MM-DD"
  const [mm, dd] = /^\d{2}-\d{2}$/.test(mmdd) ? mmdd.split("-") : ["01", "01"];
  const pad = (n: number) => String(n).padStart(2, "0");
  const maxDay = daysInFixedMonth(Number(mm));
  const ddClamped = pad(Math.min(Number(dd) || 1, maxDay)); // 顯示恆為當月合法日，避免舊值超月變空白
  // 切換月份時，若原本的「日」超過該月天數（如 3/31 → 改 2 月），自動夾到當月上限。
  const onMonth = (m: string) => onChange(`${m}-${pad(Math.min(Number(dd) || 1, daysInFixedMonth(Number(m))))}`);
  return (
    <div className="flex items-center gap-2">
      <Select value={mm} disabled={disabled} onValueChange={onMonth}>
        <SelectTrigger className="col-assumption h-9 w-24"><SelectValue /></SelectTrigger>
        <SelectContent>{Array.from({ length: 12 }, (_, i) => pad(i + 1)).map((m) => <SelectItem key={m} value={m}>{Number(m)} 月</SelectItem>)}</SelectContent>
      </Select>
      <Select value={ddClamped} disabled={disabled} onValueChange={(d) => onChange(`${mm}-${d}`)}>
        <SelectTrigger className="col-assumption h-9 w-24"><SelectValue /></SelectTrigger>
        <SelectContent>{Array.from({ length: maxDay }, (_, i) => pad(i + 1)).map((d) => <SelectItem key={d} value={d}>{Number(d)} 日</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}

const LEGAL_GROUPS: { title: string; note?: string; fields: Field[] }[] = [
  {
    title: "最低工資",
    fields: [
      { key: "minWageMonthly", label: "最低工資（月）", kind: "money", help: "月薪總額不可低於此數，系統會自動提醒。" },
      { key: "minWageHourly", label: "最低工資（時）", kind: "money", help: "時薪制人員的下限參考。" },
    ],
  },
  {
    title: "勞保・就保・職保",
    note: "勞就保費率預定民國 116 年起調升為 13%，屆時請在此更新。",
    fields: [
      { key: "laborEmploymentRate", label: "勞保＋就保合計費率", kind: "rate", help: "115 年度為 12.5%。" },
      { key: "laborEmployeeShare", label: "員工自付比例", kind: "rate", help: "員工 20%、公司 70%、政府 10%。" },
      { key: "laborEmployerShare", label: "公司負擔比例", kind: "rate", help: "" },
    ],
  },
  {
    title: "健保與眷屬",
    fields: [
      { key: "healthRate", label: "健保費率", kind: "rate", help: "115 年度為 5.17%。" },
      { key: "healthEmployeeShare", label: "員工自付比例", kind: "rate", help: "員工 30%、公司 60%、政府 10%。" },
      { key: "healthEmployerShare", label: "公司負擔比例", kind: "rate", help: "" },
      { key: "healthAvgDependents", label: "平均眷口數（公司負擔用）", kind: "rate", help: "健保署公告值 0.56，用於計算公司負擔的健保費。" },
      { key: "healthDependentCap", label: "眷屬計費上限（口）", kind: "int", help: "員工自付的眷屬健保費最多算 3 口，超過不再增加。" },
    ],
  },
  {
    title: "勞退與補充保費",
    fields: [
      { key: "pensionEmployerRate", label: "勞退公司提繳率", kind: "rate", help: "法定最低 6%，提到員工退休金專戶。" },
      { key: "supplementaryRate", label: "二代健保補充保費率", kind: "rate", help: "獎金超過門檻的部分，與公司差額部分適用 2.11%。" },
    ],
  },
  {
    title: "工時與伙食",
    fields: [
      { key: "monthlyWorkHours", label: "每月計薪時數", kind: "int", help: "計算加班費與請假扣款的分母，慣例為 240（30 天 × 8 小時）。" },
      { key: "mealAllowanceExemption", label: "伙食津貼免稅額（月）", kind: "money", help: "伙食津貼在此額度內免計入應稅薪資（仍計入投保級距）。" },
    ],
  },
  {
    title: "所得稅扣繳",
    fields: [
      { key: "taxThresholdBase", label: "查表法起扣標準（無扶養）", kind: "money", help: "選「依扣繳稅額表」的員工，月應稅薪資未達此數免扣繳。" },
      { key: "taxThresholdPerDependent", label: "每位扶養親屬提高額", kind: "money", help: "每多一位申報扶養，起扣點約提高此金額（估算值）。" },
      { key: "fixedWithholdingRate", label: "固定扣繳率（5% 法／獎金）", kind: "rate", help: "選「固定 5%」的員工與一次性獎金適用。" },
      { key: "withholdingExemptionCap", label: "免扣繳上限", kind: "money", help: "固定 5% 法算出的稅額不超過 2,000 元時免扣。" },
      { key: "nonResidentThreshold", label: "非居住者級距門檻", kind: "money", help: "在台未滿 183 天者：薪資在門檻內扣 6%，超過扣 18%。" },
      { key: "nonResidentRateLow", label: "非居住者稅率（門檻內）", kind: "rate", help: "" },
      { key: "nonResidentRateHigh", label: "非居住者稅率（超過門檻）", kind: "rate", help: "" },
    ],
  },
];

type SecTab = "legal" | "company" | "currency" | "data";
// 出勤功能隱藏時，公司分頁不含「打卡設定」，標籤簡化為「公司」（FEATURES.attendance）。
const SEC_TABS: [SecTab, string][] = [["legal", "法定參數"], ["company", FEATURES.attendance ? "公司與出勤" : "公司"], ["currency", "幣別與匯率"], ["data", "資料與安全"]];

/** 下一個月（"2026-12" → "2027-01"）；供「新增生效版本」預設生效月＝已確認月之後 */
function nextMonthOf(period: string): string {
  const [y, m] = period.split("-").map(Number);
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function SettingsView() {
  const { parameters, brackets, setParameters, parameterVersions, addParameterVersion, resetToSeed, clearAll, loadDemoData, snapshots, importAll, operatorName, setOperatorName, auditLog, clearAuditLog, restoreAudit, currentPeriod, confirmations } = usePayrollStore();
  // 非版本化卡（leavePolicy/salaryDefaults/幣別）仍用「當期已確認」鎖；法定參數/級距改用版本感知鎖。
  const locked = Boolean(confirmations[currentPeriod]);
  // 版本化守衛：就地改「最新版本」會回溯改寫已確認月 → 鎖住就地編輯，導向「新增生效版本」
  const paramVersionLocked = isSettingsInPlaceLocked(confirmations, parameterVersions);
  const maxC = maxConfirmedPeriod(confirmations);
  const nextEffMonth = maxC ? nextMonthOf(maxC) : currentPeriod;
  const [newVerMonth, setNewVerMonth] = useState(nextEffMonth);
  const fileRef = useRef<HTMLInputElement>(null);

  const exportAudit = () => {
    saveBlob(
      new Blob([csvSerialize(
        ["時間", "操作者", "類別", "對象", "期間", "說明"],
        auditLog.map((a) => [new Date(a.at).toLocaleString(), a.actor, AUDIT_LABEL[a.action], a.targetId ?? "", a.period ?? "", a.summary]),
      )], { type: "text/csv;charset=utf-8" }),
      "操作紀錄.csv",
    );
  };

  // 匯出備份改走共用入口（同時記錄 lastBackupAt，供備份提醒/指示消警）
  const onExport = useRunBackup();

  const onImportFile = async (file: File) => {
    const text = await file.text();
    const res = parseBackup(text, STORE_VERSION);
    if (!res.ok || !res.env) {
      alert(`還原失敗：${res.error}`);
      return;
    }
    const s = summarizeBackup(res.env);
    const ok = confirm(
      `將以備份檔覆蓋目前所有資料，無法復原。\n\n` +
        `備份匯出時間：${new Date(s.exportedAt).toLocaleString()}\n` +
        `員工 ${s.employees} 人、結算紀錄 ${s.events} 筆（${s.periods} 個月份）、趨勢快照 ${s.snapshots} 期\n\n確定還原？`,
    );
    if (ok) {
      importAll(res.env);
      alert("已還原備份資料。");
    }
  };
  const navigate = useNavigate();
  const [showBrackets, setShowBrackets] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set()); // 法定參數群組收合（預設全開）
  // ?tab= 深連結（側邊欄「備份指示」/工作台提醒 → 直接開資料分頁）
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as SecTab | null;
  const [secTab, setSecTab] = useState<SecTab>(
    tabParam && (["legal", "company", "currency", "data"] as const).includes(tabParam) ? tabParam : "legal",
  );

  // 參數改「唯讀逐欄編輯＋送出」：本地草稿，改值標黃、底部黏著列一次套用（取代逐鍵即時寫入，
  // 亦避免每次按鍵都寫一筆稽核）。外部變更（重置/還原）時以 effect 重新同步草稿。
  const [paramDraft, setParamDraft] = useState<Parameters>(parameters);
  useEffect(() => setParamDraft(parameters), [parameters]);
  const efKind = (k: Field["kind"]): FieldSpec["kind"] => (k === "int" ? "number" : k);
  const PARAM_SPECS: FieldSpec[] = [
    ...[...COMPANY_FIELDS, ...LEGAL_GROUPS.flatMap((g) => g.fields)].map((f) => ({ key: f.key as string, label: f.label, kind: efKind(f.kind) })),
    { key: "seniorityBasis", label: "年資計算方式", kind: "select", format: (v) => (v === "hireDate" ? "依到職日" : "固定基準日") },
  ];
  const paramChanges = diffRecord(parameters as unknown as Record<string, unknown>, paramDraft as unknown as Record<string, unknown>, PARAM_SPECS);
  const applyParams = () => {
    const patch: Partial<Parameters> = {};
    for (const c of paramChanges) (patch as Record<string, unknown>)[c.field] = (paramDraft as unknown as Record<string, unknown>)[c.field];
    setParameters(patch);
  };

  const renderField = (f: Field) => (
    <EditableField
      key={f.key}
      label={f.label}
      kind={efKind(f.kind)}
      value={paramDraft[f.key] as string | number}
      original={parameters[f.key] as string | number}
      help={f.help}
      disabled={paramVersionLocked}
      lockHint="已有已確認月份，請用上方「新增生效版本」調整未來費率（不回溯改動已申報月份）"
      onChange={(v) => setParamDraft((d) => ({ ...d, [f.key]: v }))}
      onRevert={() => setParamDraft((d) => ({ ...d, [f.key]: parameters[f.key] }))}
    />
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-bold">系統設定 <HelpHint id="settings" /></h1>
          <p className="text-sm text-muted-foreground">
            有淡底＋外框的欄位都可以點擊修改。「法定參數」分頁是政府公告的法定值（已內建 115 年度資料，
            通常每年 1 月依新公告更新一次即可）；「公司」分頁才是貴公司自己的專屬設定。
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate("/setup")}>
          <Wand2 /> 重新執行初始設定引導
        </Button>
      </div>

      {locked && (
        <div className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
          <Info className="mt-0.5 size-4 shrink-0" />
          <p><span className="font-medium">本月已確認結算，法定參數與級距已鎖定。</span>如需調整，請先至「查核與確認」取消本月確認。</p>
        </div>
      )}

      {(() => {
        const issues = validateSettings(paramDraft, brackets, currentPeriod);
        if (issues.length === 0) return null;
        const errs = issues.filter((i) => i.severity === "error");
        const warns = issues.filter((i) => i.severity === "warning");
        return (
          <div data-tour="settings-validation"><Callout variant={errs.length ? "danger" : "warning"} title={errs.length ? "系統設定有問題，會導致計算錯誤" : "系統設定提醒"}>
            <ul className="ml-4 list-disc space-y-0.5">
              {[...errs, ...warns].map((i, idx) => <li key={idx}>{i.message}</li>)}
            </ul>
          </Callout></div>
        );
      })()}

      <div data-tour="settings-tabs"><TabPills tabs={SEC_TABS.map(([k, label]) => ({ key: k, label, dataTour: `settings-tab-${k}` }))} value={secTab} onChange={(k) => setSecTab(k as SecTab)} /></div>

      {secTab === "company" && (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">公司專屬設定</CardTitle>
          <CardDescription>依貴公司情況填寫，與法規公告無關。年資計算方式：固定基準日＝全體同一日；依到職日＝各員依到職日算實際年資（週年制）。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {renderField(COMPANY_FIELDS[0]) /* 職災費率 */}
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-medium">年資／特休計算方式</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {([["fixedDate", "固定基準日", "全體以同一基準日（月/日）計算年資（曆年制常用，如統一設 1/1）。"], ["hireDate", "依到職日（週年制）", "每位員工依到職日算實際年資（算至當月），特休隨週年逐年增加。"]] as const).map(([val, title, desc]) => (
                <button key={val} type="button" disabled={locked}
                  onClick={() => setParamDraft((d) => ({ ...d, seniorityBasis: val }))}
                  className={cn("rounded-md border-2 p-2.5 text-left text-sm transition-colors disabled:opacity-60",
                    (paramDraft.seniorityBasis ?? "fixedDate") === val ? "border-primary bg-primary/5" : "hover:border-primary/40")}>
                  <p className="font-medium">{title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
                </button>
              ))}
            </div>
            {(paramDraft.seniorityBasis ?? "fixedDate") === "fixedDate" && (
              <div className="pt-1">
                <p className="text-xs font-medium">固定基準日（每年）</p>
                <MmddPicker value={String(paramDraft.seniorityBaseDate)} disabled={locked}
                  onChange={(v) => setParamDraft((d) => ({ ...d, seniorityBaseDate: v }))} />
                <p className="mt-1 text-xs text-muted-foreground">每年重複的月/日（不需設年）；系統取「當期月底前最近一次基準日」計算年資與特休。</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      )}

      {secTab === "company" && <AppearanceCard />}
      {secTab === "company" && <LeavePolicyCard locked={locked} />}
      {secTab === "company" && <SalaryDefaultsCard locked={locked} />}

      {secTab === "legal" && (<>
      <div className="rounded-md border border-info/30 bg-info/10 p-3 text-xs text-info">
        <Info className="mr-1 inline size-3.5" />
        <span className="font-medium">年度更新提醒：</span>
        每年 1 月政府會公告新年度的最低工資、費率與級距表。若尚無已確認月份可直接修改；已有已確認月份時請「新增生效版本」，自指定月份起生效、不回溯改動先前已申報月份。
      </div>

      {paramVersionLocked && (
        <div data-tour="new-version-banner"><Callout variant="warning" title="已有已確認月份 → 法定參數改用「新增生效版本」">
          直接修改會回溯改寫已確認／已申報月份的數字（費率/級距/免稅額等）。請新增一個「自指定月份起生效」的新版本來調整；先前月份維持原費率。
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-xs">自</span>
            <Input type="month" className="col-input h-8 w-40" min={nextEffMonth} value={newVerMonth}
              onChange={(e) => e.target.value && setNewVerMonth(e.target.value)} />
            <span className="text-xs">起生效</span>
            <Button size="sm" disabled={!!maxC && newVerMonth <= maxC}
              onClick={() => { addParameterVersion(newVerMonth, { ...paramDraft }); alert(`已建立自 ${newVerMonth} 起生效的新版本（複製自最新值）。現在可編輯下方費率，只影響 ${newVerMonth} 之後的月份。`); }}>
              <Plus /> 新增生效版本
            </Button>
          </div>
          <p className="mt-1 text-[11px]">目前生效版本共 {parameterVersions.length} 個；新版本生效月須晚於最後已確認月（{maxC}）。</p>
        </Callout></div>
      )}

      <Card data-tour="legal-groups">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">法定費率與金額（115 年度）</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {LEGAL_GROUPS.map((g) => {
            const open = !collapsedGroups.has(g.title);
            return (
              <div key={g.title} className="rounded-md border">
                <button type="button"
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left"
                  onClick={() => setCollapsedGroups((s) => { const n = new Set(s); n.has(g.title) ? n.delete(g.title) : n.add(g.title); return n; })}>
                  <span className="flex items-center gap-2 text-sm font-semibold">{g.title}{g.note && <Badge variant="warning">{g.note}</Badge>}</span>
                  {open ? <ChevronUp className="size-4 shrink-0" /> : <ChevronDown className="size-4 shrink-0" />}
                </button>
                {open && (
                  <div className="grid gap-4 border-t p-3 sm:grid-cols-2 lg:grid-cols-3">
                    {g.fields.map((f) => renderField(f))}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="cursor-pointer pb-3" onClick={() => setShowBrackets((s) => !s)}>
          <CardTitle className="flex items-center justify-between text-base">
            投保級距表（115 年度，唯讀檢視）
            {showBrackets ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </CardTitle>
          <CardDescription>
            系統依「月薪資總額」自動查表決定四種投保金額，您不需要手動選擇級距：薪資落在某級區間即以該級金額投保，
            介於兩級之間取較高一級，超過最高級則以最高級計（觸頂）。詳細說明與官方分級表連結見「法規依據」頁。
          </CardDescription>
        </CardHeader>
        {showBrackets && (
          <CardContent>
            <BracketTableCards brackets={brackets} />
          </CardContent>
        )}
      </Card>
      </>)}

      {secTab === "company" && FEATURES.attendance && <AttendanceSettings />}

      {secTab === "currency" && <div data-tour="currency-center"><CurrencyCenterCard locked={locked} /></div>}

      {secTab === "data" && (<>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">資料備份與還原</CardTitle>
          <CardDescription>
            資料只存在這台電腦的瀏覽器，清除瀏覽器資料即遺失。建議定期「匯出備份檔」另存（薪資資料依法應保存五年）；
            換電腦或誤刪時可用備份檔「還原」。備份檔含全部員工、薪資、結算與設定。
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download /> 匯出備份檔（JSON）
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImportFile(f);
              e.target.value = ""; // 允許重選同檔
            }}
          />
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <Upload /> 從備份檔還原
          </Button>
          <span className="text-xs text-muted-foreground">建議每月結算後匯出存檔。</span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><History className="size-4 text-primary" /> 操作者與變更紀錄</CardTitle>
          <CardDescription>
            填入操作者姓名後，薪資/員工/代扣稅/月結/調薪核定/匯入/還原等敏感變更都會留下稽核軌跡（誰、何時、改什麼）。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label className="text-xs">操作者姓名（稽核用）</Label>
              <Input className="col-input h-8 w-48" value={operatorName} placeholder="例：王小明" onChange={(e) => setOperatorName(e.target.value)} />
            </div>
            <Button variant="outline" size="sm" onClick={exportAudit} disabled={auditLog.length === 0}><Download /> 匯出紀錄 CSV</Button>
            <Button variant="outline" size="sm" onClick={() => { if (confirm("清空操作紀錄？")) clearAuditLog(); }} disabled={auditLog.length === 0}><Trash2 /> 清空紀錄</Button>
          </div>
          <DataTable
            rows={auditLog}
            getRowKey={(a) => a.id}
            initialSort={{ key: "time", dir: "desc" }}
            searchPlaceholder="搜尋操作者／說明…"
            maxHeight="max-h-96"
            empty={{ title: "尚無操作紀錄" }}
            columns={[
              { key: "time", header: "時間", headerClassName: "w-36", sortValue: (a) => a.at, cell: (a) => <span className="text-xs tabular-nums text-muted-foreground">{new Date(a.at).toLocaleString()}</span> },
              { key: "actor", header: "操作者", sortValue: (a) => a.actor, filterText: (a) => a.actor, cell: (a) => <span className="text-sm">{a.actor}</span> },
              { key: "action", header: "類別", sortValue: (a) => AUDIT_LABEL[a.action], filterText: (a) => AUDIT_LABEL[a.action], cell: (a) => <Badge variant="outline">{AUDIT_LABEL[a.action]}</Badge> },
              { key: "summary", header: "說明", sortValue: (a) => a.summary, filterText: (a) => a.summary, cell: (a) => <span className="text-sm">{a.summary}</span> },
              {
                key: "restore", header: "", headerClassName: "w-24",
                cell: (a) => {
                  if (!auditRestorable(a)) return null;
                  // 鎖定守衛：event 看該筆 period，其餘（主檔類）看當期；已確認即不可回復（UI 預攔）。
                  const lockPeriod = a.restoreKind === "event" ? (a.period ?? currentPeriod) : currentPeriod;
                  const rowLocked = isPeriodLocked(confirmations, lockPeriod);
                  return (
                    <Button
                      variant="outline" size="sm" className="tap-target"
                      disabled={rowLocked}
                      title={rowLocked ? "該期已確認鎖定，請先取消確認再回復" : "把此筆變更還原成變更前的值"}
                      onClick={() => { if (confirm(`確定回復此筆變更？\n\n${a.summary}\n\n將還原成變更前的值，並另記一筆稽核。`)) restoreAudit(a.id); }}
                    >
                      <RotateCcw className="size-3.5" /> 回復
                    </Button>
                  );
                },
              },
            ]}
          />
        </CardContent>
      </Card>

      <Card className="border-danger/40" data-tour="settings-danger">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-danger">示範與重置（危險操作）</CardTitle>
          <CardDescription>以下操作會<strong>覆蓋或清除現有資料且無法復原</strong>，與上方「從備份檔還原」不同。若要保留現有資料，請先「匯出備份」。</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (confirm("【會覆蓋現有全部資料】將以示範公司（62 名員工，含多月歷史、確認/稽核、加退保/停復保與各種狀態）取代目前所有資料。此操作無法復原，確定？")) resetToSeed();
            }}
          >
            <RotateCcw /> 載入示範公司（覆蓋現有資料）
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (confirm("將回填過去 5 個月的示範結算資料並產生 6 個月趨勢快照（當月資料保留）。可在「薪酬分析 → 趨勢與預算」查看。確定？")) {
                loadDemoData(6);
                alert("已載入多月示範資料。請到「薪酬分析 → 趨勢與預算」查看走勢，或在「每月薪資作業」切換月份。");
              }
            }}
          >
            <CalendarRange /> 載入多月示範資料{snapshots.length > 0 ? `（已有 ${snapshots.length} 期快照）` : ""}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (confirm("【無法復原】確定清空所有員工與結算資料？（費率設定會保留）")) clearAll();
            }}
          >
            <Trash2 /> 清空員工資料
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><Info className="size-4 text-primary" /> 關於 / 版本</CardTitle>
          <CardDescription>目前這台瀏覽器載入的系統版本；核對「線上是哪一版」或回報問題時，附上這些資訊最準。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <div>系統版本：<span className="font-medium tabular-nums">v{APP_VERSION}</span></div>
          <div>
            版本識別（commit）：{IS_RELEASE
              ? <a className="font-medium text-primary underline underline-offset-2" href={COMMIT_URL} target="_blank" rel="noreferrer">{GIT_SHA}</a>
              : <span className="text-muted-foreground">開發模式（dev，未部署）</span>}
          </div>
          <div>建置時間：<span className="tabular-nums">{buildTimeTaipei() ? `${buildTimeTaipei()}（台北）` : "—"}</span></div>
          <div>參數年度：民國 115 年（2026）</div>
          <div className="pt-1 text-xs text-muted-foreground">
            線上站：<a className="underline underline-offset-2" href="https://kielchang.github.io/taiwan-hr-salary/" target="_blank" rel="noreferrer">kielchang.github.io/taiwan-hr-salary</a>
          </div>
        </CardContent>
      </Card>
      </>)}

      {/* 參數變更黏著送出列：跨分頁（法定/公司）彙整未套用的參數變更，一次套用或全部還原。 */}
      {!paramVersionLocked && paramChanges.length > 0 && (
        <div className="sticky bottom-0 z-30 -mx-4 border-t bg-background/95 px-4 py-2.5 backdrop-blur print:hidden">
          <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-2">
            <span className="text-sm text-warning">
              <b className="tabular-nums">{paramChanges.length}</b> 項參數已修改、尚未套用
              <span className="ml-2 text-xs text-muted-foreground">（{paramChanges.slice(0, 3).map((c) => c.label).join("、")}{paramChanges.length > 3 ? "…" : ""}）</span>
            </span>
            <span className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setParamDraft(parameters)}>全部還原</Button>
              <Button size="sm" onClick={applyParams}>套用變更（{paramChanges.length}）</Button>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/** 打卡設定（公司座標、半徑、超範圍處理、IP 檢查）— 黃底＝公司自訂 */
/** 專案主檔 CRUD（供工時分攤與專案成本報表） */
export function ProjectMasterCard() {
  const { projects, upsertProject, removeProject } = usePayrollStore();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Project | null>(null);
  const blank = (): Project => ({ id: `PJ${Date.now()}`, code: "", name: "", manager: "", client: "", budget: 0, startDate: "", endDate: "", status: "進行中" });
  const set = <K extends keyof Project>(k: K, v: Project[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d));

  // 唯讀逐欄編輯：原始值＝store 內既有專案（新增模式＝無 original）
  const original = draft ? projects.find((p) => p.id === draft.id) : undefined;
  const isNew = !!draft && !original;
  const PJ_SPECS: FieldSpec[] = [
    { key: "code", label: "專案代號", kind: "text" }, { key: "name", label: "名稱", kind: "text" },
    { key: "manager", label: "PM", kind: "text" }, { key: "client", label: "客戶", kind: "text" },
    { key: "budget", label: "預算", kind: "money" }, { key: "status", label: "狀態", kind: "text" },
    { key: "startDate", label: "起始日", kind: "date" }, { key: "endDate", label: "結束日", kind: "date" },
    { key: "percentComplete", label: "完成度", kind: "rate" },
  ];
  const changes = draft && original ? diffRecord(original as unknown as Record<string, unknown>, draft as unknown as Record<string, unknown>, PJ_SPECS) : [];
  const revert = (k: string) => { if (original) set(k as keyof Project, original[k as keyof Project]); };
  const pjField = (key: keyof Project, kind: FieldSpec["kind"], label: string, extra?: { options?: { value: string; label: string }[]; help?: string; placeholder?: string }) => (
    <EditableField
      label={label} kind={kind}
      value={draft ? (draft[key] as string | number | undefined) ?? "" : ""}
      original={original ? (original[key] as string | number | undefined) ?? "" : ""}
      options={extra?.options} help={extra?.help} placeholder={extra?.placeholder}
      alwaysEdit={isNew} trackChanges={!isNew}
      onChange={(v) => set(key, v as Project[typeof key])}
      onRevert={() => revert(key as string)}
    />
  );

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base"><FolderKanban className="size-4 text-primary" /> 專案主檔</CardTitle>
          <CardDescription>建立專案（含預算/起訖）後，可於每月薪資作業設定工時分攤，並於報表/分析看專案人事成本與預算 vs 實際。</CardDescription>
        </div>
        <Button size="sm" onClick={() => { setDraft(blank()); setOpen(true); }}><Plus /> 新增專案</Button>
      </CardHeader>
      <CardContent>
        <DataTable
          rows={projects}
          getRowKey={(p) => p.id}
          searchPlaceholder="搜尋代號／名稱／PM…"
          empty={{ title: "尚未建立專案" }}
          columns={[
            { key: "code", header: "代號", freeze: true, sortValue: (p) => p.code, filterText: (p) => `${p.code} ${p.name} ${p.manager}`, cell: (p) => <span className="font-medium">{p.code}</span> },
            { key: "name", header: "名稱", sortValue: (p) => p.name, cell: (p) => p.name },
            { key: "pm", header: "PM", sortValue: (p) => p.manager, cell: (p) => <span className="text-sm">{p.manager}</span> },
            { key: "budget", header: "預算", numeric: true, sortValue: (p) => p.budget, cell: (p) => (p.budget ? ntd(p.budget) : "—") },
            { key: "period", header: "期間", sortValue: (p) => p.startDate, cell: (p) => <span className="text-xs text-muted-foreground">{p.startDate || "—"}～{p.endDate || "—"}</span> },
            { key: "status", header: "狀態", sortValue: (p) => p.status, filterText: (p) => p.status, cell: (p) => <Badge variant={p.status === "進行中" ? "success" : "secondary"}>{p.status}</Badge> },
            { key: "ops", header: "", headerClassName: "w-16", cell: (p) => (
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="size-7" onClick={() => { setDraft({ ...p }); setOpen(true); }}><Pencil className="size-3.5" /></Button>
                <Button variant="ghost" size="icon" className="size-7 text-destructive" onClick={() => { if (confirm(`刪除專案 ${p.name}？（既有分攤中對此專案的設定會一併移除）`)) removeProject(p.id); }}><Trash2 className="size-3.5" /></Button>
              </div>
            ) },
          ]}
        />
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{isNew ? "新增專案" : `編輯專案${draft ? `：${draft.name}` : ""}`}</DialogTitle></DialogHeader>
          {draft && (
            <div className="space-y-4">
              {!isNew && <p className="text-xs text-muted-foreground">點欄位進入編輯；改值後於下方確認變更再儲存。</p>}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {pjField("code", "text", "專案代號 *", { placeholder: "PJ-2026A" })}
                {pjField("name", "text", "名稱 *")}
                {pjField("manager", "text", "PM")}
                {pjField("client", "text", "客戶")}
                {pjField("budget", "money", "預算（整案，雇主總成本）")}
                {pjField("status", "select", "狀態", { options: (["進行中", "結案", "暫停"] as ProjectStatus[]).map((s) => ({ value: s, label: s })) })}
                {pjField("startDate", "date", "起始日")}
                {pjField("endDate", "date", "結束日")}
                {pjField("percentComplete", "rate", "完成度（EVM 用，選填）", { help: "未填＝僅燃燒率推估", placeholder: "0" })}
              </div>
              {!isNew && (
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">送出前確認變更</p>
                  <ChangeSummary changes={changes} onRevertField={revert} onRevertAll={() => original && setDraft({ ...original })} />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>取消</Button>
            <Button disabled={!draft?.code.trim() || !draft?.name.trim() || (!isNew && changes.length === 0)} onClick={() => { if (draft) upsertProject(draft); setOpen(false); }}>儲存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/** 外觀（深色模式）：淺色／深色／跟隨系統三選一。偏好存於這台裝置（獨立於資料，清空資料後仍保留）。 */
function AppearanceCard() {
  const [theme, setTheme] = useTheme();
  const OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: "light", label: "淺色", icon: Sun },
    { value: "dark", label: "深色", icon: Moon },
    { value: "system", label: "跟隨系統", icon: Monitor },
  ];
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">外觀</CardTitle>
        <CardDescription>深色模式偏好。此設定屬「這台裝置的瀏覽器」，不隨資料備份、清空資料後仍保留。</CardDescription>
      </CardHeader>
      <CardContent>
        <div role="radiogroup" aria-label="深色模式" className="inline-flex flex-wrap gap-1.5">
          {OPTIONS.map(({ value, label, icon: Icon }) => {
            const active = theme === value;
            return (
              <Button
                key={value}
                type="button"
                role="radio"
                aria-checked={active}
                variant={active ? "default" : "outline"}
                size="sm"
                className="tap-target gap-1.5"
                onClick={() => setTheme(value)}
              >
                <Icon className="size-4" />
                {label}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/** 非在職狀態給薪政策（留停/停職/暫離 各狀態預設給薪比例；員工可逐案覆寫） */
function LeavePolicyCard({ locked }: { locked: boolean }) {
  const { leavePolicy, setLeavePolicy } = usePayrollStore();
  const STATUSES: ("留停" | "停職" | "暫離")[] = ["留停", "停職", "暫離"];
  // 唯讀逐欄編輯＋送出：本地草稿、改值標黃、套用才寫入（外部變更以 effect 同步）
  const [draft, setDraft] = useState(leavePolicy);
  useEffect(() => setDraft(leavePolicy), [leavePolicy]);
  const SPECS: FieldSpec[] = STATUSES.map((s) => ({ key: s, label: `${s}給薪比例`, kind: "rate" }));
  const changes = diffRecord(leavePolicy as unknown as Record<string, unknown>, draft as unknown as Record<string, unknown>, SPECS);
  const apply = () => { const patch: Record<string, number> = {}; changes.forEach((c) => (patch[c.field] = draft[c.field as keyof typeof draft])); setLeavePolicy(patch); };
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">非在職狀態給薪比例</CardTitle>
        <CardDescription>留停／停職／暫離期間的公司預設給薪比例（0＝無給、50＝半薪、100＝全薪）；員工檔案可逐案覆寫。點欄位編輯，改完按套用。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-4 sm:grid-cols-3">
          {STATUSES.map((s) => (
            <EditableField key={s} label={`${s}給薪比例`} kind="rate"
              value={draft[s]} original={leavePolicy[s]} disabled={locked}
              lockHint="本月已確認結算、已鎖定（先取消確認才能修改）"
              onChange={(v) => setDraft((d) => ({ ...d, [s]: v as number }))}
              onRevert={() => setDraft((d) => ({ ...d, [s]: leavePolicy[s] }))} />
          ))}
        </div>
        {!locked && changes.length > 0 && (
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setDraft(leavePolicy)}>還原</Button>
            <Button size="sm" onClick={apply}>套用變更（{changes.length}）</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** 新進員工預設固定薪資/津貼範本（openNew 帶入） */
function SalaryDefaultsCard({ locked }: { locked: boolean }) {
  const { salaryDefaults, setSalaryDefaults } = usePayrollStore();
  // 唯讀逐欄編輯＋送出：整卡（標準項＋自訂津貼）用本地草稿，套用才寫入。
  const [draft, setDraft] = useState(salaryDefaults);
  useEffect(() => setDraft(salaryDefaults), [salaryDefaults]);
  const std = draft.standard;
  const custom = draft.custom;
  const setStd = (k: SalaryNumKey, v: number | undefined) => setDraft((d) => ({ ...d, standard: { ...d.standard, [k]: v } }));
  const setCustom = (c: { name: string; amount: number }[]) => setDraft((d) => ({ ...d, custom: c }));
  const STD_SPECS: FieldSpec[] = SALARY_ITEMS.map((it) => ({ key: it.key, label: it.label, kind: "money" }));
  const stdChanges = diffRecord(salaryDefaults.standard as unknown as Record<string, unknown>, std as unknown as Record<string, unknown>, STD_SPECS);
  const dirty = stdChanges.length > 0 || JSON.stringify(custom) !== JSON.stringify(salaryDefaults.custom);
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">新進員工預設固定薪資／津貼</CardTitle>
        <CardDescription>設定後，於「基本資料 → 新增員工」時自動帶入（可再逐人調整）；留空＝0。點欄位編輯，改完按套用。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          {SALARY_ITEMS.map((it) => (
            <EditableField key={it.key} label={it.label} kind="money"
              value={std[it.key] ?? ""} original={salaryDefaults.standard[it.key] ?? ""} disabled={locked}
              lockHint="本月已確認結算、已鎖定"
              onChange={(v) => setStd(it.key, v === "" || v == null ? undefined : Number(v))}
              onRevert={() => setStd(it.key, salaryDefaults.standard[it.key])} />
          ))}
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium">自訂津貼範本</p>
            <Button variant="outline" size="sm" disabled={locked} onClick={() => setCustom([...custom, { name: "", amount: 0 }])}><Plus /> 新增</Button>
          </div>
          {custom.length === 0 ? (
            <p className="text-xs text-muted-foreground">無。可新增公司通用之自訂津貼（如語言/值班津貼），新進自動帶入。</p>
          ) : (
            <div className="space-y-2">
              {custom.map((c, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2 rounded-md border p-2">
                  <Input placeholder="津貼名稱" className="h-8 w-40 col-assumption" disabled={locked} value={c.name}
                    onChange={(e) => setCustom(custom.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                  <Input type="number" placeholder="金額" className="h-8 w-28 col-assumption text-right tabular-nums" disabled={locked} value={c.amount || ""}
                    onChange={(e) => setCustom(custom.map((x, j) => (j === i ? { ...x, amount: Number(e.target.value) || 0 } : x)))} />
                  <Button variant="ghost" size="icon" className="ml-auto size-7 text-destructive" disabled={locked}
                    onClick={() => setCustom(custom.filter((_, j) => j !== i))}><Trash2 className="size-3.5" /></Button>
                </div>
              ))}
            </div>
          )}
        </div>
        {!locked && dirty && (
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setDraft(salaryDefaults)}>還原</Button>
            <Button size="sm" onClick={() => setSalaryDefaults(draft)}>套用變更</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── 幣別與匯率維護中心（多幣別薪資） ──────────────────────────────
function CurrencyCenterCard({ locked }: { locked: boolean }) {
  const { currencies, fxRates, fxPolicy, currentPeriod, upsertCurrency, setCurrencyEnabled, setFxRate, setFxPolicy } = usePayrollStore();
  const [ratePeriod, setRatePeriod] = useState(currentPeriod);
  const [draftC, setDraftC] = useState({ code: "", name: "", symbol: "", decimals: 2 });
  const addCurrency = () => {
    const code = draftC.code.trim().toUpperCase();
    if (!code) return;
    upsertCurrency({ code, name: draftC.name.trim() || code, symbol: draftC.symbol.trim() || code, decimals: Number(draftC.decimals) || 0, enabled: true });
    setDraftC({ code: "", name: "", symbol: "", decimals: 2 });
  };
  const cCols: Column<Currency>[] = [
    { key: "code", header: "代碼", freeze: true, sortValue: (c) => c.code, cell: (c) => <span className="font-medium tabular-nums">{c.code}</span> },
    { key: "name", header: "名稱", sortValue: (c) => c.name, cell: (c) => c.name },
    { key: "symbol", header: "符號", cell: (c) => c.symbol },
    { key: "decimals", header: "小數位", numeric: true, cell: (c) => c.decimals },
    { key: "enabled", header: "狀態", cell: (c) => <Badge variant={c.enabled ? "success" : "secondary"}>{c.enabled ? "啟用" : "停用"}</Badge> },
    { key: "ops", header: "", headerClassName: "w-20", cell: (c) => (
      <Button variant="outline" size="sm" className="h-7" disabled={locked} onClick={() => setCurrencyEnabled(c.code, !c.enabled)}>
        {c.enabled ? "停用" : "啟用"}
      </Button>
    ) },
  ];
  const active = currencies.filter((c) => c.enabled);
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">幣別與匯率維護中心</CardTitle>
        <CardDescription>
          公司可自訂要用的額外薪資幣別並維護各期匯率。外幣薪資與台幣<strong>分開計算、視作獎金</strong>，
          <strong>預設不納入勞健保與投保級距</strong>；是否計所得稅／二代健保補充保費由下方政策決定。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* 政策 */}
        <div className="space-y-2">
          <p className="text-sm font-medium">政策</p>
          <div className="grid gap-2 sm:grid-cols-3">
            <div data-tour="fx-enable-toggle"><PolicyToggle label="啟用多幣別" hint="關閉時全站不顯示外幣欄位、計算完全不含外幣。" checked={fxPolicy.enabled} disabled={locked} onChange={(v) => setFxPolicy({ enabled: v })} /></div>
            <PolicyToggle label="外幣計所得稅" hint="開啟＝外幣台幣約當併入獎金代扣所得稅建議與扣繳憑單。" checked={fxPolicy.incomeTax} disabled={locked || !fxPolicy.enabled} onChange={(v) => setFxPolicy({ incomeTax: v })} />
            <PolicyToggle label="外幣計二代健保補充保費" hint="開啟＝外幣台幣約當併入二代健保補充保費基數。" checked={fxPolicy.supplementary} disabled={locked || !fxPolicy.enabled} onChange={(v) => setFxPolicy({ supplementary: v })} />
          </div>
        </div>

        {/* 幣別清單 */}
        <div className="space-y-2">
          <p className="text-sm font-medium">薪資幣別</p>
          <div className="flex flex-wrap items-end gap-2 rounded-md border p-3">
            <div><label className="text-xs font-medium">代碼</label><Input className="col-input h-8 w-24" placeholder="USD" disabled={locked} value={draftC.code} onChange={(e) => setDraftC({ ...draftC, code: e.target.value })} /></div>
            <div><label className="text-xs font-medium">名稱</label><Input className="col-input h-8 w-28" placeholder="美金" disabled={locked} value={draftC.name} onChange={(e) => setDraftC({ ...draftC, name: e.target.value })} /></div>
            <div><label className="text-xs font-medium">符號</label><Input className="col-input h-8 w-24" placeholder="US$" disabled={locked} value={draftC.symbol} onChange={(e) => setDraftC({ ...draftC, symbol: e.target.value })} /></div>
            <div><label className="text-xs font-medium">小數位</label><Input type="number" className="col-input h-8 w-20 text-right" disabled={locked} value={draftC.decimals} onChange={(e) => setDraftC({ ...draftC, decimals: Number(e.target.value) })} /></div>
            <Button size="sm" className="h-8" disabled={locked || !draftC.code.trim()} onClick={addCurrency}><Plus /> 新增幣別</Button>
          </div>
          {currencies.length > 0 && (
            <DataTable rows={currencies} columns={cCols} getRowKey={(c) => c.code} initialSort={{ key: "code", dir: "asc" }} pageSize={5} />
          )}
        </div>

        {/* 匯率表 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">匯率（對台幣）</p>
            <Input type="month" className="col-input h-8 w-36" value={ratePeriod} onChange={(e) => e.target.value && setRatePeriod(e.target.value)} />
          </div>
          {active.length === 0 ? (
            <p className="text-xs text-muted-foreground">尚無啟用幣別。先於上方新增幣別後，即可逐期維護匯率。</p>
          ) : (
            <div className="space-y-2">
              {active.map((c) => {
                const rate = fxRates[c.code]?.[ratePeriod];
                return (
                  <div key={c.code} className="flex flex-wrap items-center gap-2 rounded-md border p-2 text-sm">
                    <span className="w-16 font-medium tabular-nums">{c.code}</span>
                    <span className="text-muted-foreground">1 {c.symbol || c.code} =</span>
                    <Input type="number" step="0.001" className="col-input h-8 w-32 text-right tabular-nums" disabled={locked}
                      placeholder="未設" value={rate ?? ""} onChange={(e) => setFxRate(c.code, ratePeriod, Number(e.target.value) || 0)} />
                    <span className="text-muted-foreground">元</span>
                    {(rate == null || rate <= 0) && <Badge variant="warning">未設匯率</Badge>}
                  </div>
                );
              })}
              <p className="text-[11px] text-muted-foreground">匯率僅用於顯示台幣約當與（政策開啟時）法定代扣基數；未設匯率＝該幣別當期台幣約當以 0 計。</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PolicyToggle({ label, hint, checked, disabled, onChange }: { label: string; hint: string; checked: boolean; disabled?: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" disabled={disabled} onClick={() => onChange(!checked)}
      className={cn("rounded-md border-2 p-2.5 text-left text-sm transition-colors disabled:opacity-50",
        checked ? "border-primary bg-primary/5" : "hover:border-primary/40")}>
      <div className="flex items-center justify-between">
        <span className="font-medium">{label}</span>
        <Badge variant={checked ? "success" : "secondary"}>{checked ? "開" : "關"}</Badge>
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
    </button>
  );
}

function AttendanceSettings() {
  const { attendance, setAttendance } = usePayrollStore();
  const [geoMsg, setGeoMsg] = useState<string | null>(null);
  const [ipText, setIpText] = useState(attendance.allowedIps.join("\n"));

  const setFromGps = () => {
    setGeoMsg("定位中…");
    if (!navigator.geolocation) {
      setGeoMsg("此裝置不支援定位");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setAttendance({ companyLat: pos.coords.latitude, companyLng: pos.coords.longitude });
        setGeoMsg(`已設定公司座標：${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`);
      },
      (e) => setGeoMsg(`定位失敗：${e.message}`),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MapPin className="size-4 text-primary" /> 打卡設定
        </CardTitle>
        <CardDescription>
          供「出勤打卡」頁使用。前端 GPS／IP 僅供輔助與稽核、可被竄改，非強制防弊。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1">
            <Label className="text-xs">公司緯度</Label>
            <Input
              type="number" className="h-8 col-assumption"
              value={attendance.companyLat ?? ""}
              onChange={(e) => setAttendance({ companyLat: e.target.value === "" ? null : Number(e.target.value) })}
              placeholder="未設定"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">公司經度</Label>
            <Input
              type="number" className="h-8 col-assumption"
              value={attendance.companyLng ?? ""}
              onChange={(e) => setAttendance({ companyLng: e.target.value === "" ? null : Number(e.target.value) })}
              placeholder="未設定"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">允許半徑（公尺）</Label>
            <Input
              type="number" className="h-8 col-assumption"
              value={attendance.radiusMeters}
              onChange={(e) => setAttendance({ radiusMeters: Number(e.target.value) || 0 })}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" onClick={setFromGps}>
            <Crosshair /> 用目前定位設為公司座標
          </Button>
          {geoMsg && <span className="text-xs text-muted-foreground">{geoMsg}</span>}
        </div>

        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={attendance.blockOutOfFence}
            onCheckedChange={(v) => setAttendance({ blockOutOfFence: v === true })}
          />
          超出公司範圍時<strong>禁止打卡</strong>（取消則仍記錄但標示「範圍外」）
        </label>

        <div className="space-y-2 rounded-md border p-3">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={attendance.ipCheckEnabled}
              onCheckedChange={(v) => setAttendance({ ipCheckEnabled: v === true })}
            />
            啟用 <strong>IP 檢查</strong>（打卡時呼叫外部服務查公網 IP 並比對下方允許清單）
          </label>
          {attendance.ipCheckEnabled && (
            <div className="space-y-1">
              <Label className="text-xs">公司對外 IP 允許清單（一行一個，或逗號分隔）</Label>
              <textarea
                className="col-input h-20 w-full rounded-md border border-input p-2 text-sm"
                value={ipText}
                onChange={(e) => setIpText(e.target.value)}
                onBlur={() => setAttendance({ allowedIps: parseIpList(ipText) })}
                placeholder="203.0.113.10&#10;203.0.113.11"
              />
              <p className="text-[11px] text-muted-foreground">
                清單留空＝不限制 IP。注意：VPN 可繞過、外部查 IP 服務為第三方，僅供輔助。
              </p>
            </div>
          )}
        </div>

        <div className="space-y-3 rounded-md border p-3">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={attendance.flexEnabled}
              onCheckedChange={(v) => setAttendance({ flexEnabled: v === true })}
            />
            啟用 <strong>彈性上下班</strong>判定（每日彙整顯示遲到／工時不足／核心時段）
          </label>
          {attendance.flexEnabled && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-xs">彈性上班最早</Label>
                <Input type="time" className="h-8 col-assumption" value={attendance.flexEarliestIn}
                  onChange={(e) => setAttendance({ flexEarliestIn: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">最晚上班（晚於＝遲到）</Label>
                <Input type="time" className="h-8 col-assumption" value={attendance.flexLatestIn}
                  onChange={(e) => setAttendance({ flexLatestIn: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">應工作時數（小時）</Label>
                <Input type="number" step="0.5" className="h-8 col-assumption"
                  value={attendance.requiredWorkMinutes / 60}
                  onChange={(e) => setAttendance({ requiredWorkMinutes: Math.round((Number(e.target.value) || 0) * 60) })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">午休（分鐘，不計工時）</Label>
                <Input type="number" className="h-8 col-assumption" value={attendance.breakMinutes}
                  onChange={(e) => setAttendance({ breakMinutes: Number(e.target.value) || 0 })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">核心時段起（空＝不檢查）</Label>
                <Input type="time" className="h-8 col-assumption" value={attendance.coreStart}
                  onChange={(e) => setAttendance({ coreStart: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">核心時段迄</Label>
                <Input type="time" className="h-8 col-assumption" value={attendance.coreEnd}
                  onChange={(e) => setAttendance({ coreEnd: e.target.value })} />
              </div>
            </div>
          )}
          <p className="text-[11px] text-muted-foreground">
            下班建議時間＝實際上班 ＋ 應工時 ＋ 午休。工時＝在場時間 − 午休（簡化計算）。
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
