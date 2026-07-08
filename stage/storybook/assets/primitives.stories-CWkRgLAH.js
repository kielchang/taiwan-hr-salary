import{j as e}from"./jsx-runtime-Cf8x2fCZ.js";import{B as x}from"./button-BpuW6BL2.js";import{B as X}from"./badge-DdjrCzeD.js";import{D as u,C as ne}from"./checkbox-Cl61x2rt.js";import{E as Y,I as Z}from"./empty-state-uDmSVxeh.js";import{I as v,S as re,a as ae,b as te,c as se,d as f}from"./select-D8Pe3zde.js";import{C as oe,a as ce,b as le,c as de,d as ie}from"./card-ComTj0HN.js";import{T as me,a as pe}from"./tooltip-CwGHE9xA.js";import"./index-yBjzXJbu.js";import"./index-BO-NyGGJ.js";import"./index-9lgI2Bnf.js";import"./utils-CdvzHgU1.js";import"./check-DNs7zX_I.js";import"./createLucideIcon-DqplzwSp.js";import"./index-CSSP-iJI.js";import"./index-B6ujFmsw.js";const Le={title:"元件/基礎",parameters:{layout:"centered"}},r={args:{樣式:"default",尺寸:"default",文字:"按鈕",停用:!1},argTypes:{樣式:{control:"select",options:["default","secondary","outline","ghost","destructive","link"]},尺寸:{control:"inline-radio",options:["default","sm","lg","icon"]},文字:{control:"text"},停用:{control:"boolean"}},render:n=>e.jsx(x,{variant:n.樣式,size:n.尺寸,disabled:n.停用,children:n.文字})},a={args:{樣式:"success",文字:"已確認"},argTypes:{樣式:{control:"select",options:["default","secondary","outline","success","warning","destructive"]},文字:{control:"text"}},render:n=>e.jsx(X,{variant:n.樣式,children:n.文字})},t={args:{數值:12e3,格式:"數字",增標籤:"增加",減標籤:"減少"},argTypes:{數值:{control:{type:"range",min:-5e4,max:5e4,step:1e3}},格式:{control:"inline-radio",options:["數字","百分比","金額"]},增標籤:{control:"text"},減標籤:{control:"text"}},render:n=>{const ee=n.格式==="百分比"?g=>`${g}%`:n.格式==="金額"?g=>`$${g.toLocaleString()}`:void 0;return e.jsx(u,{value:n.數值,format:ee,posLabel:n.增標籤,negLabel:n.減標籤})}},s={args:{標題:"尚未建立資料",提示:"按「新增」開始，或載入示範資料。",有動作:!0,精簡:!1},argTypes:{標題:{control:"text"},提示:{control:"text"},有動作:{control:"boolean"},精簡:{control:"boolean"}},render:n=>e.jsx("div",{className:"w-96 rounded-md border",children:e.jsx(Y,{icon:e.jsx(Z,{className:"size-6"}),title:n.標題,hint:n.提示,compact:n.精簡,action:n.有動作?e.jsx(x,{size:"sm",children:"新增"}):void 0})})},o={args:{提示內容:"這是完整的說明內容，hover / 鍵盤聚焦 / 長壓皆可顯示。",觸發文字:"滑鼠移上來看提示",可鍵盤聚焦:!0},argTypes:{提示內容:{control:"text"},觸發文字:{control:"text"},可鍵盤聚焦:{control:"boolean"}},render:n=>e.jsxs("div",{className:"flex flex-col items-start gap-4",children:[e.jsx(me,{content:n.提示內容,focusable:n.可鍵盤聚焦,children:e.jsx("span",{className:"cursor-help rounded border border-dashed px-2 py-1 text-sm",children:n.觸發文字})}),e.jsx("div",{className:"w-40",children:e.jsx(pe,{text:n.提示內容})})]})},c={render:()=>e.jsx("div",{className:"flex flex-wrap gap-2",children:["default","secondary","outline","ghost","destructive","link"].map(n=>e.jsx(x,{variant:n,children:n},n))})},l={render:()=>e.jsx("div",{className:"flex flex-wrap gap-2",children:["default","secondary","outline","success","warning","destructive"].map(n=>e.jsx(X,{variant:n,children:n},n))})},d={render:()=>e.jsxs("div",{className:"flex gap-6",children:[e.jsx(u,{value:12e3,posLabel:"增加",negLabel:"減少"}),e.jsx(u,{value:-8e3,posLabel:"增加",negLabel:"減少"}),e.jsx(u,{value:0})]})},i={render:()=>e.jsx("div",{className:"w-96 rounded-md border",children:e.jsx(Y,{icon:e.jsx(Z,{className:"size-6"}),title:"尚未建立資料",hint:"按「新增」開始，或載入示範資料。",action:e.jsx(x,{size:"sm",children:"新增"})})})},m={render:()=>e.jsxs("div",{className:"w-80 space-y-3",children:[e.jsx(v,{placeholder:"文字輸入"}),e.jsx(v,{type:"number",placeholder:"數字",className:"text-right tabular-nums"}),e.jsxs(re,{defaultValue:"a",children:[e.jsx(ae,{children:e.jsx(te,{})}),e.jsxs(se,{children:[e.jsx(f,{value:"a",children:"選項 A"}),e.jsx(f,{value:"b",children:"選項 B"})]})]}),e.jsxs("label",{className:"flex items-center gap-2 text-sm",children:[e.jsx(ne,{defaultChecked:!0})," 勾選項目"]})]})},p={render:()=>e.jsxs(oe,{className:"w-80",children:[e.jsxs(ce,{children:[e.jsx(le,{className:"text-base",children:"卡片標題"}),e.jsx(de,{children:"卡片說明文字。"})]}),e.jsx(ie,{className:"text-sm text-muted-foreground",children:"卡片內容區。"})]})};var b,h,j;r.parameters={...r.parameters,docs:{...(b=r.parameters)==null?void 0:b.docs,source:{originalSource:`{
  args: {
    樣式: "default",
    尺寸: "default",
    文字: "按鈕",
    停用: false
  },
  argTypes: {
    樣式: {
      control: "select",
      options: ["default", "secondary", "outline", "ghost", "destructive", "link"]
    },
    尺寸: {
      control: "inline-radio",
      options: ["default", "sm", "lg", "icon"]
    },
    文字: {
      control: "text"
    },
    停用: {
      control: "boolean"
    }
  },
  render: a => <Button variant={a.樣式} size={a.尺寸} disabled={a.停用}>{a.文字}</Button>
}`,...(j=(h=r.parameters)==null?void 0:h.docs)==null?void 0:j.source}}};var S,y,N;a.parameters={...a.parameters,docs:{...(S=a.parameters)==null?void 0:S.docs,source:{originalSource:`{
  args: {
    樣式: "success",
    文字: "已確認"
  },
  argTypes: {
    樣式: {
      control: "select",
      options: ["default", "secondary", "outline", "success", "warning", "destructive"]
    },
    文字: {
      control: "text"
    }
  },
  render: a => <Badge variant={a.樣式}>{a.文字}</Badge>
}`,...(N=(y=a.parameters)==null?void 0:y.docs)==null?void 0:N.source}}};var C,T,_;t.parameters={...t.parameters,docs:{...(C=t.parameters)==null?void 0:C.docs,source:{originalSource:`{
  args: {
    數值: 12000,
    格式: "數字",
    增標籤: "增加",
    減標籤: "減少"
  },
  argTypes: {
    數值: {
      control: {
        type: "range",
        min: -50000,
        max: 50000,
        step: 1000
      }
    },
    格式: {
      control: "inline-radio",
      options: ["數字", "百分比", "金額"]
    },
    增標籤: {
      control: "text"
    },
    減標籤: {
      control: "text"
    }
  },
  render: a => {
    const fmt = a.格式 === "百分比" ? (n: number) => \`\${n}%\` : a.格式 === "金額" ? (n: number) => \`$\${n.toLocaleString()}\` : undefined;
    return <Delta value={a.數值} format={fmt} posLabel={a.增標籤} negLabel={a.減標籤} />;
  }
}`,...(_=(T=t.parameters)==null?void 0:T.docs)==null?void 0:_.source}}};var B,w,L;s.parameters={...s.parameters,docs:{...(B=s.parameters)==null?void 0:B.docs,source:{originalSource:`{
  args: {
    標題: "尚未建立資料",
    提示: "按「新增」開始，或載入示範資料。",
    有動作: true,
    精簡: false
  },
  argTypes: {
    標題: {
      control: "text"
    },
    提示: {
      control: "text"
    },
    有動作: {
      control: "boolean"
    },
    精簡: {
      control: "boolean"
    }
  },
  render: a => <div className="w-96 rounded-md border">
      <EmptyState icon={<Inbox className="size-6" />} title={a.標題} hint={a.提示} compact={a.精簡} action={a.有動作 ? <Button size="sm">新增</Button> : undefined} />
    </div>
}`,...(L=(w=s.parameters)==null?void 0:w.docs)==null?void 0:L.source}}};var I,D,k;o.parameters={...o.parameters,docs:{...(I=o.parameters)==null?void 0:I.docs,source:{originalSource:`{
  args: {
    提示內容: "這是完整的說明內容，hover / 鍵盤聚焦 / 長壓皆可顯示。",
    觸發文字: "滑鼠移上來看提示",
    可鍵盤聚焦: true
  },
  argTypes: {
    提示內容: {
      control: "text"
    },
    觸發文字: {
      control: "text"
    },
    可鍵盤聚焦: {
      control: "boolean"
    }
  },
  render: a => <div className="flex flex-col items-start gap-4">
      <Tooltip content={a.提示內容} focusable={a.可鍵盤聚焦}>
        <span className="cursor-help rounded border border-dashed px-2 py-1 text-sm">{a.觸發文字}</span>
      </Tooltip>
      <div className="w-40"><TruncatedText text={a.提示內容} /></div>
    </div>
}`,...(k=(D=o.parameters)==null?void 0:D.docs)==null?void 0:k.source}}};var z,E,$;c.parameters={...c.parameters,docs:{...(z=c.parameters)==null?void 0:z.docs,source:{originalSource:`{
  render: () => <div className="flex flex-wrap gap-2">
      {(["default", "secondary", "outline", "ghost", "destructive", "link"] as const).map(v => <Button key={v} variant={v}>{v}</Button>)}
    </div>
}`,...($=(E=c.parameters)==null?void 0:E.docs)==null?void 0:$.source}}};var V,H,A;l.parameters={...l.parameters,docs:{...(V=l.parameters)==null?void 0:V.docs,source:{originalSource:`{
  render: () => <div className="flex flex-wrap gap-2">
      {(["default", "secondary", "outline", "success", "warning", "destructive"] as const).map(v => <Badge key={v} variant={v}>{v}</Badge>)}
    </div>
}`,...(A=(H=l.parameters)==null?void 0:H.docs)==null?void 0:A.source}}};var O,R,q;d.parameters={...d.parameters,docs:{...(O=d.parameters)==null?void 0:O.docs,source:{originalSource:`{
  render: () => <div className="flex gap-6">
      <Delta value={12000} posLabel="增加" negLabel="減少" />
      <Delta value={-8000} posLabel="增加" negLabel="減少" />
      <Delta value={0} />
    </div>
}`,...(q=(R=d.parameters)==null?void 0:R.docs)==null?void 0:q.source}}};var F,G,J;i.parameters={...i.parameters,docs:{...(F=i.parameters)==null?void 0:F.docs,source:{originalSource:`{
  render: () => <div className="w-96 rounded-md border">
      <EmptyState icon={<Inbox className="size-6" />} title="尚未建立資料" hint="按「新增」開始，或載入示範資料。" action={<Button size="sm">新增</Button>} />
    </div>
}`,...(J=(G=i.parameters)==null?void 0:G.docs)==null?void 0:J.source}}};var K,M,P;m.parameters={...m.parameters,docs:{...(K=m.parameters)==null?void 0:K.docs,source:{originalSource:`{
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
}`,...(P=(M=m.parameters)==null?void 0:M.docs)==null?void 0:P.source}}};var Q,U,W;p.parameters={...p.parameters,docs:{...(Q=p.parameters)==null?void 0:Q.docs,source:{originalSource:`{
  render: () => <Card className="w-80">
      <CardHeader>
        <CardTitle className="text-base">卡片標題</CardTitle>
        <CardDescription>卡片說明文字。</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">卡片內容區。</CardContent>
    </Card>
}`,...(W=(U=p.parameters)==null?void 0:U.docs)==null?void 0:W.source}}};const Ie=["按鈕_互動","標籤_互動","差異_互動","空狀態_互動","提示泡泡_互動","按鈕_Button","標籤_Badge","差異_Delta","空狀態_EmptyState","表單控制項_Controls","卡片_Card"];export{Ie as __namedExportsOrder,Le as default,p as 卡片_Card,d as 差異_Delta,t as 差異_互動,c as 按鈕_Button,r as 按鈕_互動,o as 提示泡泡_互動,l as 標籤_Badge,a as 標籤_互動,i as 空狀態_EmptyState,s as 空狀態_互動,m as 表單控制項_Controls};
