// 手冊↔Storybook 掛鉤守衛：manual/docs 內 <StoryFrame id="..."> 引用的 story 必須存在於
// src/components/**/*.stories.tsx（依 Storybook 的 id 規則自 meta.title + export 名推導）。
// 改名/移除 story 而未同步手冊 → 本測試紅 → 防手冊嵌入變死連結。
// MockFlow 守衛：manual/docs 引用的 <MockFlow name="..."> 必須存在於
// manual/src/components/screens.tsx 的 MOCK_FLOWS 註冊表（零截圖：畫面＝元件庫排版，改名需同步）。
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
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
      // storyNameFromExport 近似：底線→空白、camelCase 斷詞（DataTable→Data Table）再 sanitize
      const spaced = name.replace(/_/g, " ").replace(/([a-z0-9])([A-Z])/g, "$1 $2");
      ids.add(`${t}--${sanitize(spaced)}`);
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

  it("kit.css tokens 副本涵蓋 tailwind 設定引用的全部變數（防手冊活示例樣式漂移）", () => {
    const twConfig = readFileSync(join(ROOT, "tailwind.config.js"), "utf8");
    const kitCss = readFileSync(join(ROOT, "manual", "src", "css", "kit.css"), "utf8");
    // --radix-* 為 Radix 元件執行期注入的變數（非設計 token），不需入副本
    const wanted = new Set([...twConfig.matchAll(/var\((--[a-z0-9-]+)\)/g)].map((m) => m[1]).filter((v) => !v.startsWith("--radix")));
    expect(wanted.size).toBeGreaterThan(10);
    for (const v of wanted) {
      expect(kitCss.includes(`${v}:`), `manual/src/css/kit.css 缺 token ${v}（自 src/index.css 同步）`).toBe(true);
    }
  });

  it("每節至少一個互動/視覺輔助（PM 規範：不只是文字說明）", () => {
    for (const f of docs) {
      if (f.endsWith("index.md")) continue;
      const src = readFileSync(f, "utf8");
      const hasAid = /<(Demo\w+|Calc\w+|MockFlow|StoryFrame|AppLink)/.test(src);
      expect(hasAid, `${f} 缺互動/視覺輔助（MockFlow/Demo/Calc/StoryFrame/AppLink 擇一）`).toBe(true);
    }
  });

  it("MockFlow 引用的流程皆已在 MOCK_FLOWS 註冊（零截圖：畫面＝元件庫排版）", () => {
    const screens = readFileSync(join(ROOT, "manual", "src", "components", "screens.tsx"), "utf8");
    const registered = new Set([...screens.matchAll(/^ {2}"([a-z-]+)":\s*\{/gm)].map((m) => m[1]));
    expect(registered.size).toBeGreaterThan(5);
    let used = 0;
    for (const f of docs) {
      const src = readFileSync(f, "utf8");
      for (const m of src.matchAll(/<MockFlow[^>]*name="([^"]+)"/g)) {
        used++;
        expect(registered.has(m[1]), `${f} 引用未註冊的流程：${m[1]}（見 manual/src/components/screens.tsx MOCK_FLOWS）`).toBe(true);
      }
    }
    expect(used, "manual/docs 應至少嵌一個 MockFlow").toBeGreaterThan(0);
    // 零截圖鐵律：手冊不得再出現 FlowPlayer 或截圖素材引用
    for (const f of docs) {
      const src = readFileSync(f, "utf8");
      expect(/<FlowPlayer|\/flows\//.test(src), `${f} 仍引用截圖式 FlowPlayer/flows 素材（已廢除，改用 MockFlow）`).toBe(false);
    }
  });
});
