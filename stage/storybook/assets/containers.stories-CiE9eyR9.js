import{j as t}from"./jsx-runtime-Cf8x2fCZ.js";import{r as s}from"./index-BO-NyGGJ.js";import{C as Ge}from"./chart-card-C8sFSokV.js";import{D as pe}from"./data-table-BXWWIED2.js";import{D as Ke,a as Ue,b as ze,c as He,d as Ye}from"./dialog-DWV7ajH2.js";import{f as fe,h as y,i as x,j as ge,r as qe,k as Je,s as be,u as ve,t as Qe,P as We}from"./select-D8Pe3zde.js";import{c as K,n as P}from"./utils-CdvzHgU1.js";import{B as $}from"./button-BpuW6BL2.js";import{B as Xe}from"./badge-DdjrCzeD.js";import{P as R,S as Ze}from"./index-BMdImUm2.js";import"./index-yBjzXJbu.js";import"./card-ComTj0HN.js";import"./index-CSSP-iJI.js";import"./index-B6ujFmsw.js";import"./empty-state-uDmSVxeh.js";import"./createLucideIcon-DqplzwSp.js";import"./tooltip-CwGHE9xA.js";import"./check-DNs7zX_I.js";import"./index-9lgI2Bnf.js";var M="rovingFocusGroup.onEntryFocus",et={bubbles:!1,cancelable:!0},N="RovingFocusGroup",[G,xe,tt]=qe(N),[rt,he]=ge(N,[tt]),[nt,at]=rt(N),Te=s.forwardRef((e,r)=>t.jsx(G.Provider,{scope:e.__scopeRovingFocusGroup,children:t.jsx(G.Slot,{scope:e.__scopeRovingFocusGroup,children:t.jsx(ot,{...e,ref:r})})}));Te.displayName=N;var ot=s.forwardRef((e,r)=>{const{__scopeRovingFocusGroup:n,orientation:a,loop:d=!1,dir:u,currentTabStopId:l,defaultCurrentTabStopId:p,onCurrentTabStopIdChange:v,onEntryFocus:f,preventScrollOnEntryFocus:o=!1,...i}=e,g=s.useRef(null),E=Je(r,g),F=be(u),[_,c]=ve({prop:l,defaultProp:p??null,onChange:v,caller:N}),[h,O]=s.useState(!1),b=Qe(f),T=xe(n),B=s.useRef(!1),[Oe,H]=s.useState(0);return s.useEffect(()=>{const m=g.current;if(m)return m.addEventListener(M,b),()=>m.removeEventListener(M,b)},[b]),t.jsx(nt,{scope:n,orientation:a,dir:F,loop:d,currentTabStopId:_,onItemFocus:s.useCallback(m=>c(m),[c]),onItemShiftTab:s.useCallback(()=>O(!0),[]),onFocusableItemAdd:s.useCallback(()=>H(m=>m+1),[]),onFocusableItemRemove:s.useCallback(()=>H(m=>m-1),[]),children:t.jsx(y.div,{tabIndex:h||Oe===0?-1:0,"data-orientation":a,...i,ref:E,style:{outline:"none",...e.style},onMouseDown:x(e.onMouseDown,()=>{B.current=!0}),onFocus:x(e.onFocus,m=>{const Be=!B.current;if(m.target===m.currentTarget&&Be&&!h){const Y=new CustomEvent(M,et);if(m.currentTarget.dispatchEvent(Y),!Y.defaultPrevented){const L=T().filter(C=>C.focusable),Le=L.find(C=>C.active),$e=L.find(C=>C.id===_),Me=[Le,$e,...L].filter(Boolean).map(C=>C.ref.current);Ie(Me,o)}}B.current=!1}),onBlur:x(e.onBlur,()=>O(!1))})})}),Ce="RovingFocusGroupItem",ye=s.forwardRef((e,r)=>{const{__scopeRovingFocusGroup:n,focusable:a=!0,active:d=!1,tabStopId:u,children:l,...p}=e,v=fe(),f=u||v,o=at(Ce,n),i=o.currentTabStopId===f,g=xe(n),{onFocusableItemAdd:E,onFocusableItemRemove:F,currentTabStopId:_}=o;return s.useEffect(()=>{if(a)return E(),()=>F()},[a,E,F]),t.jsx(G.ItemSlot,{scope:n,id:f,focusable:a,active:d,children:t.jsx(y.span,{tabIndex:i?0:-1,"data-orientation":o.orientation,...p,ref:r,onMouseDown:x(e.onMouseDown,c=>{a?o.onItemFocus(f):c.preventDefault()}),onFocus:x(e.onFocus,()=>o.onItemFocus(f)),onKeyDown:x(e.onKeyDown,c=>{if(c.key==="Tab"&&c.shiftKey){o.onItemShiftTab();return}if(c.target!==c.currentTarget)return;const h=it(c,o.orientation,o.dir);if(h!==void 0){if(c.metaKey||c.ctrlKey||c.altKey||c.shiftKey)return;c.preventDefault();let b=g().filter(T=>T.focusable).map(T=>T.ref.current);if(h==="last")b.reverse();else if(h==="prev"||h==="next"){h==="prev"&&b.reverse();const T=b.indexOf(c.currentTarget);b=o.loop?ct(b,T+1):b.slice(T+1)}setTimeout(()=>Ie(b))}}),children:typeof l=="function"?l({isCurrentTabStop:i,hasTabStop:_!=null}):l})})});ye.displayName=Ce;var st={ArrowLeft:"prev",ArrowUp:"prev",ArrowRight:"next",ArrowDown:"next",PageUp:"first",Home:"first",PageDown:"last",End:"last"};function lt(e,r){return r!=="rtl"?e:e==="ArrowLeft"?"ArrowRight":e==="ArrowRight"?"ArrowLeft":e}function it(e,r,n){const a=lt(e.key,n);if(!(r==="vertical"&&["ArrowLeft","ArrowRight"].includes(a))&&!(r==="horizontal"&&["ArrowUp","ArrowDown"].includes(a)))return st[a]}function Ie(e,r=!1){const n=document.activeElement;for(const a of e)if(a===n||(a.focus({preventScroll:r}),document.activeElement!==n))return}function ct(e,r){return e.map((n,a)=>e[(r+a)%e.length])}var dt=Te,ut=ye,V="Tabs",[mt]=ge(V,[he]),we=he(),[pt,U]=mt(V),je=s.forwardRef((e,r)=>{const{__scopeTabs:n,value:a,onValueChange:d,defaultValue:u,orientation:l="horizontal",dir:p,activationMode:v="automatic",...f}=e,o=be(p),[i,g]=ve({prop:a,onChange:d,defaultProp:u??"",caller:V});return t.jsx(pt,{scope:n,baseId:fe(),value:i,onValueChange:g,orientation:l,dir:o,activationMode:v,children:t.jsx(y.div,{dir:o,"data-orientation":l,...f,ref:r})})});je.displayName=V;var Ne="TabsList",Ee=s.forwardRef((e,r)=>{const{__scopeTabs:n,loop:a=!0,...d}=e,u=U(Ne,n),l=we(n);return t.jsx(dt,{asChild:!0,...l,orientation:u.orientation,dir:u.dir,loop:a,children:t.jsx(y.div,{role:"tablist","aria-orientation":u.orientation,...d,ref:r})})});Ee.displayName=Ne;var Fe="TabsTrigger",_e=s.forwardRef((e,r)=>{const{__scopeTabs:n,value:a,disabled:d=!1,...u}=e,l=U(Fe,n),p=we(n),v=Se(l.baseId,a),f=ke(l.baseId,a),o=a===l.value;return t.jsx(ut,{asChild:!0,...p,focusable:!d,active:o,children:t.jsx(y.button,{type:"button",role:"tab","aria-selected":o,"aria-controls":f,"data-state":o?"active":"inactive","data-disabled":d?"":void 0,disabled:d,id:v,...u,ref:r,onMouseDown:x(e.onMouseDown,i=>{!d&&i.button===0&&i.ctrlKey===!1?l.onValueChange(a):i.preventDefault()}),onKeyDown:x(e.onKeyDown,i=>{[" ","Enter"].includes(i.key)&&l.onValueChange(a)}),onFocus:x(e.onFocus,()=>{const i=l.activationMode!=="manual";!o&&!d&&i&&l.onValueChange(a)})})})});_e.displayName=Fe;var Re="TabsContent",De=s.forwardRef((e,r)=>{const{__scopeTabs:n,value:a,forceMount:d,children:u,...l}=e,p=U(Re,n),v=Se(p.baseId,a),f=ke(p.baseId,a),o=a===p.value,i=s.useRef(o);return s.useEffect(()=>{const g=requestAnimationFrame(()=>i.current=!1);return()=>cancelAnimationFrame(g)},[]),t.jsx(We,{present:d||o,children:({present:g})=>t.jsx(y.div,{"data-state":o?"active":"inactive","data-orientation":p.orientation,role:"tabpanel","aria-labelledby":v,hidden:!g,id:f,tabIndex:0,...l,ref:r,style:{...e.style,animationDuration:i.current?"0s":void 0},children:g&&u})})});De.displayName=Re;function Se(e,r){return`${e}-trigger-${r}`}function ke(e,r){return`${e}-content-${r}`}var ft=je,Ae=Ee,Pe=_e,Ve=De;const gt=ft,z=s.forwardRef(({className:e,...r},n)=>t.jsx(Ae,{ref:n,className:K("inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",e),...r}));z.displayName=Ae.displayName;const w=s.forwardRef(({className:e,...r},n)=>t.jsx(Pe,{ref:n,className:K("inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",e),...r}));w.displayName=Pe.displayName;const j=s.forwardRef(({className:e,...r},n)=>t.jsx(Ve,{ref:n,className:K("mt-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",e),...r}));j.displayName=Ve.displayName;z.__docgenInfo={description:"",methods:[]};w.__docgenInfo={description:"",methods:[]};j.__docgenInfo={description:"",methods:[]};const Bt={title:"元件/容器",parameters:{layout:"padded"}},bt=[{id:"E001",name:"王小明",dept:"研發部",total:68e3},{id:"E002",name:"李美華",dept:"業務部",total:52e3},{id:"E003",name:"陳大文",dept:"行銷部",total:47e3}],q=["研發部","業務部","行銷部","財務部","客服部","品保部"],J=["工程師","資深工程師","業務代表","專員","經理","助理"],vt=Array.from({length:42},(e,r)=>({id:`E${String(r+1).padStart(3,"0")}`,name:`員工${r+1}`,dept:q[r%q.length],title:J[r%J.length],total:3e4+r*3700%18e4,tenure:r*7%130})),D={render:()=>t.jsxs("div",{className:"max-w-3xl space-y-2",children:[t.jsx("p",{className:"text-xs text-muted-foreground",children:"互動：指向儲存格看**十字對準**；表頭最右漏斗做**單欄篩選**（文字＝包含、數字＝範圍）； **拖曳欄位右邊界調整欄寬、雙擊自適應內容**；下方切換**每頁 5/15/30/50**。"}),t.jsx(pe,{rows:vt,getRowKey:e=>e.id,searchPlaceholder:"搜尋姓名／部門…",columns:[{key:"name",header:"員工",freeze:!0,sortValue:e=>e.name,filterText:e=>`${e.name} ${e.id}`,cell:e=>t.jsxs(t.Fragment,{children:[t.jsx("span",{className:"font-medium",children:e.name}),t.jsx("span",{className:"ml-1.5 text-xs text-muted-foreground",children:e.id})]})},{key:"dept",header:"部門",sortValue:e=>e.dept,cell:e=>e.dept},{key:"title",header:"職稱",sortValue:e=>e.title,cell:e=>e.title},{key:"tenure",header:"年資（月）",numeric:!0,sortValue:e=>e.tenure,cell:e=>`${e.tenure} 月`},{key:"total",header:"月薪總額",numeric:!0,sortValue:e=>e.total,cell:e=>P(e.total),total:e=>P(e.reduce((r,n)=>r+n.total,0))}]})]})},I={render:()=>t.jsx("div",{className:"max-w-2xl",children:t.jsx(pe,{rows:bt,getRowKey:e=>e.id,searchPlaceholder:"搜尋姓名／部門…",columns:[{key:"name",header:"員工",freeze:!0,sortValue:e=>e.name,filterText:e=>`${e.name} ${e.id}`,cell:e=>t.jsxs(t.Fragment,{children:[t.jsx("span",{className:"font-medium",children:e.name}),t.jsx("span",{className:"ml-1.5 text-xs text-muted-foreground",children:e.id})]})},{key:"dept",header:"部門",sortValue:e=>e.dept,cell:e=>e.dept},{key:"total",header:"月薪總額",numeric:!0,sortValue:e=>e.total,cell:e=>P(e.total),total:e=>P(e.reduce((r,n)=>r+n.total,0))}]})})},S={render:()=>t.jsx("div",{className:"max-w-lg",children:t.jsx(Ge,{title:"人事成本組成",description:"依項目分段",legend:[{label:"本薪",color:R[0]},{label:"雇主負擔",color:R[1]}],children:t.jsx(Ze,{rows:[{label:"全公司",segments:[{label:"本薪",value:42e5,color:R[0]},{label:"雇主負擔",value:9e5,color:R[1]}]}]})})})},k={render:()=>{const e=()=>{const[r,n]=s.useState(!0);return t.jsxs(t.Fragment,{children:[t.jsx($,{onClick:()=>n(!0),children:"開啟對話框"}),t.jsx(Ke,{open:r,onOpenChange:n,children:t.jsxs(Ue,{children:[t.jsx(ze,{children:t.jsx(He,{children:"對話框標題"})}),t.jsx("p",{className:"text-sm text-muted-foreground",children:"置中卡片、自畫面中央縮放彈出（見行動版修正）。"}),t.jsxs(Ye,{children:[t.jsx($,{variant:"outline",onClick:()=>n(!1),children:"取消"}),t.jsx($,{onClick:()=>n(!1),children:"確定"})]})]})})]})};return t.jsx(e,{})}},A={render:()=>t.jsxs(gt,{defaultValue:"a",className:"w-96",children:[t.jsxs(z,{children:[t.jsx(w,{value:"a",children:"總覽"}),t.jsx(w,{value:"b",children:"明細"}),t.jsx(w,{value:"c",children:"設定"})]}),t.jsxs(j,{value:"a",className:"pt-3 text-sm",children:["總覽內容 ",t.jsx(Xe,{variant:"secondary",children:"shadcn Tabs 元件"})]}),t.jsx(j,{value:"b",className:"pt-3 text-sm",children:"明細內容"}),t.jsx(j,{value:"c",className:"pt-3 text-sm",children:"設定內容"})]})};var Q,W,X;D.parameters={...D.parameters,docs:{...(Q=D.parameters)==null?void 0:Q.docs,source:{originalSource:`{
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
      cell: r => r.dept
    }, {
      key: "title",
      header: "職稱",
      sortValue: r => r.title,
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
}`,...(X=(W=D.parameters)==null?void 0:W.docs)==null?void 0:X.source}}};var Z,ee,te,re,ne;I.parameters={...I.parameters,docs:{...(Z=I.parameters)==null?void 0:Z.docs,source:{originalSource:`{
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
}`,...(te=(ee=I.parameters)==null?void 0:ee.docs)==null?void 0:te.source},description:{story:"小資料集（無分頁）：純示範欄位設定與合計列",...(ne=(re=I.parameters)==null?void 0:re.docs)==null?void 0:ne.description}}};var ae,oe,se;S.parameters={...S.parameters,docs:{...(ae=S.parameters)==null?void 0:ae.docs,source:{originalSource:`{
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
}`,...(se=(oe=S.parameters)==null?void 0:oe.docs)==null?void 0:se.source}}};var le,ie,ce;k.parameters={...k.parameters,docs:{...(le=k.parameters)==null?void 0:le.docs,source:{originalSource:`{
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
}`,...(ce=(ie=k.parameters)==null?void 0:ie.docs)==null?void 0:ce.source}}};var de,ue,me;A.parameters={...A.parameters,docs:{...(de=A.parameters)==null?void 0:de.docs,source:{originalSource:`{
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
}`,...(me=(ue=A.parameters)==null?void 0:ue.docs)==null?void 0:me.source}}};const Lt=["資料表_DataTable","資料表_精簡","圖表卡_ChartCard","對話框_Dialog","分頁_Tabs"];export{Lt as __namedExportsOrder,Bt as default,A as 分頁_Tabs,S as 圖表卡_ChartCard,k as 對話框_Dialog,D as 資料表_DataTable,I as 資料表_精簡};
