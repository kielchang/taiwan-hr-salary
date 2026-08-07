// 解鎖閘門（app glue，不入 barrel）：已設密碼鎖時，解鎖成功並完成 store 水合前
// 不渲染任何業務畫面（ADR-040 水合策略——store 端以 skipHydration 配合，見
// usePayrollStore persist 設定）。未設密碼鎖＝直接渲染 children，路徑零改變。
//
// 放在 App.tsx 內（而非 main.tsx）：tests/clientmount.test.tsx 直接掛 App，
// 閘門必須在同一條路徑上才受白屏防護涵蓋。
import { useState, type ReactNode } from "react";
import { usePayrollStore, STORAGE_KEY } from "@/store/usePayrollStore";
import { readLockMeta } from "@/lib/security/lockMeta";
import { unlock, hasSessionKey } from "@/lib/security/encryptedStorage";
import { LockScreen } from "./LockScreen";

export function AppGate({ children }: { children: ReactNode }) {
  // 初始判定一次即可：有 lock meta 且金鑰未載入 → 鎖定。
  // （解鎖後 setReady 切換；StrictMode 雙掛載只重跑此純讀取判定，無副作用。）
  const [ready, setReady] = useState<boolean>(() => readLockMeta(STORAGE_KEY) === null || hasSessionKey());

  if (ready) return <>{children}</>;

  return (
    <LockScreen
      onUnlock={async (password) => {
        const ok = await unlock(STORAGE_KEY, password);
        if (!ok) return false;
        await usePayrollStore.persist.rehydrate(); // skipHydration 模式下手動水合（此時金鑰已在記憶體）
        setReady(true);
        return true;
      }}
      onWipe={() => {
        try {
          // 與 ErrorBoundary 相同的前綴掃描（含 :lock 子鍵；保留 theme）
          for (const k of Object.keys(localStorage)) if (k.startsWith("taiwan-hr-salary:v1")) localStorage.removeItem(k);
        } catch {
          /* ignore */
        }
        window.location.reload();
      }}
    />
  );
}
