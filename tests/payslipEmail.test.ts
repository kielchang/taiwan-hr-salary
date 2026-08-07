import { describe, it, expect } from "vitest";
import { buildPayslipMailto } from "@/lib/payslipEmail";

describe("buildPayslipMailto", () => {
  it("組出含收件人、主旨、內文的 mailto；密碼規則不得出現在內文（改請洽人事）", () => {
    const url = buildPayslipMailto({ to: "a@b.com", name: "王小明", period: "2026-01", company: "範例公司" });
    expect(url.startsWith("mailto:a%40b.com?")).toBe(true);
    const decoded = decodeURIComponent(url);
    expect(decoded).toContain("範例公司");
    expect(decoded).toContain("2026年1月");
    expect(decoded).toContain("王小明");
    expect(decoded).toContain("請洽人事單位");
    expect(decoded).not.toContain("身分證"); // 合規08 §2.2：密碼規則不隨信件出貨
    expect(decoded).toContain("手動夾帶");
  });
});
