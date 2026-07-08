import{j as n}from"./jsx-runtime-Cf8x2fCZ.js";import{r as o}from"./index-BO-NyGGJ.js";import{C as Le}from"./chart-card-DFStyfaw.js";import{D as Q}from"./data-table-BMoM3z-x.js";import{D as ft,a as bt,b as xt,c as vt,d as ht}from"./dialog-DlrVsxuj.js";import{f as Be,h as E,i as v,j as Oe,r as Tt,k as yt,s as Ke,u as Me,t as Ct,P as jt}from"./select-D8Pe3zde.js";import{c as W,n as N}from"./utils-CdvzHgU1.js";import{T as wt}from"./tab-pills-BfqjDHMG.js";import{B as Y}from"./button-BpuW6BL2.js";import{B as Nt}from"./badge-C84YC-bZ.js";import{P as y,S as Ge,B as Et,a as St}from"./index-RfzBqvdy.js";import"./index-yBjzXJbu.js";import"./card-ComTj0HN.js";import"./index-CSSP-iJI.js";import"./index-B6ujFmsw.js";import"./empty-state-uDmSVxeh.js";import"./createLucideIcon-DqplzwSp.js";import"./tooltip-CwGHE9xA.js";import"./check-DNs7zX_I.js";import"./index-9lgI2Bnf.js";var q="rovingFocusGroup.onEntryFocus",kt={bubbles:!1,cancelable:!0},F="RovingFocusGroup",[J,ze,It]=Tt(F),[_t,Ue]=Oe(F,[It]),[Dt,Ft]=_t(F),He=o.forwardRef((e,r)=>n.jsx(J.Provider,{scope:e.__scopeRovingFocusGroup,children:n.jsx(J.Slot,{scope:e.__scopeRovingFocusGroup,children:n.jsx(Rt,{...e,ref:r})})}));He.displayName=F;var Rt=o.forwardRef((e,r)=>{const{__scopeRovingFocusGroup:t,orientation:a,loop:c=!1,dir:u,currentTabStopId:s,defaultCurrentTabStopId:p,onCurrentTabStopIdChange:x,onEntryFocus:g,preventScrollOnEntryFocus:l=!1,...i}=e,f=o.useRef(null),R=yt(r,f),P=Ke(u),[A,d]=Me({prop:s,defaultProp:p??null,onChange:x,caller:F}),[h,z]=o.useState(!1),b=Ct(g),T=ze(t),U=o.useRef(!1),[dt,Z]=o.useState(0);return o.useEffect(()=>{const m=f.current;if(m)return m.addEventListener(q,b),()=>m.removeEventListener(q,b)},[b]),n.jsx(Dt,{scope:t,orientation:a,dir:P,loop:c,currentTabStopId:A,onItemFocus:o.useCallback(m=>d(m),[d]),onItemShiftTab:o.useCallback(()=>z(!0),[]),onFocusableItemAdd:o.useCallback(()=>Z(m=>m+1),[]),onFocusableItemRemove:o.useCallback(()=>Z(m=>m-1),[]),children:n.jsx(E.div,{tabIndex:h||dt===0?-1:0,"data-orientation":a,...i,ref:R,style:{outline:"none",...e.style},onMouseDown:v(e.onMouseDown,()=>{U.current=!0}),onFocus:v(e.onFocus,m=>{const ut=!U.current;if(m.target===m.currentTarget&&ut&&!h){const ee=new CustomEvent(q,kt);if(m.currentTarget.dispatchEvent(ee),!ee.defaultPrevented){const H=T().filter(C=>C.focusable),mt=H.find(C=>C.active),pt=H.find(C=>C.id===A),gt=[mt,pt,...H].filter(Boolean).map(C=>C.ref.current);Je(gt,l)}}U.current=!1}),onBlur:v(e.onBlur,()=>z(!1))})})}),Ye="RovingFocusGroupItem",qe=o.forwardRef((e,r)=>{const{__scopeRovingFocusGroup:t,focusable:a=!0,active:c=!1,tabStopId:u,children:s,...p}=e,x=Be(),g=u||x,l=Ft(Ye,t),i=l.currentTabStopId===g,f=ze(t),{onFocusableItemAdd:R,onFocusableItemRemove:P,currentTabStopId:A}=l;return o.useEffect(()=>{if(a)return R(),()=>P()},[a,R,P]),n.jsx(J.ItemSlot,{scope:t,id:g,focusable:a,active:c,children:n.jsx(E.span,{tabIndex:i?0:-1,"data-orientation":l.orientation,...p,ref:r,onMouseDown:v(e.onMouseDown,d=>{a?l.onItemFocus(g):d.preventDefault()}),onFocus:v(e.onFocus,()=>l.onItemFocus(g)),onKeyDown:v(e.onKeyDown,d=>{if(d.key==="Tab"&&d.shiftKey){l.onItemShiftTab();return}if(d.target!==d.currentTarget)return;const h=Vt(d,l.orientation,l.dir);if(h!==void 0){if(d.metaKey||d.ctrlKey||d.altKey||d.shiftKey)return;d.preventDefault();let b=f().filter(T=>T.focusable).map(T=>T.ref.current);if(h==="last")b.reverse();else if(h==="prev"||h==="next"){h==="prev"&&b.reverse();const T=b.indexOf(d.currentTarget);b=l.loop?$t(b,T+1):b.slice(T+1)}setTimeout(()=>Je(b))}}),children:typeof s=="function"?s({isCurrentTabStop:i,hasTabStop:A!=null}):s})})});qe.displayName=Ye;var Pt={ArrowLeft:"prev",ArrowUp:"prev",ArrowRight:"next",ArrowDown:"next",PageUp:"first",Home:"first",PageDown:"last",End:"last"};function At(e,r){return r!=="rtl"?e:e==="ArrowLeft"?"ArrowRight":e==="ArrowRight"?"ArrowLeft":e}function Vt(e,r,t){const a=At(e.key,t);if(!(r==="vertical"&&["ArrowLeft","ArrowRight"].includes(a))&&!(r==="horizontal"&&["ArrowUp","ArrowDown"].includes(a)))return Pt[a]}function Je(e,r=!1){const t=document.activeElement;for(const a of e)if(a===t||(a.focus({preventScroll:r}),document.activeElement!==t))return}function $t(e,r){return e.map((t,a)=>e[(r+a)%e.length])}var Lt=He,Bt=qe,M="Tabs",[Ot]=Oe(M,[Ue]),Qe=Ue(),[Kt,X]=Ot(M),We=o.forwardRef((e,r)=>{const{__scopeTabs:t,value:a,onValueChange:c,defaultValue:u,orientation:s="horizontal",dir:p,activationMode:x="automatic",...g}=e,l=Ke(p),[i,f]=Me({prop:a,onChange:c,defaultProp:u??"",caller:M});return n.jsx(Kt,{scope:t,baseId:Be(),value:i,onValueChange:f,orientation:s,dir:l,activationMode:x,children:n.jsx(E.div,{dir:l,"data-orientation":s,...g,ref:r})})});We.displayName=M;var Xe="TabsList",Ze=o.forwardRef((e,r)=>{const{__scopeTabs:t,loop:a=!0,...c}=e,u=X(Xe,t),s=Qe(t);return n.jsx(Lt,{asChild:!0,...s,orientation:u.orientation,dir:u.dir,loop:a,children:n.jsx(E.div,{role:"tablist","aria-orientation":u.orientation,...c,ref:r})})});Ze.displayName=Xe;var et="TabsTrigger",tt=o.forwardRef((e,r)=>{const{__scopeTabs:t,value:a,disabled:c=!1,...u}=e,s=X(et,t),p=Qe(t),x=at(s.baseId,a),g=ot(s.baseId,a),l=a===s.value;return n.jsx(Bt,{asChild:!0,...p,focusable:!c,active:l,children:n.jsx(E.button,{type:"button",role:"tab","aria-selected":l,"aria-controls":g,"data-state":l?"active":"inactive","data-disabled":c?"":void 0,disabled:c,id:x,...u,ref:r,onMouseDown:v(e.onMouseDown,i=>{!c&&i.button===0&&i.ctrlKey===!1?s.onValueChange(a):i.preventDefault()}),onKeyDown:v(e.onKeyDown,i=>{[" ","Enter"].includes(i.key)&&s.onValueChange(a)}),onFocus:v(e.onFocus,()=>{const i=s.activationMode!=="manual";!l&&!c&&i&&s.onValueChange(a)})})})});tt.displayName=et;var nt="TabsContent",rt=o.forwardRef((e,r)=>{const{__scopeTabs:t,value:a,forceMount:c,children:u,...s}=e,p=X(nt,t),x=at(p.baseId,a),g=ot(p.baseId,a),l=a===p.value,i=o.useRef(l);return o.useEffect(()=>{const f=requestAnimationFrame(()=>i.current=!1);return()=>cancelAnimationFrame(f)},[]),n.jsx(jt,{present:c||l,children:({present:f})=>n.jsx(E.div,{"data-state":l?"active":"inactive","data-orientation":p.orientation,role:"tabpanel","aria-labelledby":x,hidden:!f,id:g,tabIndex:0,...s,ref:r,style:{...e.style,animationDuration:i.current?"0s":void 0},children:f&&u})})});rt.displayName=nt;function at(e,r){return`${e}-trigger-${r}`}function ot(e,r){return`${e}-content-${r}`}var Mt=We,st=Ze,lt=tt,ct=rt;const it=Mt,G=o.forwardRef(({className:e,...r},t)=>n.jsx(st,{ref:t,className:W("inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",e),...r}));G.displayName=st.displayName;const j=o.forwardRef(({className:e,...r},t)=>n.jsx(lt,{ref:t,className:W("inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",e),...r}));j.displayName=lt.displayName;const w=o.forwardRef(({className:e,...r},t)=>n.jsx(ct,{ref:t,className:W("mt-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",e),...r}));w.displayName=ct.displayName;G.__docgenInfo={description:"",methods:[]};j.__docgenInfo={description:"",methods:[]};w.__docgenInfo={description:"",methods:[]};const pn={title:"元件/容器",parameters:{layout:"padded"}},Gt=[{id:"E001",name:"王小明",dept:"研發部",total:68e3},{id:"E002",name:"李美華",dept:"業務部",total:52e3},{id:"E003",name:"陳大文",dept:"行銷部",total:47e3}],O=["研發部","業務部","行銷部","財務部","客服部","品保部"],K=["工程師","資深工程師","業務代表","專員","經理","助理"],zt=Array.from({length:42},(e,r)=>({id:`E${String(r+1).padStart(3,"0")}`,name:`員工${r+1}`,dept:O[r%O.length],title:K[r%K.length],total:3e4+r*3700%18e4,tenure:r*7%130})),V={render:()=>n.jsxs("div",{className:"max-w-3xl space-y-2",children:[n.jsx("p",{className:"text-xs text-muted-foreground",children:"互動：指向儲存格看**十字對準**；表頭最右漏斗做**單欄篩選**（文字＝包含、數字＝範圍）； **拖曳欄位右邊界調整欄寬、雙擊自適應內容**；下方切換**每頁 5/15/30/50**。"}),n.jsx(Q,{rows:zt,getRowKey:e=>e.id,searchPlaceholder:"搜尋姓名／部門…",columns:[{key:"name",header:"員工",freeze:!0,sortValue:e=>e.name,filterText:e=>`${e.name} ${e.id}`,cell:e=>n.jsxs(n.Fragment,{children:[n.jsx("span",{className:"font-medium",children:e.name}),n.jsx("span",{className:"ml-1.5 text-xs text-muted-foreground",children:e.id})]})},{key:"dept",header:"部門",sortValue:e=>e.dept,filter:"select",cell:e=>e.dept},{key:"title",header:"職稱",sortValue:e=>e.title,filter:"select",cell:e=>e.title},{key:"tenure",header:"年資（月）",numeric:!0,sortValue:e=>e.tenure,cell:e=>`${e.tenure} 月`},{key:"total",header:"月薪總額",numeric:!0,sortValue:e=>e.total,cell:e=>N(e.total),total:e=>N(e.reduce((r,t)=>r+t.total,0))}]})]})},S={args:{資料筆數:42,每頁筆數:15,搜尋:!0,斑馬紋:!0,緊湊:!1,十字對準:!0,可調欄寬:!0},argTypes:{資料筆數:{control:{type:"range",min:0,max:200,step:1}},每頁筆數:{control:{type:"inline-radio"},options:[5,15,30,50]},搜尋:{control:"boolean"},斑馬紋:{control:"boolean"},緊湊:{control:"boolean"},十字對準:{control:"boolean"},可調欄寬:{control:"boolean"}},render:e=>{const r=Array.from({length:e.資料筆數},(t,a)=>({id:`E${String(a+1).padStart(3,"0")}`,name:`員工${a+1}`,dept:O[a%O.length],title:K[a%K.length],total:3e4+a*3700%18e4,tenure:a*7%130}));return n.jsx("div",{className:"max-w-3xl",children:n.jsx(Q,{rows:r,getRowKey:t=>t.id,pageSize:e.每頁筆數,searchable:e.搜尋,zebra:e.斑馬紋,dense:e.緊湊,crosshair:e.十字對準,resizable:e.可調欄寬,empty:{title:"資料筆數＝0（拉右側 Controls 調整）"},columns:[{key:"name",header:"員工",freeze:!0,sortValue:t=>t.name,filterText:t=>`${t.name} ${t.id}`,cell:t=>n.jsxs(n.Fragment,{children:[n.jsx("span",{className:"font-medium",children:t.name}),n.jsx("span",{className:"ml-1.5 text-xs text-muted-foreground",children:t.id})]})},{key:"dept",header:"部門",sortValue:t=>t.dept,filter:"select",cell:t=>t.dept},{key:"title",header:"職稱",sortValue:t=>t.title,filter:"select",cell:t=>t.title},{key:"tenure",header:"年資（月）",numeric:!0,sortValue:t=>t.tenure,cell:t=>`${t.tenure} 月`},{key:"total",header:"月薪總額",numeric:!0,sortValue:t=>t.total,cell:t=>N(t.total),total:t=>N(t.reduce((a,c)=>a+c.total,0))}]})})}},k={render:()=>n.jsx("div",{className:"max-w-2xl",children:n.jsx(Q,{rows:Gt,getRowKey:e=>e.id,searchPlaceholder:"搜尋姓名／部門…",columns:[{key:"name",header:"員工",freeze:!0,sortValue:e=>e.name,filterText:e=>`${e.name} ${e.id}`,cell:e=>n.jsxs(n.Fragment,{children:[n.jsx("span",{className:"font-medium",children:e.name}),n.jsx("span",{className:"ml-1.5 text-xs text-muted-foreground",children:e.id})]})},{key:"dept",header:"部門",sortValue:e=>e.dept,cell:e=>e.dept},{key:"total",header:"月薪總額",numeric:!0,sortValue:e=>e.total,cell:e=>N(e.total),total:e=>N(e.reduce((r,t)=>r+t.total,0))}]})})},$={render:()=>n.jsx("div",{className:"max-w-lg",children:n.jsx(Le,{title:"人事成本組成",description:"依項目分段",legend:[{label:"本薪",color:y[0]},{label:"雇主負擔",color:y[1]}],children:n.jsx(Ge,{rows:[{label:"全公司",segments:[{label:"本薪",value:42e5,color:y[0]},{label:"雇主負擔",value:9e5,color:y[1]}]}]})})})},I={args:{標題:"人事成本組成",說明:"依項目分段",圖表:"堆疊"},argTypes:{標題:{control:"text"},說明:{control:"text"},圖表:{control:"inline-radio",options:["堆疊","長條","柏拉圖"]}},render:e=>{const r=[{label:"研發",value:12e5},{label:"業務",value:86e4},{label:"行銷",value:54e4}];return n.jsx("div",{className:"max-w-lg",children:n.jsx(Le,{title:e.標題,description:e.說明,legend:e.圖表==="堆疊"?[{label:"本薪",color:y[0]},{label:"雇主負擔",color:y[1]}]:void 0,children:e.圖表==="堆疊"?n.jsx(Ge,{rows:[{label:"全公司",segments:[{label:"本薪",value:42e5,color:y[0]},{label:"雇主負擔",value:9e5,color:y[1]}]}]}):e.圖表==="長條"?n.jsx(Et,{data:r,showValues:!0}):n.jsx(St,{data:r})})})}},_={args:{分頁數:4},argTypes:{分頁數:{control:{type:"range",min:2,max:8,step:1}}},render:e=>{const r=()=>{const t=Array.from({length:e.分頁數},(u,s)=>({key:String(s),label:`分頁 ${s+1}`})),[a,c]=o.useState("0");return n.jsxs("div",{className:"w-[520px]",children:[n.jsx(wt,{tabs:t,value:a,onChange:c}),n.jsxs("p",{className:"mt-3 text-sm text-muted-foreground",children:["目前：分頁 ",Number(a)+1]})]})};return n.jsx(r,{},e.分頁數)}},D={args:{分頁數:3},argTypes:{分頁數:{control:{type:"range",min:2,max:6,step:1}}},render:e=>{const r=Array.from({length:e.分頁數},(t,a)=>String(a));return n.jsxs(it,{defaultValue:"0",className:"w-[460px]",children:[n.jsx(G,{children:r.map((t,a)=>n.jsxs(j,{value:t,children:["分頁 ",a+1]},t))}),r.map((t,a)=>n.jsxs(w,{value:t,className:"pt-3 text-sm",children:["分頁 ",a+1," 的內容"]},t))]})}},L={render:()=>{const e=()=>{const[r,t]=o.useState(!0);return n.jsxs(n.Fragment,{children:[n.jsx(Y,{onClick:()=>t(!0),children:"開啟對話框"}),n.jsx(ft,{open:r,onOpenChange:t,children:n.jsxs(bt,{children:[n.jsx(xt,{children:n.jsx(vt,{children:"對話框標題"})}),n.jsx("p",{className:"text-sm text-muted-foreground",children:"置中卡片、自畫面中央縮放彈出（見行動版修正）。"}),n.jsxs(ht,{children:[n.jsx(Y,{variant:"outline",onClick:()=>t(!1),children:"取消"}),n.jsx(Y,{onClick:()=>t(!1),children:"確定"})]})]})})]})};return n.jsx(e,{})}},B={render:()=>n.jsxs(it,{defaultValue:"a",className:"w-96",children:[n.jsxs(G,{children:[n.jsx(j,{value:"a",children:"總覽"}),n.jsx(j,{value:"b",children:"明細"}),n.jsx(j,{value:"c",children:"設定"})]}),n.jsxs(w,{value:"a",className:"pt-3 text-sm",children:["總覽內容 ",n.jsx(Nt,{variant:"secondary",children:"shadcn Tabs 元件"})]}),n.jsx(w,{value:"b",className:"pt-3 text-sm",children:"明細內容"}),n.jsx(w,{value:"c",className:"pt-3 text-sm",children:"設定內容"})]})};var te,ne,re;V.parameters={...V.parameters,docs:{...(te=V.parameters)==null?void 0:te.docs,source:{originalSource:`{
  render: () => <div className="max-w-3xl space-y-2">
      <p className="text-xs text-muted-foreground">
        互動：指向儲存格看**十字對準**；表頭最右漏斗做**單欄篩選**（文字＝包含、數字＝範圍）；
        **拖曳欄位右邊界調整欄寬、雙擊自適應內容**；下方切換**每頁 5/15/30/50**。
      </p>
      <DataTable rows={big} getRowKey={r => r.id} searchPlaceholder="搜尋姓名／部門…" columns={[{
      key: "name",
      header: "員工",
      freeze: true,
      sortValue: r => r.name,
      filterText: r => \`\${r.name} \${r.id}\`,
      cell: r => <><span className="font-medium">{r.name}</span><span className="ml-1.5 text-xs text-muted-foreground">{r.id}</span></>
    }, {
      key: "dept",
      header: "部門",
      sortValue: r => r.dept,
      filter: "select",
      cell: r => r.dept
    }, {
      key: "title",
      header: "職稱",
      sortValue: r => r.title,
      filter: "select",
      cell: r => r.title
    }, {
      key: "tenure",
      header: "年資（月）",
      numeric: true,
      sortValue: r => r.tenure,
      cell: r => \`\${r.tenure} 月\`
    }, {
      key: "total",
      header: "月薪總額",
      numeric: true,
      sortValue: r => r.total,
      cell: r => ntd(r.total),
      total: rs => ntd(rs.reduce((a, r) => a + r.total, 0))
    }]} />
    </div>
}`,...(re=(ne=V.parameters)==null?void 0:ne.docs)==null?void 0:re.source}}};var ae,oe,se,le,ce;S.parameters={...S.parameters,docs:{...(ae=S.parameters)==null?void 0:ae.docs,source:{originalSource:`{
  args: {
    資料筆數: 42,
    每頁筆數: 15,
    搜尋: true,
    斑馬紋: true,
    緊湊: false,
    十字對準: true,
    可調欄寬: true
  },
  argTypes: {
    資料筆數: {
      control: {
        type: "range",
        min: 0,
        max: 200,
        step: 1
      }
    },
    每頁筆數: {
      control: {
        type: "inline-radio"
      },
      options: [5, 15, 30, 50]
    },
    搜尋: {
      control: "boolean"
    },
    斑馬紋: {
      control: "boolean"
    },
    緊湊: {
      control: "boolean"
    },
    十字對準: {
      control: "boolean"
    },
    可調欄寬: {
      control: "boolean"
    }
  },
  render: a => {
    const data = Array.from({
      length: a.資料筆數
    }, (_, i) => ({
      id: \`E\${String(i + 1).padStart(3, "0")}\`,
      name: \`員工\${i + 1}\`,
      dept: DEPTS[i % DEPTS.length],
      title: TITLES[i % TITLES.length],
      total: 30000 + i * 3700 % 180000,
      tenure: i * 7 % 130
    }));
    return <div className="max-w-3xl">
        <DataTable rows={data} getRowKey={r => r.id} pageSize={a.每頁筆數} searchable={a.搜尋} zebra={a.斑馬紋} dense={a.緊湊} crosshair={a.十字對準} resizable={a.可調欄寬} empty={{
        title: "資料筆數＝0（拉右側 Controls 調整）"
      }} columns={[{
        key: "name",
        header: "員工",
        freeze: true,
        sortValue: r => r.name,
        filterText: r => \`\${r.name} \${r.id}\`,
        cell: r => <><span className="font-medium">{r.name}</span><span className="ml-1.5 text-xs text-muted-foreground">{r.id}</span></>
      }, {
        key: "dept",
        header: "部門",
        sortValue: r => r.dept,
        filter: "select",
        cell: r => r.dept
      }, {
        key: "title",
        header: "職稱",
        sortValue: r => r.title,
        filter: "select",
        cell: r => r.title
      }, {
        key: "tenure",
        header: "年資（月）",
        numeric: true,
        sortValue: r => r.tenure,
        cell: r => \`\${r.tenure} 月\`
      }, {
        key: "total",
        header: "月薪總額",
        numeric: true,
        sortValue: r => r.total,
        cell: r => ntd(r.total),
        total: rs => ntd(rs.reduce((x, r) => x + r.total, 0))
      }]} />
      </div>;
  }
}`,...(se=(oe=S.parameters)==null?void 0:oe.docs)==null?void 0:se.source},description:{story:`互動 Playground：用右側 Controls 即時調整**資料筆數**與各項開關（分頁/斑馬紋/緊湊/十字對準/
可調欄寬/搜尋），快速驗證多種狀況——不用改程式碼。`,...(ce=(le=S.parameters)==null?void 0:le.docs)==null?void 0:ce.description}}};var ie,de,ue,me,pe;k.parameters={...k.parameters,docs:{...(ie=k.parameters)==null?void 0:ie.docs,source:{originalSource:`{
  render: () => <div className="max-w-2xl">
      <DataTable rows={people} getRowKey={r => r.id} searchPlaceholder="搜尋姓名／部門…" columns={[{
      key: "name",
      header: "員工",
      freeze: true,
      sortValue: r => r.name,
      filterText: r => \`\${r.name} \${r.id}\`,
      cell: r => <><span className="font-medium">{r.name}</span><span className="ml-1.5 text-xs text-muted-foreground">{r.id}</span></>
    }, {
      key: "dept",
      header: "部門",
      sortValue: r => r.dept,
      cell: r => r.dept
    }, {
      key: "total",
      header: "月薪總額",
      numeric: true,
      sortValue: r => r.total,
      cell: r => ntd(r.total),
      total: rs => ntd(rs.reduce((a, r) => a + r.total, 0))
    }]} />
    </div>
}`,...(ue=(de=k.parameters)==null?void 0:de.docs)==null?void 0:ue.source},description:{story:"小資料集（無分頁）：純示範欄位設定與合計列",...(pe=(me=k.parameters)==null?void 0:me.docs)==null?void 0:pe.description}}};var ge,fe,be;$.parameters={...$.parameters,docs:{...(ge=$.parameters)==null?void 0:ge.docs,source:{originalSource:`{
  render: () => <div className="max-w-lg">
      <ChartCard title="人事成本組成" description="依項目分段" legend={[{
      label: "本薪",
      color: PALETTE[0]
    }, {
      label: "雇主負擔",
      color: PALETTE[1]
    }]}>
        <StackedBar rows={[{
        label: "全公司",
        segments: [{
          label: "本薪",
          value: 4200000,
          color: PALETTE[0]
        }, {
          label: "雇主負擔",
          value: 900000,
          color: PALETTE[1]
        }]
      }]} />
      </ChartCard>
    </div>
}`,...(be=(fe=$.parameters)==null?void 0:fe.docs)==null?void 0:be.source}}};var xe,ve,he,Te,ye;I.parameters={...I.parameters,docs:{...(xe=I.parameters)==null?void 0:xe.docs,source:{originalSource:`{
  args: {
    標題: "人事成本組成",
    說明: "依項目分段",
    圖表: "堆疊"
  },
  argTypes: {
    標題: {
      control: "text"
    },
    說明: {
      control: "text"
    },
    圖表: {
      control: "inline-radio",
      options: ["堆疊", "長條", "柏拉圖"]
    }
  },
  render: a => {
    const bars = [{
      label: "研發",
      value: 1200000
    }, {
      label: "業務",
      value: 860000
    }, {
      label: "行銷",
      value: 540000
    }];
    return <div className="max-w-lg">
        <ChartCard title={a.標題} description={a.說明} legend={a.圖表 === "堆疊" ? [{
        label: "本薪",
        color: PALETTE[0]
      }, {
        label: "雇主負擔",
        color: PALETTE[1]
      }] : undefined}>
          {a.圖表 === "堆疊" ? <StackedBar rows={[{
          label: "全公司",
          segments: [{
            label: "本薪",
            value: 4200000,
            color: PALETTE[0]
          }, {
            label: "雇主負擔",
            value: 900000,
            color: PALETTE[1]
          }]
        }]} /> : a.圖表 === "長條" ? <BarChart data={bars} showValues /> : <Pareto data={bars} />}
        </ChartCard>
      </div>;
  }
}`,...(he=(ve=I.parameters)==null?void 0:ve.docs)==null?void 0:he.source},description:{story:"互動 Playground：右側 Controls 調整標題/說明/圖表類型。",...(ye=(Te=I.parameters)==null?void 0:Te.docs)==null?void 0:ye.description}}};var Ce,je,we,Ne,Ee;_.parameters={..._.parameters,docs:{...(Ce=_.parameters)==null?void 0:Ce.docs,source:{originalSource:`{
  args: {
    分頁數: 4
  },
  argTypes: {
    分頁數: {
      control: {
        type: "range",
        min: 2,
        max: 8,
        step: 1
      }
    }
  },
  render: a => {
    const Demo = () => {
      const tabs = Array.from({
        length: a.分頁數
      }, (_, i) => ({
        key: String(i),
        label: \`分頁 \${i + 1}\`
      }));
      const [v, setV] = useState("0");
      return <div className="w-[520px]"><TabPills tabs={tabs} value={v} onChange={setV} /><p className="mt-3 text-sm text-muted-foreground">目前：分頁 {Number(v) + 1}</p></div>;
    };
    return <Demo key={a.分頁數} />;
  }
}`,...(we=(je=_.parameters)==null?void 0:je.docs)==null?void 0:we.source},description:{story:"分頁膠囊列（全站分頁切換統一元件）：右側 Controls 調整分頁數。",...(Ee=(Ne=_.parameters)==null?void 0:Ne.docs)==null?void 0:Ee.description}}};var Se,ke,Ie,_e,De;D.parameters={...D.parameters,docs:{...(Se=D.parameters)==null?void 0:Se.docs,source:{originalSource:`{
  args: {
    分頁數: 3
  },
  argTypes: {
    分頁數: {
      control: {
        type: "range",
        min: 2,
        max: 6,
        step: 1
      }
    }
  },
  render: a => {
    const keys = Array.from({
      length: a.分頁數
    }, (_, i) => String(i));
    return <Tabs defaultValue="0" className="w-[460px]">
        <TabsList>{keys.map((k, i) => <TabsTrigger key={k} value={k}>分頁 {i + 1}</TabsTrigger>)}</TabsList>
        {keys.map((k, i) => <TabsContent key={k} value={k} className="pt-3 text-sm">分頁 {i + 1} 的內容</TabsContent>)}
      </Tabs>;
  }
}`,...(Ie=(ke=D.parameters)==null?void 0:ke.docs)==null?void 0:Ie.source},description:{story:"互動 Playground：右側 Controls 調整分頁數量。",...(De=(_e=D.parameters)==null?void 0:_e.docs)==null?void 0:De.description}}};var Fe,Re,Pe;L.parameters={...L.parameters,docs:{...(Fe=L.parameters)==null?void 0:Fe.docs,source:{originalSource:`{
  render: () => {
    const Demo = () => {
      const [open, setOpen] = useState(true);
      return <>
          <Button onClick={() => setOpen(true)}>開啟對話框</Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
              <DialogHeader><DialogTitle>對話框標題</DialogTitle></DialogHeader>
              <p className="text-sm text-muted-foreground">置中卡片、自畫面中央縮放彈出（見行動版修正）。</p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>取消</Button>
                <Button onClick={() => setOpen(false)}>確定</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>;
    };
    return <Demo />;
  }
}`,...(Pe=(Re=L.parameters)==null?void 0:Re.docs)==null?void 0:Pe.source}}};var Ae,Ve,$e;B.parameters={...B.parameters,docs:{...(Ae=B.parameters)==null?void 0:Ae.docs,source:{originalSource:`{
  render: () => <Tabs defaultValue="a" className="w-96">
      <TabsList>
        <TabsTrigger value="a">總覽</TabsTrigger>
        <TabsTrigger value="b">明細</TabsTrigger>
        <TabsTrigger value="c">設定</TabsTrigger>
      </TabsList>
      <TabsContent value="a" className="pt-3 text-sm">總覽內容 <Badge variant="secondary">shadcn Tabs 元件</Badge></TabsContent>
      <TabsContent value="b" className="pt-3 text-sm">明細內容</TabsContent>
      <TabsContent value="c" className="pt-3 text-sm">設定內容</TabsContent>
    </Tabs>
}`,...($e=(Ve=B.parameters)==null?void 0:Ve.docs)==null?void 0:$e.source}}};const gn=["資料表_DataTable","互動測試","資料表_精簡","圖表卡_ChartCard","圖表卡_互動","分頁膠囊_TabPills","分頁_互動","對話框_Dialog","分頁_Tabs"];export{gn as __namedExportsOrder,pn as default,S as 互動測試,B as 分頁_Tabs,D as 分頁_互動,_ as 分頁膠囊_TabPills,$ as 圖表卡_ChartCard,I as 圖表卡_互動,L as 對話框_Dialog,V as 資料表_DataTable,k as 資料表_精簡};
