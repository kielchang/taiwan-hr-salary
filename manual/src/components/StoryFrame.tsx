// 嵌入 Storybook 互動 story（隨手冊發佈於 <baseUrl>/storybook/）：
// 讀者可在手冊頁直接操作元件（點按鈕/切分頁/看狀態），不用離開手冊。
// 用法：<StoryFrame id="元件-導引-coachmark--驗收標記" height={420} title="驗收標記" />
// id＝Storybook story id（storybook 網址列 ?path=/story/<id> 的那段）。
import React from "react";
import useBaseUrl from "@docusaurus/useBaseUrl";

export default function StoryFrame({ id, height = 360, title }: { id: string; height?: number; title?: string }) {
  const src = useBaseUrl(`/storybook/iframe.html?id=${id}&viewMode=story`);
  return (
    <iframe
      src={src}
      title={title ?? id}
      style={{ width: "100%", height, border: "1px solid var(--ifm-color-emphasis-300)", borderRadius: 8 }}
      loading="lazy"
    />
  );
}
