import type { WikiChapter } from "./types";

/** 第2章 全域觀念 — 內容撰寫中（Phase B 填入正文；section id 為深連結契約、不可改名）。 */
export const ch_concepts: WikiChapter = {
  id: "concepts",
  num: 2,
  title: "全域觀念",
  intro: <>貫穿全站的核心規則：先懂這些，其他畫面的行為就都說得通。</>,
  sections: [
    { id: "confirm-lock", title: "確認凍結與硬鎖定", keywords: ["確認", "鎖定", "取消確認", "凍結", "快照"], body: <>（本節內容撰寫中）</> },
    { id: "effective-versioning", title: "法定參數生效月版本化", keywords: ["生效月", "版本", "費率", "不回溯", "新增生效版本"], body: <>（本節內容撰寫中）</> },
    { id: "validation", title: "資料檢查 V1–V17", keywords: ["驗證", "檢查", "錯誤", "警告", "待處理"], body: <>（本節內容撰寫中）</> },
    { id: "prorate-lifecycle", title: "破月計薪與員工生命週期", keywords: ["破月", "離職", "留停", "停職", "復職", "比例"], body: <>（本節內容撰寫中）</> },
    { id: "sandbox-vs-actual", title: "例行 vs 試算：什麼會寫回", keywords: ["試算", "沙盒", "例行", "寫回", "徽章"], body: <>（本節內容撰寫中）</> },
    { id: "audit-restore", title: "異動紀錄與回復", keywords: ["稽核", "異動紀錄", "回復", "操作者"], body: <>（本節內容撰寫中）</> },
    { id: "backup-health", title: "資料備份健康度", keywords: ["備份", "匯出", "還原", "瀏覽器", "遺失"], body: <>（本節內容撰寫中）</> },
    { id: "ui-conventions", title: "畫面慣例：欄位顏色與尾差", keywords: ["可編輯", "琥珀", "唯讀", "尾差", "四捨五入"], body: <>（本節內容撰寫中）</> },
  ],
};
