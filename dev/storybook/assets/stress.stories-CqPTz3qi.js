import{j as a}from"./jsx-runtime-Cf8x2fCZ.js";import{r as oe}from"./index-BO-NyGGJ.js";import{E as se}from"./EditableField--DL-cSl3.js";import{C as te}from"./ChangeSummary-eeB7lPUh.js";import{D as le}from"./data-table-CWPbbD6i.js";import{B as ne}from"./badge-DdjrCzeD.js";import{S as de}from"./Stepper-DzOchFjc.js";import{S as ce,P as ie,c as me}from"./index-BMdImUm2.js";import{n as l}from"./utils-CdvzHgU1.js";import"./index-yBjzXJbu.js";import"./select-D8Pe3zde.js";import"./index-CSSP-iJI.js";import"./index-B6ujFmsw.js";import"./createLucideIcon-DqplzwSp.js";import"./check-DNs7zX_I.js";import"./tooltip-CwGHE9xA.js";import"./undo-2-BWndPgvs.js";import"./empty-state-uDmSVxeh.js";import"./button-BpuW6BL2.js";import"./index-9lgI2Bnf.js";const Pe={title:"壓力測試",parameters:{layout:"padded"}};function n(e){const[r,o]=oe.useState(e.value);return a.jsx("div",{className:"w-72 rounded border border-dashed p-2",children:a.jsx(se,{...e,value:r,onChange:o,onRevert:()=>o(e.original)})})}const t="這是一段非常非常長的內容用來測試欄位在超長文字時會不會撐破版面AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",f=(e,r)=>Array.from({length:e},(o,s)=>({value:`o${s}`,label:`${r}選項${s+1}－較長的名稱文字`})),d={render:()=>a.jsx(n,{label:"部門",kind:"text",value:t,original:t})},c={render:()=>a.jsx(n,{label:"這是一個超級長的欄位標籤名稱用來測試標籤是否換行或被截斷處理",kind:"text",value:"值",original:"值"})},i={render:()=>a.jsx(n,{label:"投保金額",kind:"money",value:1234567890123,original:1234567890123})},m={render:()=>a.jsx(n,{label:"扣繳方式",kind:"radio",value:"o0",original:"o0",options:f(6,"扣繳")})},u={render:()=>a.jsx(n,{label:"適用津貼",kind:"multiselect",value:["o0","o1","o2","o3","o4","o5","o6","o7","o8","o9","o10","o11"],original:["o0"],options:f(24,"津貼")})},p={render:()=>a.jsx(n,{label:"狀態",kind:"select",value:"o0",original:"o0",options:f(3,"非常長的狀態名稱")})},ue=Array.from({length:24},(e,r)=>({field:`f${r}`,label:`欄位名稱${r+1}${r%3===0?"（較長的欄位標籤）":""}`,before:r,after:r+1,beforeText:r%4===0?t.slice(0,30):`舊值${r}`,afterText:r%4===0?t.slice(0,30):`新值${r}`})),g={render:()=>a.jsx("div",{className:"w-[520px]",children:a.jsx(te,{changes:ue,onRevertField:()=>{},onRevertAll:()=>{}})})},pe=Array.from({length:8},(e,r)=>({id:`E${r}`,name:`員工姓名比較長${r}`,dept:`部門名稱${r}`,note:t.slice(0,20),a:12345*(r+1),b:999*(r+1),c:45800,d:1832,e:6,f:`2020-0${r%9+1}-01`})),A={render:()=>a.jsx(le,{rows:pe,getRowKey:e=>e.id,searchPlaceholder:"搜尋…",columns:[{key:"name",header:"員工",freeze:!0,sortValue:e=>e.name,cell:e=>a.jsx("span",{className:"font-medium",children:e.name})},{key:"dept",header:"部門",cell:e=>e.dept},{key:"note",header:"備註（長）",truncate:160,filterText:e=>e.note,cell:e=>e.note},{key:"a",header:"應發",numeric:!0,cell:e=>l(e.a)},{key:"b",header:"加班費",numeric:!0,cell:e=>l(e.b)},{key:"c",header:"投保",numeric:!0,cell:e=>l(e.c)},{key:"d",header:"健保",numeric:!0,cell:e=>l(e.d)},{key:"e",header:"自提率",numeric:!0,cell:e=>`${e.e}%`},{key:"f",header:"到職日",cell:e=>e.f},{key:"x",header:"操作",cell:()=>a.jsx(ne,{variant:"outline",children:"編輯"})}]})},h={render:()=>a.jsx("div",{className:"w-64",children:a.jsx(ne,{variant:"secondary",children:"這是一個很長的標籤文字用來測試 Badge 換行或溢出"})})},y={render:()=>a.jsx(de,{current:"s5",steps:Array.from({length:10},(e,r)=>({key:`s${r}`,label:`步驟名稱${r+1}`})),completed:{s0:!0,s1:!0,s2:!0,s3:!0,s4:!0}})},ge=Array.from({length:20},(e,r)=>({label:`部門單位名稱${r+1}`,value:Math.round(5e5/(r+1))})),v={render:()=>a.jsx("div",{className:"w-[460px]",children:a.jsx(me,{data:ge})})},x={render:()=>a.jsx("div",{className:"w-[460px]",children:a.jsx(ce,{rows:Array.from({length:12},(e,r)=>({label:`部門${r+1}`,segments:ie.map((o,s)=>({label:`項目${s}`,value:1e4*(s+1),color:o}))}))})})};var k,_,b;d.parameters={...d.parameters,docs:{...(k=d.parameters)==null?void 0:k.docs,source:{originalSource:`{
  render: () => <Field label="部門" kind="text" value={LONG} original={LONG} />
}`,...(b=(_=d.parameters)==null?void 0:_.docs)==null?void 0:b.source}}};var j,$,S;c.parameters={...c.parameters,docs:{...(j=c.parameters)==null?void 0:j.docs,source:{originalSource:`{
  render: () => <Field label={"這是一個超級長的欄位標籤名稱用來測試標籤是否換行或被截斷處理"} kind="text" value="值" original="值" />
}`,...(S=($=c.parameters)==null?void 0:$.docs)==null?void 0:S.source}}};var w,N,B;i.parameters={...i.parameters,docs:{...(w=i.parameters)==null?void 0:w.docs,source:{originalSource:`{
  render: () => <Field label="投保金額" kind="money" value={1234567890123} original={1234567890123} />
}`,...(B=(N=i.parameters)==null?void 0:N.docs)==null?void 0:B.source}}};var E,F,T;m.parameters={...m.parameters,docs:{...(E=m.parameters)==null?void 0:E.docs,source:{originalSource:`{
  render: () => <Field label="扣繳方式" kind="radio" value="o0" original="o0" options={longOpts(6, "扣繳")} />
}`,...(T=(F=m.parameters)==null?void 0:F.docs)==null?void 0:T.source}}};var O,R,P;u.parameters={...u.parameters,docs:{...(O=u.parameters)==null?void 0:O.docs,source:{originalSource:`{
  render: () => <Field label="適用津貼" kind="multiselect" value={["o0", "o1", "o2", "o3", "o4", "o5", "o6", "o7", "o8", "o9", "o10", "o11"]} original={["o0"]} options={longOpts(24, "津貼")} />
}`,...(P=(R=u.parameters)==null?void 0:R.docs)==null?void 0:P.source}}};var C,L,D;p.parameters={...p.parameters,docs:{...(C=p.parameters)==null?void 0:C.docs,source:{originalSource:`{
  render: () => <Field label="狀態" kind="select" value="o0" original="o0" options={longOpts(3, "非常長的狀態名稱")} />
}`,...(D=(L=p.parameters)==null?void 0:L.docs)==null?void 0:D.source}}};var G,V,z;g.parameters={...g.parameters,docs:{...(G=g.parameters)==null?void 0:G.docs,source:{originalSource:`{
  render: () => <div className="w-[520px]"><ChangeSummary changes={manyChanges} onRevertField={() => {}} onRevertAll={() => {}} /></div>
}`,...(z=(V=g.parameters)==null?void 0:V.docs)==null?void 0:z.source}}};var K,M,q;A.parameters={...A.parameters,docs:{...(K=A.parameters)==null?void 0:K.docs,source:{originalSource:`{
  render: () => <DataTable rows={rows} getRowKey={r => r.id} searchPlaceholder="搜尋…" columns={[{
    key: "name",
    header: "員工",
    freeze: true,
    sortValue: r => r.name,
    cell: r => <span className="font-medium">{r.name}</span>
  }, {
    key: "dept",
    header: "部門",
    cell: r => r.dept
  }, {
    key: "note",
    header: "備註（長）",
    truncate: 160,
    filterText: r => r.note,
    cell: r => r.note
  }, {
    key: "a",
    header: "應發",
    numeric: true,
    cell: r => ntd(r.a)
  }, {
    key: "b",
    header: "加班費",
    numeric: true,
    cell: r => ntd(r.b)
  }, {
    key: "c",
    header: "投保",
    numeric: true,
    cell: r => ntd(r.c)
  }, {
    key: "d",
    header: "健保",
    numeric: true,
    cell: r => ntd(r.d)
  }, {
    key: "e",
    header: "自提率",
    numeric: true,
    cell: r => \`\${r.e}%\`
  }, {
    key: "f",
    header: "到職日",
    cell: r => r.f
  }, {
    key: "x",
    header: "操作",
    cell: () => <Badge variant="outline">編輯</Badge>
  }]} />
}`,...(q=(M=A.parameters)==null?void 0:M.docs)==null?void 0:q.source}}};var H,I,J;h.parameters={...h.parameters,docs:{...(H=h.parameters)==null?void 0:H.docs,source:{originalSource:`{
  render: () => <div className="w-64"><Badge variant="secondary">這是一個很長的標籤文字用來測試 Badge 換行或溢出</Badge></div>
}`,...(J=(I=h.parameters)==null?void 0:I.docs)==null?void 0:J.source}}};var Q,U,W;y.parameters={...y.parameters,docs:{...(Q=y.parameters)==null?void 0:Q.docs,source:{originalSource:`{
  render: () => <Stepper current="s5" steps={Array.from({
    length: 10
  }, (_, i) => ({
    key: \`s\${i}\`,
    label: \`步驟名稱\${i + 1}\`
  }))} completed={{
    s0: true,
    s1: true,
    s2: true,
    s3: true,
    s4: true
  }} />
}`,...(W=(U=y.parameters)==null?void 0:U.docs)==null?void 0:W.source}}};var X,Y,Z;v.parameters={...v.parameters,docs:{...(X=v.parameters)==null?void 0:X.docs,source:{originalSource:`{
  render: () => <div className="w-[460px]"><Pareto data={manyBars} /></div>
}`,...(Z=(Y=v.parameters)==null?void 0:Y.docs)==null?void 0:Z.source}}};var ee,re,ae;x.parameters={...x.parameters,docs:{...(ee=x.parameters)==null?void 0:ee.docs,source:{originalSource:`{
  render: () => <div className="w-[460px]">
      <StackedBar rows={Array.from({
      length: 12
    }, (_, i) => ({
      label: \`部門\${i + 1}\`,
      segments: PALETTE.map((c, j) => ({
        label: \`項目\${j}\`,
        value: 10000 * (j + 1),
        color: c
      }))
    }))} />
    </div>
}`,...(ae=(re=x.parameters)==null?void 0:re.docs)==null?void 0:ae.source}}};const Ce=["欄位_超長文字","欄位_超長標籤","欄位_超大金額","欄位_radio多且長","欄位_多選超多項","欄位_下拉長選項","變更摘要_超多筆","資料表_多欄超寬","標籤_超長","步驟_很多步","圖表_柏拉圖多類別","圖表_堆疊多段"];export{Ce as __namedExportsOrder,Pe as default,x as 圖表_堆疊多段,v as 圖表_柏拉圖多類別,h as 標籤_超長,m as 欄位_radio多且長,p as 欄位_下拉長選項,u as 欄位_多選超多項,i as 欄位_超大金額,d as 欄位_超長文字,c as 欄位_超長標籤,y as 步驟_很多步,g as 變更摘要_超多筆,A as 資料表_多欄超寬};
