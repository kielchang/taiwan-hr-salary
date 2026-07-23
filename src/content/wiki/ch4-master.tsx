import type { WikiChapter } from "./types";
import { Callout } from "@/components/ui/callout";

/** 第4章 基本資料維護 — 正式內容（section id 為深連結契約、不可改名）。 */
export const ch_master: WikiChapter = {
  id: "master",
  num: 4,
  title: "基本資料維護",
  intro: <>員工資料採「情境申請單」：挑情境、只填該情境欄位、必填原因、留稽核可回復。本章依情境逐一說明操作步驟。</>,
  sections: [
    {
      id: "scenarios",
      title: "情境申請單總覽",
      keywords: ["情境", "申請單", "異動原因", "員工檔案", "送出異動", "鎖定"],
      body: (
        <>
          <p>
            本系統不用「一張大表單改全部」，而是<strong>情境化申請單</strong>：在「基本資料」的<strong>員工清單</strong>點任一員工開啟檔案面板，
            依要辦的事挑情境——人員異動類（<strong>留停／停職／暫離</strong>、<strong>復職</strong>、<strong>離職</strong>）與資料維護類
            （<strong>薪資結構調整</strong>、<strong>調職／部門異動</strong>、<strong>眷屬異動</strong>、<strong>扣繳設定</strong>、<strong>聯絡與識別</strong>）。
          </p>
          <ol>
            <li>點員工列開啟檔案面板，按情境按鈕進入聚焦表單（只顯示該情境欄位）。</li>
            <li>填欄位——變更會標色，下方「送出前確認變更」逐筆列出舊值→新值，可逐筆還原。</li>
            <li>填<strong>異動原因</strong>（必填）→按<strong>送出異動</strong>。每筆異動都留下含情境與原因的稽核紀錄，多數可回復。</li>
          </ol>
          <Callout variant="warning" title="已確認月份會鎖定計薪情境">
            當月結算已確認時，人員異動、薪資、眷屬、扣繳、調職等計薪相關情境一律鎖定，僅「聯絡與識別」可修改；
            要改須先到「每月作業 → 查核與確認」取消確認。
          </Callout>
        </>
      ),
      actions: [
        { label: "前往基本資料", to: "/master" },
        { label: "啟動導覽：主檔情境", tour: "master" },
      ],
    },
    {
      id: "onboard",
      title: "新進到職",
      keywords: ["到職", "新增員工", "加保", "預設薪資", "新進到職", "員工編號"],
      body: (
        <>
          <p>新進員工由右上角<strong>新進到職</strong>按鈕建立，一張申請單填完基本資料、固定薪資與眷屬扣繳。</p>
          <ol>
            <li>按<strong>新進到職</strong>，填<strong>員工編號</strong>與<strong>姓名</strong>（必填），再填部門、職稱、<strong>到職日</strong>。</li>
            <li>填「固定薪資項目」——若已在系統設定建好新進預設（如伙食津貼 3,000），表單會自動帶入，只需微調本薪。</li>
            <li>視需要填「眷屬與扣繳」，填<strong>異動原因</strong>（例：新進到職報到）→按<strong>建立員工</strong>。</li>
          </ol>
          <ul>
            <li>到職日決定年資、特休與到職當月破月比例（固定薪資按在職天數計）。</li>
            <li>到職後該員會出現在申報名冊的「加保」清單，記得向勞健保單位辦理加保。</li>
          </ul>
          <Callout variant="info" title="身分證字號有兩個用途">
            除識別外，也是薪資條加密 PDF 的開啟密碼（英文字母大寫），建議建檔時即填妥。
          </Callout>
        </>
      ),
    },
    {
      id: "offboard-leave",
      title: "離職與留停/停職/暫離",
      keywords: ["離職", "留停", "停職", "暫離", "復職", "區間", "給薪比例", "退保"],
      body: (
        <>
          <p>
            <strong>離職</strong>：開啟員工檔案按<strong>離職</strong>，填<strong>離職日</strong>→送出。薪資計至離職日（含）、
            當月固定薪資按在職天數破月，並列入申報名冊的退保清單。
          </p>
          <p>
            <strong>留停／停職／暫離</strong>：按<strong>留停／停職／暫離</strong>登記一段非在職區間，每段各有
            <strong>類別</strong>、<strong>生效日</strong>、<strong>復職日（空＝尚未復職）</strong>與<strong>給薪比例</strong>
            （可<strong>沿用公司政策</strong>，或逐案改無給 0%／半薪 50%／全薪 100%）。破月計薪與停保／復保名冊皆逐段計算。
          </p>
          <ol>
            <li>按情境按鈕後，於「區間紀錄」按<strong>新增區間</strong>，選類別、填生效日與給薪比例。</li>
            <li>員工回來上班時改辦<strong>復職</strong>：補填該段復職日→送出，之後自動恢復在職與全額計薪。</li>
            <li>同一員工可登記多段（例如多次留停），歷史各段完整保留。</li>
          </ol>
          <Callout variant="warning" title="停保/復保為提醒性質">
            名冊會列出應辦停保／復保的人員供人工向勞健保單位辦理，系統不會自動改保費（如留停期間健保續保自費，依公司規定處理）。
          </Callout>
        </>
      ),
    },
    {
      id: "salary-structure",
      title: "薪資結構與自訂津貼",
      keywords: ["本薪", "津貼", "伙食津貼", "自訂津貼", "投保級距", "月薪資總額", "薪資結構調整"],
      body: (
        <>
          <p>
            開啟員工檔案按<strong>薪資結構調整</strong>。固定薪資分 8 項標準給付：<strong>本薪</strong>、<strong>主管加給</strong>、
            <strong>職務加給</strong>、<strong>專業／技術加給</strong>、<strong>伙食津貼</strong>、<strong>交通津貼（固定）</strong>、
            <strong>全勤獎金</strong>、<strong>其他固定津貼</strong>；8 項之外可按<strong>新增津貼</strong>建立
            <strong>自訂固定津貼</strong>（自行命名，如語言津貼、值班津貼）。
          </p>
          <ul>
            <li>以上各項皆屬工資，加總＝<strong>月薪資總額</strong>；表單下方即時顯示總額與依級距自動查得的勞保／職保／健保／勞退投保金額。</li>
            <li>伙食津貼 3,000 元內免稅，但仍計入投保級距。</li>
            <li>總額低於最低工資時會出現紅色警示，請調整後再送出。</li>
          </ul>
          <p>例：本薪 42,000＋伙食津貼 3,000＋全勤獎金 2,000＝月薪資總額 47,000，投保級距即按 47,000 查表。</p>
          <Callout variant="info" title="月薪資總額決定投保級距">
            調整任何固定給付都會改變月薪資總額、進而可能跳級距——調薪後請到報表的「級距調整建議」確認是否需向勞健保單位申報調整。
          </Callout>
        </>
      ),
      actions: [{ label: "法規依據", to: "/sources" }],
    },
    {
      id: "dependents-tax",
      title: "眷屬與扣繳設定",
      keywords: ["眷屬", "依附健保", "報稅扶養", "扣繳", "免稅額申報表", "勞退自提", "非居住者"],
      body: (
        <>
          <p>
            <strong>眷屬異動</strong>：按<strong>新增眷屬</strong>填姓名與關係，每位眷屬有兩個獨立勾選——
            <strong>依附健保</strong>（影響員工自付健保費，<strong>最多計 3 口</strong>，超過仍以 3 口計費）與
            <strong>報稅扶養</strong>（影響所得稅起扣點）。兩者用途不同、可分開勾，例如子女依附配偶健保但由本人報稅扶養時，只勾「報稅扶養」。
          </p>
          <p><strong>扣繳設定</strong>情境含四個欄位：</p>
          <ul>
            <li><strong>稅務身分</strong>：該年度在台滿 183 天為<strong>居住者</strong>；非居住者按 6%／18% 扣繳。</li>
            <li><strong>每月扣繳方式</strong>（居住者）：<strong>固定 5%</strong> 或<strong>依扣繳稅額表（查表）</strong>，由員工在免稅額申報表勾選。</li>
            <li><strong>免稅額申報表收件日</strong>：未收件者依規定按固定 5% 扣繳；員工清單會標示「免稅額申報表未收」提醒。</li>
            <li><strong>勞退自願提繳率</strong>：0～6%，自提金額免稅、從薪資中代扣。</li>
          </ul>
        </>
      ),
      actions: [{ label: "法規依據", to: "/sources" }],
    },
    {
      id: "batch-salary",
      title: "批次薪資與區間補貼",
      keywords: ["批次調整", "調薪", "定額", "區間補貼", "排程", "外幣薪資", "族群"],
      body: (
        <>
          <p>
            對整個部門或全公司調薪不必逐員操作：切到<strong>批次薪資</strong>分頁，先在「適用族群」選<strong>全公司</strong>／
            <strong>依部門</strong>／<strong>依成本中心</strong>，再依需求用四個分頁：
          </p>
          <ul>
            <li><strong>批次調整</strong>：<strong>調整既有項目</strong>（8 項擇一，加／減／設為，量可選<strong>定額（元）</strong>、<strong>本薪 %</strong>、<strong>月薪資總額 %</strong>）或<strong>新增固定津貼</strong>（命名建立自訂津貼）。預覽表列出每人調整前後總額與增減，低於最低工資者標紅。</li>
            <li><strong>區間補貼</strong>：限定起訖月的每月加發（如專案津貼），須選<strong>是否計入投保薪資</strong>——「計入投保」會墊高月薪資總額、影響級距與加班時薪；「只加發」僅加入當月實發、不動級距。訖月後自動停發。</li>
            <li><strong>排程</strong>：<strong>生效月份</strong>選未來月即存為排程，到期後在此按<strong>套用</strong>寫回薪資結構。</li>
            <li><strong>外幣薪資</strong>：啟用幣別與匯率後出現，對族群發放／調整固定每月外幣（與台幣分開計、不動投保）。</li>
          </ul>
          <ol>
            <li>選族群→設定操作→核對預覽表。</li>
            <li>填<strong>異動原因</strong>與<strong>生效月份</strong>→按<strong>立即套用</strong>或<strong>排程套用</strong>。</li>
          </ol>
        </>
      ),
      actions: [{ label: "前往批次薪資", to: "/master?tab=batch" }],
    },
    {
      id: "import",
      title: "CSV 批次匯入",
      keywords: ["匯入", "CSV", "模板", "驗證", "預覽", "批次匯入"],
      body: (
        <>
          <p>初次導入或整批建檔時，用 CSV 一次匯入多名員工與其固定薪資。</p>
          <ol>
            <li>按右上角<strong>匯入模板</strong>下載「員工匯入模板.csv」，內含欄位標題與一列範例。</li>
            <li>用 Excel 或試算表軟體照範例逐列填入員工資料（編號、姓名、到職日、稅務身分、各項固定薪資等），存成 CSV。</li>
            <li>按<strong>批次匯入</strong>選檔，系統開啟預覽視窗逐列驗證：可匯入筆數、<strong>錯誤</strong>（需修正後重匯）與<strong>提醒</strong>（如低於最低工資）分色標示。</li>
            <li>確認無誤後按<strong>確認匯入</strong>；有任何錯誤列時按鈕會停用，請修正 CSV 後重新選檔。</li>
          </ol>
          <Callout variant="danger" title="同編號會覆蓋既有員工">
            匯入時若 CSV 內的員工編號已存在，該員資料會被整筆覆蓋且無法自動回復。匯入前請先確認編號不重複，或確定就是要更新該員。
          </Callout>
        </>
      ),
    },
    {
      id: "audit-log",
      title: "異動紀錄與回復操作",
      keywords: ["異動紀錄", "回復", "稽核", "匯出 CSV", "原因", "操作者"],
      body: (
        <>
          <p>
            <strong>異動紀錄</strong>分頁列出基本資料的每次情境異動：時間、員工、情境、原因、摘要與操作者，
            可用上方搜尋框以員工、情境或原因關鍵字過濾，是回答「這筆薪資是誰、何時、為什麼改的」的第一站。
          </p>
          <ol>
            <li>切到<strong>異動紀錄</strong>分頁，搜尋或依時間排序找到目標紀錄。</li>
            <li>要撤銷某筆變更時按該列<strong>回復</strong>，確認後系統把資料還原成變更前的值，並另記一筆稽核（可追溯回復本身）。</li>
            <li>按<strong>匯出 CSV</strong>可下載全部紀錄，供內外部稽核留存。</li>
          </ol>
          <ul>
            <li>只有逐欄更新類的紀錄可回復；新增、刪除、批次類不提供回復鈕。</li>
            <li>該期已確認鎖定時「回復」會停用，須先取消確認。</li>
          </ul>
        </>
      ),
      actions: [{ label: "查看異動紀錄", to: "/master?tab=log" }],
    },
  ],
};
