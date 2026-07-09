import type { ReactNode } from "react";

/**
 * 導引內容（app glue，不入元件庫 barrel）。
 * 每步：可選 spotlight 目標（data-tour id；找不到＝置中卡）＋可選自動導覽路由（route）。
 * 設計為「只導引不代填」：導引器會替你換頁，但輸入/點分頁由你自己操作、再按「下一步」。
 */
export interface TourStep {
  target?: string; // 要圈選的元素 data-tour；undefined 或找不到＝置中說明卡
  title: string;
  body: ReactNode;
  route?: string; // 進入此步前自動導覽到此 hash 路由（如 "/settings"）
}
export interface Tour {
  id: string;
  title: string;
  audience: "acceptance" | "onboarding";
  summary: string;
  steps: TourStep[];
}

export const TOURS: Record<string, Tour> = {
  fx: {
    id: "fx",
    title: "多幣別薪資（驗收導覽）",
    audience: "acceptance",
    summary: "啟用外幣 → 新增幣別 → 設匯率 → 員工設定 → 月結／薪資條／報表查看外幣。",
    steps: [
      { title: "多幣別薪資導覽", body: <>帶你走一遍外幣薪資。外幣與台幣<strong>分開計算、視作獎金、預設不進勞健保</strong>。過程中我會替你換頁，分頁/輸入請你自己點、再按「下一步」。隨時可略過。</> },
      { route: "/settings", target: "settings-tabs", title: "① 開啟「幣別與匯率」", body: <>在系統設定上方，點<strong>「幣別與匯率」</strong>分頁，再把<strong>「啟用多幣別」</strong>打開。完成後按「下一步」。</> },
      { route: "/settings", target: "currency-center", title: "② 新增幣別＋設匯率", body: <>在維護中心：填代碼（如 <strong>USD</strong>）、名稱、符號→「新增幣別」；下方「匯率」輸入 1 USD＝多少台幣（如 <strong>32</strong>）。<br/>台幣約當＝外幣×匯率，僅供參考、不進稅基。</> },
      { route: "/master", target: "master-tabs", title: "③ 給員工設定外幣", body: <>到<strong>基本資料</strong>：點員工→「薪資結構調整」可設「固定每月外幣」；或用<strong>「批次薪資 → 外幣薪資」</strong>對整個部門一次發放。</> },
      { route: "/payroll/monthly", target: "period-picker", title: "④ 月結查看", body: <>回<strong>薪資結算</strong>：員工「編輯」對話框可<strong>逐月覆寫</strong>外幣並看台幣約當；查核頁多一欄<strong>「外幣(折台)」</strong>。台幣實發不含外幣。</> },
      { route: "/reports", target: "report-period", title: "⑤ 報表與薪資條", body: <>報表的<strong>「外幣給付彙總」</strong>卡與薪資條的<strong>「外幣給付」</strong>區塊，都與台幣核心<strong>分開呈現</strong>、不併入應發/成本。導覽完成！</> },
    ],
  },

  version: {
    id: "version",
    title: "法定費率生效月版本（驗收導覽）",
    audience: "acceptance",
    summary: "已確認月鎖定就地編輯 → 新增「自某月生效」的版本 → 改費率只影響該月之後。",
    steps: [
      { title: "生效月版本化導覽", body: <>示範「改費率不回溯改動已申報月份」。核心：已有已確認月時，法定參數不可就地改，只能<strong>新增自某月起生效的版本</strong>。</> },
      { route: "/settings", target: "settings-tabs", title: "① 法定參數分頁", body: <>確認在<strong>「法定參數」</strong>分頁。若示範公司已有已確認月份，下方費率欄會顯示<strong>鎖頭</strong>（不可就地改）。</> },
      { route: "/settings", target: "new-version-banner", title: "② 新增生效版本", body: <>看到黃色提示卡：選<strong>生效月份</strong>（須晚於最後已確認月）→ 按<strong>「新增生效版本」</strong>。之後欄位解鎖，可改新版本費率。</> },
      { route: "/settings", target: "legal-groups", title: "③ 改費率、切月驗證", body: <>改好新版本費率後，到<strong>薪資結算</strong>切換月份：新版本生效月之後用新費率、之前的已確認月維持原費率、扣繳憑單逐月各取其版本。導覽完成！</> },
    ],
  },

  transfer: {
    id: "transfer",
    title: "調職／部門異動與計薪鎖（驗收導覽）",
    audience: "acceptance",
    summary: "調職＝改部門/成本中心，屬計薪相關，已確認月會被鎖，避免繞過月結凍結。",
    steps: [
      { title: "調職／部門異動導覽", body: <>示範新的<strong>「調職／部門異動」</strong>情境：改部門/職稱/成本中心/專案。這些會影響成本分攤與報表分類，屬<strong>計薪相關</strong>。</> },
      { route: "/master", target: "master-tabs", title: "① 開啟員工檔案", body: <>在<strong>員工清單</strong>點任一員工開啟檔案面板，於「資料維護」按<strong>「調職／部門異動」</strong>。</> },
      { route: "/master", title: "② 改部門並理解鎖定", body: <>改部門/成本中心→填<strong>異動原因</strong>→送出。<br/>若當月<strong>已確認結算</strong>，此情境會被<strong>鎖定</strong>（欄位唯讀），需先到「查核與確認」取消確認——防止期中調職回溯改動已凍結的成本分攤。<br/>（純聯絡資料改姓名/Email 則走「聯絡與識別」情境、不受鎖。）導覽完成！</> },
    ],
  },

  safety: {
    id: "safety",
    title: "設定安全網（驗收導覽）",
    audience: "acceptance",
    summary: "改錯費率即時紅字擋＋危險操作紅框與備份還原分離，避免誤覆蓋資料。",
    steps: [
      { title: "設定安全網導覽", body: <>示範兩道防呆：①改法定費率量級打錯會<strong>即時紅字擋下</strong> ②覆蓋/清空類「危險操作」與「從備份還原」<strong>分區隔離</strong>。</> },
      { route: "/settings", target: "settings-validation", title: "① 設定驗證", body: <>在<strong>法定參數</strong>頁，若把費率打錯量級（例如健保 5.17% 打成 <strong>5</strong>）、或投保級距沒排序，系統頂部會<strong>紅字列出問題</strong>，在算錯錢前先擋下。（目前設定正常時不顯示。）</> },
      { route: "/settings", target: "settings-danger", title: "② 危險操作隔離", body: <>點<strong>「資料與安全」</strong>分頁：最下方<strong>紅框「危險操作」</strong>區（載入示範公司／清空員工資料）與上方「從備份還原」<strong>刻意分開</strong>，且改用紅色警示樣式，避免把「載入示範」誤當「還原備份」而覆蓋真實資料。導覽完成！</> },
    ],
  },

  overview: {
    id: "overview",
    title: "系統總覽（新手上手）",
    audience: "onboarding",
    summary: "認識側邊欄分區、工作台待辦，與「每月固定做哪兩件事」。",
    steps: [
      { route: "/", title: "歡迎！系統總覽", body: <>用兩分鐘帶你認識主要功能與動線。這套系統依台灣法規，把勞健保/勞退/二代健保/所得稅到薪資條一次算完。</> },
      { route: "/", target: "sidebar", title: "① 側邊欄＝功能地圖", body: <>左側分區：<strong>每月作業</strong>（工作台/薪資結算）、<strong>規劃與分析</strong>、<strong>報表與申報</strong>、<strong>主檔與設定</strong>。跟著側邊欄就能找到所有功能。</> },
      { route: "/", title: "② 工作台＝本月待辦一頁看", body: <>首頁把本月要處理的事聚合成待辦卡——資料檢查、未填代扣稅、加退保、排程調薪——<strong>點卡片直達</strong>處理位置。</> },
      { route: "/", title: "③ 每月固定兩件事", body: <>① <strong>薪資結算</strong>：輸入異動→查核確認。② <strong>報表與申報</strong>：印薪資條、跑扣繳/繳費/加退保名冊。<br/>其餘（基本資料、系統設定）平時不太需要動。想深入可再跑「每月結算」與「主檔情境」導覽。完成！</> },
    ],
  },

  monthly: {
    id: "monthly",
    title: "每月結算兩步（新手上手）",
    audience: "onboarding",
    summary: "薪資結算輸入異動 → 查核 → 確認凍結。",
    steps: [
      { title: "每月結算兩步", body: <>每月固定：<strong>①輸入異動 → ②查核確認</strong>。固定薪資與四項保費系統已自動算好，你只補「變動」的部分。</> },
      { route: "/payroll/monthly", target: "period-picker", title: "① 選發薪月份", body: <>先選<strong>發薪月份</strong>。表格會列出全體員工的自動試算；沒有異動的人<strong>完全不用動</strong>。</> },
      { route: "/payroll/monthly", title: "② 只編輯有異動的人", body: <>對「有加班／請假／獎金／需代扣稅」的員工按<strong>「編輯」</strong>→填當月異動→看即時試算（應發/代扣/實發）→送出前看變更摘要→儲存。（選「依扣繳稅額表」且達起扣點者會出現黃色提醒查表填稅。）</> },
      { route: "/payroll/review", target: "confirm-btn", title: "③ 查核並確認凍結", body: <>第二步<strong>「查核與確認」</strong>：看全公司試算總覽＋統計查核（<strong>紅色必處理</strong>）。無誤後按<strong>「確認本月結算」</strong>留下確認紀錄並凍結。之後若再改任何資料，確認會自動解除、提醒重查。導覽完成！</> },
    ],
  },

  master: {
    id: "master",
    title: "主檔情境申請單（新手上手）",
    audience: "onboarding",
    summary: "挑情境→只填該情境欄位→必填原因→送出留稽核、可回復。",
    steps: [
      { title: "基本資料＝情境化申請單", body: <>員工資料維護不是一張大表：而是<strong>挑「情境」</strong>（到職/離職/留停/復職/薪資調整/調職/眷屬/扣繳/聯絡），只填該情境欄位，每筆都留可稽核、可回復的紀錄。</> },
      { route: "/master", target: "master-tabs", title: "① 員工清單 → 挑情境", body: <>在<strong>「員工清單」</strong>點任一員工開啟檔案面板，依要辦的事選情境按鈕（人員異動／資料維護兩組）。</> },
      { route: "/master", title: "② 填該情境欄位＋原因", body: <>選情境後只出現<strong>相關欄位</strong>＋必填<strong>「異動原因」</strong>；送出前<strong>「變更摘要」</strong>看舊→新、可逐欄還原。送出即記一筆稽核。<br/>（計薪相關情境於當月已確認時會被鎖，需先取消確認；純聯絡資料不受限。）</> },
      { route: "/master", target: "master-tabs", title: "③ 異動紀錄可查可回復", body: <>第三個分頁<strong>「異動紀錄」</strong>可搜尋所有異動（員工/情境/原因），並對可回復者按「回復」。導覽完成！</> },
    ],
  },
};

export const TOUR_LIST = Object.values(TOURS);
