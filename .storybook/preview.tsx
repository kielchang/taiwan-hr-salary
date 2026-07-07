import type { Preview } from "@storybook/react";
import React, { useEffect } from "react";
import { MemoryRouter } from "react-router-dom";
import { usePayrollStore } from "../src/store/usePayrollStore";
import "../src/index.css";

// 所有 story 都在 Router 環境下；並將 store 標記為已完成初始設定（示範資料預設即載入）
function StoreReady({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    usePayrollStore.setState({ setupCompleted: true });
  }, []);
  return <>{children}</>;
}

const preview: Preview = {
  decorators: [
    (Story) => (
      <MemoryRouter>
        <StoreReady>
          <div className="bg-muted/30 p-4">
            <Story />
          </div>
        </StoreReady>
      </MemoryRouter>
    ),
  ],
  parameters: {
    layout: "fullscreen",
    controls: { expanded: true },
    options: { storySort: { order: ["元件", ["基礎", "表單", "圖表"], "畫面"] } },
  },
};

export default preview;
