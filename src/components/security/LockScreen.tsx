// 解鎖畫面（app glue，不入元件庫 barrel——依賴 @/lib/security 屬 app 模組）。
// 顯示於 AppGate 判定「已設密碼鎖且金鑰未載入」時；解鎖成功前不渲染任何業務畫面。
// 忘記密碼＝資料不可救（ADR-040）：唯一逃生門是「清除全部資料重新開始」（雙重確認）。
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldCheck, LoaderCircle } from "lucide-react";

export function LockScreen({ onUnlock, onWipe }: {
  /** 回傳是否解鎖成功（失敗顯示錯誤，不洩漏更多資訊） */
  onUnlock: (password: string) => Promise<boolean>;
  /** 清除全部資料重新開始（呼叫端負責雙重確認後的實際清除與 reload） */
  onWipe: () => void;
}) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!password || busy) return;
    setBusy(true);
    setError(null);
    const ok = await onUnlock(password);
    if (!ok) {
      setError("密碼不正確，請再試一次。");
      setBusy(false);
      setPassword("");
    }
    // 成功時由 AppGate 切換畫面，這裡不需收尾
  };

  const wipe = () => {
    if (!confirm("確定要清除這台電腦上本系統的全部資料嗎？\n\n已加密的資料沒有密碼即無法救回，清除後將回到初始狀態。")) return;
    if (!confirm("最後確認：此動作無法復原。若手上有備份檔，之後可用備份還原。\n\n仍要清除全部資料？")) return;
    onWipe();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="size-5 text-primary" /> 資料已加密鎖定
          </CardTitle>
          <CardDescription>
            本機資料以您設定的密碼加密保護。輸入密碼解鎖後才會載入資料。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <form onSubmit={submit} className="space-y-3">
            <Input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="輸入密碼"
              aria-label="解鎖密碼"
              disabled={busy}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={!password || busy}>
              {busy ? (<><LoaderCircle className="animate-spin" /> 解鎖中…</>) : "解鎖"}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground">
            忘記密碼？加密資料<strong>無法</strong>在沒有密碼的情況下救回。
            若您有先前匯出的備份檔，可先清除資料、完成初始設定後再用備份還原。
          </p>
          <Button variant="outline" size="sm" className="w-full" onClick={wipe} disabled={busy}>
            清除全部資料重新開始
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
