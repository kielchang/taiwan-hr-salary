import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { InsuranceBrackets } from "@/config/brackets";
import { cn, ntd } from "@/lib/utils";

const TABS: {
  key: keyof InsuranceBrackets;
  label: string;
  desc: string;
}[] = [
  { key: "labor", label: "勞保", desc: "11 級，上限 45,800" },
  { key: "occupational", label: "職保", desc: "21 級，上限 72,800" },
  { key: "health", label: "健保", desc: "58 級，上限 313,000" },
  { key: "pension", label: "勞退", desc: "62 級，下限 1,500、上限 150,000" },
];

interface Row {
  level: number;
  lower: number; // 月薪資總額下限
  upperLabel: string; // 上限（頂級顯示「下限 以上」）
  amount: number; // 月投保金額
}

/**
 * 由「月投保金額」升冪陣列推算完整級距列：
 *  下限 ＝ 上一級金額 ＋ 1（第 1 級為 0）；上限 ＝ 本級金額（頂級為「下限 以上」）。
 * 與來源02 官方分級表欄位一致。
 */
function toRows(amounts: number[]): Row[] {
  return amounts.map((amount, i) => {
    const lower = i === 0 ? 0 : amounts[i - 1] + 1;
    const isTop = i === amounts.length - 1;
    return {
      level: i + 1,
      lower,
      upperLabel: isTop ? `${ntd(lower)} 以上` : ntd(amount),
      amount,
    };
  });
}

/** 直接顯示系統採用的四張投保級距表（資料來自系統設定的級距）。 */
export function BracketTables({ brackets }: { brackets: InsuranceBrackets }) {
  const [tab, setTab] = useState<keyof InsuranceBrackets>("labor");
  const rows = toRows(brackets[tab]);

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs transition-colors",
              tab === t.key ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-accent",
            )}
          >
            {t.label}
            <span className="ml-1 opacity-70">{t.desc}</span>
          </button>
        ))}
      </div>
      <div className="max-h-80 overflow-auto rounded-md border">
        <Table>
          <TableHeader className="sticky top-0 bg-background">
            <TableRow>
              <TableHead className="w-14">等級</TableHead>
              <TableHead className="text-right">月薪資總額下限</TableHead>
              <TableHead className="text-right">月薪資總額上限</TableHead>
              <TableHead className="text-right">月投保金額</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.level}>
                <TableCell className="text-muted-foreground">{r.level}</TableCell>
                <TableCell className="text-right tabular-nums">{ntd(r.lower)}</TableCell>
                <TableCell className="text-right tabular-nums">{r.upperLabel}</TableCell>
                <TableCell className="text-right font-medium tabular-nums">{ntd(r.amount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">
        月薪資總額落在「下限～上限」區間者，即以該級「月投保金額」投保；超過最高一級以最高級計（觸頂）。
      </p>
    </div>
  );
}
