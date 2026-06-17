// A2 員工批次匯入（純函數）：把 CSV 二維陣列解析為員工＋薪資，並產生驗證預覽（不寫入 store）。
import type { Employee, SalaryStructure, TaxResidency, WithholdingMethod } from "@/lib/types";
import { csvParse } from "@/lib/csv";

/** 匯入模板欄位（順序即匯出模板順序） */
export const IMPORT_COLUMNS = [
  "員工編號", "姓名", "部門", "職稱", "到職日", "身分證字號", "Email",
  "稅務身分", "扣繳方式", "勞退自提率%",
  "本薪", "主管加給", "職務加給", "專業加給", "伙食津貼", "交通津貼", "全勤獎金", "其他固定津貼",
] as const;

export type IssueLevel = "error" | "warning";
export interface ImportIssue {
  row: number; // 資料列號（1 起，不含表頭）
  level: IssueLevel;
  message: string;
}
export interface ParsedRow {
  employee: Employee;
  salary: SalaryStructure;
}
export interface ImportPreview {
  valid: ParsedRow[]; // 無 error 的列
  rows: { row: number; employee: Employee; salary: SalaryStructure; errors: string[]; warnings: string[] }[];
  issues: ImportIssue[];
  hasError: boolean;
}

const num = (v: string | undefined) => {
  const n = Number(String(v ?? "").replace(/[, ]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

/** 解析 CSV 文字 → 匯入預覽（含逐列錯誤/警告）。minWage 用於 V1 警示。 */
export function parseEmployeeCsv(text: string, minWage: number): ImportPreview {
  const grid = csvParse(text);
  const issues: ImportIssue[] = [];
  const rows: ImportPreview["rows"] = [];
  const valid: ParsedRow[] = [];
  if (grid.length < 2) {
    return { valid, rows, issues: [{ row: 0, level: "error", message: "檔案沒有資料列（需含表頭）" }], hasError: true };
  }
  // 以表頭對應欄位索引（容許順序不同；以名稱比對）
  const header = grid[0].map((h) => h.trim());
  const idx = (name: string) => header.findIndex((h) => h === name);
  const get = (cols: string[], name: string) => {
    const i = idx(name);
    return i >= 0 ? (cols[i] ?? "").trim() : "";
  };
  const seenIds = new Set<string>();

  for (let r = 1; r < grid.length; r++) {
    const cols = grid[r];
    const rowNo = r;
    const errors: string[] = [];
    const warnings: string[] = [];

    const id = get(cols, "員工編號");
    const name = get(cols, "姓名");
    if (!id) errors.push("缺員工編號");
    if (!name) errors.push("缺姓名");
    if (id && seenIds.has(id)) errors.push(`員工編號重複：${id}`);
    if (id) seenIds.add(id);

    const taxRaw = get(cols, "稅務身分");
    const taxResidency: TaxResidency = taxRaw === "非居住者" ? "非居住者" : "居住者";
    const whRaw = get(cols, "扣繳方式");
    const withholdingMethod: WithholdingMethod = whRaw === "依扣繳稅額表" ? "依扣繳稅額表" : "固定5%";

    const employee: Employee = {
      id, name,
      department: get(cols, "部門"),
      title: get(cols, "職稱"),
      hireDate: get(cols, "到職日") || new Date().toISOString().slice(0, 10),
      costCenter: "",
      project: "",
      taxResidency,
      withholdingMethod,
      exemptionFormReceivedDate: null,
      voluntaryPensionRate: Math.min(6, Math.max(0, num(get(cols, "勞退自提率%")))) / 100,
      nationalId: get(cols, "身分證字號").toUpperCase(),
      email: get(cols, "Email"),
      status: "在職",
    };
    const salary: SalaryStructure = {
      employeeId: id,
      baseSalary: num(get(cols, "本薪")),
      managerAllowance: num(get(cols, "主管加給")),
      dutyAllowance: num(get(cols, "職務加給")),
      professionalAllowance: num(get(cols, "專業加給")),
      mealAllowance: num(get(cols, "伙食津貼")),
      transportAllowance: num(get(cols, "交通津貼")),
      attendanceBonus: num(get(cols, "全勤獎金")),
      otherFixedAllowance: num(get(cols, "其他固定津貼")),
    };
    const total =
      salary.baseSalary + salary.managerAllowance + salary.dutyAllowance + salary.professionalAllowance +
      salary.mealAllowance + salary.transportAllowance + salary.attendanceBonus + salary.otherFixedAllowance;
    if (total > 0 && total < minWage) warnings.push(`月薪資總額 ${total} 低於最低工資 ${minWage}`);
    if (total === 0) warnings.push("月薪資總額為 0（請確認薪資欄）");

    errors.forEach((m) => issues.push({ row: rowNo, level: "error", message: m }));
    warnings.forEach((m) => issues.push({ row: rowNo, level: "warning", message: m }));
    rows.push({ row: rowNo, employee, salary, errors, warnings });
    if (errors.length === 0) valid.push({ employee, salary });
  }
  return { valid, rows, issues, hasError: issues.some((i) => i.level === "error") };
}
