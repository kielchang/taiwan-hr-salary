import{j as e}from"./jsx-runtime-Cf8x2fCZ.js";import{B as f}from"./button-SglK-g-6.js";import{B as oe}from"./badge-Ck-4l2Uv.js";import{C as a}from"./callout-D1Pyhy-i.js";import{D as v,C as de}from"./checkbox-DhSjbEQV.js";import{E as le,I as ce}from"./empty-state-BOV8G8AL.js";import{I as b,S as me,a as ue,b as pe,c as xe,d as j}from"./select-BlVvmwjY.js";import{C as ge,a as ve,b as fe,c as he,d as be}from"./card-IhvzyNq3.js";import{T as je,a as Ce}from"./tooltip-jXVQej4V.js";import"./index-yBjzXJbu.js";import"./index-BO-NyGGJ.js";import"./index-BZsrq3rz.js";import"./index-C-0izQnN.js";import"./utils-BEESGUdN.js";import"./createLucideIcon-DqplzwSp.js";import"./check-DNs7zX_I.js";import"./index-CSSP-iJI.js";import"./index-B6ujFmsw.js";const Re={title:"元件/基礎",parameters:{layout:"centered"}},r={args:{樣式:"default",尺寸:"default",文字:"按鈕",停用:!1},argTypes:{樣式:{control:"select",options:["default","secondary","outline","ghost","destructive","link"]},尺寸:{control:"inline-radio",options:["default","sm","lg","icon"]},文字:{control:"text"},停用:{control:"boolean"}},render:n=>e.jsx(f,{variant:n.樣式,size:n.尺寸,disabled:n.停用,children:n.文字})},t={args:{樣式:"success",文字:"已確認"},argTypes:{樣式:{control:"select",options:["default","secondary","outline","success","warning","destructive"]},文字:{control:"text"}},render:n=>e.jsx(oe,{variant:n.樣式,children:n.文字})},s={args:{數值:12e3,格式:"數字",增標籤:"增加",減標籤:"減少"},argTypes:{數值:{control:{type:"range",min:-5e4,max:5e4,step:1e3}},格式:{control:"inline-radio",options:["數字","百分比","金額"]},增標籤:{control:"text"},減標籤:{control:"text"}},render:n=>{const ie=n.格式==="百分比"?h=>`${h}%`:n.格式==="金額"?h=>`$${h.toLocaleString()}`:void 0;return e.jsx(v,{value:n.數值,format:ie,posLabel:n.增標籤,negLabel:n.減標籤})}},o={args:{樣式:"success",標籤:"良好",標題:"加班成本低、工時穩定",內文:"加班佔比很低，人力配置與工時看來穩定。"},argTypes:{樣式:{control:"inline-radio",options:["success","warning","info","danger"]},標籤:{control:"text"},標題:{control:"text"},內文:{control:"text"}},render:n=>e.jsx("div",{className:"w-96",children:e.jsx(a,{variant:n.樣式,tag:n.標籤,title:n.標題,children:n.內文})})},l={args:{標題:"尚未建立資料",提示:"按「新增」開始，或載入示範資料。",有動作:!0,精簡:!1},argTypes:{標題:{control:"text"},提示:{control:"text"},有動作:{control:"boolean"},精簡:{control:"boolean"}},render:n=>e.jsx("div",{className:"w-96 rounded-md border",children:e.jsx(le,{icon:e.jsx(ce,{className:"size-6"}),title:n.標題,hint:n.提示,compact:n.精簡,action:n.有動作?e.jsx(f,{size:"sm",children:"新增"}):void 0})})},c={args:{提示內容:"這是完整的說明內容，hover / 鍵盤聚焦 / 長壓皆可顯示。",觸發文字:"滑鼠移上來看提示",可鍵盤聚焦:!0},argTypes:{提示內容:{control:"text"},觸發文字:{control:"text"},可鍵盤聚焦:{control:"boolean"}},render:n=>e.jsxs("div",{className:"flex flex-col items-start gap-4",children:[e.jsx(je,{content:n.提示內容,focusable:n.可鍵盤聚焦,children:e.jsx("span",{className:"cursor-help rounded border border-dashed px-2 py-1 text-sm",children:n.觸發文字})}),e.jsx("div",{className:"w-40",children:e.jsx(Ce,{text:n.提示內容})})]})},i={render:()=>e.jsx("div",{className:"flex flex-wrap gap-2",children:["default","secondary","outline","ghost","destructive","link"].map(n=>e.jsx(f,{variant:n,children:n},n))})},d={render:()=>e.jsx("div",{className:"flex flex-wrap gap-2",children:["default","secondary","outline","success","warning","destructive"].map(n=>e.jsx(oe,{variant:n,children:n},n))})},m={render:()=>e.jsxs("div",{className:"flex gap-6",children:[e.jsx(v,{value:12e3,posLabel:"增加",negLabel:"減少"}),e.jsx(v,{value:-8e3,posLabel:"增加",negLabel:"減少"}),e.jsx(v,{value:0})]})},u={render:()=>e.jsxs("div",{className:"w-96 space-y-2",children:[e.jsx(a,{variant:"success",tag:"良好",title:"加班成本低、工時穩定",children:"加班佔比很低，人力配置與工時看來穩定。佐證：加班費佔總成本 0.76%"}),e.jsx(a,{variant:"info",tag:"提醒",title:"別忘了雇主法定負擔",children:"薪資之外，公司還要負擔勞健保、勞退、職災等法定成本，編預算時要連同計入。"}),e.jsx(a,{variant:"warning",tag:"需注意",title:"獎金/變動占比偏高",children:"獎金/變動占比過高或加班費偏大，常是結構檢討重點。"}),e.jsx(a,{variant:"danger",tag:"異常",title:"本月實發為負值",children:"請檢查扣項是否超過應發總額，確認後才能確認本期。"})]})},p={render:()=>e.jsx("div",{className:"w-96 rounded-md border",children:e.jsx(le,{icon:e.jsx(ce,{className:"size-6"}),title:"尚未建立資料",hint:"按「新增」開始，或載入示範資料。",action:e.jsx(f,{size:"sm",children:"新增"})})})},x={render:()=>e.jsxs("div",{className:"w-80 space-y-3",children:[e.jsx(b,{placeholder:"文字輸入"}),e.jsx(b,{type:"number",placeholder:"數字",className:"text-right tabular-nums"}),e.jsxs(me,{defaultValue:"a",children:[e.jsx(ue,{children:e.jsx(pe,{})}),e.jsxs(xe,{children:[e.jsx(j,{value:"a",children:"選項 A"}),e.jsx(j,{value:"b",children:"選項 B"})]})]}),e.jsxs("label",{className:"flex items-center gap-2 text-sm",children:[e.jsx(de,{defaultChecked:!0})," 勾選項目"]})]})},g={render:()=>e.jsxs(ge,{className:"w-80",children:[e.jsxs(ve,{children:[e.jsx(fe,{className:"text-base",children:"卡片標題"}),e.jsx(he,{children:"卡片說明文字。"})]}),e.jsx(be,{className:"text-sm text-muted-foreground",children:"卡片內容區。"})]})};var C,y,S;r.parameters={...r.parameters,docs:{...(C=r.parameters)==null?void 0:C.docs,source:{originalSource:`{
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
}`,...(S=(y=r.parameters)==null?void 0:y.docs)==null?void 0:S.source}}};var N,_,w;t.parameters={...t.parameters,docs:{...(N=t.parameters)==null?void 0:N.docs,source:{originalSource:`{
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
}`,...(w=(_=t.parameters)==null?void 0:_.docs)==null?void 0:w.source}}};var T,B,L;s.parameters={...s.parameters,docs:{...(T=s.parameters)==null?void 0:T.docs,source:{originalSource:`{
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
}`,...(L=(B=s.parameters)==null?void 0:B.docs)==null?void 0:L.source}}};var I,D,k;o.parameters={...o.parameters,docs:{...(I=o.parameters)==null?void 0:I.docs,source:{originalSource:`{
  args: {
    樣式: "success",
    標籤: "良好",
    標題: "加班成本低、工時穩定",
    內文: "加班佔比很低，人力配置與工時看來穩定。"
  },
  argTypes: {
    樣式: {
      control: "inline-radio",
      options: ["success", "warning", "info", "danger"]
    },
    標籤: {
      control: "text"
    },
    標題: {
      control: "text"
    },
    內文: {
      control: "text"
    }
  },
  render: a => <div className="w-96">
      <Callout variant={a.樣式} tag={a.標籤} title={a.標題}>{a.內文}</Callout>
    </div>
}`,...(k=(D=o.parameters)==null?void 0:D.docs)==null?void 0:k.source}}};var z,E,$;l.parameters={...l.parameters,docs:{...(z=l.parameters)==null?void 0:z.docs,source:{originalSource:`{
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
}`,...($=(E=l.parameters)==null?void 0:E.docs)==null?void 0:$.source}}};var V,H,A;c.parameters={...c.parameters,docs:{...(V=c.parameters)==null?void 0:V.docs,source:{originalSource:`{
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
}`,...(A=(H=c.parameters)==null?void 0:H.docs)==null?void 0:A.source}}};var O,R,q;i.parameters={...i.parameters,docs:{...(O=i.parameters)==null?void 0:O.docs,source:{originalSource:`{
  render: () => <div className="flex flex-wrap gap-2">
      {(["default", "secondary", "outline", "ghost", "destructive", "link"] as const).map(v => <Button key={v} variant={v}>{v}</Button>)}
    </div>
}`,...(q=(R=i.parameters)==null?void 0:R.docs)==null?void 0:q.source}}};var F,G,J;d.parameters={...d.parameters,docs:{...(F=d.parameters)==null?void 0:F.docs,source:{originalSource:`{
  render: () => <div className="flex flex-wrap gap-2">
      {(["default", "secondary", "outline", "success", "warning", "destructive"] as const).map(v => <Badge key={v} variant={v}>{v}</Badge>)}
    </div>
}`,...(J=(G=d.parameters)==null?void 0:G.docs)==null?void 0:J.source}}};var K,M,P;m.parameters={...m.parameters,docs:{...(K=m.parameters)==null?void 0:K.docs,source:{originalSource:`{
  render: () => <div className="flex gap-6">
      <Delta value={12000} posLabel="增加" negLabel="減少" />
      <Delta value={-8000} posLabel="增加" negLabel="減少" />
      <Delta value={0} />
    </div>
}`,...(P=(M=m.parameters)==null?void 0:M.docs)==null?void 0:P.source}}};var Q,U,W;u.parameters={...u.parameters,docs:{...(Q=u.parameters)==null?void 0:Q.docs,source:{originalSource:`{
  render: () => <div className="w-96 space-y-2">
      <Callout variant="success" tag="良好" title="加班成本低、工時穩定">加班佔比很低，人力配置與工時看來穩定。佐證：加班費佔總成本 0.76%</Callout>
      <Callout variant="info" tag="提醒" title="別忘了雇主法定負擔">薪資之外，公司還要負擔勞健保、勞退、職災等法定成本，編預算時要連同計入。</Callout>
      <Callout variant="warning" tag="需注意" title="獎金/變動占比偏高">獎金/變動占比過高或加班費偏大，常是結構檢討重點。</Callout>
      <Callout variant="danger" tag="異常" title="本月實發為負值">請檢查扣項是否超過應發總額，確認後才能確認本期。</Callout>
    </div>
}`,...(W=(U=u.parameters)==null?void 0:U.docs)==null?void 0:W.source}}};var X,Y,Z;p.parameters={...p.parameters,docs:{...(X=p.parameters)==null?void 0:X.docs,source:{originalSource:`{
  render: () => <div className="w-96 rounded-md border">
      <EmptyState icon={<Inbox className="size-6" />} title="尚未建立資料" hint="按「新增」開始，或載入示範資料。" action={<Button size="sm">新增</Button>} />
    </div>
}`,...(Z=(Y=p.parameters)==null?void 0:Y.docs)==null?void 0:Z.source}}};var ee,ne,ae;x.parameters={...x.parameters,docs:{...(ee=x.parameters)==null?void 0:ee.docs,source:{originalSource:`{
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
}`,...(ae=(ne=x.parameters)==null?void 0:ne.docs)==null?void 0:ae.source}}};var re,te,se;g.parameters={...g.parameters,docs:{...(re=g.parameters)==null?void 0:re.docs,source:{originalSource:`{
  render: () => <Card className="w-80">
      <CardHeader>
        <CardTitle className="text-base">卡片標題</CardTitle>
        <CardDescription>卡片說明文字。</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">卡片內容區。</CardContent>
    </Card>
}`,...(se=(te=g.parameters)==null?void 0:te.docs)==null?void 0:se.source}}};const qe=["按鈕_互動","標籤_互動","差異_互動","狀態提示框_互動","空狀態_互動","提示泡泡_互動","按鈕_Button","標籤_Badge","差異_Delta","狀態提示框_Callout","空狀態_EmptyState","表單控制項_Controls","卡片_Card"];export{qe as __namedExportsOrder,Re as default,g as 卡片_Card,m as 差異_Delta,s as 差異_互動,i as 按鈕_Button,r as 按鈕_互動,c as 提示泡泡_互動,d as 標籤_Badge,t as 標籤_互動,u as 狀態提示框_Callout,o as 狀態提示框_互動,p as 空狀態_EmptyState,l as 空狀態_互動,x as 表單控制項_Controls};
