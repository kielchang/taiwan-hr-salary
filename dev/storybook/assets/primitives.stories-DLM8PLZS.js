import{j as e}from"./jsx-runtime-Cf8x2fCZ.js";import{B as D}from"./button-BpuW6BL2.js";import{B as k}from"./badge-DdjrCzeD.js";import{D as o,C as L}from"./checkbox-Cl61x2rt.js";import{E,I as T}from"./empty-state-uDmSVxeh.js";import{I as d,S as z,a as V,b as H,c as A,d as i}from"./select-D8Pe3zde.js";import{C as O,a as R,b as q,c as F,d as G}from"./card-ComTj0HN.js";import"./index-yBjzXJbu.js";import"./index-BO-NyGGJ.js";import"./index-9lgI2Bnf.js";import"./utils-CdvzHgU1.js";import"./check-DNs7zX_I.js";import"./createLucideIcon-DqplzwSp.js";import"./index-CSSP-iJI.js";import"./index-B6ujFmsw.js";const te={title:"元件/基礎",parameters:{layout:"centered"}},r={render:()=>e.jsx("div",{className:"flex flex-wrap gap-2",children:["default","secondary","outline","ghost","destructive","link"].map(a=>e.jsx(D,{variant:a,children:a},a))})},s={render:()=>e.jsx("div",{className:"flex flex-wrap gap-2",children:["default","secondary","outline","success","warning","destructive"].map(a=>e.jsx(k,{variant:a,children:a},a))})},t={render:()=>e.jsxs("div",{className:"flex gap-6",children:[e.jsx(o,{value:12e3,posLabel:"增加",negLabel:"減少"}),e.jsx(o,{value:-8e3,posLabel:"增加",negLabel:"減少"}),e.jsx(o,{value:0})]})},n={render:()=>e.jsx("div",{className:"w-96 rounded-md border",children:e.jsx(E,{icon:e.jsx(T,{className:"size-6"}),title:"尚未建立資料",hint:"按「新增」開始，或載入示範資料。",action:e.jsx(D,{size:"sm",children:"新增"})})})},l={render:()=>e.jsxs("div",{className:"w-80 space-y-3",children:[e.jsx(d,{placeholder:"文字輸入"}),e.jsx(d,{type:"number",placeholder:"數字",className:"text-right tabular-nums"}),e.jsxs(z,{defaultValue:"a",children:[e.jsx(V,{children:e.jsx(H,{})}),e.jsxs(A,{children:[e.jsx(i,{value:"a",children:"選項 A"}),e.jsx(i,{value:"b",children:"選項 B"})]})]}),e.jsxs("label",{className:"flex items-center gap-2 text-sm",children:[e.jsx(L,{defaultChecked:!0})," 勾選項目"]})]})},c={render:()=>e.jsxs(O,{className:"w-80",children:[e.jsxs(R,{children:[e.jsx(q,{className:"text-base",children:"卡片標題"}),e.jsx(F,{children:"卡片說明文字。"})]}),e.jsx(G,{className:"text-sm text-muted-foreground",children:"卡片內容區。"})]})};var m,p,u;r.parameters={...r.parameters,docs:{...(m=r.parameters)==null?void 0:m.docs,source:{originalSource:`{
  render: () => <div className="flex flex-wrap gap-2">
      {(["default", "secondary", "outline", "ghost", "destructive", "link"] as const).map(v => <Button key={v} variant={v}>{v}</Button>)}
    </div>
}`,...(u=(p=r.parameters)==null?void 0:p.docs)==null?void 0:u.source}}};var x,g,v;s.parameters={...s.parameters,docs:{...(x=s.parameters)==null?void 0:x.docs,source:{originalSource:`{
  render: () => <div className="flex flex-wrap gap-2">
      {(["default", "secondary", "outline", "success", "warning", "destructive"] as const).map(v => <Badge key={v} variant={v}>{v}</Badge>)}
    </div>
}`,...(v=(g=s.parameters)==null?void 0:g.docs)==null?void 0:v.source}}};var h,C,f;t.parameters={...t.parameters,docs:{...(h=t.parameters)==null?void 0:h.docs,source:{originalSource:`{
  render: () => <div className="flex gap-6">
      <Delta value={12000} posLabel="增加" negLabel="減少" />
      <Delta value={-8000} posLabel="增加" negLabel="減少" />
      <Delta value={0} />
    </div>
}`,...(f=(C=t.parameters)==null?void 0:C.docs)==null?void 0:f.source}}};var j,b,S;n.parameters={...n.parameters,docs:{...(j=n.parameters)==null?void 0:j.docs,source:{originalSource:`{
  render: () => <div className="w-96 rounded-md border">
      <EmptyState icon={<Inbox className="size-6" />} title="尚未建立資料" hint="按「新增」開始，或載入示範資料。" action={<Button size="sm">新增</Button>} />
    </div>
}`,...(S=(b=n.parameters)==null?void 0:b.docs)==null?void 0:S.source}}};var N,B,y;l.parameters={...l.parameters,docs:{...(N=l.parameters)==null?void 0:N.docs,source:{originalSource:`{
  render: () => <div className="w-80 space-y-3">
      <Input placeholder="文字輸入" />
      <Input type="number" placeholder="數字" className="text-right tabular-nums" />
      <Select defaultValue="a">
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="a">選項 A</SelectItem>
          <SelectItem value="b">選項 B</SelectItem>
        </SelectContent>
      </Select>
      <label className="flex items-center gap-2 text-sm"><Checkbox defaultChecked /> 勾選項目</label>
    </div>
}`,...(y=(B=l.parameters)==null?void 0:B.docs)==null?void 0:y.source}}};var _,w,I;c.parameters={...c.parameters,docs:{...(_=c.parameters)==null?void 0:_.docs,source:{originalSource:`{
  render: () => <Card className="w-80">
      <CardHeader>
        <CardTitle className="text-base">卡片標題</CardTitle>
        <CardDescription>卡片說明文字。</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">卡片內容區。</CardContent>
    </Card>
}`,...(I=(w=c.parameters)==null?void 0:w.docs)==null?void 0:I.source}}};const ne=["按鈕_Button","標籤_Badge","差異_Delta","空狀態_EmptyState","表單控制項_Controls","卡片_Card"];export{ne as __namedExportsOrder,te as default,c as 卡片_Card,t as 差異_Delta,r as 按鈕_Button,s as 標籤_Badge,n as 空狀態_EmptyState,l as 表單控制項_Controls};
