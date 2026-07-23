import type { WikiChapter } from "./types";
import { Callout } from "@/components/ui/callout";

/** 第7章 系統設定（section id 為深連結契約、不可改名）。 */
export const ch_settings: WikiChapter = {
  id: "settings",
  num: 7,
  title: "系統設定",
  intro: <>法定參數、公司政策、多幣別與資料安全：年度維護與治理都在這裡。</>,
  sections: [
    {
      id: "legal-params",
      title: "法定費率與金額",
      keywords: ["法定參數", "費率", "最低工資", "健保費率", "勞保", "免稅額", "套用變更", "扣繳"],
      body: (
        <>
          <p>
            「系統設定 → <strong>法定參數</strong>」分頁集中六組政府公告值：<strong>最低工資</strong>、
            <strong>勞保・就保・職保</strong>、<strong>健保與眷屬</strong>、<strong>勞退與補充保費</strong>、
            <strong>工時與伙食</strong>、<strong>所得稅扣繳</strong>。系統已內建 115 年度資料，
            通常每年 1 月依新公告更新一次即可；每個欄位旁都有白話說明。
          </p>
          <ol>
            <li>點要調整的群組（可收合展開），再點<strong>有淡底＋外框的欄位</strong>進入編輯。</li>
            <li>填新值：改過的欄位會標色，尚未真正寫入。</li>
            <li>按頁面底部黏著列的<strong>套用變更（N）</strong>一次套用全部修改；按<strong>全部還原</strong>放棄。</li>
          </ol>
          <Callout variant="info" title="打錯量級會先擋">
            費率或級距明顯有誤（例如健保 5.17% 打成 5）時，頁面頂部會紅字列出問題，在算錯錢之前先擋下。
          </Callout>
          <Callout variant="warning" title="已有已確認月份時不能就地改">
            此時欄位會顯示鎖頭，請改用「新增生效版本」（見本章「新增生效版本操作」節），避免回溯改動已申報月份。
          </Callout>
        </>
      ),
      actions: [{ label: "前往系統設定", to: "/settings" }],
    },
    {
      id: "bracket-editor",
      title: "投保級距編輯（逐格與 CSV）",
      keywords: ["投保級距", "編輯級距", "匯入 CSV", "範本", "V13", "基本工資調整", "分級表"],
      body: (
        <>
          <p>
            系統依「月薪資總額」自動查<strong>投保級距表</strong>決定四種投保金額（例：月薪 36,000 元介於兩級之間，
            取較高一級投保）。年度基本工資調整時在「法定參數」分頁更新級距：
          </p>
          <ol>
            <li>點<strong>投保級距表（檢視／編輯）</strong>卡展開，按<strong>編輯級距</strong>。</li>
            <li>逐格改：切勞保／職保／健保／勞退分頁，逐級修改金額，按<strong>新增級距</strong>補級、垃圾桶刪級。</li>
            <li>整表換版：按<strong>下載目前級距 CSV（範本）</strong>取得格式（每列「保險別,月投保金額」），在 Excel 改好後按<strong>匯入 CSV</strong>整表帶入。</li>
            <li>按<strong>儲存級距</strong>（已有已確認月時按鈕會變成<strong>新增自某月起生效版本</strong>）。</li>
          </ol>
          <Callout variant="info" title="排序錯誤存不進去（V13）">
            級距必須逐級遞增、非空、正值；把某級改得比前一級小會紅字顯示「<strong>級距資料有誤，無法儲存</strong>」。
            存檔時系統也會自動升冪去重，不怕手動順序亂掉。
          </Callout>
        </>
      ),
      actions: [{ label: "啟動導覽：級距編輯", tour: "brackets" }],
    },
    {
      id: "versioning",
      title: "新增生效版本操作",
      keywords: ["生效版本", "生效月", "年度更新", "不回溯", "已確認月份", "版本化"],
      body: (
        <>
          <p>
            已有<strong>已確認月份</strong>時，法定參數與投保級距不能直接就地修改——直接改會回溯改寫已申報月份的數字。
            此時要「<strong>新增生效版本</strong>」：新費率自指定月份起生效，先前月份維持原值，扣繳與報表逐月各取其版本。
          </p>
          <ol>
            <li>到「法定參數」分頁，找到黃色提示卡「已有已確認月份 → 法定參數改用『新增生效版本』」。</li>
            <li>選生效月份（<strong>須晚於最後已確認月</strong>），按<strong>新增生效版本</strong>——新版本先複製自最新值。</li>
            <li>下方費率欄位解鎖，填入新年度數字，按<strong>套用變更</strong>。</li>
            <li>驗證：到「薪資結算」切換月份，生效月之後用新費率、之前的已確認月數字不變。</li>
          </ol>
          <Callout variant="info" title="級距也是同一套規則">
            投保級距編輯器在儲存時會自動判斷：無已確認月＝就地更新；有＝要求選生效月、按<strong>新增自某月起生效版本</strong>。
          </Callout>
        </>
      ),
      actions: [{ label: "啟動導覽：生效月版本", tour: "version" }],
    },
    {
      id: "company-policy",
      title: "公司政策與新進預設",
      keywords: ["職業災害保險費率", "年資", "特休", "固定基準日", "週年制", "給薪比例", "新進預設", "自訂津貼"],
      body: (
        <>
          <p>
            「<strong>公司</strong>」分頁是貴公司自己的專屬設定，與法規公告無關：
          </p>
          <ul>
            <li><strong>職業災害保險費率</strong>：每家公司不同，依勞保局核定通知書填寫（全產業平均約 0.21%），由公司全額負擔。</li>
            <li><strong>年資／特休計算方式</strong>：選<strong>固定基準日</strong>（全體以同一個每年重複的月/日計算，曆年制常用，如統一設 1/1）或<strong>依到職日（週年制）</strong>（各員依到職日算實際年資，特休隨週年逐年增加）。只影響年資與特休顯示，不影響薪資計算。</li>
            <li><strong>非在職狀態給薪比例</strong>：留停／停職／暫離期間的公司預設給薪比例（0＝無給、50＝半薪、100＝全薪）；員工檔案可逐案覆寫。</li>
            <li><strong>新進員工預設固定薪資／津貼</strong>：設定常用範本（例：伙食津貼 3,000 元），在「基本資料 → 新增員工」時自動帶入，可再逐人調整；也可加<strong>自訂津貼範本</strong>（如語言、值班津貼）。</li>
          </ul>
          <Callout variant="info" title="編輯方式相同">
            這些卡片同樣是點欄位編輯、改完按<strong>套用變更</strong>；本月已確認結算時會鎖定，先取消確認才能修改。
          </Callout>
        </>
      ),
      actions: [{ label: "前往系統設定", to: "/settings" }],
    },
    {
      id: "currency-fx",
      title: "多幣別與匯率",
      keywords: ["多幣別", "外幣", "匯率", "USD", "幣別與匯率", "獨立金流", "外幣計所得稅", "補充保費"],
      body: (
        <>
          <p>
            「<strong>幣別與匯率</strong>」分頁＝<strong>幣別與匯率維護中心</strong>。外幣薪資與台幣
            <strong>分開計算、視作獎金</strong>，是獨立金流：<strong>永不納入投保級距與勞健保</strong>，
            台幣應發／實發也完全不受影響。
          </p>
          <ol>
            <li>按<strong>啟用多幣別</strong>開關（預設關＝全站不顯示外幣欄位、計算完全不含外幣）。</li>
            <li>新增幣別：填<strong>代碼</strong>（如 USD）、<strong>名稱</strong>、<strong>符號</strong>、<strong>小數位</strong>，按<strong>新增幣別</strong>；不用的幣別可<strong>停用</strong>。</li>
            <li>維護匯率：在<strong>匯率（對台幣）</strong>區選月份，逐幣別填「1 USD = 幾元」——匯率是逐月維護的。</li>
            <li>視公司政策決定兩顆開關：<strong>外幣計所得稅</strong>（開＝台幣約當併入獎金代扣建議與扣繳憑單）、<strong>外幣計二代健保補充保費</strong>（開＝併入補充保費基數）。兩者預設皆關。</li>
          </ol>
          <Callout variant="warning" title="未設匯率＝台幣約當以 0 計">
            某期沒填匯率時，該幣別當期會標「<strong>未設匯率</strong>」、台幣約當以 0 計（原幣別金額仍記錄）。發外幣前先確認當期匯率已填。
          </Callout>
        </>
      ),
      actions: [
        { label: "啟動導覽：多幣別", tour: "fx" },
        { label: "啟動導覽：外幣計所得稅", tour: "fxtax" },
      ],
    },
    {
      id: "data-safety",
      title: "資料與安全",
      keywords: ["備份", "還原", "匯出備份檔", "操作者姓名", "稽核", "回復", "危險操作", "版本"],
      body: (
        <>
          <p>
            資料只存在這台電腦的瀏覽器，清除瀏覽器資料即遺失。「<strong>資料與安全</strong>」分頁由上而下四塊：
          </p>
          <ul>
            <li><strong>資料備份與還原</strong>：按<strong>匯出備份檔（JSON）</strong>另存全部資料（建議每月結算後匯出；薪資資料依法應保存五年）——匯出會記錄備份時間，側邊欄備份指示與工作台提醒隨之消警。按<strong>從備份檔還原</strong>時，系統先列出備份匯出時間、員工與結算筆數，<strong>確認後才覆蓋</strong>目前資料。</li>
            <li><strong>操作者與變更紀錄</strong>：填<strong>操作者姓名（稽核用）</strong>後，薪資／員工／月結／還原等敏感變更都留下「誰、何時、改什麼」；可按<strong>匯出紀錄 CSV</strong> 存查，逐欄修改類的紀錄可按<strong>回復</strong>還原成變更前的值（已確認月份鎖定不可回復）。</li>
            <li><strong>示範與重置（危險操作）</strong>：紅框區的<strong>載入示範公司（覆蓋現有資料）</strong>與<strong>清空員工資料</strong>會覆蓋或清除資料，刻意與「從備份檔還原」分開放，避免誤按。</li>
            <li><strong>關於 / 版本</strong>：顯示<strong>系統版本</strong>、<strong>版本識別（commit）</strong>與<strong>建置時間</strong>；回報問題時附上這些資訊最準。</li>
          </ul>
          <Callout variant="danger" title="紅框操作無法復原">
            危險操作區的動作一經確認即覆蓋或清除、<strong>無法復原</strong>；要保留現有資料，請先<strong>匯出備份檔</strong>再操作。
          </Callout>
        </>
      ),
      actions: [
        { label: "前往資料與安全", to: "/settings?tab=data" },
        { label: "啟動導覽：備份健康度", tour: "durability" },
      ],
    },
  ],
};
