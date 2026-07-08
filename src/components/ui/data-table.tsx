import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell, freezeFirst,
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
import { Search, Download, ChevronLeft, ChevronRight, ChevronsUpDown, ChevronUp, ChevronDown, Filter, X, Check } from "lucide-react";

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
  /** 單欄篩選型態（Excel 式）：text＝包含、range＝數值範圍、select＝從清單多選、none＝不可篩。
   *  未給則自動判定：數字欄且可排序→range、有 filterText/sortValue→text、其餘 none。 */
  filter?: "text" | "range" | "select" | "none";
  /** 合計列內容（傳入「篩選後全部」列，非僅當頁） */
  total?: (rows: T[]) => ReactNode;
  /** 凍結為首欄（長表水平捲動保留脈絡） */
  freeze?: boolean;
  headerClassName?: string;
  cellClassName?: string | ((row: T) => string);
  /** 最大寬度(px)：超出以 … 截斷，hover/長壓顯示完整（提示文字取 filterText） */
  truncate?: number;
};

type ColFilter = { text: string; min: string; max: string; values: string[] };
const EMPTY_FILTER: ColFilter = { text: "", min: "", max: "", values: [] };
const POP_W = 224;

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
  /** 可拖曳欄位邊界調整寬度、雙擊自適應內容；預設開 */
  resizable?: boolean;
  empty?: { title: string; hint?: string; icon?: ReactNode; action?: ReactNode };
  /** 工具列額外元素（期間選擇器、其他按鈕…），置於搜尋列右側 */
  toolbar?: ReactNode;
  /** 提供則顯示「匯出 CSV」按鈕，匯出目前篩選後資料 */
  csv?: { headers: string[]; row: (row: T) => (string | number)[]; fileName: string };
  rowClassName?: (row: T) => string;
  onRowClick?: (row: T) => void;
};

/**
 * 通用資料表（全站規範）：關鍵字搜尋、**單欄篩選（文字包含·數值範圍，漏斗固定於表頭最右）**、排序、
 * **可調欄寬（拖邊界／雙擊自適應）**、**十字對準 highlight**、門檻分頁（每頁 5/15/30/50，預設 15）、
 * 黏性表頭、斑馬紋、凍結首欄、合計列、空狀態、CSV 匯出，皆由欄位設定驅動。
 */
export function DataTable<T>({
  rows, columns, getRowKey, initialSort = null,
  pageSize = 15, pageSizeOptions = [5, 15, 30, 50],
  searchable = true, searchPlaceholder = "搜尋關鍵字…",
  zebra = true, stickyHeader = true, dense = false, maxHeight, crosshair = true, resizable = true,
  empty, toolbar, csv, rowClassName, onRowClick,
}: DataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [size, setSize] = useState(pageSize);
  const [page, setPage] = useState(0);
  const [cross, setCross] = useState<{ r: number; c: number } | null>(null);
  const [colFilters, setColFilters] = useState<Record<string, ColFilter>>({});
  const [openFilter, setOpenFilter] = useState<{ key: string; top: number; left: number } | null>(null);
  const [colWidths, setColWidths] = useState<Record<string, number>>({});
  const [selQuery, setSelQuery] = useState(""); // 多選篩選 popover 內的清單搜尋
  useEffect(() => { setSelQuery(""); }, [openFilter?.key]);

  const tableRef = useRef<HTMLTableElement>(null);
  const headRefs = useRef<(HTMLTableCellElement | null)[]>([]);
  const resizing = useRef<{ key: string; startX: number; startW: number } | null>(null);

  // 欄位篩選型態（顯式 > 自動判定）
  const filterKind = (c: Column<T>): "text" | "range" | "select" | "none" =>
    c.filter ?? (c.numeric && c.sortValue ? "range" : c.filterText || c.sortValue ? "text" : "none");
  const colText = (c: Column<T>, r: T) => (c.filterText ? c.filterText(r) : c.sortValue ? String(c.sortValue(r)) : "");
  const distinctValues = (c: Column<T>) => [...new Set(rows.map((r) => colText(c, r)).filter((v) => v !== ""))].sort();
  const getFilter = (key: string) => colFilters[key] ?? EMPTY_FILTER;
  const isFilterActive = (c: Column<T>) => {
    const f = getFilter(c.key);
    const k = filterKind(c);
    return k === "range" ? f.min !== "" || f.max !== "" : k === "select" ? f.values.length > 0 : f.text.trim() !== "";
  };
  const activeFilterCount = columns.filter(isFilterActive).length;
  const setFilter = (key: string, patch: Partial<ColFilter>) =>
    setColFilters((m) => ({ ...m, [key]: { ...getFilter(key), ...patch } }));
  const clearFilter = (key: string) => setColFilters((m) => { const { [key]: _drop, ...rest } = m; return rest; });
  const clearAllFilters = () => setColFilters({});
  /** 單一條件的可讀標籤（供條件標籤列顯示）。 */
  const filterLabel = (c: Column<T>) => {
    const f = getFilter(c.key);
    const head = typeof c.header === "string" ? c.header : c.key;
    const k = filterKind(c);
    if (k === "range") {
      const parts: string[] = [];
      if (f.min !== "") parts.push(`≥ ${f.min}`);
      if (f.max !== "") parts.push(`≤ ${f.max}`);
      return `${head}：${parts.join("、")}`;
    }
    if (k === "select") {
      const shown = f.values.slice(0, 2).join("、");
      return `${head}：${shown}${f.values.length > 2 ? ` 等 ${f.values.length} 項` : ""}`;
    }
    return `${head}：含「${f.text.trim()}」`;
  };

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
        const k = filterKind(c);
        if (k === "range") {
          const v = Number(c.sortValue?.(r));
          if (Number.isNaN(v)) return false;
          if (f.min !== "" && v < Number(f.min)) return false;
          if (f.max !== "" && v > Number(f.max)) return false;
        } else if (k === "select") {
          if (!f.values.includes(colText(c, r))) return false;
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

  useEffect(() => { setPage(0); }, [query, size, sort, colFilters]);
  useEffect(() => { if (page > pageCount - 1) setPage(0); }, [page, pageCount]);

  // ── 欄寬調整 ─────────────────────────────────────────────
  const onResizeMove = useCallback((e: PointerEvent) => {
    const r = resizing.current;
    if (!r) return;
    setColWidths((m) => ({ ...m, [r.key]: Math.max(48, r.startW + (e.clientX - r.startX)) }));
  }, []);
  const onResizeUp = useCallback(() => {
    resizing.current = null;
    document.body.style.cursor = "";
    window.removeEventListener("pointermove", onResizeMove);
    window.removeEventListener("pointerup", onResizeUp);
  }, [onResizeMove]);
  const startResize = (e: React.PointerEvent, key: string, ci: number) => {
    e.preventDefault();
    e.stopPropagation();
    resizing.current = { key, startX: e.clientX, startW: colWidths[key] ?? headRefs.current[ci]?.offsetWidth ?? 120 };
    document.body.style.cursor = "col-resize";
    window.addEventListener("pointermove", onResizeMove);
    window.addEventListener("pointerup", onResizeUp);
  };
  /** 雙擊欄位邊界：清除手動寬度 → 該欄自適應內容（auto-layout）。 */
  const autoFit = (key: string) => setColWidths((m) => { const { [key]: _d, ...rest } = m; return rest; });
  useEffect(() => () => { window.removeEventListener("pointermove", onResizeMove); window.removeEventListener("pointerup", onResizeUp); }, [onResizeMove, onResizeUp]);

  const hasTotals = columns.some((c) => c.total);
  const showToolbar = searchable || toolbar || csv || activeFilterCount > 0;

  const exportCsv = () => {
    if (!csv) return;
    saveBlob(new Blob([csvSerialize(csv.headers, sorted.map(csv.row))], { type: "text/csv;charset=utf-8" }), csv.fileName);
  };

  const xline = "bg-primary/[0.06]";
  const xcell = "bg-primary/20";

  const openFilterAt = (key: string, btn: HTMLElement) => {
    if (openFilter?.key === key) { setOpenFilter(null); return; }
    const r = btn.getBoundingClientRect();
    setOpenFilter({ key, top: r.bottom + 4, left: Math.max(8, Math.min(r.right - POP_W, window.innerWidth - POP_W - 8)) });
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

      {/* 篩選條件列：每個條件一個獨立標籤，可個別移除；避免只能一次全清 */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 print:hidden">
          <span className="text-xs text-muted-foreground">篩選條件：</span>
          {columns.filter(isFilterActive).map((c) => (
            <span key={c.key} className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 py-0.5 pl-2.5 pr-1 text-xs text-primary">
              {filterLabel(c)}
              <button
                type="button"
                aria-label={`移除「${typeof c.header === "string" ? c.header : c.key}」篩選`}
                onClick={() => clearFilter(c.key)}
                className="tap-target inline-flex items-center justify-center rounded-full p-0.5 hover:bg-primary/15"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
          {activeFilterCount > 1 && (
            <button type="button" onClick={clearAllFilters} className="ml-1 text-xs text-muted-foreground underline-offset-2 hover:underline">全部清除</button>
          )}
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
        <Table ref={tableRef} zebra={zebra} maxHeight={maxHeight}>
          <TableHeader sticky={stickyHeader}>
            <TableRow onMouseLeave={() => crosshair && setCross(null)}>
              {columns.map((c, ci) => {
                const kind = filterKind(c);
                const active = isFilterActive(c);
                const cw = colWidths[c.key];
                const isSorted = sort?.key === c.key;
                const SortIcon = !c.sortValue ? null : !isSorted ? ChevronsUpDown : sort!.dir === "desc" ? ChevronDown : ChevronUp;
                return (
                  <TableHead
                    key={c.key}
                    ref={(el) => { headRefs.current[ci] = el; }}
                    style={cw ? { width: cw, maxWidth: cw } : undefined}
                    className={cn("relative select-none p-0", c.freeze && freezeFirst, c.headerClassName, crosshair && cross?.c === ci && xline)}
                  >
                    <div className="flex h-10 items-center gap-1 px-2">
                      {c.sortValue ? (
                        <button type="button" onClick={() => toggle(c.key)} className={cn("inline-flex min-w-0 items-center gap-1 hover:text-foreground", isSorted && "text-foreground")}>
                          <span className="truncate">{c.header}</span>
                          {SortIcon && <SortIcon className={cn("size-3.5 shrink-0", !isSorted && "opacity-40")} />}
                        </button>
                      ) : (
                        <span className="min-w-0 truncate">{c.header}</span>
                      )}
                      {kind !== "none" && (
                        <button
                          type="button"
                          aria-label={`篩選 ${typeof c.header === "string" ? c.header : c.key}`}
                          onClick={(e) => { e.stopPropagation(); openFilterAt(c.key, e.currentTarget); }}
                          className={cn("tap-target ml-auto inline-flex shrink-0 items-center justify-center rounded p-0.5 transition-colors", active ? "text-primary" : "text-muted-foreground/40 hover:text-muted-foreground")}
                        >
                          <Filter className="size-3" />
                        </button>
                      )}
                    </div>
                    {resizable && (
                      <div
                        onPointerDown={(e) => startResize(e, c.key, ci)}
                        onDoubleClick={() => autoFit(c.key)}
                        title="拖曳調整欄寬，雙擊自適應內容"
                        className="absolute right-0 top-0 z-20 h-full w-1.5 cursor-col-resize touch-none hover:bg-primary/40"
                      />
                    )}
                  </TableHead>
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
                  const cw = colWidths[c.key];
                  const maxW = c.truncate ?? cw;
                  return (
                    <TableCell
                      key={c.key}
                      style={maxW ? { width: cw, maxWidth: maxW } : undefined}
                      onMouseEnter={crosshair ? () => setCross({ r: i, c: ci }) : undefined}
                      onTouchStart={crosshair ? () => setCross({ r: i, c: ci }) : undefined}
                      className={cn(
                        c.numeric && "text-right tabular-nums", c.freeze && cn(freezeFirst, "font-medium"), dense && "py-1",
                        cw && "overflow-hidden", cls,
                        (inRow || inCol) && xline, inRow && inCol && xcell,
                      )}
                    >
                      {c.truncate ? (
                        <Tooltip content={c.filterText?.(row)} className="w-full" focusable>
                          <span className="block truncate">{c.cell(row)}</span>
                        </Tooltip>
                      ) : cw ? (
                        <div className="truncate">{c.cell(row)}</div>
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

      {/* 篩選 popover：用 portal＋fixed 定位，避免被表格水平捲動/凍結首欄裁切或蓋住 */}
      {openFilter && createPortal(
        <>
          <div className="fixed inset-0 z-[55]" onClick={() => setOpenFilter(null)} aria-hidden />
          {(() => {
            const c = columns.find((x) => x.key === openFilter.key);
            if (!c) return null;
            const f = getFilter(c.key);
            const active = isFilterActive(c);
            return (
              <div style={{ position: "fixed", top: openFilter.top, left: openFilter.left, width: POP_W }} className="z-[60] rounded-md border bg-popover p-2.5 text-left text-sm text-foreground shadow-lg" onClick={(e) => e.stopPropagation()}>
                {filterKind(c) === "range" ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium">數值範圍</p>
                    <div className="flex items-center gap-1.5">
                      <Input type="number" placeholder="最小" className="h-8 tabular-nums" value={f.min} onChange={(e) => setFilter(c.key, { min: e.target.value })} />
                      <span className="text-xs text-muted-foreground">～</span>
                      <Input type="number" placeholder="最大" className="h-8 tabular-nums" value={f.max} onChange={(e) => setFilter(c.key, { max: e.target.value })} />
                    </div>
                  </div>
                ) : filterKind(c) === "select" ? (
                  (() => {
                    const all = distinctValues(c);
                    const shown = all.filter((v) => v.toLowerCase().includes(selQuery.toLowerCase()));
                    const toggle = (v: string) => setFilter(c.key, { values: f.values.includes(v) ? f.values.filter((x) => x !== v) : [...f.values, v] });
                    return (
                      <div className="space-y-2">
                        <p className="text-xs font-medium">選取值（多選）</p>
                        {all.length > 8 && <Input autoFocus placeholder="搜尋值…" className="h-8" value={selQuery} onChange={(e) => setSelQuery(e.target.value)} />}
                        <div className="max-h-48 space-y-0.5 overflow-y-auto">
                          {shown.length === 0 && <p className="px-1 py-2 text-xs text-muted-foreground">無符合的值</p>}
                          {shown.map((v) => {
                            const on = f.values.includes(v);
                            return (
                              <button key={v} type="button" onClick={() => toggle(v)} className="flex w-full items-center gap-2 rounded px-1.5 py-1 text-left text-xs hover:bg-accent">
                                <span className={cn("flex size-4 shrink-0 items-center justify-center rounded border", on ? "border-primary bg-primary text-primary-foreground" : "border-input")}>{on && <Check className="size-3" />}</span>
                                <span className="truncate">{v}</span>
                              </button>
                            );
                          })}
                        </div>
                        <div className="flex gap-3 text-xs text-muted-foreground">
                          <button type="button" className="hover:underline" onClick={() => setFilter(c.key, { values: all })}>全選</button>
                          <button type="button" className="hover:underline" onClick={() => setFilter(c.key, { values: [] })}>取消全選</button>
                        </div>
                      </div>
                    );
                  })()
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
          })()}
        </>,
        document.body,
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
