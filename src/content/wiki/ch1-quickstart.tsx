import type { WikiChapter } from "./types";

/** 第1章 快速上手 — 內容撰寫中（Phase B 填入正文；section id 為深連結契約、不可改名）。 */
export const ch_quickstart: WikiChapter = {
  id: "quickstart",
  num: 1,
  title: "快速上手",
  intro: <>第一次使用從這裡開始：初始設定、認識畫面骨架、發薪月份與工作台。</>,
  sections: [
    { id: "setup-wizard", title: "初始設定精靈（五步）", keywords: ["初始設定", "精靈", "載入範例公司", "從空白開始"], body: <>（本節內容撰寫中）</> },
    { id: "shell", title: "畫面骨架：側邊欄與頂部狀態列", keywords: ["側邊欄", "狀態列", "徽章", "待處理", "環境"], body: <>（本節內容撰寫中）</> },
    { id: "period", title: "發薪月份：全站共用的期間概念", keywords: ["發薪月份", "期間", "切月", "currentPeriod"], body: <>（本節內容撰寫中）</> },
    { id: "dashboard", title: "工作台：本月待辦一頁看", keywords: ["工作台", "待辦", "首頁", "排程調薪", "備份提醒"], body: <>（本節內容撰寫中）</> },
    { id: "help-resources", title: "說明資源地圖：導覽、FAQ、法規", keywords: ["使用說明", "導覽", "FAQ", "法規依據", "操作手冊"], body: <>（本節內容撰寫中）</> },
  ],
};
