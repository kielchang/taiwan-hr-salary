import { describe, it, expect } from "vitest";
import { buildAcceptanceReport, hasAnyVerdict, type VerdictEntry } from "../src/lib/acceptanceReport";

const tour = {
  id: "durability",
  title: "資料備份健康度（驗收導覽）",
  steps: [{ title: "導覽說明" }, { title: "側邊欄備份指示" }, { title: "工作台備份提醒" }, { title: "匯出後消警" }],
};

describe("hasAnyVerdict", () => {
  it("空＝false、有任一標記＝true", () => {
    expect(hasAnyVerdict({})).toBe(false);
    expect(hasAnyVerdict({ 1: { verdict: "pass" } })).toBe(true);
  });
});

describe("buildAcceptanceReport", () => {
  it("逐步標記通過/有問題(帶備註)/未標記，末列統計", () => {
    const verdicts: Record<number, VerdictEntry> = {
      1: { verdict: "pass" },
      2: { verdict: "issue", note: "提醒卡沒出現" },
      // step 0、3 未標記
    };
    const r = buildAcceptanceReport(tour, verdicts, "2026-07-10");
    expect(r).toContain("驗收報告：資料備份健康度（驗收導覽）（durability）／2026-07-10");
    expect(r).toContain("2. 側邊欄備份指示 — ✅ 通過");
    expect(r).toContain("3. 工作台備份提醒 — ❌ 有問題：提醒卡沒出現");
    expect(r).toContain("1. 導覽說明 — ⬜ 未標記");
    expect(r).toContain("4. 匯出後消警 — ⬜ 未標記");
    expect(r).toContain("通過 1／有問題 1／未標記 2（共 4 步）");
  });

  it("有問題但無備註→不附冒號後綴", () => {
    const r = buildAcceptanceReport(tour, { 1: { verdict: "issue" } }, "2026-07-10");
    expect(r).toContain("2. 側邊欄備份指示 — ❌ 有問題");
    expect(r).not.toContain("有問題：");
  });

  it("全通過→統計正確", () => {
    const all: Record<number, VerdictEntry> = { 0: { verdict: "pass" }, 1: { verdict: "pass" }, 2: { verdict: "pass" }, 3: { verdict: "pass" } };
    const r = buildAcceptanceReport(tour, all, "2026-07-10");
    expect(r).toContain("通過 4／有問題 0／未標記 0（共 4 步）");
  });
});
