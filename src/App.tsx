import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { usePayrollStore } from "@/store/usePayrollStore";
import { validateAll } from "@/lib/validation";
import { OverviewView } from "@/views/OverviewView";
import { ParametersView } from "@/views/ParametersView";
import { EmployeesView } from "@/views/EmployeesView";
import { DependentsView } from "@/views/DependentsView";
import { SalaryStructureView } from "@/views/SalaryStructureView";
import { PayrollView } from "@/views/PayrollView";
import { TaxView } from "@/views/TaxView";
import { BonusView } from "@/views/BonusView";
import { DeptCostView } from "@/views/DeptCostView";
import { PayslipView } from "@/views/PayslipView";

const TABS = [
  { value: "overview", label: "使用說明", layer: "文件" },
  { value: "parameters", label: "參數設定", layer: "參數" },
  { value: "employees", label: "員工清單", layer: "主檔" },
  { value: "dependents", label: "眷屬名冊", layer: "主檔" },
  { value: "salary", label: "薪資結構", layer: "主檔" },
  { value: "payroll", label: "薪資總表", layer: "計算" },
  { value: "tax", label: "所得稅扣繳對照", layer: "計算" },
  { value: "bonus", label: "獎金扣繳試算", layer: "計算" },
  { value: "deptcost", label: "部門成本彙總", layer: "輸出" },
  { value: "payslip", label: "薪資條", layer: "輸出" },
];

export default function App() {
  const [tab, setTab] = useState("overview");
  const { employees, salaries, dependents, events, parameters, currentPeriod } =
    usePayrollStore();
  const periodEvents = events.filter((e) => e.period === currentPeriod);
  const issues = validateAll(employees, salaries, dependents, periodEvents, parameters);
  const errors = issues.filter((i) => i.severity === "error").length;
  const warnings = issues.filter((i) => i.severity === "warning").length;

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto max-w-[1400px] px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                台灣合規薪資計算系統
              </h1>
              <p className="text-sm text-muted-foreground">
                {parameters.year}　月薪制受僱者　React + shadcn 參考實作（資料存於本機瀏覽器 localStorage）
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">發薪期間 {currentPeriod}</Badge>
              {errors > 0 ? (
                <Badge variant="destructive">{errors} 項錯誤</Badge>
              ) : (
                <Badge variant="success">合規檢核通過</Badge>
              )}
              {warnings > 0 && <Badge variant="warning">{warnings} 項提醒</Badge>}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex h-auto flex-wrap justify-start gap-1">
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="text-xs">
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview">
            <OverviewView issues={issues} onNavigate={setTab} />
          </TabsContent>
          <TabsContent value="parameters">
            <ParametersView />
          </TabsContent>
          <TabsContent value="employees">
            <EmployeesView />
          </TabsContent>
          <TabsContent value="dependents">
            <DependentsView />
          </TabsContent>
          <TabsContent value="salary">
            <SalaryStructureView />
          </TabsContent>
          <TabsContent value="payroll">
            <PayrollView />
          </TabsContent>
          <TabsContent value="tax">
            <TaxView />
          </TabsContent>
          <TabsContent value="bonus">
            <BonusView />
          </TabsContent>
          <TabsContent value="deptcost">
            <DeptCostView />
          </TabsContent>
          <TabsContent value="payslip">
            <PayslipView />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t bg-background py-4 text-center text-xs text-muted-foreground">
        計算邏輯依 README §5、捨入依 §6、驗收依 §9；法定參數見 §4（來源01–05）。
        與勞保局／健保署繳款單容許 ±1 元差異，以繳款單為對帳基準（§6）。
      </footer>
    </div>
  );
}
