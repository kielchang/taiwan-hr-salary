import{j as e}from"./jsx-runtime-Cf8x2fCZ.js";import{r as E}from"./index-BO-NyGGJ.js";import{P as w,H as I,B as D,a as q}from"./BracketTableCards-DzygQFdi.js";import{I as A}from"./select-D8Pe3zde.js";import{c as P}from"./utils-CdvzHgU1.js";import{D as k}from"./brackets-89KA2jQc.js";import"./index-yBjzXJbu.js";import"./dialog-DtyNArNj.js";import"./createLucideIcon-DqplzwSp.js";import"./data-table-C54ZhBYd.js";import"./empty-state-uDmSVxeh.js";import"./button-BpuW6BL2.js";import"./index-9lgI2Bnf.js";import"./tooltip-CwGHE9xA.js";import"./index-CSSP-iJI.js";import"./index-B6ujFmsw.js";import"./check-DNs7zX_I.js";function B({value:r,onChange:i,className:m,step:H,min:C,disabled:S}){return e.jsx(A,{type:"number",inputMode:"numeric",step:H,min:C,disabled:S,value:Number.isFinite(r)?r:0,onChange:d=>i(d.target.value===""?0:Number(d.target.value)),className:P("h-8 w-28 text-right tabular-nums col-input",m)})}B.__docgenInfo={description:"數字輸入（橘色＝輸入欄語意，附錄B §B3.7）",methods:[],displayName:"NumberInput",props:{value:{required:!0,tsType:{name:"number"},description:""},onChange:{required:!0,tsType:{name:"signature",type:"function",raw:"(v: number) => void",signature:{arguments:[{type:{name:"number"},name:"v"}],return:{name:"void"}}},description:""},className:{required:!1,tsType:{name:"string"},description:""},step:{required:!1,tsType:{name:"number"},description:""},min:{required:!1,tsType:{name:"number"},description:""},disabled:{required:!1,tsType:{name:"boolean"},description:""}}};const ee={title:"元件/其他",parameters:{layout:"padded"}},t={render:()=>e.jsxs("div",{className:"flex items-center gap-2 text-lg font-bold",children:["基本資料 ",e.jsx(I,{id:"master"}),e.jsx("span",{className:"ml-4 text-sm font-normal text-muted-foreground",children:"（點 ℹ 展開情境式說明）"})]})},a={render:()=>{const r=()=>{const[i,m]=E.useState(45e3);return e.jsx("div",{className:"w-40",children:e.jsx(B,{value:i,onChange:m})})};return e.jsx(r,{})}},s={render:()=>e.jsxs("div",{className:"rounded border p-4",children:[e.jsx("style",{children:".print-header{display:block !important}"}),e.jsx(w,{title:"薪資明細表",period:"2026-06",company:"示範公司"}),e.jsx("p",{className:"mt-2 text-xs text-muted-foreground",children:"（實際僅於列印時顯示；此為版式預覽）"})]})},n={render:()=>e.jsx("div",{className:"max-w-3xl",children:e.jsx(q,{brackets:k,initial:"labor"})})},o={render:()=>e.jsx("div",{className:"max-w-3xl",children:e.jsx(D,{brackets:k})})};var c,p,l;t.parameters={...t.parameters,docs:{...(c=t.parameters)==null?void 0:c.docs,source:{originalSource:`{
  render: () => <div className="flex items-center gap-2 text-lg font-bold">
      基本資料 <HelpHint id="master" />
      <span className="ml-4 text-sm font-normal text-muted-foreground">（點 ℹ 展開情境式說明）</span>
    </div>
}`,...(l=(p=t.parameters)==null?void 0:p.docs)==null?void 0:l.source}}};var u,x,b;a.parameters={...a.parameters,docs:{...(u=a.parameters)==null?void 0:u.docs,source:{originalSource:`{
  render: () => {
    const Demo = () => {
      const [v, setV] = useState(45000);
      return <div className="w-40"><NumberInput value={v} onChange={setV} /></div>;
    };
    return <Demo />;
  }
}`,...(b=(x=a.parameters)==null?void 0:x.docs)==null?void 0:b.source}}};var v,g,f;s.parameters={...s.parameters,docs:{...(v=s.parameters)==null?void 0:v.docs,source:{originalSource:`{
  render: () => <div className="rounded border p-4">
      {/* 平時 .print-header 僅列印顯示；此處強制顯示以便檢視版式 */}
      <style>{\`.print-header{display:block !important}\`}</style>
      <PrintHeader title="薪資明細表" period="2026-06" company="示範公司" />
      <p className="mt-2 text-xs text-muted-foreground">（實際僅於列印時顯示；此為版式預覽）</p>
    </div>
}`,...(f=(g=s.parameters)==null?void 0:g.docs)==null?void 0:f.source}}};var N,_,T;n.parameters={...n.parameters,docs:{...(N=n.parameters)==null?void 0:N.docs,source:{originalSource:`{
  render: () => <div className="max-w-3xl">
      <BracketTables brackets={DEFAULT_BRACKETS} initial="labor" />
    </div>
}`,...(T=(_=n.parameters)==null?void 0:_.docs)==null?void 0:T.source}}};var h,y,j;o.parameters={...o.parameters,docs:{...(h=o.parameters)==null?void 0:h.docs,source:{originalSource:`{
  render: () => <div className="max-w-3xl">
      <BracketTableCards brackets={DEFAULT_BRACKETS} />
    </div>
}`,...(j=(y=o.parameters)==null?void 0:y.docs)==null?void 0:j.source}}};const re=["情境說明_HelpHint","數字輸入_NumberInput","列印頁首頁尾_PrintHeader","投保級距表_分頁版_BracketTables","投保級距卡_設定用_BracketTableCards"];export{re as __namedExportsOrder,ee as default,s as 列印頁首頁尾_PrintHeader,t as 情境說明_HelpHint,o as 投保級距卡_設定用_BracketTableCards,n as 投保級距表_分頁版_BracketTables,a as 數字輸入_NumberInput};
