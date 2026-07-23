// @vitest-environment jsdom
// 客戶端掛載＋路由冒煙測試（白屏防護）：在真實 DOM 掛載 App（含 MemoryRouter、
// localStorage persist 水合與 effect）。涵蓋全新使用者（精靈）、返回使用者（主畫面）、
// 毀損本機資料，以及各路由（深連結）是否正確渲染對應頁面。
import { describe, it, expect, beforeEach, vi } from "vitest";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { STORAGE_KEY } from "@/store/usePayrollStore";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// 儲存鍵依環境分隔（測試環境 APP_ENV 預設 dev → 後綴 :dev）；由 store 匯出以保持一致。
const KEY = STORAGE_KEY;

async function mountAt(path: string) {
  vi.resetModules(); // 讓 store 以目前 localStorage 重新水合
  const { default: App } = await import("@/App");
  const div = document.createElement("div");
  document.body.appendChild(div);
  const root = createRoot(div);
  await act(async () => {
    root.render(
      React.createElement(MemoryRouter, { initialEntries: [path] }, React.createElement(App)),
    );
    await new Promise((r) => setTimeout(r, 80));
  });
  return div;
}

const seedDone = () =>
  localStorage.setItem(KEY, JSON.stringify({ state: { setupCompleted: true }, version: 0 }));

describe("client mount + 路由（白屏防護）", () => {
  beforeEach(() => localStorage.clear());

  it("全新使用者 → 任何路徑都導向初始設定精靈，不白屏", async () => {
    const div = await mountAt("/master");
    expect(div.innerHTML.length).toBeGreaterThan(200);
    expect(div.textContent).toContain("歡迎使用薪資管理系統");
  });

  it("返回使用者：/ → 本月工作台（待辦聚合首頁）", async () => {
    seedDone();
    const div = await mountAt("/");
    expect(div.textContent).toContain("本月工作台");
    expect(div.textContent).toContain("資料檢查錯誤");
    expect(div.textContent).toContain("本月應加保");
  });

  it("深連結 /sources → 法規依據頁", async () => {
    seedDone();
    const div = await mountAt("/sources");
    expect(div.textContent).toContain("法規與費率依據");
    expect(div.textContent).toContain("投保級距表（四險）");
  });



  it("專案功能隱藏（FEATURES.projects=false）→ /projects 導回每月薪資作業、不白屏", async () => {
    seedDone();
    const div = await mountAt("/projects");
    expect(div.textContent).toContain("每月薪資作業"); // * fallback → /payroll/monthly
    expect(div.textContent).not.toContain("成本與分析"); // 專案頁不顯示
  });

  it("深連結 /reports → 報表與申報中心", async () => {
    seedDone();
    const div = await mountAt("/reports");
    expect(div.textContent).toContain("報表與申報");
    expect(div.textContent).toContain("月結報表");
  });

  it("深連結 /analytics → 薪酬分析頁", async () => {
    seedDone();
    const div = await mountAt("/analytics");
    expect(div.textContent).toContain("薪酬分析");
    expect(div.textContent).toContain("成本結構");
    expect(div.textContent).toContain("調薪試算");
  });

  it("出勤功能隱藏（FEATURES.attendance=false）→ /attendance 導回每月薪資作業、不白屏", async () => {
    seedDone();
    const div = await mountAt("/attendance");
    expect(div.textContent).toContain("每月薪資作業"); // * fallback → /payroll/monthly
    expect(div.textContent).not.toContain("上班打卡"); // 出勤頁不顯示
  });

  it("深連結 /master → 基本資料頁", async () => {
    seedDone();
    const div = await mountAt("/master");
    expect(div.textContent).toContain("基本資料");
    expect(div.textContent).toContain("新進到職"); // 情境化：新增員工＝「新進到職」
    expect(div.textContent).toContain("異動紀錄"); // 頂部分頁
  });

  it("深連結 /payroll/reports → 報表步驟", async () => {
    seedDone();
    const div = await mountAt("/payroll/reports");
    expect(div.textContent).toContain("報表與薪資條");
  });

  it("未知路徑 → 導回每月薪資作業", async () => {
    seedDone();
    const div = await mountAt("/no-such-page");
    expect(div.textContent).toContain("每月薪資作業");
  });

  it("毀損的本機資料 → 不白屏", async () => {
    localStorage.setItem(KEY, "{ this is not valid json");
    const div = await mountAt("/");
    expect(div.innerHTML.length).toBeGreaterThan(200);
  });
});
