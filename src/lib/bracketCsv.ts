// 投保級距表 CSV 匯入/匯出（純函數）：年度換版整表替換用。
// 長格式（一列一級距）：表頭「保險別,月投保金額」，保險別 ∈ {勞保,職保,健保,勞退}（亦接受英文 key）。
// 解析回傳 Partial<InsuranceBrackets>（只含 CSV 出現的表），由呼叫端併入現值後再跑 V13 驗證。
import type { InsuranceBrackets } from "@/config/brackets";

const LABEL_TO_KEY: Record<string, keyof InsuranceBrackets> = {
  "勞保": "labor", "labor": "labor",
  "職保": "occupational", "職災": "occupational", "occupational": "occupational",
  "健保": "health", "health": "health",
  "勞退": "pension", "退休金": "pension", "pension": "pension",
};

const KEY_TO_LABEL: Record<keyof InsuranceBrackets, string> = {
  labor: "勞保", occupational: "職保", health: "健保", pension: "勞退",
};

export interface BracketCsvResult {
  ok: boolean;
  brackets?: Partial<InsuranceBrackets>; // 只含 CSV 中出現的表（升冪、去重）
  error?: string;
}

/** 解析級距 CSV（長格式）。容錯：跳過表頭、去千分位、排序去重；非正數/無法辨識保險別＝錯誤。 */
export function parseBracketCsv(text: string): BracketCsvResult {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return { ok: false, error: "CSV 內容為空" };

  const acc: Partial<Record<keyof InsuranceBrackets, number[]>> = {};
  const unquote = (s: string) => s.trim().replace(/^"(.*)"$/, "$1").trim();
  for (let i = 0; i < lines.length; i++) {
    // 只切第一個逗號：金額欄可能被引號包住並含千分位（如 "29,500"）
    const idx = lines[i].indexOf(",");
    if (idx < 0) return { ok: false, error: `第 ${i + 1} 列格式錯誤（需「保險別,月投保金額」兩欄）` };
    const labelRaw = unquote(lines[i].slice(0, idx));
    const amountRaw = unquote(lines[i].slice(idx + 1));
    const key = LABEL_TO_KEY[labelRaw];
    const amount = Number(amountRaw.replace(/[,\s]/g, ""));
    // 表頭列：保險別欄非四表之一且金額非數 → 視為表頭跳過
    if (!key) {
      if (i === 0 && !Number.isFinite(amount)) continue;
      return { ok: false, error: `第 ${i + 1} 列保險別「${labelRaw}」無法辨識（應為 勞保／職保／健保／勞退）` };
    }
    if (!Number.isFinite(amount) || amount <= 0) return { ok: false, error: `第 ${i + 1} 列（${labelRaw}）金額「${amountRaw}」非正數` };
    (acc[key] ??= []).push(amount);
  }

  const brackets: Partial<InsuranceBrackets> = {};
  for (const key of Object.keys(acc) as (keyof InsuranceBrackets)[]) {
    // 升冪去重
    brackets[key] = [...new Set(acc[key])].sort((a, b) => a - b);
  }
  if (Object.keys(brackets).length === 0) return { ok: false, error: "未解析到任何級距資料" };
  return { ok: true, brackets };
}

/** 匯出目前級距為長格式 CSV（供下載範本、編輯後再匯入）。 */
export function serializeBracketCsv(brackets: InsuranceBrackets): string {
  const rows: string[] = ["保險別,月投保金額"];
  (Object.keys(KEY_TO_LABEL) as (keyof InsuranceBrackets)[]).forEach((key) => {
    for (const amount of brackets[key]) rows.push(`${KEY_TO_LABEL[key]},${amount}`);
  });
  return rows.join("\n");
}
