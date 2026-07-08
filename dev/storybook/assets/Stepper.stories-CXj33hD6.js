import{j as n}from"./jsx-runtime-Cf8x2fCZ.js";import{S as t}from"./Stepper-DzOchFjc.js";import"./index-yBjzXJbu.js";import"./utils-CdvzHgU1.js";import"./check-DNs7zX_I.js";import"./createLucideIcon-DqplzwSp.js";import"./index-BO-NyGGJ.js";const x={title:"元件/基礎/Stepper",component:t,parameters:{layout:"padded"}},l=[{key:"basic",label:"基本資料"},{key:"salary",label:"固定薪資"},{key:"family",label:"眷屬與扣繳"},{key:"confirm",label:"確認"}],e={render:()=>n.jsx(t,{steps:l,current:"salary",completed:{basic:!0}})},r={render:()=>n.jsx(t,{steps:l,current:"confirm",completed:{basic:!0,salary:!0,family:!0}})};var s,a,o;e.parameters={...e.parameters,docs:{...(s=e.parameters)==null?void 0:s.docs,source:{originalSource:`{
  render: () => <Stepper steps={steps} current="salary" completed={{
    basic: true
  }} />
}`,...(o=(a=e.parameters)==null?void 0:a.docs)==null?void 0:o.source}}};var p,c,m;r.parameters={...r.parameters,docs:{...(p=r.parameters)==null?void 0:p.docs,source:{originalSource:`{
  render: () => <Stepper steps={steps} current="confirm" completed={{
    basic: true,
    salary: true,
    family: true
  }} />
}`,...(m=(c=r.parameters)==null?void 0:c.docs)==null?void 0:m.source}}};const j=["第二步","最後一步"];export{j as __namedExportsOrder,x as default,r as 最後一步,e as 第二步};
