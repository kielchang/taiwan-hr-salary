// DocItem/Content swizzle：每頁頂部加「列印此頁」——window.print() 搭配 custom.css 的
// @media print（隱藏站台外殼、MockFlow 全步驟展開），一鍵印出/另存 PDF 即為完整操作文件。
import React from "react";
import Content from "@theme-original/DocItem/Content";
import type ContentType from "@theme/DocItem/Content";
import type { WrapperProps } from "@docusaurus/types";

type Props = WrapperProps<typeof ContentType>;

export default function ContentWrapper(props: Props): React.ReactElement {
  return (
    <>
      <div className="doc-print-bar">
        <button type="button" onClick={() => window.print()} title="列印或另存 PDF">
          🖨 列印此頁
        </button>
      </div>
      <Content {...props} />
    </>
  );
}
