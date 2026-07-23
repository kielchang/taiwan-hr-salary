import type { WikiChapter } from "./types";
import { Callout } from "@/components/ui/callout";

/** 第6章 薪酬分析與試算（section id 為深連結契約、不可改名）。 */
export const ch_analytics: WikiChapter = {
  id: "analytics",
  num: 6,
  title: "薪酬分析與試算",
  intro: <>月報／規劃試算／年報三組分析。沙盒原則：試算怎麼調都不會動到實際薪資，唯一會寫回的是調薪的「核定套用」。</>,
  sections: [
    {
      id: "overview",
      title: "分析頁地圖與沙盒原則",
      keywords: ["薪酬分析", "沙盒", "月報", "年報", "規劃試算", "檢視月份", "試算"],
      body: (
        <>
          <p>
            「薪酬分析」把分頁分成四組：<strong>月報</strong>（<strong>成本結構</strong>、<strong>分布與公平</strong>、<strong>級距與 compa-ratio</strong>）、
            <strong>規劃試算</strong>（<strong>獎金／分紅試算</strong>、<strong>調薪試算</strong>）、<strong>年報</strong>（<strong>趨勢·預算</strong>）與說明（<strong>指標說明</strong>）。
            月報分頁上方有<strong>檢視月份</strong>選擇器，可回看任一月份；旁邊的徽章標示該月是
            <strong>已確認實際</strong>、<strong>試算暫定（當期未確認）</strong>還是<strong>未確認月份</strong>，判讀前先看清楚資料性質。
          </p>
          <Callout variant="info" title="沙盒原則">
            獎金與調薪試算是<strong>規劃試算沙盒</strong>：參數怎麼改、方案怎麼比，都不會寫回實際薪資、不影響月結。
            全站唯一的寫回出口是調薪分頁的「<strong>核定套用此方案</strong>」（見本章「調薪試算與核定套用」）。
          </Callout>
          <p>每個分頁頂端都有「<strong>重點意見（白話解讀）</strong>」：系統依本期數據自動給結論與建議，下方圖表是佐證；也可按<strong>列印</strong>或<strong>匯出 PDF</strong> 留存。</p>
        </>
      ),
      actions: [{ label: "前往薪酬分析", to: "/analytics" }],
    },
    {
      id: "cost",
      title: "成本結構",
      keywords: ["成本結構", "雇主負擔", "部門", "Pareto", "80/20", "堆疊圖", "每人成本"],
      body: (
        <>
          <p>
            <strong>成本結構</strong>分頁回答「錢花在哪」。上方四張數字卡：<strong>人事總成本（含雇主負擔）</strong>、<strong>平均每人成本</strong>、
            <strong>中位每人成本</strong>、<strong>人數</strong>。成本一律拆成六段：本薪／加給/津貼／加班費／獎金／其他加項／雇主負擔。
          </p>
          <ol>
            <li>看「<strong>人事成本組成（全公司）</strong>」堆疊圖，掌握固定薪與變動項（獎金、加班費）的占比。</li>
            <li>點「<strong>部門別成本組成</strong>」的任一部門列，下方展開該部門逐人成本明細，找出成本異常的單位。</li>
            <li>看「<strong>員工成本 Pareto（集中度 80/20）</strong>」：少數高成本人力占總成本的比例；點任一長條可看該員成本組成。</li>
            <li>按<strong>匯出 CSV</strong> 把逐人成本帶去開會或存檔。</li>
          </ol>
          <p>判讀重點：加班費或獎金占比偏高，通常是人力配置或薪酬結構的檢討訊號；前 20% 人員占成本過半，代表關鍵人力集中、要留意接班與留任。</p>
        </>
      ),
    },
    {
      id: "fairness",
      title: "分布與公平",
      keywords: ["分布", "直方圖", "Gini", "Lorenz", "中位數", "薪資壓縮", "年資"],
      body: (
        <>
          <p>
            <strong>分布與公平</strong>分頁看「薪水發得平不平均」。數字卡有 <strong>P10</strong>–<strong>P90</strong> 百分位、
            <strong>變異係數 CV</strong>、<strong>Gini 係數</strong>、<strong>獎金/本薪比</strong>與<strong>變動薪酬比</strong>。
          </p>
          <ul>
            <li>「<strong>月薪資總額分布（直方圖）</strong>」：點任一桶看落在該薪資區間的員工，例如檢視 30,000–40,000 元這一段集中了哪些人。</li>
            <li>「<strong>Lorenz 曲線（薪資不均）</strong>」：曲線越偏離對角線越不均，與 Gini 對照著讀。</li>
            <li>「<strong>部門薪資中位數比較</strong>」：點任一部門長條鑽取該部門員工薪資，找部門間落差。</li>
            <li>「<strong>薪資 vs 年資（薪資壓縮檢視）</strong>」散布圖：年資高但薪資未相稱的點，可能是薪資壓縮（pay compression），是調薪優先名單的線索。</li>
          </ul>
          <p>各指標的判讀區間見本章「指標說明」。</p>
        </>
      ),
    },
    {
      id: "brackets-compa",
      title: "級距與 compa-ratio",
      keywords: ["薪資級距", "compa-ratio", "區間滲透率", "市場中位", "指派", "熱圖"],
      body: (
        <>
          <p>
            <strong>級距與 compa-ratio</strong> 分頁讓你自建公司內部的薪資帶（與勞健保「投保級距」無關），再把每個人放進去比。
          </p>
          <ol>
            <li>在「<strong>薪資級距（min / 中位 / max ＋市場中位）</strong>」卡按<strong>新增級距</strong>，填名稱與下限／中位／上限，例如 32,000／40,000／48,000。</li>
            <li><strong>市場中位</strong>選填：填了才會計算「對市場」的 compa-ratio（對外競爭力）。</li>
            <li>到「<strong>員工級距指派與 compa-ratio</strong>」表，逐人在<strong>級距</strong>欄下拉選擇（預設<strong>未指派</strong>）。</li>
            <li>讀三個欄位：<strong>compa-ratio</strong>＝月薪 ÷ 級距中位，100% 表示剛好在中位，90%–110% 算健康；<strong>市場 compa</strong> 低於 90% 會標警示色（落後行情、留才風險）；<strong>區間滲透率</strong>＝在薪資帶裡走到哪，0% 在下限、接近 100% 表示快觸頂。</li>
          </ol>
          <p>有級距後會出現「<strong>部門 × 級距 compa-ratio 熱圖</strong>」：綠＝接近中位、藍＝偏低、紅＝偏高，一眼找出整片偏離的部門。</p>
          <Callout variant="warning" title="未設定級距時">
            未建立級距或員工未指派時，compa-ratio 與區間滲透率會顯示「—」，相關判讀與熱圖也不會出現。請先新增級距並指派員工。
          </Callout>
        </>
      ),
    },
    {
      id: "bonus-sim",
      title: "獎金／分紅試算",
      keywords: ["獎金池", "分紅", "分配方法", "績效係數", "merit matrix", "二代健保", "補充保費"],
      body: (
        <>
          <p><strong>獎金／分紅試算</strong>是純沙盒：先決定池子多大，再選怎麼分，逐人金額立即算給你看，不會寫回薪資。</p>
          <ol>
            <li>在「情境設定」選<strong>獎金池來源</strong>：<strong>固定金額</strong>（如年終預算 800,000 元）或<strong>占月薪資總額 %</strong>。</li>
            <li>選<strong>分配方法</strong>：<strong>均分</strong>／<strong>按本薪比例</strong>／<strong>按績效係數</strong>／<strong>merit matrix（績效×級距）</strong>。前兩者不看績效；後兩者向高績效（merit matrix 另向級距偏低者）傾斜。</li>
            <li>需要時填<strong>目標預算（差異基準）</strong>，下方會出現「獎金池 vs 目標預算」的達標圖。</li>
            <li>勾「<strong>計入個人二代健保補充費概估</strong>」：獎金超過門檻的部分概估補充保費，讓你預告員工實拿會少多少。</li>
            <li>在「<strong>績效評等係數</strong>」卡調各評等係數，並於「逐人試算」表逐人指定<strong>績效</strong>評等；按<strong>匯出 CSV</strong> 可帶走名單。</li>
          </ol>
          <p>「試算獎金分布」與「績效係數 vs 試算獎金」兩張圖用來檢查分配是否符合 pay-for-performance；費率與門檻的法源請查法規依據頁。</p>
        </>
      ),
      actions: [{ label: "法規依據", to: "/sources" }],
    },
    {
      id: "raise-sim",
      title: "調薪試算與核定套用",
      keywords: ["調薪", "核定套用", "生效月份", "排程", "加薪池", "年化成本", "工作台"],
      body: (
        <>
          <p><strong>調薪試算</strong>先在沙盒比方案，滿意後才「核定套用」——這是全站唯一會把試算寫回實際薪資的動作。</p>
          <ol>
            <li>在「調薪情境設定」選<strong>期間別</strong>（年度／季度）與<strong>分配方法</strong>：<strong>一致調幅 %</strong>（例如全員 +3%），或給一筆加薪池後<strong>按本薪分配加薪池</strong>／<strong>按績效係數</strong>／<strong>merit matrix（績效×級距）</strong>分配。</li>
            <li>看數字卡的<strong>年化成本增額</strong>（含雇主保費重算）與 Gini 前後變化；「<strong>分配方法並排比較</strong>」把四種分配法用同一預算跑一遍，比公平性與預算差異。</li>
            <li>確定方案後按<strong>核定套用此方案</strong>，在「核定並套用調薪方案」視窗選<strong>生效月份</strong>：選<strong>當月</strong>＝確認後立即寫回（差額套在本薪）；選<strong>未來月份</strong>＝先存排程，到期後在「工作台」一鍵套用。</li>
            <li>按<strong>確認核定寫回</strong>完成，系統會留下稽核紀錄。</li>
          </ol>
          <Callout variant="danger" title="核定套用＝寫回實際薪資">
            核定會把調後月薪寫回薪資結構、無法從本頁復原（可到系統設定的稽核紀錄回復）。當月已確認結算時會被擋下——請改選未來生效月份存為排程，或先取消該月確認。
          </Callout>
          <p>提醒：要對整個單位加津貼或發區間補貼，請改用主檔的「批次薪資」，不要用調薪試算硬湊。</p>
        </>
      ),
      actions: [{ label: "前往調薪試算", to: "/analytics" }],
    },
    {
      id: "annual-trend",
      title: "趨勢與年度預算",
      keywords: ["快照", "趨勢", "年度預算", "累計", "run-rate", "全年推估", "年報"],
      body: (
        <>
          <p><strong>趨勢·預算</strong>分頁是年報：把單月數字放進全年脈絡。</p>
          <ul>
            <li>「<strong>年累計與全年推估</strong>」：實際累計＝當年各月快照加總，缺快照的月份以目前資料回推並<strong>標示估算</strong>；「模擬全年」＝已實際月份＋剩餘月以本月 run-rate 外推。估算月越多越不準，建議每月結算確認後回來留快照。</li>
            <li>「<strong>年度人事預算追蹤</strong>」：填<strong>年度人事預算（雇主總成本，全年）</strong>後，系統把目前年化成本加上試算中的調薪與獎金，對比預算看會不會超支——規劃用，不影響實際薪資。</li>
            <li>「<strong>薪酬趨勢（歷期快照）</strong>」：每期結算後按<strong>保存快照</strong>（同月再按＝更新），累積兩期以上即可看總成本、薪資中位數與 Gini 的走勢；快照只存彙總數字、不含個資，全部留在本機。</li>
          </ul>
          <Callout variant="info" title="養成月結後存快照的習慣">
            趨勢與年累計都吃快照。建議把「確認月結 → 保存快照」綁成固定收尾動作，年報才會是實際數而非估算。
          </Callout>
        </>
      ),
      actions: [{ label: "前往趨勢·預算", to: "/analytics" }],
    },
    {
      id: "metrics",
      title: "指標說明",
      keywords: ["指標說明", "名詞", "定義", "compa-ratio", "Gini", "百分位", "怎麼看"],
      body: (
        <>
          <p>
            看不懂某個指標時，開「<strong>指標說明</strong>」分頁：13 條名詞每條都分「<strong>用途</strong>（這個數字想表達什麼）」與「<strong>怎麼看</strong>（落在哪些區間代表什麼）」，不講公式。
          </p>
          <p>
            收錄：compa-ratio（薪酬比較比）、range penetration（區間滲透率）、百分位 P10–P90、變異係數 CV、Gini 係數／Lorenz 曲線、
            獎金/本薪比與變動薪酬比、成本集中度（Pareto）、merit matrix（績效×級距）、分配方法、年化成本增額、
            市場 compa-ratio（對外競爭力）、薪酬趨勢（歷期快照）、年度預算使用率。
          </p>
          <p>建議的用法：先讀各分頁頂端的「重點意見（白話解讀）」拿結論，遇到不熟的名詞再來這裡查判讀區間，最後回圖表驗證。</p>
        </>
      ),
    },
  ],
};
