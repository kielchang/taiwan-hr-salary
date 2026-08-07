// 加密備份檔（ADR-040 同一套密碼學）：把 backup.ts 的明文 JSON 信封整段加密再落檔。
// 工作在「文字層」：加解密不重複 parseBackup 的驗證邏輯——解密後的內文仍交給既有
// parseBackup 驗 schema/版本（驗證單一來源）。不 import store。

import { isCipherEnvelope, decryptWithPassword, deriveKey, encryptString, randomSaltB64, KDF_ITERATIONS, type CipherEnvelope } from "./crypto";

export const ENCRYPTED_BACKUP_SCHEMA = "taiwan-hr-salary-encrypted";

export interface EncryptedBackupFile {
  schema: typeof ENCRYPTED_BACKUP_SCHEMA;
  v: 1;
  exportedAt: string;
  payload: CipherEnvelope;
}

/** 檔案文字是否為加密備份（匯入時先於 parseBackup 判定）。 */
export function isEncryptedBackupText(text: string): boolean {
  try {
    const d = JSON.parse(text) as Partial<EncryptedBackupFile> | null;
    return !!d && d.schema === ENCRYPTED_BACKUP_SCHEMA && d.v === 1 && isCipherEnvelope(d.payload);
  } catch {
    return false;
  }
}

/** 明文備份 JSON 文字 → 加密備份檔 JSON 文字。 */
export async function encryptBackupText(jsonText: string, password: string): Promise<string> {
  const salt = randomSaltB64();
  const key = await deriveKey(password, salt, KDF_ITERATIONS);
  const payload = await encryptString(jsonText, key, salt, KDF_ITERATIONS);
  const file: EncryptedBackupFile = { schema: ENCRYPTED_BACKUP_SCHEMA, v: 1, exportedAt: new Date().toISOString(), payload };
  return JSON.stringify(file, null, 2);
}

/** 加密備份檔 JSON 文字 → 明文備份 JSON 文字。密碼錯誤/檔案毀損 → 拋錯。 */
export async function decryptBackupText(fileText: string, password: string): Promise<string> {
  const d = JSON.parse(fileText) as EncryptedBackupFile;
  if (d.schema !== ENCRYPTED_BACKUP_SCHEMA || !isCipherEnvelope(d.payload)) throw new Error("不是本系統的加密備份檔");
  return decryptWithPassword(d.payload, password);
}
