// @vitest-environment jsdom
// 加密 storage adapter＋密碼鎖生命週期（ADR-040）：
// 明文 passthrough 同步性（既有使用者零回歸）、啟用就地加密、解鎖、鎖定守衛防覆寫、
// 停用/變更密碼。jsdom 供 localStorage；crypto.subtle 若 jsdom 未提供則以 Node webcrypto 墊上。
import { describe, it, expect, beforeEach, vi } from "vitest";
import { webcrypto } from "node:crypto";

if (!globalThis.crypto?.subtle) vi.stubGlobal("crypto", webcrypto);

import {
  createSecureStorage, enableEncryption, disableEncryption, changePassword,
  unlock, lockNow, hasSessionKey, flushPendingWrites,
} from "@/lib/security/encryptedStorage";
import { readLockMeta, lockMetaKey } from "@/lib/security/lockMeta";
import { parseCipherText, decryptWithPassword } from "@/lib/security/crypto";

const KEY = "test-store:v1";
const PW = "correct-password";

beforeEach(() => {
  localStorage.clear();
  lockNow(); // 清 module 記憶體金鑰（模組層狀態跨測試共享）
});

describe("encryptedStorage（明文 passthrough）", () => {
  it("未設密碼：getItem/setItem 為同步字串（與 zustand 預設行為相同＝同步水合）", () => {
    const s = createSecureStorage();
    s.setItem(KEY, '{"state":{"a":1},"version":4}');
    const got = s.getItem(KEY);
    expect(typeof got).toBe("string"); // 非 Promise
    expect(got).toBe('{"state":{"a":1},"version":4}');
  });
});

describe("密碼鎖生命週期", () => {
  it("啟用：現有明文就地加密＋lock meta 建立；解鎖後可讀回", async () => {
    const plain = '{"state":{"employees":[{"name":"王小明"}]},"version":4}';
    localStorage.setItem(KEY, plain);
    await enableEncryption(KEY, PW);
    expect(readLockMeta(KEY)).not.toBeNull();
    const raw = localStorage.getItem(KEY)!;
    expect(parseCipherText(raw)).not.toBeNull(); // 已是密文
    expect(raw).not.toContain("王小明");
    // 模擬重開：清金鑰 → 解鎖 → getItem 解密
    lockNow();
    expect(await unlock(KEY, "wrong")).toBe(false);
    expect(hasSessionKey()).toBe(false);
    expect(await unlock(KEY, PW)).toBe(true);
    const s = createSecureStorage();
    await expect(Promise.resolve(s.getItem(KEY))).resolves.toBe(plain);
  });

  it("鎖定守衛：金鑰未載入時 setItem 不得覆寫既有密文（防 DEMO 明文覆毀資料）", async () => {
    localStorage.setItem(KEY, '{"state":{"a":1},"version":4}');
    await enableEncryption(KEY, PW);
    const cipherBefore = localStorage.getItem(KEY)!;
    lockNow(); // 模擬未解鎖狀態
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const s = createSecureStorage();
    s.setItem(KEY, '{"state":{"demo":true},"version":4}'); // 任何未解鎖前的寫入
    expect(localStorage.getItem(KEY)).toBe(cipherBefore); // 密文原封不動
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
    // 鎖定中 getItem 回 null（AppGate 擋畫面，不拋錯）
    expect(s.getItem(KEY)).toBeNull();
  });

  it("解鎖後寫入為密文且可解回（flushPendingWrites 等待落盤）", async () => {
    localStorage.setItem(KEY, '{"state":{"a":1},"version":4}');
    await enableEncryption(KEY, PW);
    const s = createSecureStorage();
    const next = '{"state":{"a":2},"version":4}';
    s.setItem(KEY, next);
    await flushPendingWrites();
    const env = parseCipherText(localStorage.getItem(KEY)!)!;
    expect(env).not.toBeNull();
    await expect(decryptWithPassword(env, PW)).resolves.toBe(next);
  });

  it("停用：資料解回明文、lock meta 清除；錯誤密碼停用失敗", async () => {
    const plain = '{"state":{"a":3},"version":4}';
    localStorage.setItem(KEY, plain);
    await enableEncryption(KEY, PW);
    expect(await disableEncryption(KEY, "wrong")).toBe(false);
    expect(readLockMeta(KEY)).not.toBeNull();
    expect(await disableEncryption(KEY, PW)).toBe(true);
    expect(readLockMeta(KEY)).toBeNull();
    expect(localStorage.getItem(KEY)).toBe(plain);
    expect(localStorage.getItem(lockMetaKey(KEY))).toBeNull();
  });

  it("變更密碼：舊密碼失效、新密碼可解鎖並讀回資料", async () => {
    const plain = '{"state":{"a":4},"version":4}';
    localStorage.setItem(KEY, plain);
    await enableEncryption(KEY, PW);
    expect(await changePassword(KEY, "wrong", "new-password-8")).toBe(false);
    expect(await changePassword(KEY, PW, "new-password-8")).toBe(true);
    lockNow();
    expect(await unlock(KEY, PW)).toBe(false); // 舊密碼失效
    expect(await unlock(KEY, "new-password-8")).toBe(true);
    const s = createSecureStorage();
    await expect(Promise.resolve(s.getItem(KEY))).resolves.toBe(plain);
  });
});
