import{j as e}from"./jsx-runtime-Cf8x2fCZ.js";import{c as a}from"./utils-BEESGUdN.js";import{c as n}from"./createLucideIcon-DqplzwSp.js";/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const m=n("CircleAlert",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["line",{x1:"12",x2:"12",y1:"8",y2:"12",key:"1pkeuh"}],["line",{x1:"12",x2:"12.01",y1:"16",y2:"16",key:"4dfq90"}]]);/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const p=n("CircleCheck",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]]);/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const u=n("Lightbulb",[["path",{d:"M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5",key:"1gvzjb"}],["path",{d:"M9 18h6",key:"x1upvd"}],["path",{d:"M10 22h4",key:"ceow96"}]]);/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const g=n("TriangleAlert",[["path",{d:"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",key:"wmoenq"}],["path",{d:"M12 9v4",key:"juzpu7"}],["path",{d:"M12 17h.01",key:"p32p05"}]]),x={success:{wrap:"border-success/30 bg-success/10",color:"text-success",icon:p},warning:{wrap:"border-warning/40 bg-warning/10",color:"text-warning",icon:g},info:{wrap:"border-info/30 bg-info/10",color:"text-info",icon:u},danger:{wrap:"border-danger/30 bg-danger/10",color:"text-danger",icon:m}};function y({variant:i,title:c,tag:s,icon:o,children:t,className:l}){const r=x[i],d=o??r.icon;return e.jsxs("div",{className:a("flex items-start gap-2.5 rounded-md border p-3",r.wrap,l),children:[e.jsx(d,{className:a("mt-0.5 size-4 shrink-0",r.color)}),e.jsxs("div",{className:"min-w-0 flex-1",children:[e.jsxs("p",{className:a("text-sm font-semibold",r.color),children:[s&&e.jsx("span",{className:"mr-1.5 rounded bg-background/70 px-1 py-0.5 align-middle text-[10px] font-medium",children:s}),c]}),t&&e.jsx("div",{className:"mt-0.5 text-xs leading-relaxed text-muted-foreground",children:t})]})]})}y.__docgenInfo={description:`統一狀態提示框（良好/警示/提醒/危險）：圖示＋（可選）標籤＋標題＋內文。取代各處零散手刻的
原始調色盤色塊（原本各畫面各自 border/bg/text 三件套硬編色），改走語意 token——換圖表色票主題
或深色模式都不會漂移（狀態語意與分類色票脫鉤，同 Bullet 圖表的處理原則）。`,methods:[],displayName:"Callout",props:{variant:{required:!0,tsType:{name:"union",raw:'"success" | "warning" | "info" | "danger"',elements:[{name:"literal",value:'"success"'},{name:"literal",value:'"warning"'},{name:"literal",value:'"info"'},{name:"literal",value:'"danger"'}]},description:""},title:{required:!0,tsType:{name:"ReactNode"},description:""},tag:{required:!1,tsType:{name:"string"},description:""},icon:{required:!1,tsType:{name:"LucideIcon"},description:""},children:{required:!1,tsType:{name:"ReactNode"},description:""},className:{required:!1,tsType:{name:"string"},description:""}}};export{y as C,u as L,g as T,p as a};
