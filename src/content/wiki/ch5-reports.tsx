import type { WikiChapter } from "./types";

/** 第5章 報表與申報 — 內容撰寫中（Phase B 填入正文；section id 為深連結契約、不可改名）。 */
export const ch_reports: WikiChapter = {
  id: "reports",
  num: 5,
  title: "報表與申報",
  intro: <>對外報表的單一出口：月結報表（含薪資條）與年度申報名冊。</>,
  sections: [
    { id: "hub", title: "報表中心與期間切換", keywords: ["報表", "申報", "期間", "月份"], body: <>（本節內容撰寫中）</> },
    { id: "monthly-reports", title: "匯總報表與代扣稅清單", keywords: ["匯總", "部門", "成本中心", "代扣稅", "帶入建議"], body: <>（本節內容撰寫中）</> },
    { id: "payslip-pdf", title: "薪資條與加密 PDF", keywords: ["薪資條", "PDF", "密碼", "ZIP", "Email"], body: <>（本節內容撰寫中）</> },
    { id: "filing", title: "年度申報四類名冊", keywords: ["扣繳憑單", "勞健退", "級距申報", "加退保", "停保", "復保"], body: <>（本節內容撰寫中）</> },
    { id: "print-tips", title: "列印與歸檔建議", keywords: ["列印", "歸檔", "PDF", "存檔"], body: <>（本節內容撰寫中）</> },
  ],
};
