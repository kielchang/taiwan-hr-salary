// 示範公司：約 60 名員工的完整假資料，作為「開箱即用」的預設資料與「還原為示範公司」按鈕來源。
// 目標：讓每個報表與每種狀態都有資料點亮（觸頂/最低工資/非居住者/補充保費/加退保/離職/留停/
// 級距 compa-ratio/獎金·調薪試算/多月趨勢·環比·同比/投保級距申報基準/稽核/出勤）。
// 注意：TC-9 驗收基準（src/data/seed.ts 的 SEED_* 8 人）刻意保持不變，本檔為獨立資料集。
import type {
  Employee,
  SalaryStructure,
  Dependent,
  MonthlyEvent,
  Project,
  Allocation,
  PunchRecord,
  PayrollSnapshot,
  AuditEntry,
  DeclaredInsured,
  AnalyticsConfig,
  PayGrade,
} from "@/lib/types";
import { DEFAULT_PARAMETERS } from "@/config/parameters";
import { DEFAULT_BRACKETS } from "@/config/brackets";
import { DEFAULT_ANALYTICS } from "@/config/analytics";
import { lookupInsuredAmounts } from "@/lib/calc";
import { salary, dep, evt, addMonths, buildDemoData } from "@/data/seed";

export const DEMO_PERIOD = "2026-06"; // 與「今天」一致；歷史回填 13 個月 → 含去年同月(2025-06)與上月(2026-05)

/* ───────────── 組織骨架 ───────────── */

const DEPTS = [
  "研發部", "前端部", "後端部", "品保部", "業務部", "行銷部",
  "客服部", "財務部", "會計部", "人資部", "法務部", "總務部",
];
const CCS = [
  "CC-100 管理", "CC-200 營運", "CC-300 研發", "CC-400 業務",
  "CC-500 行銷", "CC-600 客服", "CC-700 財會", "CC-800 行政",
];

export const DEMO_PROJECTS: Project[] = [
  { id: "D-A", code: "PJ-A", name: "核心平台重構", manager: "陳志明", client: "內部", budget: 12000000, startDate: "2025-09-01", endDate: "2026-08-31", status: "進行中", percentComplete: 0.55 },
  { id: "D-B", code: "PJ-B", name: "ACME 客戶導入", manager: "張家豪", client: "ACME", budget: 5000000, startDate: "2026-01-01", endDate: "2026-09-30", status: "進行中", percentComplete: 0.35 },
  { id: "D-C", code: "PJ-C", name: "行動 App 改版", manager: "林怡君", client: "內部", budget: 4500000, startDate: "2026-03-01", endDate: "2026-12-31", status: "進行中", percentComplete: 0.2 },
  { id: "D-D", code: "PJ-D", name: "2025 年度維運專案", manager: "黃淑芬", client: "內部", budget: 6000000, startDate: "2025-01-01", endDate: "2025-12-31", status: "結案", percentComplete: 1 },
  { id: "D-E", code: "PJ-E", name: "資安強化", manager: "李俊傑", client: "內部", budget: 3000000, startDate: "2026-02-01", endDate: "2026-11-30", status: "暫停", percentComplete: 0.15 },
  { id: "D-F", code: "PJ-F", name: "資料倉儲建置", manager: "吳建宏", client: "BetaCorp", budget: 7000000, startDate: "2025-11-01", endDate: "2026-10-31", status: "進行中", percentComplete: 0.45 },
  { id: "D-G", code: "PJ-G", name: "市場拓展", manager: "王美玲", client: "GammaInc", budget: 2500000, startDate: "2026-04-01", endDate: "2026-12-31", status: "進行中", percentComplete: 0.1 },
  { id: "D-H", code: "PJ-H", name: "內部自動化", manager: "蔡宗翰", client: "內部", budget: 1800000, startDate: "2026-01-01", endDate: "2026-12-31", status: "進行中", percentComplete: 0.3 },
];

export const DEMO_GRADES: PayGrade[] = [
  { id: "G1", name: "G1 初階", min: 30000, mid: 38000, max: 46000, marketMid: 40000, marketP25: 34000, marketP75: 44000 },
  { id: "G2", name: "G2 中階", min: 45000, mid: 58000, max: 72000, marketMid: 62000, marketP25: 52000, marketP75: 70000 },
  { id: "G3", name: "G3 資深", min: 70000, mid: 92000, max: 118000, marketMid: 100000, marketP25: 82000, marketP75: 112000 },
  { id: "G4", name: "G4 管理職", min: 110000, mid: 150000, max: 215000 }, // 無市場對標 → 市場 compa-ratio 為 null
];

const SURNAMES = "陳林黃張李王吳劉蔡楊許鄭謝洪郭邱曾廖賴周徐蘇葉莊".split("");
const GIVEN = [
  "志明", "怡君", "家豪", "淑芬", "俊傑", "美玲", "建宏", "雅婷", "宗翰", "佳穎",
  "承恩", "思妤", "冠宇", "欣怡", "柏翰", "詩涵", "彥廷", "郁婷", "哲瑋", "曉君",
  "宇軒", "心慈", "冠廷", "依潔", "建廷", "佩珊", "俊賢", "婉婷", "凱翔", "雅雯",
];
const TITLES: Record<string, string[]> = {
  G1: ["專員", "助理", "作業員"],
  G2: ["資深專員", "工程師", "業務代表"],
  G3: ["資深工程師", "主任", "資深顧問"],
  G4: ["經理", "協理", "處長"],
};

/* ───────────── 工具 ───────────── */

const sumComp = (s: SalaryStructure) =>
  s.baseSalary + s.managerAllowance + s.dutyAllowance + s.professionalAllowance +
  s.mealAllowance + s.transportAllowance + s.attendanceBonus + s.otherFixedAllowance;

const pick = <T,>(arr: T[], i: number): T => arr[((i % arr.length) + arr.length) % arr.length];
const nid = (i: number) => `A${String(100000000 + i * 31)}`.slice(0, 10);
const cur = (id: string, over: Partial<Omit<MonthlyEvent, "employeeId" | "period">>): MonthlyEvent =>
  ({ ...evt(id, over), period: DEMO_PERIOD });

/** 以「目標月薪資總額」回推一筆薪資結構（伙食 3,000 免稅項固定，其餘進本薪） */
function salaryForTotal(id: string, total: number, extra: Partial<Omit<SalaryStructure, "employeeId">> = {}): SalaryStructure {
  const meal = 3000;
  const fixed = (extra.managerAllowance ?? 0) + (extra.dutyAllowance ?? 0) + (extra.professionalAllowance ?? 0) +
    (extra.transportAllowance ?? 0) + (extra.attendanceBonus ?? 0) + (extra.otherFixedAllowance ?? 0);
  return salary(id, { baseSalary: Math.max(0, total - meal - fixed), mealAllowance: meal, ...extra });
}

/* ───────────── 累積容器 ───────────── */

type Built = {
  employees: Employee[];
  salaries: SalaryStructure[];
  dependents: Dependent[];
  events: MonthlyEvent[];
  gradeByEmployee: Record<string, string>;
  performanceByEmployee: Record<string, string>;
};

function emptyBuilt(): Built {
  return { employees: [], salaries: [], dependents: [], events: [], gradeByEmployee: {}, performanceByEmployee: {} };
}

/** 推入一名員工（含薪資、級距、績效、可選眷屬與當期事件） */
function add(
  b: Built,
  e: Employee,
  sal: SalaryStructure,
  gradeId: string,
  rating: string,
  deps: Dependent[] = [],
  event?: MonthlyEvent,
) {
  b.employees.push(e);
  b.salaries.push(sal);
  b.gradeByEmployee[e.id] = gradeId;
  b.performanceByEmployee[e.id] = rating;
  b.dependents.push(...deps);
  if (event) b.events.push(event);
}

/* ───────────── 釘住的邊界個案（對映各報表/計算分支） ───────────── */

function addPinned(b: Built) {
  const base: Omit<Employee, "id" | "name" | "department" | "title" | "costCenter"> = {
    hireDate: "2019-03-01", project: "", taxResidency: "居住者", withholdingMethod: "依扣繳稅額表",
    exemptionFormReceivedDate: "2026-01-10", voluntaryPensionRate: 0, nationalId: "A100000000",
    email: "demo@example.com", status: "在職",
  };
  const E = (id: string, name: string, dept: string, title: string, cc: string, over: Partial<Employee> = {}): Employee =>
    ({ ...base, id, name, department: dept, title, costCenter: cc, nationalId: nid(Number(id.slice(1))), email: `${id.toLowerCase()}@demo.example.com`, ...over });

  // P01 高薪觸頂 + 大額獎金（四表觸頂、公司+個人補充保費、依表 → manual-lookup）
  add(b, E("P01", "蔡佩珊", "總務部", "處長", CCS[0], { project: "PJ-A", voluntaryPensionRate: 0.06 }),
    salaryForTotal("P01", 200000, { managerAllowance: 20000, dutyAllowance: 5000, transportAllowance: 2000 }), "G4", "S",
    [dep("PD01", "P01", "蔡配偶", "配偶", true, true)], cur("P01", { monthlyBonus: 200000, cumulativeBonus: 800000, withheldTax: 16000 }));

  // P02 最低工資邊緣（剛好 29,500）
  add(b, E("P02", "周作業", "品保部", "作業員", CCS[1], { hireDate: "2025-12-01" }),
    salaryForTotal("P02", 29500, { attendanceBonus: 2000 }), "G1", "B", [], cur("P02", {}));

  // P03 低於最低工資（→ V1 error）
  add(b, E("P03", "徐低薪", "客服部", "助理", CCS[5], { hireDate: "2026-04-01" }),
    salaryForTotal("P03", 28000), "G1", "C", [], cur("P03", {}));

  // P04 非居住者・應稅 ≤44,250 → 6%
  add(b, E("P04", "蘇外籍", "前端部", "工程師", CCS[2], { taxResidency: "非居住者", withholdingMethod: "固定5%", exemptionFormReceivedDate: null }),
    salaryForTotal("P04", 42000), "G1", "B", [], cur("P04", {}));

  // P05 非居住者・應稅 >44,250 → 18%
  add(b, E("P05", "葉外籍", "後端部", "資深工程師", CCS[2], { taxResidency: "非居住者", withholdingMethod: "固定5%", exemptionFormReceivedDate: null }),
    salaryForTotal("P05", 62000), "G2", "A", [], cur("P05", {}));

  // P06 居住者固定5%・暫計 ≤2,000 → 免扣
  add(b, E("P06", "莊免扣", "行銷部", "專員", CCS[4], { withholdingMethod: "固定5%" }),
    salaryForTotal("P06", 38000, { attendanceBonus: 2000 }), "G1", "B", [], cur("P06", {}));

  // P07 居住者固定5%・暫計 >2,000 → 扣繳
  add(b, E("P07", "賴扣繳", "業務部", "業務代表", CCS[3], { withholdingMethod: "固定5%" }),
    salaryForTotal("P07", 62000, { dutyAllowance: 3000 }), "G2", "A", [], cur("P07", {}));

  // P08 居住者依表・無扶養・應稅 < 起扣點 → 自動 0
  add(b, E("P08", "廖低稅", "財務部", "資深專員", CCS[6]),
    salaryForTotal("P08", 60000), "G2", "B", [], cur("P08", {}));

  // P09 加班超 46 小時（→ V4 warning）
  add(b, E("P09", "曾爆肝", "研發部", "工程師", CCS[2], { project: "PJ-A" }),
    salaryForTotal("P09", 56000, { professionalAllowance: 4000 }), "G2", "A", [],
    cur("P09", { overtimeWeekday1: 40, overtimeRestday1: 10 }));

  // P10 請假混合（事假＋病假）
  add(b, E("P10", "郭請假", "客服部", "專員", CCS[5]),
    salaryForTotal("P10", 40000, { attendanceBonus: 2000 }), "G1", "C", [],
    cur("P10", { personalLeaveHours: 8, sickLeaveHours: 16 }));

  // P11 期中到職（破月比例＋加保名冊）
  add(b, E("P11", "邱新進", "行銷部", "資深專員", CCS[4], { hireDate: "2026-06-10" }),
    salaryForTotal("P11", 58000), "G2", "B", [], cur("P11", {}));

  // P12 期中離職（退保＋破月）
  add(b, E("P12", "洪離職", "業務部", "業務代表", CCS[3], { status: "離職", leaveDate: "2026-06-20" }),
    salaryForTotal("P12", 52000), "G2", "B", [], cur("P12", {}));

  // P13 留停（整月無給，採公司政策 0 → 不列入計薪、出現在停保名冊）
  add(b, E("P13", "鄭留停", "後端部", "資深工程師", CCS[2], { status: "留停", leaveDate: "2026-05-01", project: "PJ-F" }),
    salaryForTotal("P13", 88000), "G3", "B", []);

  // P16 停職半薪（本月 16 號起、逐案覆寫 0.5）→ 全月半薪＋破月
  add(b, E("P16", "許停職", "研發部", "工程師", CCS[2], { status: "停職", leaveDate: `${DEMO_PERIOD}-16`, leavePaidRatio: 0.5 }),
    salaryForTotal("P16", 60000), "G2", "C", [], cur("P16", {}));

  // P17 留停含復職日（1 號留停、16 號復職、無給）→ 當月兩端破月、次月全薪
  add(b, E("P17", "曾復職", "前端部", "資深專員", CCS[2], { status: "留停", leaveDate: `${DEMO_PERIOD}-01`, returnDate: `${DEMO_PERIOD}-16` }),
    salaryForTotal("P17", 56000), "G2", "B", [], cur("P17", {}));

  // P14 居住者但未收免稅證明（→ V6 warning）
  add(b, E("P14", "謝未繳", "人資部", "專員", CCS[0], { exemptionFormReceivedDate: null }),
    salaryForTotal("P14", 41000, { attendanceBonus: 2000 }), "G1", "B", [], cur("P14", {}));

  // P15 健保眷屬 5 名（計費封頂 3）＋健保眷與扶養眷不一致＋跨補充保費門檻獎金
  add(b, E("P15", "劉多眷", "法務部", "主任", CCS[0], { voluntaryPensionRate: 0.03 }),
    salaryForTotal("P15", 78000, { dutyAllowance: 5000 }), "G3", "A",
    [
      dep("PD15a", "P15", "劉配偶", "配偶", true, true),
      dep("PD15b", "P15", "劉長子", "子女", true, true),
      dep("PD15c", "P15", "劉次子", "子女", true, true),
      dep("PD15d", "P15", "劉父", "父母", true, false),
      dep("PD15e", "P15", "劉母", "父母", true, false),
    ],
    cur("P15", { monthlyBonus: 120000, cumulativeBonus: 360000 }));
}

/* ───────────── 批量產生（其餘 ~45 名，確定性、無亂數抖動） ───────────── */

const COUNT_GENERATED = 45;
const RATINGS = ["S", "A", "B", "C"];
const OFFSETS = [-0.22, -0.1, -0.04, 0, 0.05, 0.1, 0.18, 0.3]; // 對 grade.mid 之偏移 → compa-ratio 散布（含低於 min / 高於 max）

function addGenerated(b: Built) {
  for (let i = 0; i < COUNT_GENERATED; i++) {
    const id = `G${String(i + 1).padStart(2, "0")}`;
    const gi = i % DEMO_GRADES.length; // 平均落在 4 個職等
    const grade = DEMO_GRADES[gi];
    const target = Math.round(grade.mid * (1 + pick(OFFSETS, i)) / 100) * 100;
    const dept = pick(DEPTS, i);
    const cc = pick(CCS, i);
    const resident = i % 11 !== 5; // 約每 11 人一名非居住者
    const method = i % 2 === 0 ? "依扣繳稅額表" : "固定5%";
    const noForm = resident && i % 9 === 4; // 偶發 V6
    const hireYear = 2013 + (i % 12);
    const hireMonth = String((i % 12) + 1).padStart(2, "0");

    const e: Employee = {
      id,
      name: pick(SURNAMES, i) + pick(GIVEN, i * 7),
      department: dept,
      title: pick(TITLES[grade.id], i),
      hireDate: `${hireYear}-${hireMonth}-01`,
      costCenter: cc,
      project: i % 3 === 0 ? pick(DEMO_PROJECTS, i).code : "",
      taxResidency: resident ? "居住者" : "非居住者",
      withholdingMethod: resident ? method : "固定5%",
      exemptionFormReceivedDate: noForm ? null : "2026-01-10",
      voluntaryPensionRate: pick([0, 0, 0.03, 0.06], i),
      nationalId: nid(1000 + i),
      email: `${id.toLowerCase()}@demo.example.com`,
      status: "在職",
    };

    const sal = salaryForTotal(id, target, i % 5 === 0 ? { attendanceBonus: 2000 } : i % 5 === 2 ? { dutyAllowance: 3000 } : {});

    // 眷屬：0/1/2/3 循環；健保與扶養略有差異
    const depN = pick([0, 1, 2, 0, 3, 1], i);
    const deps: Dependent[] = [];
    for (let d = 0; d < depN; d++) {
      const rel = d === 0 ? "配偶" : d <= 2 ? "子女" : "父母";
      deps.push(dep(`${id}D${d}`, id, `${e.name.slice(0, 1)}眷${d + 1}`, rel, true, rel !== "父母"));
    }

    // 當期事件：散布加班/獎金/請假（皆合規 ≤46h）
    const over: Partial<Omit<MonthlyEvent, "employeeId" | "period">> = {};
    if (i % 4 === 0) over.overtimeWeekday1 = 4 + (i % 6);
    if (i % 7 === 3) { over.monthlyBonus = 15000 + (i % 4) * 5000; over.cumulativeBonus = over.monthlyBonus; }
    if (i % 5 === 1) over.personalLeaveHours = 8;
    if (i % 9 === 7) over.overtimeRestday1 = 6;
    const event = Object.keys(over).length ? cur(id, over) : undefined;

    add(b, e, sal, grade.id, pick(RATINGS, i * 3), deps, event);
  }
}

/* ───────────── 工時分攤、出勤、申報基準、稽核 ───────────── */

function buildAllocations(employees: Employee[]): Allocation[] {
  const out: Allocation[] = [];
  // 取前若干名員工分攤到不同專案：hours / pct 兩模式、含未分攤殘量與獎金歸屬
  const projCodes = ["D-A", "D-B", "D-C", "D-F", "D-G", "D-H"];
  let k = 0;
  for (const e of employees) {
    if (e.status === "留停") continue;
    if (k % 3 === 0) {
      // hours 模式：投入兩專案、保留殘量（availableHours 由出勤帶入概念）
      out.push({ employeeId: e.id, period: DEMO_PERIOD, mode: "hours", availableHours: 168,
        lines: [{ projectId: projCodes[k % projCodes.length], value: 96 }, { projectId: projCodes[(k + 1) % projCodes.length], value: 40 }] });
    } else if (k % 3 === 1) {
      // pct 模式：100% 單一專案
      out.push({ employeeId: e.id, period: DEMO_PERIOD, mode: "pct",
        lines: [{ projectId: projCodes[(k + 2) % projCodes.length], value: 100 }] });
    } else if (k % 5 === 2) {
      // pct 模式：未分攤殘量 + 獎金直接歸屬
      out.push({ employeeId: e.id, period: DEMO_PERIOD, mode: "pct", bonusProjectId: projCodes[k % projCodes.length],
        lines: [{ projectId: projCodes[k % projCodes.length], value: 60 }] });
    }
    k++;
    if (k > 28) break; // 約半數員工有分攤
  }
  return out;
}

function buildPunches(employees: Employee[]): PunchRecord[] {
  const out: PunchRecord[] = [];
  const day = `${DEMO_PERIOD}-16`;
  employees.forEach((e, i) => {
    if (e.status !== "在職") return;
    if (i % 2 !== 0) return; // 約半數有打卡
    out.push({ id: `${e.id}-in`, employeeId: e.id, type: "in", timestamp: `${day}T08:55:00+08:00`, lat: 25.0418, lng: 121.565, accuracy: 18, distanceM: 35, withinFence: true, ip: null, ipAllowed: null });
    out.push({ id: `${e.id}-out`, employeeId: e.id, type: "out", timestamp: `${day}T18:05:00+08:00`, lat: 25.0418, lng: 121.565, accuracy: 22, distanceM: 41, withinFence: true, ip: null, ipAllowed: null });
  });
  return out;
}

function buildDeclared(employees: Employee[], salaries: SalaryStructure[]): DeclaredInsured[] {
  const salById = new Map(salaries.map((s) => [s.employeeId, s]));
  return employees
    .filter((e) => e.status !== "留停")
    .map((e, i) => {
      const sal = salById.get(e.id);
      if (!sal) return null;
      const total = sumComp(sal);
      // 每 4 人一名以「較低薪資」設基準 → 當期級距高於申報 → 投保級距申報出現「需調整」
      const baseTotal = i % 4 === 0 ? Math.round(total * 0.82) : total;
      const ins = lookupInsuredAmounts(DEFAULT_BRACKETS, baseTotal);
      return { employeeId: e.id, labor: ins.labor, health: ins.health, pension: ins.pension, declaredAt: "2026-02-15T09:00:00+08:00" };
    })
    .filter((x): x is DeclaredInsured => x !== null);
}

function buildAudit(): AuditEntry[] {
  const mk = (id: string, at: string, action: AuditEntry["action"], summary: string, extra: Partial<AuditEntry> = {}): AuditEntry =>
    ({ id, at, actor: "示範人員", action, summary, ...extra });
  return [
    mk("A1", "2026-06-15T10:12:00+08:00", "salary", "調整 G07 本薪 48,000 → 50,000", { targetId: "G07" }),
    mk("A2", "2026-06-12T16:40:00+08:00", "employee", "新增員工 P11 邱新進（行銷部）", { targetId: "P11" }),
    mk("A3", "2026-06-10T09:05:00+08:00", "event", "填入 P01 代扣所得稅 16,000", { targetId: "P01", period: DEMO_PERIOD }),
    mk("A4", "2026-05-31T18:00:00+08:00", "confirm", "確認 2026-05 月結", { period: "2026-05" }),
    mk("A5", "2026-05-20T14:22:00+08:00", "raiseApply", "核定年度調薪方案（一致 3%）寫回薪資結構"),
    mk("A6", "2026-04-30T17:50:00+08:00", "import", "匯入 30 筆打卡紀錄"),
    mk("A7", "2026-04-01T11:15:00+08:00", "project", "新增專案 PJ-G 市場拓展", { targetId: "D-G" }),
    mk("A8", "2026-03-20T13:30:00+08:00", "employee", "員工 P12 洪離職 設定離職日 2026-06-20", { targetId: "P12" }),
  ];
}

/* ───────────── 對外：組裝完整 store 切片 ───────────── */

export type DemoCompany = {
  employees: Employee[];
  salaries: SalaryStructure[];
  dependents: Dependent[];
  events: MonthlyEvent[];
  currentPeriod: string;
  projects: Project[];
  allocations: Allocation[];
  punches: PunchRecord[];
  snapshots: PayrollSnapshot[];
  confirmations: Record<string, string>;
  auditLog: AuditEntry[];
  declaredInsured: DeclaredInsured[];
  analytics: AnalyticsConfig;
};

export function buildDemoCompany(): DemoCompany {
  const b = emptyBuilt();
  addPinned(b);
  addGenerated(b);

  // 多月歷史與快照（重用 seed.buildDemoData；依到/離職與留停自然變動人數）
  const { events: pastEvents, snapshots: allSnapshots } = buildDemoData(
    b.employees, b.salaries, b.dependents, DEFAULT_PARAMETERS, DEFAULT_BRACKETS, DEMO_PERIOD, b.events, 13,
  );
  const snapshots = allSnapshots.filter((s) => s.period !== DEMO_PERIOD); // 當月尚未確認 → 不存快照
  const confirmations: Record<string, string> = {};
  for (const s of snapshots) confirmations[s.period] = `${addMonths(s.period, 1)}-05T18:00:00+08:00`;

  const analytics: AnalyticsConfig = {
    ...DEFAULT_ANALYTICS,
    payGrades: DEMO_GRADES,
    gradeByEmployee: b.gradeByEmployee,
    performanceByEmployee: b.performanceByEmployee,
    scenario: { ...DEFAULT_ANALYTICS.scenario, poolMode: "amount", poolAmount: 3000000, method: "byPerformance", targetBudget: 3000000 },
    raiseScenario: { ...DEFAULT_ANALYTICS.raiseScenario, method: "meritMatrix", budgetMode: "pct", budgetValue: 3, targetBudget: 24000000 },
    planning: { annualPayrollBudget: 60000000 },
  };

  return {
    employees: b.employees,
    salaries: b.salaries,
    dependents: b.dependents,
    events: [...pastEvents, ...b.events],
    currentPeriod: DEMO_PERIOD,
    projects: DEMO_PROJECTS,
    allocations: buildAllocations(b.employees),
    punches: buildPunches(b.employees),
    snapshots,
    confirmations,
    auditLog: buildAudit(),
    declaredInsured: buildDeclared(b.employees, b.salaries),
    analytics,
  };
}
