// 驗收報告（純函數）：把導覽逐步的「通過／有問題＋備註」彙整成純文字，供一鍵複製/下載後貼回回報。
// 刻意不依賴 content/store，只吃最小結構（title+steps），方便測試與重用。

export type StepVerdict = "pass" | "issue";
export interface VerdictEntry {
  verdict: StepVerdict;
  note?: string;
}

/** 建報告所需的最小導覽形狀（與 content/tours 的 Tour 結構相容）。 */
export interface ReportTour {
  id: string;
  title: string;
  steps: { title: string }[];
}

/** 是否有任何標記（決定導覽結束時要不要跳報告）。 */
export function hasAnyVerdict(verdicts: Record<number, VerdictEntry>): boolean {
  return Object.keys(verdicts).length > 0;
}

/**
 * 產出純文字驗收報告：每步「通過/有問題/未標記」＋備註，末列統計。
 * dateStr 由呼叫端注入（純函數不取系統時間），格式自由（如 YYYY-MM-DD）。
 */
export function buildAcceptanceReport(
  tour: ReportTour,
  verdicts: Record<number, VerdictEntry>,
  dateStr: string,
): string {
  const lines: string[] = [`驗收報告：${tour.title}（${tour.id}）／${dateStr}`];
  let pass = 0, issue = 0, unmarked = 0;
  tour.steps.forEach((s, i) => {
    const v = verdicts[i];
    if (!v) { unmarked++; lines.push(`${i + 1}. ${s.title} — ⬜ 未標記`); return; }
    if (v.verdict === "pass") { pass++; lines.push(`${i + 1}. ${s.title} — ✅ 通過`); }
    else {
      issue++;
      const note = v.note?.trim();
      lines.push(`${i + 1}. ${s.title} — ❌ 有問題${note ? `：${note}` : ""}`);
    }
  });
  lines.push("—");
  lines.push(`通過 ${pass}／有問題 ${issue}／未標記 ${unmarked}（共 ${tour.steps.length} 步）`);
  return lines.join("\n");
}
