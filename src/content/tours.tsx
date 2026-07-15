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
  advanceOn?: "click"; // 使用者實際點到圈選處（target）即自動前進；適用「切分頁/開面板」等點了自然帶到下一步的操作
  actionHint?: ReactNode; // 搭配 advanceOn 的互動提示文字（預設「👆 點上方圈選處即可繼續」）
  mobileTarget?: string; // 窄螢幕（<768）改圈此 data-tour（如桌機圈側邊欄、手機圈左上選單鈕）
  requireUnconfirmed?: boolean; // 此步需「當期未確認」才可操作；已確認時導引顯示紅字提醒先取消確認
}
export interface Tour {
  id: string;
  title: string;
  audience: "acceptance" | "onboarding";
  summary: string;
  steps: TourStep[];
  /** 選配：末步「接著看」串接的下一支導引 id（上手三支柱串成一條學習路徑）。 */
  next?: string;
  /** 選配：末步「接著看」鈕文字（預設「接著看下一支 →」）。 */
  nextLabel?: string;
}

export const TOURS: Record<string, Tour> = {
  fx: {
    id: "fx",
    title: "多幣別薪資（驗收導覽）",
    audience: "acceptance",
    summary: "啟用外幣 → 新增幣別 → 設匯率 → 員工設定 → 月結／薪資條／報表查看外幣。",
    steps: [
      { title: "多幣別薪資導覽", body: <>帶你走一遍外幣薪資。外幣與台幣<strong>分開計算、視作獎金、預設不進勞健保</strong>。過程中我會替你換頁並<strong>圈出該點的控制項</strong>。<br/>需要實際操作（開對話框/切分頁）時，卡片擋到就按右上<strong>「－」縮小</strong>騰出空間，完成後「展開」繼續。隨時可略過。</> },
      { route: "/settings", target: "settings-tab-currency", advanceOn: "click", title: "① 開啟「幣別與匯率」分頁", body: <>系統設定上方這排分頁，點圈起來的<strong>「幣別與匯率」</strong>。</> },
      { route: "/settings", target: "fx-enable-toggle", advanceOn: "click", title: "② 打開「啟用多幣別」", body: <>點這個開關<strong>啟用多幣別</strong>。啟用前全站沒有任何外幣欄位；啟用後下方才會出現維護中心。</> },
      { route: "/settings", target: "currency-center", title: "③ 新增幣別", body: <>在維護中心上半：填代碼（如 <strong>USD</strong>）、名稱、符號 →「<strong>新增幣別</strong>」。停用的幣別只是不出現在指派下拉，既有資料照算。新增好按「下一步」看匯率。</> },
      { route: "/settings", target: "fx-rate-table", title: "④ 設定匯率（重要）", body: <>在「<strong>匯率（對台幣）</strong>」區：先選<strong>匯率月份</strong>，再輸入 1 USD＝多少台幣（如 <strong>32</strong>）。台幣約當＝外幣×匯率。<br/><strong>未設匯率＝該幣別當期台幣約當以 0 計</strong>（原幣別金額仍會記錄與顯示，只是約當 0），旁邊會顯示<strong>「未設匯率」</strong>標記；<strong>設好匯率後才看得到台幣約當</strong>。是逐月維護，每月各設一次。</> },
      { route: "/master", target: "master-tabs", title: "⑤ 給員工設定外幣（需操作）", body: <>到<strong>基本資料</strong>：點員工→「薪資結構調整」設「固定每月外幣」；或用<strong>「批次薪資 → 外幣薪資」</strong>對整個部門一次發放。<br/>操作對話框被擋住時，按卡片右上<strong>「－」縮小</strong>，做完再展開標記。</> },
      { route: "/payroll/monthly", target: "period-picker", title: "⑥ 月結查看（需操作）", body: <>回<strong>薪資結算</strong>：員工「編輯」對話框可<strong>逐月覆寫</strong>外幣並看台幣約當；查核頁多一欄<strong>「外幣(折台)」</strong>。台幣實發不含外幣。<br/>要開對話框確認時，先「－」縮小本卡。</> },
      { route: "/reports", target: "report-period", title: "⑦ 報表與薪資條", body: <>報表的<strong>「外幣給付彙總」</strong>卡與薪資條的<strong>「外幣給付」</strong>區塊，都與台幣核心<strong>分開呈現</strong>、不併入應發/成本。（切子分頁查看時可先「－」縮小本卡。）導覽完成！</> },
    ],
  },

  version: {
    id: "version",
    title: "法定費率生效月版本（驗收導覽）",
    audience: "acceptance",
    summary: "已確認月鎖定就地編輯 → 新增「自某月生效」的版本 → 改費率只影響該月之後。",
    steps: [
      { title: "生效月版本化導覽", body: <>示範「改費率不回溯改動已申報月份」。核心：已有已確認月時，法定參數不可就地改，只能<strong>新增自某月起生效的版本</strong>。</> },
      { route: "/settings", target: "settings-tab-legal", advanceOn: "click", title: "① 進「法定參數」分頁", body: <>點圈起來的<strong>「法定參數」</strong>分頁。若示範公司已有已確認月份，下方費率欄會顯示<strong>鎖頭</strong>（不可就地改）。</> },
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
      { route: "/master", target: "master-emp-list", advanceOn: "click", title: "① 開啟員工檔案", body: <>在<strong>員工清單</strong>點任一員工（列）開啟檔案面板，稍後於「資料維護」按<strong>「調職／部門異動」</strong>。</> },
      { route: "/master", requireUnconfirmed: true, title: "② 改部門並理解鎖定", body: <>改部門/成本中心→填<strong>異動原因</strong>→送出。<br/>若當月<strong>已確認結算</strong>，此情境會被<strong>鎖定</strong>（欄位唯讀），需先到「查核與確認」取消確認——防止期中調職回溯改動已凍結的成本分攤。<br/>（純聯絡資料改姓名/Email 則走「聯絡與識別」情境、不受鎖。）導覽完成！</> },
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
      { route: "/settings", target: "settings-tab-data", advanceOn: "click", title: "② 進「資料與安全」分頁", body: <>點圈起來的<strong>「資料與安全」</strong>分頁，看危險操作怎麼被隔離。</> },
      { route: "/settings", target: "settings-danger", title: "③ 危險操作隔離", body: <>最下方<strong>紅框「危險操作」</strong>區（載入示範公司／清空員工資料）與上方「從備份還原」<strong>刻意分開</strong>，且改用紅色警示樣式，避免把「載入示範」誤當「還原備份」而覆蓋真實資料。導覽完成！</> },
    ],
  },

  fxtax: {
    id: "fxtax",
    title: "外幣計所得稅（驗收導覽）",
    audience: "acceptance",
    summary: "開啟「外幣計所得稅」→ 外幣視作獎金：薪資條給建議代扣、年度扣繳憑單多一欄外幣應稅，台幣核心不受影響。",
    steps: [
      { title: "外幣計所得稅導覽", body: <>驗收「外幣併入所得稅」：開關開啟時，外幣台幣約當<strong>視作獎金</strong>→薪資條顯示建議代扣、年度扣繳憑單多一欄，<strong>但台幣應發/應稅完全不受影響</strong>（獨立呈現）。逐步標「通過/有問題」，最後可複製報告回報。</> },
      { route: "/settings", target: "settings-tab-currency", advanceOn: "click", title: "① 進「幣別與匯率」分頁", body: <>點圈起來的<strong>「幣別與匯率」</strong>分頁。（需先啟用多幣別、設好 USD 匯率並給某員工外幣，才看得到後續數字。）</> },
      { route: "/settings", target: "fx-incometax-toggle", title: "② 開啟「外幣計所得稅」", body: <>打開這顆開關。關閉＝外幣完全不進所得稅；開啟＝外幣視作獎金併入代扣稅建議與扣繳憑單。確認開關可切換、狀態正確。</> },
      { route: "/reports", target: "filing-withholding", title: "③ 年度扣繳憑單：外幣獨立欄", body: <>到<strong>報表與申報 → 年度申報 → 年度扣繳憑單</strong>：開啟政策後多一欄<strong>「外幣應稅(折台)」</strong>，且「全年應發/應稅」<strong>不含</strong>外幣。薪資條的外幣區塊也會顯示「視作獎金／建議代扣」。導覽完成！</> },
    ],
  },

  durability: {
    id: "durability",
    title: "資料備份健康度（驗收導覽）",
    audience: "acceptance",
    summary: "側邊欄備份指示＋工作台提醒卡＋離開前提醒＋容量告警：純前端資料易失的防護。",
    steps: [
      { title: "資料備份健康度導覽", body: <>純前端資料只存在本機瀏覽器、清除即遺失。驗收這層防護：<strong>側邊欄備份指示、工作台備份提醒、匯出後消警、離開前提醒</strong>。</> },
      { route: "/", target: "backup-indicator", mobileTarget: "sidebar-toggle", title: "① 側邊欄備份指示", body: <>側邊欄底部常駐<strong>備份狀態</strong>：「今日已備份／N 天前／尚未備份」，過久轉琥珀警示，點擊直達備份分頁。確認顯示正確。</> },
      { route: "/", target: "backup-reminder", title: "② 工作台備份提醒卡", body: <>距上次備份過久或從未備份且有未備份變更時，工作台跳<strong>琥珀提醒卡</strong>。點<strong>「立即匯出備份」</strong>會下載 JSON，<strong>之後提醒消失、側欄轉「今日已備份」</strong>。確認這條動線。<br/>（若卡片沒出現＝目前已無未備份變更，屬正常。）</> },
      { route: "/settings", target: "settings-tab-data", advanceOn: "click", title: "③ 資料分頁：匯出/還原", body: <>點<strong>「資料與安全」</strong>分頁：可手動「匯出備份檔」與「從備份檔還原」；換機/清瀏覽器後用備份檔還原，外幣設定、費率版本史都會完整回來。導覽完成！</> },
    ],
  },

  brackets: {
    id: "brackets",
    title: "投保級距受管編輯（驗收導覽）",
    audience: "acceptance",
    summary: "投保級距可編輯：逐格改／CSV 整表匯入／V13 擋錯；已確認月走「新增生效版本」不回溯。",
    steps: [
      { title: "投保級距受管編輯導覽", body: <>年度基本工資調整時更新投保級距。驗收：<strong>逐格編輯、CSV 整表匯入、範本下載、V13 擋錯、已確認月改用「新增生效版本」</strong>。</> },
      { route: "/settings", target: "settings-tab-legal", advanceOn: "click", title: "① 進「法定參數」分頁", body: <>點圈起來的<strong>「法定參數」</strong>分頁，下方有「投保級距表（檢視／編輯）」卡。</> },
      { route: "/settings", target: "bracket-edit", title: "② 編輯級距（逐格／CSV／版本）", body: <>展開<strong>「投保級距表（檢視／編輯）」</strong>卡→點<strong>「編輯級距」</strong>：可分頁逐格改、<strong>「匯入 CSV」</strong>整表換版、<strong>「下載目前級距 CSV」</strong>當範本；把某級改成比前一級小會<strong>紅字擋存（V13）</strong>；示範公司有已確認歷史月，儲存時走<strong>「新增自 YYYY-MM 起生效版本」</strong>、不回溯。逐項確認後標記。導覽完成！</> },
    ],
  },

  overview: {
    id: "overview",
    title: "系統總覽（新手上手）",
    audience: "onboarding",
    summary: "認識側邊欄分區、工作台待辦，與「每月固定做哪兩件事」。",
    next: "monthly",
    nextLabel: "接著看：每月結算 →",
    steps: [
      { route: "/", title: "歡迎！系統總覽", body: <>用兩分鐘帶你認識主要功能與動線。這套系統依台灣法規，把勞健保/勞退/二代健保/所得稅到薪資條一次算完。</> },
      { route: "/", target: "sidebar", mobileTarget: "sidebar-toggle", title: "① 側邊欄＝功能地圖", body: <>左側分區：<strong>每月作業</strong>（工作台/薪資結算）、<strong>規劃與分析</strong>、<strong>報表與申報</strong>、<strong>主檔與設定</strong>。跟著側邊欄就能找到所有功能。<br/>（手機版收在左上角<strong>選單鈕</strong>裡——就是圈起來這顆。）</> },
      { route: "/", target: "workbench-todos", title: "② 工作台＝本月待辦一頁看", body: <>首頁把本月要處理的事聚合成待辦卡——資料檢查、未填代扣稅、加退保、排程調薪——<strong>點卡片直達</strong>處理位置。</> },
      { route: "/", title: "③ 每月固定兩件事", body: <>① <strong>薪資結算</strong>：輸入異動→查核確認。② <strong>報表與申報</strong>：印薪資條、跑扣繳/繳費/加退保名冊。<br/>其餘（基本資料、系統設定）平時不太需要動。<br/>接著建議看「每月結算兩步」——按下方<strong>「接著看」</strong>直接續。</> },
    ],
  },

  monthly: {
    id: "monthly",
    title: "每月結算兩步（新手上手）",
    audience: "onboarding",
    summary: "薪資結算輸入異動 → 查核 → 確認凍結。",
    next: "master",
    nextLabel: "接著看：主檔情境 →",
    steps: [
      { title: "每月結算兩步", body: <>每月固定：<strong>①輸入異動 → ②查核確認</strong>。固定薪資與四項保費系統已自動算好，你只補「變動」的部分。</> },
      { route: "/payroll/monthly", target: "period-picker", title: "① 選發薪月份", body: <>先選<strong>發薪月份</strong>。表格會列出全體員工的自動試算；沒有異動的人<strong>完全不用動</strong>。</> },
      { route: "/payroll/monthly", target: "row-edit", title: "② 只編輯有異動的人", body: <>每一列右側都有這顆<strong>「編輯」</strong>鈕（這裡圈第一列示意）。對「有加班／請假／獎金／需代扣稅」的人按它→填當月異動→看即時試算（應發/代扣/實發）→送出前看變更摘要→儲存。沒異動的人不用動。看完按「下一步」。</> },
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
      { route: "/master", target: "master-emp-list", advanceOn: "click", title: "① 員工清單 → 挑情境", body: <>在<strong>「員工清單」</strong>點任一員工（列）開啟檔案面板，依要辦的事選情境按鈕（人員異動／資料維護兩組）。</> },
      { route: "/master", requireUnconfirmed: true, title: "② 填該情境欄位＋原因", body: <>選情境後只出現<strong>相關欄位</strong>＋必填<strong>「異動原因」</strong>；送出前<strong>「變更摘要」</strong>看舊→新、可逐欄還原。送出即記一筆稽核。<br/>（計薪相關情境於當月已確認時會被鎖，需先取消確認；純聯絡資料不受限。）</> },
      { route: "/master", target: "master-tabs", title: "③ 異動紀錄可查可回復", body: <>第三個分頁<strong>「異動紀錄」</strong>可搜尋所有異動（員工/情境/原因），並對可回復者按「回復」。導覽完成！</> },
    ],
  },
};

export const TOUR_LIST = Object.values(TOURS);
