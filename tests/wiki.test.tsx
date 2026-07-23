// 操作手冊內容註冊表守衛：id 契約、動作有效性、關鍵字密度、內容可獨立渲染（不碰 store）。
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { WIKI_CHAPTERS } from "../src/content/wiki";
import { TOURS } from "../src/content/tours";

const KNOWN_ROUTE_PREFIXES = ["/payroll", "/reports", "/master", "/settings", "/analytics", "/help", "/sources", "/setup", "/wiki", "/"];

describe("wiki 內容註冊表", () => {
  it("章 id/num 唯一且 num 連續 1..N", () => {
    const ids = WIKI_CHAPTERS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    WIKI_CHAPTERS.forEach((c, i) => expect(c.num).toBe(i + 1));
  });

  it("節 id 章內唯一（深連結契約）", () => {
    for (const ch of WIKI_CHAPTERS) {
      const ids = ch.sections.map((s) => s.id);
      expect(new Set(ids).size, `${ch.id} 節 id 重複`).toBe(ids.length);
      for (const id of ids) expect(id, `${ch.id}/${id} 應為 kebab-case`).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("action.tour 必須存在於 TOURS；action.to 必須是已知路由前綴", () => {
    for (const ch of WIKI_CHAPTERS) {
      for (const s of ch.sections) {
        for (const a of s.actions ?? []) {
          if (a.tour) expect(TOURS[a.tour], `${ch.id}/${s.id} 導覽 ${a.tour} 不存在`).toBeTruthy();
          if (a.to) expect(KNOWN_ROUTE_PREFIXES.some((p) => a.to!.startsWith(p)), `${ch.id}/${s.id} 路由 ${a.to} 非已知前綴`).toBe(true);
          expect(Boolean(a.tour) || Boolean(a.to), `${ch.id}/${s.id} 動作需有 to 或 tour`).toBe(true);
        }
      }
    }
  });

  it("每節 ≥3 個搜尋關鍵字", () => {
    for (const ch of WIKI_CHAPTERS)
      for (const s of ch.sections)
        expect(s.keywords?.length ?? 0, `${ch.id}/${s.id} 關鍵字不足`).toBeGreaterThanOrEqual(3);
  });

  it("全章節內容可獨立渲染（renderToStaticMarkup；證明內容層不依賴 store/router）", () => {
    for (const ch of WIKI_CHAPTERS) {
      expect(() => renderToStaticMarkup(<>{ch.intro}</>), `${ch.id} intro`).not.toThrow();
      for (const s of ch.sections) {
        const html = renderToStaticMarkup(<>{s.body}</>);
        expect(html.length, `${ch.id}/${s.id} body 為空`).toBeGreaterThan(0);
      }
    }
  });

  it("內容層原始碼禁 import store（動作一律宣告式、由 WikiView 解析）", () => {
    const dir = join(__dirname, "..", "src", "content", "wiki");
    for (const f of readdirSync(dir)) {
      const src = readFileSync(join(dir, f), "utf8");
      expect(src.includes("@/store"), `${f} 不可 import @/store`).toBe(false);
      expect(src.includes("usePayrollStore"), `${f} 不可用 usePayrollStore`).toBe(false);
    }
  });
});
