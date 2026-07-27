# 版號邏輯（Versioning）

> 定稿：使用者拍板。目的＝**畫面上能精準對回「目前部署的是哪一次 commit、何時建置」**。

## 版號組成

| 元件 | 來源 | 由誰維護 | 範例 |
|---|---|---|---|
| 語意版號（SemVer） | `package.json` 的 `version` | **人**（發佈時 bump） | `1.1.0` |
| commit SHA（短） | CI 環境變數 `GITHUB_SHA` 前 7 碼 | 自動（build 時注入） | `ec1a4e9` |
| 建置時間 | build 當下時間（ISO） | 自動（build 時注入） | `2026-07-07 22:06`（顯示台北 UTC+8） |

- 人看的是 `v1.1.0`；**SHA＋建置時間是鐵的識別**，即使忘了 bump 版號，每次部署也都能唯一辨識並對回 GitHub commit。
- 「軟體版本 `1.x.y`」與畫面上的「參數年度 民國 115 年」是**兩個獨立概念**，互不混用。

## 遞增規則（SemVer）

- **major（`2.0.0`）**：破壞性變更、大改版、或年度法規參數大改（如切到 116 年制度）。
- **minor（`1.2.0`）**：新增功能（如本次的生命週期、固定津貼、版號顯示）。
- **patch（`1.1.1`）**：修 bug、文件、樣式微調。

實際由開發者依當批變更判斷，寫在發佈 commit 與 `CHANGELOG.md`。

## 注入機制（技術）

`vite.config.ts` 於 build 時以 `define` 將三個常數打進前端；`src/version.ts` 統一讀取並提供給側邊欄、設定「關於」、列印頁尾（單一事實來源）。

```
__APP_VERSION__ = package.json version
__GIT_SHA__     = process.env.GITHUB_SHA?.slice(0,7) ?? "dev"   // 本地/非 CI＝dev
__BUILD_TIME__  = new Date().toISOString()
```

- **本地 / 非 CI build**：SHA 顯示 `dev`（`v1.1.0 · dev`），與正式部署一眼區分。
- 型別宣告見 `src/vite-env.d.ts`；`src/version.ts` 以 `typeof` 防呆（未注入時不炸）。

## 顯示位置

1. **側邊欄最底**：常駐小字 `v1.1.0 · <sha>`，可點開對應 GitHub commit。
2. **系統設定 → 資料與安全 →「關於 / 版本」**：版號、commit（連結）、建置時間（台北）、參數年度、線上站連結。
3. **報表／薪資條列印頁尾**：`薪資管理系統　v1.1.0 · <sha>　<產生時間>`，供日後辨識報表由哪版產出。

## 發佈流程（每次上線 main 都要有版號）

1. 在開發分支：依變更決定 bump 幅度，改 `package.json` `version`。
2. 更新 `CHANGELOG.md`（新增一段：版號＋日期＋變更；標題格式 `## [X.Y.Z] - YYYY-MM-DD`）。
3. commit、push 開發分支；跑 `tsc -b --force`＋`vitest`＋`build` 全綠。
4. 取得使用者同意後合併到 `main`、push（觸發 Pages 部署）。
5. **tag／Release 自動化**：`deploy-pages.yml` 的 `release` job 會依 `package.json` 版號自動建立 `vX.Y.Z` tag 與 GitHub Release（Release 內容取自 `CHANGELOG.md` 對應段落）；**該版已存在則略過**，所以只有 bump 版號時才會產生新 Release。一般不需手動打 tag。

> - CI runner 內建 `GITHUB_SHA`，build 步驟自動取用注入版號 SHA；`release` job 用 `github.token`（`contents: write`）建立 tag/Release，不受本地環境限制。
> - 手動補 tag（需要時）：`git tag -a vX.Y.Z <sha> -m vX.Y.Z && git push origin vX.Y.Z`（若你的環境允許推 tag）。

## 操作手冊版本對映（manual/）

手冊（Docusaurus）以 **docs versioning** 對映系統版號，確保「文件內容＝該版系統行為」：

- 預設顯示**最新快照版**（＝正式站系統版本）；`/next/` ＝「開發中（下一版）」內容、帶未發佈橫幅；右上版本下拉可切換。
- **發佈新版（bump `package.json` version）時，同步快照手冊**：

```bash
cd manual && npm run docusaurus docs:version <X.Y.Z>
```

（config 會動態讀 `versions.json` 自動掛「系統 v<X.Y.Z>」標籤與 lastVersion，**不必手改 config**。）
- UI 畫面改版時（元件/畫面外觀變更），重錄手冊的操作畫面素材：

```bash
npm run build && npx vite preview --port 4179 &   # 起已建置的系統
node manual/scripts/capture-flows.mjs              # 重錄 → manual/static/flows/
```

- 守衛：`tests/manualStories.test.ts` 確保手冊引用的 Storybook story 與流程素材存在；
  `deploy-manual.yml` 在 `src/components/**`／`.storybook/**` 變更時也會重佈手冊（內嵌 storybook 同步）。
