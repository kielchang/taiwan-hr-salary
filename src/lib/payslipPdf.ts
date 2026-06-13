// 薪資條加密 PDF 產生器（純前端）
//
// 設計目標：PDF 版面與畫面上的薪資條「完全一致」。作法為以 html2canvas 擷取
// 已渲染的薪資條 DOM 節點為點陣圖，置入 jsPDF 的 A4 版面，再以「身分證字號」
// 設為 PDF 開啟密碼（jsPDF 標準加密／RC4）。
//
// jspdf 與 html2canvas 體積較大且僅瀏覽器可用，故以動態 import 延遲載入，
// 不影響其他頁面與測試環境。

/** 觸發瀏覽器下載一個 Blob */
export function saveBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * 擷取薪資條 DOM → 產生加密 PDF，回傳 Blob（不下載）。
 * 供單筆下載與批次打包共用。
 */
export async function payslipPdfBlob(node: HTMLElement, password: string): Promise<Blob> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  // 以 2 倍解析度擷取，確保文字清晰；強制白底（避免透明背景）
  const canvas = await html2canvas(node, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
  });

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
    // 身分證字號作為開啟密碼；擁有者密碼亦設為同值，限制僅可列印
    encryption: {
      userPassword: password,
      ownerPassword: password,
      userPermissions: ["print"],
    },
  });

  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 24;
  const maxW = pageW - margin * 2;
  const maxH = pageH - margin * 2;

  // 等比例縮放以「容納」於單頁（fit-to-page，維持版面比例）
  const ratio = Math.min(maxW / canvas.width, maxH / canvas.height);
  const imgW = canvas.width * ratio;
  const imgH = canvas.height * ratio;
  const x = (pageW - imgW) / 2;

  pdf.addImage(canvas.toDataURL("image/png"), "PNG", x, margin, imgW, imgH);
  return pdf.output("blob");
}

export interface PayslipPdfOptions {
  node: HTMLElement; // 要擷取的薪資條容器（與畫面相同）
  password: string; // PDF 開啟密碼（身分證字號）
  fileName: string; // 下載檔名
}

/** 單筆：擷取薪資條 DOM → 產生加密 PDF 並觸發下載。 */
export async function downloadEncryptedPayslip({ node, password, fileName }: PayslipPdfOptions): Promise<void> {
  const blob = await payslipPdfBlob(node, password);
  saveBlob(blob, fileName);
}
