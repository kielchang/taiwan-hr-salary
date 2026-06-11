// 驗收測試（README §9）— 基準測試集。
// 換一套技術重新實作時，輸入相同應得到相同輸出（§9 表列邊界案例）。
import { describe, it, expect } from "vitest";
import { DEFAULT_PARAMETERS as P } from "@/config/parameters";
import { DEFAULT_BRACKETS as B } from "@/config/brackets";
import {
  lookupInsuredAmounts,
  overtimePay,
  insurancePremiums,
  personalSupplementary,
  supplementaryBaseDifferential,
  bonusWithholding,
  withholdingSuggestion,
  estimatedTaxThreshold,
  dependentStats,
  calculatePayroll,
} from "@/lib/calc";
import type { MonthlyEvent, Dependent } from "@/lib/types";
import {
  SEED_EMPLOYEES,
  SEED_SALARIES,
  SEED_DEPENDENTS,
  SEED_EVENTS,
} from "@/data/seed";

const emptyEvent = (over: Partial<MonthlyEvent> = {}): MonthlyEvent => ({
  employeeId: "X",
  period: "2026-01",
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
  ...over,
});

describe("TC-1 觸頂分流", () => {
  it("月薪資總額 160,000 → 四表各自觸頂", () => {
    const insured = lookupInsuredAmounts(B, 160000);
    expect(insured.labor).toBe(45800);
    expect(insured.occupational).toBe(72800);
    expect(insured.health).toBe(162800);
    expect(insured.pension).toBe(150000);
  });
});

describe("TC-2 最低工資＋眷屬上限", () => {
  it("月薪 29,500、健保眷屬 4 名 → 計費眷口 3、健保自付 1,832", () => {
    const deps: Dependent[] = Array.from({ length: 4 }, (_, i) => ({
      id: `d${i}`,
      employeeId: "T2",
      name: `眷${i}`,
      relationship: "子女",
      birthDate: "",
      nationalId: "",
      enrolledInHealthInsurance: true,
      taxDependent: false,
    }));
    const stats = dependentStats(deps, "T2", P);
    expect(stats.healthDependents).toBe(4);
    expect(stats.billableDependents).toBe(3); // 健保法 §29：超過三口以三口計

    const insured = lookupInsuredAmounts(B, 29500);
    const premiums = insurancePremiums(insured, stats.billableDependents, 0, P);
    expect(premiums.healthEmployee).toBe(1832);

    // V1：剛好達標
    expect(29500 >= P.minWageMonthly).toBe(true);
  });
});

describe("TC-3 加班費", () => {
  it("月薪 65,000、平日前 2 小時類共 6 小時 → 2,167", () => {
    const pay = overtimePay(65000, emptyEvent({ overtimeWeekday1: 6 }), P);
    expect(pay).toBe(2167);
  });
});

describe("TC-4 補充保費跨門檻", () => {
  it("健保投保 36,300、年度累計＝本次獎金＝160,000 → 補充保費 312、獎金稅 8,000", () => {
    // 截斷形式
    const supp = personalSupplementary(160000, 160000, 36300, P);
    expect(supp).toBe(312);

    // 差分形式（等價驗算）：發放前累計 0、本次 160,000
    const diff = supplementaryBaseDifferential(0, 160000, 36300, P);
    expect(diff.base).toBe(14800); // 門檻 145,200；計費基礎 14,800
    expect(diff.premium).toBe(312);

    // 獎金所得稅 5%（≥ 90,501）
    const tax = bonusWithholding(160000, "居住者", P);
    expect(tax).toEqual({ type: "auto", amount: 8000 });
  });
});

describe("TC-5 獎金免扣", () => {
  it("本次獎金 84,000（未達 90,501）→ 獎金稅 0", () => {
    const tax = bonusWithholding(84000, "居住者", P);
    expect(tax).toEqual({ type: "auto", amount: 0 });
  });
});

describe("TC-6 非居住者", () => {
  it("應稅薪資 30,000（≤ 44,250）→ 6% ＝ 1,800", () => {
    const s = withholdingSuggestion(30000, "非居住者", "固定5%", 0, P);
    expect(s).toEqual({ type: "auto", amount: 1800 });
  });
});

describe("TC-7 固定 5% 免扣門檻", () => {
  it("應稅薪資 39,252 → 暫計 1,963 ≤ 2,000 → 稅 0", () => {
    const s = withholdingSuggestion(39252, "居住者", "固定5%", 0, P);
    expect(s).toEqual({ type: "auto", amount: 0 });
  });
});

describe("TC-8 查表起扣點", () => {
  it("扶養 3 人 → 起扣點 115,752；應稅 82,372 → 免扣", () => {
    const threshold = estimatedTaxThreshold("居住者", 3, P);
    expect(threshold).toBe(115752);
    const s = withholdingSuggestion(82372, "居住者", "依扣繳稅額表", 3, P);
    expect(s).toEqual({ type: "auto", amount: 0 });
  });
});

describe("TC-9 全簿勾稽（8 名測試員工）", () => {
  const results = SEED_EMPLOYEES.map((emp) =>
    calculatePayroll(
      emp,
      SEED_SALARIES.find((s) => s.employeeId === emp.id)!,
      SEED_DEPENDENTS,
      SEED_EVENTS.find((e) => e.employeeId === emp.id)!,
      P,
      B,
    ),
  );
  const sum = (f: (r: (typeof results)[number]) => number) =>
    results.reduce((acc, r) => acc + f(r), 0);

  it("應發合計 686,417", () => {
    expect(sum((r) => r.grossPay)).toBe(686417);
  });
  it("實發合計 622,426", () => {
    expect(sum((r) => r.netPay)).toBe(622426);
  });
  it("雇主總成本 773,287", () => {
    expect(sum((r) => r.employerTotalCost)).toBe(773287);
  });

  // V3：三維度分類小計皆等於全體合計（差異列恆為 0）
  const groupSum = (
    key: "department" | "costCenter" | "project",
    f: (r: (typeof results)[number]) => number,
  ) => {
    const byKey = new Map<string, number>();
    for (const emp of SEED_EMPLOYEES) {
      const r = results.find((x) => x.employeeId === emp.id)!;
      byKey.set(emp[key], (byKey.get(emp[key]) ?? 0) + f(r));
    }
    return [...byKey.values()].reduce((a, b) => a + b, 0);
  };

  it("V3 部門別小計＝全體（差異 0）", () => {
    expect(groupSum("department", (r) => r.grossPay)).toBe(686417);
    expect(groupSum("department", (r) => r.netPay)).toBe(622426);
    expect(groupSum("department", (r) => r.employerTotalCost)).toBe(773287);
  });
  it("V3 成本中心別小計＝全體（差異 0）", () => {
    expect(groupSum("costCenter", (r) => r.grossPay)).toBe(686417);
    expect(groupSum("costCenter", (r) => r.employerTotalCost)).toBe(773287);
  });
  it("V3 專案別小計＝全體（差異 0）", () => {
    expect(groupSum("project", (r) => r.grossPay)).toBe(686417);
    expect(groupSum("project", (r) => r.employerTotalCost)).toBe(773287);
  });

  // 逐人關鍵值抽查（對照 Excel 薪資總表）
  it("E001 王小明：加班費 2,167／健保自付 2,072／實發 59,942", () => {
    const r = results.find((x) => x.employeeId === "E001")!;
    expect(r.overtimePay).toBe(2167);
    expect(r.premiums.healthEmployee).toBe(2072);
    expect(r.premiums.laborEmployer).toBe(4007); // FP：45800×0.125×0.7→4007
    expect(r.netPay).toBe(59942);
  });
  it("E007 吳建宏：健保自付 1,832（計費 3 口）／請假扣款 1,967／實發 24,963", () => {
    const r = results.find((x) => x.employeeId === "E007")!;
    expect(r.dependents.billableDependents).toBe(3);
    expect(r.premiums.healthEmployee).toBe(1832);
    expect(r.leaveDeduction).toBe(1967);
    expect(r.netPay).toBe(24963);
  });
  it("E008 蔡佩珊：投保觸頂／個人補充保費 1,030", () => {
    const r = results.find((x) => x.employeeId === "E008")!;
    expect(r.insured.labor).toBe(45800);
    expect(r.insured.health).toBe(162800);
    expect(r.personalSupplementary).toBe(1030);
  });
});
