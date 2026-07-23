import type { WikiChapter } from "./types";
import { Callout } from "@/components/ui/callout";
import { FEATURES } from "@/config/features";

/** 第1章 快速上手（section id 為深連結契約、不可改名）。 */
export const ch_quickstart: WikiChapter = {
  id: "quickstart",
  num: 1,
  title: "快速上手",
  intro: <>第一次使用從這裡開始：初始設定、認識畫面骨架、發薪月份與工作台。</>,
  sections: [
    {
      id: "setup-wizard",
      title: "初始設定精靈（五步）",
      keywords: ["初始設定", "精靈", "載入範例公司", "從空白開始", "薪資結構預設", "伙食津貼", "職災費率"],
      body: (
        <>
          <p>
            第一次開啟系統會自動進入初始設定，共五步：<strong>歡迎 → 公司設定 → 薪資結構預設 → 員工資料 → 完成</strong>。
            115 年度的法定費率與投保級距已內建，只需要補上與貴公司有關的少數設定。
          </p>
          <ol>
            <li>選入門路徑：按<strong>載入範例公司體驗</strong>（8 名範例員工，先熟悉操作）或<strong>從空白開始建立</strong>（直接建自己的資料）。</li>
            <li>填<strong>公司設定</strong>三項：<strong>本次要結算的發薪月份</strong>、<strong>職業災害保險費率（%）</strong>（依勞保局核定通知書填；不確定可先用全產業平均 0.21%）、<strong>年資與特休的計算方式</strong>（<strong>依到職日（週年制）</strong>或<strong>固定基準日</strong>）。</li>
            <li>填<strong>公司薪資結構預設</strong>：新進員工建檔時自動帶入的固定津貼，<strong>伙食津貼</strong>已預帶 3,000（每月 3,000 元內免稅），可改或留空。</li>
            <li>建員工：空白模式在<strong>新增第一批員工</strong>填員工編號、姓名、部門、到職日與月薪（本薪，例如 35,000）後按<strong>加入</strong>；也可先跳過，之後在「基本資料」補。</li>
            <li>按<strong>開始使用</strong>完成設定，之後不會再進入精靈。</li>
          </ol>
          <Callout variant="warning" title="從空白開始＝清空現有資料">
            在第一步選<strong>從空白開始建立</strong>會清空目前系統內的所有資料；若已經有輸入過的員工或薪資，請先到「系統設定」匯出備份再重跑。
          </Callout>
          <Callout variant="info" title="之後都能改">
            精靈填過的每一項（費率、年資基準、津貼預設）之後都能在「系統設定」調整；也可在「使用說明」頁按<strong>重新執行初始設定引導</strong>重跑精靈。
          </Callout>
        </>
      ),
      actions: [{ label: "重新執行初始設定", to: "/settings" }],
    },
    {
      id: "shell",
      title: "畫面骨架：側邊欄與頂部狀態列",
      keywords: ["側邊欄", "狀態列", "徽章", "待處理", "已確認", "環境", "選單", "抽屜"],
      body: (
        <>
          <p>
            左側<strong>側邊欄</strong>依工作領域分區：<strong>每月作業</strong>（工作台、薪資結算）、<strong>規劃與分析</strong>（薪酬分析）、
            <strong>報表與申報</strong>、<strong>主檔與設定</strong>（基本資料、系統設定）、<strong>說明</strong>（使用說明、操作手冊、法規依據）。
            選單項目的小徽章標示性質：<strong>例行</strong>＝每月必做、<strong>試算</strong>＝沙盒模擬、不寫回實際薪資。
            {!FEATURES.attendance || !FEATURES.projects ? (
              <>（「出勤打卡」「專案」功能目前未啟用，選單不顯示。）</>
            ) : null}
          </p>
          <p>頂部<strong>狀態列</strong>由左至右：</p>
          <ul>
            <li>系統名稱旁若出現 <strong>STAGE</strong>／<strong>DEV</strong> 徽章＝目前在預覽或開發環境；正式站不顯示徽章。</li>
            <li><strong>導引</strong>按鈕：進「使用說明」啟動互動導覽。</li>
            <li><strong>本月：</strong>目前結算中的發薪月份（見下一節）。</li>
            <li>資料狀態徽章：有錯誤時顯示紅色「<strong>N 項待處理</strong>」，否則綠色「<strong>資料正常</strong>」。</li>
            <li>月結狀態徽章：<strong>已確認</strong>（本月結算已凍結）或<strong>未確認</strong>。</li>
          </ul>
          <Callout variant="info" title="手機/平板操作">
            窄螢幕時側邊欄收成抽屜：按左上角<strong>選單</strong>按鈕從左側滑出，點背景即可關閉。
          </Callout>
        </>
      ),
    },
    {
      id: "period",
      title: "發薪月份：全站共用的期間概念",
      keywords: ["發薪月份", "期間", "切月", "本月", "檢視月份", "已確認"],
      body: (
        <>
          <p>
            整套系統以「<strong>發薪月份</strong>」為單位運作，全站共用同一個「本月」：工作台待辦、薪資結算、查核確認、
            報表與申報，看的都是頂部狀態列<strong>本月：</strong>顯示的那個月份。切換月份會同步影響所有頁面——
            包括各項法定費率也依該月份取「當時生效的版本」，改費率不會回頭污染歷史月份。
          </p>
          <ul>
            <li>切月位置：在「薪資結算」頁的月份選擇器改，或在「報表與申報」頁頂部的月份選擇器改；兩處改的是同一個全域月份。</li>
            <li>切到過去月份＝查歷史；切到未來月份＝提前準備下一期。</li>
          </ul>
          <Callout variant="warning" title="已確認的月份是凍結的">
            某月按過「確認本月結算」後，該月資料即鎖定：薪資、異動、眷屬、參數都改不動（畫面會提示「先取消確認」）。
            要修改必須先在「結算查核」頁取消該月確認，改完再重新確認。
          </Callout>
        </>
      ),
    },
    {
      id: "dashboard",
      title: "工作台：本月待辦一頁看",
      keywords: ["工作台", "待辦", "首頁", "排程調薪", "備份提醒", "待辦卡", "匯出備份"],
      body: (
        <>
          <p>
            <strong>本月工作台</strong>（首頁）把「這個月還欠什麼」集中成待辦卡，每張卡＝數字＋說明＋一鍵直達處理位置；
            全部歸零時卡片轉綠、顯示「目前沒有待辦」。七張待辦卡：
          </p>
          <ul>
            <li><strong>資料檢查錯誤</strong>／<strong>檢查警告</strong>：錯誤未排除前無法確認月結；警告是建議確認的提醒。</li>
            <li><strong>未填代扣所得稅</strong>：需查稅額表或帶入建議值的人數。</li>
            <li><strong>本月應加保（新進）</strong>／<strong>本月應退保（離職）</strong>／<strong>本月停保/復保</strong>：依到職、離職與留停/復職日自動列出，點卡直達加退保名冊。</li>
            <li><strong>投保級距需調整</strong>：投保金額與申報基準不一致者，2／8 月辦理調整。</li>
          </ul>
          <p>
            上方另有當期摘要（<strong>結算人數</strong>、<strong>應發總額</strong>、<strong>實發總額</strong>、<strong>公司總成本</strong>）；
            有排程調薪時會出現<strong>排程調薪</strong>卡：到生效月的項目可按<strong>套用</strong>寫回薪資結構（差額套在本薪、留稽核），或按<strong>取消</strong>。
          </p>
          <Callout variant="warning" title="看到備份提醒請立即處理">
            資料只存在這台電腦的瀏覽器，清除瀏覽器資料或換電腦即全部遺失。工作台在太久沒備份時會跳出提醒，
            請按<strong>立即匯出備份</strong>把備份檔另存到安全位置。
          </Callout>
        </>
      ),
      actions: [{ label: "前往工作台", to: "/" }],
    },
    {
      id: "help-resources",
      title: "說明資源地圖：導覽、FAQ、法規",
      keywords: ["使用說明", "導覽", "FAQ", "法規依據", "操作手冊", "互動導引", "常見問題"],
      body: (
        <>
          <p>卡住時，四種說明資源各有用途：</p>
          <ul>
            <li><strong>使用說明</strong>（側邊欄「說明」區）：<strong>互動導引教學</strong>會在畫面上圈出「要點哪裡、輸入什麼、預期看到什麼」一步步帶走；新手建議先走完「新手上手」系列。頁內另有<strong>每月作業三步驟</strong>、<strong>畫面慣例</strong>與<strong>常見問題</strong>（健保費偏高、代扣稅為 0、獎金稅與補充保費等）。</li>
            <li><strong>操作手冊</strong>（本手冊）：完整參考書。左側目錄跳章節，頂部搜尋框可用畫面字樣或俗稱找到對應段落；每節網址可直接複製分享給同事，開啟即定位到該節。</li>
            <li><strong>法規依據</strong>：各項費率、級距與計算規則對應的法條與官方公告出處；手冊與說明中提到的法定數字，以該頁為準。</li>
            <li>各頁標題旁的 <strong>ℹ</strong> 圖示：當下情境的即時提示，不用離開畫面。</li>
          </ul>
          <Callout variant="info" title="建議的求助順序">
            操作類問題先啟動對應「導覽」跟著做一遍；規則類問題查本手冊或 FAQ；要確認法源與數字出處再到「法規依據」。
          </Callout>
        </>
      ),
      actions: [
        { label: "使用說明與FAQ", to: "/help" },
        { label: "啟動導覽：系統總覽", tour: "overview" },
        { label: "法規依據", to: "/sources" },
      ],
    },
  ],
};
