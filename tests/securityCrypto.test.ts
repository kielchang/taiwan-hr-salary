// 加密純函數層（ADR-040）：AES-256-GCM roundtrip、錯誤密碼、信封判定。
// node 環境（Node 20+ 原生 globalThis.crypto.subtle）。測試用低迭代數（1000）求快——
// 正確性與迭代數無關；正式 KDF_ITERATIONS=600k 由常數測試把關。
import { describe, it, expect } from "vitest";
import {
  deriveKey, encryptString, decryptString, decryptWithPassword,
  parseCipherText, isCipherEnvelope, randomSaltB64, KDF_ITERATIONS,
  bytesToBase64, base64ToBytes,
} from "@/lib/security/crypto";

const ITER = 1000;

describe("security/crypto", () => {
  it("KDF 迭代常數＝OWASP 建議 600k（防止被悄悄調低）", () => {
    expect(KDF_ITERATIONS).toBe(600_000);
  });

  it("base64 roundtrip", () => {
    const bytes = new Uint8Array([0, 1, 2, 250, 255, 128]);
    expect(base64ToBytes(bytesToBase64(bytes))).toEqual(bytes);
  });

  it("加密→解密 roundtrip（含中文與特殊字元）", async () => {
    const salt = randomSaltB64();
    const key = await deriveKey("correct-password", salt, ITER);
    const plain = '{"state":{"name":"王小明","note":"引號\\"與，逗點"}}';
    const env = await encryptString(plain, key, salt, ITER);
    expect(isCipherEnvelope(env)).toBe(true);
    expect(env.data).not.toContain("王小明"); // 密文不含明文
    await expect(decryptString(env, key)).resolves.toBe(plain);
    await expect(decryptWithPassword(env, "correct-password")).resolves.toBe(plain);
  });

  it("錯誤密碼 → GCM tag 驗證失敗拋錯", async () => {
    const salt = randomSaltB64();
    const key = await deriveKey("correct-password", salt, ITER);
    const env = await encryptString("secret", key, salt, ITER);
    await expect(decryptWithPassword(env, "wrong-password")).rejects.toThrow();
  });

  it("每次加密 IV 不同（同鑰同文密文不重複）", async () => {
    const salt = randomSaltB64();
    const key = await deriveKey("pw", salt, ITER);
    const a = await encryptString("same", key, salt, ITER);
    const b = await encryptString("same", key, salt, ITER);
    expect(a.iv).not.toBe(b.iv);
    expect(a.data).not.toBe(b.data);
  });

  it("parseCipherText：信封可辨識；明文 persist 值與垃圾字串回 null", async () => {
    const salt = randomSaltB64();
    const key = await deriveKey("pw", salt, ITER);
    const env = await encryptString("x", key, salt, ITER);
    expect(parseCipherText(JSON.stringify(env))).not.toBeNull();
    expect(parseCipherText('{"state":{"setupCompleted":true},"version":4}')).toBeNull(); // zustand 明文格式
    expect(parseCipherText("not json at all")).toBeNull();
    expect(parseCipherText('{"enc":2,"data":"x"}')).toBeNull(); // 未知版本不誤收
  });
});
