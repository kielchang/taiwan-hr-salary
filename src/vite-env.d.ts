/// <reference types="vite/client" />

// 版本資訊：由 vite.config.ts 於 build 時以 define 注入（見 src/version.ts）。
declare const __APP_VERSION__: string; // package.json 版號（SemVer）
declare const __GIT_SHA__: string; // 短 commit SHA；本地非 CI build＝"dev"
declare const __BUILD_TIME__: string; // 建置時間 ISO 字串
