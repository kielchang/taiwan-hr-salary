// 本機加密純函數層（ADR-040）：WebCrypto AES-256-GCM＋PBKDF2-SHA256 金鑰推導。
// 不 import store／UI；瀏覽器與 Node 20+（globalThis.crypto.subtle）皆可用。
//
// 威脅模型＝裝置遺失/共用電腦（合規00 §7）；選 PBKDF2 而非 Argon2 的取捨見 ADR-040
// （Argon2 需 wasm 依賴，違反零重型依賴、GitHub Pages 純靜態原則）。
// 迭代次數採 OWASP 建議 600,000；密文信封帶 kdf/iter/salt 版本欄，未來升級演算法可辨舊格式。

/** 密文信封（JSON 可序列化）。enc＝格式版本。 */
export interface CipherEnvelope {
  enc: 1;
  kdf: "PBKDF2-SHA256";
  iter: number;
  salt: string; // base64（16 bytes）
  iv: string; // base64（12 bytes，AES-GCM 標準）
  data: string; // base64 密文（含 GCM auth tag）
}

export const KDF_ITERATIONS = 600_000;

/* ── base64 ↔ bytes（瀏覽器 btoa/atob 與 Node Buffer 雙軌） ── */

export function bytesToBase64(bytes: Uint8Array): string {
  if (typeof btoa === "function") {
    let bin = "";
    for (const b of bytes) bin += String.fromCharCode(b);
    return btoa(bin);
  }
  return Buffer.from(bytes).toString("base64");
}

export function base64ToBytes(b64: string): Uint8Array {
  if (typeof atob === "function") {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  return new Uint8Array(Buffer.from(b64, "base64"));
}

/* ── 信封判定 ── */

export function isCipherEnvelope(v: unknown): v is CipherEnvelope {
  const e = v as Partial<CipherEnvelope> | null;
  return (
    !!e && typeof e === "object" && e.enc === 1 && e.kdf === "PBKDF2-SHA256" &&
    typeof e.iter === "number" && typeof e.salt === "string" &&
    typeof e.iv === "string" && typeof e.data === "string"
  );
}

/** localStorage 原始字串是否為密文信封（明文 persist 值以 {"state": 開頭，永不誤判）。 */
export function parseCipherText(raw: string): CipherEnvelope | null {
  if (!raw.startsWith('{"enc"')) return null; // 快篩：信封序列化時 enc 欄位在最前
  try {
    const v = JSON.parse(raw) as unknown;
    return isCipherEnvelope(v) ? v : null;
  } catch {
    return null;
  }
}

/* ── 金鑰推導與加解密 ── */

export function randomSaltB64(): string {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  return bytesToBase64(salt);
}

export async function deriveKey(password: string, saltB64: string, iter: number): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt: base64ToBytes(saltB64) as BufferSource, iterations: iter },
    material,
    { name: "AES-GCM", length: 256 },
    false, // non-extractable：金鑰不可匯出
    ["encrypt", "decrypt"],
  );
}

/** 加密字串 → 信封。salt/iter 由呼叫端傳入（與 lock meta 一致，信封自描述可獨立解密）。 */
export async function encryptString(plain: string, key: CryptoKey, saltB64: string, iter: number): Promise<CipherEnvelope> {
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, new TextEncoder().encode(plain));
  return { enc: 1, kdf: "PBKDF2-SHA256", iter, salt: saltB64, iv: bytesToBase64(iv), data: bytesToBase64(new Uint8Array(cipher)) };
}

/** 解密信封 → 明文字串。密碼錯誤＝GCM tag 驗證失敗 → 拋錯（呼叫端 catch 判定）。 */
export async function decryptString(env: CipherEnvelope, key: CryptoKey): Promise<string> {
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(env.iv) as BufferSource },
    key,
    base64ToBytes(env.data) as BufferSource,
  );
  return new TextDecoder().decode(plain);
}

/** 一步式：密碼＋信封 → 明文（自動依信封的 salt/iter 推導金鑰）。 */
export async function decryptWithPassword(env: CipherEnvelope, password: string): Promise<string> {
  const key = await deriveKey(password, env.salt, env.iter);
  return decryptString(env, key);
}
