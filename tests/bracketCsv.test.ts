import { describe, it, expect } from "vitest";
import { parseBracketCsv, serializeBracketCsv } from "../src/lib/bracketCsv";
import { DEFAULT_BRACKETS } from "../src/config/brackets";

describe("parseBracketCsv", () => {
  it("解析長格式（含表頭）→ 依表分組、升冪去重", () => {
    const csv = "保險別,月投保金額\n勞保,30300\n勞保,29500\n勞保,29500\n健保,29500\n職保,72800";
    const r = parseBracketCsv(csv);
    expect(r.ok).toBe(true);
    expect(r.brackets?.labor).toEqual([29500, 30300]); // 去重＋升冪
    expect(r.brackets?.health).toEqual([29500]);
    expect(r.brackets?.occupational).toEqual([72800]);
    expect(r.brackets?.pension).toBeUndefined(); // 未出現＝不含
  });

  it("接受英文 key 與千分位", () => {
    const r = parseBracketCsv("labor,\"29,500\"\nlabor,30300");
    expect(r.ok).toBe(true);
    expect(r.brackets?.labor).toEqual([29500, 30300]);
  });

  it("無法辨識保險別 → 失敗", () => {
    expect(parseBracketCsv("勞保,29500\n亂寫,30000").ok).toBe(false);
  });

  it("非正數金額 → 失敗", () => {
    expect(parseBracketCsv("勞保,0").ok).toBe(false);
    expect(parseBracketCsv("勞保,-100").ok).toBe(false);
    expect(parseBracketCsv("勞保,abc").ok).toBe(false);
  });

  it("空內容 → 失敗", () => {
    expect(parseBracketCsv("   \n  ").ok).toBe(false);
  });

  it("round-trip：serialize → parse 還原（四表齊全、升冪）", () => {
    const csv = serializeBracketCsv(DEFAULT_BRACKETS);
    const r = parseBracketCsv(csv);
    expect(r.ok).toBe(true);
    expect(r.brackets?.labor).toEqual(DEFAULT_BRACKETS.labor);
    expect(r.brackets?.health).toEqual(DEFAULT_BRACKETS.health);
    expect(r.brackets?.occupational).toEqual(DEFAULT_BRACKETS.occupational);
    expect(r.brackets?.pension).toEqual(DEFAULT_BRACKETS.pension);
  });
});
