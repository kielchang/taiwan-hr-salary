// 示範資料去識別守衛（ADR-043）：seed 與示範公司的身分證必須是
// 「Z 開頭、regex 合法、但檢查碼不合法」的測試值——檢查碼不合法＝數學上不可能
// 屬於任何真實國民。此測試防止未來有人塞回擬真身分證。
import { describe, it, expect } from "vitest";
import { SEED_EMPLOYEES } from "@/data/seed";
import { buildDemoCompany } from "@/data/demoCompany";

/** 台灣身分證檢查碼驗證（標準演算法；僅測試用，正式驗證層 V7 刻意只驗 regex）。 */
function isValidTwId(id: string): boolean {
  if (!/^[A-Z][12]\d{8}$/.test(id)) return false;
  const letterCode: Record<string, number> = {
    A: 10, B: 11, C: 12, D: 13, E: 14, F: 15, G: 16, H: 17, I: 34, J: 18,
    K: 19, L: 20, M: 21, N: 22, O: 35, P: 23, Q: 24, R: 25, S: 26, T: 27,
    U: 28, V: 29, W: 32, X: 30, Y: 31, Z: 33,
  };
  const code = letterCode[id[0]];
  const weights = [8, 7, 6, 5, 4, 3, 2, 1];
  let sum = Math.floor(code / 10) * 1 + (code % 10) * 9;
  for (let k = 0; k < 8; k++) sum += Number(id[k + 1]) * weights[k];
  sum += Number(id[9]);
  return sum % 10 === 0;
}

describe("示範資料身分證去識別（ADR-043）", () => {
  it("演算法自檢：教科書範例 A123456789 檢查碼合法（確保下面的『不合法』斷言有意義）", () => {
    expect(isValidTwId("A123456789")).toBe(true);
  });

  it("seed 8 人：全部 Z 開頭、regex 合法、檢查碼不合法、且不重複", () => {
    const ids = SEED_EMPLOYEES.map((e) => e.nationalId);
    expect(ids).toHaveLength(8);
    for (const id of ids) {
      expect(id, id).toMatch(/^Z[12]\d{8}$/);
      expect(isValidTwId(id), `${id} 不得為檢查碼合法的真實可能號碼`).toBe(false);
    }
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("示範公司全員：全部 Z 開頭、regex 合法、檢查碼不合法、且不重複", () => {
    const demo = buildDemoCompany();
    const ids = demo.employees.map((e) => e.nationalId).filter((v) => v.trim() !== "");
    expect(ids.length).toBeGreaterThan(50);
    for (const id of ids) {
      expect(id, id).toMatch(/^Z[12]\d{8}$/);
      expect(isValidTwId(id), `${id} 不得為檢查碼合法的真實可能號碼`).toBe(false);
    }
    expect(new Set(ids).size).toBe(ids.length);
  });
});
