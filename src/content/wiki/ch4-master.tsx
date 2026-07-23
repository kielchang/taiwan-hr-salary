import type { WikiChapter } from "./types";

/** 第4章 基本資料維護 — 內容撰寫中（Phase B 填入正文；section id 為深連結契約、不可改名）。 */
export const ch_master: WikiChapter = {
  id: "master",
  num: 4,
  title: "基本資料維護",
  intro: <>員工資料採「情境申請單」：挑情境、只填該情境欄位、必填原因、留稽核可回復。</>,
  sections: [
    { id: "scenarios", title: "情境申請單總覽", keywords: ["情境", "申請單", "異動原因", "員工檔案"], body: <>（本節內容撰寫中）</> },
    { id: "onboard", title: "新進到職", keywords: ["到職", "新增員工", "加保", "預設薪資"], body: <>（本節內容撰寫中）</> },
    { id: "offboard-leave", title: "離職與留停/停職/暫離", keywords: ["離職", "留停", "停職", "暫離", "復職", "區間"], body: <>（本節內容撰寫中）</> },
    { id: "salary-structure", title: "薪資結構與自訂津貼", keywords: ["本薪", "津貼", "伙食", "自訂津貼", "投保級距"], body: <>（本節內容撰寫中）</> },
    { id: "dependents-tax", title: "眷屬與扣繳設定", keywords: ["眷屬", "健保", "扶養", "扣繳", "免稅額", "勞退自提"], body: <>（本節內容撰寫中）</> },
    { id: "batch-salary", title: "批次薪資與區間補貼", keywords: ["批次", "調薪", "定額", "區間補貼", "排程", "外幣"], body: <>（本節內容撰寫中）</> },
    { id: "import", title: "CSV 批次匯入", keywords: ["匯入", "CSV", "模板", "驗證"], body: <>（本節內容撰寫中）</> },
    { id: "audit-log", title: "異動紀錄與回復操作", keywords: ["異動紀錄", "回復", "稽核", "匯出"], body: <>（本節內容撰寫中）</> },
  ],
};
