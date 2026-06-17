import { describe, it, expect } from "vitest";
import { csvSerialize, csvParse } from "../src/lib/csv";

describe("csvSerialize / csvParse", () => {
  it("往返一致（含逗號、引號、換行）", () => {
    const headers = ["a", "b", "c"];
    const rows: (string | number)[][] = [
      ["x", "含,逗號", 1],
      ['有"引號"', "跨\n行", 2],
    ];
    const text = csvSerialize(headers, rows);
    const grid = csvParse(text);
    expect(grid[0]).toEqual(headers);
    expect(grid[1]).toEqual(["x", "含,逗號", "1"]);
    expect(grid[2]).toEqual(['有"引號"', "跨\n行", "2"]);
  });
  it("輸出含 BOM、可關閉", () => {
    expect(csvSerialize(["a"], [["1"]]).charCodeAt(0)).toBe(0xfeff);
    expect(csvSerialize(["a"], [["1"]], false).charCodeAt(0)).not.toBe(0xfeff);
  });
  it("解析去除全空白列、容忍 CRLF 與開頭 BOM", () => {
    const grid = csvParse("﻿a,b\r\n1,2\r\n\r\n3,4\r\n");
    expect(grid).toEqual([["a", "b"], ["1", "2"], ["3", "4"]]);
  });
});
