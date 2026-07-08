// 元件庫（UI Kit）邊界守衛：這是讓元件庫「未來可原樣切割成獨立套件」的自動化保證。
//
// 規則：元件庫檔案只能依賴「設計 token＋少數通用工具」，不得 import 任何 app 專屬模組
// （store / data / views / content / version / lib/types / lib/calc / lib/reports…）。
// 若有人在元件裡不小心接了 app 相依，這支測試會紅，逼迫在切割前就保持乾淨。
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { UI_KIT } from "@/components/version";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

/** 元件庫涵蓋的檔案（＝index.ts barrel 對外範圍＋其支撐工具）。 */
const LIB_DIRS = ["src/components/ui", "src/components/form", "src/components/charts"];
const LIB_LOOSE = [
  "src/components/index.ts",
  "src/components/version.ts",
  "src/components/NumberInput.tsx",
  "src/components/Stepper.tsx",
  "src/components/ErrorBoundary.tsx",
];
/** 支撐工具（會隨元件庫一起被切出去；本身也不得碰 app 模組）。 */
const LIB_SUPPORT = [
  "src/lib/utils.ts",
  "src/lib/useSort.ts",
  "src/lib/csv.ts",
  "src/lib/forms/diff.ts",
  "src/lib/download.ts",
];

/** 元件庫檔案唯一允許的 `@/` 匯入來源（其餘 @/ 皆視為對 app 的違規耦合）。 */
const ALLOWED_ALIAS = [
  "@/components", // 內部互相引用（含 barrel 自身）
  "@/lib/utils",
  "@/lib/useSort",
  "@/lib/csv",
  "@/lib/forms/diff",
  "@/lib/download",
];

function collect(): string[] {
  const files: string[] = [];
  for (const dir of LIB_DIRS) {
    const abs = join(ROOT, dir);
    if (!existsSync(abs)) continue;
    for (const f of readdirSync(abs)) {
      if (f.endsWith(".stories.tsx")) continue; // stories 不隨套件出貨，可用 demo 資料
      if (f.endsWith(".tsx") || f.endsWith(".ts")) files.push(join(dir, f));
    }
  }
  return [...files, ...LIB_LOOSE, ...LIB_SUPPORT];
}

function aliasImports(src: string): string[] {
  const out: string[] = [];
  const re = /from\s+["'](@\/[^"']+)["']/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) out.push(m[1]);
  return out;
}

describe("元件庫版本", () => {
  it("有名稱且版號為 SemVer（獨立於 app 版號）", () => {
    expect(UI_KIT.name).toBeTruthy();
    expect(UI_KIT.version).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

describe("元件庫邊界（不得耦合 app 模組）", () => {
  const files = collect();

  it("涵蓋預期的元件檔（清單非空、且找得到）", () => {
    expect(files.length).toBeGreaterThan(15);
    for (const f of LIB_LOOSE.concat(LIB_SUPPORT)) {
      expect(existsSync(join(ROOT, f)), `${f} 應存在`).toBe(true);
    }
  });

  for (const rel of files) {
    it(`${rel} 的 @/ 匯入皆在允許清單內`, () => {
      const src = readFileSync(join(ROOT, rel), "utf8");
      const bad = aliasImports(src).filter((a) => !ALLOWED_ALIAS.some((ok) => a === ok || a.startsWith(ok)));
      expect(bad, `${rel} 不得依賴 app 模組：${bad.join(", ")}`).toEqual([]);
    });
  }
});

// 統一設計語言守衛：元件庫不得出現「原始調色盤字面色」（amber/emerald/rose/sky/orange/yellow-NNN），
// 強制走語意 token（success/warning/info/danger/edit）。避免狀態色散落各處、改一次無法全站同步。
const FORBIDDEN_PALETTE = /\b(?:border|bg|text|ring|from|to|via|fill|stroke)-(?:amber|emerald|rose|sky|orange|yellow)-\d{2,3}\b/g;
describe("元件庫設計語言（狀態色須走語意 token）", () => {
  for (const rel of collect()) {
    it(`${rel} 不含原始調色盤字面色`, () => {
      const hits = [...readFileSync(join(ROOT, rel), "utf8").matchAll(FORBIDDEN_PALETTE)].map((m) => m[0]);
      expect(hits, `${rel} 請改用語意 token（如 text-success/border-edit）：${[...new Set(hits)].join(", ")}`).toEqual([]);
    });
  }
});
