// 薪資條批次寄送清單（ZIP 內附的對照 CSV）。
//
// 安全約束（合規08 §2.2 / 弱點 W3）：清單「不得」含 PDF 密碼或密碼規則提示——
// ZIP 本身未加密，密碼提示與加密 PDF 同包出貨等於自我抵銷加密。
// 密碼規則只存在於 HR 操作畫面與內部程序，不隨任何匯出載體出貨。

import { csvSerialize } from "./csv";

export interface DispatchRow {
  id: string; // 員工編號
  name: string;
  email: string;
  fileName: string; // 產出的 PDF 檔名；空字串＝未產生
  note?: string; // 備註（如「缺身分證未產生」）
}

/** 組寄送清單 CSV（含 BOM）。欄位固定：員工編號,姓名,Email,檔名,備註。 */
export function buildDispatchCsv(rows: DispatchRow[]): string {
  return csvSerialize(
    ["員工編號", "姓名", "Email", "檔名", "備註"],
    rows.map((r) => [r.id, r.name, r.email, r.fileName, r.note ?? ""]),
  );
}
