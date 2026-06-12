import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpen, ExternalLink, Layers } from "lucide-react";
import { BracketTableCards } from "@/components/BracketTableCards";
import { usePayrollStore } from "@/store/usePayrollStore";

/** 全國法規資料庫連結工具：條文層級與整部法規 */
const lawSingle = (pcode: string, flno: number) =>
  `https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=${pcode}&flno=${flno}`;
const lawAll = (pcode: string) => `https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=${pcode}`;

interface SourceCard {
  title: string;
  value: string;
  lawName: string; // 對應法規名稱（連結文字）
  url: string; // 直接指向對應法規條文
  note?: string;
}

const SOURCES: { group: string; items: SourceCard[] }[] = [
  {
    group: "工資與工時",
    items: [
      {
        title: "最低工資",
        value: "月薪 29,500 元／時薪 196 元（115 年度）",
        lawName: "最低工資法",
        url: lawAll("N0030028"),
        note: "金額由勞動部依最低工資法審議、每年公告；月薪資總額不得低於此數。",
      },
      {
        title: "加班費與加班上限",
        value:
          "平日前 2 小時 ×1⅓、第 3–4 小時 ×1⅔；休息日同級距加給；延長工時連同休息日出勤每月上限 46 小時",
        lawName: "勞動基準法第 24、32 條",
        url: lawSingle("N0030001", 24),
        note: "每小時工資額＝月薪資總額 ÷ 240（勞動部函釋慣例）。",
      },
      {
        title: "特別休假",
        value:
          "滿 6 個月 3 天、1 年 7 天、2 年 10 天、3 年 14 天、5 年 15 天、10 年起每年 +1 天（上限 30 天）",
        lawName: "勞動基準法第 38 條",
        url: lawSingle("N0030001", 38),
      },
      {
        title: "請假扣薪規則",
        value: "事假不給薪（年 14 天內）；普通傷病假半薪（未住院年 30 天內）",
        lawName: "勞工請假規則第 4、7 條",
        url: lawAll("N0030006"),
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
        lawName: "勞工保險條例第 13 條",
        url: lawSingle("N0050001", 13),
        note: "負擔比例見勞保條例第 15 條、就業保險法第 8 條；預定民國 116 年起調升為 13%。",
      },
      {
        title: "職業災害保險費率",
        value: "依行業別核定（全產業平均約 0.21%），公司全額負擔",
        lawName: "勞工職業災害保險及保護法第 16、19 條",
        url: lawSingle("N0050031", 16),
        note: "請以勞保局核定通知書之本公司費率為準，每 3 年檢討。",
      },
      {
        title: "健保費率與眷屬計費",
        value:
          "5.17%（員工 30%／公司 60%／政府 10%）；眷屬超過 3 口以 3 口計；公司負擔按平均眷口數 0.56 計",
        lawName: "全民健康保險法第 18、27、29 條",
        url: lawSingle("L0060001", 18),
        note: "負擔比例見健保法第 27 條；眷屬計費上限見第 29 條。",
      },
      {
        title: "勞工退休金",
        value: "公司提繳 6%（法定下限）；員工自願提繳 0–6%，自提額免稅",
        lawName: "勞工退休金條例第 14 條",
        url: lawSingle("N0030020", 14),
        note: "員工自願提繳自當年度所得總額全數扣除（同條第 3 項）。",
      },
      {
        title: "二代健保補充保費",
        value:
          "2.11%。個人：年度累計獎金超過投保金額 4 倍的部分；公司：當月支付薪資總額超過全體投保金額的差額",
        lawName: "全民健康保險法第 31、34 條",
        url: lawSingle("L0060001", 31),
        note: "投保單位差額制見第 34 條；公司差額部分次月底前自行繳納。",
      },
    ],
  },
  {
    group: "所得稅扣繳",
    items: [
      {
        title: "每月薪資扣繳（居住者，二擇一）",
        value:
          "查表法：依扣繳稅額表，115 年起扣標準 90,501 元（每位扶養約 +8,417）；或固定 5%：稅額 ≤2,000 元免扣",
        lawName: "各類所得扣繳率標準第 2、13 條",
        url: lawSingle("G0340009", 2),
        note: "由員工於免稅額申報表勾選；未交表者依規定按固定 5% 扣繳。免扣上限見第 13 條。",
      },
      {
        title: "獎金等一次性給付",
        value: "按 5% 扣繳；單次未達 90,501 元免扣（仍須列入年度扣繳憑單）",
        lawName: "各類所得扣繳率標準第 2 條",
        url: lawSingle("G0340009", 2),
      },
      {
        title: "非居住者",
        value: "全月薪資 ≤44,250 元扣 6%；超過扣 18%（門檻＝最低工資 ×1.5）",
        lawName: "各類所得扣繳率標準第 2 條",
        url: lawSingle("G0340009", 2),
        note: "課稅年度在台未滿 183 天者適用；不適用免稅額申報表。",
      },
      {
        title: "伙食津貼免稅額",
        value: "每月 3,000 元內免計入應稅所得（仍屬工資、計入投保級距）",
        lawName: "所得稅法第 14 條",
        url: lawSingle("G0340003", 14),
        note: "3,000 元免稅額度由財政部公告（114 年 1 月起由 2,400 調為 3,000）。",
      },
      {
        title: "繳納與申報期限",
        value: "代扣稅款次月 10 日前繳庫；每年 1 月底前申報上年度扣繳憑單（2 月 10 日前填發）",
        lawName: "所得稅法第 88、92 條",
        url: lawSingle("G0340003", 88),
      },
    ],
  },
  {
    group: "雇主義務",
    items: [
      {
        title: "薪資明細與工資清冊",
        value: "每次發薪應提供各項目計算明細（薪資條）；工資清冊應保存 5 年",
        lawName: "勞動基準法第 23 條",
        url: lawSingle("N0030001", 23),
      },
      {
        title: "投保薪資申報調整",
        value: "月薪資總額變動時，應於 2 月底／8 月底前申報調整投保薪資",
        lawName: "勞工保險條例第 14、72 條",
        url: lawSingle("N0050001", 14),
        note: "以多報少（高薪低報）依第 72 條處短繳保費 4 倍罰鍰並追繳差額。",
      },
      {
        title: "加保與退保時點",
        value: "新進員工到職當日加保；離職當日退保；眷屬健保依附異動同步辦理",
        lawName: "勞工保險條例第 11 條",
        url: lawSingle("N0050001", 11),
      },
    ],
  },
];

export function SourcesView() {
  const brackets = usePayrollStore((s) => s.brackets);
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">法規與費率依據</h1>
        <p className="text-sm text-muted-foreground">
          系統內每一條計算規則的法源（適用民國 115 年度）。每個項目的連結直接指向「全國法規資料庫」的
          對應條文，方便核對；投保級距表則連到各主管機關的分級表專頁。法規修正時，只要在「系統設定」
          更新對應數值即可，計算方式不變。
        </p>
      </div>

      {/* 投保級距表（四險）— 與下方各組同一張卡片樣式 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers className="size-4 text-primary" />
            投保級距表（四險）
          </CardTitle>
          <CardDescription>
            系統以「月薪資總額」查表決定投保金額：落在某級區間即以該級金額投保，介於兩級取較高一級，
            超過最高級以最高級計（觸頂）。四險各自獨立查表，級數與上限不同。每年由主管機關公告（第 1 級多隨最低工資連動）。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BracketTableCards brackets={brackets} />
        </CardContent>
      </Card>

      {SOURCES.map((g) => (
        <Card key={g.group}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{g.group}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {g.items.map((s) => (
                <div key={s.title} className="flex flex-col rounded-lg border p-3">
                  <p className="text-sm font-medium">{s.title}</p>
                  <p className="mt-1 flex-1 text-sm">{s.value}</p>
                  {s.note && <p className="mt-1.5 text-xs text-muted-foreground">{s.note}</p>}
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex w-fit items-center gap-1 rounded-md bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700 hover:bg-sky-100"
                  >
                    <BookOpen className="size-3.5" />
                    {s.lawName}
                    <ExternalLink className="size-3" />
                  </a>
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
