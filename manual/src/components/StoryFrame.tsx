// 嵌入 Storybook 互動 story（隨手冊發佈於 <baseUrl>/storybook/）：
// 讀者可在手冊頁直接操作元件（點按鈕/切分頁/看狀態），不用離開手冊。
// 用法：<StoryFrame id="元件-導引-coachmark--驗收標記" height={420} title="驗收標記" />
// id＝Storybook story id（storybook 網址列 ?path=/story/<id> 的那段）。
// 列印：iframe 互動內容印不出來（lazy 載入/跨文件），改顯示替代說明框（custom.css @media print 切換）。
import React from "react";
import useBaseUrl from "@docusaurus/useBaseUrl";

export default function StoryFrame({ id, height = 360, title }: { id: string; height?: number; title?: string }) {
  const src = useBaseUrl(`/storybook/iframe.html?id=${id}&viewMode=story`);
  return (
    <div className="storyframe">
      <iframe
        className="storyframe-iframe"
        src={src}
        title={title ?? id}
        style={{ width: "100%", height, border: "1px solid var(--ifm-color-emphasis-300)", borderRadius: 8 }}
        loading="lazy"
      />
      <div className="storyframe-print-note" style={{ display: "none" }}>
        〔互動示例：{title ?? id}〕此處在線上手冊為可操作的元件展示，列印版不含互動內容——請至線上手冊操作。
      </div>
    </div>
  );
}
