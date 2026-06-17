import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { usePayrollStore } from "@/store/usePayrollStore";
import type { PunchRecord, PunchType } from "@/lib/types";
import {
  evaluateFence, isIpAllowed, punchesToCsv, punchTypeLabel,
  evaluateAllForDate, formatMinutes, localDateKey, type DayAttendance,
} from "@/lib/attendance";
import { csvSerialize } from "@/lib/csv";
import { HelpHint } from "@/components/HelpHint";
import { parseAttendanceCsv, PUNCH_TEMPLATE, HOURS_TEMPLATE, type AttImportPreview } from "@/lib/import/attendanceCsv";
import {
  LogIn, LogOut, MapPin, Download, Upload, FileDown, AlertTriangle, CheckCircle2, ShieldAlert, Settings, Trash2, CalendarCheck,
} from "lucide-react";

/** 取得目前定位（瀏覽器 Geolocation；可能因權限或裝置失敗） */
function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("此裝置／瀏覽器不支援定位"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });
  });
}

/** 查公網 IP（需外部服務；僅在啟用 IP 檢查時呼叫） */
async function fetchPublicIp(): Promise<string> {
  const res = await fetch("https://api.ipify.org?format=json");
  if (!res.ok) throw new Error("查 IP 服務無回應");
  const json = (await res.json()) as { ip: string };
  return json.ip;
}

function saveCsv(text: string, fileName: string) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

interface PunchResult {
  ok: boolean;
  text: string;
}

export function AttendanceView() {
  const { employees, attendance, punches, addPunch, importPunches, removePunch, clearPunches } = usePayrollStore();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(employees[0]?.id ?? "");
  const [busy, setBusy] = useState<PunchType | null>(null);
  const [result, setResult] = useState<PunchResult | null>(null);
  const todayKey = localDateKey(new Date().toISOString());
  const [summaryDate, setSummaryDate] = useState(todayKey);
  const importRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<AttImportPreview | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const downloadTemplate = (kind: "punch" | "hours") => {
    const sample = kind === "punch"
      ? { cols: [...PUNCH_TEMPLATE], row: ["E001", "2026-01-05", "上班", "09:00"] }
      : { cols: [...HOURS_TEMPLATE], row: ["E001", "2026-01-05", "8", "09:00"] };
    saveCsv(csvSerialize(sample.cols, [sample.row]), `出勤匯入範本_${kind === "punch" ? "打卡" : "工時"}.csv`);
  };
  const onImportFile = async (file: File) => {
    const text = await file.text();
    setPreview(parseAttendanceCsv(text, new Set(employees.map((e) => e.id)), attendance.breakMinutes));
    setImportOpen(true);
  };
  const commitImport = () => {
    if (preview && !preview.hasError && preview.valid.length > 0) {
      importPunches(preview.valid);
      setImportOpen(false);
      setPreview(null);
      alert(`已匯入 ${preview.valid.length} 筆打卡紀錄。`);
    }
  };

  const nameById = Object.fromEntries(employees.map((e) => [e.id, e.name]));
  const today = new Date().toDateString();
  const todayPunches = punches.filter((p) => new Date(p.timestamp).toDateString() === today);
  const daySummaries = evaluateAllForDate(attendance, summaryDate, punches);

  const punch = async (type: PunchType) => {
    if (!selected) return;
    setBusy(type);
    setResult(null);
    try {
      const pos = await getPosition();
      const { latitude, longitude, accuracy } = pos.coords;
      const { distanceM, withinFence } = evaluateFence(attendance, latitude, longitude);

      let ip: string | null = null;
      let ipAllowed: boolean | null = null;
      if (attendance.ipCheckEnabled) {
        try {
          ip = await fetchPublicIp();
          ipAllowed = isIpAllowed(attendance, ip);
        } catch {
          ip = null;
          ipAllowed = null; // 查 IP 失敗 → 記為未知，不阻擋
        }
      }

      const reasons: string[] = [];
      if (attendance.blockOutOfFence && !withinFence) {
        reasons.push(distanceM != null ? `超出公司範圍（距 ${Math.round(distanceM)} 公尺）` : "不在允許範圍");
      }
      if (attendance.ipCheckEnabled && ipAllowed === false) {
        reasons.push(`IP ${ip} 不在公司允許清單`);
      }
      if (reasons.length > 0) {
        setResult({ ok: false, text: `打卡未成功：${reasons.join("；")}` });
        return;
      }

      const rec: PunchRecord = {
        id: `P${Date.now()}`,
        employeeId: selected,
        type,
        timestamp: new Date().toISOString(),
        lat: latitude,
        lng: longitude,
        accuracy,
        distanceM,
        withinFence,
        ip,
        ipAllowed,
      };
      addPunch(rec);
      const dist = distanceM != null ? `（距公司 ${Math.round(distanceM)} 公尺）` : "（未設公司座標，未做距離限制）";
      const warn = !withinFence ? "⚠ 超出範圍，已記錄並標示" : "";
      setResult({ ok: true, text: `${nameById[selected]} ${punchTypeLabel(type)}打卡成功 ${dist} ${warn}`.trim() });
    } catch (e) {
      setResult({ ok: false, text: `定位失敗：${e instanceof Error ? e.message : String(e)}（請允許瀏覽器定位權限）` });
    } finally {
      setBusy(null);
    }
  };

  const fenceConfigured = attendance.companyLat != null && attendance.companyLng != null;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-lg font-bold">出勤打卡 <HelpHint id="attendance" /></h1>
        <p className="text-sm text-muted-foreground">
          以裝置 GPS 定位判斷是否在公司範圍內{attendance.ipCheckEnabled ? "，並檢查公網 IP" : ""}。
          打卡紀錄存在「這台裝置的瀏覽器」，可匯出 CSV 由人事彙整。
        </p>
      </div>

      {/* 誠實標示：純前端不可強制執行 */}
      <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-900">
        <ShieldAlert className="mt-0.5 size-4 shrink-0" />
        <p>
          前端 GPS／IP 僅供<strong>輔助與稽核</strong>，可能被竄改（模擬定位、VPN），<strong>非強制防弊</strong>；
          且各裝置資料獨立、無法集中。需要防弊或集中管理請改用後端。
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">打卡</CardTitle>
          <CardDescription>
            {fenceConfigured
              ? `公司範圍：半徑 ${attendance.radiusMeters} 公尺${attendance.blockOutOfFence ? "（超出將禁止打卡）" : "（超出仍記錄並標示）"}`
              : "尚未設定公司座標（目前不做距離限制）。可至「系統設定 → 打卡設定」設定。"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {employees.length === 0 ? (
            <p className="text-sm text-muted-foreground">尚無員工，請先到「基本資料」新增。</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={selected} onValueChange={setSelected}>
                  <SelectTrigger className="w-56 col-input"><SelectValue placeholder="選擇員工" /></SelectTrigger>
                  <SelectContent>
                    {employees.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.id} {e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={() => punch("in")} disabled={busy !== null || !selected}>
                  <LogIn /> {busy === "in" ? "定位中…" : "上班打卡"}
                </Button>
                <Button variant="secondary" onClick={() => punch("out")} disabled={busy !== null || !selected}>
                  <LogOut /> {busy === "out" ? "定位中…" : "下班打卡"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate("/settings")}>
                  <Settings /> 打卡設定
                </Button>
              </div>

              {result && (
                <div
                  className={`flex items-start gap-2 rounded-md border p-2.5 text-sm ${
                    result.ok ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-rose-300 bg-rose-50 text-rose-900"
                  }`}
                >
                  {result.ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> : <AlertTriangle className="mt-0.5 size-4 shrink-0" />}
                  <p>{result.text}</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarCheck className="size-4 text-primary" /> 每日出勤彙整（彈性上下班）
            </CardTitle>
            <input
              type="date"
              className="h-8 rounded-md border border-input bg-orange-50 px-2 text-sm"
              value={summaryDate}
              onChange={(e) => e.target.value && setSummaryDate(e.target.value)}
            />
          </div>
          <CardDescription>
            {attendance.flexEnabled
              ? `彈性上班 ${attendance.flexEarliestIn}–${attendance.flexLatestIn}（晚於即遲到）、應工時 ${formatMinutes(attendance.requiredWorkMinutes)}、午休 ${attendance.breakMinutes} 分${attendance.coreStart && attendance.coreEnd ? `、核心 ${attendance.coreStart}–${attendance.coreEnd}` : ""}`
              : "彈性上下班判定未啟用（可至「系統設定 → 打卡設定」開啟）。"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {daySummaries.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">該日尚無打卡紀錄。</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>員工</TableHead>
                  <TableHead>上班</TableHead>
                  <TableHead>下班</TableHead>
                  <TableHead className="text-right">工時</TableHead>
                  <TableHead>建議下班</TableHead>
                  <TableHead>狀態</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {daySummaries.map((d) => (
                  <TableRow key={d.employeeId}>
                    <TableCell className="font-medium">{nameById[d.employeeId] ?? d.employeeId}</TableCell>
                    <TableCell className="tabular-nums">{hhmm(d.firstIn)}</TableCell>
                    <TableCell className="tabular-nums">{hhmm(d.lastOut)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {d.workedMinutes != null ? formatMinutes(d.workedMinutes) : "—"}
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">{hhmm(d.expectedOutISO)}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(d)}>{d.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="size-4 text-primary" /> 今日打卡紀錄
            </CardTitle>
            <CardDescription>{new Date().toLocaleDateString("zh-TW")}（本機）</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              ref={importRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onImportFile(f); e.target.value = ""; }}
            />
            <Button variant="outline" size="sm" onClick={() => downloadTemplate("punch")}><FileDown /> 打卡範本</Button>
            <Button variant="outline" size="sm" onClick={() => downloadTemplate("hours")}><FileDown /> 工時範本</Button>
            <Button variant="outline" size="sm" onClick={() => importRef.current?.click()}><Upload /> 匯入 CSV</Button>
            <Button
              variant="outline"
              size="sm"
              disabled={punches.length === 0}
              onClick={() => saveCsv(punchesToCsv(punches, nameById), `打卡紀錄_${new Date().toISOString().slice(0, 10)}.csv`)}
            >
              <Download /> 匯出全部 CSV
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive"
              disabled={punches.length === 0}
              onClick={() => {
                if (confirm("清除這台裝置上的所有打卡紀錄？建議先匯出 CSV。")) clearPunches();
              }}
            >
              <Trash2 /> 清除
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {todayPunches.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">今日尚無打卡紀錄。</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>時間</TableHead>
                  <TableHead>員工</TableHead>
                  <TableHead>類型</TableHead>
                  <TableHead className="text-right">距公司</TableHead>
                  <TableHead className="text-right">精度</TableHead>
                  <TableHead className="text-center">範圍</TableHead>
                  {attendance.ipCheckEnabled && <TableHead>IP</TableHead>}
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todayPunches.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="tabular-nums">{new Date(p.timestamp).toLocaleTimeString("zh-TW")}</TableCell>
                    <TableCell>{nameById[p.employeeId] ?? p.employeeId}</TableCell>
                    <TableCell>
                      <Badge variant={p.type === "in" ? "secondary" : "outline"}>{punchTypeLabel(p.type)}</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {p.distanceM != null ? `${Math.round(p.distanceM)} m` : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {p.accuracy != null ? `±${Math.round(p.accuracy)} m` : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      {p.withinFence ? <Badge variant="success">範圍內</Badge> : <Badge variant="destructive">範圍外</Badge>}
                    </TableCell>
                    {attendance.ipCheckEnabled && (
                      <TableCell className="text-xs tabular-nums">
                        {p.ip ?? "—"}
                        {p.ipAllowed === false && <Badge variant="destructive" className="ml-1">不允許</Badge>}
                      </TableCell>
                    )}
                    <TableCell>
                      <Button variant="ghost" size="icon" className="size-7 text-destructive" onClick={() => removePunch(p.id)}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 出勤/工時 CSV 匯入預覽 */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader><DialogTitle>匯入出勤／工時（預覽）</DialogTitle></DialogHeader>
          {preview && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="outline">{preview.format === "hours" ? "工時格式（自動合成上/下班）" : "打卡格式"}</Badge>
                <Badge variant="success">可匯入 {preview.valid.length} 筆打卡</Badge>
                {preview.issues.some((i) => i.level === "error") && (
                  <Badge variant="destructive">錯誤 {preview.issues.filter((i) => i.level === "error").length} 列（需修正）</Badge>
                )}
                {preview.issues.some((i) => i.level === "warning") && (
                  <Badge variant="warning">提醒 {preview.issues.filter((i) => i.level === "warning").length} 項</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">工時格式的下班時間＝上班＋工時＋午休（{attendance.breakMinutes} 分），使月工時還原為輸入值。相同時間/類型的重複紀錄不會重覆匯入。</p>
              <div className="max-h-[50vh] overflow-auto rounded-md border">
                <Table>
                  <TableHeader><TableRow><TableHead className="w-10">列</TableHead><TableHead>內容</TableHead><TableHead>檢查</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {preview.rows.map((r) => (
                      <TableRow key={r.row} className={r.errors.length ? "bg-destructive/5" : ""}>
                        <TableCell className="text-xs text-muted-foreground">{r.row}</TableCell>
                        <TableCell className="text-sm">{r.summary}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {r.errors.map((m, i) => <Badge key={`e${i}`} variant="destructive">{m}</Badge>)}
                            {r.warnings.map((m, i) => <Badge key={`w${i}`} variant="warning">{m}</Badge>)}
                            {r.errors.length === 0 && r.warnings.length === 0 && <span className="text-xs text-muted-foreground">OK</span>}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>取消</Button>
            <Button onClick={commitImport} disabled={!preview || preview.hasError || preview.valid.length === 0}>
              確認匯入 {preview?.valid.length ?? 0} 筆
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** ISO → "HH:mm"（本機）；null 顯示「—」 */
function hhmm(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit", hour12: false });
}

/** 每日狀態 → Badge 樣式 */
function statusVariant(d: DayAttendance): "success" | "warning" | "destructive" | "secondary" {
  if (d.missingIn || d.missingOut) return "destructive";
  if (d.late || d.shortHours || d.outsideCore) return "warning";
  if (d.status === "正常") return "success";
  return "secondary";
}
