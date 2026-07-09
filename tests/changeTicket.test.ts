// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { usePayrollStore } from "../src/store/usePayrollStore";
import type { Employee, SalaryStructure, Dependent } from "../src/lib/types";

const st = () => usePayrollStore.getState();

const emp = (id: string, over: Partial<Employee> = {}): Employee => ({
  id, name: `員工${id}`, department: "研發", title: "工程師", hireDate: "2020-01-01",
  costCenter: "", project: "", taxResidency: "居住者", withholdingMethod: "固定5%",
  exemptionFormReceivedDate: null, voluntaryPensionRate: 0, nationalId: "", email: "", status: "在職", ...over,
});
const sal = (id: string, base = 40000): SalaryStructure => ({
  employeeId: id, baseSalary: base, managerAllowance: 0, dutyAllowance: 0, professionalAllowance: 0,
  mealAllowance: 0, transportAllowance: 0, attendanceBonus: 0, otherFixedAllowance: 0,
});

/** 每個測試從乾淨、單一員工、未確認的狀態開始。 */
beforeEach(() => {
  usePayrollStore.setState({
    employees: [emp("E1")], salaries: [sal("E1")], dependents: [],
    confirmations: {}, currentPeriod: "2026-03", auditLog: [], operatorName: "測試員",
  });
});

describe("applyChangeTicket 情境化異動＋稽核", () => {
  it("contact 情境：更新聯絡欄位、留一筆帶 scenario/reason 的可回復稽核", () => {
    st().applyChangeTicket({
      scenario: "contact", employeeId: "E1", reason: "更新 email",
      summary: "Email （空）→ a@b.c",
      employee: emp("E1", { email: "a@b.c", department: "行銷" }),
    });
    expect(st().employees[0].email).toBe("a@b.c");
    const a = st().auditLog[0];
    expect(a.scenario).toBe("contact");
    expect(a.reason).toBe("更新 email");
    expect(a.restoreKind).toBe("employee");
    expect(a.summary).toContain("原因：更新 email");
  });

  it("contact 情境在已確認月份仍可套用（免鎖）", () => {
    usePayrollStore.setState({ confirmations: { "2026-03": "2026-03-31T00:00:00Z" } });
    st().applyChangeTicket({ scenario: "contact", employeeId: "E1", reason: "改部門", employee: emp("E1", { department: "法務" }) });
    expect(st().employees[0].department).toBe("法務");
  });

  it("計薪情境（薪資）在已確認月份被擋下（no-op）", () => {
    usePayrollStore.setState({ confirmations: { "2026-03": "2026-03-31T00:00:00Z" } });
    st().applyChangeTicket({ scenario: "salary", employeeId: "E1", reason: "調本薪", salary: sal("E1", 50000) });
    expect(st().salaries[0].baseSalary).toBe(40000); // 未變
    expect(st().auditLog.length).toBe(0); // 未記錄
  });

  it("salary 情境：寫回薪資、可回復", () => {
    st().applyChangeTicket({ scenario: "salary", employeeId: "E1", reason: "年度調薪", summary: "月薪 40,000 → 50,000", salary: sal("E1", 50000) });
    expect(st().salaries[0].baseSalary).toBe(50000);
    const a = st().auditLog[0];
    expect(a.scenario).toBe("salary");
    expect(a.restoreKind).toBe("salary");
    // 回復
    st().restoreAudit(a.id);
    expect(st().salaries[0].baseSalary).toBe(40000);
    expect(st().auditLog[0].restoredFrom).toBe(a.id); // 回復另記一筆
  });

  it("terminate 情境：狀態→離職＋離職日，可回復回在職", () => {
    st().applyChangeTicket({ scenario: "terminate", employeeId: "E1", reason: "自請離職", summary: "狀態 在職 → 離職（2026-03-31）", employee: emp("E1", { status: "離職", leaveDate: "2026-03-31" }) });
    expect(st().employees[0].status).toBe("離職");
    expect(st().employees[0].leaveDate).toBe("2026-03-31");
    st().restoreAudit(st().auditLog[0].id);
    expect(st().employees[0].status).toBe("在職");
    expect(st().employees[0].leaveDate ?? null).toBe(null);
  });

  it("dependents 情境：整份名冊寫入＋以 dependents 種類整批回復", () => {
    const d: Dependent = { id: "D1", employeeId: "E1", name: "配偶", relationship: "配偶", birthDate: "", nationalId: "", enrolledInHealthInsurance: true, taxDependent: true };
    st().applyChangeTicket({ scenario: "dependents", employeeId: "E1", reason: "新增配偶", summary: "眷屬 0 → 1 人", dependents: [d] });
    expect(st().dependents.length).toBe(1);
    const a = st().auditLog[0];
    expect(a.scenario).toBe("dependents");
    expect(a.restoreKind).toBe("dependents");
    st().restoreAudit(a.id);
    expect(st().dependents.filter((x) => x.employeeId === "E1").length).toBe(0); // 回復成空名冊
  });

  it("onboard 情境：新增員工＋blank salary，不可回復（插入類）", () => {
    st().applyChangeTicket({ scenario: "onboard", employeeId: "E2", reason: "新進報到", summary: "新增員工 E2", newEmployee: emp("E2") });
    expect(st().employees.some((e) => e.id === "E2")).toBe(true);
    expect(st().salaries.some((s) => s.employeeId === "E2")).toBe(true);
    const a = st().auditLog[0];
    expect(a.scenario).toBe("onboard");
    expect(a.restoreKind).toBeUndefined(); // 插入不可回復
  });

  it("onboard 防呆：員編重複則 no-op", () => {
    st().applyChangeTicket({ scenario: "onboard", employeeId: "E1", reason: "x", newEmployee: emp("E1") });
    expect(st().employees.length).toBe(1);
    expect(st().auditLog.length).toBe(0);
  });
});
