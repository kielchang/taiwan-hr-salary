import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

/**
 * 錯誤邊界：任何執行期錯誤改顯示可復原畫面，而非白屏。
 * 提供「清除本機資料並重新載入」以救回因舊資料或快取造成的問題。
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    // eslint-disable-next-line no-console
    console.error("應用程式發生錯誤：", error);
  }

  private reset = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  private clearAndReload = () => {
    try {
      // 以前綴掃描清除本系統資料鍵：涵蓋 ":v1"、":v1:stage"、":v1:dev" 與未來的 ":v1:lock" 等子鍵；
      // 刻意保留 "taiwan-hr-salary:theme"（主題不會造成資料毀損，清掉徒增閃屏）。
      // 前綴字面值與 store 的 STORAGE_KEY 以「慣例」同步——元件庫邊界（tests/uiKit.test.ts）禁止 import @/store。
      const PREFIX = "taiwan-hr-salary:v1";
      for (const k of Object.keys(localStorage)) if (k.startsWith(PREFIX)) localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          fontFamily: "system-ui, -apple-system, 'Noto Sans TC', sans-serif",
          background: "#f8fafc",
        }}
      >
        <div
          style={{
            maxWidth: 480,
            width: "100%",
            background: "white",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: "1.5rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          }}
        >
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>畫面載入發生問題</h1>
          <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.6, margin: "0 0 16px" }}>
            可先嘗試「重新載入」。若仍無法顯示，可能是先前儲存的資料造成的——按「清除本機資料並重新載入」
            會回到初始狀態（此動作只清除這台電腦上本系統的資料）。
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              onClick={this.reset}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                background: "white",
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              重新載入
            </button>
            <button
              onClick={this.clearAndReload}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "none",
                background: "#0f172a",
                color: "white",
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              清除本機資料並重新載入
            </button>
          </div>
          <pre
            style={{
              marginTop: 16,
              padding: 12,
              background: "#f1f5f9",
              borderRadius: 8,
              fontSize: 12,
              color: "#64748b",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {String(this.state.error?.message || this.state.error)}
          </pre>
        </div>
      </div>
    );
  }
}
