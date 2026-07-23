import type { WikiChapter } from "./types";
import { Callout } from "@/components/ui/callout";

/** 第3章 每月薪資作業（section id 為深連結契約、不可改名）。 */
export const ch_monthly: WikiChapter = {
  id: "monthly",
  num: 3,
  title: "每月薪資作業",
  intro: <>每月固定兩步：輸入異動 → 查核確認。本章逐欄說明異動編輯與確認凍結。</>,
  sections: [
    {
      id: "rhythm",
      title: "每月作業節奏",
      keywords: ["節奏", "流程", "每月", "checklist", "薪資結算", "發薪月份", "例行"],
      body: (
        <>
          <p>
            每月結算走「<strong>薪資結算</strong>」頁的兩步驟精靈：<strong>① 輸入當月異動</strong> →{" "}
            <strong>② 查核與確認</strong>，確認後再到「報表與申報」產出文件。固定薪資與保費系統自動帶入，
            HR 每月實際要動手的只有異動與查核。建議節奏：
          </p>
          <ol>
            <li>選月：確認頁面右上<strong>發薪月份</strong>是本次要結算的月份（旁邊徽章顯示<strong>已確認</strong>／<strong>未確認</strong>）。</li>
            <li>輸入異動：替有加班、請假或獎金的員工按<strong>編輯</strong>補上當月數字（見下節）。</li>
            <li>查核：按<strong>完成輸入，前往查核</strong>，逐一排除<strong>統計查核</strong>列出的紅色錯誤。</li>
            <li>確認：按<strong>確認本月結算</strong>，該月留存快照並凍結。</li>
            <li>報表：按<strong>前往報表與申報</strong>，列印薪資單、產出銀行檔與申報名冊。</li>
          </ol>
          <Callout variant="info" title="大多數員工不用動">
            沒有異動的員工列表會顯示「無異動（固定薪資）」，直接照固定薪資計算，不需要逐人開啟。
          </Callout>
        </>
      ),
      actions: [{ label: "前往薪資結算", to: "/payroll/monthly" }],
    },
    {
      id: "monthly-edit",
      title: "第一步：逐員輸入當月異動",
      keywords: ["異動", "編輯", "薪資結算", "名單", "無異動", "深連結", "固定薪資"],
      body: (
        <>
          <p>
            「輸入當月異動」是一張全員清單：每列顯示員工、<strong>本月異動</strong>摘要（加班時數、事病假、
            獎金、加扣項的小標籤）與即時試算的<strong>應發</strong>／<strong>代扣合計</strong>／<strong>實發</strong>。
            只要替有變動的人按列尾的<strong>編輯</strong>開啟對話框填數字即可，其餘維持固定薪資。
          </p>
          <ul>
            <li>清單上方可用「搜尋姓名／部門…」快速找人；欄位可排序，底部有全公司合計。</li>
            <li>選「依扣繳稅額表」且薪資達起扣點的員工，會掛<strong>需查稅額表填稅額</strong>黃色標籤提醒。</li>
            <li>從工作台待辦或查核頁的<strong>前往修正</strong>跳轉時，會直接開啟該員工的異動對話框（網址帶 <strong>?emp=員工編號</strong>），不必再搜尋。</li>
            <li>月薪與每月固定津貼不在這裡調整——請到<strong>基本資料 → 固定薪資項目</strong>設定，這裡只填「當月一次性」的變動。</li>
          </ul>
          <Callout variant="warning" title="已確認月份不能改">
            該月若已確認結算，清單上方會出現鎖定提示、<strong>編輯</strong>按鈕反灰；要修改請先到「查核與確認」按<strong>取消確認</strong>。
          </Callout>
        </>
      ),
    },
    {
      id: "edit-dialog",
      title: "異動編輯對話框逐欄說明",
      keywords: ["加班", "請假", "獎金", "代扣稅", "其他加項", "外幣", "46小時", "累計獎金"],
      body: (
        <>
          <p>對話框由上而下六區，每填一格下方即時重算，最底列出<strong>應發／代扣／實發</strong>摘要：</p>
          <ul>
            <li><strong>加班時數</strong>五欄：<strong>平日加班・前 2 小時</strong>（×1⅓）、<strong>平日加班・第 3–4 小時</strong>（×1⅔）、<strong>休息日加班・前 2 小時</strong>、<strong>休息日加班・第 3 小時起</strong>、<strong>國定假日出勤</strong>（整天出勤填 8，加發一日工資）。平日＋休息日合計超過 46 小時會出現「<strong>超過每月 46 小時上限，請留意</strong>」提醒。</li>
            <li><strong>請假</strong>：<strong>事假</strong>（不給薪，整段扣薪）、<strong>病假</strong>（半薪）；特休、婚喪、公假等有薪假不扣款、不必輸入。</li>
            <li><strong>獎金</strong>：填<strong>本月發放獎金</strong>後，<strong>今年累計獎金（含本月）</strong>由系統依今年已輸入的獎金自動帶入（餵二代健保 4 倍門檻判斷）；只有系統外發放才需自行覆寫。累計小於本月發放會標紅色「<strong>累計小於本月發放</strong>」請修正。</li>
            <li><strong>外幣給付</strong>（啟用外幣時才顯示）：選幣別＋填本月金額＝覆寫該月外幣；與台幣分開計算、視作獎金，不進勞健保。未設本期匯率會提醒到「系統設定 → 幣別與匯率」補。</li>
            <li><strong>其他調整</strong>：<strong>其他加項</strong>（例：實報實銷代墊還款）、<strong>其他扣款</strong>（例：借支、團保自付）。</li>
            <li><strong>代扣所得稅</strong>：固定比率者系統顯示建議金額，按<strong>帶入建議值</strong>即可；選「依扣繳稅額表」且達起扣點者，請自行查財政部薪資所得扣繳稅額表，依扶養人數欄查出金額後填入。</li>
          </ul>
          <Callout variant="info" title="送出前覆核">
            有改動時對話框底部會列出「本次異動變更」的舊→新對照，可逐欄還原；按<strong>儲存本月異動</strong>才寫入。
          </Callout>
        </>
      ),
    },
    {
      id: "carry-forward",
      title: "帶入上月與快速動線",
      keywords: ["帶入上月異動", "儲存並下一位", "快捷鍵", "Shift+Enter", "Enter"],
      body: (
        <>
          <p>逐人輸入時有三個省時動線：</p>
          <ul>
            <li><strong>帶入上月異動</strong>（對話框左下）：把該員工上月的加班五欄、事／病假與其他加扣項複製到本月，再微調即可。<strong>刻意不帶獎金與代扣稅</strong>——獎金多為一次性，照抄容易誤重發；代扣稅應依本月實際薪資重算。</li>
            <li><strong>儲存並下一位</strong>：儲存後直接開啟清單中下一位員工的對話框，逐人巡一輪不必反覆開關。</li>
            <li>鍵盤：在數字欄按 <strong>Enter</strong>＝儲存本月異動；<strong>Shift+Enter</strong>＝儲存並下一位，全程免用滑鼠。</li>
          </ul>
          <Callout variant="info" title="上月沒資料時">
            上月該員工沒有異動紀錄時，<strong>帶入上月異動</strong>會提示無資料可帶，不會清掉已填內容。
          </Callout>
        </>
      ),
    },
    {
      id: "review-tabs",
      title: "第二步：查核三分頁",
      keywords: ["查核", "試算總覽", "統計查核", "前往修正", "環比", "同比", "模擬年度"],
      body: (
        <>
          <p>
            「查核與確認」頁上方是摘要卡（<strong>結算人數</strong>、<strong>應發總額</strong>、<strong>實發總額</strong>、
            <strong>公司總成本</strong>）與<strong>模擬年度（以本月推估）</strong>卡：以本月成本為 run-rate 外推全年，
            並顯示<strong>環比</strong>（vs 上月）與<strong>同比</strong>（vs 去年同月）——需有該月快照才有得比。下方三個分頁：
          </p>
          <ol>
            <li><strong>試算總覽</strong>：全公司逐員明細（月薪總額、加班費、獎金、應發、四項保費、所得稅、實發、公司成本），可搜尋、排序、匯出 CSV，確認前先整表掃一眼。</li>
            <li><strong>統計查核</strong>：系統自動檢查法規與資料完整性——<strong>紅色必須處理、黃色建議確認</strong>；每項可按<strong>前往修正</strong>直達該員工的異動對話框或基本資料。另有部門／成本中心勾稽與公司二代健保補充保費概算。</li>
            <li><strong>獎金試算</strong>：發放前的沙盒試算（見下節），不寫回實際薪資。</li>
          </ol>
          <Callout variant="warning" title="紅色錯誤擋確認">
            只要還有紅色錯誤或有人「需查稅額表填入代扣所得稅」，<strong>確認本月結算</strong>按鈕會停用，頁面上方會列出待處理清單。
          </Callout>
        </>
      ),
      actions: [{ label: "前往查核與確認", to: "/payroll/review" }],
    },
    {
      id: "bonus-trial",
      title: "獎金試算器",
      keywords: ["獎金試算", "補充保費", "二代健保", "4倍門檻", "5%", "實際入帳"],
      body: (
        <>
          <p>
            <strong>獎金試算</strong>分頁讓你在發放前先算清楚兩筆代扣，得到員工<strong>實際入帳</strong>金額。
            對每位員工填<strong>今年已發獎金</strong>與<strong>本次預計發放</strong>，系統即算出：
          </p>
          <ul>
            <li><strong>所得稅</strong>：獎金<strong>單次</strong>達起扣門檻才扣 5%（未達者免扣，但年底仍列入扣繳憑單）；非居住者另計，表上會標示「<strong>併當月薪資計稅</strong>」。</li>
            <li><strong>補充保費</strong>：看「今年<strong>累計</strong>」是否超過個人健保投保金額的 4 倍（表上<strong>補充保費門檻</strong>欄），超過的部分 × 2.11%。例如投保金額 36,300 元者門檻為 145,200 元，年終發 60,000 元、累計未破門檻即免扣。</li>
          </ul>
          <p>
            兩者判斷基準不同（單次 vs 累計）、互不影響。確定發放後，回「薪資結算」把金額填入該員工的<strong>本月發放獎金</strong>；
            門檻與費率的法源見法規依據頁。
          </p>
          <Callout variant="info" title="這裡只是試算">
            獎金試算不會寫回任何資料；實際計薪以異動對話框填入的獎金為準（累計會自動帶入）。
          </Callout>
        </>
      ),
      actions: [{ label: "法規依據", to: "/sources" }],
    },
    {
      id: "confirm",
      title: "確認本月結算",
      keywords: ["確認", "凍結", "快照", "取消確認", "鎖定", "硬鎖定"],
      body: (
        <>
          <p>
            查核無誤後按<strong>確認本月結算</strong>，系統做兩件事：<strong>留存當月實際快照</strong>（供年報累計、
            趨勢與環比同比，不必回頭重算歷史）＋<strong>凍結該月資料</strong>。發薪月份旁徽章轉為<strong>已確認</strong>，
            並顯示確認時間。之後即可按<strong>前往報表與申報</strong>產出文件。
          </p>
          <ul>
            <li>凍結範圍：該月的異動、薪資、眷屬與法定參數都改不動；相關頁面會預先提示「先取消確認」。</li>
            <li>要修改：回「查核與確認」按<strong>取消確認</strong>解除鎖定，改完資料再重新確認。</li>
          </ul>
          <Callout variant="danger" title="取消確認會移除該月快照">
            <strong>取消確認</strong>會同步刪除該月留存的快照；改完務必<strong>重新確認</strong>讓系統以最新資料重建快照，
            否則年報與趨勢會少掉這個月。
          </Callout>
          <Callout variant="warning" title="編輯不會自動解除確認">
            已確認月份的編輯一律被擋下（不是「改了就自動取消確認」）；這是刻意設計，避免報表送出後資料被無聲改動。
          </Callout>
        </>
      ),
      actions: [{ label: "啟動導覽：每月結算兩步", tour: "monthly" }],
    },
  ],
};
