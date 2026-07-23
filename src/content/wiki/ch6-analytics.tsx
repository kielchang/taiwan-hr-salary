import type { WikiChapter } from "./types";

/** 第6章 薪酬分析與試算 — 內容撰寫中（Phase B 填入正文；section id 為深連結契約、不可改名）。 */
export const ch_analytics: WikiChapter = {
  id: "analytics",
  num: 6,
  title: "薪酬分析與試算",
  intro: <>月報/試算/年報三組分析。沙盒原則：只有「調薪核定套用」會寫回薪資。</>,
  sections: [
    { id: "overview", title: "分析頁地圖與沙盒原則", keywords: ["分析", "沙盒", "月報", "年報", "試算"], body: <>（本節內容撰寫中）</> },
    { id: "cost", title: "成本結構", keywords: ["成本", "組成", "部門", "Pareto"], body: <>（本節內容撰寫中）</> },
    { id: "fairness", title: "分布與公平", keywords: ["分布", "Gini", "中位數", "公平", "壓縮"], body: <>（本節內容撰寫中）</> },
    { id: "brackets-compa", title: "級距與 compa-ratio", keywords: ["級距", "compa", "滲透率", "市場"], body: <>（本節內容撰寫中）</> },
    { id: "bonus-sim", title: "獎金／分紅試算", keywords: ["獎金池", "分紅", "績效", "merit"], body: <>（本節內容撰寫中）</> },
    { id: "raise-sim", title: "調薪試算與核定套用", keywords: ["調薪", "核定", "套用", "排程", "預算"], body: <>（本節內容撰寫中）</> },
    { id: "annual-trend", title: "趨勢與年度預算", keywords: ["趨勢", "快照", "預算", "年報"], body: <>（本節內容撰寫中）</> },
    { id: "metrics", title: "指標說明", keywords: ["指標", "名詞", "定義"], body: <>（本節內容撰寫中）</> },
  ],
};
