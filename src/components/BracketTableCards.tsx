import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BookOpen, ExternalLink, Table2 } from "lucide-react";
import { BracketTables } from "./BracketTables";
import type { InsuranceBrackets } from "@/config/brackets";

/** 四張投保級距表：摘要、系統表鍵、官方分級表專頁（非入口首頁；來源02） */
export const BRACKET_META: {
  key: keyof InsuranceBrackets;
  name: string;
  detail: string;
  org: string;
  url: string;
}[] = [
  {
    key: "labor",
    name: "勞工保險投保薪資分級表",
    detail: "11 級，下限 29,500、上限 45,800（115 年）",
    org: "勞動部勞工保險局",
    url: "https://www.bli.gov.tw/0005475.html",
  },
  {
    key: "occupational",
    name: "勞工職業災害保險投保薪資分級表",
    detail: "21 級，下限 29,500、上限 72,800（115 年）",
    org: "勞動部勞工保險局",
    url: "https://www.bli.gov.tw/0103450.html",
  },
  {
    key: "health",
    name: "全民健康保險投保金額分級表",
    detail: "58 級，下限 29,500、上限 313,000（115 年）",
    org: "衛福部中央健康保險署",
    url: "https://www.nhi.gov.tw/ch/cp-19421-f9533-2569-1.html",
  },
  {
    key: "pension",
    name: "勞工退休金月提繳分級表",
    detail: "62 級，下限 1,500、上限 150,000（115 年）",
    org: "勞動部勞工保險局",
    url: "https://www.bli.gov.tw/0012959.html",
  },
];

/**
 * 四張級距表卡片（與「工資與工時」等卡片同一樣式）：
 * 每張卡片附「查看級距表」（彈窗顯示系統採用的完整級距）與官方分級表參考連結。
 */
export function BracketTableCards({ brackets }: { brackets: InsuranceBrackets }) {
  const [tableKey, setTableKey] = useState<keyof InsuranceBrackets | null>(null);
  const openMeta = BRACKET_META.find((m) => m.key === tableKey);

  return (
    <>
      <div className="grid gap-3 md:grid-cols-2">
        {BRACKET_META.map((t) => (
          <div key={t.key} className="flex flex-col rounded-lg border p-3">
            <p className="text-sm font-medium">{t.name}</p>
            <p className="mt-1 flex-1 text-sm">{t.detail}</p>
            <p className="mt-1.5 text-xs text-muted-foreground">{t.org}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button
                onClick={() => setTableKey(t.key)}
                className="inline-flex w-fit items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/20"
              >
                <Table2 className="size-3.5" />
                查看級距表
              </button>
              <a
                href={t.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-fit items-center gap-1 rounded-md bg-info/10 px-2 py-1 text-xs font-medium text-info hover:bg-info/20"
              >
                <BookOpen className="size-3.5" />
                {t.org}分級表
                <ExternalLink className="size-3" />
              </a>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={tableKey !== null} onOpenChange={(o) => !o && setTableKey(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{openMeta ? openMeta.name : "投保級距表"}（系統採用，115 年度）</DialogTitle>
          </DialogHeader>
          {tableKey && <BracketTables key={tableKey} brackets={brackets} initial={tableKey} />}
          <p className="text-xs text-muted-foreground">
            申報義務：月薪資總額（含經常性給與）異動時，應於 2 月底／8 月底前申報調整投保薪資；
            以多報少依勞工保險條例第 72 條處短繳保費 4 倍罰鍰。
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
