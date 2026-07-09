import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { FEATURES } from "@/config/features";
import { usePayrollStore } from "@/store/usePayrollStore";
import { TOUR_LIST } from "@/content/tours";
import { Wand2, CalendarClock, ClipboardCheck, FileSpreadsheet, Users, Settings, BarChart3, Compass } from "lucide-react";

const ANALYTICS_GUIDE: [string, string][] = [
  ["成本結構", "看人事總成本由本薪/加給/加班/獎金/雇主負擔的組成、部門別比較與成本集中度（Pareto），抓結構失衡。"],
  ["分布與公平", "百分位、變異係數 CV、Gini／Lorenz、部門中位差、薪資 vs 年資，檢視內部公平與薪資壓縮。"],
  ["級距與 compa-ratio", "建立薪資級距並指派員工 → 看每人相對中位的 compa-ratio 與區間滲透率、部門×級距熱圖；填「市場中位」可再算對市場的競爭力（市場 compa）。"],
  ["獎金／分紅試算", "設定獎金池與分配法（均分/按本薪/按績效/merit matrix），逐人試算獎金與二代健保概估、預算差異。"],
  ["年度／季度調薪試算", "設定調薪預算與分配法，逐人看調幅、調後薪資與 compa-ratio、年化雇主成本，及調薪前後公平性對比；並可把四種分配法並排比較。"],
  ["月報（依檢視月份）", `成本結構、分布、級距${FEATURES.projects ? "、專案成本" : ""}可切換「檢視月份」：看當期未確認月＝試算暫定、看已確認月＝實際、看過去月＝歷史實際，標籤會清楚標示。`],
  ["年報（趨勢·預算）", "當年累計（各月已確認快照加總，缺月回推估算）＋模擬全年（已實際＋剩餘月以本月推估）＋年度預算達成；並看成本/中位/Gini 走勢。"],
  ["指標說明", "每個指標不講公式，只說明「能告訴你什麼（用途）」與「數字落在哪代表什麼（怎麼看）」。"],
];

const MONTHLY_STEPS = [
  {
    icon: CalendarClock,
    title: "① 薪資結算",
    body: "選好發薪月份後，每位員工的固定薪資、四項保費都已自動算好。只要替「有加班、請假或獎金」的員工按「編輯」填入異動；沒有異動的人完全不用動。選「依扣繳稅額表」且薪資達起扣點的員工，會出現黃色提醒，請查官方稅額表填入代扣金額。",
  },
  {
    icon: ClipboardCheck,
    title: "② 結算查核",
    body: "檢視全公司試算總覽（每人應發、代扣、實發與公司成本），並查看系統的資料檢查與統計勾稽。要發獎金的月份可先用「獎金試算」算出實際入帳金額。確認沒問題後按「確認本月結算」留下確認紀錄；之後若再修改任何資料，確認會自動解除，提醒您重新查核。",
  },
  {
    icon: FileSpreadsheet,
    title: "③ 報表與薪資條",
    body: `產出部門／成本中心${FEATURES.projects ? "／專案" : ""}的人事成本匯總、本月代扣所得稅清單（次月 10 日前繳庫），以及每位員工的薪資條。按「列印」即可印出或存成 PDF 發給員工。薪資資料依法應保存五年，建議定期留存列印版或截圖歸檔。`,
  },
];

const FAQ: [string, string][] = [
  [
    "為什麼健保費比想像中高？",
    "員工自付的健保費會隨「依附健保的眷屬」增加（每口加收一份，最多計 3 口）。請到「基本資料」確認該員工的眷屬勾選是否正確。",
  ],
  [
    "為什麼某位員工的代扣所得稅是 0？",
    "選「固定 5%」的員工，算出的稅額不超過 2,000 元時依規定免扣；選「依扣繳稅額表」的員工，月應稅薪資未達起扣點也免扣。這都是正常的。",
  ],
  [
    "獎金的稅和補充保費怎麼算？",
    "兩條規則互相獨立：所得稅看「單次」金額是否達起扣標準（達標扣 5%）；二代健保補充保費看「今年累計」獎金是否超過該員工健保投保金額的 4 倍（超過的部分收 2.11%）。可先用「結算查核 → 獎金試算」試算。",
  ],
  [
    "員工到職／離職當月怎麼處理？",
    "新進員工請在「基本資料」建檔（記得當日向勞保局、健保署辦理加保）；離職員工確認結清後可在「基本資料」刪除（記得當日退保）。本系統以月為單位計算，破月比例拆分請依公司規定另行調整本薪。",
  ],
  [
    "資料會不會外洩或不見？",
    "所有資料只儲存在這台電腦的瀏覽器中，不會上傳到任何伺服器；但清除瀏覽器資料（Cookie／網站資料）時會一併刪除，請留意。建議每月結算後到「系統設定 → 資料備份與還原」按「匯出備份檔」另存（薪資資料依法應保存五年）；換電腦或誤刪時用備份檔還原即可。",
  ],
  // 出勤/專案功能隱藏時，不列出指向這些頁面的 FAQ（FEATURES）
  ...(FEATURES.attendance ? ([[
    "沒有逐筆打卡，可以匯入出勤或工時嗎？",
    "可以。到「出勤打卡」按「打卡範本」或「工時範本」下載 CSV：打卡格式填上/下班時間，工時格式只填每日工時（系統自動換算上下班、扣午休）。填好按「匯入 CSV」會先顯示驗證預覽（時間格式錯誤會擋下、查無員工會提醒）再確認匯入；匯入後即可在「每月薪資作業 → 工時分攤」用「由出勤帶入」帶入實際工時。",
  ]] as [string, string][]) : []),
  ...(FEATURES.projects ? ([[
    "一個人同月做好幾個專案，成本怎麼分？",
    "到「系統設定 → 專案主檔」建立專案（可填預算、起訖、完成度%），再到「每月薪資作業」的「工時分攤」設定每位員工當月各專案的時數或百分比——有打卡資料可按「由出勤帶入」自動帶入實際工時。系統會把該員工的全載成本（含雇主負擔）依比例分攤到各專案，沒投到專案的工時歸「未分攤／間接」。在「報表→匯總報表」與「薪酬分析→專案成本」可看各專案人事成本、FTE/稼動率、預算 vs 實際、專案×部門矩陣、標準工率差異，以及跨月的累計實際/燃燒率/完工預估(EAC)；各專案合計一定等於全公司人事成本。未設定分攤者整筆計入其預設專案。",
  ]] as [string, string][]) : []),
  [
    "員工很多，可以一次匯入嗎？離職怎麼處理？",
    "可以。到「基本資料」按「匯入模板」下載 CSV 範本，填好後按「批次匯入」，系統會先顯示驗證預覽（錯誤會擋下、低於最低工資會提醒）再確認匯入。員工離職請在該員工檔案把「任職狀態」改為離職並填生效日——離職/留停者不再列入當期計薪，離職當月固定薪資自動按在職天數比例（破月）計算；歷史資料仍保留。",
  ],
  [
    "年度扣繳憑單、加退保、投保級距申報在哪裡？",
    "在上排「法規申報」：可看年度各類所得扣繳彙總、當期勞健退繳費清單、加退保作業清單（依到職/離職日自動列出），以及 2／8 月投保級距申報調整工作清單（先按「以目前為申報基準」，日後薪資異動就會自動標出需調整者）。各清單都可匯出 CSV 供上傳主管機關平台。",
  ],
  [
    "調薪試算算好後，可以直接套用嗎？會留紀錄嗎？",
    "可以。在「薪酬分析 → 調薪試算」按「核定套用此方案」，二次確認後會把調後月薪寫回薪資結構（差額套在本薪）。建議先到「系統設定」填入「操作者姓名」，這樣調薪核定、薪資/代扣稅異動、月結確認、匯入與還原都會留下變更紀錄（誰、何時、改什麼），可匯出 CSV。",
  ],
  [
    "每年年初要做什麼？",
    "每年 1 月政府會公告新年度的最低工資、保險費率與投保級距，請到「系統設定」更新數值（民國 116 年起勞就保費率將升為 13%）。另外記得向員工收取當年度的免稅額申報表，並更新收件日。",
  ],
];

export function HelpView() {
  const navigate = useNavigate();
  const startTour = usePayrollStore((s) => s.startTour);
  const completedTours = usePayrollStore((s) => s.completedTours);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">使用說明</h1>
        <p className="text-sm text-muted-foreground">
          這套系統依台灣現行法規，為月薪制員工計算每月薪資：勞保、健保、勞退、二代健保補充保費、
          所得稅扣繳到薪資條一次完成。
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">互動導引教學</CardTitle>
          <CardDescription>點「開始導覽」，系統會在畫面上圈出「要點哪裡、輸入什麼、預期看到什麼」，一步步帶你走。分頁/輸入由你自己操作，隨時可略過。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {([
            ["onboarding", "新手上手", "第一次接觸這套系統，建議依序走完這三支，建立整體心智模型。"],
            ["acceptance", "本季新功能驗收", "確認本季新增功能是否符合預期；熟悉系統後再看即可。"],
          ] as const).map(([aud, label, desc]) => {
            const list = TOUR_LIST.filter((t) => t.audience === aud);
            if (!list.length) return null;
            return (
              <div key={aud} className="space-y-2">
                <div>
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                {list.map((t, i) => (
                  <div key={t.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {aud === "onboarding" && <span className="mr-1 text-muted-foreground">{i + 1}.</span>}
                        {t.title}{completedTours.includes(t.id) && <span className="ml-2 text-xs text-success">✓ 已完成</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">{t.summary}</p>
                    </div>
                    <Button size="sm" onClick={() => { navigate("/"); startTour(t.id); }}><Compass /> 開始導覽</Button>
                  </div>
                ))}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">第一次使用</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/setup")}>
              <Wand2 /> 重新執行初始設定引導
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/settings")}>
              <Settings /> 前往系統設定
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/master")}>
              <Users /> 前往基本資料
            </Button>
          </div>
          <ol className="ml-5 list-decimal space-y-1 text-muted-foreground">
            <li>在「系統設定」確認公司的職災保險費率與年資基準日（法定費率已內建）。</li>
            <li>在「基本資料」為每位員工建檔：基本資料、固定薪資項目、眷屬與扣繳方式。</li>
            <li>之後每個月照下面三個步驟即可完成發薪作業。</li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">每月作業三步驟</CardTitle>
          <CardDescription>照左側選單「每月作業」的順序進行。</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            {MONTHLY_STEPS.map((s) => (
              <div key={s.title} className="rounded-lg border p-3">
                <s.icon className="mb-1.5 size-5 text-primary" />
                <p className="text-sm font-medium">{s.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="size-4 text-primary" /> 薪酬分析與試算
          </CardTitle>
          <CardDescription>上排「薪酬分析」：從 HR 自我檢討角度看成本與公平，並做獎金/分紅與調薪預算試算（不影響實際薪資）。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid gap-3 md:grid-cols-2">
            {ANALYTICS_GUIDE.map(([t, d]) => (
              <div key={t} className="rounded-md border p-3">
                <p className="text-sm font-medium">{t}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
          <ul className="ml-5 list-disc space-y-1 text-xs text-muted-foreground">
            <li>每個分頁最上方會有「<strong>重點意見（白話解讀）</strong>」：系統依當期數據自動判讀，直接給結論與建議（良好／提醒／需注意），下方圖表與數字僅作佐證——不必懂統計也能看懂。</li>
            <li>圖表可<strong>互動</strong>：滑鼠移到（或手機點按）長條／點上會高亮並顯示數據；<strong>點擊</strong>長條、散布點或部門列，下方會展開對應的員工明細清單。</li>
            <li>compa-ratio／區間滲透率需先在「級距與 compa-ratio」建立薪資級距並指派員工；未建級距則只顯示內部分布指標。</li>
            <li>「獎金／分紅試算」「調薪試算」可調績效評等與係數，並以 CSV 或「匯出 PDF 月報」帶走結果；<strong>試算不會寫回薪資結算</strong>。</li>
            <li>調薪試算的年化成本已把「基薪上升 → 投保金額變動 → 雇主保費」一併重算。</li>
            <li>月結時在「結算查核」按「確認本月結算」會<strong>自動保存當月快照</strong>，年報的「實際累計」才會準確；也可在年報手動保存。</li>
            <li>「結算查核」頁有「模擬年度」面板：用本月（暫定）推估全年成本、對照預算，邊試算邊看。</li>
          </ul>
          <Button variant="outline" size="sm" onClick={() => navigate("/analytics")}>
            <BarChart3 /> 前往薪酬分析
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">畫面慣例</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p><span className="col-input mr-2 inline-block size-4 rounded-sm border align-middle" />有<strong className="text-foreground">淡底＋外框</strong>的欄位＝可以<strong className="text-foreground">輸入或修改</strong>的地方（含公司自訂的設定）。</p>
          <p><span className="mr-2 inline-block size-4 rounded-sm border border-edit bg-edit-bg align-middle" />欄位變成<strong className="text-foreground">琥珀色</strong>＝這格<strong className="text-foreground">已被你改動、尚未送出</strong>（送出前可還原）。</p>
          <p>其餘直接顯示的數字＝<strong className="text-foreground">系統自動計算</strong>，不需要也無法直接修改。</p>
          <p>金額一律四捨五入到「元」。勞健保費與官方繳款單可能有正負 1 元的尾差，屬正常現象，請以繳款單為繳費依據。</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">常見問題</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {FAQ.map(([q, a]) => (
            <div key={q} className="rounded-md border p-3">
              <p className="text-sm font-medium">{q}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{a}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
