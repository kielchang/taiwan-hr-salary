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

/** 無錨點（targetRect=null）＝置中歡迎卡。 */
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
