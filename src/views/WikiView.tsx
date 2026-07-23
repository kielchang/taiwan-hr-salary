// 操作手冊（/wiki）：完整系統操作 wiki——app glue（可 import store/router/content）。
// 設計原理：
// ── 內容＝宣告式註冊表（src/content/wiki/*），本 view 只負責導航/搜尋/列印/動作解析。
// ── ?ch=&sec= 深連結**保留於網址**（可分享書籤）——刻意不同於 ReportsHub 的「消化即清」：
//    手冊連結的價值就在可轉貼（例如把 /wiki?ch=monthly&sec=confirm 貼給同事）。
// ── 動作（WikiAction）：to→navigate、tour→navigate("/")+startTour（同 HelpView 模式）；
//    內容層不 import store，動作只在此解析（tests/wiki.test.tsx 守衛）。
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { usePayrollStore } from "@/store/usePayrollStore";
import { WIKI_CHAPTERS, DEFAULT_CHAPTER, type WikiAction, type WikiChapter } from "@/content/wiki";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { PrintHeader } from "@/components/PrintHeader";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, BookMarked, Compass, Printer, Search } from "lucide-react";

/** 動作鈕列：to=跳頁、tour=啟動導覽（回首頁再啟動，讓導覽自帶路由）。 */
function WikiActionButtons({ actions }: { actions?: WikiAction[] }) {
  const navigate = useNavigate();
  const startTour = usePayrollStore((s) => s.startTour);
  if (!actions?.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-2 print:hidden">
      {actions.map((a) => (
        <Button
          key={a.label}
          size="sm"
          variant="outline"
          onClick={() => {
            if (a.tour) { navigate("/"); startTour(a.tour); }
            else if (a.to) navigate(a.to);
          }}
        >
          {a.tour ? <Compass /> : <ArrowRight />} {a.label}
        </Button>
      ))}
    </div>
  );
}

/** 搜尋命中：跨全章節比對 title/keywords/章名（includes，不分大小寫）。 */
function searchHits(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const hits: { ch: WikiChapter; secId: string; secTitle: string; keywords: string[] }[] = [];
  for (const ch of WIKI_CHAPTERS) {
    for (const s of ch.sections) {
      const hay = [s.title, ch.title, ...(s.keywords ?? [])].join(" ").toLowerCase();
      if (hay.includes(q)) hits.push({ ch, secId: s.id, secTitle: s.title, keywords: s.keywords ?? [] });
    }
  }
  return hits;
}

export function WikiView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const chParam = searchParams.get("ch");
  const chapter = WIKI_CHAPTERS.find((c) => c.id === chParam) ?? WIKI_CHAPTERS.find((c) => c.id === DEFAULT_CHAPTER)!;
  const sec = searchParams.get("sec");
  const [query, setQuery] = useState("");
  const hits = useMemo(() => searchHits(query), [query]);
  const searching = query.trim().length > 0;

  // 深連結捲動：?sec= 指定節時捲到該節（scroll-mt 抵銷 sticky header）
  useEffect(() => {
    if (!sec || searching) return;
    const el = document.getElementById(`wiki-${chapter.id}-${sec}`);
    if (el) el.scrollIntoView({ block: "start", behavior: "auto" });
  }, [chapter.id, sec, searching]);

  const idx = WIKI_CHAPTERS.indexOf(chapter);
  const prev = WIKI_CHAPTERS[idx - 1];
  const next = WIKI_CHAPTERS[idx + 1];
  const goto = (ch: string, s?: string) => { setQuery(""); setSearchParams(s ? { ch, sec: s } : { ch }); };

  return (
    <div className="space-y-4">
      <PrintHeader title={`操作手冊 — 第${chapter.num}章 ${chapter.title}`} />
      <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-bold"><BookMarked className="size-5 text-primary" /> 操作手冊</h1>
          <p className="text-sm text-muted-foreground">逐章的完整操作說明：可搜尋、可列印、可直接跳到畫面或啟動互動導覽。</p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜尋主題（如：加班、備份、匯率）…" className="h-9 w-72 pl-8" />
        </div>
      </div>

      {searching ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">「{query}」的相關主題：</p>
          {hits.length === 0 && <EmptyState icon={<Search className="size-7" />} title="沒有符合的主題" hint="換個關鍵字（畫面上的按鈕/欄位名稱通常找得到），或清空搜尋逐章瀏覽。" />}
          {hits.map((h) => (
            <button
              key={`${h.ch.id}-${h.secId}`}
              onClick={() => goto(h.ch.id, h.secId)}
              className="block w-full rounded-md border p-3 text-left hover:bg-accent"
            >
              <p className="text-sm font-medium">第{h.ch.num}章 {h.ch.title} › {h.secTitle}</p>
              {h.keywords.length > 0 && (
                <p className="mt-0.5 text-xs text-muted-foreground">{h.keywords.slice(0, 6).join("・")}</p>
              )}
            </button>
          ))}
        </div>
      ) : (
        <div className="md:grid md:grid-cols-[200px_1fr] md:gap-5">
          {/* 桌機章節 TOC（sticky；active 章展開節錨點） */}
          <nav className="hidden md:block print:hidden">
            <div className="sticky top-[64px] space-y-0.5">
              {WIKI_CHAPTERS.map((c) => (
                <div key={c.id}>
                  <button
                    onClick={() => goto(c.id)}
                    className={cn(
                      "block w-full rounded-md px-2 py-1.5 text-left text-sm",
                      c.id === chapter.id ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-accent",
                    )}
                  >
                    {c.num}. {c.title}
                  </button>
                  {c.id === chapter.id && (
                    <div className="ml-3 border-l pl-2">
                      {c.sections.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => goto(c.id, s.id)}
                          className={cn(
                            "block w-full truncate rounded px-1.5 py-1 text-left text-xs",
                            sec === s.id ? "text-primary" : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {s.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </nav>

          {/* 內容區 */}
          <div className="min-w-0 space-y-5">
            {/* 行動版章節選擇 */}
            <div className="md:hidden print:hidden">
              <Select value={chapter.id} onValueChange={(v) => goto(v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {WIKI_CHAPTERS.map((c) => <SelectItem key={c.id} value={c.id}>{c.num}. {c.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold">第{chapter.num}章　{chapter.title}</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">{chapter.intro}</p>
              </div>
              <Button size="sm" variant="outline" className="print:hidden" onClick={() => window.print()}>
                <Printer /> 列印本章
              </Button>
            </div>

            {chapter.sections.map((s) => (
              <section key={s.id} id={`wiki-${chapter.id}-${s.id}`} className="print-block scroll-mt-16 rounded-lg border p-4">
                <h3 className="text-sm font-semibold">{s.title}</h3>
                <div className="mt-1.5 text-sm text-muted-foreground [&_strong]:text-foreground [&_ol]:ml-4 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ul]:ml-4 [&_ul]:list-disc [&_ul]:space-y-1 [&_p+p]:mt-2">
                  {s.body}
                </div>
                <WikiActionButtons actions={s.actions} />
              </section>
            ))}

            <div className="flex items-center justify-between print:hidden">
              {prev ? (
                <Button variant="ghost" size="sm" onClick={() => goto(prev.id)}><ArrowLeft /> 第{prev.num}章 {prev.title}</Button>
              ) : <span />}
              {next && (
                <Button variant="ghost" size="sm" onClick={() => goto(next.id)}>第{next.num}章 {next.title} <ArrowRight /></Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
