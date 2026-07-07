// 表單比對工具：變更偵測、空值等價、格式化、diffRecord。
import { describe, it, expect } from "vitest";
import { eqValue, fmtValue, diffRecord, type FieldSpec } from "@/lib/forms/diff";

describe("eqValue 欄位等值", () => {
  it("空值互等（null/undefined/空字串）", () => {
    expect(eqValue(null, undefined)).toBe(true);
    expect(eqValue("", null)).toBe(true);
    expect(eqValue(undefined, "")).toBe(true);
  });
  it("數字以數值比較（字串數字亦然）", () => {
    expect(eqValue(5, "5")).toBe(true);
    expect(eqValue(0.05, 0.05)).toBe(true);
    expect(eqValue(5, 6)).toBe(false);
  });
  it("布林/字串嚴格", () => {
    expect(eqValue(true, true)).toBe(true);
    expect(eqValue(true, false)).toBe(false);
    expect(eqValue("在職", "離職")).toBe(false);
  });
});

describe("fmtValue 顯示格式", () => {
  it("空值→—、金額千分位、比率百分比、布林是否", () => {
    expect(fmtValue("", "text")).toBe("—");
    expect(fmtValue(45800, "money")).toBe("45,800");
    expect(fmtValue(0.06, "rate")).toBe("6.0%");
    expect(fmtValue(true, "checkbox")).toBe("是");
    expect(fmtValue(false, "checkbox")).toBe("否");
  });
  it("format 覆寫優先", () => {
    expect(fmtValue("A", "select", (v) => (v === "A" ? "在職" : "其他"))).toBe("在職");
  });
});

describe("diffRecord 變更清單", () => {
  const specs: FieldSpec[] = [
    { key: "name", label: "姓名", kind: "text" },
    { key: "base", label: "本薪", kind: "money" },
    { key: "rate", label: "自提率", kind: "rate" },
    { key: "on", label: "健保", kind: "checkbox" },
  ];
  it("只列出有變更的欄位、含格式化字串", () => {
    const orig = { name: "王小明", base: 40000, rate: 0, on: false };
    const draft = { name: "王大明", base: 40000, rate: 0.06, on: true };
    const changes = diffRecord(orig, draft, specs);
    expect(changes.map((c) => c.field)).toEqual(["name", "rate", "on"]);
    const rate = changes.find((c) => c.field === "rate")!;
    expect(rate.beforeText).toBe("0.0%");
    expect(rate.afterText).toBe("6.0%");
  });
  it("無原始物件（新增）時所有非空欄位皆為變更", () => {
    const draft = { name: "新人", base: 30000, rate: 0, on: false };
    const changes = diffRecord(undefined, draft, specs);
    // name、base 非空＝變更；rate 0 與空等價？0 非空，但原始 undefined→空，eqValue(空,0)：0 是數字→ Number(undefined)=NaN 不比→ 落 a===b false → 變更
    expect(changes.map((c) => c.field)).toContain("name");
    expect(changes.map((c) => c.field)).toContain("base");
  });
});
