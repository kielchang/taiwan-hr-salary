// 版本資訊模組：確認 build 時注入的版號/SHA/建置時間格式正確（供側邊欄、設定「關於」、列印頁尾共用）。
import { describe, it, expect } from "vitest";
import { APP_VERSION, GIT_SHA, VERSION_LABEL, IS_RELEASE, COMMIT_URL, buildTimeTaipei } from "@/version";

describe("version 版本資訊", () => {
  it("APP_VERSION 為語意化版號（x.y.z）", () => {
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
  it("VERSION_LABEL 為 v<版號> · <sha>", () => {
    expect(VERSION_LABEL).toBe(`v${APP_VERSION} · ${GIT_SHA}`);
    expect(VERSION_LABEL).toMatch(/^v\d+\.\d+\.\d+ · .+$/);
  });
  it("IS_RELEASE 與 GIT_SHA 一致（dev＝非部署）", () => {
    expect(IS_RELEASE).toBe(GIT_SHA !== "dev");
  });
  it("COMMIT_URL 指向 repo 或該 commit", () => {
    expect(COMMIT_URL.startsWith("https://github.com/kielchang/taiwan-hr-salary")).toBe(true);
    if (IS_RELEASE) expect(COMMIT_URL).toContain(`/commit/${GIT_SHA}`);
  });
  it("buildTimeTaipei 為 YYYY-MM-DD HH:mm 或空字串", () => {
    const s = buildTimeTaipei();
    expect(s === "" || /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(s)).toBe(true);
  });
});
