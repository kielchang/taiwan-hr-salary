// 通用瀏覽器下載工具（無業務相依）：屬元件庫依賴面之一，供 DataTable CSV 匯出等使用。
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
