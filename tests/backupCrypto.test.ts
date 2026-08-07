// 加密備份檔（ADR-040）：文字層 roundtrip＋與既有 parseBackup 串接（驗證單一來源）。
import { describe, it, expect } from "vitest";
import { encryptBackupText, decryptBackupText, isEncryptedBackupText, ENCRYPTED_BACKUP_SCHEMA } from "@/lib/security/backupCrypto";
import { parseBackup, BACKUP_SCHEMA } from "@/lib/backup";

const PW = "backup-password";
const plainEnvelope = JSON.stringify({
  schema: BACKUP_SCHEMA,
  schemaVersion: 4,
  exportedAt: "2026-08-08T00:00:00.000Z",
  state: { employees: [{ id: "E001", name: "王小明" }] },
});

describe("backupCrypto", () => {
  it("加密備份檔可辨識、不含明文、解密後通過既有 parseBackup", async () => {
    const fileText = await encryptBackupText(plainEnvelope, PW);
    expect(isEncryptedBackupText(fileText)).toBe(true);
    expect(fileText).toContain(ENCRYPTED_BACKUP_SCHEMA);
    expect(fileText).not.toContain("王小明");
    expect(fileText).not.toContain("E001");
    const decrypted = await decryptBackupText(fileText, PW);
    const res = parseBackup(decrypted, 4);
    expect(res.ok).toBe(true);
    expect((res.env!.state as { employees: unknown[] }).employees).toHaveLength(1);
  });

  it("錯誤密碼拋錯；明文備份與垃圾字串不被誤判為加密檔", async () => {
    const fileText = await encryptBackupText(plainEnvelope, PW);
    await expect(decryptBackupText(fileText, "wrong")).rejects.toThrow();
    expect(isEncryptedBackupText(plainEnvelope)).toBe(false);
    expect(isEncryptedBackupText("not json")).toBe(false);
  });
});
