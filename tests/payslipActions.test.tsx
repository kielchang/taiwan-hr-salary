// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { ReportsView } from "@/views/ReportsView";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("薪資條：單筆與批次動作", () => {
  it("切到薪資條分頁 → 顯示單筆與批次動作鈕；薪資條內容（PayslipCard）正常渲染", async () => {
    const div = document.createElement("div"); document.body.appendChild(div);
    await act(async () => { createRoot(div).render(React.createElement(ReportsView)); });
    const tabBtn = Array.from(div.querySelectorAll("button")).find((b) => b.textContent === "薪資條");
    await act(async () => { tabBtn!.dispatchEvent(new MouseEvent("click", { bubbles: true })); });

    const btn = (label: string) =>
      Array.from(div.querySelectorAll("button")).find((b) => b.textContent?.includes(label)) as HTMLButtonElement | undefined;

    expect(btn("下載加密 PDF")).toBeTruthy();
    expect(btn("Email 通知草稿")).toBeTruthy();
    const batch = btn("批次下載全部");
    expect(batch).toBeTruthy();
    expect(batch!.disabled).toBe(false); // 種子員工有身分證 → 可批次
    // PayslipCard 內容
    expect(div.textContent).toContain("薪資明細表");
    expect(div.textContent).toContain("實發金額");
  });
});
