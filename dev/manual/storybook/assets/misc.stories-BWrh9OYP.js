import{j as e}from"./jsx-runtime-Cf8x2fCZ.js";import{r as D}from"./index-BO-NyGGJ.js";import{P,H as V,B as I,a as R,N as E}from"./BracketTableCards-DFntNJ5x.js";import{D as w}from"./brackets-89KA2jQc.js";import"./index-yBjzXJbu.js";import"./dialog-DYocHEsE.js";import"./select-BlVvmwjY.js";import"./utils-BEESGUdN.js";import"./index-CSSP-iJI.js";import"./index-B6ujFmsw.js";import"./index-BZsrq3rz.js";import"./createLucideIcon-DqplzwSp.js";import"./check-DNs7zX_I.js";import"./x-DULVkIA2.js";import"./button-SglK-g-6.js";import"./index-C-0izQnN.js";import"./data-table-CnKTpGXG.js";import"./empty-state-BOV8G8AL.js";import"./tooltip-jXVQej4V.js";const ae={title:"元件/其他",parameters:{layout:"padded"}},a={render:()=>e.jsxs("div",{className:"flex items-center gap-2 text-lg font-bold",children:["基本資料 ",e.jsx(V,{id:"master"}),e.jsx("span",{className:"ml-4 text-sm font-normal text-muted-foreground",children:"（點 ℹ 展開情境式說明）"})]})},t={render:()=>{const r=()=>{const[c,d]=D.useState(45e3);return e.jsx("div",{className:"w-40",children:e.jsx(E,{value:c,onChange:d})})};return e.jsx(r,{})}},s={args:{初始值:45e3,步進:1e3,最小值:0,停用:!1},argTypes:{初始值:{control:"number"},步進:{control:{type:"range",min:1,max:5e3,step:1}},最小值:{control:"number"},停用:{control:"boolean"}},render:r=>{const c=()=>{const[d,A]=D.useState(r.初始值);return e.jsx("div",{className:"w-44",children:e.jsx(E,{value:d,onChange:A,step:r.步進,min:r.最小值,disabled:r.停用})})};return e.jsx(c,{},`${r.初始值}`)}},n={render:()=>e.jsxs("div",{className:"rounded border p-4",children:[e.jsx("style",{children:".print-header{display:block !important}"}),e.jsx(P,{title:"薪資明細表",period:"2026-06",company:"示範公司"}),e.jsx("p",{className:"mt-2 text-xs text-muted-foreground",children:"（實際僅於列印時顯示；此為版式預覽）"})]})},o={render:()=>e.jsx("div",{className:"max-w-3xl",children:e.jsx(R,{brackets:w,initial:"labor"})})},m={render:()=>e.jsx("div",{className:"max-w-3xl",children:e.jsx(I,{brackets:w})})};var i,l,p;a.parameters={...a.parameters,docs:{...(i=a.parameters)==null?void 0:i.docs,source:{originalSource:`{
  render: () => <div className="flex items-center gap-2 text-lg font-bold">
      基本資料 <HelpHint id="master" />
      <span className="ml-4 text-sm font-normal text-muted-foreground">（點 ℹ 展開情境式說明）</span>
    </div>
}`,...(p=(l=a.parameters)==null?void 0:l.docs)==null?void 0:p.source}}};var u,x,b;t.parameters={...t.parameters,docs:{...(u=t.parameters)==null?void 0:u.docs,source:{originalSource:`{
  render: () => {
    const Demo = () => {
      const [v, setV] = useState(45000);
      return <div className="w-40"><NumberInput value={v} onChange={setV} /></div>;
    };
    return <Demo />;
  }
}`,...(b=(x=t.parameters)==null?void 0:x.docs)==null?void 0:b.source}}};var v,g,N,_,j;s.parameters={...s.parameters,docs:{...(v=s.parameters)==null?void 0:v.docs,source:{originalSource:`{
  args: {
    初始值: 45000,
    步進: 1000,
    最小值: 0,
    停用: false
  },
  argTypes: {
    初始值: {
      control: "number"
    },
    步進: {
      control: {
        type: "range",
        min: 1,
        max: 5000,
        step: 1
      }
    },
    最小值: {
      control: "number"
    },
    停用: {
      control: "boolean"
    }
  },
  render: a => {
    const Demo = () => {
      const [v, setV] = useState(a.初始值);
      return <div className="w-44"><NumberInput value={v} onChange={setV} step={a.步進} min={a.最小值} disabled={a.停用} /></div>;
    };
    return <Demo key={\`\${a.初始值}\`} />;
  }
}`,...(N=(g=s.parameters)==null?void 0:g.docs)==null?void 0:N.source},description:{story:"互動 Playground：右側 Controls 調整初始值/步進/最小值/停用。",...(j=(_=s.parameters)==null?void 0:_.docs)==null?void 0:j.description}}};var f,h,T;n.parameters={...n.parameters,docs:{...(f=n.parameters)==null?void 0:f.docs,source:{originalSource:`{
  render: () => <div className="rounded border p-4">
      {/* 平時 .print-header 僅列印顯示；此處強制顯示以便檢視版式 */}
      <style>{\`.print-header{display:block !important}\`}</style>
      <PrintHeader title="薪資明細表" period="2026-06" company="示範公司" />
      <p className="mt-2 text-xs text-muted-foreground">（實際僅於列印時顯示；此為版式預覽）</p>
    </div>
}`,...(T=(h=n.parameters)==null?void 0:h.docs)==null?void 0:T.source}}};var k,y,H;o.parameters={...o.parameters,docs:{...(k=o.parameters)==null?void 0:k.docs,source:{originalSource:`{
  render: () => <div className="max-w-3xl">
      <BracketTables brackets={DEFAULT_BRACKETS} initial="labor" />
    </div>
}`,...(H=(y=o.parameters)==null?void 0:y.docs)==null?void 0:H.source}}};var S,B,C;m.parameters={...m.parameters,docs:{...(S=m.parameters)==null?void 0:S.docs,source:{originalSource:`{
  render: () => <div className="max-w-3xl">
      <BracketTableCards brackets={DEFAULT_BRACKETS} />
    </div>
}`,...(C=(B=m.parameters)==null?void 0:B.docs)==null?void 0:C.source}}};const te=["情境說明_HelpHint","數字輸入_NumberInput","數字輸入_互動","列印頁首頁尾_PrintHeader","投保級距表_分頁版_BracketTables","投保級距卡_設定用_BracketTableCards"];export{te as __namedExportsOrder,ae as default,n as 列印頁首頁尾_PrintHeader,a as 情境說明_HelpHint,m as 投保級距卡_設定用_BracketTableCards,o as 投保級距表_分頁版_BracketTables,t as 數字輸入_NumberInput,s as 數字輸入_互動};
