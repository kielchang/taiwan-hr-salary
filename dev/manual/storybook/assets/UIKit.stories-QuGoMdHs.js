import{j as e}from"./jsx-runtime-Cf8x2fCZ.js";import{B as t}from"./badge-Ck-4l2Uv.js";import"./index-yBjzXJbu.js";import"./index-C-0izQnN.js";import"./utils-BEESGUdN.js";const r={name:"hr-ui-kit",version:"0.17.0"},h={title:"元件庫 / 總覽",parameters:{layout:"padded"}},i=[{name:"基礎 UI",items:["Badge","Button","Card","Checkbox","Delta","Dialog","EmptyState","Input","Label","Select","Table","Tabs","Tooltip"]},{name:"資料呈現",items:["DataTable","ChartCard"]},{name:"圖表（零相依 SVG）",items:["StackedBar","Pareto","Heatmap","TrendChart","Bullet","BarChart"]},{name:"表單（唯讀逐欄編輯）",items:["EditableField","SegGroup（單選）","Chips（多選）","ChangeSummary","useRecordDiff"]},{name:"其他",items:["NumberInput","Stepper","ErrorBoundary"]}],s={render:()=>e.jsxs("div",{className:"max-w-3xl space-y-6",children:[e.jsxs("header",{className:"space-y-2",children:[e.jsxs("div",{className:"flex flex-wrap items-center gap-3",children:[e.jsx("h1",{className:"text-2xl font-bold",children:r.name}),e.jsxs(t,{className:"text-sm",children:["v",r.version]})]}),e.jsxs("p",{className:"text-sm text-muted-foreground",children:["共用介面元件庫，版控獨立於 app（見 ",e.jsx("code",{children:"src/components/version.ts"}),"）。 目的：跨系統統一設計風格。公開範圍＝",e.jsx("code",{children:"src/components/index.ts"}),"； 邊界由 ",e.jsx("code",{children:"tests/uiKit.test.ts"})," 守衛（元件不得耦合 app 模組）。"]})]}),e.jsx("div",{className:"grid gap-4 sm:grid-cols-2",children:i.map(d=>e.jsxs("div",{className:"rounded-lg border p-4",children:[e.jsx("p",{className:"mb-2 text-sm font-semibold",children:d.name}),e.jsx("div",{className:"flex flex-wrap gap-1.5",children:d.items.map(a=>e.jsx(t,{variant:"secondary",className:"font-normal",children:a},a))})]},d.name))}),e.jsxs("div",{className:"rounded-lg border border-dashed p-4 text-xs text-muted-foreground",children:[e.jsx("p",{className:"mb-1 font-medium text-foreground",children:"依賴面（切出成套件時需一併帶走）"}),"設計 token（Tailwind 設定＋",e.jsx("code",{children:"index.css"})," CSS 變數／",e.jsx("code",{children:".tap-target*"}),"）、 通用工具（",e.jsx("code",{children:"lib/utils"}),"・",e.jsx("code",{children:"useSort"}),"・",e.jsx("code",{children:"csv"}),"・",e.jsx("code",{children:"forms/diff"}),"・",e.jsx("code",{children:"download"}),"）。 切割路線見 ",e.jsx("code",{children:"docs/ui-kit/README.md"}),"。"]})]})};var n,o,c;s.parameters={...s.parameters,docs:{...(n=s.parameters)==null?void 0:n.docs,source:{originalSource:`{
  render: () => <div className="max-w-3xl space-y-6">
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
        {GROUPS.map(g => <div key={g.name} className="rounded-lg border p-4">
            <p className="mb-2 text-sm font-semibold">{g.name}</p>
            <div className="flex flex-wrap gap-1.5">
              {g.items.map(it => <Badge key={it} variant="secondary" className="font-normal">{it}</Badge>)}
            </div>
          </div>)}
      </div>

      <div className="rounded-lg border border-dashed p-4 text-xs text-muted-foreground">
        <p className="mb-1 font-medium text-foreground">依賴面（切出成套件時需一併帶走）</p>
        設計 token（Tailwind 設定＋<code>index.css</code> CSS 變數／<code>.tap-target*</code>）、
        通用工具（<code>lib/utils</code>・<code>useSort</code>・<code>csv</code>・<code>forms/diff</code>・<code>download</code>）。
        切割路線見 <code>docs/ui-kit/README.md</code>。
      </div>
    </div>
}`,...(c=(o=s.parameters)==null?void 0:o.docs)==null?void 0:c.source}}};const g=["總覽"];export{g as __namedExportsOrder,h as default,s as 總覽};
