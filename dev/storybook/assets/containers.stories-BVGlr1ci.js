import{j as t}from"./jsx-runtime-Cf8x2fCZ.js";import{r as s}from"./index-BO-NyGGJ.js";import{C as Ae}from"./chart-card-C8sFSokV.js";import{D as Pe}from"./data-table-Dn5ktcTk.js";import{D as ke,a as Oe,b as Be,c as Le,d as Me}from"./dialog-Br6svi9n.js";import{f as re,h as I,i as T,j as se,r as Ge,k as Ve,s as ie,u as ce,t as Ke,P as $e}from"./select-D8Pe3zde.js";import{c as V,n as z}from"./utils-CdvzHgU1.js";import{B as L}from"./button-BpuW6BL2.js";import{B as Ue}from"./badge-DdjrCzeD.js";import{P as R,S as He}from"./index-BMdImUm2.js";import"./index-yBjzXJbu.js";import"./card-ComTj0HN.js";import"./createLucideIcon-DqplzwSp.js";import"./empty-state-uDmSVxeh.js";import"./tooltip-CwGHE9xA.js";import"./index-CSSP-iJI.js";import"./index-B6ujFmsw.js";import"./check-DNs7zX_I.js";import"./index-9lgI2Bnf.js";var M="rovingFocusGroup.onEntryFocus",ze={bubbles:!1,cancelable:!0},j="RovingFocusGroup",[G,le,Ye]=Ge(j),[qe,ue]=se(j,[Ye]),[Je,Qe]=qe(j),de=s.forwardRef((e,n)=>t.jsx(G.Provider,{scope:e.__scopeRovingFocusGroup,children:t.jsx(G.Slot,{scope:e.__scopeRovingFocusGroup,children:t.jsx(We,{...e,ref:n})})}));de.displayName=j;var We=s.forwardRef((e,n)=>{const{__scopeRovingFocusGroup:o,orientation:a,loop:u=!1,dir:d,currentTabStopId:i,defaultCurrentTabStopId:f,onCurrentTabStopIdChange:v,onEntryFocus:p,preventScrollOnEntryFocus:r=!1,...c}=e,g=s.useRef(null),y=Ve(n,g),F=ie(d),[N,l]=ce({prop:i,defaultProp:f??null,onChange:v,caller:j}),[x,k]=s.useState(!1),b=Ke(p),h=le(o),O=s.useRef(!1),[Ne,U]=s.useState(0);return s.useEffect(()=>{const m=g.current;if(m)return m.addEventListener(M,b),()=>m.removeEventListener(M,b)},[b]),t.jsx(Je,{scope:o,orientation:a,dir:F,loop:u,currentTabStopId:N,onItemFocus:s.useCallback(m=>l(m),[l]),onItemShiftTab:s.useCallback(()=>k(!0),[]),onFocusableItemAdd:s.useCallback(()=>U(m=>m+1),[]),onFocusableItemRemove:s.useCallback(()=>U(m=>m-1),[]),children:t.jsx(I.div,{tabIndex:x||Ne===0?-1:0,"data-orientation":a,...c,ref:y,style:{outline:"none",...e.style},onMouseDown:T(e.onMouseDown,()=>{O.current=!0}),onFocus:T(e.onFocus,m=>{const Re=!O.current;if(m.target===m.currentTarget&&Re&&!x){const H=new CustomEvent(M,ze);if(m.currentTarget.dispatchEvent(H),!H.defaultPrevented){const B=h().filter(C=>C.focusable),_e=B.find(C=>C.active),De=B.find(C=>C.id===N),Se=[_e,De,...B].filter(Boolean).map(C=>C.ref.current);pe(Se,r)}}O.current=!1}),onBlur:T(e.onBlur,()=>k(!1))})})}),me="RovingFocusGroupItem",fe=s.forwardRef((e,n)=>{const{__scopeRovingFocusGroup:o,focusable:a=!0,active:u=!1,tabStopId:d,children:i,...f}=e,v=re(),p=d||v,r=Qe(me,o),c=r.currentTabStopId===p,g=le(o),{onFocusableItemAdd:y,onFocusableItemRemove:F,currentTabStopId:N}=r;return s.useEffect(()=>{if(a)return y(),()=>F()},[a,y,F]),t.jsx(G.ItemSlot,{scope:o,id:p,focusable:a,active:u,children:t.jsx(I.span,{tabIndex:c?0:-1,"data-orientation":r.orientation,...f,ref:n,onMouseDown:T(e.onMouseDown,l=>{a?r.onItemFocus(p):l.preventDefault()}),onFocus:T(e.onFocus,()=>r.onItemFocus(p)),onKeyDown:T(e.onKeyDown,l=>{if(l.key==="Tab"&&l.shiftKey){r.onItemShiftTab();return}if(l.target!==l.currentTarget)return;const x=et(l,r.orientation,r.dir);if(x!==void 0){if(l.metaKey||l.ctrlKey||l.altKey||l.shiftKey)return;l.preventDefault();let b=g().filter(h=>h.focusable).map(h=>h.ref.current);if(x==="last")b.reverse();else if(x==="prev"||x==="next"){x==="prev"&&b.reverse();const h=b.indexOf(l.currentTarget);b=r.loop?tt(b,h+1):b.slice(h+1)}setTimeout(()=>pe(b))}}),children:typeof i=="function"?i({isCurrentTabStop:c,hasTabStop:N!=null}):i})})});fe.displayName=me;var Xe={ArrowLeft:"prev",ArrowUp:"prev",ArrowRight:"next",ArrowDown:"next",PageUp:"first",Home:"first",PageDown:"last",End:"last"};function Ze(e,n){return n!=="rtl"?e:e==="ArrowLeft"?"ArrowRight":e==="ArrowRight"?"ArrowLeft":e}function et(e,n,o){const a=Ze(e.key,o);if(!(n==="vertical"&&["ArrowLeft","ArrowRight"].includes(a))&&!(n==="horizontal"&&["ArrowUp","ArrowDown"].includes(a)))return Xe[a]}function pe(e,n=!1){const o=document.activeElement;for(const a of e)if(a===o||(a.focus({preventScroll:n}),document.activeElement!==o))return}function tt(e,n){return e.map((o,a)=>e[(n+a)%e.length])}var nt=de,ot=fe,P="Tabs",[at]=se(P,[ue]),ge=ue(),[rt,K]=at(P),be=s.forwardRef((e,n)=>{const{__scopeTabs:o,value:a,onValueChange:u,defaultValue:d,orientation:i="horizontal",dir:f,activationMode:v="automatic",...p}=e,r=ie(f),[c,g]=ce({prop:a,onChange:u,defaultProp:d??"",caller:P});return t.jsx(rt,{scope:o,baseId:re(),value:c,onValueChange:g,orientation:i,dir:r,activationMode:v,children:t.jsx(I.div,{dir:r,"data-orientation":i,...p,ref:n})})});be.displayName=P;var ve="TabsList",Te=s.forwardRef((e,n)=>{const{__scopeTabs:o,loop:a=!0,...u}=e,d=K(ve,o),i=ge(o);return t.jsx(nt,{asChild:!0,...i,orientation:d.orientation,dir:d.dir,loop:a,children:t.jsx(I.div,{role:"tablist","aria-orientation":d.orientation,...u,ref:n})})});Te.displayName=ve;var xe="TabsTrigger",he=s.forwardRef((e,n)=>{const{__scopeTabs:o,value:a,disabled:u=!1,...d}=e,i=K(xe,o),f=ge(o),v=we(i.baseId,a),p=Ee(i.baseId,a),r=a===i.value;return t.jsx(ot,{asChild:!0,...f,focusable:!u,active:r,children:t.jsx(I.button,{type:"button",role:"tab","aria-selected":r,"aria-controls":p,"data-state":r?"active":"inactive","data-disabled":u?"":void 0,disabled:u,id:v,...d,ref:n,onMouseDown:T(e.onMouseDown,c=>{!u&&c.button===0&&c.ctrlKey===!1?i.onValueChange(a):c.preventDefault()}),onKeyDown:T(e.onKeyDown,c=>{[" ","Enter"].includes(c.key)&&i.onValueChange(a)}),onFocus:T(e.onFocus,()=>{const c=i.activationMode!=="manual";!r&&!u&&c&&i.onValueChange(a)})})})});he.displayName=xe;var Ce="TabsContent",Ie=s.forwardRef((e,n)=>{const{__scopeTabs:o,value:a,forceMount:u,children:d,...i}=e,f=K(Ce,o),v=we(f.baseId,a),p=Ee(f.baseId,a),r=a===f.value,c=s.useRef(r);return s.useEffect(()=>{const g=requestAnimationFrame(()=>c.current=!1);return()=>cancelAnimationFrame(g)},[]),t.jsx($e,{present:u||r,children:({present:g})=>t.jsx(I.div,{"data-state":r?"active":"inactive","data-orientation":f.orientation,role:"tabpanel","aria-labelledby":v,hidden:!g,id:p,tabIndex:0,...i,ref:n,style:{...e.style,animationDuration:c.current?"0s":void 0},children:g&&d})})});Ie.displayName=Ce;function we(e,n){return`${e}-trigger-${n}`}function Ee(e,n){return`${e}-content-${n}`}var st=be,je=Te,ye=he,Fe=Ie;const it=st,$=s.forwardRef(({className:e,...n},o)=>t.jsx(je,{ref:o,className:V("inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",e),...n}));$.displayName=je.displayName;const w=s.forwardRef(({className:e,...n},o)=>t.jsx(ye,{ref:o,className:V("inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",e),...n}));w.displayName=ye.displayName;const E=s.forwardRef(({className:e,...n},o)=>t.jsx(Fe,{ref:o,className:V("mt-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",e),...n}));E.displayName=Fe.displayName;$.__docgenInfo={description:"",methods:[]};w.__docgenInfo={description:"",methods:[]};E.__docgenInfo={description:"",methods:[]};const Rt={title:"元件/容器",parameters:{layout:"padded"}},ct=[{id:"E001",name:"王小明",dept:"研發部",total:68e3},{id:"E002",name:"李美華",dept:"業務部",total:52e3},{id:"E003",name:"陳大文",dept:"行銷部",total:47e3}],_={render:()=>t.jsx("div",{className:"max-w-2xl",children:t.jsx(Pe,{rows:ct,getRowKey:e=>e.id,searchPlaceholder:"搜尋姓名／部門…",columns:[{key:"name",header:"員工",freeze:!0,sortValue:e=>e.name,filterText:e=>`${e.name} ${e.id}`,cell:e=>t.jsxs(t.Fragment,{children:[t.jsx("span",{className:"font-medium",children:e.name}),t.jsx("span",{className:"ml-1.5 text-xs text-muted-foreground",children:e.id})]})},{key:"dept",header:"部門",sortValue:e=>e.dept,cell:e=>e.dept},{key:"total",header:"月薪總額",numeric:!0,sortValue:e=>e.total,cell:e=>z(e.total),total:e=>z(e.reduce((n,o)=>n+o.total,0))}]})})},D={render:()=>t.jsx("div",{className:"max-w-lg",children:t.jsx(Ae,{title:"人事成本組成",description:"依項目分段",legend:[{label:"本薪",color:R[0]},{label:"雇主負擔",color:R[1]}],children:t.jsx(He,{rows:[{label:"全公司",segments:[{label:"本薪",value:42e5,color:R[0]},{label:"雇主負擔",value:9e5,color:R[1]}]}]})})})},S={render:()=>{const e=()=>{const[n,o]=s.useState(!0);return t.jsxs(t.Fragment,{children:[t.jsx(L,{onClick:()=>o(!0),children:"開啟對話框"}),t.jsx(ke,{open:n,onOpenChange:o,children:t.jsxs(Oe,{children:[t.jsx(Be,{children:t.jsx(Le,{children:"對話框標題"})}),t.jsx("p",{className:"text-sm text-muted-foreground",children:"置中卡片、自畫面中央縮放彈出（見行動版修正）。"}),t.jsxs(Me,{children:[t.jsx(L,{variant:"outline",onClick:()=>o(!1),children:"取消"}),t.jsx(L,{onClick:()=>o(!1),children:"確定"})]})]})})]})};return t.jsx(e,{})}},A={render:()=>t.jsxs(it,{defaultValue:"a",className:"w-96",children:[t.jsxs($,{children:[t.jsx(w,{value:"a",children:"總覽"}),t.jsx(w,{value:"b",children:"明細"}),t.jsx(w,{value:"c",children:"設定"})]}),t.jsxs(E,{value:"a",className:"pt-3 text-sm",children:["總覽內容 ",t.jsx(Ue,{variant:"secondary",children:"shadcn Tabs 元件"})]}),t.jsx(E,{value:"b",className:"pt-3 text-sm",children:"明細內容"}),t.jsx(E,{value:"c",className:"pt-3 text-sm",children:"設定內容"})]})};var Y,q,J;_.parameters={..._.parameters,docs:{...(Y=_.parameters)==null?void 0:Y.docs,source:{originalSource:`{
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
}`,...(J=(q=_.parameters)==null?void 0:q.docs)==null?void 0:J.source}}};var Q,W,X;D.parameters={...D.parameters,docs:{...(Q=D.parameters)==null?void 0:Q.docs,source:{originalSource:`{
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
}`,...(X=(W=D.parameters)==null?void 0:W.docs)==null?void 0:X.source}}};var Z,ee,te;S.parameters={...S.parameters,docs:{...(Z=S.parameters)==null?void 0:Z.docs,source:{originalSource:`{
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
}`,...(te=(ee=S.parameters)==null?void 0:ee.docs)==null?void 0:te.source}}};var ne,oe,ae;A.parameters={...A.parameters,docs:{...(ne=A.parameters)==null?void 0:ne.docs,source:{originalSource:`{
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
}`,...(ae=(oe=A.parameters)==null?void 0:oe.docs)==null?void 0:ae.source}}};const _t=["資料表_DataTable","圖表卡_ChartCard","對話框_Dialog","分頁_Tabs"];export{_t as __namedExportsOrder,Rt as default,A as 分頁_Tabs,D as 圖表卡_ChartCard,S as 對話框_Dialog,_ as 資料表_DataTable};
