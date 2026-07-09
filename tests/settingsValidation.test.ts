import { describe, it, expect } from "vitest";
import { validateSettings } from "../src/lib/validation";
import { DEFAULT_PARAMETERS } from "../src/config/parameters";
import { DEFAULT_BRACKETS } from "../src/config/brackets";

describe("validateSettings（V13–V17 設定一致性）", () => {
  it("預設 115 年參數＋級距＝乾淨（無 error；同年度無 V16）", () => {
    const issues = validateSettings(DEFAULT_PARAMETERS, DEFAULT_BRACKETS, "2026-06");
    expect(issues.filter((i) => i.severity === "error")).toHaveLength(0);
    expect(issues.filter((i) => i.rule === "V16")).toHaveLength(0);
  });

  it("V13：級距未升冪→error", () => {
    const bad = { ...DEFAULT_BRACKETS, labor: [30000, 29500, 31000] };
    const issues = validateSettings(DEFAULT_PARAMETERS, bad);
    expect(issues.some((i) => i.rule === "V13" && i.severity === "error")).toBe(true);
  });

  it("V13：空級距→error", () => {
    const bad = { ...DEFAULT_BRACKETS, health: [] };
    expect(validateSettings(DEFAULT_PARAMETERS, bad).some((i) => i.rule === "V13")).toBe(true);
  });

  it("V14：健保費率打成 5.17（而非 0.0517）→error", () => {
    const bad = { ...DEFAULT_PARAMETERS, healthRate: 5.17 };
    expect(validateSettings(bad, DEFAULT_BRACKETS).some((i) => i.rule === "V14")).toBe(true);
  });

  it("V14：員工＋雇主負擔 > 100% → error", () => {
    const bad = { ...DEFAULT_PARAMETERS, laborEmployeeShare: 0.5, laborEmployerShare: 0.7 };
    expect(validateSettings(bad, DEFAULT_BRACKETS).some((i) => i.rule === "V14")).toBe(true);
  });

  it("V16：設定年度與結算月份不符→warning", () => {
    const issues = validateSettings(DEFAULT_PARAMETERS, DEFAULT_BRACKETS, "2027-01");
    expect(issues.some((i) => i.rule === "V16" && i.severity === "warning")).toBe(true);
  });

  it("V17：固定基準日格式錯→warning", () => {
    const bad = { ...DEFAULT_PARAMETERS, seniorityBasis: "fixedDate" as const, seniorityBaseDate: "亂填" };
    expect(validateSettings(bad, DEFAULT_BRACKETS).some((i) => i.rule === "V17")).toBe(true);
  });
});
