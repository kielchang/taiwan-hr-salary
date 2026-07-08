import type { Meta, StoryObj } from "@storybook/react";
import { PALETTE } from "@/components/charts";

// 設計 Tokens 型錄：設計語言的可視單一參考。色彩/狀態/圖表色票/型級/圓角，皆由 token 驅動
// （index.css CSS 變數＋tailwind.config 映射），改 token 即全站同步。
const meta: Meta = { title: "元件庫 / 設計 Tokens", parameters: { layout: "padded" } };
export default meta;
type S = StoryObj;

function Swatch({ name, cls, note }: { name: string; cls: string; note?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`size-10 shrink-0 rounded-md border ${cls}`} />
      <div className="min-w-0">
        <p className="truncate text-xs font-medium">{name}</p>
        {note && <p className="truncate text-[11px] text-muted-foreground">{note}</p>}
      </div>
    </div>
  );
}

const SECTION = "mb-2 text-sm font-bold";

export const 設計Tokens: S = {
  render: () => (
    <div className="max-w-4xl space-y-8">
      <p className="text-sm text-muted-foreground">
        設計語言以 token 為單一來源：<code>src/index.css</code> 的 CSS 變數 →{" "}
        <code>tailwind.config.js</code> 映射 → 元件用語意類別（如 <code>bg-primary</code>、<code>text-success</code>、<code>border-edit</code>）。
        改 token 即全站同步；深色（<code>.dark</code>）值已備妥（切換未啟用）。
      </p>

      <section>
        <p className={SECTION}>語意角色（shadcn 基礎）</p>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <Swatch name="background / foreground" cls="bg-background" note="頁面底／文字用 foreground" />
          <Swatch name="primary" cls="bg-primary" note="主色（按鈕/選中）" />
          <Swatch name="secondary" cls="bg-secondary" />
          <Swatch name="muted" cls="bg-muted" note="次要底／禁用" />
          <Swatch name="accent" cls="bg-accent" note="hover 底" />
          <Swatch name="destructive" cls="bg-destructive" note="刪除/危險動作" />
          <Swatch name="border / input" cls="bg-border" />
          <Swatch name="ring" cls="bg-ring" note="focus 外框" />
        </div>
      </section>

      <section>
        <p className={SECTION}>狀態色（統一語意；取代散落的 emerald/amber/sky/rose）</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Swatch name="success" cls="bg-success" note="良好/正差異/完成" />
          <Swatch name="warning" cls="bg-warning" note="警示/超限" />
          <Swatch name="info" cls="bg-info" note="提示/參考/redo" />
          <Swatch name="danger" cls="bg-danger" note="負值/錯誤" />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="rounded-md border border-edit bg-edit-bg px-3 py-1.5 text-sm text-edit-foreground">edit：已變更欄位態（border-edit / bg-edit-bg / text-edit-foreground）</span>
          <span className="rounded-full bg-success px-2 py-0.5 text-xs text-success-foreground">success badge</span>
          <span className="rounded-full bg-warning px-2 py-0.5 text-xs text-warning-foreground">warning badge</span>
        </div>
      </section>

      <section>
        <p className={SECTION}>圖表類別色票（PALETTE，8 色，Gem）</p>
        <p className="mb-2 text-xs text-muted-foreground">
          與其餘 token 同源：<code>--chart-1..8</code>／<code>--chart-axis/grid/text</code>（<code>index.css</code>）。
          藍寶石／祖母綠／石榴石／黃玉／紫水晶／粉晶／紅玉髓／海藍寶石——綜合 6 個 Figma 寶石色票研究後設計，
          經 dataviz 技能驗證器實測通過 CVD 分離／彩度/對比檢查；深色步階已備於 <code>.dark</code>（見{" "}
          <code>ChartThemes.stories.tsx</code> 完整比較過程）。
        </p>
        <div className="flex flex-wrap gap-2">
          {PALETTE.map((c, i) => (
            <div key={c} className="flex items-center gap-1.5">
              <span className="size-6 rounded border" style={{ background: c }} />
              <span className="text-[11px] text-muted-foreground">{i + 1}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <p className={SECTION}>型級（目前為 Tailwind scale；偏小尺寸為主）</p>
        <div className="space-y-1">
          {([["text-2xl", "頁面主標"], ["text-lg", "區塊標題"], ["text-base", "強調內文"], ["text-sm", "一般內文/表格"], ["text-xs", "輔助/標籤"], ["text-[11px]", "極小註記"]] as const).map(([cls, use]) => (
            <div key={cls} className="flex items-baseline gap-3">
              <span className={`${cls} font-medium`}>薪資 12,345</span>
              <span className="text-xs text-muted-foreground">{cls} · {use}</span>
            </div>
          ))}
          <p className="pt-1 text-[11px] text-muted-foreground">數字對齊一律加 <code>tabular-nums</code>。</p>
        </div>
      </section>

      <section>
        <p className={SECTION}>圓角（--radius = 0.5rem）</p>
        <div className="flex items-end gap-4">
          {([["rounded-sm", "sm"], ["rounded-md", "md（按鈕/輸入）"], ["rounded-lg", "lg（卡片）"], ["rounded-full", "full（標籤）"]] as const).map(([cls, use]) => (
            <div key={cls} className="text-center">
              <div className={`size-12 border bg-muted ${cls}`} />
              <p className="mt-1 text-[11px] text-muted-foreground">{use}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  ),
};
