// 資料模型（README §3）— 型別定義
// 對應 Excel 工作表：員工清單、眷屬名冊、薪資結構、薪資總表（每月變動事件）。

/** 稅務身分（員工主檔） */
export type TaxResidency = "居住者" | "非居住者";

/** 扣繳方式（員工主檔；README §5.9 分流） */
export type WithholdingMethod = "依扣繳稅額表" | "固定5%";

/** 員工任職狀態（生命週期；undefined 視為「在職」以相容舊資料）
 *  離職＝終態（單向）；留停/停職/暫離＝可復職之非在職區間（以 leaveDate 起、returnDate 迄界定）。 */
export type EmployeeStatus = "在職" | "離職" | "留停" | "停職" | "暫離";

/** 可復職之非在職狀態（留停/停職/暫離）——享有「生效日＋復職日＋給薪比例」區間破月 */
export type LeaveStatus = "留停" | "停職" | "暫離";

/** 公司各非在職狀態之預設給薪比例（0＝無給、0.5＝半薪、1＝全薪）；員工可逐案覆寫 */
export type LeavePolicy = Record<LeaveStatus, number>;

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
  leaveDate?: string | null; // 離職＝離職日；留停/停職/暫離＝生效日(起) ISO（破月與加退/停保清單用）
  returnDate?: string | null; // 復職日／請假迄日 ISO（留停/停職/暫離用；空＝尚未復職）
  leavePaidRatio?: number | null; // 逐案覆寫給薪比例（0/0.5/1）；空＝採公司該狀態預設（LeavePolicy）
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
  /** 自訂固定津貼（HR 命名，如語言/值班/危險津貼）；皆屬工資、計入月薪資總額與級距（應稅） */
  customAllowances?: CustomAllowance[];
}

/** 自訂固定津貼項目（每月固定發放） */
export interface CustomAllowance {
  id: string;
  name: string;
  amount: number;
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
  percentComplete?: number; // 0~1 完成度（EVM 用；缺→僅以燃燒率外推 EAC）
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
  availableHours?: number; // 當月實際可用工時（由出勤帶入）；缺→沿用 monthlyWorkHours
}

/* ───────────── 稽核軌跡（變更紀錄；單機版以操作者姓名為 actor） ───────────── */

export type AuditAction =
  | "salary" // 薪資結構異動
  | "employee" // 員工主檔異動（含刪除）
  | "dependent" // 眷屬異動（影響健保費與扣繳起扣點）
  | "event" // 結算事件（敏感欄位如代扣稅）異動
  | "confirm" // 月結確認／取消
  | "raiseApply" // 調薪方案核定寫回
  | "import" // 批次匯入
  | "restore" // 整檔還原
  | "project" // 專案主檔異動
  | "parameter" // 法定參數／級距表異動（影響全體計算）
  | "declare" // 投保級距申報基準設定
  | "allocation" // 工時分攤異動
  | "clear"; // 清空資料

export interface AuditEntry {
  id: string;
  at: string; // ISO
  actor: string; // 操作者（單機版：系統設定的操作者姓名）
  action: AuditAction;
  targetId?: string; // 員工編號等
  period?: string;
  summary: string; // 一句話描述（含前後值）
}

/* ───────────── 調薪排程（核定於未來月份生效） ───────────── */

/** 排程調薪：核定時指定生效月份，到期由工作台套用寫回薪資結構 */
export interface ScheduledRaise {
  id: string;
  employeeId: string;
  name: string; // 快照姓名（顯示用）
  newSalary: number; // 調後月薪資總額
  effectivePeriod: string; // 生效月份 yyyy-mm
  note: string; // 方案摘要（如「merit matrix・平均 3.2%」）
  decidedAt: string; // 核定時間 ISO
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
