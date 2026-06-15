// 薪酬分析模組預設值（情境、評等係數、空級距）
import type { AnalyticsConfig, RatingTier } from "@/lib/types";

export const DEFAULT_RATING_TIERS: RatingTier[] = [
  { key: "S", label: "S（傑出）", coefficient: 1.3 },
  { key: "A", label: "A（優良）", coefficient: 1.1 },
  { key: "B", label: "B（符合）", coefficient: 1.0 },
  { key: "C", label: "C（待改善）", coefficient: 0.8 },
];

export const DEFAULT_ANALYTICS: AnalyticsConfig = {
  payGrades: [],
  gradeByEmployee: {},
  ratingTiers: DEFAULT_RATING_TIERS,
  performanceByEmployee: {},
  scenario: {
    poolMode: "percentOfPayroll",
    poolAmount: 500000,
    poolPercent: 10,
    method: "byPerformance",
    targetBudget: 0,
    includeSupplementary: true,
  },
  raiseScenario: {
    cadence: "annual",
    budgetMode: "pct",
    budgetValue: 3,
    method: "meritMatrix",
    uniformPct: 3,
    targetBudget: 0,
  },
};
