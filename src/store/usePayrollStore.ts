// ─────────────────────────────────────────────────────────────────────────
// 應用狀態（single source of truth）— zustand ＋ persist middleware，寫入瀏覽器
// localStorage（純前端、離線可用、無後端）。以下是這支 store 的設計原理，改動前必讀。
//
// ── 分層邊界
//   store 只做「狀態＋mutation＋稽核」；計算全部委給純函數層 `lib/calc/*`（store 呼叫 calc，
//   calc 絕不 import store）。衍生讀取（列表/在職判定/累計獎金）放 `store/selectors.ts`，
//   不塞進 store，維持 state 精簡、可序列化。
//
// ── 硬鎖定（hard-lock，使用者拍板；勿改回舊行為）
//   `isPeriodLocked(confirmations, period)`＝該月已確認＝資料凍結。所有「影響薪資計算」的
//   mutation 在當期已確認時一律 **no-op（直接 return st）**：參數/級距/給薪政策/薪資/眷屬/
//   事件/調薪核定…。員工主檔只鎖「影響計算的欄位」（`EMP_PAY_FIELDS`），聯絡資訊等仍可改。
//   UI 需**預先攔截並提示「先取消確認」**。**不要**改回「編輯即自動解除確認」的舊設計
//   （會讓已申報月份被無聲改動）。
//
// ── 確認 / 快照（月結凍結與趨勢一致性）
//   `confirmPeriod` 蓋確認時戳；`unconfirmPeriod` 會**一併刪除該期快照**，重新確認時以最新
//   資料重建——避免趨勢圖/環比讀到失真的舊快照。
//
// ── 稽核（可追溯）
//   敏感異動都經 `makeAudit`＋`pushAudit` 追加一筆（最新在前、上限 `AUDIT_CAP`＝1000）；
//   actor＝`operatorName`。新增 mutation 請記得補稽核（見 CLAUDE.md 鐵律 7）。
//
// ── 刪除連鎖（不留孤兒資料）
//   `removeEmployee` 會連帶清除該員的薪資/眷屬/事件/打卡/工時分攤/申報基準/排程調薪/分析對應，
//   確保沒有指向已刪員工的殘留資料。
//
// ── persist 相容策略（免逐欄 migration）
//   `version`＝`STORE_VERSION`；`migrate` 只處理**結構性**升級（v1→v2：由 employees[].project
//   合成專案主檔）。新增的「選填欄位」靠 `merge` 與預設**深度合併**自動補上，故多數新功能
//   免寫 migration（如 leavePolicy/salaryDefaults/customAllowances 皆選填、合併相容）。
// ─────────────────────────────────────────────────────────────────────────
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { APP_ENV } from "@/version";
import { DEFAULT_PARAMETERS, type Parameters } from "@/config/parameters";
import { DEFAULT_BRACKETS, type InsuranceBrackets } from "@/config/brackets";
import type {
  Employee,
  SalaryStructure,
  Dependent,
  MonthlyEvent,
  PunchRecord,
  AttendanceConfig,
  AnalyticsConfig,
  PayGrade,
  RatingTier,
  BonusScenario,
  RaiseScenario,
  PlanningConfig,
  PayrollSnapshot,
  AuditEntry,
  AuditAction,
  DeclaredInsured,
  Project,
  Allocation,
  ScheduledRaise,
  LeavePolicy,
} from "@/lib/types";

/** 新進員工預設固定薪資範本（8 標準欄 partial ＋ 自訂津貼範本） */
export type SalaryDefaults = { standard: Partial<Omit<SalaryStructure, "employeeId" | "customAllowances">>; custom: { name: string; amount: number }[] };
export const DEFAULT_LEAVE_POLICY: LeavePolicy = { 留停: 0, 停職: 0, 暫離: 0 };
export const EMPTY_SALARY_DEFAULTS: SalaryDefaults = { standard: {}, custom: [] };
import { DEFAULT_ANALYTICS } from "@/config/analytics";
import { serializeState, type BackupEnvelope } from "@/lib/backup";
import { buildDemoData } from "@/data/seed";
import { buildDemoCompany } from "@/data/demoCompany";

// 開箱預設＝示範公司（約 60 人，含多月歷史與各種狀態）。
// persist 水合後若已有本機資料則覆蓋此預設；僅新安裝/還原/清空後套用。
const DEMO = buildDemoCompany();

// localStorage 鍵：**依環境分隔**。三環境（prod/stage/dev）同 origin（kielchang.github.io，
// 僅路徑不同），localStorage 依 origin 共用；若不分鍵，在 /dev 動資料會污染正式站與 /stage。
// 正式站保留原鍵（不改＝既有使用者資料不流失）；stage/dev 各自加後綴，資料互不干擾。
export const STORAGE_KEY = `taiwan-hr-salary:v1${APP_ENV === "stage" ? ":stage" : APP_ENV === "dev" ? ":dev" : ""}`;
export const STORE_VERSION = 3; // 資料結構版本（v2：專案主檔＋工時分攤；v3：留停/停職/暫離改多段 leaveRecords）

/**
 * B-1 遷移（v2→v3）：把舊單段留停/停職/暫離（status＋leaveDate＋returnDate＋leavePaidRatio）
 * 轉成 `leaveRecords` 陣列（新權威來源）。已是新模型（有 leaveRecords）或非在假/缺生效日者原樣返回，
 * 故舊資料與 TC-9／示範公司皆逐位元不變（純函數，供 migrate 與測試共用）。
 */
export function backfillLeaveRecords(employees: Employee[]): Employee[] {
  const LEAVE = ["留停", "停職", "暫離"];
  return employees.map((e) => {
    if (e.leaveRecords && e.leaveRecords.length) return e; // 已是新模型
    if (e.status && LEAVE.includes(e.status) && e.leaveDate) {
      return { ...e, leaveRecords: [{ status: e.status as "留停" | "停職" | "暫離", from: e.leaveDate, to: e.returnDate ?? null, paidRatio: e.leavePaidRatio ?? null }] };
    }
    return e;
  });
}

const DEFAULT_ATTENDANCE: AttendanceConfig = {
  companyLat: null,
  companyLng: null,
  radiusMeters: 200,
  blockOutOfFence: false,
  ipCheckEnabled: false,
  allowedIps: [],
  flexEnabled: true,
  flexEarliestIn: "08:00",
  flexLatestIn: "10:00",
  requiredWorkMinutes: 480,
  breakMinutes: 60,
  coreStart: "10:00",
  coreEnd: "16:00",
};

const blankSalary = (employeeId: string): SalaryStructure => ({
  employeeId,
  baseSalary: 0,
  managerAllowance: 0,
  dutyAllowance: 0,
  professionalAllowance: 0,
  mealAllowance: 0,
  transportAllowance: 0,
  attendanceBonus: 0,
  otherFixedAllowance: 0,
});

export const blankEvent = (employeeId: string, period: string): MonthlyEvent => ({
  employeeId,
  period,
  overtimeWeekday1: 0,
  overtimeWeekday2: 0,
  overtimeRestday1: 0,
  overtimeRestday2: 0,
  overtimeHoliday: 0,
  personalLeaveHours: 0,
  sickLeaveHours: 0,
  monthlyBonus: 0,
  cumulativeBonus: 0,
  otherAddition: 0,
  otherDeduction: 0,
  withheldTax: null,
});

interface PayrollState {
  parameters: Parameters;
  brackets: InsuranceBrackets;
  employees: Employee[];
  salaries: SalaryStructure[];
  dependents: Dependent[];
  events: MonthlyEvent[]; // 跨期間扁平儲存，以 employeeId+period 識別
  currentPeriod: string;

  /** 公司各非在職狀態（留停/停職/暫離）之預設給薪比例；員工可逐案覆寫 */
  leavePolicy: LeavePolicy;
  setLeavePolicy: (patch: Partial<LeavePolicy>) => void;
  /** 新進員工預設固定薪資/津貼範本（openNew 帶入；可再改） */
  salaryDefaults: SalaryDefaults;
  setSalaryDefaults: (v: SalaryDefaults) => void;

  /** 出勤打卡（額外模組） */
  attendance: AttendanceConfig;
  punches: PunchRecord[];
  setAttendance: (patch: Partial<AttendanceConfig>) => void;
  addPunch: (record: PunchRecord) => void;
  importPunches: (records: PunchRecord[]) => void;
  removePunch: (id: string) => void;
  clearPunches: () => void;

  /** 薪酬分析與試算（額外模組；試算不寫回薪資） */
  analytics: AnalyticsConfig;
  setBonusScenario: (patch: Partial<BonusScenario>) => void;
  setRaiseScenario: (patch: Partial<RaiseScenario>) => void;
  upsertPayGrade: (grade: PayGrade) => void;
  removePayGrade: (id: string) => void;
  setEmployeeGrade: (employeeId: string, gradeId: string | null) => void;
  setEmployeeRating: (employeeId: string, ratingKey: string) => void;
  setRatingTiers: (tiers: RatingTier[]) => void;
  setPlanning: (patch: Partial<PlanningConfig>) => void;

  /** 薪酬趨勢快照（每期一筆，供趨勢儀表板） */
  snapshots: PayrollSnapshot[];
  saveSnapshot: (snapshot: PayrollSnapshot) => void;
  removeSnapshot: (period: string) => void;
  clearSnapshots: () => void;
  /** 一鍵載入多月示範資料（回填過去數月事件＋趨勢快照；當月資料保留） */
  loadDemoData: (months?: number) => void;

  /** 初始設定引導是否已完成（false → 顯示設定精靈） */
  setupCompleted: boolean;
  completeSetup: () => void;
  reopenSetup: () => void;

  /** 每月結算之人事確認紀錄：period → 確認時間（ISO）。已確認＝硬鎖定：需先取消確認才能異動薪資資料 */
  confirmations: Record<string, string>;
  confirmPeriod: (period: string) => void;
  unconfirmPeriod: (period: string) => void;

  // 設定
  setParameters: (patch: Partial<Parameters>) => void;
  setBrackets: (patch: Partial<InsuranceBrackets>) => void;
  setCurrentPeriod: (period: string) => void;

  // 員工主檔
  upsertEmployee: (emp: Employee) => void;
  removeEmployee: (id: string) => void;

  // 薪資結構
  upsertSalary: (s: SalaryStructure) => void;
  getSalary: (employeeId: string) => SalaryStructure;

  // 眷屬
  upsertDependent: (d: Dependent) => void;
  removeDependent: (id: string) => void;
  /** 以人為單位整批覆寫某員工之眷屬（基本資料編輯視窗用） */
  setEmployeeDependents: (employeeId: string, deps: Dependent[]) => void;

  // 每月變動事件
  upsertEvent: (e: MonthlyEvent) => void;
  getEvent: (employeeId: string, period: string) => MonthlyEvent;

  resetToSeed: () => void;
  clearAll: () => void;

  /** 整檔備份/還原 */
  exportAll: () => BackupEnvelope;
  importAll: (env: BackupEnvelope) => void;

  /** 操作者（稽核軌跡 actor；單機版以姓名識別） */
  operatorName: string;
  setOperatorName: (name: string) => void;

  /** 稽核軌跡 */
  auditLog: AuditEntry[];
  clearAuditLog: () => void;
  /** F6：把某筆可回復稽核（逐欄編輯）的記錄還原成變更前的值；鎖定期間 no-op（UI 預攔）。回復本身另記一筆稽核。 */
  restoreAudit: (id: string) => void;

  /** 批次匯入員工＋薪資 */
  importEmployees: (rows: { employee: Employee; salary: SalaryStructure }[]) => void;

  /** 調薪方案核定寫回薪資（four-eyes 確認後） */
  applyRaise: (rows: { employeeId: string; newSalary: number }[], note?: string) => void;

  /** 調薪排程（核定於未來月份生效；到期由工作台套用） */
  scheduledRaises: ScheduledRaise[];
  scheduleRaises: (items: Omit<ScheduledRaise, "id">[]) => void;
  cancelScheduledRaise: (id: string) => void;
  /** 套用一筆到期排程（寫回薪資＋移除排程＋稽核） */
  applyScheduledRaise: (id: string) => void;

  /** 投保級距申報基準（2/8 月申報調整） */
  declaredInsured: DeclaredInsured[];
  setDeclaredBaseline: (list: DeclaredInsured[]) => void;

  /** 專案主檔 */
  projects: Project[];
  upsertProject: (p: Project) => void;
  removeProject: (id: string) => void;

  /** 每員工每月工時分攤 */
  allocations: Allocation[];
  upsertAllocation: (a: Allocation) => void;
  getAllocation: (employeeId: string, period: string) => Allocation | undefined;
}

/** 硬鎖定判斷：期間已確認即鎖定，需先取消確認才能異動薪資相關資料 */
export const isPeriodLocked = (confirmations: Record<string, string>, period: string): boolean =>
  Boolean(confirmations[period]);

/** 影響薪資計算的員工主檔欄位（當期已確認時鎖定這些欄位的變更；聯絡資訊等仍可修改） */
const EMP_PAY_FIELDS = [
  "hireDate", "status", "leaveDate", "returnDate", "leavePaidRatio", "voluntaryPensionRate",
  "taxResidency", "withholdingMethod", "exemptionFormReceivedDate",
] as const;
const empPayFieldsChanged = (prev: Employee, next: Employee): boolean =>
  EMP_PAY_FIELDS.some((k) => (prev[k] ?? null) !== (next[k] ?? null));

const AUDIT_CAP = 1000;
const newId = () =>
  (typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
const sumSalary = (s: SalaryStructure) =>
  s.baseSalary + s.managerAllowance + s.dutyAllowance + s.professionalAllowance +
  s.mealAllowance + s.transportAllowance + s.attendanceBonus + s.otherFixedAllowance;

function makeAudit(actor: string, action: AuditAction, summary: string, extra: Partial<AuditEntry> = {}): AuditEntry {
  return { id: newId(), at: new Date().toISOString(), actor: actor?.trim() || "（未具名）", action, summary, ...extra };
}
const pushAudit = (log: AuditEntry[], entry: AuditEntry) => [entry, ...log].slice(0, AUDIT_CAP);

/** F6：此筆稽核是否可「回復」＝有結構化 before/after 的逐欄編輯，且本身不是回復動作。 */
export function auditRestorable(e: AuditEntry): boolean {
  return !!e.restoreKind && e.before != null && e.after != null && !e.restoredFrom;
}

export const usePayrollStore = create<PayrollState>()(
  persist(
    (set, get) => ({
      parameters: DEFAULT_PARAMETERS,
      brackets: DEFAULT_BRACKETS,
      employees: DEMO.employees,
      salaries: DEMO.salaries,
      dependents: DEMO.dependents,
      events: DEMO.events,
      currentPeriod: DEMO.currentPeriod,

      attendance: DEFAULT_ATTENDANCE,
      punches: DEMO.punches,
      setAttendance: (patch) =>
        set((st) => ({ attendance: { ...st.attendance, ...patch } })),
      addPunch: (record) => set((st) => ({ punches: [record, ...st.punches] })),
      importPunches: (records) =>
        set((st) => {
          const existing = new Set(st.punches.map((p) => p.id));
          const add = records.filter((r) => !existing.has(r.id));
          return {
            punches: [...add, ...st.punches],
            auditLog: pushAudit(st.auditLog, makeAudit(st.operatorName, "import", `匯入 ${add.length} 筆打卡紀錄`)),
          };
        }),
      removePunch: (id) =>
        set((st) => ({ punches: st.punches.filter((p) => p.id !== id) })),
      clearPunches: () => set({ punches: [] }),

      analytics: DEMO.analytics,
      setBonusScenario: (patch) =>
        set((st) => ({ analytics: { ...st.analytics, scenario: { ...st.analytics.scenario, ...patch } } })),
      setRaiseScenario: (patch) =>
        set((st) => ({ analytics: { ...st.analytics, raiseScenario: { ...st.analytics.raiseScenario, ...patch } } })),
      upsertPayGrade: (grade) =>
        set((st) => ({
          analytics: {
            ...st.analytics,
            payGrades: st.analytics.payGrades.some((g) => g.id === grade.id)
              ? st.analytics.payGrades.map((g) => (g.id === grade.id ? grade : g))
              : [...st.analytics.payGrades, grade],
          },
        })),
      removePayGrade: (id) =>
        set((st) => {
          const gradeByEmployee = Object.fromEntries(
            Object.entries(st.analytics.gradeByEmployee).filter(([, gid]) => gid !== id),
          );
          return {
            analytics: {
              ...st.analytics,
              payGrades: st.analytics.payGrades.filter((g) => g.id !== id),
              gradeByEmployee,
            },
          };
        }),
      setEmployeeGrade: (employeeId, gradeId) =>
        set((st) => {
          const gradeByEmployee = { ...st.analytics.gradeByEmployee };
          if (gradeId) gradeByEmployee[employeeId] = gradeId;
          else delete gradeByEmployee[employeeId];
          return { analytics: { ...st.analytics, gradeByEmployee } };
        }),
      setEmployeeRating: (employeeId, ratingKey) =>
        set((st) => ({
          analytics: {
            ...st.analytics,
            performanceByEmployee: { ...st.analytics.performanceByEmployee, [employeeId]: ratingKey },
          },
        })),
      setRatingTiers: (tiers) =>
        set((st) => ({ analytics: { ...st.analytics, ratingTiers: tiers } })),
      setPlanning: (patch) =>
        set((st) => ({ analytics: { ...st.analytics, planning: { ...st.analytics.planning, ...patch } } })),

      snapshots: DEMO.snapshots,
      saveSnapshot: (snapshot) =>
        set((st) => ({
          snapshots: [
            ...st.snapshots.filter((s) => s.period !== snapshot.period),
            snapshot,
          ].sort((a, b) => a.period.localeCompare(b.period)),
        })),
      removeSnapshot: (period) =>
        set((st) => ({ snapshots: st.snapshots.filter((s) => s.period !== period) })),
      clearSnapshots: () => set({ snapshots: [] }),

      operatorName: "",
      setOperatorName: (name) => set({ operatorName: name }),

      auditLog: DEMO.auditLog,
      clearAuditLog: () => set({ auditLog: [] }),
      restoreAudit: (id) =>
        set((st) => {
          const entry = st.auditLog.find((a) => a.id === id);
          if (!entry || !auditRestorable(entry)) return st;
          // 鎖定守衛：event 看該筆 period，其餘（主檔類）看當期；已確認即不可回復（同硬鎖定鐵律）。
          const lockPeriod = entry.restoreKind === "event" ? (entry.period ?? st.currentPeriod) : st.currentPeriod;
          if (isPeriodLocked(st.confirmations, lockPeriod)) return st;
          const logEntry = makeAudit(st.operatorName, entry.action, `回復：${entry.summary}`, {
            targetId: entry.targetId,
            period: entry.period,
            restoredFrom: entry.id,
          });
          const auditLog = pushAudit(st.auditLog, logEntry);
          switch (entry.restoreKind) {
            case "salary": {
              const rec = entry.before as SalaryStructure;
              return { salaries: st.salaries.map((x) => (x.employeeId === rec.employeeId ? rec : x)), auditLog };
            }
            case "employee": {
              const rec = entry.before as Employee;
              return { employees: st.employees.map((e) => (e.id === rec.id ? rec : e)), auditLog };
            }
            case "dependent": {
              const rec = entry.before as Dependent;
              return { dependents: st.dependents.map((d) => (d.id === rec.id ? rec : d)), auditLog };
            }
            case "event": {
              const rec = entry.before as MonthlyEvent;
              return {
                events: st.events.map((x) => (x.employeeId === rec.employeeId && x.period === rec.period ? rec : x)),
                auditLog,
              };
            }
            default:
              return st;
          }
        }),

      // 批次匯入＝以員工編號 upsert（同 id 覆蓋、新 id 追加）；不刪除既有未列於匯入檔的員工。
      importEmployees: (rows) =>
        set((st) => {
          let employees = [...st.employees];
          let salaries = [...st.salaries];
          rows.forEach(({ employee, salary }) => {
            employees = employees.some((e) => e.id === employee.id)
              ? employees.map((e) => (e.id === employee.id ? employee : e))
              : [...employees, employee];
            salaries = salaries.some((s) => s.employeeId === employee.id)
              ? salaries.map((s) => (s.employeeId === employee.id ? salary : s))
              : [...salaries, salary];
          });
          return {
            employees,
            salaries,
            auditLog: pushAudit(st.auditLog, makeAudit(st.operatorName, "import", `批次匯入 ${rows.length} 名員工`)),
          };
        }),

      // ── 調薪（兩條路徑）：
      //   1) applyRaise＝**即時核定**，把新月薪寫回 salaries（本批同月生效）。
      //   2) scheduleRaises → applyScheduledRaise＝**排程**，到生效月才由 applyScheduledRaise
      //      轉呼叫 applyRaise 寫回並移除該筆。兩者皆受硬鎖定守衛（已確認月不可寫回）。
      //   寫回策略：新月薪 − 既有加給＝新本薪（**加給不變、差額全落在本薪**），避免動到津貼結構。
      applyRaise: (rows, note) =>
        set((st) => {
          if (isPeriodLocked(st.confirmations, st.currentPeriod)) return st; // 硬鎖定：當期已確認
          // F7：寫回時同步彙整摘要——調整人數、月薪資總額增減合計與平均調幅，寫入稽核（可稽可查）。
          let totalBefore = 0;
          let totalAfter = 0;
          const salaries = st.salaries.map((s) => {
            const r = rows.find((x) => x.employeeId === s.employeeId);
            if (!r) return s;
            const allowances = sumSalary(s) - s.baseSalary; // 加給維持不變，差額套在本薪
            totalBefore += sumSalary(s);
            totalAfter += r.newSalary;
            return { ...s, baseSalary: Math.max(0, r.newSalary - allowances) };
          });
          const delta = totalAfter - totalBefore;
          const avgPct = totalBefore > 0 ? (delta / totalBefore) * 100 : 0;
          const summary =
            `核定調薪：${rows.length} 人寫回薪資，月薪資總額 ${totalBefore.toLocaleString()} → ${totalAfter.toLocaleString()}` +
            `（${delta >= 0 ? "+" : ""}${delta.toLocaleString()}、平均 ${avgPct >= 0 ? "+" : ""}${avgPct.toFixed(1)}%）` +
            `${note ? `（${note}）` : ""}`;
          return {
            salaries,
            auditLog: pushAudit(st.auditLog, makeAudit(st.operatorName, "raiseApply", summary)),
          };
        }),

      scheduledRaises: [],
      scheduleRaises: (items) =>
        set((st) => ({
          scheduledRaises: [
            ...st.scheduledRaises,
            ...items.map((it) => ({ ...it, id: newId() })),
          ],
          auditLog: pushAudit(st.auditLog, makeAudit(st.operatorName, "raiseApply",
            `排程調薪 ${items.length} 人，自 ${items[0]?.effectivePeriod ?? ""} 生效${items[0]?.note ? `（${items[0].note}）` : ""}`)),
        })),
      cancelScheduledRaise: (id) =>
        set((st) => {
          const item = st.scheduledRaises.find((r) => r.id === id);
          return {
            scheduledRaises: st.scheduledRaises.filter((r) => r.id !== id),
            auditLog: item
              ? pushAudit(st.auditLog, makeAudit(st.operatorName, "raiseApply",
                  `取消排程調薪：${item.name}（生效 ${item.effectivePeriod}）`, { targetId: item.employeeId }))
              : st.auditLog,
          };
        }),
      applyScheduledRaise: (id) => {
        const st = get();
        const item = st.scheduledRaises.find((r) => r.id === id);
        if (!item || isPeriodLocked(st.confirmations, st.currentPeriod)) return;
        st.applyRaise([{ employeeId: item.employeeId, newSalary: item.newSalary }], `排程生效 ${item.effectivePeriod}・${item.note}`);
        set((s) => ({ scheduledRaises: s.scheduledRaises.filter((r) => r.id !== id) }));
      },

      declaredInsured: DEMO.declaredInsured,
      setDeclaredBaseline: (list) =>
        set((st) => ({
          declaredInsured: list,
          auditLog: pushAudit(st.auditLog, makeAudit(st.operatorName, "declare",
            `設定投保級距申報基準（${list.length} 名在職員工）`)),
        })),

      projects: DEMO.projects,
      upsertProject: (p) =>
        set((st) => {
          const exists = st.projects.some((x) => x.id === p.id);
          return {
            projects: exists ? st.projects.map((x) => (x.id === p.id ? p : x)) : [...st.projects, p],
            auditLog: pushAudit(st.auditLog, makeAudit(st.operatorName, "project", `${exists ? "更新" : "新增"}專案 ${p.code} ${p.name}`, { targetId: p.id })),
          };
        }),
      removeProject: (id) =>
        set((st) => ({
          projects: st.projects.filter((p) => p.id !== id),
          // 一併清除分攤中對該專案的引用
          allocations: st.allocations.map((a) => ({
            ...a,
            lines: a.lines.filter((l) => l.projectId !== id),
            bonusProjectId: a.bonusProjectId === id ? undefined : a.bonusProjectId,
          })),
          auditLog: pushAudit(st.auditLog, makeAudit(st.operatorName, "project", `刪除專案 ${id}`, { targetId: id })),
        })),

      allocations: DEMO.allocations,
      upsertAllocation: (a) =>
        set((st) => ({
          allocations: st.allocations.some((x) => x.employeeId === a.employeeId && x.period === a.period)
            ? st.allocations.map((x) => (x.employeeId === a.employeeId && x.period === a.period ? a : x))
            : [...st.allocations, a],
          auditLog: pushAudit(st.auditLog, makeAudit(st.operatorName, "allocation",
            `更新 ${a.period} 工時分攤（${a.mode === "hours" ? "時數" : "百分比"}・${a.lines.length} 條）`,
            { targetId: a.employeeId, period: a.period })),
        })),
      getAllocation: (employeeId, period) =>
        get().allocations.find((a) => a.employeeId === employeeId && a.period === period),

      loadDemoData: (months = 6) =>
        set((st) => {
          const { events, snapshots } = buildDemoData(
            st.employees, st.salaries, st.dependents, st.parameters, st.brackets, st.currentPeriod, st.events, months,
          );
          const demoPeriods = new Set(snapshots.map((s) => s.period));
          // 保留當月與非示範月份的既有事件，換上回填的過去月份事件
          const keep = st.events.filter((e) => e.period === st.currentPeriod || !demoPeriods.has(e.period));
          return { events: [...keep, ...events], snapshots };
        }),

      setupCompleted: false,
      completeSetup: () => set({ setupCompleted: true }),
      reopenSetup: () => set({ setupCompleted: false }),

      confirmations: DEMO.confirmations,
      confirmPeriod: (period) =>
        set((st) => ({
          confirmations: { ...st.confirmations, [period]: new Date().toISOString() },
          auditLog: pushAudit(st.auditLog, makeAudit(st.operatorName, "confirm", `確認 ${period} 月結`, { period })),
        })),
      unconfirmPeriod: (period) =>
        set((st) => {
          const { [period]: _removed, ...rest } = st.confirmations;
          return {
            confirmations: rest,
            // 取消確認 → 該期快照一併移除（重新確認時會以最新資料重建，避免趨勢/環比讀到失真快照）
            snapshots: st.snapshots.filter((s) => s.period !== period),
            auditLog: pushAudit(st.auditLog, makeAudit(st.operatorName, "confirm", `取消 ${period} 月結確認（快照已移除）`, { period })),
          };
        }),

      setParameters: (patch) =>
        set((st) => {
          if (isPeriodLocked(st.confirmations, st.currentPeriod)) return st; // 硬鎖定：當期已確認
          return {
            parameters: { ...st.parameters, ...patch },
            auditLog: pushAudit(st.auditLog, makeAudit(st.operatorName, "parameter",
              `更新法定/公司參數：${Object.keys(patch).join("、")}`)),
          };
        }),
      setBrackets: (patch) =>
        set((st) => {
          if (isPeriodLocked(st.confirmations, st.currentPeriod)) return st; // 硬鎖定：當期已確認
          return {
            brackets: { ...st.brackets, ...patch },
            auditLog: pushAudit(st.auditLog, makeAudit(st.operatorName, "parameter",
              `更新投保級距表：${Object.keys(patch).join("、")}`)),
          };
        }),
      setCurrentPeriod: (period) => set({ currentPeriod: period }),

      leavePolicy: DEFAULT_LEAVE_POLICY,
      setLeavePolicy: (patch) =>
        set((st) => {
          if (isPeriodLocked(st.confirmations, st.currentPeriod)) return st; // 硬鎖定：當期已確認
          return {
            leavePolicy: { ...st.leavePolicy, ...patch },
            auditLog: pushAudit(st.auditLog, makeAudit(st.operatorName, "parameter",
              `更新非在職狀態給薪政策：${Object.entries(patch).map(([k, v]) => `${k} ${Math.round((v as number) * 100)}%`).join("、")}`)),
          };
        }),
      salaryDefaults: EMPTY_SALARY_DEFAULTS,
      setSalaryDefaults: (v) =>
        set((st) => ({
          salaryDefaults: v,
          auditLog: pushAudit(st.auditLog, makeAudit(st.operatorName, "parameter", "更新新進員工預設固定薪資/津貼")),
        })),

      upsertEmployee: (raw) =>
        set((st) => {
          // 自提率超界防呆（匯入/還原路徑也經此收斂）
          const emp = { ...raw, voluntaryPensionRate: Math.min(0.06, Math.max(0, raw.voluntaryPensionRate)) };
          const prev = st.employees.find((e) => e.id === emp.id);
          const exists = !!prev;
          // 硬鎖定：當期已確認時，影響薪資計算的主檔欄位不可變更（聯絡資訊等仍放行）
          if (exists && isPeriodLocked(st.confirmations, st.currentPeriod) && empPayFieldsChanged(prev!, emp)) return st;
          const employees = exists
            ? st.employees.map((e) => (e.id === emp.id ? emp : e))
            : [...st.employees, emp];
          const salaries = st.salaries.some((s) => s.employeeId === emp.id)
            ? st.salaries
            : [...st.salaries, blankSalary(emp.id)];
          const statusChanged = prev && (prev.status ?? "在職") !== (emp.status ?? "在職");
          const summary = !exists
            ? `新增員工 ${emp.name}（${emp.id}）`
            : statusChanged
              ? `${emp.name} 狀態 ${prev?.status ?? "在職"} → ${emp.status ?? "在職"}${emp.leaveDate ? `（${emp.leaveDate}）` : ""}`
              : `更新員工 ${emp.name}（${emp.id}）`;
          // F6：僅「更新既有員工」附結構化 before/after 供回復（新增不可回復）。
          const restore = exists ? { restoreKind: "employee" as const, before: prev, after: emp } : {};
          return { employees, salaries, auditLog: pushAudit(st.auditLog, makeAudit(st.operatorName, "employee", summary, { targetId: emp.id, ...restore })) };
        }),
      removeEmployee: (id) =>
        set((st) => {
          const name = st.employees.find((e) => e.id === id)?.name ?? id;
          const { [id]: _g, ...gradeByEmployee } = st.analytics.gradeByEmployee;
          const { [id]: _p, ...performanceByEmployee } = st.analytics.performanceByEmployee;
          return {
            employees: st.employees.filter((e) => e.id !== id),
            salaries: st.salaries.filter((s) => s.employeeId !== id),
            dependents: st.dependents.filter((d) => d.employeeId !== id),
            events: st.events.filter((e) => e.employeeId !== id),
            punches: st.punches.filter((p) => p.employeeId !== id),
            allocations: st.allocations.filter((a) => a.employeeId !== id),
            declaredInsured: st.declaredInsured.filter((d) => d.employeeId !== id),
            scheduledRaises: st.scheduledRaises.filter((r) => r.employeeId !== id),
            analytics: { ...st.analytics, gradeByEmployee, performanceByEmployee },
            auditLog: pushAudit(st.auditLog, makeAudit(st.operatorName, "employee",
              `刪除員工 ${name}（${id}）及其薪資/眷屬/事件/分攤/申報基準`, { targetId: id })),
          };
        }),

      upsertSalary: (s) =>
        set((st) => {
          if (isPeriodLocked(st.confirmations, st.currentPeriod)) return st; // 硬鎖定：當期已確認
          const prev = st.salaries.find((x) => x.employeeId === s.employeeId);
          const exists = !!prev;
          const before = prev ? sumSalary(prev) : 0;
          const after = sumSalary(s);
          const log =
            exists && before !== after
              ? pushAudit(st.auditLog, makeAudit(st.operatorName, "salary",
                  `${st.employees.find((e) => e.id === s.employeeId)?.name ?? s.employeeId} 月薪資總額 ${before} → ${after}`,
                  { targetId: s.employeeId, restoreKind: "salary", before: prev, after: s })) // F6：可回復
              : st.auditLog;
          return {
            salaries: exists
              ? st.salaries.map((x) => (x.employeeId === s.employeeId ? s : x))
              : [...st.salaries, s],
            auditLog: log,
          };
        }),
      getSalary: (employeeId) =>
        get().salaries.find((s) => s.employeeId === employeeId) ??
        blankSalary(employeeId),

      upsertDependent: (d) =>
        set((st) => {
          if (isPeriodLocked(st.confirmations, st.currentPeriod)) return st; // 硬鎖定
          const prev = st.dependents.find((x) => x.id === d.id);
          const restore = prev ? { restoreKind: "dependent" as const, before: prev, after: d } : {}; // F6：僅更新可回復
          return {
            dependents: prev
              ? st.dependents.map((x) => (x.id === d.id ? d : x))
              : [...st.dependents, d],
            auditLog: pushAudit(st.auditLog, makeAudit(st.operatorName, "dependent",
              `異動眷屬 ${d.name}（${d.relationship}）`, { targetId: d.employeeId, ...restore })),
          };
        }),
      removeDependent: (id) =>
        set((st) => {
          if (isPeriodLocked(st.confirmations, st.currentPeriod)) return st; // 硬鎖定
          const dep = st.dependents.find((d) => d.id === id);
          return {
            dependents: st.dependents.filter((d) => d.id !== id),
            auditLog: dep
              ? pushAudit(st.auditLog, makeAudit(st.operatorName, "dependent", `刪除眷屬 ${dep.name}`, { targetId: dep.employeeId }))
              : st.auditLog,
          };
        }),
      setEmployeeDependents: (employeeId, deps) =>
        set((st) => {
          const before = st.dependents.filter((d) => d.employeeId === employeeId);
          const changed = JSON.stringify(before) !== JSON.stringify(deps);
          if (!changed) return st;
          if (isPeriodLocked(st.confirmations, st.currentPeriod)) return st; // 硬鎖定
          return {
            dependents: [
              ...st.dependents.filter((d) => d.employeeId !== employeeId),
              ...deps,
            ],
            auditLog: pushAudit(st.auditLog, makeAudit(st.operatorName, "dependent",
              `更新眷屬名冊 ${before.length} → ${deps.length} 名`, { targetId: employeeId })),
          };
        }),

      upsertEvent: (e) =>
        set((st) => {
          // 硬鎖定：該月已確認 → 拒絕異動（需先於查核頁取消確認）
          if (isPeriodLocked(st.confirmations, e.period)) return st;
          const prev = st.events.find((x) => x.employeeId === e.employeeId && x.period === e.period);
          // 僅就敏感欄位（代扣稅）留稽核，避免一般時數異動灌爆紀錄
          const taxChanged = (prev?.withheldTax ?? null) !== (e.withheldTax ?? null);
          // F6：代扣稅異動且該員該期原本已有事件記錄時可回復（無 prev＝新建，不回復）。
          const eventRestore = prev ? { restoreKind: "event" as const, before: prev, after: e } : {};
          const log = taxChanged
            ? pushAudit(st.auditLog, makeAudit(st.operatorName, "event",
                `${st.employees.find((x) => x.id === e.employeeId)?.name ?? e.employeeId} ${e.period} 代扣稅 ${prev?.withheldTax ?? "未填"} → ${e.withheldTax ?? "未填"}`,
                { targetId: e.employeeId, period: e.period, ...eventRestore }))
            : st.auditLog;
          return {
            auditLog: log,
            events: st.events.some(
              (x) => x.employeeId === e.employeeId && x.period === e.period,
            )
              ? st.events.map((x) =>
                  x.employeeId === e.employeeId && x.period === e.period ? e : x,
                )
              : [...st.events, e],
          };
        }),
      getEvent: (employeeId, period) =>
        get().events.find(
          (e) => e.employeeId === employeeId && e.period === period,
        ) ?? blankEvent(employeeId, period),

      resetToSeed: () => {
        const demo = buildDemoCompany();
        set({
          parameters: DEFAULT_PARAMETERS,
          brackets: DEFAULT_BRACKETS,
          employees: demo.employees,
          salaries: demo.salaries,
          dependents: demo.dependents,
          events: demo.events,
          currentPeriod: demo.currentPeriod,
          punches: demo.punches,
          analytics: demo.analytics,
          snapshots: demo.snapshots,
          confirmations: demo.confirmations,
          auditLog: demo.auditLog,
          declaredInsured: demo.declaredInsured,
          projects: demo.projects,
          allocations: demo.allocations,
          scheduledRaises: [],
        });
      },
      clearAll: () =>
        set((st) => ({
          employees: [],
          salaries: [],
          dependents: [],
          events: [],
          punches: [],
          analytics: DEFAULT_ANALYTICS,
          snapshots: [],
          confirmations: {},
          declaredInsured: [],
          projects: [],
          allocations: [],
          scheduledRaises: [],
          auditLog: pushAudit(st.auditLog, makeAudit(st.operatorName, "clear", "清空全部員工與結算資料")),
        })),

      exportAll: () => serializeState(get() as unknown as Record<string, unknown>, STORE_VERSION),
      importAll: (env) =>
        set((st) => {
          const s = (env?.state ?? {}) as Partial<PayrollState>;
          return {
            parameters: { ...st.parameters, ...(s.parameters ?? {}) },
            brackets: s.brackets ?? st.brackets,
            employees: s.employees ?? st.employees,
            salaries: s.salaries ?? st.salaries,
            dependents: s.dependents ?? st.dependents,
            events: s.events ?? st.events,
            currentPeriod: s.currentPeriod ?? st.currentPeriod,
            attendance: { ...st.attendance, ...(s.attendance ?? {}) },
            punches: s.punches ?? st.punches,
            analytics: {
              ...st.analytics,
              ...(s.analytics ?? {}),
              scenario: { ...st.analytics.scenario, ...(s.analytics?.scenario ?? {}) },
              raiseScenario: { ...st.analytics.raiseScenario, ...(s.analytics?.raiseScenario ?? {}) },
              planning: { ...st.analytics.planning, ...(s.analytics?.planning ?? {}) },
            },
            snapshots: s.snapshots ?? st.snapshots,
            confirmations: s.confirmations ?? st.confirmations,
            setupCompleted: s.setupCompleted ?? st.setupCompleted,
            operatorName: s.operatorName ?? st.operatorName,
            declaredInsured: s.declaredInsured ?? st.declaredInsured,
            projects: s.projects ?? st.projects,
            allocations: s.allocations ?? st.allocations,
            scheduledRaises: s.scheduledRaises ?? st.scheduledRaises,
            leavePolicy: { ...DEFAULT_LEAVE_POLICY, ...(s.leavePolicy ?? {}) },
            salaryDefaults: s.salaryDefaults ?? st.salaryDefaults,
            auditLog: pushAudit(s.auditLog ?? st.auditLog, makeAudit(st.operatorName, "restore", "由備份檔還原全部資料")),
          };
        }),
    }),
    {
      name: STORAGE_KEY,
      version: STORE_VERSION,
      // 版本升級轉換點。
      // v1→v2：由 employees[].project 自由字串合成專案主檔（避免漏算）。
      // v2→v3：把舊單段留停/停職/暫離（status+leaveDate+returnDate+leavePaidRatio）轉成 leaveRecords 陣列。
      migrate: (persisted) => {
        const st = (persisted ?? {}) as Partial<PayrollState>;
        if (!st.projects && Array.isArray(st.employees)) {
          const codes = [...new Set(st.employees.map((e) => e.project).filter((c): c is string => !!c))];
          st.projects = codes.map((code) => ({
            id: code, code, name: code, manager: "", client: "", budget: 0,
            startDate: "", endDate: "", status: "進行中" as const,
          }));
          st.allocations = st.allocations ?? [];
        }
        if (Array.isArray(st.employees)) {
          st.employees = backfillLeaveRecords(st.employees); // v2→v3：舊單段 → leaveRecords
        }
        return st as PayrollState;
      },
      // 與預設深度合併，使舊版 localStorage 自動補上新增欄位（如彈性工時設定）
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<PayrollState>;
        return {
          ...current,
          ...p,
          parameters: { ...current.parameters, ...(p.parameters ?? {}) },
          attendance: { ...current.attendance, ...(p.attendance ?? {}) },
          analytics: {
            ...current.analytics,
            ...(p.analytics ?? {}),
            scenario: { ...current.analytics.scenario, ...(p.analytics?.scenario ?? {}) },
            raiseScenario: { ...current.analytics.raiseScenario, ...(p.analytics?.raiseScenario ?? {}) },
            planning: { ...current.analytics.planning, ...(p.analytics?.planning ?? {}) },
          },
          snapshots: p.snapshots ?? current.snapshots,
          auditLog: p.auditLog ?? current.auditLog,
          operatorName: p.operatorName ?? current.operatorName,
          declaredInsured: p.declaredInsured ?? current.declaredInsured,
          projects: p.projects ?? current.projects,
          allocations: p.allocations ?? current.allocations,
        };
      },
    },
  ),
);
