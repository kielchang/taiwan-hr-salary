// 元件庫（UI Kit）版本 — 單一來源，與 app 版號（package.json / src/version.ts）獨立。
//
// 這裡的版號走「元件庫自己的 SemVer」：元件的公開 API 或視覺/互動行為變動時 bump，
// 與整支 app 的發佈週期脫鉤（詳見 docs/ui-kit/README.md 與 docs/ui-kit/CHANGELOG.md）。
// 未來把 `src/components` + 依賴面切出成獨立套件時，此檔即成為套件版號來源。
export const UI_KIT = {
  /** 套件識別名（切割成 npm 套件時的 name 依據；可於發佈時改為 scoped name）。 */
  name: "hr-ui-kit",
  /** 元件庫語意化版號（獨立於 app）。 */
  version: "0.9.0",
} as const;
