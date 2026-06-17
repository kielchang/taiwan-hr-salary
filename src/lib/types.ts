// 資料模型（README §3）— 型別定義
// 對應 Excel 工作表：員工清單、眷屬名冊、薪資結構、薪資總表（每月變動事件）。

/** 稅務身分（員工主檔） */
export type TaxResidency = "居住者" | "非居住者";

/** 扣繳方式（員工主檔；README §5.9 分流） */
export type WithholdingMethod = "依扣繳稅額表" | "固定5%";

/** 員工任職狀態（生命週期；undefined 視為「在職」以相容舊資料） */
export type EmployeeStatus = "在職" | "離職" | "留停";

/**
 * 員工主檔（README §3.2）
 * 注意：月薪資總額、投保級距、年資、特休、眷屬統計皆為「衍生值」，
 * 不存於主檔，由計算模組（§5）依薪資結構與眷屬名冊即時推導。
 */
export interface Employee {
  /** 員工編號（主鍵） */
  id: string;
  name: string;
  department: string; // 部門
  title: string; // 職稱
  hireDate: string; // 到職日 ISO yyyy-mm-dd
  costCenter: string; // 成本中心
  project: string; // 專案別
  taxResidency: TaxResidency; // 稅務身分
  withholdingMethod: WithholdingMethod; // 扣繳方式
  exemptionFormReceivedDate: string | null; // 免稅額申報表收件日（空 → V6 警示＋預設固定5%）
  voluntaryPensionRate: number; // 勞退自提率 0~0.06
  nationalId: string; // 身分證字號／居留證號（薪資條加密 PDF 之開啟密碼）
  email: string; // 員工 Email（薪資條 email 通知收件人）
  status?: EmployeeStatus; // 任職狀態（undefined＝在職）
  leaveDate?: string | null; // 離職／留停生效日 ISO（用於破月與加退保清單）
  note?: string;
}

/**
 * 薪資結構（README §3.2、P3 屬性驅動）
 * 台灣常見八項固定工資項目，皆「屬工資＝是」。
 * 伙食津貼掛「免稅上限」屬性（§5.8 免稅 min(伙食, 3000)）。
 */
export interface SalaryStructure {
  employeeId: string;
  baseSalary: number; // 本薪
  managerAllowance: number; // 主管加給
  dutyAllowance: number; // 職務加給
  professionalAllowance: number; // 專業/技術加給
  mealAllowance: number; // 伙食津貼（免稅上限 3,000）
  transportAllowance: number; // 交通津貼（固定）
  attendanceBonus: number; // 全勤獎金
  otherFixedAllowance: number; // 其他固定津貼
}

/** 眷屬名冊（README §3.2、P4 分流眷屬模型） */
export interface Dependent {
  id: string;
  employeeId: string; // 外鍵 → 員工主檔
  name: string;
  relationship: string; // 關係
  birthDate: string; // 出生年月日
  nationalId: string; // 身分證字號
  enrolledInHealthInsurance: boolean; // 依附健保 → 影響保費
  taxDependent: boolean; // 報稅扶養 → 影響扣繳起扣點
}

/**
 * 每月變動事件（README §3.2）— 對應薪資總表當月手動輸入欄。
 * 加班時數五類對應 §5.3；代扣所得稅為人工確認欄（four-eyes，§7）。
 */
export interface MonthlyEvent {
  employeeId: string;
  period: string; // 期間 yyyy-mm
  overtimeWeekday1: number; // 平日前 2 小時（×4/3）
  overtimeWeekday2: number; // 平日第 3–4 小時（×5/3）
  overtimeRestday1: number; // 休息日前 2 小時（×4/3）
  overtimeRestday2: number; // 休息日第 3 小時起（×5/3）
  overtimeHoliday: number; // 假日出勤（×1）
  personalLeaveHours: number; // 事假時數
  sickLeaveHours: number; // 病假時數
  monthlyBonus: number; // 當月獎金
  cumulativeBonus: number; // 年度累計獎金（含本月）
  otherAddition: number; // 其他加項
  otherDeduction: number; // 其他扣款
  withheldTax: number | null; // 代扣所得稅（人工轉填；null＝未填）
}

/* ───────────── 出勤打卡（額外模組；README 將出勤列為非目標，獨立於薪資管線） ───────────── */

export type PunchType = "in" | "out"; // 上班／下班

/** 單筆打卡紀錄（純前端，存於打卡當下裝置的 localStorage） */
export interface PunchRecord {
  id: string;
  employeeId: string;
  type: PunchType;
  timestamp: string; // ISO
  lat: number | null; // 緯度（取不到為 null）
  lng: number | null; // 經度
  accuracy: number | null; // 定位精度（公尺）
  distanceM: number | null; // 距公司座標（公尺）；公司座標未設定為 null
  withinFence: boolean; // 是否在允許半徑內
  ip: string | null; // 公網 IP（未啟用 IP 檢查為 null）
  ipAllowed: boolean | null; // IP 是否在允許清單（未檢查為 null）
  note?: string;
}

/** 公司打卡設定（公司自訂，存 localStorage） */
export interface AttendanceConfig {
  companyLat: number | null; // 公司座標（未設定為 null → 不做距離限制）
  companyLng: number | null;
  radiusMeters: number; // 允許半徑（公尺）
  blockOutOfFence: boolean; // 超出範圍是否禁止打卡（false＝仍記錄但標示）
  ipCheckEnabled: boolean; // 是否啟用 IP 檢查（預設關閉）
  allowedIps: string[]; // 公司對外 IP 允許清單

  // —— 彈性上下班 ——
  flexEnabled: boolean; // 是否啟用彈性上下班判定
  flexEarliestIn: string; // 彈性上班最早 "HH:mm"
  flexLatestIn: string; // 彈性上班最晚 "HH:mm"（晚於此＝遲到）
  requiredWorkMinutes: number; // 應工作時數（分鐘，不含午休）
  breakMinutes: number; // 午休（分鐘，不計工時）
  coreStart: string; // 核心時段起 "HH:mm"（空字串＝不檢查）
  coreEnd: string; // 核心時段迄 "HH:mm"
}

/* ───────────── 薪酬分析與試算（額外模組；只讀薪資資料，試算不寫回） ───────────── */

/** 薪資級距（HR 自訂；compa-ratio／區間滲透率參照） */
export interface PayGrade {
  id: string;
  name: string; // 例：P3、管理職一級
  min: number;
  mid: number; // 中位
  max: number;
  // —— 市場行情對標（選填；填了才會算「對市場」compa-ratio）——
  marketP25?: number; // 市場 P25
  marketMid?: number; // 市場中位（市場 compa-ratio 之分母）
  marketP75?: number; // 市場 P75
}

/** 績效評等係數（預設 S1.3 / A1.1 / B1.0 / C0.8） */
export interface RatingTier {
  key: string;
  label: string;
  coefficient: number;
}

export type BonusPoolMode = "amount" | "percentOfPayroll";
export type AllocationMethod = "equal" | "proRataBase" | "byPerformance" | "meritMatrix";

/** 獎金／分紅試算情境 */
export interface BonusScenario {
  poolMode: BonusPoolMode;
  poolAmount: number; // poolMode=amount
  poolPercent: number; // poolMode=percentOfPayroll，% 以 Σ月薪資總額為基數
  method: AllocationMethod;
  targetBudget: number; // 預算差異基準
  includeSupplementary: boolean; // 是否含個人二代健保補充費概估
}

export type RaiseMethod = "uniformPercent" | "proRataBase" | "byPerformance" | "meritMatrix";

/** 年度／季度調薪試算情境 */
export interface RaiseScenario {
  cadence: "annual" | "quarterly"; // 期間別
  budgetMode: "pct" | "amount"; // 調薪預算：占 Σ月薪資總額 % 或固定加薪池（月增額）
  budgetValue: number;
  method: RaiseMethod;
  uniformPct: number; // method=uniformPercent 時的一致調幅（%）
  targetBudget: number; // 年化雇主成本差異基準
}

/** 年度薪酬預算規劃（持久化） */
export interface PlanningConfig {
  annualPayrollBudget: number; // 年度人事預算（以雇主總成本計，全年）
}

/**
 * 薪酬趨勢快照：每期保存一次彙總指標，供趨勢儀表板畫時間序列。
 * 資料為當期結算後的彙總值（不含個資），存於 localStorage。
 */
export interface PayrollSnapshot {
  period: string; // yyyy-mm
  savedAt: string; // ISO 保存時間
  headcount: number;
  totalSalary: number; // Σ月薪資總額
  meanSalary: number;
  medianSalary: number;
  totalCost: number; // Σ雇主總成本（含負擔）
  employerBurden: number; // Σ雇主法定負擔
  overtimePay: number; // Σ加班費
  bonusTotal: number; // Σ當月獎金
  gini: number; // 月薪資總額之 Gini
}

/** 薪酬分析設定（持久化於 localStorage） */
export interface AnalyticsConfig {
  payGrades: PayGrade[];
  gradeByEmployee: Record<string, string>; // employeeId → gradeId
  ratingTiers: RatingTier[];
  performanceByEmployee: Record<string, string>; // employeeId → ratingTier.key
  scenario: BonusScenario;
  raiseScenario: RaiseScenario;
  planning: PlanningConfig;
}

/* ───────────── 專案主檔與工時分攤（管理會計：依工時比例分攤人事成本） ───────────── */

export type ProjectStatus = "進行中" | "結案" | "暫停";

/** 專案主檔（分攤標的；含預算供 P&L 預算 vs 實際） */
export interface Project {
  id: string; // 內部主鍵
  code: string; // 專案代號（對應舊 Employee.project 自由字串）
  name: string;
  manager: string; // PM
  client: string;
  budget: number; // 整案預算（以雇主總成本為基準）
  startDate: string; // ISO yyyy-mm-dd
  endDate: string; // ISO
  status: ProjectStatus;
}

export type AllocationMode = "hours" | "pct";

/** 單一專案分攤明細：mode=hours→時數；mode=pct→百分比(0~100) */
export interface AllocationLine {
  projectId: string;
  value: number;
}

/** 每員工每月工時分攤（缺此筆→100% 計入該員工 default/已遷移專案） */
export interface Allocation {
  employeeId: string;
  period: string; // yyyy-mm
  mode: AllocationMode;
  lines: AllocationLine[];
  bonusProjectId?: string; // 設定→當月獎金直接歸屬此專案，跳過比例分攤
}

/* ───────────── 稽核軌跡（變更紀錄；單機版以操作者姓名為 actor） ───────────── */

export type AuditAction =
  | "salary" // 薪資結構異動
  | "employee" // 員工主檔異動
  | "event" // 結算事件（敏感欄位如代扣稅）異動
  | "confirm" // 月結確認／取消
  | "raiseApply" // 調薪方案核定寫回
  | "import" // 批次匯入
  | "restore" // 整檔還原
  | "project"; // 專案主檔異動

export interface AuditEntry {
  id: string;
  at: string; // ISO
  actor: string; // 操作者（單機版：系統設定的操作者姓名）
  action: AuditAction;
  targetId?: string; // 員工編號等
  period?: string;
  summary: string; // 一句話描述（含前後值）
}

/* ───────────── 投保級距申報基準（2/8 月申報調整用） ───────────── */

/** 目前向主管機關「已申報」的投保金額基準；與當前薪資算出的級距比對找出待調整者 */
export interface DeclaredInsured {
  employeeId: string;
  labor: number;
  health: number;
  pension: number;
  declaredAt: string; // ISO 設為基準的時間
}
