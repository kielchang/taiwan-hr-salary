import { describe, it, expect } from "vitest";
import { buildDispatchCsv } from "@/lib/payslipDispatch";

describe("buildDispatchCsv（薪資條批次寄送清單）", () => {
  const rows = [
    { id: "E001", name: "王小明", email: "a@b.com", fileName: "王小明_E001_薪資明細_2026-01.pdf" },
    { id: "E002", name: "李美華", email: "c@d.com", fileName: "", note: "缺身分證未產生" },
  ];

  it("欄位固定且不含任何密碼欄或密碼規則提示（合規08 §2.2）", () => {
    const csv = buildDispatchCsv(rows);
    expect(csv).toContain("員工編號,姓名,Email,檔名,備註");
    expect(csv).not.toContain("密碼");
    expect(csv).not.toContain("身分證字號"); // 「缺身分證未產生」的備註不含「字號」全詞，密碼規則不得出現
  });

  it("含 BOM、成功列帶檔名、缺件列帶備註", () => {
    const csv = buildDispatchCsv(rows);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain("E001,王小明,a@b.com,王小明_E001_薪資明細_2026-01.pdf,");
    expect(csv).toContain("E002,李美華,c@d.com,,缺身分證未產生");
  });

  it("含逗號/引號的值走 CSV 跳脫", () => {
    const csv = buildDispatchCsv([{ id: "E003", name: 'A,B"C', email: "e@f.com", fileName: "x.pdf" }]);
    expect(csv).toContain('"A,B""C"');
  });
});
