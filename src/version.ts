// 版本資訊（單一事實來源）：側邊欄、系統設定「關於」、列印頁尾共用。
// 版號來自 package.json；commit SHA 與建置時間由 vite.config.ts 於 build 時 define 注入。
// 規則詳見 docs/versioning.md。

/** 語意化版號（SemVer），例 "1.1.0" */
export const APP_VERSION: string =
  typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "0.0.0";

/** 短 commit SHA；本地/非 CI build 為 "dev" */
export const GIT_SHA: string =
  typeof __GIT_SHA__ !== "undefined" ? __GIT_SHA__ : "dev";

/** 建置時間（ISO 字串）；本地 dev 也會有值 */
export const BUILD_TIME: string =
  typeof __BUILD_TIME__ !== "undefined" ? __BUILD_TIME__ : "";

/** 是否為正式部署版本（CI build 帶 GITHUB_SHA）；本地 dev＝false */
export const IS_RELEASE = GIT_SHA !== "dev";

/** GitHub 上對應此版本的 commit 連結（本地 dev 為 repo 首頁） */
export const COMMIT_URL = IS_RELEASE
  ? `https://github.com/kielchang/taiwan-hr-salary/commit/${GIT_SHA}`
  : "https://github.com/kielchang/taiwan-hr-salary";

/** 建置時間格式化為台北時間（UTC+8）：YYYY-MM-DD HH:mm；無值回空字串 */
export function buildTimeTaipei(): string {
  if (!BUILD_TIME) return "";
  const d = new Date(BUILD_TIME);
  if (Number.isNaN(d.getTime())) return "";
  const t = new Date(d.getTime() + 8 * 60 * 60 * 1000); // 轉 UTC+8
  const p = (n: number) => String(n).padStart(2, "0");
  return `${t.getUTCFullYear()}-${p(t.getUTCMonth() + 1)}-${p(t.getUTCDate())} ${p(t.getUTCHours())}:${p(t.getUTCMinutes())}`;
}

/** 短標籤（側邊欄／列印頁尾用），例 "v1.1.0 · a1b2c3d"（本地＝"v1.1.0 · dev"） */
export const VERSION_LABEL = `v${APP_VERSION} · ${GIT_SHA}`;
