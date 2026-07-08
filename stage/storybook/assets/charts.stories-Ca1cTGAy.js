import{j as e}from"./jsx-runtime-Cf8x2fCZ.js";import{L as F,P as a,S as G,B as I,a as J,b as K,c as M,H as Q,T as U,d as W}from"./index-BMdImUm2.js";import"./index-yBjzXJbu.js";import"./index-BO-NyGGJ.js";import"./utils-CdvzHgU1.js";const se={title:"元件/圖表",parameters:{layout:"padded"}},q=[{label:"研發部",value:12e5},{label:"業務部",value:86e4},{label:"行銷部",value:54e4},{label:"管理部",value:42e4},{label:"客服部",value:26e4}],X=["1月","2月","3月","4月","5月","6月"].map((r,i)=>({label:r,value:48e5+i*12e4})),s={render:()=>e.jsx("div",{className:"w-[420px]",children:e.jsx(G,{rows:[{label:"研發部",segments:[{label:"本薪",value:8e5,color:a[0]},{label:"雇主負擔",value:4e5,color:a[1]}]},{label:"業務部",segments:[{label:"本薪",value:56e4,color:a[0]},{label:"雇主負擔",value:3e5,color:a[1]}]}]})})},l={render:()=>e.jsx("div",{className:"w-[420px]",children:e.jsx(M,{data:q})})},n={render:()=>e.jsx("div",{className:"w-[420px]",children:e.jsx(U,{data:X})})},o={render:()=>e.jsx("div",{className:"w-[420px]",children:e.jsx(I,{label:"年度預算 vs 實際",value:54e5,target:6e6})})},t={render:()=>e.jsx("div",{className:"w-[420px]",children:e.jsx(W,{data:q,showValues:!0})})},c={render:()=>e.jsx("div",{className:"w-[320px]",children:e.jsx(J,{diagonal:!0,points:[0,.15,.35,.6,1].map((r,i,z)=>({x:i/(z.length-1),y:r}))})})},d={render:()=>e.jsx("div",{className:"w-[420px]",children:e.jsx(K,{xLabel:"年資（月）",yLabel:"月薪",points:[{x:12,y:38e3,label:"A"},{x:36,y:52e3,label:"B"},{x:60,y:68e3,label:"C"},{x:120,y:95e3,label:"D"}]})})},m={render:()=>e.jsx(F,{items:[{label:"本薪",color:a[0]},{label:"加給",color:a[1]},{label:"雇主負擔",color:a[5]}]})},p={render:()=>e.jsx("div",{className:"w-[420px]",children:e.jsx(Q,{rowLabels:["研發部","業務部","行銷部"],colLabels:["A 案","B 案","C 案"],cells:[[40,20,10],[10,50,15],[5,10,35]],fmt:r=>`${r}h`})})};var u,x,b;s.parameters={...s.parameters,docs:{...(u=s.parameters)==null?void 0:u.docs,source:{originalSource:`{
  render: () => <div className="w-[420px]">
      <StackedBar rows={[{
      label: "研發部",
      segments: [{
        label: "本薪",
        value: 800000,
        color: PALETTE[0]
      }, {
        label: "雇主負擔",
        value: 400000,
        color: PALETTE[1]
      }]
    }, {
      label: "業務部",
      segments: [{
        label: "本薪",
        value: 560000,
        color: PALETTE[0]
      }, {
        label: "雇主負擔",
        value: 300000,
        color: PALETTE[1]
      }]
    }]} />
    </div>
}`,...(b=(x=s.parameters)==null?void 0:x.docs)==null?void 0:b.source}}};var v,h,L;l.parameters={...l.parameters,docs:{...(v=l.parameters)==null?void 0:v.docs,source:{originalSource:`{
  render: () => <div className="w-[420px]"><Pareto data={bars} /></div>
}`,...(L=(h=l.parameters)==null?void 0:h.docs)==null?void 0:L.source}}};var _,g,w;n.parameters={...n.parameters,docs:{...(_=n.parameters)==null?void 0:_.docs,source:{originalSource:`{
  render: () => <div className="w-[420px]"><TrendChart data={trend} /></div>
}`,...(w=(g=n.parameters)==null?void 0:g.docs)==null?void 0:w.source}}};var T,j,E;o.parameters={...o.parameters,docs:{...(T=o.parameters)==null?void 0:T.docs,source:{originalSource:`{
  render: () => <div className="w-[420px]"><Bullet label="年度預算 vs 實際" value={5_400_000} target={6_000_000} /></div>
}`,...(E=(j=o.parameters)==null?void 0:j.docs)==null?void 0:E.source}}};var S,B,C;t.parameters={...t.parameters,docs:{...(S=t.parameters)==null?void 0:S.docs,source:{originalSource:`{
  render: () => <div className="w-[420px]"><BarChart data={bars} showValues /></div>
}`,...(C=(B=t.parameters)==null?void 0:B.docs)==null?void 0:C.source}}};var N,y,P;c.parameters={...c.parameters,docs:{...(N=c.parameters)==null?void 0:N.docs,source:{originalSource:`{
  render: () => <div className="w-[320px]">
      <LineChart diagonal points={[0, 0.15, 0.35, 0.6, 1].map((p, i, a) => ({
      x: i / (a.length - 1),
      y: p
    }))} />
    </div>
}`,...(P=(y=c.parameters)==null?void 0:y.docs)==null?void 0:P.source}}};var A,f,H;d.parameters={...d.parameters,docs:{...(A=d.parameters)==null?void 0:A.docs,source:{originalSource:`{
  render: () => <div className="w-[420px]">
      <Scatter xLabel="年資（月）" yLabel="月薪" points={[{
      x: 12,
      y: 38000,
      label: "A"
    }, {
      x: 36,
      y: 52000,
      label: "B"
    }, {
      x: 60,
      y: 68000,
      label: "C"
    }, {
      x: 120,
      y: 95000,
      label: "D"
    }]} />
    </div>
}`,...(H=(f=d.parameters)==null?void 0:f.docs)==null?void 0:H.source}}};var k,D,V;m.parameters={...m.parameters,docs:{...(k=m.parameters)==null?void 0:k.docs,source:{originalSource:`{
  render: () => <Legend items={[{
    label: "本薪",
    color: PALETTE[0]
  }, {
    label: "加給",
    color: PALETTE[1]
  }, {
    label: "雇主負擔",
    color: PALETTE[5]
  }]} />
}`,...(V=(D=m.parameters)==null?void 0:D.docs)==null?void 0:V.source}}};var $,O,R;p.parameters={...p.parameters,docs:{...($=p.parameters)==null?void 0:$.docs,source:{originalSource:`{
  render: () => <div className="w-[420px]">
      <Heatmap rowLabels={["研發部", "業務部", "行銷部"]} colLabels={["A 案", "B 案", "C 案"]} cells={[[40, 20, 10], [10, 50, 15], [5, 10, 35]]} fmt={n => \`\${n}h\`} />
    </div>
}`,...(R=(O=p.parameters)==null?void 0:O.docs)==null?void 0:R.source}}};const le=["堆疊長條_StackedBar","柏拉圖_Pareto","趨勢_TrendChart","子彈圖_Bullet","長條圖_BarChart","折線_LineChart","散佈圖_Scatter","圖例_Legend","熱區圖_Heatmap"];export{le as __namedExportsOrder,se as default,m as 圖例_Legend,s as 堆疊長條_StackedBar,o as 子彈圖_Bullet,c as 折線_LineChart,d as 散佈圖_Scatter,l as 柏拉圖_Pareto,p as 熱區圖_Heatmap,n as 趨勢_TrendChart,t as 長條圖_BarChart};
