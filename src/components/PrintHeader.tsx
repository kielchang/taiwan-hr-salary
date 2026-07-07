import { formatPeriod } from "@/lib/utils";
import { VERSION_LABEL } from "@/version";

/**
 * 列印頁首：僅於列印時顯示（screen 隱藏）。提供報表名稱、期間、產生時間，
 * 讓印出的薪資文件可供存檔/簽核辨識。並附固定於頁底的 .print-footer（系統版本＋SHA），
 * 供日後辨識「這份報表是哪一版系統產出」。
 */
export function PrintHeader({ title, period, company = "薪資管理系統" }: { title: string; period?: string; company?: string }) {
  const now = new Date();
  const ts = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  return (
    <>
      <div className="print-header mb-3 border-b pb-2">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-bold">{company}</span>
          <span className="text-xs text-slate-500">產生時間：{ts}</span>
        </div>
        <div className="mt-0.5 flex items-baseline justify-between">
          <span className="text-base font-bold">{title}</span>
          {period && <span className="text-xs text-slate-600">期間：{formatPeriod(period)}</span>}
        </div>
      </div>
      <div className="print-footer">{company}　{VERSION_LABEL}　{ts} 產生</div>
    </>
  );
}
