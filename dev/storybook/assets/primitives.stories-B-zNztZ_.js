import{j as e}from"./jsx-runtime-Cf8x2fCZ.js";import{B as h}from"./button-DbUBKcit.js";import{B as de}from"./badge-C84YC-bZ.js";import{c as y}from"./utils-CdvzHgU1.js";import{c as ve}from"./createLucideIcon-DqplzwSp.js";import{L as fe}from"./lightbulb-D6BN6bHb.js";import{T as be,C as he,D as b,a as je}from"./checkbox-BErbfNMk.js";import{E as me,I as ue}from"./empty-state-uDmSVxeh.js";import{I as N,k as ye,l as Ce,m as Ne,n as we,o as w}from"./select-CQTogVSg.js";import{C as Se,a as Te,b as _e,c as Be,d as ke}from"./card-ComTj0HN.js";import{T as Ie,a as Le}from"./tooltip-CwGHE9xA.js";import"./index-yBjzXJbu.js";import"./index-BO-NyGGJ.js";import"./index-9lgI2Bnf.js";import"./check-DNs7zX_I.js";import"./index-CSSP-iJI.js";import"./index-B6ujFmsw.js";/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ze=ve("CircleAlert",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["line",{x1:"12",x2:"12",y1:"8",y2:"12",key:"1pkeuh"}],["line",{x1:"12",x2:"12.01",y1:"16",y2:"16",key:"4dfq90"}]]),De={success:{wrap:"border-success/30 bg-success/10",color:"text-success",icon:he},warning:{wrap:"border-warning/40 bg-warning/10",color:"text-warning",icon:be},info:{wrap:"border-info/30 bg-info/10",color:"text-info",icon:fe},danger:{wrap:"border-danger/30 bg-danger/10",color:"text-danger",icon:ze}};function a({variant:n,title:j,tag:r,icon:pe,children:C,className:xe}){const t=De[n],ge=pe??t.icon;return e.jsxs("div",{className:y("flex items-start gap-2.5 rounded-md border p-3",t.wrap,xe),children:[e.jsx(ge,{className:y("mt-0.5 size-4 shrink-0",t.color)}),e.jsxs("div",{className:"min-w-0 flex-1",children:[e.jsxs("p",{className:y("text-sm font-semibold",t.color),children:[r&&e.jsx("span",{className:"mr-1.5 rounded bg-background/70 px-1 py-0.5 align-middle text-[10px] font-medium",children:r}),j]}),C&&e.jsx("div",{className:"mt-0.5 text-xs leading-relaxed text-muted-foreground",children:C})]})]})}a.__docgenInfo={description:`統一狀態提示框（良好/警示/提醒/危險）：圖示＋（可選）標籤＋標題＋內文。取代各處零散手刻的
原始調色盤色塊（原本各畫面各自 border/bg/text 三件套硬編色），改走語意 token——換圖表色票主題
或深色模式都不會漂移（狀態語意與分類色票脫鉤，同 Bullet 圖表的處理原則）。`,methods:[],displayName:"Callout",props:{variant:{required:!0,tsType:{name:"union",raw:'"success" | "warning" | "info" | "danger"',elements:[{name:"literal",value:'"success"'},{name:"literal",value:'"warning"'},{name:"literal",value:'"info"'},{name:"literal",value:'"danger"'}]},description:""},title:{required:!0,tsType:{name:"ReactNode"},description:""},tag:{required:!1,tsType:{name:"string"},description:""},icon:{required:!1,tsType:{name:"LucideIcon"},description:""},children:{required:!1,tsType:{name:"ReactNode"},description:""},className:{required:!1,tsType:{name:"string"},description:""}}};const Xe={title:"元件/基礎",parameters:{layout:"centered"}},s={args:{樣式:"default",尺寸:"default",文字:"按鈕",停用:!1},argTypes:{樣式:{control:"select",options:["default","secondary","outline","ghost","destructive","link"]},尺寸:{control:"inline-radio",options:["default","sm","lg","icon"]},文字:{control:"text"},停用:{control:"boolean"}},render:n=>e.jsx(h,{variant:n.樣式,size:n.尺寸,disabled:n.停用,children:n.文字})},o={args:{樣式:"success",文字:"已確認"},argTypes:{樣式:{control:"select",options:["default","secondary","outline","success","warning","destructive"]},文字:{control:"text"}},render:n=>e.jsx(de,{variant:n.樣式,children:n.文字})},l={args:{數值:12e3,格式:"數字",增標籤:"增加",減標籤:"減少"},argTypes:{數值:{control:{type:"range",min:-5e4,max:5e4,step:1e3}},格式:{control:"inline-radio",options:["數字","百分比","金額"]},增標籤:{control:"text"},減標籤:{control:"text"}},render:n=>{const j=n.格式==="百分比"?r=>`${r}%`:n.格式==="金額"?r=>`$${r.toLocaleString()}`:void 0;return e.jsx(b,{value:n.數值,format:j,posLabel:n.增標籤,negLabel:n.減標籤})}},c={args:{樣式:"success",標籤:"良好",標題:"加班成本低、工時穩定",內文:"加班佔比很低，人力配置與工時看來穩定。"},argTypes:{樣式:{control:"inline-radio",options:["success","warning","info","danger"]},標籤:{control:"text"},標題:{control:"text"},內文:{control:"text"}},render:n=>e.jsx("div",{className:"w-96",children:e.jsx(a,{variant:n.樣式,tag:n.標籤,title:n.標題,children:n.內文})})},i={args:{標題:"尚未建立資料",提示:"按「新增」開始，或載入示範資料。",有動作:!0,精簡:!1},argTypes:{標題:{control:"text"},提示:{control:"text"},有動作:{control:"boolean"},精簡:{control:"boolean"}},render:n=>e.jsx("div",{className:"w-96 rounded-md border",children:e.jsx(me,{icon:e.jsx(ue,{className:"size-6"}),title:n.標題,hint:n.提示,compact:n.精簡,action:n.有動作?e.jsx(h,{size:"sm",children:"新增"}):void 0})})},d={args:{提示內容:"這是完整的說明內容，hover / 鍵盤聚焦 / 長壓皆可顯示。",觸發文字:"滑鼠移上來看提示",可鍵盤聚焦:!0},argTypes:{提示內容:{control:"text"},觸發文字:{control:"text"},可鍵盤聚焦:{control:"boolean"}},render:n=>e.jsxs("div",{className:"flex flex-col items-start gap-4",children:[e.jsx(Ie,{content:n.提示內容,focusable:n.可鍵盤聚焦,children:e.jsx("span",{className:"cursor-help rounded border border-dashed px-2 py-1 text-sm",children:n.觸發文字})}),e.jsx("div",{className:"w-40",children:e.jsx(Le,{text:n.提示內容})})]})},m={render:()=>e.jsx("div",{className:"flex flex-wrap gap-2",children:["default","secondary","outline","ghost","destructive","link"].map(n=>e.jsx(h,{variant:n,children:n},n))})},u={render:()=>e.jsx("div",{className:"flex flex-wrap gap-2",children:["default","secondary","outline","success","warning","destructive"].map(n=>e.jsx(de,{variant:n,children:n},n))})},p={render:()=>e.jsxs("div",{className:"flex gap-6",children:[e.jsx(b,{value:12e3,posLabel:"增加",negLabel:"減少"}),e.jsx(b,{value:-8e3,posLabel:"增加",negLabel:"減少"}),e.jsx(b,{value:0})]})},x={render:()=>e.jsxs("div",{className:"w-96 space-y-2",children:[e.jsx(a,{variant:"success",tag:"良好",title:"加班成本低、工時穩定",children:"加班佔比很低，人力配置與工時看來穩定。佐證：加班費佔總成本 0.76%"}),e.jsx(a,{variant:"info",tag:"提醒",title:"別忘了雇主法定負擔",children:"薪資之外，公司還要負擔勞健保、勞退、職災等法定成本，編預算時要連同計入。"}),e.jsx(a,{variant:"warning",tag:"需注意",title:"獎金/變動占比偏高",children:"獎金/變動占比過高或加班費偏大，常是結構檢討重點。"}),e.jsx(a,{variant:"danger",tag:"異常",title:"本月實發為負值",children:"請檢查扣項是否超過應發總額，確認後才能確認本期。"})]})},g={render:()=>e.jsx("div",{className:"w-96 rounded-md border",children:e.jsx(me,{icon:e.jsx(ue,{className:"size-6"}),title:"尚未建立資料",hint:"按「新增」開始，或載入示範資料。",action:e.jsx(h,{size:"sm",children:"新增"})})})},v={render:()=>e.jsxs("div",{className:"w-80 space-y-3",children:[e.jsx(N,{placeholder:"文字輸入"}),e.jsx(N,{type:"number",placeholder:"數字",className:"text-right tabular-nums"}),e.jsxs(ye,{defaultValue:"a",children:[e.jsx(Ce,{children:e.jsx(Ne,{})}),e.jsxs(we,{children:[e.jsx(w,{value:"a",children:"選項 A"}),e.jsx(w,{value:"b",children:"選項 B"})]})]}),e.jsxs("label",{className:"flex items-center gap-2 text-sm",children:[e.jsx(je,{defaultChecked:!0})," 勾選項目"]})]})},f={render:()=>e.jsxs(Se,{className:"w-80",children:[e.jsxs(Te,{children:[e.jsx(_e,{className:"text-base",children:"卡片標題"}),e.jsx(Be,{children:"卡片說明文字。"})]}),e.jsx(ke,{className:"text-sm text-muted-foreground",children:"卡片內容區。"})]})};var S,T,_;s.parameters={...s.parameters,docs:{...(S=s.parameters)==null?void 0:S.docs,source:{originalSource:`{
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
}`,...(_=(T=s.parameters)==null?void 0:T.docs)==null?void 0:_.source}}};var B,k,I;o.parameters={...o.parameters,docs:{...(B=o.parameters)==null?void 0:B.docs,source:{originalSource:`{
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
}`,...(I=(k=o.parameters)==null?void 0:k.docs)==null?void 0:I.source}}};var L,z,D;l.parameters={...l.parameters,docs:{...(L=l.parameters)==null?void 0:L.docs,source:{originalSource:`{
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
}`,...(D=(z=l.parameters)==null?void 0:z.docs)==null?void 0:D.source}}};var E,q,A;c.parameters={...c.parameters,docs:{...(E=c.parameters)==null?void 0:E.docs,source:{originalSource:`{
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
}`,...(A=(q=c.parameters)==null?void 0:q.docs)==null?void 0:A.source}}};var $,V,R;i.parameters={...i.parameters,docs:{...($=i.parameters)==null?void 0:$.docs,source:{originalSource:`{
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
}`,...(R=(V=i.parameters)==null?void 0:V.docs)==null?void 0:R.source}}};var H,O,F;d.parameters={...d.parameters,docs:{...(H=d.parameters)==null?void 0:H.docs,source:{originalSource:`{
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
}`,...(F=(O=d.parameters)==null?void 0:O.docs)==null?void 0:F.source}}};var G,J,K;m.parameters={...m.parameters,docs:{...(G=m.parameters)==null?void 0:G.docs,source:{originalSource:`{
  render: () => <div className="flex flex-wrap gap-2">
      {(["default", "secondary", "outline", "ghost", "destructive", "link"] as const).map(v => <Button key={v} variant={v}>{v}</Button>)}
    </div>
}`,...(K=(J=m.parameters)==null?void 0:J.docs)==null?void 0:K.source}}};var M,P,Q;u.parameters={...u.parameters,docs:{...(M=u.parameters)==null?void 0:M.docs,source:{originalSource:`{
  render: () => <div className="flex flex-wrap gap-2">
      {(["default", "secondary", "outline", "success", "warning", "destructive"] as const).map(v => <Badge key={v} variant={v}>{v}</Badge>)}
    </div>
}`,...(Q=(P=u.parameters)==null?void 0:P.docs)==null?void 0:Q.source}}};var U,W,X;p.parameters={...p.parameters,docs:{...(U=p.parameters)==null?void 0:U.docs,source:{originalSource:`{
  render: () => <div className="flex gap-6">
      <Delta value={12000} posLabel="增加" negLabel="減少" />
      <Delta value={-8000} posLabel="增加" negLabel="減少" />
      <Delta value={0} />
    </div>
}`,...(X=(W=p.parameters)==null?void 0:W.docs)==null?void 0:X.source}}};var Y,Z,ee;x.parameters={...x.parameters,docs:{...(Y=x.parameters)==null?void 0:Y.docs,source:{originalSource:`{
  render: () => <div className="w-96 space-y-2">
      <Callout variant="success" tag="良好" title="加班成本低、工時穩定">加班佔比很低，人力配置與工時看來穩定。佐證：加班費佔總成本 0.76%</Callout>
      <Callout variant="info" tag="提醒" title="別忘了雇主法定負擔">薪資之外，公司還要負擔勞健保、勞退、職災等法定成本，編預算時要連同計入。</Callout>
      <Callout variant="warning" tag="需注意" title="獎金/變動占比偏高">獎金/變動占比過高或加班費偏大，常是結構檢討重點。</Callout>
      <Callout variant="danger" tag="異常" title="本月實發為負值">請檢查扣項是否超過應發總額，確認後才能確認本期。</Callout>
    </div>
}`,...(ee=(Z=x.parameters)==null?void 0:Z.docs)==null?void 0:ee.source}}};var ne,re,ae;g.parameters={...g.parameters,docs:{...(ne=g.parameters)==null?void 0:ne.docs,source:{originalSource:`{
  render: () => <div className="w-96 rounded-md border">
      <EmptyState icon={<Inbox className="size-6" />} title="尚未建立資料" hint="按「新增」開始，或載入示範資料。" action={<Button size="sm">新增</Button>} />
    </div>
}`,...(ae=(re=g.parameters)==null?void 0:re.docs)==null?void 0:ae.source}}};var te,se,oe;v.parameters={...v.parameters,docs:{...(te=v.parameters)==null?void 0:te.docs,source:{originalSource:`{
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
}`,...(oe=(se=v.parameters)==null?void 0:se.docs)==null?void 0:oe.source}}};var le,ce,ie;f.parameters={...f.parameters,docs:{...(le=f.parameters)==null?void 0:le.docs,source:{originalSource:`{
  render: () => <Card className="w-80">
      <CardHeader>
        <CardTitle className="text-base">卡片標題</CardTitle>
        <CardDescription>卡片說明文字。</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">卡片內容區。</CardContent>
    </Card>
}`,...(ie=(ce=f.parameters)==null?void 0:ce.docs)==null?void 0:ie.source}}};const Ye=["按鈕_互動","標籤_互動","差異_互動","狀態提示框_互動","空狀態_互動","提示泡泡_互動","按鈕_Button","標籤_Badge","差異_Delta","狀態提示框_Callout","空狀態_EmptyState","表單控制項_Controls","卡片_Card"];export{Ye as __namedExportsOrder,Xe as default,f as 卡片_Card,p as 差異_Delta,l as 差異_互動,m as 按鈕_Button,s as 按鈕_互動,d as 提示泡泡_互動,u as 標籤_Badge,o as 標籤_互動,x as 狀態提示框_Callout,c as 狀態提示框_互動,g as 空狀態_EmptyState,i as 空狀態_互動,v as 表單控制項_Controls};
