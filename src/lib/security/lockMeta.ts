// 密碼鎖中繼資料（lock meta）：存於 `${STORAGE_KEY}:lock`（沿用環境後綴），內容不含任何個資——
// 只有 KDF 參數（salt/iter）與一段已知明文的加密檢核值（check，用來驗密碼對不對）。
// 讀取為**同步**：store 建立時要立刻決定 skipHydration（見 usePayrollStore persist 設定）。
// 不 import store（供 store 與 UI 兩側共用、避免循環相依）。

import { isCipherEnvelope, type CipherEnvelope } from "./crypto";

export interface LockMeta {
  v: 1;
  salt: string; // base64，與主資料加密共用
  iter: number;
  check: CipherEnvelope; // encrypt(LOCK_CHECK_PLAINTEXT)，解得回來＝密碼正確
  createdAt: string;
}

/** check 欄位的已知明文（非機密，僅供密碼驗證） */
export const LOCK_CHECK_PLAINTEXT = "taiwan-hr-salary-lock-check-v1";

export const lockMetaKey = (storageKey: string): string => `${storageKey}:lock`;

export function readLockMeta(storageKey: string): LockMeta | null {
  try {
    if (typeof localStorage === "undefined") return null; // Node/CI：與 zustand persist 相同的靜默停用語意
    const raw = localStorage.getItem(lockMetaKey(storageKey));
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<LockMeta> | null;
    if (!v || v.v !== 1 || typeof v.salt !== "string" || typeof v.iter !== "number" || !isCipherEnvelope(v.check)) return null;
    return v as LockMeta;
  } catch {
    return null;
  }
}

export function writeLockMeta(storageKey: string, meta: LockMeta): void {
  localStorage.setItem(lockMetaKey(storageKey), JSON.stringify(meta));
}

export function clearLockMeta(storageKey: string): void {
  try {
    localStorage.removeItem(lockMetaKey(storageKey));
  } catch {
    /* ignore */
  }
}
