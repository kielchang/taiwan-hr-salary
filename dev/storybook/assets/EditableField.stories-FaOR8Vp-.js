import{j as e}from"./jsx-runtime-Cf8x2fCZ.js";import{r as De}from"./index-BO-NyGGJ.js";import{E as _}from"./EditableField-rRJUBWRj.js";import"./index-yBjzXJbu.js";import"./select-BNwM6H6z.js";import"./utils-CdvzHgU1.js";import"./index-CSSP-iJI.js";import"./index-B6ujFmsw.js";import"./createLucideIcon-DqplzwSp.js";import"./check-DNs7zX_I.js";import"./tooltip-CwGHE9xA.js";import"./undo-2-BWndPgvs.js";const qe={title:"元件/表單/EditableField",component:_,parameters:{layout:"centered"}};function a(r){const[y,l]=De.useState(r.value);return e.jsx("div",{className:"w-72",children:e.jsx(_,{...r,value:y,onChange:l,onRevert:()=>l(r.original)})})}const o={args:{label:"欄位名稱",kind:"text",value:"示例值",original:"示例值",disabled:!1,help:"",unit:""},argTypes:{kind:{control:"select",options:["text","number","money","rate","date","select","checkbox","radio","multiselect"]},disabled:{control:"boolean"},label:{control:"text"},value:{control:"text"},original:{control:"text"},help:{control:"text"},unit:{control:"text"}},render:r=>e.jsx($e,{...r},`${r.kind}|${r.value}|${r.original}`)};function $e(r){const y=[{value:"甲",label:"甲"},{value:"乙",label:"乙"},{value:"丙",label:"丙"}],l=n=>{switch(r.kind){case"money":case"number":case"rate":return Number(n)||0;case"checkbox":return n==="true"||n==="是";case"multiselect":return String(n).split(/[、,]/).map(Ee=>Ee.trim()).filter(Boolean);default:return n}},[fe,D]=De.useState(()=>l(r.value));return e.jsx("div",{className:"w-72",children:e.jsx(_,{label:r.label,kind:r.kind,value:fe,original:l(r.original),options:y,disabled:r.disabled,help:r.help||void 0,unit:r.unit||void 0,onChange:D,onRevert:()=>D(l(r.original))})})}const t={render:()=>e.jsx(a,{label:"部門",kind:"text",value:"行銷部",original:"行銷部"})},s={render:()=>e.jsx(a,{label:"部門",kind:"text",value:"測試部",original:"行銷部"})},i={render:()=>e.jsx(a,{label:"本薪",kind:"money",value:45e3,original:45e3})},c={render:()=>e.jsx(a,{label:"本薪",kind:"money",value:48e3,original:45e3})},d={render:()=>e.jsx(a,{label:"本月工時",kind:"number",value:168.5,original:168.5,help:"千分位並保留小數"})},u={render:()=>e.jsx(a,{label:"本月工時",kind:"number",value:176,original:168.5})},m={render:()=>e.jsx(a,{label:"勞退自提率",kind:"rate",value:.06,original:.06,help:"0～6%"})},p={render:()=>e.jsx(a,{label:"任職狀態",kind:"select",value:"在職",original:"在職",options:[{value:"在職",label:"在職"},{value:"離職",label:"離職"},{value:"留停",label:"留停"}]})},b={render:()=>e.jsx(a,{label:"依附健保",kind:"checkbox",value:!0,original:!0})},v={render:()=>e.jsx(a,{label:"每月扣繳方式",kind:"radio",value:"固定5%",original:"固定5%",options:[{value:"固定5%",label:"固定 5%"},{value:"依扣繳稅額表",label:"依扣繳稅額表"}]})},g={render:()=>e.jsx(a,{label:"本月請假別",kind:"multiselect",value:["特休","病假"],original:["特休"],options:[{value:"特休",label:"特休"},{value:"病假",label:"病假"},{value:"事假",label:"事假"},{value:"婚假",label:"婚假"},{value:"喪假",label:"喪假"}]})},x={render:()=>e.jsx(a,{label:"其他扣款",kind:"money",value:-2e3,original:-2e3,help:"負值以括號＋紅字呈現（帳務）"})},k={render:()=>e.jsx(a,{label:"本月工時",kind:"number",value:168.5,original:168.5,unit:"h"})},h={render:()=>e.jsx(a,{label:"到職日",kind:"date",value:"2020-01-01",original:"2020-01-01"})},j={render:()=>e.jsx(a,{label:"員工編號",kind:"text",value:"E001",disabled:!0,lockHint:"本月已確認結算、此欄已鎖定"})},S={render:()=>e.jsx(a,{label:"姓名",kind:"text",value:"",alwaysEdit:!0,trackChanges:!1,placeholder:"輸入姓名"})};var f,E,$,w,C;o.parameters={...o.parameters,docs:{...(f=o.parameters)==null?void 0:f.docs,source:{originalSource:`{
  args: {
    label: "欄位名稱",
    kind: "text",
    value: "示例值",
    original: "示例值",
    disabled: false,
    help: "",
    unit: ""
  },
  argTypes: {
    kind: {
      control: "select",
      options: ["text", "number", "money", "rate", "date", "select", "checkbox", "radio", "multiselect"]
    },
    disabled: {
      control: "boolean"
    },
    label: {
      control: "text"
    },
    value: {
      control: "text"
    },
    original: {
      control: "text"
    },
    help: {
      control: "text"
    },
    unit: {
      control: "text"
    }
  },
  render: a => <PlayField key={\`\${a.kind}|\${a.value}|\${a.original}\`} {...a} />
}`,...($=(E=o.parameters)==null?void 0:E.docs)==null?void 0:$.source},description:{story:`互動 Playground：右側 Controls 即時切換型態（text/money/rate/select/radio/multiselect…）、
 改值/原值看變更態、切鎖定，快速驗證各種狀況。`,...(C=(w=o.parameters)==null?void 0:w.docs)==null?void 0:C.description}}};var R,F,N;t.parameters={...t.parameters,docs:{...(R=t.parameters)==null?void 0:R.docs,source:{originalSource:`{
  render: () => <Demo label="部門" kind="text" value="行銷部" original="行銷部" />
}`,...(N=(F=t.parameters)==null?void 0:F.docs)==null?void 0:N.source}}};var P,H,M;s.parameters={...s.parameters,docs:{...(P=s.parameters)==null?void 0:P.docs,source:{originalSource:`{
  render: () => <Demo label="部門" kind="text" value="測試部" original="行銷部" />
}`,...(M=(H=s.parameters)==null?void 0:H.docs)==null?void 0:M.source}}};var T,V,B;i.parameters={...i.parameters,docs:{...(T=i.parameters)==null?void 0:T.docs,source:{originalSource:`{
  render: () => <Demo label="本薪" kind="money" value={45000} original={45000} />
}`,...(B=(V=i.parameters)==null?void 0:V.docs)==null?void 0:B.source}}};var O,q,z;c.parameters={...c.parameters,docs:{...(O=c.parameters)==null?void 0:O.docs,source:{originalSource:`{
  render: () => <Demo label="本薪" kind="money" value={48000} original={45000} />
}`,...(z=(q=c.parameters)==null?void 0:q.docs)==null?void 0:z.source}}};var A,G,I;d.parameters={...d.parameters,docs:{...(A=d.parameters)==null?void 0:A.docs,source:{originalSource:`{
  render: () => <Demo label="本月工時" kind="number" value={168.5} original={168.5} help="千分位並保留小數" />
}`,...(I=(G=d.parameters)==null?void 0:G.docs)==null?void 0:I.source}}};var J,K,L;u.parameters={...u.parameters,docs:{...(J=u.parameters)==null?void 0:J.docs,source:{originalSource:`{
  render: () => <Demo label="本月工時" kind="number" value={176} original={168.5} />
}`,...(L=(K=u.parameters)==null?void 0:K.docs)==null?void 0:L.source}}};var Q,U,W;m.parameters={...m.parameters,docs:{...(Q=m.parameters)==null?void 0:Q.docs,source:{originalSource:`{
  render: () => <Demo label="勞退自提率" kind="rate" value={0.06} original={0.06} help="0～6%" />
}`,...(W=(U=m.parameters)==null?void 0:U.docs)==null?void 0:W.source}}};var X,Y,Z;p.parameters={...p.parameters,docs:{...(X=p.parameters)==null?void 0:X.docs,source:{originalSource:`{
  render: () => <Demo label="任職狀態" kind="select" value="在職" original="在職" options={[{
    value: "在職",
    label: "在職"
  }, {
    value: "離職",
    label: "離職"
  }, {
    value: "留停",
    label: "留停"
  }]} />
}`,...(Z=(Y=p.parameters)==null?void 0:Y.docs)==null?void 0:Z.source}}};var ee,re,ae;b.parameters={...b.parameters,docs:{...(ee=b.parameters)==null?void 0:ee.docs,source:{originalSource:`{
  render: () => <Demo label="依附健保" kind="checkbox" value={true} original={true} />
}`,...(ae=(re=b.parameters)==null?void 0:re.docs)==null?void 0:ae.source}}};var le,ne,oe;v.parameters={...v.parameters,docs:{...(le=v.parameters)==null?void 0:le.docs,source:{originalSource:`{
  render: () => <Demo label="每月扣繳方式" kind="radio" value="固定5%" original="固定5%" options={[{
    value: "固定5%",
    label: "固定 5%"
  }, {
    value: "依扣繳稅額表",
    label: "依扣繳稅額表"
  }]} />
}`,...(oe=(ne=v.parameters)==null?void 0:ne.docs)==null?void 0:oe.source}}};var te,se,ie;g.parameters={...g.parameters,docs:{...(te=g.parameters)==null?void 0:te.docs,source:{originalSource:`{
  render: () => <Demo label="本月請假別" kind="multiselect" value={["特休", "病假"]} original={["特休"]} options={[{
    value: "特休",
    label: "特休"
  }, {
    value: "病假",
    label: "病假"
  }, {
    value: "事假",
    label: "事假"
  }, {
    value: "婚假",
    label: "婚假"
  }, {
    value: "喪假",
    label: "喪假"
  }]} />
}`,...(ie=(se=g.parameters)==null?void 0:se.docs)==null?void 0:ie.source}}};var ce,de,ue;x.parameters={...x.parameters,docs:{...(ce=x.parameters)==null?void 0:ce.docs,source:{originalSource:`{
  render: () => <Demo label="其他扣款" kind="money" value={-2000} original={-2000} help="負值以括號＋紅字呈現（帳務）" />
}`,...(ue=(de=x.parameters)==null?void 0:de.docs)==null?void 0:ue.source}}};var me,pe,be;k.parameters={...k.parameters,docs:{...(me=k.parameters)==null?void 0:me.docs,source:{originalSource:`{
  render: () => <Demo label="本月工時" kind="number" value={168.5} original={168.5} unit="h" />
}`,...(be=(pe=k.parameters)==null?void 0:pe.docs)==null?void 0:be.source}}};var ve,ge,xe;h.parameters={...h.parameters,docs:{...(ve=h.parameters)==null?void 0:ve.docs,source:{originalSource:`{
  render: () => <Demo label="到職日" kind="date" value="2020-01-01" original="2020-01-01" />
}`,...(xe=(ge=h.parameters)==null?void 0:ge.docs)==null?void 0:xe.source}}};var ke,he,je;j.parameters={...j.parameters,docs:{...(ke=j.parameters)==null?void 0:ke.docs,source:{originalSource:`{
  render: () => <Demo label="員工編號" kind="text" value="E001" disabled lockHint="本月已確認結算、此欄已鎖定" />
}`,...(je=(he=j.parameters)==null?void 0:he.docs)==null?void 0:je.source}}};var Se,ye,_e;S.parameters={...S.parameters,docs:{...(Se=S.parameters)==null?void 0:Se.docs,source:{originalSource:`{
  render: () => <Demo label="姓名" kind="text" value="" alwaysEdit trackChanges={false} placeholder="輸入姓名" />
}`,...(_e=(ye=S.parameters)==null?void 0:ye.docs)==null?void 0:_e.source}}};const ze=["互動","唯讀文字","已變更_文字","金額","已變更_金額","數字_含小數","已變更_數字","比率","下拉","是否_分段","單選_Radio","多選_MultiSelect","負金額_帳務","數字帶單位","日期","鎖定","新增模式"];export{ze as __namedExportsOrder,qe as default,p as 下拉,o as 互動,t as 唯讀文字,v as 單選_Radio,g as 多選_MultiSelect,u as 已變更_數字,s as 已變更_文字,c as 已變更_金額,d as 數字_含小數,k as 數字帶單位,S as 新增模式,h as 日期,b as 是否_分段,m as 比率,x as 負金額_帳務,i as 金額,j as 鎖定};
