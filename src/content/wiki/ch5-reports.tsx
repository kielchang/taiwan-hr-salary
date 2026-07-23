import type { WikiChapter } from "./types";
import { Callout } from "@/components/ui/callout";

/** 第5章 報表與申報（section id 為深連結契約、不可改名）。 */
export const ch_reports: WikiChapter = {
  id: "reports",
  num: 5,
  title: "報表與申報",
  intro: <>對外報表的單一出口：月結報表（匯總、代扣稅、薪資條）與年度申報四類名冊，全部在「報表與申報」一頁產出。</>,
  sections: [
    {
      id: "hub",
      title: "報表中心與期間切換",
      keywords: ["報表與申報", "報表月份", "月結報表", "年度申報與名冊", "暫定", "已確認", "單一出口"],
      body: (
        <>
          <p>
            所有要交出去的實際報表——給員工的薪資條、給主管機關的申報名冊——都從側邊欄的
            <strong>報表與申報</strong>一個入口產出，分成兩個分頁：<strong>月結報表</strong>
            （匯總報表、所得稅扣繳、薪資條）與<strong>年度申報與名冊</strong>
            （扣繳憑單、勞健退繳費、級距申報、加退保）。規劃試算類報表刻意不放這裡，在「規劃與分析」。
          </p>
          <ol>
            <li>先看右上角<strong>報表月份</strong>：報表沿用全站共用的發薪月份，可在此直接切換，避免印錯月份。</li>
            <li>看月份旁的徽章：<strong>已確認</strong>＝該月已在結算查核凍結，數字定案；<strong>未確認・暫定</strong>＝數字還會變動。</li>
            <li>點<strong>月結報表</strong>或<strong>年度申報與名冊</strong>切換群組，再進各分頁產出報表。</li>
          </ol>
          <Callout variant="warning" title="未確認月份的報表是暫定數字">
            月份未確認時，報表頁會標示「本月尚未在『結算查核』確認，以下為暫定數字」。要對外發出（寄薪資條、繳費、申報）前，
            請先完成「薪資結算 → 結算查核」的確認，確保印出的數字不會事後變動。
          </Callout>
        </>
      ),
      actions: [{ label: "前往報表與申報", to: "/reports" }],
    },
    {
      id: "monthly-reports",
      title: "匯總報表與代扣稅清單",
      keywords: ["匯總報表", "部門別", "成本中心", "所得稅扣繳", "代扣所得稅", "全部帶入建議值", "帶入", "補充保費"],
      body: (
        <>
          <p>
            <strong>匯總報表</strong>分頁提供<strong>部門別人事成本</strong>與<strong>成本中心別人事成本</strong>兩張表：
            人數、應發合計、其中加班費、其中獎金、實發金額、公司負擔保費、公司總成本與占比，點欄頭可排序，
            按<strong>列印匯總報表</strong>可直接列印。表下另有<strong>公司二代健保補充保費（概算，次月底前繳納）</strong>金額卡。
          </p>
          <p><strong>所得稅扣繳</strong>分頁＝<strong>本月代扣所得稅清單</strong>，逐人列出建議與實際代扣：</p>
          <ol>
            <li>看<strong>建議金額</strong>欄：固定比率類系統直接算出；標「請查官方稅額表」者需查財政部薪資所得扣繳稅額表。</li>
            <li>按單列的<strong>帶入</strong>把建議金額寫入<strong>已填金額</strong>；或按工具列的<strong>全部帶入建議值</strong>一次帶入所有可自動計算者（查表類不受影響）。</li>
            <li>查表類按<strong>前往填寫</strong>直接跳到該員的薪資結算對話框，把查得的稅額填入。</li>
            <li>需要留底或交會計時按 CSV 匯出。</li>
          </ol>
          <Callout variant="info" title="實際代扣以「已填金額」為準">
            「建議金額」只是系統試算；扣繳申報與繳庫（次月 10 日前）看的是「已填金額」。月份已確認時「帶入」按鈕會鎖住，
            要改需先取消該月確認。稅率與起扣點的法源請見法規依據頁。
          </Callout>
        </>
      ),
      actions: [{ label: "法規依據", to: "/sources" }],
    },
    {
      id: "payslip-pdf",
      title: "薪資條與加密 PDF",
      keywords: ["薪資條", "薪資明細表", "下載加密 PDF", "密碼", "身分證字號", "ZIP", "Email 通知草稿", "寄送清單"],
      body: (
        <>
          <p>
            <strong>薪資條</strong>分頁先從下拉選單挑員工，畫面即時預覽該員的<strong>薪資明細表</strong>
            （應發項目、代扣項目、實發金額，例如月薪 42,000 的員工可逐項核對勞健保自付與代扣稅）。發放方式三選：
          </p>
          <ol>
            <li>按<strong>列印</strong>直接印出紙本。</li>
            <li>按<strong>下載加密 PDF</strong>產出單人 PDF，開啟密碼＝該員<strong>身分證字號（英文字母大寫）</strong>。</li>
            <li>按<strong>Email 通知草稿</strong>開啟郵件軟體的通知草稿（mailto），附件請手動夾帶剛下載的 PDF。</li>
          </ol>
          <p>
            全公司發放用<strong>批次下載全部（ZIP）</strong>：一鍵產出每人一份加密 PDF 打包成 ZIP，
            內附<strong>寄送清單</strong> CSV（員工編號、姓名、Email、檔名、PDF 密碼說明），照清單逐一寄出即可。
          </p>
          <Callout variant="warning" title="缺身分證字號的員工會被跳過">
            未填「身分證字號」的員工無法產生加密 PDF：單人下載按鈕會鎖住，批次時該員被跳過並列在完成訊息與寄送清單中註記。
            請先到「基本資料」補填再重跑批次。Email 未填者則無法開啟通知草稿。
          </Callout>
        </>
      ),
      actions: [{ label: "前往薪資條", to: "/reports?tab=payslip" }],
    },
    {
      id: "filing",
      title: "年度申報四類名冊",
      keywords: ["扣繳憑單", "勞健退繳費清單", "投保級距申報調整", "以目前為申報基準", "加退保", "停保", "復保", "2月8月"],
      body: (
        <>
          <p><strong>年度申報與名冊</strong>群組四個分頁，皆可匯出 CSV 供人工核對與上傳官方平台（系統不直接介接政府申報）：</p>
          <ul>
            <li><strong>年度扣繳憑單</strong>：選年度後彙總該年所有結算月份的應發、應稅、獎金、代扣稅與補充保費。每月金額依「該月當時生效」的費率與級距版本計算——年中調整費率不會回頭改動已申報的月份。</li>
            <li><strong>勞健退繳費清單</strong>：當期每人的勞保／健保投保金額、勞退提繳，與勞保、職保、健保、勞退的員工自付與雇主負擔，供對帳各機關繳款單。</li>
            <li><strong>投保級距申報調整</strong>：比對「目前薪資算出的投保金額（現）」與「已申報基準（報）」，標出<strong>需調整</strong>者，供 2／8 月辦理級距調整。第一次使用先按<strong>以目前為申報基準</strong>建立基準；每次向勞健保機關申報完成後，再按一次讓基準跟上。</li>
            <li><strong>加退保作業清單</strong>：依到職、離職與留停／復職日期自動列出本月應<strong>加保</strong>、<strong>退保</strong>、<strong>停保</strong>、<strong>復保</strong>名單，點任一列可直接開該員檔案核對投保資料。</li>
          </ul>
          <Callout variant="warning" title="加退保名冊是提醒性質">
            名冊只列出「應辦事項」供您到勞保局、健保署等機關人工辦理，系統不會自動增減保費——例如留停期間健保得續保自費，
            依各公司規定與機關核定為準，辦理結果不會回寫系統保費計算。
          </Callout>
        </>
      ),
      actions: [
        { label: "扣繳憑單", to: "/reports?tab=withholding" },
        { label: "加退保名冊", to: "/reports?tab=enrollment" },
      ],
    },
    {
      id: "print-tips",
      title: "列印與歸檔建議",
      keywords: ["列印", "歸檔", "存檔", "PDF", "產生時間", "版本", "頁尾"],
      body: (
        <>
          <p>
            各報表頁都支援瀏覽器列印（Ctrl+P／⌘+P）：列印時自動隱藏側邊欄、分頁列與按鈕，只留報表本體；
            並自動加上列印頁首（公司名稱、報表名稱、期間、產生時間）與頁尾的系統版本戳記，
            日後翻出紙本即可辨識「這份報表是哪個月份、哪一版系統、何時產出」。
          </p>
          <ul>
            <li>列印對話框中選「另存為 PDF」即可留電子檔，不必真的印紙本。</li>
            <li>建議每月確認後固定歸檔：匯總報表、代扣所得稅清單、勞健退繳費清單各存一份 PDF 或 CSV，依「年份／月份」建資料夾保存。</li>
            <li>年度申報季（1 月扣繳憑單、2／8 月級距調整）前，先把對應報表匯出核對，再上官方平台申報。</li>
          </ul>
          <Callout variant="info" title="先確認、再歸檔">
            歸檔的報表應來自「已確認」的月份——確認後資料凍結，存下來的數字才與系統內快照一致，
            供日後稽核或勞資爭議時對得起來。
          </Callout>
        </>
      ),
    },
  ],
};
