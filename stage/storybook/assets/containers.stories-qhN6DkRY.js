import{j as n}from"./jsx-runtime-Cf8x2fCZ.js";import{r as s}from"./index-BO-NyGGJ.js";import{C as qe}from"./chart-card-CzkOJp18.js";import{D as H}from"./data-table-24LqgrV8.js";import{D as Je,a as Qe,b as We,c as Xe,d as Ze}from"./dialog-B46OsyNl.js";import{f as Te,h as w,i as h,j as ye,r as et,k as tt,s as Ce,u as we,t as nt,P as rt}from"./select-D8Pe3zde.js";import{c as Y,n as C}from"./utils-CdvzHgU1.js";import{B as G}from"./button-BpuW6BL2.js";import{B as at}from"./badge-DdjrCzeD.js";import{a as D,S as ot}from"./index-D04uuL-I.js";import"./index-yBjzXJbu.js";import"./card-ComTj0HN.js";import"./index-CSSP-iJI.js";import"./index-B6ujFmsw.js";import"./empty-state-uDmSVxeh.js";import"./createLucideIcon-DqplzwSp.js";import"./tooltip-CwGHE9xA.js";import"./check-DNs7zX_I.js";import"./index-9lgI2Bnf.js";var z="rovingFocusGroup.onEntryFocus",st={bubbles:!1,cancelable:!0},S="RovingFocusGroup",[U,Ie,lt]=et(S),[it,Ne]=ye(S,[lt]),[ct,dt]=it(S),je=s.forwardRef((e,r)=>n.jsx(U.Provider,{scope:e.__scopeRovingFocusGroup,children:n.jsx(U.Slot,{scope:e.__scopeRovingFocusGroup,children:n.jsx(ut,{...e,ref:r})})}));je.displayName=S;var ut=s.forwardRef((e,r)=>{const{__scopeRovingFocusGroup:t,orientation:a,loop:i=!1,dir:u,currentTabStopId:l,defaultCurrentTabStopId:p,onCurrentTabStopIdChange:x,onEntryFocus:f,preventScrollOnEntryFocus:o=!1,...c}=e,g=s.useRef(null),F=tt(r,g),_=Ce(u),[R,d]=we({prop:l,defaultProp:p??null,onChange:x,caller:S}),[v,B]=s.useState(!1),b=nt(f),T=Ie(t),K=s.useRef(!1),[Ge,Q]=s.useState(0);return s.useEffect(()=>{const m=g.current;if(m)return m.addEventListener(z,b),()=>m.removeEventListener(z,b)},[b]),n.jsx(ct,{scope:t,orientation:a,dir:_,loop:i,currentTabStopId:R,onItemFocus:s.useCallback(m=>d(m),[d]),onItemShiftTab:s.useCallback(()=>B(!0),[]),onFocusableItemAdd:s.useCallback(()=>Q(m=>m+1),[]),onFocusableItemRemove:s.useCallback(()=>Q(m=>m-1),[]),children:n.jsx(w.div,{tabIndex:v||Ge===0?-1:0,"data-orientation":a,...c,ref:F,style:{outline:"none",...e.style},onMouseDown:h(e.onMouseDown,()=>{K.current=!0}),onFocus:h(e.onFocus,m=>{const ze=!K.current;if(m.target===m.currentTarget&&ze&&!v){const W=new CustomEvent(z,st);if(m.currentTarget.dispatchEvent(W),!W.defaultPrevented){const M=T().filter(y=>y.focusable),Ue=M.find(y=>y.active),He=M.find(y=>y.id===R),Ye=[Ue,He,...M].filter(Boolean).map(y=>y.ref.current);Fe(Ye,o)}}K.current=!1}),onBlur:h(e.onBlur,()=>B(!1))})})}),Ee="RovingFocusGroupItem",Se=s.forwardRef((e,r)=>{const{__scopeRovingFocusGroup:t,focusable:a=!0,active:i=!1,tabStopId:u,children:l,...p}=e,x=Te(),f=u||x,o=dt(Ee,t),c=o.currentTabStopId===f,g=Ie(t),{onFocusableItemAdd:F,onFocusableItemRemove:_,currentTabStopId:R}=o;return s.useEffect(()=>{if(a)return F(),()=>_()},[a,F,_]),n.jsx(U.ItemSlot,{scope:t,id:f,focusable:a,active:i,children:n.jsx(w.span,{tabIndex:c?0:-1,"data-orientation":o.orientation,...p,ref:r,onMouseDown:h(e.onMouseDown,d=>{a?o.onItemFocus(f):d.preventDefault()}),onFocus:h(e.onFocus,()=>o.onItemFocus(f)),onKeyDown:h(e.onKeyDown,d=>{if(d.key==="Tab"&&d.shiftKey){o.onItemShiftTab();return}if(d.target!==d.currentTarget)return;const v=ft(d,o.orientation,o.dir);if(v!==void 0){if(d.metaKey||d.ctrlKey||d.altKey||d.shiftKey)return;d.preventDefault();let b=g().filter(T=>T.focusable).map(T=>T.ref.current);if(v==="last")b.reverse();else if(v==="prev"||v==="next"){v==="prev"&&b.reverse();const T=b.indexOf(d.currentTarget);b=o.loop?gt(b,T+1):b.slice(T+1)}setTimeout(()=>Fe(b))}}),children:typeof l=="function"?l({isCurrentTabStop:c,hasTabStop:R!=null}):l})})});Se.displayName=Ee;var mt={ArrowLeft:"prev",ArrowUp:"prev",ArrowRight:"next",ArrowDown:"next",PageUp:"first",Home:"first",PageDown:"last",End:"last"};function pt(e,r){return r!=="rtl"?e:e==="ArrowLeft"?"ArrowRight":e==="ArrowRight"?"ArrowLeft":e}function ft(e,r,t){const a=pt(e.key,t);if(!(r==="vertical"&&["ArrowLeft","ArrowRight"].includes(a))&&!(r==="horizontal"&&["ArrowUp","ArrowDown"].includes(a)))return mt[a]}function Fe(e,r=!1){const t=document.activeElement;for(const a of e)if(a===t||(a.focus({preventScroll:r}),document.activeElement!==t))return}function gt(e,r){return e.map((t,a)=>e[(r+a)%e.length])}var bt=je,xt=Se,O="Tabs",[ht]=ye(O,[Ne]),_e=Ne(),[vt,q]=ht(O),Re=s.forwardRef((e,r)=>{const{__scopeTabs:t,value:a,onValueChange:i,defaultValue:u,orientation:l="horizontal",dir:p,activationMode:x="automatic",...f}=e,o=Ce(p),[c,g]=we({prop:a,onChange:i,defaultProp:u??"",caller:O});return n.jsx(vt,{scope:t,baseId:Te(),value:c,onValueChange:g,orientation:l,dir:o,activationMode:x,children:n.jsx(w.div,{dir:o,"data-orientation":l,...f,ref:r})})});Re.displayName=O;var De="TabsList",ke=s.forwardRef((e,r)=>{const{__scopeTabs:t,loop:a=!0,...i}=e,u=q(De,t),l=_e(t);return n.jsx(bt,{asChild:!0,...l,orientation:u.orientation,dir:u.dir,loop:a,children:n.jsx(w.div,{role:"tablist","aria-orientation":u.orientation,...i,ref:r})})});ke.displayName=De;var Ae="TabsTrigger",Pe=s.forwardRef((e,r)=>{const{__scopeTabs:t,value:a,disabled:i=!1,...u}=e,l=q(Ae,t),p=_e(t),x=Le(l.baseId,a),f=Oe(l.baseId,a),o=a===l.value;return n.jsx(xt,{asChild:!0,...p,focusable:!i,active:o,children:n.jsx(w.button,{type:"button",role:"tab","aria-selected":o,"aria-controls":f,"data-state":o?"active":"inactive","data-disabled":i?"":void 0,disabled:i,id:x,...u,ref:r,onMouseDown:h(e.onMouseDown,c=>{!i&&c.button===0&&c.ctrlKey===!1?l.onValueChange(a):c.preventDefault()}),onKeyDown:h(e.onKeyDown,c=>{[" ","Enter"].includes(c.key)&&l.onValueChange(a)}),onFocus:h(e.onFocus,()=>{const c=l.activationMode!=="manual";!o&&!i&&c&&l.onValueChange(a)})})})});Pe.displayName=Ae;var Ve="TabsContent",$e=s.forwardRef((e,r)=>{const{__scopeTabs:t,value:a,forceMount:i,children:u,...l}=e,p=q(Ve,t),x=Le(p.baseId,a),f=Oe(p.baseId,a),o=a===p.value,c=s.useRef(o);return s.useEffect(()=>{const g=requestAnimationFrame(()=>c.current=!1);return()=>cancelAnimationFrame(g)},[]),n.jsx(rt,{present:i||o,children:({present:g})=>n.jsx(w.div,{"data-state":o?"active":"inactive","data-orientation":p.orientation,role:"tabpanel","aria-labelledby":x,hidden:!g,id:f,tabIndex:0,...l,ref:r,style:{...e.style,animationDuration:c.current?"0s":void 0},children:g&&u})})});$e.displayName=Ve;function Le(e,r){return`${e}-trigger-${r}`}function Oe(e,r){return`${e}-content-${r}`}var Tt=Re,Be=ke,Ke=Pe,Me=$e;const yt=Tt,J=s.forwardRef(({className:e,...r},t)=>n.jsx(Be,{ref:t,className:Y("inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",e),...r}));J.displayName=Be.displayName;const j=s.forwardRef(({className:e,...r},t)=>n.jsx(Ke,{ref:t,className:Y("inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",e),...r}));j.displayName=Ke.displayName;const E=s.forwardRef(({className:e,...r},t)=>n.jsx(Me,{ref:t,className:Y("mt-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",e),...r}));E.displayName=Me.displayName;J.__docgenInfo={description:"",methods:[]};j.__docgenInfo={description:"",methods:[]};E.__docgenInfo={description:"",methods:[]};const zt={title:"元件/容器",parameters:{layout:"padded"}},Ct=[{id:"E001",name:"王小明",dept:"研發部",total:68e3},{id:"E002",name:"李美華",dept:"業務部",total:52e3},{id:"E003",name:"陳大文",dept:"行銷部",total:47e3}],$=["研發部","業務部","行銷部","財務部","客服部","品保部"],L=["工程師","資深工程師","業務代表","專員","經理","助理"],wt=Array.from({length:42},(e,r)=>({id:`E${String(r+1).padStart(3,"0")}`,name:`員工${r+1}`,dept:$[r%$.length],title:L[r%L.length],total:3e4+r*3700%18e4,tenure:r*7%130})),k={render:()=>n.jsxs("div",{className:"max-w-3xl space-y-2",children:[n.jsx("p",{className:"text-xs text-muted-foreground",children:"互動：指向儲存格看**十字對準**；表頭最右漏斗做**單欄篩選**（文字＝包含、數字＝範圍）； **拖曳欄位右邊界調整欄寬、雙擊自適應內容**；下方切換**每頁 5/15/30/50**。"}),n.jsx(H,{rows:wt,getRowKey:e=>e.id,searchPlaceholder:"搜尋姓名／部門…",columns:[{key:"name",header:"員工",freeze:!0,sortValue:e=>e.name,filterText:e=>`${e.name} ${e.id}`,cell:e=>n.jsxs(n.Fragment,{children:[n.jsx("span",{className:"font-medium",children:e.name}),n.jsx("span",{className:"ml-1.5 text-xs text-muted-foreground",children:e.id})]})},{key:"dept",header:"部門",sortValue:e=>e.dept,filter:"select",cell:e=>e.dept},{key:"title",header:"職稱",sortValue:e=>e.title,filter:"select",cell:e=>e.title},{key:"tenure",header:"年資（月）",numeric:!0,sortValue:e=>e.tenure,cell:e=>`${e.tenure} 月`},{key:"total",header:"月薪總額",numeric:!0,sortValue:e=>e.total,cell:e=>C(e.total),total:e=>C(e.reduce((r,t)=>r+t.total,0))}]})]})},I={args:{資料筆數:42,每頁筆數:15,搜尋:!0,斑馬紋:!0,緊湊:!1,十字對準:!0,可調欄寬:!0},argTypes:{資料筆數:{control:{type:"range",min:0,max:200,step:1}},每頁筆數:{control:{type:"inline-radio"},options:[5,15,30,50]},搜尋:{control:"boolean"},斑馬紋:{control:"boolean"},緊湊:{control:"boolean"},十字對準:{control:"boolean"},可調欄寬:{control:"boolean"}},render:e=>{const r=Array.from({length:e.資料筆數},(t,a)=>({id:`E${String(a+1).padStart(3,"0")}`,name:`員工${a+1}`,dept:$[a%$.length],title:L[a%L.length],total:3e4+a*3700%18e4,tenure:a*7%130}));return n.jsx("div",{className:"max-w-3xl",children:n.jsx(H,{rows:r,getRowKey:t=>t.id,pageSize:e.每頁筆數,searchable:e.搜尋,zebra:e.斑馬紋,dense:e.緊湊,crosshair:e.十字對準,resizable:e.可調欄寬,empty:{title:"資料筆數＝0（拉右側 Controls 調整）"},columns:[{key:"name",header:"員工",freeze:!0,sortValue:t=>t.name,filterText:t=>`${t.name} ${t.id}`,cell:t=>n.jsxs(n.Fragment,{children:[n.jsx("span",{className:"font-medium",children:t.name}),n.jsx("span",{className:"ml-1.5 text-xs text-muted-foreground",children:t.id})]})},{key:"dept",header:"部門",sortValue:t=>t.dept,filter:"select",cell:t=>t.dept},{key:"title",header:"職稱",sortValue:t=>t.title,filter:"select",cell:t=>t.title},{key:"tenure",header:"年資（月）",numeric:!0,sortValue:t=>t.tenure,cell:t=>`${t.tenure} 月`},{key:"total",header:"月薪總額",numeric:!0,sortValue:t=>t.total,cell:t=>C(t.total),total:t=>C(t.reduce((a,i)=>a+i.total,0))}]})})}},N={render:()=>n.jsx("div",{className:"max-w-2xl",children:n.jsx(H,{rows:Ct,getRowKey:e=>e.id,searchPlaceholder:"搜尋姓名／部門…",columns:[{key:"name",header:"員工",freeze:!0,sortValue:e=>e.name,filterText:e=>`${e.name} ${e.id}`,cell:e=>n.jsxs(n.Fragment,{children:[n.jsx("span",{className:"font-medium",children:e.name}),n.jsx("span",{className:"ml-1.5 text-xs text-muted-foreground",children:e.id})]})},{key:"dept",header:"部門",sortValue:e=>e.dept,cell:e=>e.dept},{key:"total",header:"月薪總額",numeric:!0,sortValue:e=>e.total,cell:e=>C(e.total),total:e=>C(e.reduce((r,t)=>r+t.total,0))}]})})},A={render:()=>n.jsx("div",{className:"max-w-lg",children:n.jsx(qe,{title:"人事成本組成",description:"依項目分段",legend:[{label:"本薪",color:D[0]},{label:"雇主負擔",color:D[1]}],children:n.jsx(ot,{rows:[{label:"全公司",segments:[{label:"本薪",value:42e5,color:D[0]},{label:"雇主負擔",value:9e5,color:D[1]}]}]})})})},P={render:()=>{const e=()=>{const[r,t]=s.useState(!0);return n.jsxs(n.Fragment,{children:[n.jsx(G,{onClick:()=>t(!0),children:"開啟對話框"}),n.jsx(Je,{open:r,onOpenChange:t,children:n.jsxs(Qe,{children:[n.jsx(We,{children:n.jsx(Xe,{children:"對話框標題"})}),n.jsx("p",{className:"text-sm text-muted-foreground",children:"置中卡片、自畫面中央縮放彈出（見行動版修正）。"}),n.jsxs(Ze,{children:[n.jsx(G,{variant:"outline",onClick:()=>t(!1),children:"取消"}),n.jsx(G,{onClick:()=>t(!1),children:"確定"})]})]})})]})};return n.jsx(e,{})}},V={render:()=>n.jsxs(yt,{defaultValue:"a",className:"w-96",children:[n.jsxs(J,{children:[n.jsx(j,{value:"a",children:"總覽"}),n.jsx(j,{value:"b",children:"明細"}),n.jsx(j,{value:"c",children:"設定"})]}),n.jsxs(E,{value:"a",className:"pt-3 text-sm",children:["總覽內容 ",n.jsx(at,{variant:"secondary",children:"shadcn Tabs 元件"})]}),n.jsx(E,{value:"b",className:"pt-3 text-sm",children:"明細內容"}),n.jsx(E,{value:"c",className:"pt-3 text-sm",children:"設定內容"})]})};var X,Z,ee;k.parameters={...k.parameters,docs:{...(X=k.parameters)==null?void 0:X.docs,source:{originalSource:`{
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
}`,...(ee=(Z=k.parameters)==null?void 0:Z.docs)==null?void 0:ee.source}}};var te,ne,re,ae,oe;I.parameters={...I.parameters,docs:{...(te=I.parameters)==null?void 0:te.docs,source:{originalSource:`{
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
}`,...(re=(ne=I.parameters)==null?void 0:ne.docs)==null?void 0:re.source},description:{story:`互動 Playground：用右側 Controls 即時調整**資料筆數**與各項開關（分頁/斑馬紋/緊湊/十字對準/
可調欄寬/搜尋），快速驗證多種狀況——不用改程式碼。`,...(oe=(ae=I.parameters)==null?void 0:ae.docs)==null?void 0:oe.description}}};var se,le,ie,ce,de;N.parameters={...N.parameters,docs:{...(se=N.parameters)==null?void 0:se.docs,source:{originalSource:`{
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
}`,...(ie=(le=N.parameters)==null?void 0:le.docs)==null?void 0:ie.source},description:{story:"小資料集（無分頁）：純示範欄位設定與合計列",...(de=(ce=N.parameters)==null?void 0:ce.docs)==null?void 0:de.description}}};var ue,me,pe;A.parameters={...A.parameters,docs:{...(ue=A.parameters)==null?void 0:ue.docs,source:{originalSource:`{
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
}`,...(pe=(me=A.parameters)==null?void 0:me.docs)==null?void 0:pe.source}}};var fe,ge,be;P.parameters={...P.parameters,docs:{...(fe=P.parameters)==null?void 0:fe.docs,source:{originalSource:`{
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
}`,...(be=(ge=P.parameters)==null?void 0:ge.docs)==null?void 0:be.source}}};var xe,he,ve;V.parameters={...V.parameters,docs:{...(xe=V.parameters)==null?void 0:xe.docs,source:{originalSource:`{
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
}`,...(ve=(he=V.parameters)==null?void 0:he.docs)==null?void 0:ve.source}}};const Ut=["資料表_DataTable","互動測試","資料表_精簡","圖表卡_ChartCard","對話框_Dialog","分頁_Tabs"];export{Ut as __namedExportsOrder,zt as default,I as 互動測試,V as 分頁_Tabs,A as 圖表卡_ChartCard,P as 對話框_Dialog,k as 資料表_DataTable,N as 資料表_精簡};
