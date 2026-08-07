// 稽核鏈（ADR-041）：封鏈/驗鏈、單筆竄改與順序調換偵測、AUDIT_CAP 截斷、legacy 段、
// tombstone genesis、canonicalJson 穩定性。
import { describe, it, expect } from "vitest";
import { sealEntry, verifyAuditChain, canonicalJson, chainVerdictLabel } from "@/lib/security/auditChain";
import { sha256Hex } from "@/lib/security/sha256";
import type { AuditEntry } from "@/lib/types";

const mk = (id: string, summary: string, extra: Partial<AuditEntry> = {}): AuditEntry =>
  ({ id, at: `2026-08-0${id.length}T00:00:00Z`, actor: "測試員", action: "salary", summary, ...extra });

/** 依「最舊→最新」推入，回傳 newest-first 陣列（模擬 store pushAudit）。 */
function buildChain(entries: AuditEntry[]): AuditEntry[] {
  let log: AuditEntry[] = [];
  for (const e of entries) log = [sealEntry(e, log[0]), ...log];
  return log;
}

describe("sha256Hex（同步純 JS）", () => {
  it("與已知測試向量一致", () => {
    expect(sha256Hex("")).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
    expect(sha256Hex("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    // 多區塊（>55 bytes）與中文（UTF-8 多位元組）
    expect(sha256Hex("a".repeat(100))).toBe(sha256Hex("a".repeat(100))); // 穩定
    expect(sha256Hex("稽核鏈")).toHaveLength(64);
  });
});

describe("canonicalJson", () => {
  it("鍵順序不同 → 同一字串；undefined 欄位略過", () => {
    expect(canonicalJson({ b: 1, a: [2, { d: 3, c: 4 }] })).toBe(canonicalJson({ a: [2, { c: 4, d: 3 }], b: 1 }));
    expect(canonicalJson({ a: 1, x: undefined })).toBe(canonicalJson({ a: 1 }));
  });
});

describe("verifyAuditChain", () => {
  it("正常鏈驗證通過；genesis prevHash=null", () => {
    const log = buildChain([mk("g", "第一筆"), mk("b", "第二筆"), mk("c", "第三筆")]);
    expect(log[2].prevHash).toBeNull();
    const v = verifyAuditChain(log);
    expect(v).toEqual({ ok: true, legacyCount: 0, truncated: false });
    expect(chainVerdictLabel(v)).toBe("通過");
    expect(verifyAuditChain([])).toEqual({ ok: true, legacyCount: 0, truncated: false });
  });

  it("單筆內容被改 → 驗證失敗並指出位置", () => {
    const log = buildChain([mk("g", "第一筆"), mk("b", "第二筆"), mk("c", "第三筆")]);
    const tampered = log.map((e, i) => (i === 1 ? { ...e, summary: "被改過的內容" } : e));
    const v = verifyAuditChain(tampered);
    expect(v.ok).toBe(false);
    expect(v.brokenAt).toBe(1);
    expect(chainVerdictLabel(v)).toContain("第 2 筆");
  });

  it("順序調換／中段刪除 → 驗證失敗", () => {
    const log = buildChain([mk("g", "1"), mk("b", "2"), mk("c", "3"), mk("d", "4")]);
    expect(verifyAuditChain([log[1], log[0], log[2], log[3]]).ok).toBe(false); // 調換
    expect(verifyAuditChain([log[0], log[2], log[3]]).ok).toBe(false); // 刪中段
  });

  it("AUDIT_CAP 截斷：最舊筆 prevHash 懸空 → truncated 標記、仍通過", () => {
    const log = buildChain([mk("g", "1"), mk("b", "2"), mk("c", "3")]);
    const v = verifyAuditChain(log.slice(0, 2)); // 丟掉最舊（模擬輪替）
    expect(v.ok).toBe(true);
    expect(v.truncated).toBe(true);
    expect(chainVerdictLabel(v)).toContain("截斷");
  });

  it("legacy 段（舊版無雜湊）如實揭露、不影響新段驗證", () => {
    const legacy: AuditEntry[] = [mk("L1", "舊版紀錄一"), mk("L2", "舊版紀錄二")];
    let log = [...legacy];
    log = [sealEntry(mk("n1", "新紀錄"), log[0]), ...log]; // 推在 legacy 上 → prevHash=null（legacy 無 selfHash）
    const v = verifyAuditChain(log);
    expect(v.ok).toBe(true);
    expect(v.legacyCount).toBe(2);
    expect(log[0].prevHash).toBeNull();
    expect(chainVerdictLabel(v)).toContain("舊版無雜湊紀錄 2 筆");
  });

  it("tombstone genesis（清除稽核後）：單筆新鏈驗證通過", () => {
    const tomb = sealEntry(mk("t", "清除稽核紀錄 42 筆（被清鏈頭雜湊：abcdef…）", { action: "clear" }), undefined);
    expect(verifyAuditChain([tomb])).toEqual({ ok: true, legacyCount: 0, truncated: false });
  });
});
