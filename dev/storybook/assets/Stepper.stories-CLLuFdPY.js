import{j as s}from"./jsx-runtime-Cf8x2fCZ.js";import{S as a}from"./Stepper-B_g2GFO-.js";import"./index-yBjzXJbu.js";import"./utils-CdvzHgU1.js";import"./check-DNs7zX_I.js";import"./createLucideIcon-DqplzwSp.js";import"./index-BO-NyGGJ.js";const N={title:"元件/基礎/Stepper",component:a,parameters:{layout:"padded"}},j=[{key:"basic",label:"基本資料"},{key:"salary",label:"固定薪資"},{key:"family",label:"眷屬與扣繳"},{key:"confirm",label:"確認"}],r={args:{步驟數:4,目前步驟:1},argTypes:{步驟數:{control:{type:"range",min:2,max:8,step:1}},目前步驟:{control:{type:"range",min:0,max:7,step:1}}},render:o=>{const c=Array.from({length:o.步驟數},(_,e)=>({key:String(e),label:`步驟${e+1}`})),p=Math.min(o.目前步驟,o.步驟數-1),k=Object.fromEntries(c.map((_,e)=>[String(e),e<p]));return s.jsx("div",{className:"w-[560px]",children:s.jsx(a,{steps:c,current:String(p),completed:k})})}},t={render:()=>s.jsx(a,{steps:j,current:"salary",completed:{basic:!0}})},n={render:()=>s.jsx(a,{steps:j,current:"confirm",completed:{basic:!0,salary:!0,family:!0}})};var m,i,l,d,u;r.parameters={...r.parameters,docs:{...(m=r.parameters)==null?void 0:m.docs,source:{originalSource:`{
  args: {
    步驟數: 4,
    目前步驟: 1
  },
  argTypes: {
    步驟數: {
      control: {
        type: "range",
        min: 2,
        max: 8,
        step: 1
      }
    },
    目前步驟: {
      control: {
        type: "range",
        min: 0,
        max: 7,
        step: 1
      }
    }
  },
  render: a => {
    const items = Array.from({
      length: a.步驟數
    }, (_, i) => ({
      key: String(i),
      label: \`步驟\${i + 1}\`
    }));
    const cur = Math.min(a.目前步驟, a.步驟數 - 1);
    const completed = Object.fromEntries(items.map((_, i) => [String(i), i < cur]));
    return <div className="w-[560px]"><Stepper steps={items} current={String(cur)} completed={completed} /></div>;
  }
}`,...(l=(i=r.parameters)==null?void 0:i.docs)==null?void 0:l.source},description:{story:"互動 Playground：右側 Controls 調整步驟數與目前步驟，即時看樣式。",...(u=(d=r.parameters)==null?void 0:d.docs)==null?void 0:u.description}}};var y,g,S;t.parameters={...t.parameters,docs:{...(y=t.parameters)==null?void 0:y.docs,source:{originalSource:`{
  render: () => <Stepper steps={steps} current="salary" completed={{
    basic: true
  }} />
}`,...(S=(g=t.parameters)==null?void 0:g.docs)==null?void 0:S.source}}};var x,b,f;n.parameters={...n.parameters,docs:{...(x=n.parameters)==null?void 0:x.docs,source:{originalSource:`{
  render: () => <Stepper steps={steps} current="confirm" completed={{
    basic: true,
    salary: true,
    family: true
  }} />
}`,...(f=(b=n.parameters)==null?void 0:b.docs)==null?void 0:f.source}}};const T=["互動","第二步","最後一步"];export{T as __namedExportsOrder,N as default,r as 互動,n as 最後一步,t as 第二步};
