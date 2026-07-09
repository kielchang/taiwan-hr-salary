// 功能開關（feature flags）— 尚未整合完整、暫不對外的附加功能，於此集中控制 UI 入口的顯示。
//
// 設計原則：**只隱藏 UI 入口，不刪程式碼、不刪資料、不動計算**。
//   - store slices（projects/allocations/attendance/punches）、seed／示範公司資料、
//     lib/attendance 與 lib/reports/projectCost|projectTrend 純函數、以及各元件本身全部保留。
//   - 薪資／保費／稅／報表數字完全不依賴 punch/allocation/projects（selectors 零引用），
//     故關閉這些入口不影響任何薪資結果。
//   - 整合成熟後把對應項改為 true 即可**一鍵重新啟用**，無需其他改動。
//
// 目前決策（使用者拍板）：讓人事先專注薪資作業做驗收，全環境（dev/stage/正式站）皆隱藏
// 「出勤打卡」與「專案」；純布林、與 APP_ENV 無關。
export const FEATURES = {
  /** 出勤打卡（AttendanceView＋設定「打卡設定」＋月結出勤工時參考） */
  attendance: false,
  /** 專案（ProjectsView＝工時分攤/成本/EAC＋月結工時分攤＋匯總報表專案別成本＋工作台分攤超額警示） */
  projects: false,
} as const;
