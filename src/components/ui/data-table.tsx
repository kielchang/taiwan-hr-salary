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
import { Search, Download, ChevronLeft, ChevronRight, Filter, X } from "lucide-react";

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
  /** 單欄篩選型態（Excel 式）：text＝包含、range＝數值範圍、none＝不可篩。
   *  未給則自動判定：數字欄且可排序→range、有 filterText/sortValue→text、其餘 none。 */
  filter?: "text" | "range" | "none";
  /** 合計列內容（傳入「篩選後全部」列，非僅當頁） */
  total?: (rows: T[]) => ReactNode;
  /** 凍結為首欄（長表水平捲動保留脈絡） */
  freeze?: boolean;
  headerClassName?: string;
  cellClassName?: string | ((row: T) => string);
  /** 最大寬度(px)：超出以 … 截斷，hover/長壓顯示完整（提示文字取 filterText） */
  truncate?: number;
};

type ColFilter = { text: string; min: string; max: string };
const EMPTY_FILTER: ColFilter = { text: "", min: "", max: "" };

export type DataTableProps<T> = {
  rows: T[];
  columns: Column<T>[];
  getRowKey: (row: T, index: number) => string;
  initialSort?: SortState;
  /** 超過此筆數才顯示分頁器（門檻式）；預設 15 */
  pageSize?: number;
  pageSizeOptions?: number[];
  searchable?: boolean;
  searchPlaceholder?: string;
  zebra?: boolean;
  stickyHeader?: boolean;
  dense?: boolean;
  maxHeight?: string;
  /** 滑鼠/觸控指向儲存格時，highlight 當前行列（十字對準）；預設開 */
  crosshair?: boolean;
  empty?: { title: string; hint?: string; icon?: ReactNode; action?: ReactNode };
  /** 工具列額外元素（期間選擇器、其他按鈕…），置於搜尋列右側 */
  toolbar?: ReactNode;
  /** 提供則顯示「匯出 CSV」按鈕，匯出目前篩選後資料 */
  csv?: { headers: string[]; row: (row: T) => (string | number)[]; fileName: string };
  rowClassName?: (row: T) => string;
  onRowClick?: (row: T) => void;
};

/**
 * 通用資料表（全站規範）：關鍵字搜尋、**單欄篩選（文字包含／數值範圍）**、排序、門檻式分頁
 * （每頁 5/15/30/50 可選）、**十字對準 highlight**、黏性表頭、斑馬紋、凍結首欄、合計列、
 * 空狀態、CSV 匯出，皆由欄位設定驅動，確保資料量變多時一致可用。
 */
export function DataTable<T>({
  rows, columns, getRowKey, initialSort = null,
  pageSize = 15, pageSizeOptions = [5, 15, 30, 50],
  searchable = true, searchPlaceholder = "搜尋關鍵字…",
  zebra = true, stickyHeader = true, dense = false, maxHeight, crosshair = true,
  empty, toolbar, csv, rowClassName, onRowClick,
}: DataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [size, setSize] = useState(pageSize);
  const [page, setPage] = useState(0);
  const [cross, setCross] = useState<{ r: number; c: number } | null>(null);
  const [colFilters, setColFilters] = useState<Record<string, ColFilter>>({});
  const [openFilter, setOpenFilter] = useState<string | null>(null);

  // 欄位篩選型態（顯式 > 自動判定）
  const filterKind = (c: Column<T>): "text" | "range" | "none" =>
    c.filter ?? (c.numeric && c.sortValue ? "range" : c.filterText || c.sortValue ? "text" : "none");
  const colText = (c: Column<T>, r: T) => (c.filterText ? c.filterText(r) : c.sortValue ? String(c.sortValue(r)) : "");
  const getFilter = (key: string) => colFilters[key] ?? EMPTY_FILTER;
  const isFilterActive = (c: Column<T>) => {
    const f = getFilter(c.key);
    return filterKind(c) === "range" ? f.min !== "" || f.max !== "" : f.text.trim() !== "";
  };
  const activeFilterCount = columns.filter(isFilterActive).length;
  const setFilter = (key: string, patch: Partial<ColFilter>) =>
    setColFilters((m) => ({ ...m, [key]: { ...getFilter(key), ...patch } }));
  const clearFilter = (key: string) => setColFilters((m) => { const { [key]: _drop, ...rest } = m; return rest; });
  const clearAllFilters = () => setColFilters({});

  // 篩選：全域關鍵字 ＋ 單欄篩選（文字包含／數值範圍）
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const active = columns.filter(isFilterActive);
    if (!q && active.length === 0) return rows;
    const rowText = (r: T) =>
      columns.map((c) => (c.filterText ? c.filterText(r) : !c.numeric && c.sortValue ? String(c.sortValue(r)) : "")).join(" ").toLowerCase();
    return rows.filter((r) => {
      if (q && !rowText(r).includes(q)) return false;
      for (const c of active) {
        const f = getFilter(c.key);
        if (filterKind(c) === "range") {
          const v = Number(c.sortValue?.(r));
          if (Number.isNaN(v)) return false;
          if (f.min !== "" && v < Number(f.min)) return false;
          if (f.max !== "" && v > Number(f.max)) return false;
        } else if (!colText(c, r).toLowerCase().includes(f.text.trim().toLowerCase())) {
          return false;
        }
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, query, columns, colFilters]);

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
  useEffect(() => { setPage(0); }, [query, size, sort, colFilters]);
  useEffect(() => { if (page > pageCount - 1) setPage(0); }, [page, pageCount]);

  const hasTotals = columns.some((c) => c.total);
  const showToolbar = searchable || toolbar || csv || activeFilterCount > 0;

  const exportCsv = () => {
    if (!csv) return;
    saveBlob(new Blob([csvSerialize(csv.headers, sorted.map(csv.row))], { type: "text/csv;charset=utf-8" }), csv.fileName);
  };

  const xline = "bg-primary/[0.06]";
  const xcell = "bg-primary/20";

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
          {activeFilterCount > 0 && (
            <Button variant="outline" size="sm" className="h-8" onClick={clearAllFilters}>
              <X /> 清除 {activeFilterCount} 個欄位篩選
            </Button>
          )}
          {toolbar}
          <div className="ml-auto flex items-center gap-2">
            {csv && <Button variant="outline" size="sm" onClick={exportCsv}><Download /> 匯出 CSV</Button>}
          </div>
        </div>
      )}

      {sorted.length === 0 ? (
        <EmptyState
          title={query || activeFilterCount > 0 ? "查無符合的資料" : empty?.title ?? "尚無資料"}
          hint={query || activeFilterCount > 0 ? "請調整關鍵字或欄位篩選。" : empty?.hint}
          icon={empty?.icon}
          action={empty?.action}
          compact
        />
      ) : (
        <Table zebra={zebra} maxHeight={maxHeight}>
          <TableHeader sticky={stickyHeader}>
            <TableRow onMouseLeave={() => crosshair && setCross(null)}>
              {columns.map((c, ci) => {
                const kind = filterKind(c);
                const active = isFilterActive(c);
                const headClass = cn(c.freeze && freezeFirst, c.headerClassName, crosshair && cross?.c === ci && xline, "relative");
                const f = getFilter(c.key);
                const filterBtn = kind !== "none" && (
                  <button
                    type="button"
                    aria-label={`篩選 ${typeof c.header === "string" ? c.header : c.key}`}
                    onClick={(e) => { e.stopPropagation(); setOpenFilter((o) => (o === c.key ? null : c.key)); }}
                    className={cn("tap-target inline-flex shrink-0 items-center justify-center rounded p-0.5 align-middle transition-colors", active ? "text-primary" : "text-muted-foreground/40 hover:text-muted-foreground")}
                  >
                    <Filter className="size-3" />
                  </button>
                );
                const popover = openFilter === c.key && (
                  <div className={cn("absolute top-full z-50 mt-1 w-56 rounded-md border bg-popover p-2.5 text-left font-normal normal-case text-foreground shadow-lg", c.numeric ? "right-0" : "left-0")} onClick={(e) => e.stopPropagation()}>
                    {kind === "range" ? (
                      <div className="space-y-2">
                        <p className="text-xs font-medium">數值範圍</p>
                        <div className="flex items-center gap-1.5">
                          <Input type="number" placeholder="最小" className="h-8 tabular-nums" value={f.min} onChange={(e) => setFilter(c.key, { min: e.target.value })} />
                          <span className="text-xs text-muted-foreground">～</span>
                          <Input type="number" placeholder="最大" className="h-8 tabular-nums" value={f.max} onChange={(e) => setFilter(c.key, { max: e.target.value })} />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs font-medium">包含文字</p>
                        <Input autoFocus placeholder="輸入關鍵字…" className="h-8" value={f.text} onChange={(e) => setFilter(c.key, { text: e.target.value })} />
                      </div>
                    )}
                    <div className="mt-2 flex justify-between">
                      <Button variant="ghost" size="sm" className="h-7" disabled={!active} onClick={() => clearFilter(c.key)}>清除</Button>
                      <Button size="sm" className="h-7" onClick={() => setOpenFilter(null)}>完成</Button>
                    </div>
                  </div>
                );
                const inner = <span className="inline-flex items-center gap-1">{c.header}{filterBtn}{popover}</span>;
                return c.sortValue ? (
                  <SortHead key={c.key} sortKey={c.key} sort={sort} onSort={toggle} numeric={c.numeric} className={headClass}>{inner}</SortHead>
                ) : (
                  <TableHead key={c.key} className={cn(c.numeric && "text-right", headClass)}>{inner}</TableHead>
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
                {columns.map((c, ci) => {
                  const cls = typeof c.cellClassName === "function" ? c.cellClassName(row) : c.cellClassName;
                  const inRow = crosshair && cross?.r === i;
                  const inCol = crosshair && cross?.c === ci;
                  return (
                    <TableCell
                      key={c.key}
                      style={c.truncate ? { maxWidth: c.truncate } : undefined}
                      onMouseEnter={crosshair ? () => setCross({ r: i, c: ci }) : undefined}
                      onTouchStart={crosshair ? () => setCross({ r: i, c: ci }) : undefined}
                      className={cn(
                        c.numeric && "text-right tabular-nums", c.freeze && cn(freezeFirst, "font-medium"), dense && "py-1", cls,
                        (inRow || inCol) && xline, inRow && inCol && xcell,
                      )}
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

      {/* 篩選 popover 外點關閉：透明遮罩 */}
      {openFilter && <div className="fixed inset-0 z-40" onClick={() => setOpenFilter(null)} aria-hidden />}

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
