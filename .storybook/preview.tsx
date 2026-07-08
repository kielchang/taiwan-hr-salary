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

// 全站淺/深色切換器（僅 Storybook；正式站尚未接 ThemeProvider，行為不受影響）。
// class 切在 document.documentElement 而非包一層 div——Radix 的 Dialog/Select/Tooltip 用
// portal 掛到 <body>，若只切 wrapper 的 class，這些浮層會抓不到 .dark 樣式。
function ThemeSwitch({ theme, children }: { theme: "light" | "dark"; children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);
  return <>{children}</>;
}

const preview: Preview = {
  decorators: [
    (Story, context) => (
      <MemoryRouter>
        <StoreReady>
          <ThemeSwitch theme={context.globals.theme}>
            <div className="bg-background p-4 text-foreground">
              <Story />
            </div>
          </ThemeSwitch>
        </StoreReady>
      </MemoryRouter>
    ),
  ],
  parameters: {
    layout: "fullscreen",
    controls: { expanded: true },
    options: { storySort: { order: ["元件", ["基礎", "表單", "圖表"], "畫面"] } },
  },
  globalTypes: {
    theme: {
      description: "淺色／深色版面",
      defaultValue: "light",
      toolbar: {
        title: "主題",
        icon: "circlehollow",
        items: [
          { value: "light", icon: "sun", title: "淺色" },
          { value: "dark", icon: "moon", title: "深色" },
        ],
        dynamicTitle: true,
      },
    },
  },
};

export default preview;
