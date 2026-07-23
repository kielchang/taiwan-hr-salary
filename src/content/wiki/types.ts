// 操作手冊內容模型（宣告式；內容層不 import store——動作以資料宣告、由 WikiView 解析執行）。
// section id＝深連結契約（?ch=&sec=），凍結後不可改名，改名＝破壞使用者書籤。
import type { ReactNode } from "react";

/** 宣告式動作：WikiView 負責解析（navigate / startTour），內容層不碰 store。 */
export interface WikiAction {
  label: string; // 例：「前往薪資結算」「啟動導覽：每月結算」
  to?: string;   // hash 路由含 query，例 "/reports?tab=payslip"
  tour?: string; // TOURS 的 id；WikiView 以 navigate("/")+startTour(id) 啟動（同 HelpView 模式）
}

export interface WikiSection {
  id: string;            // 章內唯一、穩定（kebab-case）
  title: string;
  keywords?: string[];   // 搜尋詞（UI 標籤原文、同義詞、俗稱），3–8 個；搜尋比對 title+keywords
  body: ReactNode;       // 純呈現 TSX；可用 <Callout>、<strong>、ol/ul/table
  actions?: WikiAction[];
}

export interface WikiChapter {
  id: string;      // "quickstart" | "concepts" | ...
  num: number;     // 1..8（顯示用）
  title: string;
  intro: ReactNode; // 1–3 句章節導言
  sections: WikiSection[];
}
