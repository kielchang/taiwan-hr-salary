import{j as e}from"./jsx-runtime-Cf8x2fCZ.js";import{P as l}from"./index-Dj8_WLPp.js";import"./index-yBjzXJbu.js";import"./index-BO-NyGGJ.js";import"./utils-CdvzHgU1.js";const b={title:"元件庫 / 設計 Tokens",parameters:{layout:"padded"}};function s({name:n,cls:d,note:t}){return e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("div",{className:`size-10 shrink-0 rounded-md border ${d}`}),e.jsxs("div",{className:"min-w-0",children:[e.jsx("p",{className:"truncate text-xs font-medium",children:n}),t&&e.jsx("p",{className:"truncate text-[11px] text-muted-foreground",children:t})]})]})}const a="mb-2 text-sm font-bold",c={render:()=>e.jsxs("div",{className:"max-w-4xl space-y-8",children:[e.jsxs("p",{className:"text-sm text-muted-foreground",children:["設計語言以 token 為單一來源：",e.jsx("code",{children:"src/index.css"})," 的 CSS 變數 →"," ",e.jsx("code",{children:"tailwind.config.js"})," 映射 → 元件用語意類別（如 ",e.jsx("code",{children:"bg-primary"}),"、",e.jsx("code",{children:"text-success"}),"、",e.jsx("code",{children:"border-edit"}),"）。 改 token 即全站同步；深色（",e.jsx("code",{children:".dark"}),"）值已備妥（切換未啟用）。"]}),e.jsxs("section",{children:[e.jsx("p",{className:a,children:"語意角色（shadcn 基礎）"}),e.jsxs("div",{className:"grid gap-3 sm:grid-cols-3 lg:grid-cols-4",children:[e.jsx(s,{name:"background / foreground",cls:"bg-background",note:"頁面底／文字用 foreground"}),e.jsx(s,{name:"primary",cls:"bg-primary",note:"主色（按鈕/選中）"}),e.jsx(s,{name:"secondary",cls:"bg-secondary"}),e.jsx(s,{name:"muted",cls:"bg-muted",note:"次要底／禁用"}),e.jsx(s,{name:"accent",cls:"bg-accent",note:"hover 底"}),e.jsx(s,{name:"destructive",cls:"bg-destructive",note:"刪除/危險動作"}),e.jsx(s,{name:"border / input",cls:"bg-border"}),e.jsx(s,{name:"ring",cls:"bg-ring",note:"focus 外框"})]})]}),e.jsxs("section",{children:[e.jsx("p",{className:a,children:"狀態色（統一語意；取代散落的 emerald/amber/sky/rose）"}),e.jsxs("div",{className:"grid gap-3 sm:grid-cols-2 lg:grid-cols-4",children:[e.jsx(s,{name:"success",cls:"bg-success",note:"良好/正差異/完成"}),e.jsx(s,{name:"warning",cls:"bg-warning",note:"警示/超限"}),e.jsx(s,{name:"info",cls:"bg-info",note:"提示/參考/redo"}),e.jsx(s,{name:"danger",cls:"bg-danger",note:"負值/錯誤"})]}),e.jsxs("div",{className:"mt-3 flex flex-wrap items-center gap-3",children:[e.jsx("span",{className:"rounded-md border border-edit bg-edit-bg px-3 py-1.5 text-sm text-edit-foreground",children:"edit：已變更欄位態（border-edit / bg-edit-bg / text-edit-foreground）"}),e.jsx("span",{className:"rounded-full bg-success px-2 py-0.5 text-xs text-success-foreground",children:"success badge"}),e.jsx("span",{className:"rounded-full bg-warning px-2 py-0.5 text-xs text-warning-foreground",children:"warning badge"})]})]}),e.jsxs("section",{children:[e.jsx("p",{className:a,children:"圖表類別色票（PALETTE，8 色，Cobalt）"}),e.jsxs("p",{className:"mb-2 text-xs text-muted-foreground",children:["與其餘 token 同源：",e.jsx("code",{children:"--chart-1..8"}),"／",e.jsx("code",{children:"--chart-axis/grid/text"}),"（",e.jsx("code",{children:"index.css"}),"）。 經 dataviz 技能驗證器實測通過 CVD 分離／彩度/對比檢查（取代原本未過檢的舊色）；深色步階已備於 ",e.jsx("code",{children:".dark"}),"。"]}),e.jsx("div",{className:"flex flex-wrap gap-2",children:l.map((n,d)=>e.jsxs("div",{className:"flex items-center gap-1.5",children:[e.jsx("span",{className:"size-6 rounded border",style:{background:n}}),e.jsx("span",{className:"text-[11px] text-muted-foreground",children:d+1})]},n))})]}),e.jsxs("section",{children:[e.jsx("p",{className:a,children:"型級（目前為 Tailwind scale；偏小尺寸為主）"}),e.jsxs("div",{className:"space-y-1",children:[[["text-2xl","頁面主標"],["text-lg","區塊標題"],["text-base","強調內文"],["text-sm","一般內文/表格"],["text-xs","輔助/標籤"],["text-[11px]","極小註記"]].map(([n,d])=>e.jsxs("div",{className:"flex items-baseline gap-3",children:[e.jsx("span",{className:`${n} font-medium`,children:"薪資 12,345"}),e.jsxs("span",{className:"text-xs text-muted-foreground",children:[n," · ",d]})]},n)),e.jsxs("p",{className:"pt-1 text-[11px] text-muted-foreground",children:["數字對齊一律加 ",e.jsx("code",{children:"tabular-nums"}),"。"]})]})]}),e.jsxs("section",{children:[e.jsx("p",{className:a,children:"圓角（--radius = 0.5rem）"}),e.jsx("div",{className:"flex items-end gap-4",children:[["rounded-sm","sm"],["rounded-md","md（按鈕/輸入）"],["rounded-lg","lg（卡片）"],["rounded-full","full（標籤）"]].map(([n,d])=>e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:`size-12 border bg-muted ${n}`}),e.jsx("p",{className:"mt-1 text-[11px] text-muted-foreground",children:d})]},n))})]})]})};var r,o,i;c.parameters={...c.parameters,docs:{...(r=c.parameters)==null?void 0:r.docs,source:{originalSource:`{
  render: () => <div className="max-w-4xl space-y-8">
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
        <p className={SECTION}>圖表類別色票（PALETTE，8 色，Cobalt）</p>
        <p className="mb-2 text-xs text-muted-foreground">
          與其餘 token 同源：<code>--chart-1..8</code>／<code>--chart-axis/grid/text</code>（<code>index.css</code>）。
          經 dataviz 技能驗證器實測通過 CVD 分離／彩度/對比檢查（取代原本未過檢的舊色）；深色步階已備於 <code>.dark</code>。
        </p>
        <div className="flex flex-wrap gap-2">
          {PALETTE.map((c, i) => <div key={c} className="flex items-center gap-1.5">
              <span className="size-6 rounded border" style={{
            background: c
          }} />
              <span className="text-[11px] text-muted-foreground">{i + 1}</span>
            </div>)}
        </div>
      </section>

      <section>
        <p className={SECTION}>型級（目前為 Tailwind scale；偏小尺寸為主）</p>
        <div className="space-y-1">
          {([["text-2xl", "頁面主標"], ["text-lg", "區塊標題"], ["text-base", "強調內文"], ["text-sm", "一般內文/表格"], ["text-xs", "輔助/標籤"], ["text-[11px]", "極小註記"]] as const).map(([cls, use]) => <div key={cls} className="flex items-baseline gap-3">
              <span className={\`\${cls} font-medium\`}>薪資 12,345</span>
              <span className="text-xs text-muted-foreground">{cls} · {use}</span>
            </div>)}
          <p className="pt-1 text-[11px] text-muted-foreground">數字對齊一律加 <code>tabular-nums</code>。</p>
        </div>
      </section>

      <section>
        <p className={SECTION}>圓角（--radius = 0.5rem）</p>
        <div className="flex items-end gap-4">
          {([["rounded-sm", "sm"], ["rounded-md", "md（按鈕/輸入）"], ["rounded-lg", "lg（卡片）"], ["rounded-full", "full（標籤）"]] as const).map(([cls, use]) => <div key={cls} className="text-center">
              <div className={\`size-12 border bg-muted \${cls}\`} />
              <p className="mt-1 text-[11px] text-muted-foreground">{use}</p>
            </div>)}
        </div>
      </section>
    </div>
}`,...(i=(o=c.parameters)==null?void 0:o.docs)==null?void 0:i.source}}};const h=["設計Tokens"];export{h as __namedExportsOrder,b as default,c as 設計Tokens};
