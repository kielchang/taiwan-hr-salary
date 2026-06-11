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
} from "@/lib/types";
import {
  SEED_EMPLOYEES,
  SEED_SALARIES,
  SEED_DEPENDENTS,
  SEED_EVENTS,
  SEED_PERIOD,
} from "@/data/seed";

const STORAGE_KEY = "taiwan-hr-salary:v1"; // localStorage 鍵

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

      upsertEvent: (e) =>
        set((st) => ({
          events: st.events.some(
            (x) => x.employeeId === e.employeeId && x.period === e.period,
          )
            ? st.events.map((x) =>
                x.employeeId === e.employeeId && x.period === e.period ? e : x,
              )
            : [...st.events, e],
        })),
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
        }),
      clearAll: () =>
        set({
          employees: [],
          salaries: [],
          dependents: [],
          events: [],
        }),
    }),
    { name: STORAGE_KEY },
  ),
);
