// 稽核鏈（ADR-041）：每筆稽核帶 prevHash（指向前一筆的 selfHash）＋ selfHash
// （對「不含 selfHash 的本筆內容」做穩定序列化後 SHA-256）。
//
// 誠實定位：**tamper-evident 非 tamper-proof**——localStorage 明文、程式碼開源，
// 有能力者可整鏈重算；本機制偵測的是「單筆誤改/竄改、順序調換、中段刪除」。
// UI 與文件措辭不得宣稱「防竄改」。
//
// 陣列順序約定（與 store pushAudit 一致）：log[0]＝最新；prevHash 指向推入當下的
// log[0]（陣列中的下一個、較舊的那筆）。鏈起點（genesis）prevHash＝null——
// 全新系統、清除稽核後的 tombstone、或推入時最新一筆是舊版無雜湊紀錄皆屬之。

import type { AuditEntry } from "@/lib/types";
import { sha256Hex } from "./sha256";

/** 穩定序列化：物件鍵排序後 JSON 化（同內容必同字串），undefined 欄位略過。 */
export function canonicalJson(v: unknown): string {
  if (v === null || typeof v !== "object") return JSON.stringify(v) ?? "null";
  if (Array.isArray(v)) return `[${v.map(canonicalJson).join(",")}]`;
  const o = v as Record<string, unknown>;
  const keys = Object.keys(o).filter((k) => o[k] !== undefined).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJson(o[k])}`).join(",")}}`;
}

function computeSelfHash(entry: AuditEntry): string {
  const { selfHash: _omit, ...rest } = entry;
  return sha256Hex(canonicalJson(rest));
}

/** 封鏈：填 prevHash（＝prev 的 selfHash；無或舊版無雜湊＝null）並計算 selfHash。 */
export function sealEntry(entry: AuditEntry, prev: AuditEntry | undefined): AuditEntry {
  const sealed: AuditEntry = { ...entry, prevHash: prev?.selfHash ?? null };
  sealed.selfHash = computeSelfHash(sealed);
  return sealed;
}

export interface ChainVerdict {
  ok: boolean;
  /** 驗證失敗的陣列索引（log[brokenAt] 內容被改或鏈接不上） */
  brokenAt?: number;
  /** 舊版（無 selfHash）紀錄筆數——不回填改寫（回填即竄改），僅如實揭露 */
  legacyCount: number;
  /** 最舊的有雜湊紀錄之 prevHash 指向已被 AUDIT_CAP 輪替掉的紀錄 */
  truncated: boolean;
}

/** 驗鏈：逐筆重算 selfHash＋驗相鄰 prevHash 鏈接。O(n)。 */
export function verifyAuditChain(log: AuditEntry[]): ChainVerdict {
  let legacyCount = 0;
  let truncated = false;
  for (let i = log.length - 1; i >= 0; i--) {
    const e = log[i];
    if (!e.selfHash) {
      legacyCount++;
      continue;
    }
    if (computeSelfHash(e) !== e.selfHash) return { ok: false, brokenAt: i, legacyCount, truncated };
    const older = log[i + 1]; // 陣列中下一個＝較舊
    if (e.prevHash == null) continue; // genesis（全新／tombstone／推入時上一筆為舊版紀錄）
    if (!older) {
      truncated = true; // 指向已被輪替掉的紀錄——標記、不算失敗
      continue;
    }
    if (!older.selfHash || older.selfHash !== e.prevHash) return { ok: false, brokenAt: i, legacyCount, truncated };
  }
  return { ok: true, legacyCount, truncated };
}

/** 驗鏈結果的人話標籤（設定頁徽章與 importAll 附註共用）。 */
export function chainVerdictLabel(v: ChainVerdict): string {
  if (!v.ok) return `第 ${(v.brokenAt ?? 0) + 1} 筆驗證異常（內容與雜湊不符或鏈接中斷）`;
  const notes: string[] = [];
  if (v.truncated) notes.push("歷史已輪替截斷");
  if (v.legacyCount > 0) notes.push(`含舊版無雜湊紀錄 ${v.legacyCount} 筆`);
  return notes.length ? `通過（${notes.join("、")}）` : "通過";
}
