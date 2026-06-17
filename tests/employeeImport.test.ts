import { describe, it, expect } from "vitest";
import { parseEmployeeCsv, IMPORT_COLUMNS } from "../src/lib/import/employeeCsv";
import { csvSerialize } from "../src/lib/csv";

const MIN_WAGE = 29500;
const headerRow = [...IMPORT_COLUMNS];

function build(rows: (string | number)[][]) {
  return csvSerialize(headerRow, rows);
}
// 欄位順序：編號,姓名,部門,職稱,到職日,身分證,Email,稅務身分,扣繳方式,自提%,本薪,主管,職務,專業,伙食,交通,全勤,其他
const ok = ["E100", "甲", "資訊部", "工程師", "2026-01-01", "a123456789", "a@x.com", "居住者", "固定5%", "0", "40000", "0", "0", "0", "3000", "0", "0", "0"];

describe("parseEmployeeCsv", () => {
  it("正常列 → valid，身分證轉大寫、自提率轉小數", () => {
    const p = parseEmployeeCsv(build([ok]), MIN_WAGE);
    expect(p.hasError).toBe(false);
    expect(p.valid).toHaveLength(1);
    expect(p.valid[0].employee.nationalId).toBe("A123456789");
    expect(p.valid[0].salary.baseSalary).toBe(40000);
  });
  it("缺編號/姓名 → error，不納入 valid", () => {
    const bad = ["", "", "", "", "", "", "", "", "", "", "0", "0", "0", "0", "0", "0", "0", "0"];
    const p = parseEmployeeCsv(build([bad]), MIN_WAGE);
    expect(p.hasError).toBe(true);
    expect(p.valid).toHaveLength(0);
  });
  it("重複編號 → error", () => {
    const p = parseEmployeeCsv(build([ok, ok]), MIN_WAGE);
    expect(p.issues.some((i) => i.level === "error" && /重複/.test(i.message))).toBe(true);
  });
  it("低於最低工資 → warning（仍可匯入）", () => {
    const low = [...ok]; low[10] = "10000"; low[14] = "0"; low[0] = "E101";
    const p = parseEmployeeCsv(build([low]), MIN_WAGE);
    expect(p.hasError).toBe(false);
    expect(p.issues.some((i) => i.level === "warning")).toBe(true);
  });
});
