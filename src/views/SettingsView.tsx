import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BracketTableCards } from "@/components/BracketTableCards";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { usePayrollStore } from "@/store/usePayrollStore";
import { useNavigate } from "react-router-dom";
import type { Parameters } from "@/config/parameters";
import { parseIpList } from "@/lib/attendance";
import { ChevronDown, ChevronUp, RotateCcw, Trash2, Wand2, Info, Crosshair, MapPin } from "lucide-react";

interface Field {
  key: keyof Parameters;
  label: string;
  kind: "money" | "rate" | "int" | "date";
  help: string;
}

const COMPANY_FIELDS: Field[] = [
  { key: "occupationalRate", label: "職業災害保險費率", kind: "rate", help: "每家公司不同，依勞保局核定通知書填寫（全產業平均約 0.21%），由公司全額負擔。" },
  { key: "seniorityBaseDate", label: "年資／特休計算基準日", kind: "date", help: "系統以此日期計算每位員工的年資與特休天數，通常設為當月 1 日。" },
];

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

export function SettingsView() {
  const { parameters, brackets, setParameters, resetToSeed, clearAll } = usePayrollStore();
  const navigate = useNavigate();
  const [showBrackets, setShowBrackets] = useState(false);

  const renderField = (f: Field, tone: "company" | "legal") => {
    const raw = parameters[f.key];
    const display = f.kind === "rate" ? String(Math.round((raw as number) * 10000) / 100) : String(raw);
    const onChange = (v: string) => {
      if (f.kind === "date") return setParameters({ [f.key]: v } as Partial<Parameters>);
      const num = v === "" ? 0 : Number(v);
      setParameters({ [f.key]: f.kind === "rate" ? num / 100 : num } as Partial<Parameters>);
    };
    return (
      <div key={f.key} className="space-y-1">
        <Label className="text-xs">{f.label}</Label>
        <div className="flex items-center gap-1.5">
          <Input
            type={f.kind === "date" ? "date" : "number"}
            step={f.kind === "rate" ? "0.01" : undefined}
            className={`h-8 ${tone === "company" ? "col-assumption" : "col-input"}`}
            value={display}
            onChange={(e) => onChange(e.target.value)}
          />
          <span className="w-5 shrink-0 text-xs text-muted-foreground">
            {f.kind === "rate" ? "%" : f.kind === "money" ? "元" : ""}
          </span>
        </div>
        {f.help && <p className="text-[11px] leading-snug text-muted-foreground">{f.help}</p>}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold">系統設定</h1>
          <p className="text-sm text-muted-foreground">
            黃色欄位是「貴公司自己的設定」；白色欄位是政府公告的法定值，已內建 115 年度資料，
            通常每年 1 月依新公告更新一次即可。
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate("/setup")}>
          <Wand2 /> 重新執行初始設定引導
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">公司專屬設定</CardTitle>
          <CardDescription>這兩項依貴公司情況填寫，與法規公告無關。</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {COMPANY_FIELDS.map((f) => renderField(f, "company"))}
          </div>
        </CardContent>
      </Card>

      <div className="rounded-md border border-sky-200 bg-sky-50 p-3 text-xs text-sky-900">
        <Info className="mr-1 inline size-3.5" />
        <span className="font-medium">年度更新提醒：</span>
        每年 1 月政府會公告新年度的最低工資、費率與級距表，屆時只要更新下面的數值即可，計算方式不需要改。
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">法定費率與金額（115 年度）</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {LEGAL_GROUPS.map((g) => (
            <div key={g.title}>
              <div className="mb-2 flex items-center gap-2">
                <p className="text-sm font-semibold">{g.title}</p>
                {g.note && <Badge variant="warning">{g.note}</Badge>}
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {g.fields.map((f) => renderField(f, "legal"))}
              </div>
            </div>
          ))}
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

      <AttendanceSettings />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">資料管理</CardTitle>
          <CardDescription>資料只存在這台電腦的瀏覽器；清除瀏覽器資料會一併刪除，請留意備份需求。</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (confirm("將以 8 名範例員工覆蓋目前所有資料，確定？")) resetToSeed();
            }}
          >
            <RotateCcw /> 還原為範例公司資料
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (confirm("確定清空所有員工與結算資料？（費率設定會保留）")) clearAll();
            }}
          >
            <Trash2 /> 清空員工資料
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

/** 打卡設定（公司座標、半徑、超範圍處理、IP 檢查）— 黃底＝公司自訂 */
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
                className="h-20 w-full rounded-md border border-input bg-orange-50 p-2 text-sm"
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
