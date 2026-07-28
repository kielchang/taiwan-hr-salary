// 模擬操作畫面（零截圖）：以「元件庫真元件＋placeholder 佔位塊」直接排版重現系統畫面。
// 設計原則（使用者指定）：重點按鈕/圖表＝真元件＋聚光高亮；其餘畫面＝灰色佔位留白。
// MockFlow＝步驟播放器（自動輪播＋字幕＋前後步），內容為 React 排版、非圖片；
// 每條流程可配 to（直達系統作業的入口連結）。元件更新＝畫面自動同步（同一份元件庫）。
import React, { useEffect, useRef, useState } from "react";
import AppLink from "@site/src/components/AppLink";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Callout } from "@/components/ui/callout";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/NumberInput";
import { TabPills } from "@/components/ui/tab-pills";
import { Delta } from "@/components/ui/delta";
import { EditableField } from "@/components/form/EditableField";

/* ── 基礎積木 ───────────────────────────── */

/** 佔位塊：非重點區域一律留白（灰色圓角塊，可帶淡字標籤） */
function Ph({ w, h = 14, label }: { w?: number | string; h?: number; label?: string }) {
  return (
    <div style={{ width: w ?? "100%", height: h, borderRadius: 6, background: "var(--ifm-color-emphasis-200)",
      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11,
      color: "var(--ifm-color-emphasis-500)", overflow: "hidden", whiteSpace: "nowrap", flexShrink: 0 }}>
      {label ?? ""}
    </div>
  );
}

/** 聚光：包住「重點元件」——琥珀高亮框＋微光暈，視覺語言與系統內導覽一致 */
function Spot({ children, label }: { children: React.ReactNode; label?: string }) {
  return (
    <span style={{ position: "relative", display: "inline-block", borderRadius: 10, padding: 4,
      boxShadow: "0 0 0 3px #f59e0b, 0 0 14px rgba(245,158,11,.45)" }}>
      {children}
      {label && (
        <span style={{ position: "absolute", top: -10, left: 8, transform: "translateY(-100%)",
          background: "#f59e0b", color: "#fff", fontSize: 11, padding: "2px 8px", borderRadius: 6, whiteSpace: "nowrap" }}>
          {label}
        </span>
      )}
    </span>
  );
}

/** 畫面框：模擬系統版面（側欄/頂欄＝佔位），content 放該步驟的排版 */
function ScreenFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background text-foreground" style={{ display: "flex", gap: 10, padding: 12, minHeight: 230 }}>
      <div style={{ width: 90, display: "flex", flexDirection: "column", gap: 6 }}>
        <Ph h={22} label="選單" /><Ph h={14} /><Ph h={14} /><Ph h={14} /><Ph h={14} /><Ph h={14} />
      </div>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 10 }}>
        <Ph h={20} label="頂部狀態列" />
        <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "stretch" }}>{children}</div>
      </div>
    </div>
  );
}

/** 表格假列（帶重點格 focus） */
function Row({ focus }: { focus?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <Ph w={64} /><Ph w={90} /><Ph /><Ph w={70} />
      {focus ?? <Ph w={64} h={22} />}
    </div>
  );
}

/* ── 各步驟排版（重點＝真元件） ───────────────────────────── */

const S = {
  /* 每月結算：輸入異動 */
  monthlyList: (
    <ScreenFrame>
      <div style={{ display: "flex", gap: 8 }}><Ph w={180} h={26} label="搜尋員工…" /><Ph /></div>
      <Row /><Row focus={<Spot label="按這裡"><Button size="sm" variant="outline">編輯</Button></Spot>} /><Row />
    </ScreenFrame>
  ),
  monthlyDialog: (
    <ScreenFrame>
      <div style={{ border: "1px solid var(--ifm-color-emphasis-300)", borderRadius: 10, padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
        <Ph h={18} label="蔡佩珊｜本月異動" />
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 13 }}>平日加班・前 2 小時</span>
          <Spot label="填時數"><NumberInput value={8} onChange={() => {}} /></Spot>
          <span style={{ fontSize: 13, color: "var(--ifm-color-emphasis-600)" }}>本月加班費試算：<strong>8,889 元</strong>（即時更新）</span>
        </div>
        <Ph h={40} label="請假／獎金／代扣稅…（略）" />
      </div>
    </ScreenFrame>
  ),
  monthlySave: (
    <ScreenFrame>
      <div style={{ border: "1px solid var(--ifm-color-emphasis-300)", borderRadius: 10, padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
        <Ph h={54} label="（異動欄位…）" />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button size="sm" variant="ghost">取消</Button>
          <Spot label="儲存"><Button size="sm">儲存本月異動</Button></Spot>
        </div>
      </div>
    </ScreenFrame>
  ),
  monthlyDone: (
    <ScreenFrame>
      <Row />
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <Ph w={64} /><Spot label="完成後你會看到"><Badge variant="secondary">加班 8 小時</Badge></Spot><Ph /><Ph w={70} /><Ph w={64} h={22} />
      </div>
      <Row />
    </ScreenFrame>
  ),
  /* 查核與確認 */
  reviewTabs: (
    <ScreenFrame>
      <TabPills tabs={[{ key: "a", label: "試算總覽" }, { key: "b", label: "統計查核" }, { key: "c", label: "獎金試算" }]} value="a" onChange={() => {}} />
      <Ph h={70} label="全公司結算列＋合計（略）" />
    </ScreenFrame>
  ),
  reviewChecks: (
    <ScreenFrame>
      <TabPills tabs={[{ key: "a", label: "試算總覽" }, { key: "b", label: "統計查核" }, { key: "c", label: "獎金試算" }]} value="b" onChange={() => {}} />
      <Callout variant="danger" title="必須處理">徐低薪：月薪資總額 28,000 低於最低工資 29,500</Callout>
      <Callout variant="warning" title="建議確認">曾爆肝：本月加班 50 小時超過 46 小時上限</Callout>
    </ScreenFrame>
  ),
  reviewConfirm: (
    <ScreenFrame>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Ph w={220} h={22} label="摘要卡（人數/應發/實發）" />
        <Spot label="無誤後按"><Button size="sm">確認本月結算</Button></Spot>
      </div>
      <Ph h={56} label="（總覽表…）" />
    </ScreenFrame>
  ),
  /* 備份 */
  backupRemind: (
    <ScreenFrame>
      <Callout variant="warning" title="尚未備份過資料">
        資料只存在本機瀏覽器，清除瀏覽器或換電腦即全部遺失——
        <Spot label="一鍵備份"><Button size="sm">立即匯出備份</Button></Spot>
      </Callout>
      <Ph h={56} label="工作台待辦卡（略）" />
    </ScreenFrame>
  ),
  backupExport: (
    <ScreenFrame>
      <Ph h={18} label="系統設定 → 資料與安全" />
      <div style={{ display: "flex", gap: 8 }}>
        <Spot label="匯出"><Button size="sm" variant="outline">匯出備份檔（JSON）</Button></Spot>
        <Button size="sm" variant="outline">從備份檔還原</Button>
      </div>
      <Ph h={40} label="操作者與變更紀錄（略）" />
    </ScreenFrame>
  ),
  backupDone: (
    <ScreenFrame>
      <Callout variant="success" title="完成">備份檔已下載——請另存雲端或隨身碟（側欄轉「今日已備份」）</Callout>
      <div><Badge variant="secondary">今日已備份</Badge></div>
    </ScreenFrame>
  ),
  /* 新人報到 */
  onboardBtn: (
    <ScreenFrame>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Ph w={200} h={26} label="員工清單" />
        <Spot label="從這裡建檔"><Button size="sm">新進到職</Button></Spot>
      </div>
      <Row /><Row />
    </ScreenFrame>
  ),
  onboardForm: (
    <ScreenFrame>
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))" }}>
        <EditableField label="姓名" kind="text" value="王小新" onChange={() => {}} />
        <EditableField label="到職日" kind="date" value="2026-07-01" onChange={() => {}} />
      </div>
      <Callout variant="info" title="預設薪資自動帶入">固定津貼依「系統設定」的新進預設帶入，可再調整。</Callout>
    </ScreenFrame>
  ),
  onboardDone: (
    <ScreenFrame>
      <Callout variant="info" title="完成後你會看到">員工清單多出這位新人；工作台「本月應加保」+1——記得到名冊辦加保。</Callout>
      <div style={{ display: "flex", justifyContent: "flex-end" }}><Spot><Button size="sm">建立員工</Button></Spot></div>
    </ScreenFrame>
  ),
  /* 批次調薪 */
  batchPick: (
    <ScreenFrame>
      <TabPills tabs={[{ key: "a", label: "批次調整" }, { key: "b", label: "外幣薪資" }, { key: "c", label: "區間補貼" }, { key: "d", label: "排程" }]} value="a" onChange={() => {}} />
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 13 }}>族群</span><Ph w={140} h={26} label="全公司 ▾" />
        <span style={{ fontSize: 13 }}>本薪</span><Spot label="調幅"><NumberInput value={3} onChange={() => {}} /></Spot><span style={{ fontSize: 13 }}>%</span>
      </div>
    </ScreenFrame>
  ),
  batchPreview: (
    <ScreenFrame>
      <Ph h={16} label="影響預覽（前 → 後）" />
      <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
        <Ph w={64} /><span>36,000 →</span><strong>37,080</strong><Delta value={1080} />
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
        <Ph w={64} /><span>29,000 →</span><strong>29,870</strong><Badge variant="warning">低於最低工資</Badge>
      </div>
    </ScreenFrame>
  ),
  batchApply: (
    <ScreenFrame>
      <Ph h={44} label="（預覽…）" />
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Spot label="生效月為當月時"><Button size="sm">立即套用</Button></Spot>
      </div>
      <Callout variant="info" title="未來月">同一顆按鈕會顯示「排程套用」，到期於「排程」分頁按「套用」。</Callout>
    </ScreenFrame>
  ),
  /* 薪資條 */
  payslipPick: (
    <ScreenFrame>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ fontSize: 13 }}>員工</span><Spot label="下拉選人"><Ph w={160} h={28} label="蔡佩珊 ▾" /></Spot>
      </div>
      <Ph h={64} label="薪資條即時預覽（略）" />
    </ScreenFrame>
  ),
  payslipContent: (
    <ScreenFrame>
      <div style={{ border: "1px solid var(--ifm-color-emphasis-300)", borderRadius: 10, padding: 12, fontSize: 13, display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}><span>應發合計</span><strong>238,889</strong></div>
        <div style={{ display: "flex", justifyContent: "space-between" }}><span>代扣合計</span><strong>−21,378</strong></div>
        <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--ifm-color-emphasis-300)", paddingTop: 6 }}><span><strong>實發金額</strong></span><strong>217,511</strong></div>
      </div>
    </ScreenFrame>
  ),
  payslipExport: (
    <ScreenFrame>
      <Ph h={44} label="（預覽…）" />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Spot label="單發"><Button size="sm" variant="outline">下載加密 PDF</Button></Spot>
        <Button size="sm" variant="outline">批次下載全部（ZIP）</Button>
      </div>
      <Callout variant="info" title="密碼">＝該員身分證字號（英文大寫），不需重設。</Callout>
    </ScreenFrame>
  ),
  /* 申報名冊 */
  filingTabs: (
    <ScreenFrame>
      <TabPills tabs={[{ key: "a", label: "年度扣繳憑單" }, { key: "b", label: "勞健退繳費清單" }, { key: "c", label: "投保級距申報調整" }, { key: "d", label: "加退保作業清單" }]} value="a" onChange={() => {}} />
      <Ph h={64} label="逐人彙總表（可匯出 CSV）" />
    </ScreenFrame>
  ),
  filingBracket: (
    <ScreenFrame>
      <TabPills tabs={[{ key: "a", label: "年度扣繳憑單" }, { key: "b", label: "勞健退繳費清單" }, { key: "c", label: "投保級距申報調整" }, { key: "d", label: "加退保作業清單" }]} value="c" onChange={() => {}} />
      <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
        <Ph w={64} /><span>現 45,800 ／ 報 43,900</span><Badge variant="warning">需調整</Badge>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Spot label="申報完成後按"><Button size="sm" variant="outline">以目前為申報基準</Button></Spot>
      </div>
    </ScreenFrame>
  ),
  filingEnroll: (
    <ScreenFrame>
      <TabPills tabs={[{ key: "a", label: "年度扣繳憑單" }, { key: "b", label: "勞健退繳費清單" }, { key: "c", label: "投保級距申報調整" }, { key: "d", label: "加退保作業清單" }]} value="d" onChange={() => {}} />
      <Callout variant="info" title="提醒性質">名冊列出加保／退保／停保／復保供人工辦理；系統不會自動變更保費。</Callout>
    </ScreenFrame>
  ),
  /* 年度費率更新 */
  versionBanner: (
    <ScreenFrame>
      <Spot label="從這張卡開始">
        <Callout variant="warning" title="已有已確認月份 → 法定參數改用「新增生效版本」">
          直接修改會回溯改寫已申報月份；請新增自指定月份起生效的新版本。
        </Callout>
      </Spot>
      <Ph h={40} label="法定費率欄位（鎖定中）" />
    </ScreenFrame>
  ),
  versionAdd: (
    <ScreenFrame>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ fontSize: 13 }}>自</span><Ph w={110} h={28} label="2027-01" /><span style={{ fontSize: 13 }}>起生效</span>
        <Spot><Button size="sm">新增生效版本</Button></Spot>
      </div>
    </ScreenFrame>
  ),
  versionEdit: (
    <ScreenFrame>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <span style={{ fontSize: 13 }}>健保費率</span><Spot label="照公告百分比填"><NumberInput value={5.17} onChange={() => {}} step={0.01} /></Spot><span style={{ fontSize: 13 }}>%</span>
      </div>
      <Callout variant="info" title="不回溯">新費率只影響生效月起；先前已申報月份維持原費率。</Callout>
    </ScreenFrame>
  ),
  /* 外幣設定 */
  fxEnable: (
    <ScreenFrame>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <span style={{ fontSize: 13 }}>啟用多幣別</span>
        <Spot label="先打開這個"><Button size="sm" variant="outline">關 → 開</Button></Spot>
      </div>
      <Ph h={44} label="啟用後才會出現維護中心" />
    </ScreenFrame>
  ),
  fxCurrency: (
    <ScreenFrame>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <Spot label="代碼"><Input className="col-input h-8 w-24" value="USD" onChange={() => {}} /></Spot>
        <Input className="col-input h-8 w-24" value="美金" onChange={() => {}} />
        <Button size="sm">新增幣別</Button>
      </div>
    </ScreenFrame>
  ),
  fxRate: (
    <ScreenFrame>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ fontSize: 13 }}>1 US$ =</span>
        <Spot label="逐月維護"><NumberInput value={32} onChange={() => {}} /></Spot>
        <span style={{ fontSize: 13 }}>元</span><Badge variant="warning">未設匯率＝約當 0</Badge>
      </div>
    </ScreenFrame>
  ),
  /* 工作台 */
  dashCards: (
    <ScreenFrame>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(4,1fr)", fontSize: 12 }}>
        <Ph h={44} label="結算人數 61" /><Ph h={44} label="應發 5,393,394" /><Ph h={44} label="實發 4,991,973" /><Ph h={44} label="總成本 6,154,779" />
      </div>
      <div><Badge variant="warning">本月未確認</Badge></div>
    </ScreenFrame>
  ),
  dashTodos: (
    <ScreenFrame>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(2,1fr)" }}>
        <div style={{ border: "1px solid var(--ifm-color-emphasis-300)", borderRadius: 10, padding: 10, fontSize: 13 }}>
          未填代扣所得稅 <strong>29 人</strong>
          <div style={{ marginTop: 6 }}><Spot label="點卡片直達"><Button size="sm" variant="outline">前往所得稅清單 →</Button></Spot></div>
        </div>
        <div style={{ border: "1px solid var(--ifm-color-emphasis-300)", borderRadius: 10, padding: 10, fontSize: 13 }}>
          本月應加保 <strong>1 人</strong>
          <div style={{ marginTop: 6 }}><Button size="sm" variant="outline">前往加退保名冊 →</Button></div>
        </div>
      </div>
    </ScreenFrame>
  ),
  dashZero: (
    <ScreenFrame>
      <div style={{ border: "1px solid var(--ifm-color-emphasis-300)", borderRadius: 10, padding: 10, fontSize: 13, display: "flex", gap: 8, alignItems: "center" }}>
        <Badge variant="success">✓</Badge> 目前沒有待辦。
      </div>
      <Ph h={40} label="排程調薪／快捷入口（略）" />
    </ScreenFrame>
  ),
  /* 主檔情境 */
  masterList: (
    <ScreenFrame>
      <Ph h={16} label="員工清單" />
      <Spot label="點任一列開檔案"><div style={{ display: "flex", gap: 8, alignItems: "center", padding: 4 }}><Ph w={64} label="蔡佩珊" /><Ph w={90} /><Ph /></div></Spot>
      <Row />
    </ScreenFrame>
  ),
  masterScenarios: (
    <ScreenFrame>
      <Ph h={16} label="員工檔案：基本資料（上）" />
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <Button size="sm" variant="outline">離職</Button>
        <Button size="sm" variant="outline">留停/停職</Button>
        <Spot label="挑要辦的事"><Button size="sm" variant="outline">薪資結構調整</Button></Spot>
        <Button size="sm" variant="outline">眷屬異動</Button>
        <Button size="sm" variant="outline">扣繳設定</Button>
      </div>
    </ScreenFrame>
  ),
  masterSubmit: (
    <ScreenFrame>
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))" }}>
        <EditableField label="本薪（月）" kind="money" value={48000} original={45800} onChange={() => {}} />
        <EditableField label="異動原因（必填）" kind="text" value="年度調薪" onChange={() => {}} />
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}><Spot><Button size="sm">送出異動</Button></Spot></div>
    </ScreenFrame>
  ),
};

/* ── 流程註冊表（key＝文件內 <MockFlow name="…">；tests/manualStories.test.ts 守衛存在性） ── */

export const MOCK_FLOWS: Record<string, { title: string; to?: string; steps: { caption: string; node: React.ReactNode }[] }> = {
  "monthly-edit": { title: "每月結算：輸入當月異動", to: "/payroll/monthly", steps: [
    { caption: "① 全員固定薪資已自動試算——只需編輯有異動的人（按該列「編輯」）", node: S.monthlyList },
    { caption: "② 對話框填加班時數，下方「本月加班費試算」即時更新", node: S.monthlyDialog },
    { caption: "③ 按「儲存本月異動」（在對話框內按 Enter 也會儲存）", node: S.monthlySave },
    { caption: "④ 完成後你會看到：該列出現異動標籤、實發同步更新", node: S.monthlyDone },
  ]},
  "review-confirm": { title: "每月結算：查核與確認", to: "/payroll/review", steps: [
    { caption: "① 「試算總覽」：全公司結算列＋合計", node: S.reviewTabs },
    { caption: "② 「統計查核」：紅字必處理、黃字建議確認，可點「前往修正」直達", node: S.reviewChecks },
    { caption: "③ 全部無誤後按「確認本月結算」＝留存快照並凍結當月", node: S.reviewConfirm },
  ]},
  "backup": { title: "資料備份：匯出備份檔", to: "/settings?tab=data", steps: [
    { caption: "① 尚未備份時，工作台出現琥珀提醒卡（可一鍵匯出）", node: S.backupRemind },
    { caption: "② 或到「系統設定 → 資料與安全」按「匯出備份檔（JSON）」", node: S.backupExport },
    { caption: "③ 匯出完成：側欄轉「今日已備份」——檔案請另存雲端/隨身碟", node: S.backupDone },
  ]},
  "onboard": { title: "人事事件：有新人報到", to: "/master", steps: [
    { caption: "① 「基本資料」右上按「新進到職」", node: S.onboardBtn },
    { caption: "② 填基本資料與到職日；固定薪資自動帶入公司預設", node: S.onboardForm },
    { caption: "③ 送出後：清單多出新人、名冊提醒辦加保", node: S.onboardDone },
  ]},
  "batch-salary": { title: "人事事件：批次調薪與補貼", to: "/master?tab=batch", steps: [
    { caption: "① 「批次薪資」：選族群、設定調整方式（例：本薪 +3%）", node: S.batchPick },
    { caption: "② 下方立即出現影響預覽（前→後、低於最低工資會標示）", node: S.batchPreview },
    { caption: "③ 核對無誤後套用；未來月＝排程，到期於「排程」分頁套用", node: S.batchApply },
  ]},
  "payslip": { title: "每月例行：發薪資條", to: "/reports?tab=payslip", steps: [
    { caption: "① 「報表與申報 → 薪資條」：用下拉選單選員工、下方即時預覽", node: S.payslipPick },
    { caption: "② 預覽內容：應發／代扣／實發（外幣另列、不含台幣實發）", node: S.payslipContent },
    { caption: "③ 「下載加密 PDF」單發（密碼＝身分證大寫）或 ZIP 一次發全員", node: S.payslipExport },
  ]},
  "filing": { title: "申報與繳費：四類名冊", to: "/reports?tab=withholding", steps: [
    { caption: "① 四個分頁＝四種申報產出，皆可匯出 CSV", node: S.filingTabs },
    { caption: "② 「投保級距申報調整」：比對現→報；申報完成後按「以目前為申報基準」", node: S.filingBracket },
    { caption: "③ 「加退保作業清單」＝提醒性質，供人工向勞健保單位辦理", node: S.filingEnroll },
  ]},
  "settings-version": { title: "年度維護：更新法定費率（不回溯）", to: "/settings", steps: [
    { caption: "① 已有已確認月份時，費率鎖定並出現黃色提示卡", node: S.versionBanner },
    { caption: "② 選生效月按「新增生效版本」——欄位解鎖", node: S.versionAdd },
    { caption: "③ 照公告百分比填新費率；先前已申報月份不會被改動", node: S.versionEdit },
  ]},
  "currency-setup": { title: "設定：啟用外幣薪資", to: "/settings?tab=currency", steps: [
    { caption: "① 「幣別與匯率」：先打開「啟用多幣別」", node: S.fxEnable },
    { caption: "② 新增幣別（代碼／名稱／符號）", node: S.fxCurrency },
    { caption: "③ 逐月維護匯率：未設匯率＝該月台幣約當以 0 計", node: S.fxRate },
  ]},
  "dashboard": { title: "工作台：今天要處理什麼", to: "/", steps: [
    { caption: "① 本月摘要四卡＋確認狀態", node: S.dashCards },
    { caption: "② 待辦卡：數字＝待處理件數，按卡上按鈕直達處理位置", node: S.dashTodos },
    { caption: "③ 卡片歸零＝該項無待辦（各卡顯示「目前沒有待辦。」）", node: S.dashZero },
  ]},
  "master-scenario": { title: "基本資料：情境申請單怎麼用", to: "/master", steps: [
    { caption: "① 「員工清單」點任一位員工開啟檔案面板", node: S.masterList },
    { caption: "② 檔案面板下方兩排「情境」按鈕——挑要辦的事", node: S.masterScenarios },
    { caption: "③ 只出現該情境欄位＋必填「異動原因」，送出即留稽核紀錄", node: S.masterSubmit },
  ]},
};

/** 流程播放器（React 排版、零截圖）：自動輪播＋字幕＋前後步＋直達入口 */
export default function MockFlow({ name, interval = 4200 }: { name: string; interval?: number }) {
  const flow = MOCK_FLOWS[name];
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<number | null>(null);
  useEffect(() => {
    if (!flow || paused) return;
    timer.current = window.setTimeout(() => setI((x) => (x + 1) % flow.steps.length), interval);
    return () => { if (timer.current) window.clearTimeout(timer.current); };
  }, [flow, i, paused, interval]);
  if (!flow) return <div>未知流程：{name}</div>;
  const step = flow.steps[i];
  return (
    <figure className="mockflow" style={{ margin: "1rem 0", border: "1px solid var(--ifm-color-emphasis-300)", borderRadius: 8, overflow: "hidden" }}
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 12px", background: "var(--ifm-color-emphasis-100)", fontSize: 13 }}>
        <strong>{flow.title}</strong>
        <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ color: "var(--ifm-color-emphasis-600)" }}>{i + 1} / {flow.steps.length}{paused ? "（暫停）" : ""}</span>
          {flow.to && <AppLink to={flow.to}>開啟此作業</AppLink>}
        </span>
      </div>
      {/* 全步驟都在 DOM：畫面只顯示當前步；列印時全部展開（含各步字幕）＝可直接匯出成文件 */}
      {flow.steps.map((s, d) => (
        <div key={d} className={`mockflow-step${d === i ? " mockflow-step-active" : ""}`} style={{ borderBottom: "1px solid var(--ifm-color-emphasis-200)" }}>
          <div className="mockflow-print-caption" style={{ padding: "6px 12px", fontSize: 13 }}>{s.caption}</div>
          {s.node}
        </div>
      ))}
      <figcaption className="mockflow-controls" style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", fontSize: 14, background: "var(--ifm-color-emphasis-100)" }}>
        <button aria-label="上一步" onClick={() => setI((x) => (x - 1 + flow.steps.length) % flow.steps.length)}
          style={{ border: "1px solid var(--ifm-color-emphasis-300)", background: "transparent", borderRadius: 6, cursor: "pointer", padding: "2px 8px" }}>‹</button>
        <span style={{ flex: 1 }}>{step.caption}</span>
        <button aria-label="下一步" onClick={() => setI((x) => (x + 1) % flow.steps.length)}
          style={{ border: "1px solid var(--ifm-color-emphasis-300)", background: "transparent", borderRadius: 6, cursor: "pointer", padding: "2px 8px" }}>›</button>
        <span style={{ display: "flex", gap: 4 }}>
          {flow.steps.map((_, d) => (
            <button key={d} aria-label={`第 ${d + 1} 步`} onClick={() => setI(d)}
              style={{ width: 8, height: 8, borderRadius: 999, border: "none", cursor: "pointer",
                background: d === i ? "var(--ifm-color-primary)" : "var(--ifm-color-emphasis-300)" }} />
          ))}
        </span>
      </figcaption>
    </figure>
  );
}
