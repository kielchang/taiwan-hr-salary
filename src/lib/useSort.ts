import { useMemo, useState } from "react";

export type SortDir = "asc" | "desc";
export type SortState = { key: string; dir: SortDir } | null;

/**
 * 通用表格排序：傳入列陣列與各欄位取值器（數字或字串）。
 * 點欄頭循環：無 → 由大到小(desc) → 由小到大(asc) → 無。數字依大小、字串依繁中字典序。
 */
export function useSort<T>(
  rows: T[],
  accessors: Record<string, (row: T) => number | string>,
  initial: SortState = null,
) {
  const [sort, setSort] = useState<SortState>(initial);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const acc = accessors[sort.key];
    if (!acc) return rows;
    const out = [...rows].sort((a, b) => {
      const va = acc(a);
      const vb = acc(b);
      const cmp =
        typeof va === "number" && typeof vb === "number"
          ? va - vb
          : String(va).localeCompare(String(vb), "zh-Hant");
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return out;
  }, [rows, sort, accessors]);

  const toggle = (key: string) =>
    setSort((s) => (s && s.key === key ? (s.dir === "desc" ? { key, dir: "asc" } : null) : { key, dir: "desc" }));

  return { sorted, sort, toggle };
}
