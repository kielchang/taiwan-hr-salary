// 口語化意見回饋引擎（純函數）：把分析數據轉成人事看得懂的「結論＋建議」，
// 數據僅作為佐證（evidence）。每條意見含等級：good（良好）/ info（提醒）/ warn（需注意）。
import { ntd, pct } from "./utils";
import { gini, coefficientOfVariation, percentile } from "./analytics";

export type InsightLevel = "good" | "info" | "warn";
export interface Insight {
  level: InsightLevel;
  title: string; // 一句話結論（口語）
  detail: string; // 建議／怎麼解讀
  evidence?: string; // 佐證數據
}

/** 取前 20% 人員佔總額比例（集中度） */
export function top20Share(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => b - a);
  const total = sorted.reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  const k = Math.max(1, Math.ceil(values.length * 0.2));
  return sorted.slice(0, k).reduce((a, b) => a + b, 0) / total;
}

/* ───────── 成本結構 ───────── */
export function analyzeCost(input: {
  totalCost: number;
  ot: number;
  bonus: number;
  burden: number;
  costPerHead: number[]; // 各員工雇主總成本
}): Insight[] {
  const { totalCost, ot, bonus, burden, costPerHead } = input;
  const out: Insight[] = [];
  if (totalCost <= 0) return out;
  const otShare = ot / totalCost;
  const varShare = (ot + bonus) / totalCost;
  const share = top20Share(costPerHead);

  if (otShare > 0.08)
    out.push({ level: "warn", title: "加班成本偏高，建議檢視人力與排班", detail: "加班費佔總人事成本的比例偏高，常代表人力吃緊或工時安排可再優化；長期加班也有勞檢與健康風險。", evidence: `加班費 ${ntd(ot)} 元，占總成本 ${pct(otShare)}` });
  else if (otShare > 0.03)
    out.push({ level: "info", title: "加班成本在合理範圍", detail: "目前加班佔比尚屬常見，可持續觀察是否集中在特定部門或月份。", evidence: `加班費佔總成本 ${pct(otShare)}` });
  else
    out.push({ level: "good", title: "加班成本低、工時穩定", detail: "加班佔比很低，人力配置與工時看來穩定。", evidence: `加班費佔總成本 ${pct(otShare)}` });

  if (varShare > 0.25)
    out.push({ level: "info", title: "變動薪酬占比較高", detail: "獎金＋加班等「變動」成本占比偏高：激勵彈性大，但每月成本波動也較大，編列預算時要留緩衝。", evidence: `變動薪酬（加班＋獎金）占總成本 ${pct(varShare)}` });

  if (share > 0.5)
    out.push({ level: "warn", title: "成本集中在少數人，留意關鍵人力風險", detail: "前 20% 人員就佔了過半成本，代表對少數人依賴高；建議確認接班與留任計畫，避免單點風險。", evidence: `前 20% 人員占總成本 ${pct(share)}` });
  else
    out.push({ level: "good", title: "成本分布相對分散", detail: "成本沒有過度集中於少數人，人力結構較平衡。", evidence: `前 20% 人員占總成本 ${pct(share)}` });

  if (burden > 0) {
    const ratio = burden / (totalCost - burden || 1);
    out.push({ level: "info", title: "別忘了雇主法定負擔", detail: "薪資之外，公司還要負擔勞健保、勞退、職災等法定成本，編預算時要連同計入。", evidence: `每發 100 元薪資，公司另負擔約 ${(ratio * 100).toFixed(0)} 元法定保費` });
  }
  return out;
}

/* ───────── 分布與公平 ───────── */
export function analyzeDistribution(pays: number[], deptMedians: { label: string; value: number }[]): Insight[] {
  const out: Insight[] = [];
  if (pays.length < 2) return out;
  const g = gini(pays);
  const cv = coefficientOfVariation(pays);
  const p10 = percentile(pays, 0.1);
  const p90 = percentile(pays, 0.9);

  if (g < 0.25)
    out.push({ level: "good", title: "整體薪資分布相當平均", detail: "員工之間薪資差距小，內部公平性高；若要強化績效差異化，可在獎金或調薪上著力。", evidence: `Gini ${g.toFixed(2)}（越接近 0 越平均）` });
  else if (g <= 0.4)
    out.push({ level: "info", title: "薪資差距屬中等、常見範圍", detail: "差距在多數公司的合理區間，反映職級與年資差異即可；重點放在「差距是否對應職責」。", evidence: `Gini ${g.toFixed(2)}、CV ${pct(cv)}` });
  else
    out.push({ level: "warn", title: "薪資差距偏大，建議檢視高低兩端", detail: "差距明顯，需確認是否由少數高薪或偏低薪造成；偏低端要注意留才、偏高端要注意成本合理性。", evidence: `Gini ${g.toFixed(2)}、CV ${pct(cv)}` });

  if (p10 > 0) {
    const ratio = p90 / p10;
    out.push({ level: ratio > 4 ? "info" : "good", title: `高低薪約差 ${ratio.toFixed(1)} 倍`, detail: "把全體由低到高排，最高 10% 與最低 10% 的差距倍數；倍數越大代表頭尾拉得越開。", evidence: `P90 ${ntd(p90)} ÷ P10 ${ntd(p10)} ≈ ${ratio.toFixed(1)} 倍` });
  }

  if (deptMedians.length >= 2) {
    const sorted = [...deptMedians].filter((d) => d.value > 0).sort((a, b) => b.value - a.value);
    if (sorted.length >= 2) {
      const hi = sorted[0], lo = sorted[sorted.length - 1];
      const ratio = lo.value > 0 ? hi.value / lo.value : 0;
      if (ratio > 1.5)
        out.push({ level: "info", title: `部門間中位數差距約 ${ratio.toFixed(1)} 倍`, detail: "部門薪資中位數差距較大，確認是否反映職務性質（如業務 vs 行政）；若同性質職務差距大則需檢視。", evidence: `${hi.label} 中位 ${ntd(hi.value)}、${lo.label} 中位 ${ntd(lo.value)}` });
    }
  }
  return out;
}

/* ───────── 級距與 compa-ratio ───────── */
export function analyzeGrades(items: { compaRatio: number | null; pay: number; min: number | null; max: number | null }[], hasGrades: boolean): Insight[] {
  const out: Insight[] = [];
  if (!hasGrades) {
    out.push({ level: "info", title: "尚未建立薪資級距，無法評估定位", detail: "建立各職級的下限/中位/上限並指派員工後，就能看出每個人相對市場/內部中位是偏高或偏低（compa-ratio）。", evidence: "下方為僅內部分布的指標" });
    return out;
  }
  const rated = items.filter((i) => i.compaRatio != null);
  const below = rated.filter((i) => (i.compaRatio as number) < 0.9).length;
  const above = rated.filter((i) => (i.compaRatio as number) > 1.1).length;
  const outside = items.filter((i) => i.min != null && i.max != null && (i.pay < (i.min as number) || i.pay > (i.max as number))).length;

  if (below > 0)
    out.push({ level: "warn", title: `${below} 人薪資偏低（低於中位 90%）`, detail: "compa-ratio < 0.9 代表低於該級距中位一成以上，留才風險較高；可優先納入調薪名單。", evidence: "compa-ratio < 0.90 之人數" });
  if (above > 0)
    out.push({ level: "info", title: `${above} 人薪資偏高（高於中位 110%）`, detail: "compa-ratio > 1.1 代表已高於中位一成以上，後續調薪空間有限（接近天花板），可改以獎金激勵。", evidence: "compa-ratio > 1.10 之人數" });
  if (outside > 0)
    out.push({ level: "warn", title: `${outside} 人超出所屬級距上下限`, detail: "薪資掉出級距區間，可能是級距設定過窄或個案特殊；建議檢視級距範圍或個別說明。", evidence: "薪資 < 下限 或 > 上限 之人數" });
  if (below === 0 && above === 0 && outside === 0)
    out.push({ level: "good", title: "薪資定位健康，多數落在合理區間", detail: "大致都在級距中位附近（0.9～1.1），市場/內部定位良好。", evidence: "無偏低/偏高/超界個案" });
  return out;
}

/* ───────── 獎金／分紅試算 ───────── */
export function analyzeBonus(input: {
  method: string;
  totalBonus: number;
  targetBudget: number;
  rows: { coefficient: number; bonus: number }[];
}): Insight[] {
  const { method, totalBonus, targetBudget, rows } = input;
  const out: Insight[] = [];

  if (method === "equal")
    out.push({ level: "info", title: "目前為「均分」，與績效無關", detail: "每人領一樣多，公平但無法獎優汰劣；若想獎勵高績效，改用「按績效係數」或 merit matrix。", evidence: "分配方法＝均分" });
  else if (method === "proRataBase")
    out.push({ level: "info", title: "目前依「本薪比例」分配", detail: "本薪高者獎金高，與職級連動但與當期績效無關；要連動績效可改「按績效」或 merit matrix。", evidence: "分配方法＝按本薪" });
  else
    out.push({ level: "good", title: "獎金已與績效連動", detail: "績效係數越高獎金越高，符合「獎優」精神；可搭配下方散布圖確認高績效確實拿到較多。", evidence: "分配方法＝按績效／merit matrix" });

  // pay-for-performance 對齊度：高績效（係數高於平均）者是否拿到高於平均的獎金
  if ((method === "byPerformance" || method === "meritMatrix") && rows.length >= 3) {
    const avgCoef = rows.reduce((a, r) => a + r.coefficient, 0) / rows.length;
    const avgBonus = rows.reduce((a, r) => a + r.bonus, 0) / rows.length;
    const highPerf = rows.filter((r) => r.coefficient > avgCoef);
    const misaligned = highPerf.filter((r) => r.bonus < avgBonus).length;
    if (highPerf.length > 0 && misaligned > 0)
      out.push({ level: "info", title: `${misaligned} 位高績效者獎金低於平均`, detail: "績效高卻拿得比平均少，多半是因本薪較低（按本薪加權的副作用）；若想純獎勵表現，可調高績效係數權重或檢視級距設定。", evidence: `高於平均績效者 ${highPerf.length} 人，其中 ${misaligned} 人獎金低於平均` });
    else if (highPerf.length > 0)
      out.push({ level: "good", title: "高績效者確實拿到較高獎金", detail: "獎金與績效方向一致，pay-for-performance 對齊良好；可用散布圖再做細部確認。", evidence: `高於平均績效者皆獲高於平均獎金` });
  }

  if (targetBudget > 0) {
    const v = totalBonus - targetBudget;
    if (v > 0) out.push({ level: "warn", title: "試算發放超出目標預算", detail: "目前情境會超支，建議調降獎金池或改變分配方式。", evidence: `超出 ${ntd(v)} 元（發放 ${ntd(totalBonus)} / 目標 ${ntd(targetBudget)}）` });
    else out.push({ level: "good", title: "在目標預算內", detail: "試算總額未超過目標預算，預算可控。", evidence: `結餘 ${ntd(-v)} 元` });
  }
  return out;
}

/* ───────── 年度／季度調薪試算 ───────── */
export function analyzeRaise(input: {
  totalAnnualizedCostDelta: number;
  targetBudget: number;
  giniBefore: number;
  giniAfter: number;
  avgRaisePct: number;
}): Insight[] {
  const { totalAnnualizedCostDelta, targetBudget, giniBefore, giniAfter, avgRaisePct } = input;
  const out: Insight[] = [];

  out.push({ level: "info", title: `平均調幅約 ${avgRaisePct.toFixed(1)}%`, detail: "這是全體平均；實際每人依方法不同而異。可對照通膨與同業調幅判斷競爭力。", evidence: `年化人事成本增加 ${ntd(totalAnnualizedCostDelta)} 元（已含投保保費重算）` });

  if (giniAfter < giniBefore - 0.005)
    out.push({ level: "good", title: "調薪後薪資差距縮小，公平性提升", detail: "資源較偏向拉抬偏低者，內部公平改善。", evidence: `Gini ${giniBefore.toFixed(3)} → ${giniAfter.toFixed(3)}` });
  else if (giniAfter > giniBefore + 0.005)
    out.push({ level: "warn", title: "調薪後差距擴大", detail: "調薪較集中於高薪者，差距變大；若非刻意（如獎勵關鍵人才），建議重新檢視分配。", evidence: `Gini ${giniBefore.toFixed(3)} → ${giniAfter.toFixed(3)}` });
  else
    out.push({ level: "info", title: "調薪大致維持原有差距結構", detail: "整體公平性沒有明顯變化。", evidence: `Gini ${giniBefore.toFixed(3)} → ${giniAfter.toFixed(3)}` });

  if (targetBudget > 0) {
    const v = totalAnnualizedCostDelta - targetBudget;
    if (v > 0) out.push({ level: "warn", title: "年化成本超出目標預算", detail: "目前調薪情境會超出年度預算，建議調降幅度或調整分配。", evidence: `超出 ${ntd(v)} 元` });
    else out.push({ level: "good", title: "在年度預算內", detail: "年化成本增額未超過目標預算。", evidence: `結餘 ${ntd(-v)} 元` });
  }
  return out;
}
