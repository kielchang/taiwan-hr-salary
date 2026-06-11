// 捨入策略（README §6、P8）
//
// 「函數邊界捨入」：每個法定金額在算出時捨入一次（四捨五入至新臺幣元），
// 計算過程內部保留全精度；加總式不再捨入。
//
// 與 Excel ROUND 對齊：Excel ROUND 為「四捨五入、遠離零」（round half away from zero），
// 且運算在 IEEE 754 雙精度浮點上進行。JavaScript 同樣使用 IEEE 754 doubles，
// 因此只要乘除運算「順序」與 Excel 公式一致，中間值即位元等價，捨入輸入相同。
//
// ⚠ 重要：JS 內建 Math.round 為「round half up（朝 +∞）」，對負數與 Excel 不一致。
// 本系統金額多為正值，但仍實作 roundHalfAwayFromZero 以與 Excel 嚴格一致，
// 避免邊界（恰為 .5）情況下的系統性偏差。

/** 四捨五入至整數元，遠離零（對齊 Excel ROUND(x,0)） */
export function round(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return value < 0 ? -Math.round(-value) : Math.round(value);
}
