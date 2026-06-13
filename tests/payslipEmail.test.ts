import { describe, it, expect } from "vitest";
import { buildPayslipMailto } from "@/lib/payslipEmail";

describe("buildPayslipMailto", () => {
  it("組出含收件人、主旨、內文的 mailto，並提及身分證密碼", () => {
    const url = buildPayslipMailto({ to: "a@b.com", name: "王小明", period: "2026-01", company: "範例公司" });
    expect(url.startsWith("mailto:a%40b.com?")).toBe(true);
    const decoded = decodeURIComponent(url);
    expect(decoded).toContain("範例公司");
    expect(decoded).toContain("2026年1月");
    expect(decoded).toContain("王小明");
    expect(decoded).toContain("身分證字號");
    expect(decoded).toContain("手動夾帶");
  });
});
