import{j as e}from"./jsx-runtime-Cf8x2fCZ.js";import{r as m}from"./index-BO-NyGGJ.js";import{S as p,C as t}from"./chips-yGbXDsQY.js";import"./index-yBjzXJbu.js";import"./utils-BEESGUdN.js";import"./check-DNs7zX_I.js";import"./createLucideIcon-DqplzwSp.js";const q={title:"元件/選擇",parameters:{layout:"centered"}},u=[{value:"active",label:"在職"},{value:"leave",label:"留停"},{value:"terminated",label:"離職"}],g=[{value:"meal",label:"伙食"},{value:"transport",label:"交通"},{value:"duty",label:"職務"},{value:"skill",label:"技術"}],r={args:{已改動:!1,鎖定:!1},argTypes:{已改動:{control:"boolean"},鎖定:{control:"boolean"}},render:a=>{const[l,s]=m.useState("active");return e.jsx(p,{label:"員工狀態",options:u,value:l,onPick:s,changed:a.已改動,disabled:a.鎖定,lockHint:"本月已確認，需先取消確認才能修改"})}},c={parameters:{layout:"padded"},render:()=>{const[a,l]=m.useState("active");return e.jsxs("div",{className:"flex flex-col gap-3",children:[e.jsx(p,{label:"預設",options:u,value:a,onPick:l}),e.jsx(p,{label:"已改動未送出",options:u,value:"leave",onPick:()=>{},changed:!0}),e.jsx(p,{label:"鎖定",options:u,value:"active",onPick:()=>{},disabled:!0,lockHint:"本月已確認"})]})}},i={args:{已改動:!1,鎖定:!1},argTypes:{已改動:{control:"boolean"},鎖定:{control:"boolean"}},render:a=>{const[l,s]=m.useState(["meal"]);return e.jsx(t,{label:"固定津貼",options:g,selected:l,onToggle:n=>s(o=>o.includes(n)?o.filter(P=>P!==n):[...o,n]),changed:a.已改動,disabled:a.鎖定,lockHint:"本月已確認，需先取消確認才能修改"})}},d={parameters:{layout:"padded"},render:()=>{const[a,l]=m.useState(["meal","transport"]);return e.jsxs("div",{className:"flex flex-col gap-3",children:[e.jsx(t,{label:"預設",options:g,selected:a,onToggle:s=>l(n=>n.includes(s)?n.filter(o=>o!==s):[...n,s])}),e.jsx(t,{label:"已改動未送出",options:g,selected:["duty"],onToggle:()=>{},changed:!0}),e.jsx(t,{label:"鎖定",options:g,selected:["meal"],onToggle:()=>{},disabled:!0,lockHint:"本月已確認"}),e.jsx(t,{label:"無選項（emptyHint）",options:[],selected:[],onToggle:()=>{},emptyHint:"尚未設定任何津貼項目"})]})}};var b,v,x;r.parameters={...r.parameters,docs:{...(b=r.parameters)==null?void 0:b.docs,source:{originalSource:`{
  args: {
    已改動: false,
    鎖定: false
  },
  argTypes: {
    已改動: {
      control: "boolean"
    },
    鎖定: {
      control: "boolean"
    }
  },
  render: a => {
    const [v, setV] = useState("active");
    return <SegGroup label="員工狀態" options={狀態} value={v} onPick={setV} changed={a.已改動} disabled={a.鎖定} lockHint="本月已確認，需先取消確認才能修改" />;
  }
}`,...(x=(v=r.parameters)==null?void 0:v.docs)==null?void 0:x.source}}};var f,S,k;c.parameters={...c.parameters,docs:{...(f=c.parameters)==null?void 0:f.docs,source:{originalSource:`{
  parameters: {
    layout: "padded"
  },
  render: () => {
    const [v, setV] = useState("active");
    return <div className="flex flex-col gap-3">
        <SegGroup label="預設" options={狀態} value={v} onPick={setV} />
        <SegGroup label="已改動未送出" options={狀態} value="leave" onPick={() => {}} changed />
        <SegGroup label="鎖定" options={狀態} value="active" onPick={() => {}} disabled lockHint="本月已確認" />
      </div>;
  }
}`,...(k=(S=c.parameters)==null?void 0:S.docs)==null?void 0:k.source}}};var h,y,T;i.parameters={...i.parameters,docs:{...(h=i.parameters)==null?void 0:h.docs,source:{originalSource:`{
  args: {
    已改動: false,
    鎖定: false
  },
  argTypes: {
    已改動: {
      control: "boolean"
    },
    鎖定: {
      control: "boolean"
    }
  },
  render: a => {
    const [sel, setSel] = useState<string[]>(["meal"]);
    return <Chips label="固定津貼" options={津貼} selected={sel} onToggle={v => setSel(s => s.includes(v) ? s.filter(x => x !== v) : [...s, v])} changed={a.已改動} disabled={a.鎖定} lockHint="本月已確認，需先取消確認才能修改" />;
  }
}`,...(T=(y=i.parameters)==null?void 0:y.docs)==null?void 0:T.source}}};var j,H,_;d.parameters={...d.parameters,docs:{...(j=d.parameters)==null?void 0:j.docs,source:{originalSource:`{
  parameters: {
    layout: "padded"
  },
  render: () => {
    const [sel, setSel] = useState<string[]>(["meal", "transport"]);
    return <div className="flex flex-col gap-3">
        <Chips label="預設" options={津貼} selected={sel} onToggle={v => setSel(s => s.includes(v) ? s.filter(x => x !== v) : [...s, v])} />
        <Chips label="已改動未送出" options={津貼} selected={["duty"]} onToggle={() => {}} changed />
        <Chips label="鎖定" options={津貼} selected={["meal"]} onToggle={() => {}} disabled lockHint="本月已確認" />
        <Chips label="無選項（emptyHint）" options={[]} selected={[]} onToggle={() => {}} emptyHint="尚未設定任何津貼項目" />
      </div>;
  }
}`,...(_=(H=d.parameters)==null?void 0:H.docs)==null?void 0:_.source}}};const w=["分段選擇_互動","分段選擇_三態","標籤片_互動","標籤片_四態"];export{w as __namedExportsOrder,q as default,c as 分段選擇_三態,r as 分段選擇_互動,i as 標籤片_互動,d as 標籤片_四態};
