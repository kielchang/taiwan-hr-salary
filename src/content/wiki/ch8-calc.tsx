import type { WikiChapter } from "./types";

/** 第8章 計算原理速查 — 內容撰寫中（Phase B 填入正文；section id 為深連結契約、不可改名）。 */
export const ch_calc: WikiChapter = {
  id: "calc",
  num: 8,
  title: "計算原理速查",
  intro: <>系統怎麼算錢：對照 README §5 計算模型的白話速查。法源條號見「法規依據」頁。</>,
  sections: [
    { id: "base", title: "基底量：每小時工資額", keywords: ["時薪", "240", "基底"], body: <>（本節內容撰寫中）</> },
    { id: "bracket-lookup", title: "投保級距查表", keywords: ["級距", "查表", "觸頂", "投保金額"], body: <>（本節內容撰寫中）</> },
    { id: "seniority", title: "年資與特別休假", keywords: ["年資", "特休", "週年制", "基準日"], body: <>（本節內容撰寫中）</> },
    { id: "overtime", title: "加班費", keywords: ["加班", "費率", "1.33", "1.66", "國定假日"], body: <>（本節內容撰寫中）</> },
    { id: "leave-deduct", title: "請假扣款", keywords: ["事假", "病假", "半薪", "扣款"], body: <>（本節內容撰寫中）</> },
    { id: "social-insurance", title: "四險保費：自付與雇主", keywords: ["勞保", "健保", "職保", "勞退", "自付", "負擔"], body: <>（本節內容撰寫中）</> },
    { id: "supplement", title: "二代健保補充保費", keywords: ["補充保費", "2.11", "四倍", "獎金"], body: <>（本節內容撰寫中）</> },
    { id: "tax", title: "所得稅扣繳分流", keywords: ["扣繳", "起扣點", "5%", "查表", "非居住者"], body: <>（本節內容撰寫中）</> },
    { id: "employer-cost", title: "雇主總成本", keywords: ["雇主", "總成本", "負擔"], body: <>（本節內容撰寫中）</> },
    { id: "sources-link", title: "法源與官方對照", keywords: ["法規", "法源", "對照", "官方"], body: <>（本節內容撰寫中）</> },
  ],
};
