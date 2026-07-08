import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { initTheme } from "./lib/theme";
import "./index.css";

// 深色模式：inline script（index.html）已搶先套用初始 class；此處接手執行期同步
// （使用者於設定頁切換、以及「跟隨系統」時 OS 色偏好變動）。
initTheme();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      {/* HashRouter：GitHub Pages 子路徑下深連結／重新整理皆可運作，免伺服器設定 */}
      <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App />
      </HashRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);
