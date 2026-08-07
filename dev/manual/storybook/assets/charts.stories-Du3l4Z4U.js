import{j as e}from"./jsx-runtime-Cf8x2fCZ.js";import{B as ee,a as b,T as h,L as ne,P as r,S as ae,b as se,c as le,d as oe,H as te}from"./index-CL6GRTrG.js";import"./index-yBjzXJbu.js";import"./index-BO-NyGGJ.js";import"./utils-BEESGUdN.js";const xe={title:"元件/圖表",parameters:{layout:"padded"}},re=[{label:"研發部",value:12e5},{label:"業務部",value:86e4},{label:"行銷部",value:54e4},{label:"管理部",value:42e4},{label:"客服部",value:26e4}],ce=["1月","2月","3月","4月","5月","6月"].map((a,n)=>({label:a,value:48e5+n*12e4})),s={args:{圖表:"長條圖",資料點數:5,顯示數值:!0},argTypes:{圖表:{control:"inline-radio",options:["長條圖","柏拉圖","趨勢圖"]},資料點數:{control:{type:"range",min:1,max:24,step:1}},顯示數值:{control:"boolean"}},render:a=>{const n=Array.from({length:a.資料點數},(y,l)=>({label:a.圖表==="趨勢圖"?`${l+1}月`:`類別${l+1}`,value:Math.round(12e5/(l+1))+l%3*5e4}));return e.jsxs("div",{className:"w-[460px]",children:[a.圖表==="長條圖"&&e.jsx(ee,{data:n,showValues:a.顯示數值}),a.圖表==="柏拉圖"&&e.jsx(b,{data:n}),a.圖表==="趨勢圖"&&e.jsx(h,{data:n})]})}},o={render:()=>e.jsx("div",{className:"w-[420px]",children:e.jsx(ae,{rows:[{label:"研發部",segments:[{label:"本薪",value:8e5,color:r[0]},{label:"雇主負擔",value:4e5,color:r[1]}]},{label:"業務部",segments:[{label:"本薪",value:56e4,color:r[0]},{label:"雇主負擔",value:3e5,color:r[1]}]}]})})},t={render:()=>e.jsx("div",{className:"w-[420px]",children:e.jsx(b,{data:re})})},c={render:()=>e.jsx("div",{className:"w-[420px]",children:e.jsx(h,{data:ce})})},d={render:()=>e.jsx("div",{className:"w-[420px]",children:e.jsx(se,{label:"年度預算 vs 實際",value:54e5,target:6e6})})},i={render:()=>e.jsx("div",{className:"w-[420px]",children:e.jsx(ee,{data:re,showValues:!0})})},p={render:()=>e.jsx("div",{className:"w-[320px]",children:e.jsx(le,{diagonal:!0,points:[0,.15,.35,.6,1].map((a,n,y)=>({x:n/(y.length-1),y:a}))})})},m={render:()=>e.jsx("div",{className:"w-[420px]",children:e.jsx(oe,{xLabel:"年資（月）",yLabel:"月薪",points:[{x:12,y:38e3,label:"A"},{x:36,y:52e3,label:"B"},{x:60,y:68e3,label:"C"},{x:120,y:95e3,label:"D"}]})})},u={render:()=>e.jsx(ne,{items:[{label:"本薪",color:r[0]},{label:"加給",color:r[1]},{label:"雇主負擔",color:r[5]}]})},x={render:()=>e.jsx("div",{className:"w-[420px]",children:e.jsx(te,{rowLabels:["研發部","業務部","行銷部"],colLabels:["A 案","B 案","C 案"],cells:[[40,20,10],[10,50,15],[5,10,35]],fmt:a=>`${a}h`})})},v={parameters:{layout:"padded"},render:()=>e.jsxs("div",{className:"space-y-4 [&_.sr-only]:static [&_.sr-only]:m-0 [&_.sr-only]:size-auto [&_.sr-only]:overflow-visible [&_.sr-only]:whitespace-normal [&_.sr-only]:p-0 [&_.sr-only]:[clip:auto]",children:[e.jsxs("p",{className:"text-xs text-muted-foreground",children:["下方每張圖的表格平常是隱藏的（",e.jsx("code",{children:"sr-only"}),"），此處顯形以供審查。 滑鼠使用者看圖、螢幕報讀器使用者讀表格——同一份資料，兩個出口。"]}),e.jsxs("div",{className:"w-[420px] space-y-1",children:[e.jsx("p",{className:"text-xs font-medium",children:"趨勢圖"}),e.jsx(h,{caption:"各月訂單量",data:[{label:"1月",value:120},{label:"2月",value:150},{label:"3月",value:138}],valueFmt:a=>`${a} 筆`})]}),e.jsxs("div",{className:"w-[420px] space-y-1",children:[e.jsx("p",{className:"text-xs font-medium",children:"柏拉圖（含佔比與累積）"}),e.jsx(b,{caption:"各品項銷量",data:[{label:"品項 A",value:90},{label:"品項 B",value:45},{label:"品項 C",value:15}]})]}),e.jsxs("div",{className:"w-[420px] space-y-1",children:[e.jsx("p",{className:"text-xs font-medium",children:"堆疊長條（分段明細原本只有 hover 拿得到）"}),e.jsx(ae,{caption:"各區域成本組成",rows:[{label:"北區",segments:[{label:"固定",value:60,color:r[0]},{label:"變動",value:30,color:r[1]}]},{label:"南區",segments:[{label:"固定",value:40,color:r[0]},{label:"變動",value:45,color:r[1]}]}]})]})]})};var _,g,w,j,N;s.parameters={...s.parameters,docs:{...(_=s.parameters)==null?void 0:_.docs,source:{originalSource:`{
  args: {
    圖表: "長條圖",
    資料點數: 5,
    顯示數值: true
  },
  argTypes: {
    圖表: {
      control: "inline-radio",
      options: ["長條圖", "柏拉圖", "趨勢圖"]
    },
    資料點數: {
      control: {
        type: "range",
        min: 1,
        max: 24,
        step: 1
      }
    },
    顯示數值: {
      control: "boolean"
    }
  },
  render: a => {
    const data = Array.from({
      length: a.資料點數
    }, (_, i) => ({
      label: a.圖表 === "趨勢圖" ? \`\${i + 1}月\` : \`類別\${i + 1}\`,
      value: Math.round(1_200_000 / (i + 1)) + i % 3 * 50_000
    }));
    return <div className="w-[460px]">
        {a.圖表 === "長條圖" && <BarChart data={data} showValues={a.顯示數值} />}
        {a.圖表 === "柏拉圖" && <Pareto data={data} />}
        {a.圖表 === "趨勢圖" && <TrendChart data={data} />}
      </div>;
  }
}`,...(w=(g=s.parameters)==null?void 0:g.docs)==null?void 0:w.source},description:{story:"互動 Playground：右側 Controls 調整**類別數／期數**與圖表類型，即時看不同資料量下的呈現。",...(N=(j=s.parameters)==null?void 0:j.docs)==null?void 0:N.description}}};var T,L,E;o.parameters={...o.parameters,docs:{...(T=o.parameters)==null?void 0:T.docs,source:{originalSource:`{
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
}`,...(E=(L=o.parameters)==null?void 0:L.docs)==null?void 0:E.source}}};var C,B,S;t.parameters={...t.parameters,docs:{...(C=t.parameters)==null?void 0:C.docs,source:{originalSource:`{
  render: () => <div className="w-[420px]"><Pareto data={bars} /></div>
}`,...(S=(B=t.parameters)==null?void 0:B.docs)==null?void 0:S.source}}};var A,P,f;c.parameters={...c.parameters,docs:{...(A=c.parameters)==null?void 0:A.docs,source:{originalSource:`{
  render: () => <div className="w-[420px]"><TrendChart data={trend} /></div>
}`,...(f=(P=c.parameters)==null?void 0:P.docs)==null?void 0:f.source}}};var $,k,H;d.parameters={...d.parameters,docs:{...($=d.parameters)==null?void 0:$.docs,source:{originalSource:`{
  render: () => <div className="w-[420px]"><Bullet label="年度預算 vs 實際" value={5_400_000} target={6_000_000} /></div>
}`,...(H=(k=d.parameters)==null?void 0:k.docs)==null?void 0:H.source}}};var V,z,D;i.parameters={...i.parameters,docs:{...(V=i.parameters)==null?void 0:V.docs,source:{originalSource:`{
  render: () => <div className="w-[420px]"><BarChart data={bars} showValues /></div>
}`,...(D=(z=i.parameters)==null?void 0:z.docs)==null?void 0:D.source}}};var F,M,O;p.parameters={...p.parameters,docs:{...(F=p.parameters)==null?void 0:F.docs,source:{originalSource:`{
  render: () => <div className="w-[320px]">
      <LineChart diagonal points={[0, 0.15, 0.35, 0.6, 1].map((p, i, a) => ({
      x: i / (a.length - 1),
      y: p
    }))} />
    </div>
}`,...(O=(M=p.parameters)==null?void 0:M.docs)==null?void 0:O.source}}};var R,q,G;m.parameters={...m.parameters,docs:{...(R=m.parameters)==null?void 0:R.docs,source:{originalSource:`{
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
}`,...(G=(q=m.parameters)==null?void 0:q.docs)==null?void 0:G.source}}};var I,J,K;u.parameters={...u.parameters,docs:{...(I=u.parameters)==null?void 0:I.docs,source:{originalSource:`{
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
}`,...(K=(J=u.parameters)==null?void 0:J.docs)==null?void 0:K.source}}};var Q,U,W;x.parameters={...x.parameters,docs:{...(Q=x.parameters)==null?void 0:Q.docs,source:{originalSource:`{
  render: () => <div className="w-[420px]">
      <Heatmap rowLabels={["研發部", "業務部", "行銷部"]} colLabels={["A 案", "B 案", "C 案"]} cells={[[40, 20, 10], [10, 50, 15], [5, 10, 35]]} fmt={n => \`\${n}h\`} />
    </div>
}`,...(W=(U=x.parameters)==null?void 0:U.docs)==null?void 0:W.source}}};var X,Y,Z;v.parameters={...v.parameters,docs:{...(X=v.parameters)==null?void 0:X.docs,source:{originalSource:`{
  parameters: {
    layout: "padded"
  },
  render: () => <div className="space-y-4 [&_.sr-only]:static [&_.sr-only]:m-0 [&_.sr-only]:size-auto [&_.sr-only]:overflow-visible [&_.sr-only]:whitespace-normal [&_.sr-only]:p-0 [&_.sr-only]:[clip:auto]">
      <p className="text-xs text-muted-foreground">
        下方每張圖的表格平常是隱藏的（<code>sr-only</code>），此處顯形以供審查。
        滑鼠使用者看圖、螢幕報讀器使用者讀表格——同一份資料，兩個出口。
      </p>
      <div className="w-[420px] space-y-1">
        <p className="text-xs font-medium">趨勢圖</p>
        <TrendChart caption="各月訂單量" data={[{
        label: "1月",
        value: 120
      }, {
        label: "2月",
        value: 150
      }, {
        label: "3月",
        value: 138
      }]} valueFmt={n => \`\${n} 筆\`} />
      </div>
      <div className="w-[420px] space-y-1">
        <p className="text-xs font-medium">柏拉圖（含佔比與累積）</p>
        <Pareto caption="各品項銷量" data={[{
        label: "品項 A",
        value: 90
      }, {
        label: "品項 B",
        value: 45
      }, {
        label: "品項 C",
        value: 15
      }]} />
      </div>
      <div className="w-[420px] space-y-1">
        <p className="text-xs font-medium">堆疊長條（分段明細原本只有 hover 拿得到）</p>
        <StackedBar caption="各區域成本組成" rows={[{
        label: "北區",
        segments: [{
          label: "固定",
          value: 60,
          color: PALETTE[0]
        }, {
          label: "變動",
          value: 30,
          color: PALETTE[1]
        }]
      }, {
        label: "南區",
        segments: [{
          label: "固定",
          value: 40,
          color: PALETTE[0]
        }, {
          label: "變動",
          value: 45,
          color: PALETTE[1]
        }]
      }]} />
      </div>
    </div>
}`,...(Z=(Y=v.parameters)==null?void 0:Y.docs)==null?void 0:Z.source}}};const ve=["互動","堆疊長條_StackedBar","柏拉圖_Pareto","趨勢_TrendChart","子彈圖_Bullet","長條圖_BarChart","折線_LineChart","散佈圖_Scatter","圖例_Legend","熱區圖_Heatmap","無障礙_文字等價"];export{ve as __namedExportsOrder,xe as default,s as 互動,u as 圖例_Legend,o as 堆疊長條_StackedBar,d as 子彈圖_Bullet,p as 折線_LineChart,m as 散佈圖_Scatter,t as 柏拉圖_Pareto,v as 無障礙_文字等價,x as 熱區圖_Heatmap,c as 趨勢_TrendChart,i as 長條圖_BarChart};
