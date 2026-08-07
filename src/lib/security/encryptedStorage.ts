// 加密 storage adapter（ADR-040）：zustand persist 的 StateStorage 實作。
//
// 行為矩陣（關鍵：未設密碼的使用者與既有行為逐位元相同、零回歸）：
//   未設密碼（現存值為明文或不存在）→ getItem/setItem **同步**明文 passthrough ＝ 同步水合。
//   已設密碼（現存值為密文信封）→ getItem 回 Promise（解密）；金鑰未載入時回 null 並由
//   AppGate 擋住畫面（skipHydration＋解鎖後手動 rehydrate），**setItem 守衛**擋掉任何
//   「鎖定中以預設狀態覆寫密文」的寫入——那是資料毀損，是本設計最要防的失敗模式。
//
// 金鑰只存 module 記憶體（不進 sessionStorage，降低 XSS 竊取面）；分頁關閉即消失。
// 已知限制（合規00 §7）：加密寫入為 async（WebCrypto 無同步 API），關閉分頁瞬間的
// 最後一筆寫入可能來不及落盤——flushPendingWrites() 供測試與關鍵流程等待寫完。

import type { StateStorage } from "zustand/middleware";
import {
  parseCipherText, deriveKey, encryptString, decryptString, decryptWithPassword,
  randomSaltB64, KDF_ITERATIONS,
} from "./crypto";
import {
  readLockMeta, writeLockMeta, clearLockMeta, LOCK_CHECK_PLAINTEXT, type LockMeta,
} from "./lockMeta";

/* ── session 金鑰（module 記憶體） ── */

let sessionKey: CryptoKey | null = null;
let sessionSalt = ""; // 與金鑰成對的 salt（加密寫入時放進信封）
let sessionIter = KDF_ITERATIONS;

export function hasSessionKey(): boolean {
  return sessionKey !== null;
}

/** 手動上鎖（清除記憶體金鑰）。閒置自動上鎖（P1）亦走此入口。 */
export function lockNow(): void {
  sessionKey = null;
  sessionSalt = "";
}

/* ── async 寫入佇列（序列化，避免亂序覆寫） ── */

let writeChain: Promise<void> = Promise.resolve();

function queueEncryptedWrite(name: string, value: string, key: CryptoKey, salt: string, iter: number): void {
  writeChain = writeChain
    .then(async () => {
      const env = await encryptString(value, key, salt, iter);
      // 寫入前再確認仍處於同一把金鑰的解鎖狀態（期間可能已 lockNow/停用加密）
      if (sessionKey === key) localStorage.setItem(name, JSON.stringify(env));
    })
    .catch((e) => {
      // eslint-disable-next-line no-console
      console.error("加密寫入失敗（本筆變更未落盤）：", e);
    });
}

/** 等待所有排隊中的加密寫入完成（測試與啟用/停用流程用）。 */
export function flushPendingWrites(): Promise<void> {
  return writeChain;
}

/* ── StateStorage 實作 ── */

export function createSecureStorage(): StateStorage {
  return {
    getItem: (name) => {
      if (typeof localStorage === "undefined") return null; // Node/CI：比照 zustand 靜默停用
      const raw = localStorage.getItem(name);
      if (raw == null) return null;
      const env = parseCipherText(raw);
      if (!env) return raw; // 明文 passthrough（同步 → 同步水合，既有使用者零回歸）
      if (!sessionKey) return null; // 鎖定中：AppGate 負責擋畫面；此處不拋錯保持可掛載
      return decryptString(env, sessionKey); // Promise<string> → 非同步水合
    },
    setItem: (name, value) => {
      if (typeof localStorage === "undefined") return;
      if (sessionKey) {
        queueEncryptedWrite(name, value, sessionKey, sessionSalt, sessionIter);
        return;
      }
      // 守衛：鎖定中（金鑰未載入）且現存值為密文 → 拒寫。沒有這道，任何 set 都會把
      // skipHydration 的預設（示範公司）明文覆蓋掉使用者密文＝資料毀損。
      const raw = localStorage.getItem(name);
      if (raw != null && parseCipherText(raw) != null) {
        // eslint-disable-next-line no-console
        console.warn("資料處於加密鎖定狀態，已忽略未解鎖前的寫入（防止覆寫密文）。");
        return;
      }
      localStorage.setItem(name, value); // 未加密模式：與 zustand 預設行為相同
    },
    removeItem: (name) => {
      if (typeof localStorage === "undefined") return;
      localStorage.removeItem(name);
    },
  };
}

/* ── 密碼鎖生命週期（UI 由 SettingsView／LockScreen 呼叫） ── */

/** 解鎖：驗密碼 → 金鑰入記憶體。回傳是否成功；成功後由呼叫端 persist.rehydrate()。 */
export async function unlock(storageKey: string, password: string): Promise<boolean> {
  const meta = readLockMeta(storageKey);
  if (!meta) return false;
  try {
    const key = await deriveKey(password, meta.salt, meta.iter);
    const check = await decryptString(meta.check, key);
    if (check !== LOCK_CHECK_PLAINTEXT) return false;
    sessionKey = key;
    sessionSalt = meta.salt;
    sessionIter = meta.iter;
    return true;
  } catch {
    return false; // GCM tag 驗證失敗＝密碼錯誤
  }
}

/** 啟用密碼鎖：建立 lock meta＋金鑰入記憶體＋現有明文資料就地加密。 */
export async function enableEncryption(storageKey: string, password: string): Promise<void> {
  const salt = randomSaltB64();
  const key = await deriveKey(password, salt, KDF_ITERATIONS);
  const check = await encryptString(LOCK_CHECK_PLAINTEXT, key, salt, KDF_ITERATIONS);
  const meta: LockMeta = { v: 1, salt, iter: KDF_ITERATIONS, check, createdAt: new Date().toISOString() };
  const raw = localStorage.getItem(storageKey);
  if (raw != null && parseCipherText(raw) == null) {
    const env = await encryptString(raw, key, salt, KDF_ITERATIONS); // 明文 → 就地加密
    localStorage.setItem(storageKey, JSON.stringify(env));
  }
  writeLockMeta(storageKey, meta);
  sessionKey = key;
  sessionSalt = salt;
  sessionIter = KDF_ITERATIONS;
}

/** 停用密碼鎖（需正確密碼）：資料解回明文、清除 lock meta 與金鑰。回傳是否成功。 */
export async function disableEncryption(storageKey: string, password: string): Promise<boolean> {
  const meta = readLockMeta(storageKey);
  if (!meta) return false;
  const ok = await unlock(storageKey, password);
  if (!ok) return false;
  await flushPendingWrites();
  const raw = localStorage.getItem(storageKey);
  const env = raw != null ? parseCipherText(raw) : null;
  if (env) {
    const plain = await decryptWithPassword(env, password);
    localStorage.setItem(storageKey, plain);
  }
  clearLockMeta(storageKey);
  lockNow();
  return true;
}

/** 變更密碼（需舊密碼）：以新 salt/金鑰重加密資料與 lock meta。回傳是否成功。
 *  先在記憶體算好全部新密文、最後才相鄰寫入 data→meta，把「資料與 meta 金鑰不一致」的
 *  中斷視窗壓到毫秒級（localStorage 無交易，無法真正原子；見合規00 §7）。 */
export async function changePassword(storageKey: string, oldPassword: string, newPassword: string): Promise<boolean> {
  const meta = readLockMeta(storageKey);
  if (!meta) return false;
  const ok = await unlock(storageKey, oldPassword);
  if (!ok) return false;
  await flushPendingWrites();
  const raw = localStorage.getItem(storageKey);
  const env = raw != null ? parseCipherText(raw) : null;
  const plain = env ? await decryptWithPassword(env, oldPassword) : null;
  const salt = randomSaltB64();
  const key = await deriveKey(newPassword, salt, KDF_ITERATIONS);
  const check = await encryptString(LOCK_CHECK_PLAINTEXT, key, salt, KDF_ITERATIONS);
  const reenc = plain != null ? await encryptString(plain, key, salt, KDF_ITERATIONS) : null;
  if (reenc) localStorage.setItem(storageKey, JSON.stringify(reenc));
  writeLockMeta(storageKey, { v: 1, salt, iter: KDF_ITERATIONS, check, createdAt: new Date().toISOString() });
  sessionKey = key;
  sessionSalt = salt;
  sessionIter = KDF_ITERATIONS;
  return true;
}
