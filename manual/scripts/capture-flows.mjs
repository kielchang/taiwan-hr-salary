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

await b.close();
console.log("capture done →", OUT);
