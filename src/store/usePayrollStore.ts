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
} from "@/lib/types";
import {
  SEED_EMPLOYEES,
  SEED_SALARIES,
  SEED_DEPENDENTS,
  SEED_EVENTS,
  SEED_PERIOD,
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
        }),
      clearAll: () =>
        set({
          employees: [],
          salaries: [],
          dependents: [],
          events: [],
          punches: [],
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
        };
      },
    },
  ),
);
