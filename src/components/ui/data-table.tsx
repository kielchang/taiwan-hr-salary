import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell, SortHead, freezeFirst,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tooltip } from "@/components/ui/tooltip";
import { useSort, type SortState } from "@/lib/useSort";
import { csvSerialize } from "@/lib/csv";
import { saveBlob } from "@/lib/download";
import { cn } from "@/lib/utils";
import { Search, Download, ChevronLeft, ChevronRight } from "lucide-react";

/** 欄位定義：以設定描述一欄如何顯示、排序、篩選、合計。 */
export type Column<T> = {
  key: string;
  header: ReactNode;
  /** 顯示內容 */
  cell: (row: T) => ReactNode;
  /** 數字欄＝右對齊等寬 */
  numeric?: boolean;
  /** 可排序時的取值（數字或字串）；未給＝不可排序 */
  sortValue?: (row: T) => number | string;
  /** 參與關鍵字篩選的文字；未給時數字欄不參與、文字欄以 cell 推導 */
  filterText?: (row: T) => string;
  /** 合計列內容（傳入「篩選後全部」列，非僅當頁） */
  total?: (rows: T[]) => ReactNode;
  /** 凍結為首欄（長表水平捲動保留脈絡） */
  freeze?: boolean;
  headerClassName?: string;
  cellClassName?: string | ((row: T) => string);
  /** 最大寬度(px)：超出以 … 截斷，hover/長壓顯示完整（提示文字取 filterText） */
  truncate?: number;
};

export type DataTableProps<T> = {
  rows: T[];
  columns: Column<T>[];
  getRowKey: (row: T, index: number) => string;
  initialSort?: SortState;
  /** 超過此筆數才顯示分頁器（門檻式）；預設 25 */
  pageSize?: number;
  pageSizeOptions?: number[];
  searchable?: boolean;
  searchPlaceholder?: string;
  zebra?: boolean;
  stickyHeader?: boolean;
  dense?: boolean;
  maxHeight?: string;
  empty?: { title: string; hint?: string; icon?: ReactNode; action?: ReactNode };
  /** 工具列額外元素（期間選擇器、其他按鈕…），置於搜尋列右側 */
  toolbar?: ReactNode;
  /** 提供則顯示「匯出 CSV」按鈕，匯出目前篩選後資料 */
  csv?: { headers: string[]; row: (row: T) => (string | number)[]; fileName: string };
  rowClassName?: (row: T) => string;
  onRowClick?: (row: T) => void;
};

/**
 * 通用資料表（全站規範）：排序、關鍵字篩選、門檻式分頁、黏性表頭、斑馬紋、凍結首欄、
 * 合計列、空狀態、CSV 匯出，皆由欄位設定驅動，確保資料量變多時一致可用。
 */
export function DataTable<T>({
  rows, columns, getRowKey, initialSort = null,
  pageSize = 25, pageSizeOptions = [25, 50, 100],
  searchable = true, searchPlaceholder = "搜尋關鍵字…",
  zebra = true, stickyHeader = true, dense = false, maxHeight,
  empty, toolbar, csv, rowClassName, onRowClick,
}: DataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [size, setSize] = useState(pageSize);
  const [page, setPage] = useState(0);

  // 關鍵字篩選（跨所有可篩選欄）
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    const texts = (r: T) =>
      columns
        .map((c) => (c.filterText ? c.filterText(r) : !c.numeric && c.sortValue ? String(c.sortValue(r)) : ""))
        .join(" ")
        .toLowerCase();
    return rows.filter((r) => texts(r).includes(q));
  }, [rows, query, columns]);

  // 排序（依欄位 sortValue）
  const accessors = useMemo(() => {
    const m: Record<string, (row: T) => number | string> = {};
    for (const c of columns) if (c.sortValue) m[c.key] = c.sortValue;
    return m;
  }, [columns]);
  const { sorted, sort, toggle } = useSort(filtered, accessors, initialSort);

  // 分頁（門檻式：總筆數 > size 才啟用）
  const paged = sorted.length > size ? sorted.slice(page * size, page * size + size) : sorted;
  const pageCount = Math.max(1, Math.ceil(sorted.length / size));
  const showPager = sorted.length > size;

  // 篩選/排序/頁長變動時回到第一頁
  useEffect(() => { setPage(0); }, [query, size, sort]);
  useEffect(() => { if (page > pageCount - 1) setPage(0); }, [page, pageCount]);

  const hasTotals = columns.some((c) => c.total);
  const showToolbar = searchable || toolbar || csv;

  const exportCsv = () => {
    if (!csv) return;
    saveBlob(new Blob([csvSerialize(csv.headers, sorted.map(csv.row))], { type: "text/csv;charset=utf-8" }), csv.fileName);
  };

  return (
    <div className="space-y-2">
      {showToolbar && (
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          {searchable && (
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={searchPlaceholder} className="h-8 w-48 pl-7" />
            </div>
          )}
          {toolbar}
          <div className="ml-auto flex items-center gap-2">
            {csv && <Button variant="outline" size="sm" onClick={exportCsv}><Download /> 匯出 CSV</Button>}
          </div>
        </div>
      )}

      {sorted.length === 0 ? (
        <EmptyState
          title={query ? "查無符合的資料" : empty?.title ?? "尚無資料"}
          hint={query ? "請調整關鍵字或清除搜尋。" : empty?.hint}
          icon={empty?.icon}
          action={empty?.action}
          compact
        />
      ) : (
        <Table zebra={zebra} maxHeight={maxHeight}>
          <TableHeader sticky={stickyHeader}>
            <TableRow>
              {columns.map((c) => {
                const headClass = cn(c.freeze && freezeFirst, c.headerClassName);
                return c.sortValue ? (
                  <SortHead key={c.key} sortKey={c.key} sort={sort} onSort={toggle} numeric={c.numeric} className={headClass}>
                    {c.header}
                  </SortHead>
                ) : (
                  <TableHead key={c.key} className={cn(c.numeric && "text-right", headClass)}>{c.header}</TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((row, i) => (
              <TableRow
                key={getRowKey(row, i)}
                className={cn(rowClassName?.(row), onRowClick && "cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring")}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                role={onRowClick ? "button" : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={onRowClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onRowClick(row); } } : undefined}
              >
                {columns.map((c) => {
                  const cls = typeof c.cellClassName === "function" ? c.cellClassName(row) : c.cellClassName;
                  return (
                    <TableCell
                      key={c.key}
                      style={c.truncate ? { maxWidth: c.truncate } : undefined}
                      className={cn(c.numeric && "text-right tabular-nums", c.freeze && cn(freezeFirst, "font-medium"), dense && "py-1", cls)}
                    >
                      {c.truncate ? (
                        <Tooltip content={c.filterText?.(row)} className="w-full" focusable>
                          <span className="block truncate">{c.cell(row)}</span>
                        </Tooltip>
                      ) : c.cell(row)}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
          {hasTotals && (
            <TableFooter>
              <TableRow>
                {columns.map((c, i) => (
                  <TableCell key={c.key} className={cn(c.numeric && "text-right tabular-nums", c.freeze && freezeFirst)}>
                    {c.total ? c.total(sorted) : i === 0 && !columns[0].total ? "合計" : null}
                  </TableCell>
                ))}
              </TableRow>
            </TableFooter>
          )}
        </Table>
      )}

      {showPager && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground print:hidden">
          <span>
            第 {page * size + 1}–{Math.min((page + 1) * size, sorted.length)} ／ 共 {sorted.length} 筆
          </span>
          <div className="flex items-center gap-2">
            <Select value={String(size)} onValueChange={(v) => setSize(Number(v))}>
              <SelectTrigger className="h-7 w-24"><SelectValue /></SelectTrigger>
              <SelectContent>{pageSizeOptions.map((n) => <SelectItem key={n} value={String(n)}>每頁 {n}</SelectItem>)}</SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="tap-target h-7" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
              <ChevronLeft /> 上一頁
            </Button>
            <span>{page + 1} / {pageCount}</span>
            <Button variant="outline" size="sm" className="tap-target h-7" disabled={page >= pageCount - 1} onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}>
              下一頁 <ChevronRight />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
