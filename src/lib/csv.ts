// CSV 共用工具：序列化（跳脫＋UTF-8 BOM 供 Excel 正確顯示中文）與解析
// （處理引號內逗號/換行、跳脫雙引號 ""、CRLF、開頭 BOM）。

export function csvEscape(v: string | number): string {
  const s = String(v ?? "");
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** 表頭＋資料列 → CSV 文字（預設含 BOM） */
export function csvSerialize(headers: string[], rows: (string | number)[][], bom = true): string {
  const body = [headers, ...rows].map((r) => r.map(csvEscape).join(",")).join("\r\n");
  return (bom ? "﻿" : "") + body;
}

/** CSV 文字 → 二維字串陣列（去除全空白列） */
export function csvParse(text: string): string[][] {
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const out: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      field += c; i++; continue;
    }
    if (c === '"') { inQuotes = true; i++; continue; }
    if (c === ",") { row.push(field); field = ""; i++; continue; }
    if (c === "\r") { i++; continue; }
    if (c === "\n") { row.push(field); out.push(row); row = []; field = ""; i++; continue; }
    field += c; i++;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); out.push(row); }
  return out.filter((r) => r.some((cell) => cell.trim() !== ""));
}
