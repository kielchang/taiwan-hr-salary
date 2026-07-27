// 互動計算器（補充用，集中於附錄）：直接呼叫系統的計算純函數（src/lib/calc，115 年度預設參數），
// 「本計算＝系統同一函數」——輸入變動即所見即系統所得。calc 不依賴 store，可獨立渲染。
import React, { useMemo, useState } from "react";
import { DEFAULT_PARAMETERS } from "@/config/parameters";
import { DEFAULT_BRACKETS } from "@/config/brackets";
import { hourlyWage, monthlySalaryTotal, overtimePay, leaveDeduction, payFactor, employmentDaysFactor } from "@/lib/calc/wage";
import { lookupInsuredAmounts } from "@/lib/calc/brackets";
import { seniorityMonths, annualLeaveDays } from "@/lib/calc/seniority";
import { insurancePremiums } from "@/lib/calc/insurance";
import { personalSupplementary } from "@/lib/calc/supplementary";
import { withholdingSuggestion } from "@/lib/calc/tax";
import { validateSettings } from "@/lib/validation";
import { NumberInput } from "@/components/NumberInput";
import type { MonthlyEvent, TaxResidency, WithholdingMethod } from "@/lib/types";

const P = DEFAULT_PARAMETERS;
const B = DEFAULT_BRACKETS;
const ntd = (n: number) => `$${Math.round(n).toLocaleString()}`;

/** 空白當月事件（只填要示範的欄位） */
function blankEvent(over: Partial<MonthlyEvent>): MonthlyEvent {
  return {
    employeeId: "DEMO", period: "2026-06", overtimeWeekday1: 0, overtimeWeekday2: 0,
    overtimeRestday1: 0, overtimeRestday2: 0, overtimeHoliday: 0, personalLeaveHours: 0,
    sickLeaveHours: 0, monthlyBonus: 0, cumulativeBonus: 0, otherAddition: 0, otherDeduction: 0,
    withheldTax: null, ...over,
  };
}

/** 計算器容器：輸入列＋結果列＋「與系統同一函數」註記 */
function CalcCard({ title, children, result }: { title: string; children: React.ReactNode; result: React.ReactNode }) {
  return (
    <figure style={{ margin: "1rem 0", border: "1px solid var(--ifm-color-emphasis-300)", borderRadius: 8, overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 12px", background: "var(--ifm-color-emphasis-100)", fontSize: 13 }}>
        <strong>{title}</strong>
        <span style={{ color: "var(--ifm-color-emphasis-600)" }}>試算・與系統同一計算</span>
      </div>
      <div className="bg-background text-foreground" style={{ padding: 16 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>{children}</div>
        <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 6, background: "var(--ifm-color-emphasis-100)", fontSize: 14 }}>{result}</div>
      </div>
    </figure>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14 }}>{label}{children}</label>;
}

/** A.1a 加班費（本尊＝異動編輯對話框的即時試算） */
export function CalcOvertime() {
  const [salary, setSalary] = useState(45800);
  const [w1, setW1] = useState(8);
  const [w2, setW2] = useState(0);
  const [r1, setR1] = useState(0);
  const [r2, setR2] = useState(0);
  const [hol, setHol] = useState(0);
  const pay = useMemo(() => overtimePay(salary, blankEvent({ overtimeWeekday1: w1, overtimeWeekday2: w2, overtimeRestday1: r1, overtimeRestday2: r2, overtimeHoliday: hol }), P), [salary, w1, w2, r1, r2, hol]);
  return (
    <CalcCard title="加班費試算" result={<>本月加班費 ≈ <strong>{ntd(pay)}</strong>（時薪 {ntd(hourlyWage(salary, P))} × 倍率）</>}>
      <Field label="月薪資總額"><NumberInput value={salary} onChange={setSalary} min={0} /></Field>
      <Field label="平日前2h"><NumberInput value={w1} onChange={setW1} min={0} /></Field>
      <Field label="平日3-4h"><NumberInput value={w2} onChange={setW2} min={0} /></Field>
      <Field label="休息日前2h"><NumberInput value={r1} onChange={setR1} min={0} /></Field>
      <Field label="休息日3h起"><NumberInput value={r2} onChange={setR2} min={0} /></Field>
      <Field label="國定假日"><NumberInput value={hol} onChange={setHol} min={0} /></Field>
    </CalcCard>
  );
}

/** A.1b 請假扣款 */
export function CalcLeaveDeduct() {
  const [salary, setSalary] = useState(45800);
  const [personal, setPersonal] = useState(8);
  const [sick, setSick] = useState(0);
  const d = useMemo(() => leaveDeduction(salary, blankEvent({ personalLeaveHours: personal, sickLeaveHours: sick }), P), [salary, personal, sick]);
  return (
    <CalcCard title="請假扣款試算" result={<>本月請假扣款 ≈ <strong>{ntd(d)}</strong>（事假整段扣、病假扣半）</>}>
      <Field label="月薪資總額"><NumberInput value={salary} onChange={setSalary} min={0} /></Field>
      <Field label="事假時數"><NumberInput value={personal} onChange={setPersonal} min={0} /></Field>
      <Field label="病假時數"><NumberInput value={sick} onChange={setSick} min={0} /></Field>
    </CalcCard>
  );
}

/** A.2a 級距查表 */
export function CalcBracket() {
  const [salary, setSalary] = useState(36500);
  const ins = useMemo(() => lookupInsuredAmounts(B, salary), [salary]);
  return (
    <CalcCard title="投保級距查表" result={<>勞保 <strong>{ntd(ins.labor)}</strong>・職保 <strong>{ntd(ins.occupational)}</strong>・健保 <strong>{ntd(ins.health)}</strong>・勞退 <strong>{ntd(ins.pension)}</strong></>}>
      <Field label="月薪資總額"><NumberInput value={salary} onChange={setSalary} min={0} /></Field>
      <span style={{ fontSize: 13, color: "var(--ifm-color-emphasis-600)" }}>介於兩級取較高、超最高級觸頂</span>
    </CalcCard>
  );
}

/** A.2b 四險保費 */
export function CalcInsurance() {
  const [salary, setSalary] = useState(45800);
  const [deps, setDeps] = useState(0);
  const pm = useMemo(() => insurancePremiums(lookupInsuredAmounts(B, salary), Math.min(deps, P.healthDependentCap), 0, P), [salary, deps]);
  const emp = pm.laborEmployee + pm.healthEmployee;
  const er = pm.laborEmployer + pm.occupationalEmployer + pm.healthEmployer + pm.pensionEmployer;
  return (
    <CalcCard title="四險保費試算" result={<>員工自付 ≈ <strong>{ntd(emp)}</strong>（勞保 {ntd(pm.laborEmployee)}＋健保 {ntd(pm.healthEmployee)}）；雇主負擔 ≈ <strong>{ntd(er)}</strong>（含勞退 6% {ntd(pm.pensionEmployer)}）</>}>
      <Field label="月薪資總額"><NumberInput value={salary} onChange={setSalary} min={0} /></Field>
      <Field label="健保眷屬數"><NumberInput value={deps} onChange={setDeps} min={0} /></Field>
    </CalcCard>
  );
}

/** A.3 二代健保補充保費 */
export function CalcSupplementary() {
  const [bonus, setBonus] = useState(200000);
  const [cum, setCum] = useState(200000);
  const [salary, setSalary] = useState(45800);
  const fee = useMemo(() => personalSupplementary(bonus, cum, lookupInsuredAmounts(B, salary).health, P), [bonus, cum, salary]);
  const threshold = lookupInsuredAmounts(B, salary).health * 4;
  return (
    <CalcCard title="二代健保補充保費試算（獎金）" result={<>補充保費 ≈ <strong>{ntd(fee)}</strong>（累計超過投保 {ntd(threshold)}＝4 倍門檻的部分 × {(P.supplementaryRate * 100).toFixed(2)}%）</>}>
      <Field label="本月獎金"><NumberInput value={bonus} onChange={setBonus} min={0} /></Field>
      <Field label="今年累計獎金"><NumberInput value={cum} onChange={setCum} min={0} /></Field>
      <Field label="月薪資總額"><NumberInput value={salary} onChange={setSalary} min={0} /></Field>
    </CalcCard>
  );
}

/** A.4 所得稅分流 */
export function CalcTax() {
  const [taxable, setTaxable] = useState(95000);
  const [deps, setDeps] = useState(0);
  const [res, setRes] = useState<TaxResidency>("居住者");
  const [method, setMethod] = useState<WithholdingMethod>("依扣繳稅額表");
  const s = useMemo(() => withholdingSuggestion(taxable, res, method, deps, P), [taxable, res, method, deps]);
  return (
    <CalcCard title="每月所得稅代扣建議"
      result={s.type === "auto" ? <>建議代扣 ≈ <strong>{ntd(s.amount)}</strong></> : <>應稅已達起扣點：<strong>{s.hint}</strong>（人工控制點）</>}>
      <Field label="當月應稅薪資"><NumberInput value={taxable} onChange={setTaxable} min={0} /></Field>
      <Field label="扶養人數"><NumberInput value={deps} onChange={setDeps} min={0} /></Field>
      <Field label="身分">
        <select value={res} onChange={(e) => setRes(e.target.value as TaxResidency)} className="col-input" style={{ padding: "4px 8px", borderRadius: 6 }}>
          <option>居住者</option><option>非居住者</option>
        </select>
      </Field>
      <Field label="方式">
        <select value={method} onChange={(e) => setMethod(e.target.value as WithholdingMethod)} className="col-input" style={{ padding: "4px 8px", borderRadius: 6 }}>
          <option>依扣繳稅額表</option><option>固定5%</option>
        </select>
      </Field>
    </CalcCard>
  );
}

/** A.5 破月比例 */
export function CalcPayFactor() {
  const [hireDay, setHireDay] = useState(11);
  const period = "2026-06";
  const hire = `2026-06-${String(Math.min(Math.max(hireDay, 1), 30)).padStart(2, "0")}`;
  const f = useMemo(() => payFactor(period, hire, null, [], { 留停: 0, 停職: 0, 暫離: 0 }), [hire]);
  const ef = useMemo(() => employmentDaysFactor(period, hire, null, "在職"), [hire]);
  return (
    <CalcCard title="破月比例試算（當月到職）" result={<>固定薪資比例 ≈ <strong>{(f * 100).toFixed(1)}%</strong>；勞保費按在職天數 ≈ <strong>{(ef * 100).toFixed(1)}%</strong>（月薪 45,800 → 當月實付 {ntd(45800 * f)}）</>}>
      <Field label="2026年6月・到職日"><NumberInput value={hireDay} onChange={setHireDay} min={1} /></Field>
      <span style={{ fontSize: 13, color: "var(--ifm-color-emphasis-600)" }}>健保與勞退整月計</span>
    </CalcCard>
  );
}

/** A.6 雇主總成本 */
export function CalcEmployerCost() {
  const [salary, setSalary] = useState(45800);
  const pm = useMemo(() => insurancePremiums(lookupInsuredAmounts(B, salary), 0, 0, P), [salary]);
  const burden = pm.laborEmployer + pm.occupationalEmployer + pm.healthEmployer + pm.pensionEmployer;
  return (
    <CalcCard title="雇主總成本試算" result={<>雇主總成本 ≈ <strong>{ntd(salary + burden)}</strong>＝應發 {ntd(salary)}＋雇主四險負擔 {ntd(burden)}（約 {((burden / salary) * 100).toFixed(1)}%）</>}>
      <Field label="月薪資總額（＝應發，無加班獎金時）"><NumberInput value={salary} onChange={setSalary} min={0} /></Field>
    </CalcCard>
  );
}

/** A.2c 年資與特休 */
export function CalcSeniority() {
  const [years, setYears] = useState(3);
  const months = Math.max(0, Math.round(years * 12));
  const days = useMemo(() => annualLeaveDays(months), [months]);
  return (
    <CalcCard title="特休天數對照" result={<>年資 {years} 年（{months} 個月）→ 本年特休 <strong>{days} 天</strong></>}>
      <Field label="年資（年）"><NumberInput value={years} onChange={setYears} min={0} /></Field>
    </CalcCard>
  );
}

/** 5.1 用：費率打錯量級即時擋（validateSettings V14） */
export function CalcValidation() {
  const [rate, setRate] = useState(5.17);
  const issues = useMemo(() => validateSettings({ ...P, healthRate: rate / 100 }, B).filter((i) => i.rule === "V14"), [rate]);
  const bad = rate / 100 >= 1; // 把 5.17% 誤打成 517
  return (
    <CalcCard title="設定防呆：費率量級檢查"
      result={bad || issues.length ? <span style={{ color: "var(--ifm-color-danger, #e5484d)" }}>❌ {issues[0]?.message ?? `健保費率 ${rate} 超出合理範圍（應為比率，如 5.17%＝0.0517）——系統會在算錯錢前紅字擋下`}</span> : <>✅ 費率 {rate}% 在合理範圍，通過檢查</>}>
      <Field label="試把健保費率打成"><NumberInput value={rate} onChange={setRate} min={0} step={0.01} /></Field>
      <span style={{ fontSize: 13, color: "var(--ifm-color-emphasis-600)" }}>輸入 5.17（％）正常；輸入 517 看看會怎樣</span>
    </CalcCard>
  );
}
