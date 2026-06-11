import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePayrollStore } from "@/store/usePayrollStore";
import type { ValidationIssue } from "@/lib/validation";
import { AlertTriangle, CheckCircle2, RotateCcw, Trash2 } from "lucide-react";

const FLOW = [
  ["參數層", "參數設定＋四張投保級距表（年度維護，P1/P2 單一來源）"],
  ["主檔層", "員工清單・眷屬名冊・薪資結構（核薪時維護）"],
  ["計算層", "薪資總表（每月變動輸入）・所得稅扣繳對照・獎金扣繳試算"],
  ["輸出層", "部門成本彙總・薪資條"],
];

export function OverviewView({
  issues,
  onNavigate,
}: {
  issues: ValidationIssue[];
  onNavigate: (tab: string) => void;
}) {
  const resetToSeed = usePayrollStore((s) => s.resetToSeed);
  const clearAll = usePayrollStore((s) => s.clearAll);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>使用說明</CardTitle>
          <CardDescription>
            本系統為 README 規格之 React + shadcn 落地實作。法定轉換管線：固定薪資設定 ＋
            當月變動事件 ──法定規則──► 應發／代扣／實發／雇主成本／申報基礎。資料即時存於本機瀏覽器
            localStorage，不上傳伺服器。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-medium">每月操作流程（對照附錄B §B4）</p>
            <ol className="ml-5 list-decimal space-y-1 text-muted-foreground">
              <li>於上方確認／切換發薪期間</li>
              <li>「薪資總表」填當月變動項（加班時數、獎金、請假、其他加減項）</li>
              <li>「所得稅扣繳對照」之建議稅額，人工轉填回總表「代扣所得稅」欄（four-eyes，§7）</li>
              <li>確認「部門成本彙總」差異列＝0（V3 勾稽）</li>
              <li>「薪資條」逐人輸出（§23 薪資明細義務）</li>
            </ol>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {FLOW.map(([k, v]) => (
              <div key={k} className="rounded-md border p-3">
                <Badge variant="secondary">{k}</Badge>
                <p className="mt-1 text-xs text-muted-foreground">{v}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={resetToSeed}>
              <RotateCcw /> 還原為 8 名測試員工（TC-9 基準）
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (confirm("確定清空所有員工資料？（參數與級距表保留）")) clearAll();
              }}
            >
              <Trash2 /> 清空員工資料
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            合規檢核（§8）
          </CardTitle>
          <CardDescription>V1 最低工資／V2 眷屬參照／V4 加班上限／V6 申報表收件</CardDescription>
        </CardHeader>
        <CardContent>
          {issues.length === 0 ? (
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="size-5" />
              <span className="text-sm font-medium">全部通過，無待處理事項</span>
            </div>
          ) : (
            <ul className="space-y-2">
              {issues.map((i, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 rounded-md border p-2 text-sm"
                >
                  <AlertTriangle
                    className={
                      i.severity === "error"
                        ? "mt-0.5 size-4 shrink-0 text-destructive"
                        : "mt-0.5 size-4 shrink-0 text-amber-500"
                    }
                  />
                  <span>
                    <Badge
                      variant={i.severity === "error" ? "destructive" : "warning"}
                      className="mr-1"
                    >
                      {i.rule}
                    </Badge>
                    {i.message}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Button
            variant="link"
            size="sm"
            className="mt-2 px-0"
            onClick={() => onNavigate("payroll")}
          >
            前往薪資總表 →
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
