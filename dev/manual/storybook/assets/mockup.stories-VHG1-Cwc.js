import{j as e}from"./jsx-runtime-Cf8x2fCZ.js";import{c as p}from"./utils-BEESGUdN.js";import{B as _}from"./button-SglK-g-6.js";import{B as T}from"./badge-Ck-4l2Uv.js";import{C as M}from"./callout-D1Pyhy-i.js";import"./index-yBjzXJbu.js";import"./index-BO-NyGGJ.js";import"./index-BZsrq3rz.js";import"./index-C-0izQnN.js";import"./createLucideIcon-DqplzwSp.js";function r({w:s,h:n=14,label:d,className:k}){return e.jsx("div",{className:p("mock-ph flex shrink-0 items-center justify-center overflow-hidden whitespace-nowrap rounded-md bg-muted text-[11px] text-muted-foreground",k),style:{width:s??"100%",height:n},children:d??""})}function c({children:s,label:n,className:d}){return e.jsxs("span",{className:p("tour-pulse-ring relative inline-block rounded-lg p-1",d),children:[s,n&&e.jsx("span",{className:"absolute left-2 whitespace-nowrap rounded-md bg-primary px-2 py-0.5 text-[11px] text-primary-foreground",style:{top:-10,transform:"translateY(-100%)"},children:n})]})}function S({children:s,className:n}){return e.jsxs("div",{className:p("flex min-w-[460px] gap-2.5 bg-background p-3 text-foreground",n),style:{minHeight:230},children:[e.jsxs("div",{className:"flex w-[90px] flex-col gap-1.5",children:[e.jsx(r,{h:22,label:"選單"}),e.jsx(r,{h:14}),e.jsx(r,{h:14}),e.jsx(r,{h:14}),e.jsx(r,{h:14}),e.jsx(r,{h:14})]}),e.jsxs("div",{className:"flex min-w-0 flex-1 flex-col gap-2.5",children:[e.jsx(r,{h:20,label:"頂部狀態列"}),e.jsx("div",{className:"flex flex-col items-stretch gap-2.5",children:s})]})]})}function a({focus:s}){return e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(r,{w:64}),e.jsx(r,{w:90}),e.jsx(r,{}),e.jsx(r,{w:70}),s??e.jsx(r,{w:64,h:22})]})}r.__docgenInfo={description:"佔位塊：非重點區域一律留白（muted 圓角塊，可帶淡字標籤）。寬高為版面數值，保留 style 傳入。",methods:[],displayName:"Placeholder",props:{w:{required:!1,tsType:{name:"union",raw:"number | string",elements:[{name:"number"},{name:"string"}]},description:""},h:{required:!1,tsType:{name:"number"},description:"",defaultValue:{value:"14",computed:!1}},label:{required:!1,tsType:{name:"string"},description:""},className:{required:!1,tsType:{name:"string"},description:""}}};c.__docgenInfo={description:"聚光：包住「重點元件」——主色脈動環（tour-pulse，與系統內導覽同視覺）＋可選浮動標籤。",methods:[],displayName:"Spotlight",props:{children:{required:!0,tsType:{name:"ReactNode"},description:""},label:{required:!1,tsType:{name:"string"},description:""},className:{required:!1,tsType:{name:"string"},description:""}}};S.__docgenInfo={description:`畫面框：模擬系統版面（側欄/頂欄＝佔位），children 放該步驟的排版。
 min-w 保底＝小螢幕靠外層容器橫向捲動，不擠壞排版。`,methods:[],displayName:"MockScreenFrame",props:{children:{required:!0,tsType:{name:"ReactNode"},description:""},className:{required:!1,tsType:{name:"string"},description:""}}};a.__docgenInfo={description:"表格假列（可帶重點格 focus）",methods:[],displayName:"MockRow",props:{focus:{required:!1,tsType:{name:"ReactNode"},description:""}}};const O={title:"元件/模擬畫面",parameters:{layout:"centered"}},t={args:{寬:220,高:40,標籤:"內容區（略）"},argTypes:{寬:{control:{type:"range",min:40,max:480,step:10}},高:{control:{type:"range",min:10,max:120,step:2}},標籤:{control:"text"}},render:s=>e.jsx(r,{w:s.寬,h:s.高,label:s.標籤})},o={args:{標籤:"按這裡"},argTypes:{標籤:{control:"text"}},render:s=>e.jsx("div",{className:"p-10",children:e.jsx(c,{label:s.標籤||void 0,children:e.jsx(_,{size:"sm",children:"確認本月結算"})})})},l={render:()=>e.jsxs("div",{className:"flex w-[520px] flex-col gap-2",children:[e.jsx(a,{}),e.jsx(a,{focus:e.jsx(c,{label:"完成後你會看到",children:e.jsx(T,{variant:"secondary",children:"加班 8 小時"})})}),e.jsx(a,{})]})},i={parameters:{layout:"padded"},render:()=>e.jsx("div",{className:"w-[640px] overflow-x-auto rounded-lg border",children:e.jsxs(S,{children:[e.jsxs("div",{className:"flex justify-between",children:[e.jsx(r,{w:200,h:26,label:"員工清單"}),e.jsx(c,{label:"從這裡建檔",children:e.jsx(_,{size:"sm",children:"新進到職"})})]}),e.jsx(a,{}),e.jsx(a,{}),e.jsx(M,{variant:"info",title:"完成後你會看到",children:"員工清單多出這位新人；工作台「本月應加保」+1。"})]})})};var m,x,u;t.parameters={...t.parameters,docs:{...(m=t.parameters)==null?void 0:m.docs,source:{originalSource:`{
  args: {
    寬: 220,
    高: 40,
    標籤: "內容區（略）"
  },
  argTypes: {
    寬: {
      control: {
        type: "range",
        min: 40,
        max: 480,
        step: 10
      }
    },
    高: {
      control: {
        type: "range",
        min: 10,
        max: 120,
        step: 2
      }
    },
    標籤: {
      control: "text"
    }
  },
  render: a => <Placeholder w={a.寬} h={a.高} label={a.標籤} />
}`,...(u=(x=t.parameters)==null?void 0:x.docs)==null?void 0:u.source}}};var h,f,g;o.parameters={...o.parameters,docs:{...(h=o.parameters)==null?void 0:h.docs,source:{originalSource:`{
  args: {
    標籤: "按這裡"
  },
  argTypes: {
    標籤: {
      control: "text"
    }
  },
  render: a => <div className="p-10">
      <Spotlight label={a.標籤 || undefined}><Button size="sm">確認本月結算</Button></Spotlight>
    </div>
}`,...(g=(f=o.parameters)==null?void 0:f.docs)==null?void 0:g.source}}};var j,y,w;l.parameters={...l.parameters,docs:{...(j=l.parameters)==null?void 0:j.docs,source:{originalSource:`{
  render: () => <div className="flex w-[520px] flex-col gap-2">
      <MockRow />
      <MockRow focus={<Spotlight label="完成後你會看到"><Badge variant="secondary">加班 8 小時</Badge></Spotlight>} />
      <MockRow />
    </div>
}`,...(w=(y=l.parameters)==null?void 0:y.docs)==null?void 0:w.source}}};var v,b,N;i.parameters={...i.parameters,docs:{...(v=i.parameters)==null?void 0:v.docs,source:{originalSource:`{
  parameters: {
    layout: "padded"
  },
  render: () => <div className="w-[640px] overflow-x-auto rounded-lg border">
      <MockScreenFrame>
        <div className="flex justify-between">
          <Placeholder w={200} h={26} label="員工清單" />
          <Spotlight label="從這裡建檔"><Button size="sm">新進到職</Button></Spotlight>
        </div>
        <MockRow /><MockRow />
        <Callout variant="info" title="完成後你會看到">員工清單多出這位新人；工作台「本月應加保」+1。</Callout>
      </MockScreenFrame>
    </div>
}`,...(N=(b=i.parameters)==null?void 0:b.docs)==null?void 0:N.source}}};const V=["佔位塊_互動","聚光_互動","假列_重點格","組合示例_模擬步驟"];export{V as __namedExportsOrder,O as default,t as 佔位塊_互動,l as 假列_重點格,i as 組合示例_模擬步驟,o as 聚光_互動};
