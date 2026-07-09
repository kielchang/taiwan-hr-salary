import{j as e}from"./jsx-runtime-Cf8x2fCZ.js";import{r as I}from"./index-BO-NyGGJ.js";import{P as V,H as F,B as R,a as K}from"./BracketTableCards-CWmqBTSM.js";import{I as L}from"./select-BNwM6H6z.js";import{c as U}from"./utils-CdvzHgU1.js";import{D as q}from"./brackets-89KA2jQc.js";import"./index-yBjzXJbu.js";import"./dialog-Bx0FnwM5.js";import"./data-table-DrMJgm34.js";import"./index-CSSP-iJI.js";import"./index-B6ujFmsw.js";import"./empty-state-uDmSVxeh.js";import"./createLucideIcon-DqplzwSp.js";import"./button-BTs1SwH0.js";import"./index-9lgI2Bnf.js";import"./tooltip-CwGHE9xA.js";import"./check-DNs7zX_I.js";function p({value:r,onChange:n,className:t,step:c,min:A,disabled:P}){return e.jsx(L,{type:"number",inputMode:"numeric",step:c,min:A,disabled:P,value:Number.isFinite(r)?r:0,onChange:l=>n(l.target.value===""?0:Number(l.target.value)),className:U("h-8 w-28 text-right tabular-nums col-input",t)})}p.__docgenInfo={description:"數字輸入（橘色＝輸入欄語意，附錄B §B3.7）",methods:[],displayName:"NumberInput",props:{value:{required:!0,tsType:{name:"number"},description:""},onChange:{required:!0,tsType:{name:"signature",type:"function",raw:"(v: number) => void",signature:{arguments:[{type:{name:"number"},name:"v"}],return:{name:"void"}}},description:""},className:{required:!1,tsType:{name:"string"},description:""},step:{required:!1,tsType:{name:"number"},description:""},min:{required:!1,tsType:{name:"number"},description:""},disabled:{required:!1,tsType:{name:"boolean"},description:""}}};const oe={title:"元件/其他",parameters:{layout:"padded"}},a={render:()=>e.jsxs("div",{className:"flex items-center gap-2 text-lg font-bold",children:["基本資料 ",e.jsx(F,{id:"master"}),e.jsx("span",{className:"ml-4 text-sm font-normal text-muted-foreground",children:"（點 ℹ 展開情境式說明）"})]})},o={render:()=>{const r=()=>{const[n,t]=I.useState(45e3);return e.jsx("div",{className:"w-40",children:e.jsx(p,{value:n,onChange:t})})};return e.jsx(r,{})}},s={args:{初始值:45e3,步進:1e3,最小值:0,停用:!1},argTypes:{初始值:{control:"number"},步進:{control:{type:"range",min:1,max:5e3,step:1}},最小值:{control:"number"},停用:{control:"boolean"}},render:r=>{const n=()=>{const[t,c]=I.useState(r.初始值);return e.jsx("div",{className:"w-44",children:e.jsx(p,{value:t,onChange:c,step:r.步進,min:r.最小值,disabled:r.停用})})};return e.jsx(n,{},`${r.初始值}`)}},m={render:()=>e.jsxs("div",{className:"rounded border p-4",children:[e.jsx("style",{children:".print-header{display:block !important}"}),e.jsx(V,{title:"薪資明細表",period:"2026-06",company:"示範公司"}),e.jsx("p",{className:"mt-2 text-xs text-muted-foreground",children:"（實際僅於列印時顯示；此為版式預覽）"})]})},i={render:()=>e.jsx("div",{className:"max-w-3xl",children:e.jsx(K,{brackets:q,initial:"labor"})})},d={render:()=>e.jsx("div",{className:"max-w-3xl",children:e.jsx(R,{brackets:q})})};var u,x,b;a.parameters={...a.parameters,docs:{...(u=a.parameters)==null?void 0:u.docs,source:{originalSource:`{
  render: () => <div className="flex items-center gap-2 text-lg font-bold">
      基本資料 <HelpHint id="master" />
      <span className="ml-4 text-sm font-normal text-muted-foreground">（點 ℹ 展開情境式說明）</span>
    </div>
}`,...(b=(x=a.parameters)==null?void 0:x.docs)==null?void 0:b.source}}};var g,v,N;o.parameters={...o.parameters,docs:{...(g=o.parameters)==null?void 0:g.docs,source:{originalSource:`{
  render: () => {
    const Demo = () => {
      const [v, setV] = useState(45000);
      return <div className="w-40"><NumberInput value={v} onChange={setV} /></div>;
    };
    return <Demo />;
  }
}`,...(N=(v=o.parameters)==null?void 0:v.docs)==null?void 0:N.source}}};var f,y,_,T,h;s.parameters={...s.parameters,docs:{...(f=s.parameters)==null?void 0:f.docs,source:{originalSource:`{
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
}`,...(_=(y=s.parameters)==null?void 0:y.docs)==null?void 0:_.source},description:{story:"互動 Playground：右側 Controls 調整初始值/步進/最小值/停用。",...(h=(T=s.parameters)==null?void 0:T.docs)==null?void 0:h.description}}};var j,k,B;m.parameters={...m.parameters,docs:{...(j=m.parameters)==null?void 0:j.docs,source:{originalSource:`{
  render: () => <div className="rounded border p-4">
      {/* 平時 .print-header 僅列印顯示；此處強制顯示以便檢視版式 */}
      <style>{\`.print-header{display:block !important}\`}</style>
      <PrintHeader title="薪資明細表" period="2026-06" company="示範公司" />
      <p className="mt-2 text-xs text-muted-foreground">（實際僅於列印時顯示；此為版式預覽）</p>
    </div>
}`,...(B=(k=m.parameters)==null?void 0:k.docs)==null?void 0:B.source}}};var C,H,S;i.parameters={...i.parameters,docs:{...(C=i.parameters)==null?void 0:C.docs,source:{originalSource:`{
  render: () => <div className="max-w-3xl">
      <BracketTables brackets={DEFAULT_BRACKETS} initial="labor" />
    </div>
}`,...(S=(H=i.parameters)==null?void 0:H.docs)==null?void 0:S.source}}};var w,D,E;d.parameters={...d.parameters,docs:{...(w=d.parameters)==null?void 0:w.docs,source:{originalSource:`{
  render: () => <div className="max-w-3xl">
      <BracketTableCards brackets={DEFAULT_BRACKETS} />
    </div>
}`,...(E=(D=d.parameters)==null?void 0:D.docs)==null?void 0:E.source}}};const me=["情境說明_HelpHint","數字輸入_NumberInput","數字輸入_互動","列印頁首頁尾_PrintHeader","投保級距表_分頁版_BracketTables","投保級距卡_設定用_BracketTableCards"];export{me as __namedExportsOrder,oe as default,m as 列印頁首頁尾_PrintHeader,a as 情境說明_HelpHint,d as 投保級距卡_設定用_BracketTableCards,i as 投保級距表_分頁版_BracketTables,o as 數字輸入_NumberInput,s as 數字輸入_互動};
