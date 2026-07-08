import type { Meta, StoryObj } from "@storybook/react";
import { UI_KIT } from "@/components/version";
import { Badge } from "@/components/ui/badge";

// 元件庫總覽：顯示獨立版號與範圍，作為「統一介面設計風格」的單一入口。
const meta: Meta = { title: "元件庫 / 總覽", parameters: { layout: "padded" } };
export default meta;
type S = StoryObj;

const GROUPS: { name: string; items: string[] }[] = [
  { name: "基礎 UI", items: ["Badge", "Button", "Card", "Checkbox", "Delta", "Dialog", "EmptyState", "Input", "Label", "Select", "Table", "Tabs", "Tooltip"] },
  { name: "資料呈現", items: ["DataTable", "ChartCard"] },
  { name: "圖表（零相依 SVG）", items: ["StackedBar", "Pareto", "Heatmap", "TrendChart", "Bullet", "BarChart"] },
  { name: "表單（唯讀逐欄編輯）", items: ["EditableField", "SegGroup（單選）", "Chips（多選）", "ChangeSummary", "useRecordDiff"] },
  { name: "其他", items: ["NumberInput", "Stepper", "ErrorBoundary"] },
];

export const 總覽: S = {
  render: () => (
    <div className="max-w-3xl space-y-6">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">{UI_KIT.name}</h1>
          <Badge className="text-sm">v{UI_KIT.version}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          共用介面元件庫，版控獨立於 app（見 <code>src/components/version.ts</code>）。
          目的：跨系統統一設計風格。公開範圍＝<code>src/components/index.ts</code>；
          邊界由 <code>tests/uiKit.test.ts</code> 守衛（元件不得耦合 app 模組）。
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {GROUPS.map((g) => (
          <div key={g.name} className="rounded-lg border p-4">
            <p className="mb-2 text-sm font-semibold">{g.name}</p>
            <div className="flex flex-wrap gap-1.5">
              {g.items.map((it) => (
                <Badge key={it} variant="secondary" className="font-normal">{it}</Badge>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-dashed p-4 text-xs text-muted-foreground">
        <p className="mb-1 font-medium text-foreground">依賴面（切出成套件時需一併帶走）</p>
        設計 token（Tailwind 設定＋<code>index.css</code> CSS 變數／<code>.tap-target*</code>）、
        通用工具（<code>lib/utils</code>・<code>useSort</code>・<code>csv</code>・<code>forms/diff</code>・<code>download</code>）。
        切割路線見 <code>docs/ui-kit/README.md</code>。
      </div>
    </div>
  ),
};
