import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Info } from "lucide-react";
import { HELP } from "@/content/help";

/** 情境式說明：醒目 ℹ 圖示，點擊內嵌叫出該區文件，不離開頁面 */
export function HelpHint({ id }: { id: keyof typeof HELP }) {
  const [open, setOpen] = useState(false);
  const doc = HELP[id];
  if (!doc) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="本區說明"
        title="本區說明"
        className="inline-flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20 hover:bg-primary/20 align-middle print:hidden"
      >
        <Info className="size-3.5" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{doc.title}</DialogTitle></DialogHeader>
          <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">{doc.body}</div>
        </DialogContent>
      </Dialog>
    </>
  );
}
