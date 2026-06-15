// 多頁 PDF 匯出：把較長的 DOM 區塊（如薪酬分析月報）擷取為點陣圖，
// 依 A4 高度切成多頁。jspdf／html2canvas 動態載入（與其他重型庫一致，獨立 chunk）。

export async function downloadNodeAsPdf(node: HTMLElement, fileName: string): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const canvas = await html2canvas(node, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
  });

  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 24;
  const imgW = pageW - margin * 2;
  const imgH = (canvas.height * imgW) / canvas.width; // 等比縮放後的總高度
  const usableH = pageH - margin * 2;
  const totalPages = Math.max(1, Math.ceil(imgH / usableH));
  const dataUrl = canvas.toDataURL("image/png");

  // 每頁畫同一張完整圖、向上位移一個可用頁高，靠頁面邊界自然裁切
  for (let p = 0; p < totalPages; p++) {
    if (p > 0) pdf.addPage();
    pdf.addImage(dataUrl, "PNG", margin, margin - p * usableH, imgW, imgH);
  }
  pdf.save(fileName);
}
