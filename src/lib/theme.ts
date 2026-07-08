// 深色模式偏好（正式站切換）。設計原理：
//  - 刻意**獨立於 usePayrollStore**：主題是「這台裝置/瀏覽器」的顯示偏好，不是業務資料——
//    須在 clearAll（清空資料）後仍保留、不進備份信封、與資料生命週期脫鉤。故用自己的 localStorage 鍵。
//  - 鍵**不隨環境加後綴**（不同於資料的 STORAGE_KEY）：主題是純顯示偏好，同一瀏覽器下 prod/stage/dev
//    共用一份即可（設一次深色，三處都尊重），也讓 index.html 的防閃爍 inline script 能用固定鍵讀取。
//  - 套用＝在 `document.documentElement` 掛/卸 `.dark` class（Tailwind `darkMode:["class"]`）；
//    Radix portal 掛在 <body> 之下、繼承根元素的 class，故切在根元素即全站（含浮層）生效。
//  - 首次繪製前的初始 class 由 index.html 的 inline script 搶先套用（免 FOUC 白閃）；本模組負責
//    執行期同步（使用者切換、以及「跟隨系統」時 OS 色偏好變動）。
import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark" | "system";

const KEY = "taiwan-hr-salary:theme";
const listeners = new Set<() => void>();

export function getTheme(): Theme {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    /* localStorage 不可用時退回預設 */
  }
  return "system";
}

function prefersDark(): boolean {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-color-scheme: dark)").matches;
}

/** 依偏好解析「實際」是否深色（system → 看 OS 色偏好）。 */
export function resolveDark(theme: Theme): boolean {
  return theme === "dark" || (theme === "system" && prefersDark());
}

function apply(theme: Theme): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", resolveDark(theme));
}

/** 設定偏好：寫入 localStorage、即時套用、通知訂閱者（供 UI 重繪）。 */
export function setTheme(theme: Theme): void {
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    /* 忽略：無法寫入時仍套用本次 session */
  }
  apply(theme);
  listeners.forEach((l) => l());
}

export function subscribeTheme(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** app 啟動時呼叫一次：重套目前偏好＋監聽系統色偏好變化（僅「跟隨系統」時才連動）。 */
export function initTheme(): void {
  apply(getTheme());
  window.matchMedia?.("(prefers-color-scheme: dark)").addEventListener?.("change", () => {
    if (getTheme() === "system") {
      apply("system");
      listeners.forEach((l) => l());
    }
  });
}

/** 設定頁主題切換器用：回傳目前偏好與 setter（偏好變動會觸發重繪）。 */
export function useTheme(): [Theme, (t: Theme) => void] {
  const theme = useSyncExternalStore<Theme>(subscribeTheme, getTheme, () => "system");
  return [theme, setTheme];
}
