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
};

export const TOUR_LIST = Object.values(TOURS);
