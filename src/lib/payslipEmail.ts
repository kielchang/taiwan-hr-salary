// 薪資條 email 通知草稿（mailto）
//
// 純前端無法自動寄信（瀏覽器不能直接連 SMTP）。此處改以 mailto: 開啟使用者的
// 郵件軟體並預填收件人、主旨與內文，HR 確認後手動夾帶先前下載的加密 PDF 寄出。
// （瀏覽器安全限制：mailto 無法自動帶附件，附件需人工夾帶。）

import { formatPeriod } from "./utils";

export interface PayslipMailOptions {
  to: string; // 收件人 email
  name: string; // 員工姓名
  period: string; // 期間 yyyy-mm
  company?: string; // 公司名稱（選填）
}

/** 組出 mailto: 連結（含預填主旨與內文） */
export function buildPayslipMailto({ to, name, period, company = "本公司" }: PayslipMailOptions): string {
  const periodLabel = formatPeriod(period);
  const subject = `${company} ${periodLabel} 薪資明細`;
  const body = [
    `${name} 您好：`,
    "",
    `附件為您 ${periodLabel} 的薪資明細表（PDF）。`,
    // 安全約束（合規08 §2.2）：密碼規則不寫入信件內文——轉寄或誤寄時，收件者不應從信上得知開啟規則。
    "為保護個人資料，PDF 已加密；開啟密碼規則請洽人事單位。",
    "",
    "※ 本郵件附件需請人事人員手動夾帶；若未見附件，請與人事聯繫。",
    "※ 如有疑問請回信或洽人事部門。",
    "",
    "（此為系統產生之通知草稿，請於確認附件後寄出）",
  ].join("\n");

  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
