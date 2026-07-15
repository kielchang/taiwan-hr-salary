import type { Meta, StoryObj } from "@storybook/react";
import { useEffect, useRef, useState } from "react";
import { Coachmark } from "./coachmark";
import { Button } from "./button";

const meta: Meta = { title: "元件/導引 Coachmark", parameters: { layout: "fullscreen" } };
export default meta;
type S = StoryObj;

/** 錨定某元素：量其 rect、渲染聚光框；上一步/下一步在 3 個假步驟間切換。 */
export const 錨定元素: S = {
  render: () => {
    const ref = useRef<HTMLButtonElement>(null);
    const [rect, setRect] = useState<DOMRect | null>(null);
    const [i, setI] = useState(0);
    useEffect(() => { if (ref.current) setRect(ref.current.getBoundingClientRect()); }, []);
    const bodies = [
      <>點這顆<strong>「編輯」</strong>按鈕，開啟該員工的當月異動。</>,
      <>在對話框輸入<strong>本月獎金</strong>，下方會即時試算二代健保補充保費。</>,
      <>按<strong>「儲存本月異動」</strong>完成；預期回到清單、該列顯示已更新。</>,
    ];
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-10">
        <Button ref={ref}>編輯</Button>
        {rect && (
          <Coachmark
            targetRect={rect} title={`步驟示範 ${i + 1}`} body={bodies[i]}
            stepIndex={i} stepCount={3} isFirst={i === 0} isLast={i === 2}
            onPrev={() => setI((x) => Math.max(0, x - 1))}
            onNext={() => setI((x) => Math.min(2, x + 1))}
            onSkip={() => setRect(null)}
          />
        )}
      </div>
    );
  },
};

/** 驗收模式：步驟卡多一列「✅ 通過／❌ 有問題（＋備註）」逐步標記（audience:"acceptance" 導覽用）。 */
export const 驗收標記: S = {
  render: () => {
    const ref = useRef<HTMLButtonElement>(null);
    const [rect, setRect] = useState<DOMRect | null>(null);
    const [verdict, setVerdict] = useState<"pass" | "issue" | null>("issue");
    const [note, setNote] = useState("提醒卡沒有出現");
    useEffect(() => { if (ref.current) setRect(ref.current.getBoundingClientRect()); }, []);
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-10">
        <Button ref={ref}>立即匯出備份</Button>
        {rect && (
          <Coachmark
            targetRect={rect} title="③ 工作台備份提醒" body={<>有未備份變更時，工作台會跳<strong>琥珀提醒卡</strong>。請確認是否出現。</>}
            stepIndex={2} stepCount={5} isFirst={false} isLast={false}
            showVerdict verdict={verdict} onVerdict={setVerdict} note={note} onNote={setNote}
            onPrev={() => {}} onNext={() => {}} onSkip={() => setRect(null)}
          />
        )}
      </div>
    );
  },
};

/** 互動步驟：脈動環＋卡片內「👆 點圈選處繼續」互動提示（advanceOn 步驟用）。 */
export const 互動待點: S = {
  render: () => {
    const ref = useRef<HTMLButtonElement>(null);
    const [rect, setRect] = useState<DOMRect | null>(null);
    useEffect(() => { if (ref.current) setRect(ref.current.getBoundingClientRect()); }, []);
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-10">
        <Button ref={ref}>幣別與匯率</Button>
        {rect && (
          <Coachmark
            targetRect={rect} title="① 開啟「幣別與匯率」分頁" body={<>點圈起來的<strong>「幣別與匯率」</strong>分頁。</>}
            actionHint="👆 點上方圈選處即可繼續（或按「下一步」）"
            stepIndex={1} stepCount={6} isFirst={false} isLast={false}
            onPrev={() => {}} onNext={() => {}} onSkip={() => setRect(null)}
          />
        )}
      </div>
    );
  },
};

/** 狀態感知警示（warning）：前置條件未滿足（如當期已確認），卡片顯示紅字提醒先解鎖。 */
export const 狀態警示: S = {
  render: () => (
    <div className="min-h-[60vh] p-10">
      <Coachmark
        targetRect={null} title="② 改部門並理解鎖定"
        body={<>改部門/成本中心→填<strong>異動原因</strong>→送出。</>}
        warning={<>此示範月（2026-06）已確認，<strong>計薪相關情境會被鎖定</strong>：請先到「薪資結算 → 查核與確認」按<strong>取消本月確認</strong>再操作。</>}
        stepIndex={2} stepCount={3} isFirst={false} isLast
        onPrev={() => {}} onNext={() => {}} onSkip={() => {}}
      />
    </div>
  ),
};

/** 無錨點（targetRect=null）＝置中歡迎卡。鍵盤：卡片聚焦後 ←/→ 換步、Esc 略過、Enter 下一步。 */
export const 置中歡迎卡: S = {
  render: () => (
    <div className="min-h-[60vh] p-10">
      <Coachmark
        targetRect={null} title="歡迎使用導引" body={<>這段導引會帶你走一遍<strong>多幣別薪資</strong>：啟用→新增幣別→設匯率→員工設定→月結查看。隨時可略過。</>}
        stepIndex={0} stepCount={6} isFirst isLast={false}
        onPrev={() => {}} onNext={() => {}} onSkip={() => {}}
      />
    </div>
  ),
};

/** 末步鏈結下一支導覽（secondaryAction）：完成之外多一顆「接著看」outline 鈕。 */
export const 末步鏈結下一支: S = {
  render: () => (
    <div className="min-h-[60vh] p-10">
      <Coachmark
        targetRect={null} title="系統總覽完成！" body={<>已認識側邊欄與工作台。接著建議看<strong>「每月結算兩步」</strong>——每月固定要做的核心流程。</>}
        stepIndex={3} stepCount={4} isFirst={false} isLast
        secondaryAction={{ label: "接著看：每月結算 →", onClick: () => {} }}
        onPrev={() => {}} onNext={() => {}} onSkip={() => {}}
      />
    </div>
  ),
};
