import type { WikiChapter } from "./types";

/** 第7章 系統設定 — 內容撰寫中（Phase B 填入正文；section id 為深連結契約、不可改名）。 */
export const ch_settings: WikiChapter = {
  id: "settings",
  num: 7,
  title: "系統設定",
  intro: <>法定參數、公司政策、多幣別與資料安全：年度維護與治理都在這裡。</>,
  sections: [
    { id: "legal-params", title: "法定費率與金額", keywords: ["費率", "最低工資", "健保", "勞保", "免稅額"], body: <>（本節內容撰寫中）</> },
    { id: "bracket-editor", title: "投保級距編輯（逐格與 CSV）", keywords: ["級距", "編輯", "CSV", "匯入", "範本"], body: <>（本節內容撰寫中）</> },
    { id: "versioning", title: "新增生效版本操作", keywords: ["生效版本", "年度更新", "不回溯"], body: <>（本節內容撰寫中）</> },
    { id: "company-policy", title: "公司政策與新進預設", keywords: ["職災費率", "年資", "特休", "給薪比例", "預設津貼"], body: <>（本節內容撰寫中）</> },
    { id: "currency-fx", title: "多幣別與匯率", keywords: ["外幣", "匯率", "USD", "政策", "獨立金流"], body: <>（本節內容撰寫中）</> },
    { id: "data-safety", title: "資料與安全", keywords: ["備份", "還原", "示範", "清空", "稽核", "危險操作"], body: <>（本節內容撰寫中）</> },
  ],
};
