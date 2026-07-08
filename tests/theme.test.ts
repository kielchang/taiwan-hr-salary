// @vitest-environment jsdom
// 深色模式偏好模組：驗證預設、讀寫、resolveDark 邏輯與 documentElement class 套用。
import { describe, it, expect, beforeEach, vi } from "vitest";
import { getTheme, setTheme, resolveDark } from "@/lib/theme";

describe("theme 深色模式偏好", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
    // 預設把系統色偏好視為淺色（避免 jsdom matchMedia 缺實作時的不確定）
    vi.stubGlobal("matchMedia", (q: string) => ({
      matches: false,
      media: q,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
  });

  it("未設定時預設為 system", () => {
    expect(getTheme()).toBe("system");
  });

  it("setTheme 寫入偏好且可讀回", () => {
    setTheme("dark");
    expect(getTheme()).toBe("dark");
    setTheme("light");
    expect(getTheme()).toBe("light");
  });

  it("resolveDark：dark 恆真、light 恆假", () => {
    expect(resolveDark("dark")).toBe(true);
    expect(resolveDark("light")).toBe(false);
  });

  it("resolveDark：system 跟隨 OS 色偏好", () => {
    expect(resolveDark("system")).toBe(false); // 上面 stub matches:false
    vi.stubGlobal("matchMedia", () => ({ matches: true, addEventListener: () => {}, removeEventListener: () => {} }));
    expect(resolveDark("system")).toBe(true);
  });

  it("setTheme('dark') 會在 documentElement 掛上 .dark；'light' 卸除", () => {
    setTheme("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    setTheme("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});
