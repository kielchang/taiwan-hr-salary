import type { WikiChapter } from "./types";

/** 第3章 每月薪資作業 — 內容撰寫中（Phase B 填入正文；section id 為深連結契約、不可改名）。 */
export const ch_monthly: WikiChapter = {
  id: "monthly",
  num: 3,
  title: "每月薪資作業",
  intro: <>每月固定兩步：輸入異動 → 查核確認。本章逐欄說明異動編輯與確認凍結。</>,
  sections: [
    { id: "rhythm", title: "每月作業節奏", keywords: ["節奏", "流程", "每月", "checklist"], body: <>（本節內容撰寫中）</> },
    { id: "monthly-edit", title: "第一步：逐員輸入當月異動", keywords: ["異動", "編輯", "薪資結算", "名單"], body: <>（本節內容撰寫中）</> },
    { id: "edit-dialog", title: "異動編輯對話框逐欄說明", keywords: ["加班", "請假", "獎金", "代扣稅", "其他加項", "外幣"], body: <>（本節內容撰寫中）</> },
    { id: "carry-forward", title: "帶入上月與快速動線", keywords: ["帶入上月", "儲存並下一位", "快捷鍵"], body: <>（本節內容撰寫中）</> },
    { id: "review-tabs", title: "第二步：查核三分頁", keywords: ["查核", "試算總覽", "統計查核", "環比", "同比"], body: <>（本節內容撰寫中）</> },
    { id: "bonus-trial", title: "獎金試算器", keywords: ["獎金", "補充保費", "二代健保", "試算"], body: <>（本節內容撰寫中）</> },
    { id: "confirm", title: "確認本月結算", keywords: ["確認", "凍結", "快照", "解除"], body: <>（本節內容撰寫中）</> },
  ],
};
