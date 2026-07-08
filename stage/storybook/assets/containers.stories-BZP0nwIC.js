import{j as n}from"./jsx-runtime-Cf8x2fCZ.js";import{r as s}from"./index-BO-NyGGJ.js";import{C as Re}from"./chart-card-CzkOJp18.js";import{D as J}from"./data-table-24LqgrV8.js";import{D as it,a as dt,b as ut,c as mt,d as pt}from"./dialog-B46OsyNl.js";import{f as De,h as N,i as h,j as Pe,r as ft,k as gt,s as Ae,u as Ve,t as bt,P as xt}from"./select-D8Pe3zde.js";import{c as Q,n as E}from"./utils-CdvzHgU1.js";import{B as H}from"./button-BpuW6BL2.js";import{B as ht}from"./badge-DdjrCzeD.js";import{a as y,S as $e,B as vt,P as Tt}from"./index-D04uuL-I.js";import"./index-yBjzXJbu.js";import"./card-ComTj0HN.js";import"./index-CSSP-iJI.js";import"./index-B6ujFmsw.js";import"./empty-state-uDmSVxeh.js";import"./createLucideIcon-DqplzwSp.js";import"./tooltip-CwGHE9xA.js";import"./check-DNs7zX_I.js";import"./index-9lgI2Bnf.js";var Y="rovingFocusGroup.onEntryFocus",yt={bubbles:!1,cancelable:!0},F="RovingFocusGroup",[q,Le,Ct]=ft(F),[wt,Be]=Pe(F,[Ct]),[jt,Et]=wt(F),Oe=s.forwardRef((e,r)=>n.jsx(q.Provider,{scope:e.__scopeRovingFocusGroup,children:n.jsx(q.Slot,{scope:e.__scopeRovingFocusGroup,children:n.jsx(Nt,{...e,ref:r})})}));Oe.displayName=F;var Nt=s.forwardRef((e,r)=>{const{__scopeRovingFocusGroup:t,orientation:a,loop:c=!1,dir:u,currentTabStopId:l,defaultCurrentTabStopId:p,onCurrentTabStopIdChange:x,onEntryFocus:f,preventScrollOnEntryFocus:o=!1,...i}=e,g=s.useRef(null),R=gt(r,g),D=Ae(u),[P,d]=Ve({prop:l,defaultProp:p??null,onChange:x,caller:F}),[v,G]=s.useState(!1),b=bt(f),T=Le(t),z=s.useRef(!1),[at,X]=s.useState(0);return s.useEffect(()=>{const m=g.current;if(m)return m.addEventListener(Y,b),()=>m.removeEventListener(Y,b)},[b]),n.jsx(jt,{scope:t,orientation:a,dir:D,loop:c,currentTabStopId:P,onItemFocus:s.useCallback(m=>d(m),[d]),onItemShiftTab:s.useCallback(()=>G(!0),[]),onFocusableItemAdd:s.useCallback(()=>X(m=>m+1),[]),onFocusableItemRemove:s.useCallback(()=>X(m=>m-1),[]),children:n.jsx(N.div,{tabIndex:v||at===0?-1:0,"data-orientation":a,...i,ref:R,style:{outline:"none",...e.style},onMouseDown:h(e.onMouseDown,()=>{z.current=!0}),onFocus:h(e.onFocus,m=>{const ot=!z.current;if(m.target===m.currentTarget&&ot&&!v){const Z=new CustomEvent(Y,yt);if(m.currentTarget.dispatchEvent(Z),!Z.defaultPrevented){const U=T().filter(C=>C.focusable),st=U.find(C=>C.active),lt=U.find(C=>C.id===P),ct=[st,lt,...U].filter(Boolean).map(C=>C.ref.current);Ge(ct,o)}}z.current=!1}),onBlur:h(e.onBlur,()=>G(!1))})})}),Ke="RovingFocusGroupItem",Me=s.forwardRef((e,r)=>{const{__scopeRovingFocusGroup:t,focusable:a=!0,active:c=!1,tabStopId:u,children:l,...p}=e,x=De(),f=u||x,o=Et(Ke,t),i=o.currentTabStopId===f,g=Le(t),{onFocusableItemAdd:R,onFocusableItemRemove:D,currentTabStopId:P}=o;return s.useEffect(()=>{if(a)return R(),()=>D()},[a,R,D]),n.jsx(q.ItemSlot,{scope:t,id:f,focusable:a,active:c,children:n.jsx(N.span,{tabIndex:i?0:-1,"data-orientation":o.orientation,...p,ref:r,onMouseDown:h(e.onMouseDown,d=>{a?o.onItemFocus(f):d.preventDefault()}),onFocus:h(e.onFocus,()=>o.onItemFocus(f)),onKeyDown:h(e.onKeyDown,d=>{if(d.key==="Tab"&&d.shiftKey){o.onItemShiftTab();return}if(d.target!==d.currentTarget)return;const v=kt(d,o.orientation,o.dir);if(v!==void 0){if(d.metaKey||d.ctrlKey||d.altKey||d.shiftKey)return;d.preventDefault();let b=g().filter(T=>T.focusable).map(T=>T.ref.current);if(v==="last")b.reverse();else if(v==="prev"||v==="next"){v==="prev"&&b.reverse();const T=b.indexOf(d.currentTarget);b=o.loop?_t(b,T+1):b.slice(T+1)}setTimeout(()=>Ge(b))}}),children:typeof l=="function"?l({isCurrentTabStop:i,hasTabStop:P!=null}):l})})});Me.displayName=Ke;var St={ArrowLeft:"prev",ArrowUp:"prev",ArrowRight:"next",ArrowDown:"next",PageUp:"first",Home:"first",PageDown:"last",End:"last"};function It(e,r){return r!=="rtl"?e:e==="ArrowLeft"?"ArrowRight":e==="ArrowRight"?"ArrowLeft":e}function kt(e,r,t){const a=It(e.key,t);if(!(r==="vertical"&&["ArrowLeft","ArrowRight"].includes(a))&&!(r==="horizontal"&&["ArrowUp","ArrowDown"].includes(a)))return St[a]}function Ge(e,r=!1){const t=document.activeElement;for(const a of e)if(a===t||(a.focus({preventScroll:r}),document.activeElement!==t))return}function _t(e,r){return e.map((t,a)=>e[(r+a)%e.length])}var Ft=Oe,Rt=Me,K="Tabs",[Dt]=Pe(K,[Be]),ze=Be(),[Pt,W]=Dt(K),Ue=s.forwardRef((e,r)=>{const{__scopeTabs:t,value:a,onValueChange:c,defaultValue:u,orientation:l="horizontal",dir:p,activationMode:x="automatic",...f}=e,o=Ae(p),[i,g]=Ve({prop:a,onChange:c,defaultProp:u??"",caller:K});return n.jsx(Pt,{scope:t,baseId:De(),value:i,onValueChange:g,orientation:l,dir:o,activationMode:x,children:n.jsx(N.div,{dir:o,"data-orientation":l,...f,ref:r})})});Ue.displayName=K;var He="TabsList",Ye=s.forwardRef((e,r)=>{const{__scopeTabs:t,loop:a=!0,...c}=e,u=W(He,t),l=ze(t);return n.jsx(Ft,{asChild:!0,...l,orientation:u.orientation,dir:u.dir,loop:a,children:n.jsx(N.div,{role:"tablist","aria-orientation":u.orientation,...c,ref:r})})});Ye.displayName=He;var qe="TabsTrigger",Je=s.forwardRef((e,r)=>{const{__scopeTabs:t,value:a,disabled:c=!1,...u}=e,l=W(qe,t),p=ze(t),x=Xe(l.baseId,a),f=Ze(l.baseId,a),o=a===l.value;return n.jsx(Rt,{asChild:!0,...p,focusable:!c,active:o,children:n.jsx(N.button,{type:"button",role:"tab","aria-selected":o,"aria-controls":f,"data-state":o?"active":"inactive","data-disabled":c?"":void 0,disabled:c,id:x,...u,ref:r,onMouseDown:h(e.onMouseDown,i=>{!c&&i.button===0&&i.ctrlKey===!1?l.onValueChange(a):i.preventDefault()}),onKeyDown:h(e.onKeyDown,i=>{[" ","Enter"].includes(i.key)&&l.onValueChange(a)}),onFocus:h(e.onFocus,()=>{const i=l.activationMode!=="manual";!o&&!c&&i&&l.onValueChange(a)})})})});Je.displayName=qe;var Qe="TabsContent",We=s.forwardRef((e,r)=>{const{__scopeTabs:t,value:a,forceMount:c,children:u,...l}=e,p=W(Qe,t),x=Xe(p.baseId,a),f=Ze(p.baseId,a),o=a===p.value,i=s.useRef(o);return s.useEffect(()=>{const g=requestAnimationFrame(()=>i.current=!1);return()=>cancelAnimationFrame(g)},[]),n.jsx(xt,{present:c||o,children:({present:g})=>n.jsx(N.div,{"data-state":o?"active":"inactive","data-orientation":p.orientation,role:"tabpanel","aria-labelledby":x,hidden:!g,id:f,tabIndex:0,...l,ref:r,style:{...e.style,animationDuration:i.current?"0s":void 0},children:g&&u})})});We.displayName=Qe;function Xe(e,r){return`${e}-trigger-${r}`}function Ze(e,r){return`${e}-content-${r}`}var At=Ue,et=Ye,tt=Je,nt=We;const rt=At,M=s.forwardRef(({className:e,...r},t)=>n.jsx(et,{ref:t,className:Q("inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",e),...r}));M.displayName=et.displayName;const w=s.forwardRef(({className:e,...r},t)=>n.jsx(tt,{ref:t,className:Q("inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",e),...r}));w.displayName=tt.displayName;const j=s.forwardRef(({className:e,...r},t)=>n.jsx(nt,{ref:t,className:Q("mt-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",e),...r}));j.displayName=nt.displayName;M.__docgenInfo={description:"",methods:[]};w.__docgenInfo={description:"",methods:[]};j.__docgenInfo={description:"",methods:[]};const an={title:"元件/容器",parameters:{layout:"padded"}},Vt=[{id:"E001",name:"王小明",dept:"研發部",total:68e3},{id:"E002",name:"李美華",dept:"業務部",total:52e3},{id:"E003",name:"陳大文",dept:"行銷部",total:47e3}],B=["研發部","業務部","行銷部","財務部","客服部","品保部"],O=["工程師","資深工程師","業務代表","專員","經理","助理"],$t=Array.from({length:42},(e,r)=>({id:`E${String(r+1).padStart(3,"0")}`,name:`員工${r+1}`,dept:B[r%B.length],title:O[r%O.length],total:3e4+r*3700%18e4,tenure:r*7%130})),A={render:()=>n.jsxs("div",{className:"max-w-3xl space-y-2",children:[n.jsx("p",{className:"text-xs text-muted-foreground",children:"互動：指向儲存格看**十字對準**；表頭最右漏斗做**單欄篩選**（文字＝包含、數字＝範圍）； **拖曳欄位右邊界調整欄寬、雙擊自適應內容**；下方切換**每頁 5/15/30/50**。"}),n.jsx(J,{rows:$t,getRowKey:e=>e.id,searchPlaceholder:"搜尋姓名／部門…",columns:[{key:"name",header:"員工",freeze:!0,sortValue:e=>e.name,filterText:e=>`${e.name} ${e.id}`,cell:e=>n.jsxs(n.Fragment,{children:[n.jsx("span",{className:"font-medium",children:e.name}),n.jsx("span",{className:"ml-1.5 text-xs text-muted-foreground",children:e.id})]})},{key:"dept",header:"部門",sortValue:e=>e.dept,filter:"select",cell:e=>e.dept},{key:"title",header:"職稱",sortValue:e=>e.title,filter:"select",cell:e=>e.title},{key:"tenure",header:"年資（月）",numeric:!0,sortValue:e=>e.tenure,cell:e=>`${e.tenure} 月`},{key:"total",header:"月薪總額",numeric:!0,sortValue:e=>e.total,cell:e=>E(e.total),total:e=>E(e.reduce((r,t)=>r+t.total,0))}]})]})},S={args:{資料筆數:42,每頁筆數:15,搜尋:!0,斑馬紋:!0,緊湊:!1,十字對準:!0,可調欄寬:!0},argTypes:{資料筆數:{control:{type:"range",min:0,max:200,step:1}},每頁筆數:{control:{type:"inline-radio"},options:[5,15,30,50]},搜尋:{control:"boolean"},斑馬紋:{control:"boolean"},緊湊:{control:"boolean"},十字對準:{control:"boolean"},可調欄寬:{control:"boolean"}},render:e=>{const r=Array.from({length:e.資料筆數},(t,a)=>({id:`E${String(a+1).padStart(3,"0")}`,name:`員工${a+1}`,dept:B[a%B.length],title:O[a%O.length],total:3e4+a*3700%18e4,tenure:a*7%130}));return n.jsx("div",{className:"max-w-3xl",children:n.jsx(J,{rows:r,getRowKey:t=>t.id,pageSize:e.每頁筆數,searchable:e.搜尋,zebra:e.斑馬紋,dense:e.緊湊,crosshair:e.十字對準,resizable:e.可調欄寬,empty:{title:"資料筆數＝0（拉右側 Controls 調整）"},columns:[{key:"name",header:"員工",freeze:!0,sortValue:t=>t.name,filterText:t=>`${t.name} ${t.id}`,cell:t=>n.jsxs(n.Fragment,{children:[n.jsx("span",{className:"font-medium",children:t.name}),n.jsx("span",{className:"ml-1.5 text-xs text-muted-foreground",children:t.id})]})},{key:"dept",header:"部門",sortValue:t=>t.dept,filter:"select",cell:t=>t.dept},{key:"title",header:"職稱",sortValue:t=>t.title,filter:"select",cell:t=>t.title},{key:"tenure",header:"年資（月）",numeric:!0,sortValue:t=>t.tenure,cell:t=>`${t.tenure} 月`},{key:"total",header:"月薪總額",numeric:!0,sortValue:t=>t.total,cell:t=>E(t.total),total:t=>E(t.reduce((a,c)=>a+c.total,0))}]})})}},I={render:()=>n.jsx("div",{className:"max-w-2xl",children:n.jsx(J,{rows:Vt,getRowKey:e=>e.id,searchPlaceholder:"搜尋姓名／部門…",columns:[{key:"name",header:"員工",freeze:!0,sortValue:e=>e.name,filterText:e=>`${e.name} ${e.id}`,cell:e=>n.jsxs(n.Fragment,{children:[n.jsx("span",{className:"font-medium",children:e.name}),n.jsx("span",{className:"ml-1.5 text-xs text-muted-foreground",children:e.id})]})},{key:"dept",header:"部門",sortValue:e=>e.dept,cell:e=>e.dept},{key:"total",header:"月薪總額",numeric:!0,sortValue:e=>e.total,cell:e=>E(e.total),total:e=>E(e.reduce((r,t)=>r+t.total,0))}]})})},V={render:()=>n.jsx("div",{className:"max-w-lg",children:n.jsx(Re,{title:"人事成本組成",description:"依項目分段",legend:[{label:"本薪",color:y[0]},{label:"雇主負擔",color:y[1]}],children:n.jsx($e,{rows:[{label:"全公司",segments:[{label:"本薪",value:42e5,color:y[0]},{label:"雇主負擔",value:9e5,color:y[1]}]}]})})})},k={args:{標題:"人事成本組成",說明:"依項目分段",圖表:"堆疊"},argTypes:{標題:{control:"text"},說明:{control:"text"},圖表:{control:"inline-radio",options:["堆疊","長條","柏拉圖"]}},render:e=>{const r=[{label:"研發",value:12e5},{label:"業務",value:86e4},{label:"行銷",value:54e4}];return n.jsx("div",{className:"max-w-lg",children:n.jsx(Re,{title:e.標題,description:e.說明,legend:e.圖表==="堆疊"?[{label:"本薪",color:y[0]},{label:"雇主負擔",color:y[1]}]:void 0,children:e.圖表==="堆疊"?n.jsx($e,{rows:[{label:"全公司",segments:[{label:"本薪",value:42e5,color:y[0]},{label:"雇主負擔",value:9e5,color:y[1]}]}]}):e.圖表==="長條"?n.jsx(vt,{data:r,showValues:!0}):n.jsx(Tt,{data:r})})})}},_={args:{分頁數:3},argTypes:{分頁數:{control:{type:"range",min:2,max:6,step:1}}},render:e=>{const r=Array.from({length:e.分頁數},(t,a)=>String(a));return n.jsxs(rt,{defaultValue:"0",className:"w-[460px]",children:[n.jsx(M,{children:r.map((t,a)=>n.jsxs(w,{value:t,children:["分頁 ",a+1]},t))}),r.map((t,a)=>n.jsxs(j,{value:t,className:"pt-3 text-sm",children:["分頁 ",a+1," 的內容"]},t))]})}},$={render:()=>{const e=()=>{const[r,t]=s.useState(!0);return n.jsxs(n.Fragment,{children:[n.jsx(H,{onClick:()=>t(!0),children:"開啟對話框"}),n.jsx(it,{open:r,onOpenChange:t,children:n.jsxs(dt,{children:[n.jsx(ut,{children:n.jsx(mt,{children:"對話框標題"})}),n.jsx("p",{className:"text-sm text-muted-foreground",children:"置中卡片、自畫面中央縮放彈出（見行動版修正）。"}),n.jsxs(pt,{children:[n.jsx(H,{variant:"outline",onClick:()=>t(!1),children:"取消"}),n.jsx(H,{onClick:()=>t(!1),children:"確定"})]})]})})]})};return n.jsx(e,{})}},L={render:()=>n.jsxs(rt,{defaultValue:"a",className:"w-96",children:[n.jsxs(M,{children:[n.jsx(w,{value:"a",children:"總覽"}),n.jsx(w,{value:"b",children:"明細"}),n.jsx(w,{value:"c",children:"設定"})]}),n.jsxs(j,{value:"a",className:"pt-3 text-sm",children:["總覽內容 ",n.jsx(ht,{variant:"secondary",children:"shadcn Tabs 元件"})]}),n.jsx(j,{value:"b",className:"pt-3 text-sm",children:"明細內容"}),n.jsx(j,{value:"c",className:"pt-3 text-sm",children:"設定內容"})]})};var ee,te,ne;A.parameters={...A.parameters,docs:{...(ee=A.parameters)==null?void 0:ee.docs,source:{originalSource:`{
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
}`,...(ne=(te=A.parameters)==null?void 0:te.docs)==null?void 0:ne.source}}};var re,ae,oe,se,le;S.parameters={...S.parameters,docs:{...(re=S.parameters)==null?void 0:re.docs,source:{originalSource:`{
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
}`,...(oe=(ae=S.parameters)==null?void 0:ae.docs)==null?void 0:oe.source},description:{story:`互動 Playground：用右側 Controls 即時調整**資料筆數**與各項開關（分頁/斑馬紋/緊湊/十字對準/
可調欄寬/搜尋），快速驗證多種狀況——不用改程式碼。`,...(le=(se=S.parameters)==null?void 0:se.docs)==null?void 0:le.description}}};var ce,ie,de,ue,me;I.parameters={...I.parameters,docs:{...(ce=I.parameters)==null?void 0:ce.docs,source:{originalSource:`{
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
}`,...(de=(ie=I.parameters)==null?void 0:ie.docs)==null?void 0:de.source},description:{story:"小資料集（無分頁）：純示範欄位設定與合計列",...(me=(ue=I.parameters)==null?void 0:ue.docs)==null?void 0:me.description}}};var pe,fe,ge;V.parameters={...V.parameters,docs:{...(pe=V.parameters)==null?void 0:pe.docs,source:{originalSource:`{
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
}`,...(ge=(fe=V.parameters)==null?void 0:fe.docs)==null?void 0:ge.source}}};var be,xe,he,ve,Te;k.parameters={...k.parameters,docs:{...(be=k.parameters)==null?void 0:be.docs,source:{originalSource:`{
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
}`,...(he=(xe=k.parameters)==null?void 0:xe.docs)==null?void 0:he.source},description:{story:"互動 Playground：右側 Controls 調整標題/說明/圖表類型。",...(Te=(ve=k.parameters)==null?void 0:ve.docs)==null?void 0:Te.description}}};var ye,Ce,we,je,Ee;_.parameters={..._.parameters,docs:{...(ye=_.parameters)==null?void 0:ye.docs,source:{originalSource:`{
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
}`,...(we=(Ce=_.parameters)==null?void 0:Ce.docs)==null?void 0:we.source},description:{story:"互動 Playground：右側 Controls 調整分頁數量。",...(Ee=(je=_.parameters)==null?void 0:je.docs)==null?void 0:Ee.description}}};var Ne,Se,Ie;$.parameters={...$.parameters,docs:{...(Ne=$.parameters)==null?void 0:Ne.docs,source:{originalSource:`{
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
}`,...(Ie=(Se=$.parameters)==null?void 0:Se.docs)==null?void 0:Ie.source}}};var ke,_e,Fe;L.parameters={...L.parameters,docs:{...(ke=L.parameters)==null?void 0:ke.docs,source:{originalSource:`{
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
}`,...(Fe=(_e=L.parameters)==null?void 0:_e.docs)==null?void 0:Fe.source}}};const on=["資料表_DataTable","互動測試","資料表_精簡","圖表卡_ChartCard","圖表卡_互動","分頁_互動","對話框_Dialog","分頁_Tabs"];export{on as __namedExportsOrder,an as default,S as 互動測試,L as 分頁_Tabs,_ as 分頁_互動,V as 圖表卡_ChartCard,k as 圖表卡_互動,$ as 對話框_Dialog,A as 資料表_DataTable,I as 資料表_精簡};
