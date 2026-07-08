import{j as e}from"./jsx-runtime-Cf8x2fCZ.js";import{r as ge}from"./index-BO-NyGGJ.js";import{E as be}from"./EditableField--DL-cSl3.js";import"./index-yBjzXJbu.js";import"./select-D8Pe3zde.js";import"./utils-CdvzHgU1.js";import"./index-CSSP-iJI.js";import"./index-B6ujFmsw.js";import"./createLucideIcon-DqplzwSp.js";import"./check-DNs7zX_I.js";import"./tooltip-CwGHE9xA.js";import"./undo-2-BWndPgvs.js";const Ce={title:"元件/表單/EditableField",component:be,parameters:{layout:"centered"}};function r(x){const[ve,j]=ge.useState(x.value);return e.jsx("div",{className:"w-72",children:e.jsx(be,{...x,value:ve,onChange:j,onRevert:()=>j(x.original)})})}const a={render:()=>e.jsx(r,{label:"部門",kind:"text",value:"行銷部",original:"行銷部"})},l={render:()=>e.jsx(r,{label:"部門",kind:"text",value:"測試部",original:"行銷部"})},o={render:()=>e.jsx(r,{label:"本薪",kind:"money",value:45e3,original:45e3})},n={render:()=>e.jsx(r,{label:"本薪",kind:"money",value:48e3,original:45e3})},s={render:()=>e.jsx(r,{label:"本月工時",kind:"number",value:168.5,original:168.5,help:"千分位並保留小數"})},t={render:()=>e.jsx(r,{label:"本月工時",kind:"number",value:176,original:168.5})},i={render:()=>e.jsx(r,{label:"勞退自提率",kind:"rate",value:.06,original:.06,help:"0～6%"})},c={render:()=>e.jsx(r,{label:"任職狀態",kind:"select",value:"在職",original:"在職",options:[{value:"在職",label:"在職"},{value:"離職",label:"離職"},{value:"留停",label:"留停"}]})},d={render:()=>e.jsx(r,{label:"依附健保",kind:"checkbox",value:!0,original:!0})},u={render:()=>e.jsx(r,{label:"每月扣繳方式",kind:"radio",value:"固定5%",original:"固定5%",options:[{value:"固定5%",label:"固定 5%"},{value:"依扣繳稅額表",label:"依扣繳稅額表"}]})},m={render:()=>e.jsx(r,{label:"本月請假別",kind:"multiselect",value:["特休","病假"],original:["特休"],options:[{value:"特休",label:"特休"},{value:"病假",label:"病假"},{value:"事假",label:"事假"},{value:"婚假",label:"婚假"},{value:"喪假",label:"喪假"}]})},p={render:()=>e.jsx(r,{label:"其他扣款",kind:"money",value:-2e3,original:-2e3,help:"負值以括號＋紅字呈現（帳務）"})},b={render:()=>e.jsx(r,{label:"本月工時",kind:"number",value:168.5,original:168.5,unit:"h"})},v={render:()=>e.jsx(r,{label:"到職日",kind:"date",value:"2020-01-01",original:"2020-01-01"})},g={render:()=>e.jsx(r,{label:"員工編號",kind:"text",value:"E001",disabled:!0,lockHint:"本月已確認結算、此欄已鎖定"})},k={render:()=>e.jsx(r,{label:"姓名",kind:"text",value:"",alwaysEdit:!0,trackChanges:!1,placeholder:"輸入姓名"})};var S,_,D;a.parameters={...a.parameters,docs:{...(S=a.parameters)==null?void 0:S.docs,source:{originalSource:`{
  render: () => <Demo label="部門" kind="text" value="行銷部" original="行銷部" />
}`,...(D=(_=a.parameters)==null?void 0:_.docs)==null?void 0:D.source}}};var h,E,y;l.parameters={...l.parameters,docs:{...(h=l.parameters)==null?void 0:h.docs,source:{originalSource:`{
  render: () => <Demo label="部門" kind="text" value="測試部" original="行銷部" />
}`,...(y=(E=l.parameters)==null?void 0:E.docs)==null?void 0:y.source}}};var f,R,w;o.parameters={...o.parameters,docs:{...(f=o.parameters)==null?void 0:f.docs,source:{originalSource:`{
  render: () => <Demo label="本薪" kind="money" value={45000} original={45000} />
}`,...(w=(R=o.parameters)==null?void 0:R.docs)==null?void 0:w.source}}};var C,F,H;n.parameters={...n.parameters,docs:{...(C=n.parameters)==null?void 0:C.docs,source:{originalSource:`{
  render: () => <Demo label="本薪" kind="money" value={48000} original={45000} />
}`,...(H=(F=n.parameters)==null?void 0:F.docs)==null?void 0:H.source}}};var M,N,O;s.parameters={...s.parameters,docs:{...(M=s.parameters)==null?void 0:M.docs,source:{originalSource:`{
  render: () => <Demo label="本月工時" kind="number" value={168.5} original={168.5} help="千分位並保留小數" />
}`,...(O=(N=s.parameters)==null?void 0:N.docs)==null?void 0:O.source}}};var V,q,z;t.parameters={...t.parameters,docs:{...(V=t.parameters)==null?void 0:V.docs,source:{originalSource:`{
  render: () => <Demo label="本月工時" kind="number" value={176} original={168.5} />
}`,...(z=(q=t.parameters)==null?void 0:q.docs)==null?void 0:z.source}}};var A,B,G;i.parameters={...i.parameters,docs:{...(A=i.parameters)==null?void 0:A.docs,source:{originalSource:`{
  render: () => <Demo label="勞退自提率" kind="rate" value={0.06} original={0.06} help="0～6%" />
}`,...(G=(B=i.parameters)==null?void 0:B.docs)==null?void 0:G.source}}};var I,J,K;c.parameters={...c.parameters,docs:{...(I=c.parameters)==null?void 0:I.docs,source:{originalSource:`{
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
}`,...(K=(J=c.parameters)==null?void 0:J.docs)==null?void 0:K.source}}};var L,P,Q;d.parameters={...d.parameters,docs:{...(L=d.parameters)==null?void 0:L.docs,source:{originalSource:`{
  render: () => <Demo label="依附健保" kind="checkbox" value={true} original={true} />
}`,...(Q=(P=d.parameters)==null?void 0:P.docs)==null?void 0:Q.source}}};var T,U,W;u.parameters={...u.parameters,docs:{...(T=u.parameters)==null?void 0:T.docs,source:{originalSource:`{
  render: () => <Demo label="每月扣繳方式" kind="radio" value="固定5%" original="固定5%" options={[{
    value: "固定5%",
    label: "固定 5%"
  }, {
    value: "依扣繳稅額表",
    label: "依扣繳稅額表"
  }]} />
}`,...(W=(U=u.parameters)==null?void 0:U.docs)==null?void 0:W.source}}};var X,Y,Z;m.parameters={...m.parameters,docs:{...(X=m.parameters)==null?void 0:X.docs,source:{originalSource:`{
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
}`,...(Z=(Y=m.parameters)==null?void 0:Y.docs)==null?void 0:Z.source}}};var $,ee,re;p.parameters={...p.parameters,docs:{...($=p.parameters)==null?void 0:$.docs,source:{originalSource:`{
  render: () => <Demo label="其他扣款" kind="money" value={-2000} original={-2000} help="負值以括號＋紅字呈現（帳務）" />
}`,...(re=(ee=p.parameters)==null?void 0:ee.docs)==null?void 0:re.source}}};var ae,le,oe;b.parameters={...b.parameters,docs:{...(ae=b.parameters)==null?void 0:ae.docs,source:{originalSource:`{
  render: () => <Demo label="本月工時" kind="number" value={168.5} original={168.5} unit="h" />
}`,...(oe=(le=b.parameters)==null?void 0:le.docs)==null?void 0:oe.source}}};var ne,se,te;v.parameters={...v.parameters,docs:{...(ne=v.parameters)==null?void 0:ne.docs,source:{originalSource:`{
  render: () => <Demo label="到職日" kind="date" value="2020-01-01" original="2020-01-01" />
}`,...(te=(se=v.parameters)==null?void 0:se.docs)==null?void 0:te.source}}};var ie,ce,de;g.parameters={...g.parameters,docs:{...(ie=g.parameters)==null?void 0:ie.docs,source:{originalSource:`{
  render: () => <Demo label="員工編號" kind="text" value="E001" disabled lockHint="本月已確認結算、此欄已鎖定" />
}`,...(de=(ce=g.parameters)==null?void 0:ce.docs)==null?void 0:de.source}}};var ue,me,pe;k.parameters={...k.parameters,docs:{...(ue=k.parameters)==null?void 0:ue.docs,source:{originalSource:`{
  render: () => <Demo label="姓名" kind="text" value="" alwaysEdit trackChanges={false} placeholder="輸入姓名" />
}`,...(pe=(me=k.parameters)==null?void 0:me.docs)==null?void 0:pe.source}}};const Fe=["唯讀文字","已變更_文字","金額","已變更_金額","數字_含小數","已變更_數字","比率","下拉","是否_分段","單選_Radio","多選_MultiSelect","負金額_帳務","數字帶單位","日期","鎖定","新增模式"];export{Fe as __namedExportsOrder,Ce as default,c as 下拉,a as 唯讀文字,u as 單選_Radio,m as 多選_MultiSelect,t as 已變更_數字,l as 已變更_文字,n as 已變更_金額,s as 數字_含小數,b as 數字帶單位,k as 新增模式,v as 日期,d as 是否_分段,i as 比率,p as 負金額_帳務,o as 金額,g as 鎖定};
