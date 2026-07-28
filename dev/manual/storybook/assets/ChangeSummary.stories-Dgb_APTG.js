import{j as r}from"./jsx-runtime-Cf8x2fCZ.js";import{C as t}from"./ChangeSummary-CFlxJ6LG.js";import"./index-yBjzXJbu.js";import"./index-BO-NyGGJ.js";import"./utils-BEESGUdN.js";import"./tooltip-jXVQej4V.js";import"./undo-2-BWndPgvs.js";import"./createLucideIcon-DqplzwSp.js";const N={title:"元件/表單/ChangeSummary",component:t,parameters:{layout:"centered"}},b=[{field:"name",label:"姓名",before:"王小明",after:"王大明",beforeText:"王小明",afterText:"王大明"},{field:"baseSalary",label:"本薪",before:4e4,after:45e3,beforeText:"40,000",afterText:"45,000"},{field:"status",label:"任職狀態",before:"在職",after:"留停",beforeText:"在職",afterText:"留停"}],a={args:{變更筆數:3},argTypes:{變更筆數:{control:{type:"range",min:0,max:30,step:1}}},render:h=>{const v=Array.from({length:h.變更筆數},(y,e)=>({field:`f${e}`,label:`欄位${e+1}`,before:e,after:e+1,beforeText:`舊值${e}`,afterText:`新值${e+1}`}));return r.jsx("div",{className:"w-96",children:r.jsx(t,{changes:v,onRevertField:()=>{},onRevertAll:()=>{}})})}},n={render:()=>r.jsx("div",{className:"w-96",children:r.jsx(t,{changes:b,onRevertField:()=>{},onRevertAll:()=>{}})})},s={render:()=>r.jsx("div",{className:"w-96",children:r.jsx(t,{changes:[]})})};var o,m,l,c,i;a.parameters={...a.parameters,docs:{...(o=a.parameters)==null?void 0:o.docs,source:{originalSource:`{
  args: {
    變更筆數: 3
  },
  argTypes: {
    變更筆數: {
      control: {
        type: "range",
        min: 0,
        max: 30,
        step: 1
      }
    }
  },
  render: a => {
    const changes: Change[] = Array.from({
      length: a.變更筆數
    }, (_, i) => ({
      field: \`f\${i}\`,
      label: \`欄位\${i + 1}\`,
      before: i,
      after: i + 1,
      beforeText: \`舊值\${i}\`,
      afterText: \`新值\${i + 1}\`
    }));
    return <div className="w-96"><ChangeSummary changes={changes} onRevertField={() => {}} onRevertAll={() => {}} /></div>;
  }
}`,...(l=(m=a.parameters)==null?void 0:m.docs)==null?void 0:l.source},description:{story:"互動 Playground：右側 Controls 調整變更筆數（含捲動門檻），即時看樣式。",...(i=(c=a.parameters)==null?void 0:c.docs)==null?void 0:i.description}}};var d,p,f;n.parameters={...n.parameters,docs:{...(d=n.parameters)==null?void 0:d.docs,source:{originalSource:`{
  render: () => <div className="w-96"><ChangeSummary changes={sample} onRevertField={() => {}} onRevertAll={() => {}} /></div>
}`,...(f=(p=n.parameters)==null?void 0:p.docs)==null?void 0:f.source}}};var g,x,u;s.parameters={...s.parameters,docs:{...(g=s.parameters)==null?void 0:g.docs,source:{originalSource:`{
  render: () => <div className="w-96"><ChangeSummary changes={[]} /></div>
}`,...(u=(x=s.parameters)==null?void 0:x.docs)==null?void 0:u.source}}};const F=["互動","有變更","尚無變更"];export{F as __namedExportsOrder,N as default,a as 互動,s as 尚無變更,n as 有變更};
