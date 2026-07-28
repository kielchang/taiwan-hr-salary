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
  /* 快速上手：認識畫面／選月份／精靈／欄位齊備 */
  shellTour: (
    <div className="bg-background text-foreground" style={{ display: "flex", gap: 10, padding: 12, minHeight: 230 }}>
      <Spot label="① 功能選單：依工作性質分區">
        <div style={{ width: 150, display: "flex", flexDirection: "column", gap: 4, fontSize: 12, padding: 4 }}>
          <strong style={{ fontSize: 11, opacity: 0.6 }}>每月作業</strong>
          <span>工作台</span>
          <span style={{ display: "flex", gap: 4, alignItems: "center" }}>薪資結算 <Badge variant="secondary">例行</Badge></span>
          <strong style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>規劃與分析</strong>
          <span style={{ display: "flex", gap: 4, alignItems: "center" }}>薪酬分析 <Badge variant="outline">試算</Badge></span>
          <strong style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>報表與申報</strong>
          <span>月結報表・申報名冊</span>
          <strong style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>主檔與設定</strong>
          <span>基本資料・系統設定</span>
        </div>
      </Spot>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 10 }}>
        <Spot label="② 本月狀態：月份／資料／月結">
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", padding: 4 }}>
            <Badge variant="outline">DEV</Badge>
            <Button size="sm" variant="ghost">導引</Button>
            <span style={{ fontSize: 13 }}>本月 <strong>2026-07</strong></span>
            <Badge variant="success">資料正常</Badge>
            <Badge variant="warning">未確認</Badge>
          </div>
        </Spot>
        <Ph h={120} label="內容區（依選單切換）" />
      </div>
    </div>
  ),
  periodPicker: (
    <ScreenFrame>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 13 }}>本月</span>
        <Spot label="先選對發薪月份"><Ph w={110} h={28} label="2026-07 ▾" /></Spot>
        <Badge variant="warning">未確認</Badge>
        <span style={{ fontSize: 12, color: "var(--ifm-color-emphasis-600)" }}>已確認的月份會顯示 <Badge variant="success">已確認</Badge></span>
      </div>
      <Ph h={90} label="之後所有輸入與報表都算在選定的月份" />
    </ScreenFrame>
  ),
  wizardDefaults: (
    <ScreenFrame>
      <Ph h={16} label="初始設定精靈：③ 薪資結構預設" />
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 13 }}>伙食津貼（新進預設）</span>
        <Spot label="之後新增員工自動帶入"><NumberInput value={3000} onChange={() => {}} /></Spot>
      </div>
      <Callout variant="info" title="只是預設值">每位員工建檔後仍可逐人調整；改預設不影響已建檔員工。</Callout>
    </ScreenFrame>
  ),
  employeeReady: (
    <ScreenFrame>
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))" }}>
        <EditableField label="身分證字號" kind="text" value="A123456789" onChange={() => {}} />
        <EditableField label="Email" kind="text" value="" placeholder="未填" onChange={() => {}} />
      </div>
      <Spot label="缺欄會在對應作業卡住">
        <Callout variant="warning" title="Email 未填">薪資條寄送時這位員工會被略過——寄送前系統會列出未填名單。</Callout>
      </Spot>
    </ScreenFrame>
  ),
  /* 每月作業：省時技巧／獎金／確認鎖定 */
  monthlyShortcuts: (
    <ScreenFrame>
      <div style={{ border: "1px solid var(--ifm-color-emphasis-300)", borderRadius: 10, padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
        <Ph h={44} label="（本月異動欄位…）" />
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
          <Spot label="複製上月再微調"><Button size="sm" variant="outline">帶入上月異動</Button></Spot>
          <span style={{ display: "flex", gap: 8 }}>
            <Spot label="Shift+Enter"><Button size="sm" variant="outline">儲存並下一位</Button></Spot>
            <Button size="sm">儲存本月異動</Button>
          </span>
        </div>
      </div>
    </ScreenFrame>
  ),
  bonusEntry: (
    <ScreenFrame>
      <div style={{ border: "1px solid var(--ifm-color-emphasis-300)", borderRadius: 10, padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 13 }}>本月獎金</span>
          <Spot label="填這裡"><NumberInput value={60000} onChange={() => {}} /></Spot>
          <span style={{ fontSize: 13, color: "var(--ifm-color-emphasis-600)" }}>今年累計獎金（自動）：<strong>120,000</strong></span>
        </div>
        <Callout variant="info" title="累計不用手填">二代健保 4 倍門檻用的「今年累計」由系統自動加總，年中導入才需要一次性補登。</Callout>
      </div>
    </ScreenFrame>
  ),
  confirmDo: (
    <ScreenFrame>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <span style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>2026-07 <Badge variant="warning">未確認</Badge></span>
        <Spot label="紅字清空後按"><Button size="sm">確認本月結算</Button></Spot>
      </div>
      <Ph h={70} label="（試算總覽…）" />
    </ScreenFrame>
  ),
  confirmLocked: (
    <ScreenFrame>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <span style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>2026-07 <Badge variant="success">已確認</Badge></span>
        <Spot label="要改資料先按這裡"><Button size="sm" variant="outline">取消確認</Button></Spot>
      </div>
      <Callout variant="warning" title="本月已凍結">異動、薪資、眷屬與法定參數都改不動；相關頁面會提示「先取消確認」。</Callout>
    </ScreenFrame>
  ),
  /* 人事事件：離職／留停區間／調職／眷屬／扣繳／回復 */
  offboardScenario: (
    <ScreenFrame>
      <Ph h={16} label="員工檔案：基本資料（上）" />
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <Spot label="選這個情境"><Button size="sm" variant="outline">離職</Button></Spot>
        <Button size="sm" variant="outline">留停/停職</Button>
        <Button size="sm" variant="outline">薪資結構調整</Button>
        <Button size="sm" variant="outline">眷屬異動</Button>
      </div>
    </ScreenFrame>
  ),
  offboardForm: (
    <ScreenFrame>
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))" }}>
        <EditableField label="離職日" kind="date" value="2026-07-15" onChange={() => {}} />
        <EditableField label="異動原因（必填）" kind="text" value="自請離職" onChange={() => {}} />
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}><Spot><Button size="sm">送出異動</Button></Spot></div>
    </ScreenFrame>
  ),
  offboardDone: (
    <ScreenFrame>
      <Callout variant="info" title="完成後你會看到">
        該員狀態轉 <Badge variant="secondary">離職</Badge>、名冊列入「退保」、工作台「本月應退保」+1；當月薪資自動按在職天數計。
      </Callout>
      <Callout variant="warning" title="退保要自行辦理">名冊是提醒性質，系統不會自動向勞保局／健保署申報。</Callout>
    </ScreenFrame>
  ),
  leaveSegments: (
    <ScreenFrame>
      <Ph h={16} label="員工檔案：區間紀錄（基本分頁下方）" />
      <Spot label="一段＝一次留停/停職；可多段">
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", padding: 4, fontSize: 13 }}>
          <Ph w={70} h={26} label="留停 ▾" />
          <span>生效</span><Ph w={96} h={26} label="2026-03-01" />
          <span>復職</span><Ph w={96} h={26} label="（未復職）" />
          <span>給薪</span><Ph w={64} h={26} label="政策預設" />
        </div>
      </Spot>
      <div style={{ display: "flex", justifyContent: "flex-end" }}><Button size="sm" variant="outline">新增一段</Button></div>
      <Callout variant="info" title="復職＝補填該段復職日">之後自動回全薪，不必手動改回「在職」。</Callout>
    </ScreenFrame>
  ),
  contactScenario: (
    <ScreenFrame>
      <Ph h={16} label="員工檔案：基本資料（上）" />
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <Button size="sm" variant="outline">離職</Button>
        <Button size="sm" variant="outline">薪資結構調整</Button>
        <Spot label="調職／改部門走這裡"><Button size="sm" variant="outline">基本聯絡資料</Button></Spot>
      </div>
      <Callout variant="info" title="唯一不受月結鎖定的情境">部門、姓名、Email 等小修正即使當月已確認也能改。</Callout>
    </ScreenFrame>
  ),
  dependentsForm: (
    <ScreenFrame>
      <Ph h={16} label="眷屬異動：王媽媽" />
      <Spot label="兩個勾選是分開的">
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", padding: 4 }}>
          <EditableField label="依附健保" kind="checkbox" value={true} onChange={() => {}} />
          <EditableField label="報稅扶養" kind="checkbox" value={false} onChange={() => {}} />
        </div>
      </Spot>
      <Callout variant="info" title="影響不同">依附健保→健保費眷屬口數；報稅扶養→代扣稅試算的免稅額。</Callout>
    </ScreenFrame>
  ),
  withholdingForm: (
    <ScreenFrame>
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))" }}>
        <Spot label="選扣繳方式">
          <EditableField label="扣繳方式" kind="radio" alwaysEdit value="table" onChange={() => {}}
            options={[{ value: "table", label: "依稅額表" }, { value: "fixed", label: "固定 5%" }]} />
        </Spot>
        <EditableField label="勞退自提率" kind="rate" value={6} unit="%" onChange={() => {}} />
      </div>
    </ScreenFrame>
  ),
  auditRestore: (
    <ScreenFrame>
      <Ph h={16} label="異動紀錄（基本資料分頁）" />
      <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, flexWrap: "wrap" }}>
        <Ph w={80} label="07-10" /><span>薪資結構調整・蔡佩珊</span><span style={{ color: "var(--ifm-color-emphasis-600)" }}>45,800 → 48,000</span>
        <Spot label="一鍵還原成變更前"><Button size="sm" variant="outline">回復</Button></Spot>
      </div>
      <Callout variant="info" title="回復也留紀錄">回復本身會再記一筆；已確認月份的回復會被鎖定擋下。</Callout>
    </ScreenFrame>
  ),
  /* 申報：繳費清單／代扣稅 */
  filingInsurance: (
    <ScreenFrame>
      <TabPills tabs={[{ key: "a", label: "年度扣繳憑單" }, { key: "b", label: "勞健退繳費清單" }, { key: "c", label: "投保級距申報調整" }, { key: "d", label: "加退保作業清單" }]} value="b" onChange={() => {}} />
      <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
        <Ph w={64} /><span>勞保 58,132／健保 46,870／勞退 32,410</span><strong>合計 137,412</strong>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Spot label="與繳款單對帳"><Button size="sm" variant="outline">匯出 CSV</Button></Spot>
      </div>
    </ScreenFrame>
  ),
  filingTax: (
    <ScreenFrame>
      <Ph h={16} label="代扣所得稅清單（月結報表）" />
      <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
        <Ph w={64} /><span>應扣 2,000</span><Badge variant="success">已填</Badge>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
        <Ph w={64} /><span>應扣 —</span><Spot label="最常見的漏填在這裡看"><Badge variant="warning">未填</Badge></Spot>
      </div>
    </ScreenFrame>
  ),
  /* 年度與設定：級距匯入／公司政策 */
  bracketImport: (
    <ScreenFrame>
      <Ph h={16} label="系統設定 → 投保級距" />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Button size="sm" variant="outline">逐格編輯</Button>
        <Spot label="年度公告整批更新用"><Button size="sm" variant="outline">匯入 CSV</Button></Spot>
        <Button size="sm" variant="ghost">下載模板</Button>
      </div>
      <Callout variant="info" title="匯入前有預覽">逐列檢查（金額遞增、格式）通過才會套用；已確認月份引用的版本改不動，會導向「新增生效版本」。</Callout>
    </ScreenFrame>
  ),
  policyCards: (
    <ScreenFrame>
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
        <Spot label="影響年資/特休顯示">
          <EditableField label="年資／特休計算方式" kind="radio" alwaysEdit value="hire" onChange={() => {}}
            options={[{ value: "fixed", label: "固定基準日" }, { value: "hire", label: "依到職日（週年制）" }]} />
        </Spot>
        <EditableField label="留停給薪比例（政策預設）" kind="rate" value={0} unit="%" onChange={() => {}} />
      </div>
      <Callout variant="info" title="逐案可覆寫">員工「區間紀錄」每段可另設給薪比例，留白＝採此政策。</Callout>
    </ScreenFrame>
  ),
  /* 分析：狀態徽章／調薪核定 */
  analyticsBadges: (
    <ScreenFrame>
      <Spot label="先看徽章再讀數字">
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", padding: 4, fontSize: 13 }}>
          <Badge variant="warning">試算暫定</Badge><span>本月未確認，數字會隨輸入變動</span>
        </div>
      </Spot>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", fontSize: 13 }}>
        <Badge variant="success">已確認實際</Badge><span>本月已凍結快照</span>
        <Badge variant="secondary">歷史實際</Badge><span>過去月份的留存快照</span>
      </div>
    </ScreenFrame>
  ),
  raisePlan: (
    <ScreenFrame>
      <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
        <Ph w={72} label="方案 A" /><span>全員 +3%</span><span>年成本</span><Delta value={1860000} goodWhen="negative" />
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Spot label="沙盒→實際生效只差這一步"><Button size="sm">核定並套用</Button></Spot>
      </div>
      <Callout variant="danger" title="套用後無法一鍵回復">核定會逐人寫入薪資主檔；要撤回只能逐筆從異動紀錄回復。</Callout>
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
  "offboard": { title: "人事事件：員工要離職", to: "/master", steps: [
    { caption: "① 開啟員工檔案，情境選「離職」", node: S.offboardScenario },
    { caption: "② 填離職日與異動原因，送出", node: S.offboardForm },
    { caption: "③ 完成後：狀態轉離職、退保提醒＋當月按在職天數計薪", node: S.offboardDone },
  ]},
  "confirm-lock": { title: "確認本月結算：先存檔、再上鎖", to: "/payroll/review", steps: [
    { caption: "① 紅字全數排除後按「確認本月結算」＝留存快照", node: S.confirmDo },
    { caption: "② 徽章轉「已確認」＝該月凍結；要改資料先按「取消確認」（會刪快照，改完務必重新確認）", node: S.confirmLocked },
  ]},
};

/* ── 單格畫面註冊表（key＝文件內 <MockScreen name="…">；守衛同 MOCK_FLOWS） ── */

export const MOCK_SCREENS: Record<string, { title: string; caption: string; to?: string; node: React.ReactNode }> = {
  "shell-tour": { title: "認識畫面：兩個固定區域", caption: "左＝功能選單（分區＋例行/試算徽章）；上＝本月狀態（環境/月份/資料/月結）", to: "/", node: S.shellTour },
  "period-picker": { title: "先選對發薪月份", caption: "頂部「本月」選擇器決定之後所有輸入與報表算在哪個月", to: "/", node: S.periodPicker },
  "wizard-defaults": { title: "精靈：薪資結構預設", caption: "這一步填的是「新進員工預設」，之後建檔自動帶入、可再逐人調整", to: "/", node: S.wizardDefaults },
  "employee-ready": { title: "缺欄會在哪裡看到", caption: "欄位沒填齊時，對應作業（寄薪資條、加密 PDF…）會列出未填名單", to: "/master", node: S.employeeReady },
  "monthly-dialog": { title: "異動欄位在對話框裡", caption: "點員工列「編輯」開啟；填數字時下方試算即時更新", to: "/payroll/monthly", node: S.monthlyDialog },
  "monthly-shortcuts": { title: "省時三招的位置", caption: "左下「帶入上月異動」；右下「儲存並下一位」（Shift+Enter）", to: "/payroll/monthly", node: S.monthlyShortcuts },
  "bonus-entry": { title: "獎金填哪裡", caption: "「本月獎金」欄；旁邊「今年累計」由系統自動加總、不用手填", to: "/payroll/monthly", node: S.bonusEntry },
  "leave-segments": { title: "區間紀錄：一段＝一次留停", caption: "每段自己的生效日/復職日/給薪比例；復職＝補填該段復職日", to: "/master", node: S.leaveSegments },
  "contact-scenario": { title: "調職走「基本聯絡資料」情境", caption: "部門異動屬聯絡資料小修正；唯一不受月結鎖定的情境", to: "/master", node: S.contactScenario },
  "dependents-form": { title: "依附健保／報稅扶養分開勾", caption: "前者影響健保費口數、後者影響代扣稅免稅額——可只勾其一", to: "/master", node: S.dependentsForm },
  "withholding-form": { title: "扣繳設定長這樣", caption: "扣繳方式二選一＋勞退自提率；影響下月起的代扣", to: "/master", node: S.withholdingForm },
  "audit-restore": { title: "回復鈕在異動紀錄裡", caption: "逐欄編輯類的異動可一鍵還原成變更前值；回復本身也留紀錄", to: "/master?tab=audit", node: S.auditRestore },
  "filing-insurance": { title: "勞健退繳費清單", caption: "三險合計對帳；「匯出 CSV」給會計或留存", to: "/reports?tab=insurance", node: S.filingInsurance },
  "filing-tax": { title: "代扣稅清單的「未填」警示", caption: "最常見漏填在此顯示；點列可回去補", to: "/reports?tab=tax", node: S.filingTax },
  "filing-bracket": { title: "級距申報調整", caption: "比對現→報；主管機關申報完成後才按「以目前為申報基準」", to: "/reports?tab=bracket", node: S.filingBracket },
  "filing-enroll": { title: "加退保名冊＝提醒性質", caption: "供人工向勞健保單位辦理；系統不自動改保費", to: "/reports?tab=enrollment", node: S.filingEnroll },
  "filing-tabs": { title: "年度扣繳憑單位置", caption: "申報名冊第一個分頁；逐人彙總、可匯出 CSV", to: "/reports?tab=withholding", node: S.filingTabs },
  "bracket-import": { title: "級距表兩種改法", caption: "逐格編輯（微調）或 CSV 整批匯入（年度公告）；匯入前逐列檢查", to: "/settings?tab=brackets", node: S.bracketImport },
  "policy-cards": { title: "公司政策設定", caption: "年資計算方式與留停給薪比例——影響全公司的兩個開關", to: "/settings?tab=company", node: S.policyCards },
  "review-checks": { title: "紅字／黃字長這樣", caption: "紅＝必須處理（擋確認）；黃＝建議確認；點「前往修正」直達", to: "/payroll/review", node: S.reviewChecks },
  "analytics-badges": { title: "先看資料狀態徽章", caption: "試算暫定／已確認實際／歷史實際——判讀數字前先確認資料狀態", to: "/analytics", node: S.analyticsBadges },
  "raise-plan": { title: "核定並套用＝實際生效", caption: "沙盒比較不動薪資；按下這顆才寫入主檔，且無法一鍵回復", to: "/analytics?tab=raise", node: S.raisePlan },
};

/** 單格畫面（零截圖）：一張對位畫面＋字幕＋直達入口；列印樣式與 MockFlow 一致 */
export function MockScreen({ name }: { name: string }) {
  const sc = MOCK_SCREENS[name];
  if (!sc) return <div>未知畫面：{name}</div>;
  return (
    <figure className="mockflow" style={{ margin: "1rem 0", border: "1px solid var(--ifm-color-emphasis-300)", borderRadius: 8, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 12px", background: "var(--ifm-color-emphasis-100)", fontSize: 13 }}>
        <strong>{sc.title}</strong>
        {sc.to && <AppLink to={sc.to}>開啟此作業</AppLink>}
      </div>
      <div className="mockflow-step mockflow-step-active" style={{ borderBottom: "1px solid var(--ifm-color-emphasis-200)" }}>{sc.node}</div>
      <figcaption style={{ padding: "8px 12px", fontSize: 14, background: "var(--ifm-color-emphasis-100)" }}>{sc.caption}</figcaption>
    </figure>
  );
}

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
