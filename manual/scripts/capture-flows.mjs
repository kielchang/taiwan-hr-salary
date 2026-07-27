// 操作流程畫面錄製：以 Playwright 驅動「已 build 的系統」（vite preview），載入示範公司後
// 逐步截圖三條核心流程 → manual/static/flows/<flow>/NN.png ＋ manifest.json（字幕）。
// 用途：手冊 FlowPlayer 動畫的素材來源。UI 改版後重跑本腳本即可讓手冊畫面與系統同步：
//   npm run build && npx vite preview --port 4179 &
//   node manual/scripts/capture-flows.mjs   （PLAYWRIGHT 需可用；容器內 chromium 於 /opt/pw-browsers）
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "static", "flows");
const BASE = process.env.CAPTURE_BASE ?? "http://127.0.0.1:4179";
const EXEC = process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium";

const b = await chromium.launch({ executablePath: EXEC });
const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
p.on("pageerror", (e) => console.error("pageerror:", String(e)));

// 進場＋載入示範公司（同驗收腳本動線）
await p.goto(BASE + "/", { waitUntil: "networkidle" });
await p.waitForTimeout(900);
if (await p.getByText("載入範例公司體驗").count()) {
  await p.getByText("載入範例公司體驗").first().click();
  await p.waitForTimeout(400);
  for (let i = 0; i < 8; i++) {
    const fin = p.getByRole("button", { name: /^完成$|開始使用|進入/ });
    if (await fin.count()) { await fin.first().click(); break; }
    const nx = p.getByRole("button", { name: /^下一步$/ });
    if (await nx.count()) { await nx.first().click(); await p.waitForTimeout(250); }
  }
  await p.waitForTimeout(700);
}
// 關掉首次導覽提示，避免入鏡
const dismiss = p.getByRole("button", { name: "不用了" });
if (await dismiss.count()) await dismiss.first().click();

let flow = null, step = 0, steps = [];
function start(name, title) { flow = { name, title }; step = 0; steps = []; mkdirSync(join(OUT, name), { recursive: true }); }
async function shot(caption) {
  step += 1;
  const img = String(step).padStart(2, "0") + ".png";
  await p.screenshot({ path: join(OUT, flow.name, img) });
  steps.push({ img, caption });
  console.log(`${flow.name} ${img} ${caption}`);
}
function finish() { writeFileSync(join(OUT, flow.name, "manifest.json"), JSON.stringify({ title: flow.title, steps }, null, 2)); }

// ── 流程 1：每月結算・輸入異動 ─────────────────────────────
start("monthly-edit", "每月結算：輸入當月異動");
await p.evaluate(() => { location.hash = "#/payroll/monthly"; });
await p.waitForTimeout(1200);
await shot("① 進「薪資結算」：全員固定薪資已自動試算，只需編輯有異動的人");
await p.getByRole("button", { name: "編輯" }).first().click();
await p.waitForTimeout(800);
await shot("② 點該員「編輯」開啟當月異動對話框（加班／請假／獎金／代扣稅）");
const otInput = p.getByRole("dialog").locator('input[type="number"]').first();
await otInput.fill("8");
await p.waitForTimeout(600);
await shot("③ 填加班時數——下方「本月加班費試算」即時更新");
await p.getByRole("button", { name: /儲存本月異動/ }).first().click();
await p.waitForTimeout(900);
await shot("④ 儲存後回到清單：該員「本月異動」欄出現標記、實發同步更新");
finish();

// ── 流程 2：查核與確認 ─────────────────────────────
start("review-confirm", "每月結算：查核與確認");
await p.evaluate(() => { location.hash = "#/payroll/review"; });
await p.waitForTimeout(1200);
await shot("① 「查核與確認」試算總覽：全公司結算列＋合計，外加模擬年度與環比");
const checksTab = p.getByRole("button", { name: /統計查核/ });
if (await checksTab.count()) { await checksTab.first().click(); await p.waitForTimeout(800); }
await shot("② 「統計查核」：紅色＝必須處理、黃色＝建議確認，可點「前往修正」直達");
await p.evaluate(() => window.scrollTo(0, 0));
await p.waitForTimeout(400);
await shot("③ 全部無誤後按右上「確認本月結算」＝留存快照並凍結當月（要再改需先取消確認）");
finish();

// ── 流程 3：匯出備份 ─────────────────────────────
start("backup", "資料備份：匯出備份檔");
await p.evaluate(() => { location.hash = "#/"; });
await p.waitForTimeout(1000);
await shot("① 工作台：尚未備份時出現琥珀提醒卡；側欄底部也有備份狀態");
await p.evaluate(() => { location.hash = "#/settings?tab=data"; });
await p.waitForTimeout(1000);
await shot("② 「系統設定 → 資料與安全」：資料備份與還原");
const dl = p.waitForEvent("download", { timeout: 8000 }).catch(() => null);
await p.getByRole("button", { name: /匯出備份檔/ }).first().click();
await dl;
await p.waitForTimeout(800);
await p.evaluate(() => { location.hash = "#/"; });
await p.waitForTimeout(900);
await shot("③ 匯出完成：提醒卡消失、側欄轉「今日已備份」（備份檔請另存雲端/隨身碟）");
finish();


// ── 流程 4：新人報到 ─────────────────────────────
start("onboard", "人事事件：有新人報到");
await p.evaluate(() => { location.hash = "#/master"; });
await p.waitForTimeout(1200);
await shot("① 到「基本資料」：右上「新進到職」建立新員工");
await p.getByRole("button", { name: /新進到職/ }).first().click();
await p.waitForTimeout(900);
await shot("② 填基本資料與到職日；固定薪資會自動帶入公司預設（可改）");
await p.evaluate(() => { const d = document.querySelector('[role=dialog]'); if (d) d.scrollTop = d.scrollHeight; });
await p.waitForTimeout(500);
await shot("③ 往下確認薪資與眷屬扣繳欄位，送出後名冊會提醒辦理加保");
await p.keyboard.press("Escape");
await p.waitForTimeout(500);

finish();

// ── 流程 5：批次調薪 ─────────────────────────────
start("batch-salary", "人事事件：批次調薪與補貼");
await p.evaluate(() => { location.hash = "#/master?tab=batch"; });
await p.waitForTimeout(1200);
await shot("① 「批次薪資」：先選族群（全公司／部門／成本中心）");
const pct = p.getByRole("dialog").locator('input[type="number"]');
const pctMain = p.locator('input[type="number"]').first();
if (await pctMain.count()) { await pctMain.fill("3"); await p.waitForTimeout(800); }
await shot("② 設定調整方式（例：本薪 +3%）——下方立即出現影響預覽（前→後、低於最低工資標示）");
await p.evaluate(() => window.scrollBy(0, 400));
await p.waitForTimeout(400);
await shot("③ 核對預覽無誤後「立即套用」或選未來月「排程」；每筆都留異動紀錄");
await p.evaluate(() => window.scrollTo(0, 0));

finish();

// ── 流程 6：發薪資條 ─────────────────────────────
start("payslip", "每月例行：發薪資條");
await p.evaluate(() => { location.hash = "#/reports?tab=payslip"; });
await p.waitForTimeout(1400);
await shot("① 「報表與申報 → 薪資條」：用下拉選單選員工、下方即時預覽");
await p.evaluate(() => window.scrollBy(0, 500));
await p.waitForTimeout(400);
await shot("② 預覽內容：應發/代扣/實發、公司負擔，外幣另列（不含台幣實發）");
await p.evaluate(() => window.scrollTo(0, 0));
await p.waitForTimeout(300);
await shot("③ 「下載加密 PDF」單發（密碼＝身分證大寫）或「批次下載全部（ZIP）」一次發");

finish();

// ── 流程 7：申報名冊走一輪 ─────────────────────────────
start("filing", "申報與繳費：四類名冊");
await p.evaluate(() => { location.hash = "#/reports?tab=withholding"; });
await p.waitForTimeout(1400);
await shot("① 年度扣繳憑單：逐人全年應發/應稅/代扣稅，可匯出 CSV");
const tabIns = p.getByRole("button", { name: "勞健退繳費清單" });
if (await tabIns.count()) { await tabIns.first().click(); await p.waitForTimeout(800); }
await shot("② 勞健退繳費清單：當期投保金額與員工自付/雇主負擔");
const tabBr = p.getByRole("button", { name: "投保級距申報調整" });
if (await tabBr.count()) { await tabBr.first().click(); await p.waitForTimeout(800); }
await shot("③ 投保級距申報調整：2月/8月比對「現在 vs 已申報」，列出需調整者");
const tabEn = p.getByRole("button", { name: "加退保作業清單" });
if (await tabEn.count()) { await tabEn.first().click(); await p.waitForTimeout(800); }
await shot("④ 加退保作業清單：本月應加保/退保/停保/復保（提醒性質，供人工辦理）");

finish();

// ── 流程 8：年度費率更新（生效月版本） ─────────────────────────────
start("settings-version", "年度維護：更新法定費率（不回溯歷史）");
await p.evaluate(() => { location.hash = "#/settings"; });
await p.waitForTimeout(1200);
await shot("① 「系統設定 → 法定參數」：已有已確認月時費率鎖定、出現黃色提示卡");
const verBtn = p.getByRole("button", { name: /新增生效版本/ });
if (await verBtn.count()) { await verBtn.first().click(); await p.waitForTimeout(900); }
await shot("② 選生效月按「新增生效版本」：之後欄位解鎖，只影響生效月起的月份");
await p.evaluate(() => window.scrollBy(0, 300));
await p.waitForTimeout(400);
await shot("③ 更新公告的新費率——先前已申報月份維持原費率，不會被改動");
await p.evaluate(() => window.scrollTo(0, 0));

finish();

// ── 流程 9：外幣薪資設定 ─────────────────────────────
start("currency-setup", "設定：啟用外幣薪資");
await p.evaluate(() => { location.hash = "#/settings?tab=currency"; });
await p.waitForTimeout(1200);
const fxToggle = p.locator('[data-tour="fx-enable-toggle"] button, [data-tour="fx-enable-toggle"] [role=switch]');
if (await fxToggle.count()) { await fxToggle.first().click(); await p.waitForTimeout(800); }
await shot("① 「幣別與匯率」：打開「啟用多幣別」才會出現維護中心");
const codeInput = p.getByPlaceholder(/USD|代碼/).first();
if (await codeInput.count()) { await codeInput.fill("USD"); }
await p.waitForTimeout(400);
await shot("② 新增幣別（代碼/名稱/符號）");
await p.evaluate(() => window.scrollBy(0, 300));
await p.waitForTimeout(400);
await shot("③ 逐月維護匯率：未設匯率＝該月台幣約當以 0 計（旁有「未設匯率」提醒）");
finish();


// ── 流程 10：工作台導覽 ─────────────────────────────
start("dashboard", "工作台：今天要處理什麼");
await p.evaluate(() => { location.hash = "#/"; });
await p.waitForTimeout(1200);
await shot("① 工作台首頁：本月摘要四卡（結算人數/應發/實發/公司總成本）＋確認狀態");
await p.evaluate(() => window.scrollBy(0, 420));
await p.waitForTimeout(400);
await shot("② 待辦卡逐張看：數字＝待處理件數，按卡片上的按鈕直達處理位置");
await p.evaluate(() => window.scrollBy(0, 500));
await p.waitForTimeout(400);
await shot("③ 往下還有排程調薪與快捷入口；卡片歸零代表本月無待辦");
await p.evaluate(() => window.scrollTo(0, 0));

// ── 流程 11：主檔情境操作 ─────────────────────────────
start("master-scenario", "基本資料：情境申請單怎麼用");
await p.evaluate(() => { location.hash = "#/master"; });
await p.waitForTimeout(1200);
await shot("① 「基本資料 → 員工清單」：點任一位員工開啟檔案面板");
const row = p.locator("tbody tr").first();
if (await row.count()) { await row.click(); await p.waitForTimeout(900); }
await shot("② 檔案面板：上方是基本資料，下方兩排「情境」按鈕——挑要辦的事");
const scenBtn = p.getByRole("button", { name: /薪資結構調整/ });
if (await scenBtn.count()) { await scenBtn.first().click(); await p.waitForTimeout(800); }
await shot("③ 選情境後只出現該情境欄位＋必填「異動原因」；填好按送出即留稽核紀錄");
await p.keyboard.press("Escape");
await p.waitForTimeout(400);

await b.close();
console.log("capture done →", OUT);
