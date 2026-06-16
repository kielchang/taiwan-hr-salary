// 應用狀態 — 以 zustand persist middleware 寫入瀏覽器 localStorage（在地操作、離線可用）。
import { create } from "zustand";
import { persist } from "zustand/middleware";
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
} from "@/lib/types";
import { DEFAULT_ANALYTICS } from "@/config/analytics";
import {
  SEED_EMPLOYEES,
  SEED_SALARIES,
  SEED_DEPENDENTS,
  SEED_EVENTS,
  SEED_PERIOD,
  buildDemoData,
} from "@/data/seed";

const STORAGE_KEY = "taiwan-hr-salary:v1"; // localStorage 鍵

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

  /** 出勤打卡（額外模組） */
  attendance: AttendanceConfig;
  punches: PunchRecord[];
  setAttendance: (patch: Partial<AttendanceConfig>) => void;
  addPunch: (record: PunchRecord) => void;
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

  /** 每月結算之人事確認紀錄：period → 確認時間（ISO）；編輯該月資料即自動解除 */
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
}

export const usePayrollStore = create<PayrollState>()(
  persist(
    (set, get) => ({
      parameters: DEFAULT_PARAMETERS,
      brackets: DEFAULT_BRACKETS,
      employees: SEED_EMPLOYEES,
      salaries: SEED_SALARIES,
      dependents: SEED_DEPENDENTS,
      events: SEED_EVENTS,
      currentPeriod: SEED_PERIOD,

      attendance: DEFAULT_ATTENDANCE,
      punches: [],
      setAttendance: (patch) =>
        set((st) => ({ attendance: { ...st.attendance, ...patch } })),
      addPunch: (record) => set((st) => ({ punches: [record, ...st.punches] })),
      removePunch: (id) =>
        set((st) => ({ punches: st.punches.filter((p) => p.id !== id) })),
      clearPunches: () => set({ punches: [] }),

      analytics: DEFAULT_ANALYTICS,
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

      snapshots: [],
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

      confirmations: {},
      confirmPeriod: (period) =>
        set((st) => ({
          confirmations: { ...st.confirmations, [period]: new Date().toISOString() },
        })),
      unconfirmPeriod: (period) =>
        set((st) => {
          const { [period]: _removed, ...rest } = st.confirmations;
          return { confirmations: rest };
        }),

      setParameters: (patch) =>
        set((st) => ({ parameters: { ...st.parameters, ...patch } })),
      setBrackets: (patch) =>
        set((st) => ({ brackets: { ...st.brackets, ...patch } })),
      setCurrentPeriod: (period) => set({ currentPeriod: period }),

      upsertEmployee: (emp) =>
        set((st) => {
          const exists = st.employees.some((e) => e.id === emp.id);
          const employees = exists
            ? st.employees.map((e) => (e.id === emp.id ? emp : e))
            : [...st.employees, emp];
          const salaries = st.salaries.some((s) => s.employeeId === emp.id)
            ? st.salaries
            : [...st.salaries, blankSalary(emp.id)];
          return { employees, salaries };
        }),
      removeEmployee: (id) =>
        set((st) => ({
          employees: st.employees.filter((e) => e.id !== id),
          salaries: st.salaries.filter((s) => s.employeeId !== id),
          dependents: st.dependents.filter((d) => d.employeeId !== id),
          events: st.events.filter((e) => e.employeeId !== id),
          punches: st.punches.filter((p) => p.employeeId !== id),
        })),

      upsertSalary: (s) =>
        set((st) => ({
          salaries: st.salaries.some((x) => x.employeeId === s.employeeId)
            ? st.salaries.map((x) => (x.employeeId === s.employeeId ? s : x))
            : [...st.salaries, s],
        })),
      getSalary: (employeeId) =>
        get().salaries.find((s) => s.employeeId === employeeId) ??
        blankSalary(employeeId),

      upsertDependent: (d) =>
        set((st) => ({
          dependents: st.dependents.some((x) => x.id === d.id)
            ? st.dependents.map((x) => (x.id === d.id ? d : x))
            : [...st.dependents, d],
        })),
      removeDependent: (id) =>
        set((st) => ({ dependents: st.dependents.filter((d) => d.id !== id) })),
      setEmployeeDependents: (employeeId, deps) =>
        set((st) => ({
          dependents: [
            ...st.dependents.filter((d) => d.employeeId !== employeeId),
            ...deps,
          ],
        })),

      upsertEvent: (e) =>
        set((st) => {
          // 結算資料異動 → 該月確認狀態自動解除（需重新查核）
          const { [e.period]: _removed, ...confirmations } = st.confirmations;
          return {
            confirmations,
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

      resetToSeed: () =>
        set({
          parameters: DEFAULT_PARAMETERS,
          brackets: DEFAULT_BRACKETS,
          employees: SEED_EMPLOYEES,
          salaries: SEED_SALARIES,
          dependents: SEED_DEPENDENTS,
          events: SEED_EVENTS,
          currentPeriod: SEED_PERIOD,
          punches: [],
          analytics: DEFAULT_ANALYTICS,
          snapshots: [],
        }),
      clearAll: () =>
        set({
          employees: [],
          salaries: [],
          dependents: [],
          events: [],
          punches: [],
          analytics: DEFAULT_ANALYTICS,
          snapshots: [],
        }),
    }),
    {
      name: STORAGE_KEY,
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
        };
      },
    },
  ),
);
