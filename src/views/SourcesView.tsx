import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";

interface SourceCard {
  title: string;
  value: string;
  law: string;
  agency: string;
  url: string;
  note?: string;
}

const SOURCES: { group: string; items: SourceCard[] }[] = [
  {
    group: "工資與工時",
    items: [
      {
        title: "最低工資",
        value: "月薪 29,500 元／時薪 196 元（115 年）",
        law: "最低工資法第 5 條",
        agency: "勞動部",
        url: "https://www.mol.gov.tw/",
        note: "每年第三季審議、年底公告次年值；月薪總額不得低於此數。",
      },
      {
        title: "加班費倍率與工時上限",
        value: "平日前 2 小時 ×4/3、第 3–4 小時 ×5/3；休息日同級距加給；每月加班上限 46 小時",
        law: "勞動基準法第 24、32、39 條",
        agency: "勞動部",
        url: "https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=N0030001",
        note: "每小時工資額＝月薪資總額 ÷ 240；勞動部官網有加班費試算器可交叉核對。",
      },
      {
        title: "特別休假",
        value: "滿 6 個月 3 天、1 年 7 天、2 年 10 天、3 年 14 天、5 年 15 天、10 年起每年 +1 天（上限 30 天）",
        law: "勞動基準法第 38 條",
        agency: "勞動部",
        url: "https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=N0030001",
      },
      {
        title: "請假扣薪規則",
        value: "事假不給薪（年 14 天內）；普通傷病假半薪（未住院年 30 天內）",
        law: "勞工請假規則",
        agency: "勞動部",
        url: "https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=N0030006",
        note: "婚假、喪假、公假、產假等有薪假不扣款。",
      },
    ],
  },
  {
    group: "社會保險",
    items: [
      {
        title: "勞保＋就業保險費率",
        value: "合計 12.5%（員工 20%／公司 70%／政府 10%）",
        law: "勞工保險條例第 13、15 條；就業保險法第 8 條",
        agency: "勞動部勞工保險局",
        url: "https://www.bli.gov.tw/",
        note: "預定民國 116 年起調升為 13%。",
      },
      {
        title: "職業災害保險費率",
        value: "依行業別核定（全產業平均約 0.21%），公司全額負擔",
        law: "勞工職業災害保險及保護法第 16、19 條",
        agency: "勞動部勞工保險局",
        url: "https://www.bli.gov.tw/",
        note: "請以勞保局寄發貴公司的核定通知書為準，每 3 年檢討。",
      },
      {
        title: "健保費率與眷屬計費",
        value: "5.17%（員工 30%／公司 60%／政府 10%）；眷屬超過 3 口以 3 口計；公司負擔按平均眷口數 0.56 計",
        law: "全民健康保險法第 18、27、29 條",
        agency: "衛生福利部中央健康保險署",
        url: "https://www.nhi.gov.tw/",
      },
      {
        title: "勞工退休金",
        value: "公司提繳 6%（法定下限）；員工可自願提繳 0–6%，自提金額免稅",
        law: "勞工退休金條例第 14 條",
        agency: "勞動部勞工保險局",
        url: "https://www.bli.gov.tw/",
      },
      {
        title: "投保級距表（四種）",
        value: "勞保 11 級（上限 45,800）／職保 21 級（上限 72,800）／健保 58 級（上限 313,000）／勞退 62 級（上限 150,000）",
        law: "各保險主管機關年度公告",
        agency: "勞保局／健保署",
        url: "https://www.bli.gov.tw/",
        note: "115 年 1 月 1 日生效；完整級距可在「系統設定」頁檢視。",
      },
      {
        title: "二代健保補充保費",
        value: "2.11%。個人：年度累計獎金超過投保金額 4 倍的部分；公司：當月支付薪資總額超過全體投保金額的差額",
        law: "全民健康保險法第 31、34 條",
        agency: "衛生福利部中央健康保險署",
        url: "https://www.nhi.gov.tw/",
        note: "健保署網站有線上試算可交叉核對；公司差額部分於次月底前自行繳納。",
      },
    ],
  },
  {
    group: "所得稅扣繳",
    items: [
      {
        title: "每月薪資扣繳（居住者，二擇一）",
        value: "查表法：依「薪資所得扣繳稅額表」，115 年起扣標準 90,501 元（每位扶養約 +8,417）；或固定 5%：稅額 ≤2,000 元免扣",
        law: "各類所得扣繳率標準第 2、13 條",
        agency: "財政部",
        url: "https://www.etax.nat.gov.tw/",
        note: "由員工在「免稅額申報表」上勾選；未交表者依規定按固定 5% 扣繳。",
      },
      {
        title: "獎金等一次性給付",
        value: "按 5% 扣繳；單次未達 90,501 元免扣（仍須列入年度扣繳憑單）",
        law: "各類所得扣繳率標準第 2 條",
        agency: "財政部",
        url: "https://www.etax.nat.gov.tw/",
      },
      {
        title: "非居住者",
        value: "全月薪資 ≤44,250 元扣 6%；超過扣 18%（門檻＝最低工資 ×1.5）",
        law: "各類所得扣繳率標準第 2 條",
        agency: "財政部",
        url: "https://www.etax.nat.gov.tw/",
        note: "課稅年度在台未滿 183 天者適用；不適用免稅額申報表。",
      },
      {
        title: "伙食津貼免稅額",
        value: "每月 3,000 元內免計入應稅薪資（仍屬工資、計入投保級距）",
        law: "財政部公告（114 年 1 月起調整）",
        agency: "財政部",
        url: "https://www.dot.gov.tw/",
      },
      {
        title: "繳納與申報期限",
        value: "代扣稅款於次月 10 日前繳庫；每年 1 月底前申報上年度扣繳憑單（2 月 10 日前填發）",
        law: "所得稅法第 88、92 條",
        agency: "財政部",
        url: "https://www.etax.nat.gov.tw/",
      },
    ],
  },
  {
    group: "雇主義務",
    items: [
      {
        title: "薪資明細與工資清冊",
        value: "每次發薪應提供各項目計算明細（薪資條）；工資清冊應保存 5 年",
        law: "勞動基準法第 23 條",
        agency: "勞動部",
        url: "https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=N0030001",
      },
      {
        title: "投保薪資申報調整",
        value: "月薪總額變動時，應於 2 月底／8 月底前申報調整投保薪資",
        law: "勞工保險條例第 14、72 條",
        agency: "勞動部勞工保險局",
        url: "https://www.bli.gov.tw/",
        note: "以多報少（高薪低報）會被處短繳保費 4 倍罰鍰並追繳差額。",
      },
      {
        title: "加保與退保時點",
        value: "新進員工到職當日加保；離職當日退保；眷屬健保依附異動同步辦理",
        law: "勞工保險條例第 11 條",
        agency: "勞保局／健保署",
        url: "https://www.bli.gov.tw/",
      },
    ],
  },
];

export function SourcesView() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">法規與費率依據</h1>
        <p className="text-sm text-muted-foreground">
          系統內每一條計算規則的法源與主管機關出處（適用民國 115 年度）。法規修正時，
          只要在「系統設定」更新對應數值即可，計算方式不變。建議每年 1 月依各機關公告檢查一次。
        </p>
      </div>

      {SOURCES.map((g) => (
        <Card key={g.group}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{g.group}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {g.items.map((s) => (
                <div key={s.title} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{s.title}</p>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex shrink-0 items-center gap-1 text-xs text-sky-600 hover:underline"
                    >
                      {s.agency} <ExternalLink className="size-3" />
                    </a>
                  </div>
                  <p className="mt-1 text-sm">{s.value}</p>
                  <Badge variant="outline" className="mt-2">{s.law}</Badge>
                  {s.note && <p className="mt-1.5 text-xs text-muted-foreground">{s.note}</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">與官方數字的對帳原則</CardTitle>
          <CardDescription>
            勞健保費以「級距 × 費率 × 負擔比例」四捨五入計算，與勞保局／健保署繳款單可能有正負 1 元尾差，
            屬捨入方式差異，請一律以繳款單金額繳費，不需回頭修改系統資料。
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
