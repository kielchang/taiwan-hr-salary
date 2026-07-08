import{j as e}from"./jsx-runtime-Cf8x2fCZ.js";import{B as Q,P as U,T as W,L as Y,a as s,S as Z,b as ee,c as ae,d as re,H as se}from"./index-D04uuL-I.js";import"./index-yBjzXJbu.js";import"./index-BO-NyGGJ.js";import"./utils-CdvzHgU1.js";const ie={title:"元件/圖表",parameters:{layout:"padded"}},X=[{label:"研發部",value:12e5},{label:"業務部",value:86e4},{label:"行銷部",value:54e4},{label:"管理部",value:42e4},{label:"客服部",value:26e4}],ne=["1月","2月","3月","4月","5月","6月"].map((a,r)=>({label:a,value:48e5+r*12e4})),n={args:{圖表:"長條圖",資料點數:5,顯示數值:!0},argTypes:{圖表:{control:"inline-radio",options:["長條圖","柏拉圖","趨勢圖"]},資料點數:{control:{type:"range",min:1,max:24,step:1}},顯示數值:{control:"boolean"}},render:a=>{const r=Array.from({length:a.資料點數},(b,l)=>({label:a.圖表==="趨勢圖"?`${l+1}月`:`類別${l+1}`,value:Math.round(12e5/(l+1))+l%3*5e4}));return e.jsxs("div",{className:"w-[460px]",children:[a.圖表==="長條圖"&&e.jsx(Q,{data:r,showValues:a.顯示數值}),a.圖表==="柏拉圖"&&e.jsx(U,{data:r}),a.圖表==="趨勢圖"&&e.jsx(W,{data:r})]})}},o={render:()=>e.jsx("div",{className:"w-[420px]",children:e.jsx(Z,{rows:[{label:"研發部",segments:[{label:"本薪",value:8e5,color:s[0]},{label:"雇主負擔",value:4e5,color:s[1]}]},{label:"業務部",segments:[{label:"本薪",value:56e4,color:s[0]},{label:"雇主負擔",value:3e5,color:s[1]}]}]})})},t={render:()=>e.jsx("div",{className:"w-[420px]",children:e.jsx(U,{data:X})})},c={render:()=>e.jsx("div",{className:"w-[420px]",children:e.jsx(W,{data:ne})})},d={render:()=>e.jsx("div",{className:"w-[420px]",children:e.jsx(ee,{label:"年度預算 vs 實際",value:54e5,target:6e6})})},i={render:()=>e.jsx("div",{className:"w-[420px]",children:e.jsx(Q,{data:X,showValues:!0})})},p={render:()=>e.jsx("div",{className:"w-[320px]",children:e.jsx(ae,{diagonal:!0,points:[0,.15,.35,.6,1].map((a,r,b)=>({x:r/(b.length-1),y:a}))})})},m={render:()=>e.jsx("div",{className:"w-[420px]",children:e.jsx(re,{xLabel:"年資（月）",yLabel:"月薪",points:[{x:12,y:38e3,label:"A"},{x:36,y:52e3,label:"B"},{x:60,y:68e3,label:"C"},{x:120,y:95e3,label:"D"}]})})},u={render:()=>e.jsx(Y,{items:[{label:"本薪",color:s[0]},{label:"加給",color:s[1]},{label:"雇主負擔",color:s[5]}]})},x={render:()=>e.jsx("div",{className:"w-[420px]",children:e.jsx(se,{rowLabels:["研發部","業務部","行銷部"],colLabels:["A 案","B 案","C 案"],cells:[[40,20,10],[10,50,15],[5,10,35]],fmt:a=>`${a}h`})})};var v,h,g,_,w;n.parameters={...n.parameters,docs:{...(v=n.parameters)==null?void 0:v.docs,source:{originalSource:`{
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
}`,...(g=(h=n.parameters)==null?void 0:h.docs)==null?void 0:g.source},description:{story:"互動 Playground：右側 Controls 調整**類別數／期數**與圖表類型，即時看不同資料量下的呈現。",...(w=(_=n.parameters)==null?void 0:_.docs)==null?void 0:w.description}}};var L,T,j;o.parameters={...o.parameters,docs:{...(L=o.parameters)==null?void 0:L.docs,source:{originalSource:`{
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
}`,...(j=(T=o.parameters)==null?void 0:T.docs)==null?void 0:j.source}}};var y,C,S;t.parameters={...t.parameters,docs:{...(y=t.parameters)==null?void 0:y.docs,source:{originalSource:`{
  render: () => <div className="w-[420px]"><Pareto data={bars} /></div>
}`,...(S=(C=t.parameters)==null?void 0:C.docs)==null?void 0:S.source}}};var B,E,N;c.parameters={...c.parameters,docs:{...(B=c.parameters)==null?void 0:B.docs,source:{originalSource:`{
  render: () => <div className="w-[420px]"><TrendChart data={trend} /></div>
}`,...(N=(E=c.parameters)==null?void 0:E.docs)==null?void 0:N.source}}};var P,A,f;d.parameters={...d.parameters,docs:{...(P=d.parameters)==null?void 0:P.docs,source:{originalSource:`{
  render: () => <div className="w-[420px]"><Bullet label="年度預算 vs 實際" value={5_400_000} target={6_000_000} /></div>
}`,...(f=(A=d.parameters)==null?void 0:A.docs)==null?void 0:f.source}}};var $,H,k;i.parameters={...i.parameters,docs:{...($=i.parameters)==null?void 0:$.docs,source:{originalSource:`{
  render: () => <div className="w-[420px]"><BarChart data={bars} showValues /></div>
}`,...(k=(H=i.parameters)==null?void 0:H.docs)==null?void 0:k.source}}};var V,D,M;p.parameters={...p.parameters,docs:{...(V=p.parameters)==null?void 0:V.docs,source:{originalSource:`{
  render: () => <div className="w-[320px]">
      <LineChart diagonal points={[0, 0.15, 0.35, 0.6, 1].map((p, i, a) => ({
      x: i / (a.length - 1),
      y: p
    }))} />
    </div>
}`,...(M=(D=p.parameters)==null?void 0:D.docs)==null?void 0:M.source}}};var O,R,q;m.parameters={...m.parameters,docs:{...(O=m.parameters)==null?void 0:O.docs,source:{originalSource:`{
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
}`,...(q=(R=m.parameters)==null?void 0:R.docs)==null?void 0:q.source}}};var z,F,G;u.parameters={...u.parameters,docs:{...(z=u.parameters)==null?void 0:z.docs,source:{originalSource:`{
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
}`,...(G=(F=u.parameters)==null?void 0:F.docs)==null?void 0:G.source}}};var I,J,K;x.parameters={...x.parameters,docs:{...(I=x.parameters)==null?void 0:I.docs,source:{originalSource:`{
  render: () => <div className="w-[420px]">
      <Heatmap rowLabels={["研發部", "業務部", "行銷部"]} colLabels={["A 案", "B 案", "C 案"]} cells={[[40, 20, 10], [10, 50, 15], [5, 10, 35]]} fmt={n => \`\${n}h\`} />
    </div>
}`,...(K=(J=x.parameters)==null?void 0:J.docs)==null?void 0:K.source}}};const pe=["互動","堆疊長條_StackedBar","柏拉圖_Pareto","趨勢_TrendChart","子彈圖_Bullet","長條圖_BarChart","折線_LineChart","散佈圖_Scatter","圖例_Legend","熱區圖_Heatmap"];export{pe as __namedExportsOrder,ie as default,n as 互動,u as 圖例_Legend,o as 堆疊長條_StackedBar,d as 子彈圖_Bullet,p as 折線_LineChart,m as 散佈圖_Scatter,t as 柏拉圖_Pareto,x as 熱區圖_Heatmap,c as 趨勢_TrendChart,i as 長條圖_BarChart};
