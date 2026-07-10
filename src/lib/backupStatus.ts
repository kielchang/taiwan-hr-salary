// 備份健康度（純函數）：純前端 localStorage 易失（清瀏覽器/換機即全失），
// 用這些判斷「多久沒備份、有無未備份變更、儲存空間是否逼近上限」，驅動提醒/指示/離開前 nudge。
// 皆為純函數（時間、儲存體由呼叫端注入），方便單元測試。

/** 建議備份門檻天數：距上次備份超過此天數且有未備份變更 → 提醒。 */
export const BACKUP_REMINDER_DAYS = 7;

/** localStorage 常見上限約 5MB；逼近此比例即告警（UTF-16，每字元約 2 bytes）。 */
export const STORAGE_SOFT_CAP_BYTES = 5 * 1024 * 1024;
export const STORAGE_WARN_RATIO = 0.8;

/** 距上次備份天數（無條件捨去）；lastBackupAt 為 null（從未備份）＝回傳 null。 */
export function daysSinceBackup(lastBackupAt: string | null, nowMs: number): number | null {
  if (!lastBackupAt) return null;
  const t = Date.parse(lastBackupAt);
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((nowMs - t) / 86_400_000));
}

/**
 * 是否有「未備份的變更」：稽核軌跡（權威變更紀錄）最後一筆晚於上次備份即為 dirty。
 * 從未備份但已有稽核紀錄（含載入示範/實際異動）＝dirty。auditLog 依時序 append，末筆＝最新。
 */
export function isDirtySinceBackup(auditLog: { at: string }[], lastBackupAt: string | null): boolean {
  if (auditLog.length === 0) return false;
  if (!lastBackupAt) return true;
  const last = auditLog[auditLog.length - 1]?.at ?? "";
  return last > lastBackupAt; // ISO 字串可字典序比較
}

/** 是否應跳備份提醒：有未備份變更，且（從未備份 或 距上次備份達門檻天數）。 */
export function backupReminderDue(
  dirty: boolean,
  days: number | null,
  thresholdDays: number = BACKUP_REMINDER_DAYS,
): boolean {
  if (!dirty) return false;
  return days === null || days >= thresholdDays;
}

/** 概估某 Storage 已用位元組（key+value 長度 × 2；UTF-16）。傳入 localStorage 或測試替身。 */
export function estimateStorageBytes(storage: Pick<Storage, "length" | "key" | "getItem">): number {
  let bytes = 0;
  for (let i = 0; i < storage.length; i++) {
    const k = storage.key(i);
    if (k == null) continue;
    const v = storage.getItem(k) ?? "";
    bytes += (k.length + v.length) * 2;
  }
  return bytes;
}

/** 已用/上限比例（0–1+）。 */
export function storageUsageRatio(bytes: number, cap: number = STORAGE_SOFT_CAP_BYTES): number {
  return cap > 0 ? bytes / cap : 0;
}

/** 是否逼近儲存上限（達告警比例）。 */
export function storageNearCap(bytes: number, cap: number = STORAGE_SOFT_CAP_BYTES, warnRatio: number = STORAGE_WARN_RATIO): boolean {
  return storageUsageRatio(bytes, cap) >= warnRatio;
}
