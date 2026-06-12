import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Wand2, CalendarClock, ClipboardCheck, FileSpreadsheet, Users, Settings } from "lucide-react";

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
    body: "產出部門／成本中心／專案的人事成本匯總、本月代扣所得稅清單（次月 10 日前繳庫），以及每位員工的薪資條。按「列印」即可印出或存成 PDF 發給員工。薪資資料依法應保存五年，建議定期留存列印版或截圖歸檔。",
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
    "所有資料只儲存在這台電腦的瀏覽器中，不會上傳到任何伺服器；但清除瀏覽器資料（Cookie／網站資料）時會一併刪除，請留意。重要月份建議列印報表留存。",
  ],
  [
    "每年年初要做什麼？",
    "每年 1 月政府會公告新年度的最低工資、保險費率與投保級距，請到「系統設定」更新數值（民國 116 年起勞就保費率將升為 13%）。另外記得向員工收取當年度的免稅額申報表，並更新收件日。",
  ],
];

export function HelpView() {
  const navigate = useNavigate();

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
          <CardTitle className="text-base">畫面慣例</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p><span className="mr-2 inline-block size-3 rounded-sm bg-orange-100 align-middle ring-1 ring-orange-200" />橘色欄位＝需要您輸入或可修改的地方。</p>
          <p><span className="mr-2 inline-block size-3 rounded-sm bg-yellow-100 align-middle ring-1 ring-yellow-200" />黃色欄位＝貴公司專屬的設定（與法規公告無關）。</p>
          <p>其餘數字都由系統自動計算，不需要也無法直接修改。</p>
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
