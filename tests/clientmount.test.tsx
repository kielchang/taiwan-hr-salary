// @vitest-environment jsdom
// 客戶端掛載冒煙測試（白屏防護）：在真實 DOM 掛載 App，含 localStorage persist 水合與 effect。
// 涵蓋全新使用者（精靈）與返回使用者（主畫面）兩條路徑，攔截執行期白屏。
import { describe, it, expect, beforeEach, vi } from "vitest";
import React, { act } from "react";
import { createRoot } from "react-dom/client";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const KEY = "taiwan-hr-salary:v1";

async function mountFreshApp() {
  vi.resetModules(); // 讓 store 以目前 localStorage 重新水合
  const { default: App } = await import("@/App");
  const div = document.createElement("div");
  document.body.appendChild(div);
  const root = createRoot(div);
  await act(async () => {
    root.render(React.createElement(App));
    await new Promise((r) => setTimeout(r, 80));
  });
  return div;
}

describe("client mount（白屏防護）", () => {
  beforeEach(() => localStorage.clear());

  it("全新使用者 → 顯示初始設定精靈，不白屏", async () => {
    const div = await mountFreshApp();
    expect(div.innerHTML.length).toBeGreaterThan(200);
    expect(div.textContent).toContain("歡迎使用薪資管理系統");
  });

  it("返回使用者（已設定）→ 顯示主畫面與步驟列，不白屏", async () => {
    localStorage.setItem(KEY, JSON.stringify({ state: { setupCompleted: true }, version: 0 }));
    const div = await mountFreshApp();
    expect(div.innerHTML.length).toBeGreaterThan(200);
    expect(div.textContent).toContain("每月薪資作業");
    expect(div.textContent).toContain("輸入當月異動");
  });

  it("毀損的本機資料 → 不白屏（回退預設）", async () => {
    localStorage.setItem(KEY, "{ this is not valid json");
    const div = await mountFreshApp();
    expect(div.innerHTML.length).toBeGreaterThan(200);
  });
});
