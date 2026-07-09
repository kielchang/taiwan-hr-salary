// ─────────────────────────────────────────────────────────────────────────
// 衍生讀取層（derived reads）：把 store 的原始狀態，經純函數計算模組（§5）轉成
// 當月薪資結算列與彙總。設計原理：
//
// ── 純函數 + 薄 hook 兩層
//   核心（`buildPayrollRows`/`isActiveInPeriod`/`ytdBonusBefore`/`sumTotals`）皆為
//   **明確吃參數的純函數**——可測、可算任一期間、可用歷史資料重算（月結快照、趨勢、環比皆靠此）。
//   `useXxx` 只是薄殼：訂閱 store 當前狀態後轉呼叫純函數。衍生值不入 store，保持 state 精簡。
//
// ── 為何算得出「破月」
//   `buildPayrollRows` 把 `{ period, leavePolicy }` 傳進 `calculatePayroll`，計算層才會啟用
//   破月（payFactor/勞保按天）；不傳 period 的呼叫（如驗收）則全月＝1（TC-9 不變量）。
//
// ── 在職過濾（isActiveInPeriod）刻意排除「整月無給休假」
//   避免產生 0 薪卻仍被扣保費、實發為負的列；這些人仍出現在停保名冊與主檔，只是不列入計薪。
//
// ── 累計獎金自動化（ytdBonusBefore）
//   由系統累加「本期之前同年度的 monthlyBonus」取代人工記憶，直接餵二代健保 4× 門檻判斷。
// ─────────────────────────────────────────────────────────────────────────
import { calculatePayroll, type PayrollResult, leaveSegments, segmentRatio } from "@/lib/calc";
import { companySupplementary } from "@/lib/calc";
import type { Employee, SalaryStructure, Dependent, MonthlyEvent, LeavePolicy, Subsidy, FxPolicy } from "@/lib/types";
import type { Parameters } from "@/config/parameters";
import type { InsuranceBrackets } from "@/config/brackets";
import { usePayrollStore, blankEvent, DEFAULT_LEAVE_POLICY } from "./usePayrollStore";

/**
 * 該員工於某期間是否列入計薪（undefined 狀態＝在職）。
 * 未到職／離職前月＝否；整月且無給之留停/停職/暫離＝否（避免 0 薪列被扣保費成負實發，
 * 仍出現在停保名冊與主檔）；部分月或有給之非在職＝是（由 payFactor 依比例計）。
 */
export function isActiveInPeriod(emp: Employee, period: string, leavePolicy: LeavePolicy = DEFAULT_LEAVE_POLICY): boolean {
  const [y, m] = period.split("-").map(Number);
  if (!y || !m) return true;
  const monthEnd = new Date(y, m, 0);
  const monthStart = new Date(y, m - 1, 1);
  if (emp.hireDate && new Date(emp.hireDate) > monthEnd) return false; // 尚未到職
  if (emp.status === "離職" && emp.leaveDate && new Date(emp.leaveDate) < monthStart) return false; // 期前已離職
  // 整月被「無給(ratio 0)」的留停/停職/暫離段完整覆蓋 → 不列入計薪（B-1：逐日檢查，支援多段）。
  const segs = leaveSegments(emp).map((s) => ({
    from: new Date(s.from).getTime(),
    to: s.to ? new Date(s.to).getTime() : Infinity,
    ratio: segmentRatio(s, leavePolicy),
  }));
  if (segs.length) {
    const total = monthEnd.getDate();
    let allZeroCovered = true;
    for (let d = 1; d <= total; d++) {
      const t = new Date(y, m - 1, d).getTime();
      const seg = segs.find((s) => t >= s.from && t < s.to);
      if (!seg || seg.ratio !== 0) { allZeroCovered = false; break; }
    }
    if (allZeroCovered) return false;
  }
  return true;
}

export interface PayrollRow extends PayrollResult {
  name: string;
  department: string;
  costCenter: string;
  project: string;
}

const blankSalary = (employeeId: string): SalaryStructure => ({
  employeeId, baseSalary: 0, managerAllowance: 0, dutyAllowance: 0, professionalAllowance: 0,
  mealAllowance: 0, transportAllowance: 0, attendanceBonus: 0, otherFixedAllowance: 0,
});

export interface PayrollData {
  employees: Employee[];
  salaries: SalaryStructure[];
  dependents: Dependent[];
  events: MonthlyEvent[];
  parameters: Parameters;
  brackets: InsuranceBrackets;
  leavePolicy?: LeavePolicy;
  subsidies?: Subsidy[]; // 區間補貼（於本期生效者注入計薪）
  fxPolicy?: FxPolicy; // 外幣政策（未啟用或缺省＝完全無外幣分支，TC-9 不變）
  fxRates?: Record<string, Record<string, number>>; // 幣別→期別→匯率
}

/**
 * 解析某員工當期「有效外幣」：當期覆寫優先於薪資結構固定值；僅在 fxPolicy 啟用且有金額時回傳。
 * 匯率取當期匯率表（未設＝0，仍回傳供顯示「未設匯率」）。回傳 undefined＝無外幣分支（保 TC-9）。
 */
function resolveFx(
  salary: SalaryStructure,
  event: MonthlyEvent,
  period: string,
  fxPolicy?: FxPolicy,
  fxRates?: Record<string, Record<string, number>>,
): { currency: string; amount: number; rate: number; policy: FxPolicy } | undefined {
  if (!fxPolicy?.enabled) return undefined;
  const fp = event.foreignOverride ?? salary.foreignPay ?? null;
  if (!fp || !fp.amount) return undefined;
  // 註：刻意**不**檢查該幣別 currencies[].enabled——停用幣別只收合「新指派下拉」（各表單已 filter c.enabled），
  //     既有 foreignPay 仍照算，避免停用幣別時回溯抹除歷史月的外幣台幣約當（造成新的快照/即時漂移）。
  const rate = fxRates?.[fp.currency]?.[period] ?? 0;
  return { currency: fp.currency, amount: fp.amount, rate, policy: fxPolicy };
}

/** 該員工於某期間生效的區間補貼（from≤period≤to 且命中族群）。 */
function activeSubsidies(subsidies: Subsidy[], employeeId: string, period: string): Subsidy[] {
  return subsidies.filter((s) => s.targetEmployeeIds.includes(employeeId) && s.from <= period && period <= s.to);
}

/**
 * 純函數：計算指定期間全體在職員工之薪資結算列（供 hook 與跨期重算共用）。
 * 區間補貼於此注入（不改計算核心簽章）：計入投保者→當臨時 customAllowance 併入月薪資總額（影響保費/加班/最低工資）；
 * 不計投保者→加進 event.otherAddition（只進實發、不動級距）。無補貼＝結構不變（TC-9 逐位元不變）。
 */
export function buildPayrollRows(period: string, data: PayrollData): PayrollRow[] {
  const { employees, salaries, dependents, events, parameters, brackets } = data;
  const leavePolicy = data.leavePolicy ?? DEFAULT_LEAVE_POLICY;
  const subsidies = data.subsidies ?? [];
  return employees.filter((emp) => isActiveInPeriod(emp, period, leavePolicy)).map((emp) => {
    let salary = salaries.find((s) => s.employeeId === emp.id) ?? blankSalary(emp.id);
    let event = events.find((e) => e.employeeId === emp.id && e.period === period) ?? blankEvent(emp.id, period);
    const active = activeSubsidies(subsidies, emp.id, period);
    if (active.length) {
      const insured = active.filter((s) => s.insured);
      const nonInsured = active.filter((s) => !s.insured);
      if (insured.length) salary = { ...salary, customAllowances: [...(salary.customAllowances ?? []), ...insured.map((s) => ({ id: `SUB${s.id}`, name: s.name, amount: s.amount }))] };
      if (nonInsured.length) event = { ...event, otherAddition: event.otherAddition + nonInsured.reduce((a, s) => a + s.amount, 0) };
    }
    const fx = resolveFx(salary, event, period, data.fxPolicy, data.fxRates);
    const result = calculatePayroll(emp, salary, dependents, event, parameters, brackets, { period, leavePolicy, fx });
    return { ...result, name: emp.name, department: emp.department, costCenter: emp.costCenter, project: emp.project };
  });
}

/** 計算當月（currentPeriod）全體員工薪資結算 */
export function usePayrollRows(): PayrollRow[] {
  const { employees, salaries, dependents, events, parameters, brackets, currentPeriod, leavePolicy, subsidies, fxPolicy, fxRates } = usePayrollStore();
  return buildPayrollRows(currentPeriod, { employees, salaries, dependents, events, parameters, brackets, leavePolicy, subsidies, fxPolicy, fxRates });
}

/** 計算指定期間全體員工薪資結算（檢視歷史/其他月份用） */
export function usePayrollRowsFor(period: string): PayrollRow[] {
  const { employees, salaries, dependents, events, parameters, brackets, leavePolicy, subsidies, fxPolicy, fxRates } = usePayrollStore();
  return buildPayrollRows(period, { employees, salaries, dependents, events, parameters, brackets, leavePolicy, subsidies, fxPolicy, fxRates });
}

export interface Totals {
  count: number;
  grossPay: number;
  overtimePay: number;
  monthlyBonus: number;
  netPay: number;
  employerBurden: number;
  employerTotalCost: number;
}

export function sumTotals(rows: PayrollRow[], bonusByEmp: Map<string, number>): Totals {
  return rows.reduce<Totals>(
    (acc, r) => ({
      count: acc.count + 1,
      grossPay: acc.grossPay + r.grossPay,
      overtimePay: acc.overtimePay + r.overtimePay,
      monthlyBonus: acc.monthlyBonus + (bonusByEmp.get(r.employeeId) ?? 0),
      netPay: acc.netPay + r.netPay,
      employerBurden: acc.employerBurden + r.employerBurden,
      employerTotalCost: acc.employerTotalCost + r.employerTotalCost,
    }),
    {
      count: 0,
      grossPay: 0,
      overtimePay: 0,
      monthlyBonus: 0,
      netPay: 0,
      employerBurden: 0,
      employerTotalCost: 0,
    },
  );
}

/**
 * 該員工「本期之前」的年度累計獎金（同一年份、期別小於 period 之 monthlyBonus 合計）。
 * 供編輯對話框自動帶入累計值：系統累計＝本值＋本月發放，取代人工記憶（影響二代健保 4× 門檻）。
 */
export function ytdBonusBefore(events: MonthlyEvent[], employeeId: string, period: string): number {
  const year = period.slice(0, 4);
  return events
    .filter((e) => e.employeeId === employeeId && e.period.startsWith(year) && e.period < period)
    .reduce((a, e) => a + e.monthlyBonus, 0);
}

/** 投保單位（公司）二代健保補充保費（差額制，§5.7） */
export function useCompanySupplementary(rows: PayrollRow[]): number {
  const parameters = usePayrollStore((s) => s.parameters);
  const totalGross = rows.reduce((a, r) => a + r.grossPay, 0);
  const totalHealthInsured = rows.reduce((a, r) => a + r.insured.health, 0);
  return companySupplementary(totalGross, totalHealthInsured, parameters);
}
