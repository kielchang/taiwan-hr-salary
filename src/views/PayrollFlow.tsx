import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Stepper, type Step } from "@/components/Stepper";
import { MonthlyView } from "@/views/MonthlyView";
import { ReviewView } from "@/views/ReviewView";
import { ReportsView } from "@/views/ReportsView";
import { usePayrollStore } from "@/store/usePayrollStore";
import { formatPeriod } from "@/lib/utils";

export type PayrollStep = "monthly" | "review" | "reports";

const STEPS: Step[] = [
  { key: "monthly", label: "① 輸入當月異動", hint: "加班・請假・獎金" },
  { key: "review", label: "② 查核與確認", hint: "總覽・檢查・確認" },
  { key: "reports", label: "③ 報表與薪資條", hint: "匯總・扣繳・列印" },
];

export function PayrollFlow({
  step,
  onStep,
}: {
  step: PayrollStep;
  onStep: (s: PayrollStep) => void;
}) {
  const { currentPeriod, setCurrentPeriod, confirmations } = usePayrollStore();
  const confirmed = Boolean(confirmations[currentPeriod]);

  return (
    <div className="space-y-5">
      {/* 步驟提示列 */}
      <Card className="print:hidden">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-base font-bold">每月薪資作業</h1>
              <p className="text-xs text-muted-foreground">依下列三步驟完成本月發薪。</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">發薪月份</span>
              <Input
                type="month"
                className="h-8 w-36 col-input"
                value={currentPeriod}
                onChange={(e) => e.target.value && setCurrentPeriod(e.target.value)}
              />
              {confirmed ? (
                <Badge variant="success">已確認</Badge>
              ) : (
                <Badge variant="outline">未確認</Badge>
              )}
            </div>
          </div>
          <Stepper
            steps={STEPS}
            current={step}
            completed={{ review: confirmed }}
            onStep={(k) => onStep(k as PayrollStep)}
          />
          <p className="text-center text-xs text-muted-foreground">
            {step === "monthly" && "為有加班、請假或獎金的員工填入異動；其餘維持固定薪資。完成後前往下一步。"}
            {step === "review" && "檢視全公司試算與系統檢查，無誤後按「確認本月結算」。"}
            {step === "reports" && "產出匯總報表、代扣所得稅清單與每位員工的薪資條，可直接列印。"}
          </p>
        </CardContent>
      </Card>

      {/* 目前步驟內容（共用發薪月份，步驟列已提供，子頁不再重複顯示） */}
      {step === "monthly" && <MonthlyView showPeriodPicker={false} onNext={() => onStep("review")} />}
      {step === "review" && (
        <ReviewView onBack={() => onStep("monthly")} onNext={() => onStep("reports")} />
      )}
      {step === "reports" && <ReportsView />}

      {/* 期間提示（列印時隱藏） */}
      <p className="text-center text-xs text-muted-foreground print:hidden">
        目前處理期間：{formatPeriod(currentPeriod)}
      </p>
    </div>
  );
}
