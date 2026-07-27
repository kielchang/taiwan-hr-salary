// 手冊↔Storybook 掛鉤守衛：manual/docs 內 <StoryFrame id="..."> 引用的 story 必須存在於
// src/components/**/*.stories.tsx（依 Storybook 的 id 規則自 meta.title + export 名推導）。
// 改名/移除 story 而未同步手冊 → 本測試紅 → 防手冊嵌入變死連結。
// FlowPlayer 素材守衛：manual/docs 引用的 <FlowPlayer name="..."> 必須有對應
// manual/static/flows/<name>/manifest.json（UI 改版後由 manual/scripts/capture-flows.mjs 重錄）。
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..");

/** Storybook 的 id sanitize（storybook/csf sanitize 對齊版）：小寫、標點→'-'、CJK 保留 */
function sanitize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[ ’–—―′¿'`~!@#$%^&*()_|+=?;:'",.<>{}[\]\\/]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function walk(dir: string, out: string[] = []): string[] {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

/** 從 stories 檔建出全部合法 story id 集合 */
function collectStoryIds(): Set<string> {
  const ids = new Set<string>();
  const files = walk(join(ROOT, "src", "components")).filter((f) => f.endsWith(".stories.tsx"));
  for (const f of files) {
    const src = readFileSync(f, "utf8");
    const title = src.match(/title:\s*["']([^"']+)["']/)?.[1];
    if (!title) continue;
    const t = sanitize(title.replace(/\//g, "-"));
    for (const m of src.matchAll(/export const (\S+?)\s*[:=]/g)) {
      const name = m[1];
      if (name === "default" || name === "meta") continue;
      ids.add(`${t}--${sanitize(name)}`);
    }
  }
  return ids;
}

describe("手冊 ↔ Storybook／流程素材 掛鉤", () => {
  const docs = walk(join(ROOT, "manual", "docs")).filter((f) => f.endsWith(".md") || f.endsWith(".mdx"));

  it("StoryFrame 引用的 story id 皆存在（元件庫改 story 需同步手冊）", () => {
    const ids = collectStoryIds();
    expect(ids.size).toBeGreaterThan(50); // stories 檔案有被掃到
    for (const f of docs) {
      const src = readFileSync(f, "utf8");
      for (const m of src.matchAll(/<StoryFrame[^>]*id="([^"]+)"/g)) {
        expect(ids.has(m[1]), `${f} 引用不存在的 story：${m[1]}`).toBe(true);
      }
    }
  });

  it("FlowPlayer 引用的流程素材皆存在（manifest+首格截圖）", () => {
    for (const f of docs) {
      const src = readFileSync(f, "utf8");
      for (const m of src.matchAll(/<FlowPlayer[^>]*name="([^"]+)"/g)) {
        const dir = join(ROOT, "manual", "static", "flows", m[1]);
        expect(existsSync(join(dir, "manifest.json")), `${f} 引用缺素材的流程：${m[1]}`).toBe(true);
        const mf = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8"));
        expect(mf.steps.length, `${m[1]} manifest 無步驟`).toBeGreaterThan(0);
        expect(existsSync(join(dir, mf.steps[0].img)), `${m[1]} 首格截圖缺檔`).toBe(true);
      }
    }
  });
});
