// 操作流程動畫播放器：輪播「實際系統畫面」截圖＋逐步字幕（素材由 scripts/capture-flows.mjs
// 對真系統錄製；UI 改版後重跑腳本即同步）。自動播放、滑鼠移入暫停、可點步驟圓點/前後步。
// 用法（全域註冊，.md 直接用）：<FlowPlayer name="monthly-edit" />
import React, { useEffect, useRef, useState } from "react";
import useBaseUrl from "@docusaurus/useBaseUrl";

interface Step { img: string; caption: string }
interface Manifest { title: string; steps: Step[] }

export default function FlowPlayer({ name, interval = 3200 }: { name: string; interval?: number }) {
  const base = useBaseUrl(`/flows/${name}/`);
  const [mf, setMf] = useState<Manifest | null>(null);
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`${base}manifest.json`).then((r) => r.json()).then((m) => { if (alive) setMf(m); }).catch(() => {});
    return () => { alive = false; };
  }, [base]);

  useEffect(() => {
    if (!mf || paused) return;
    timer.current = window.setTimeout(() => setI((x) => (x + 1) % mf.steps.length), interval);
    return () => { if (timer.current) window.clearTimeout(timer.current); };
  }, [mf, i, paused, interval]);

  if (!mf) return <div style={{ padding: 16, border: "1px solid var(--ifm-color-emphasis-300)", borderRadius: 8 }}>載入操作畫面…</div>;
  const step = mf.steps[i];
  return (
    <figure
      style={{ margin: "1rem 0", border: "1px solid var(--ifm-color-emphasis-300)", borderRadius: 8, overflow: "hidden" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 12px", background: "var(--ifm-color-emphasis-100)", fontSize: 13 }}>
        <strong>{mf.title}</strong>
        <span style={{ color: "var(--ifm-color-emphasis-600)" }}>{i + 1} / {mf.steps.length}{paused ? "（暫停）" : ""}</span>
      </div>
      <img src={`${base}${step.img}`} alt={step.caption} style={{ display: "block", width: "100%" }} />
      <figcaption style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", fontSize: 14, background: "var(--ifm-color-emphasis-100)" }}>
        <button aria-label="上一步" onClick={() => setI((x) => (x - 1 + mf.steps.length) % mf.steps.length)}
          style={{ border: "1px solid var(--ifm-color-emphasis-300)", background: "transparent", borderRadius: 6, cursor: "pointer", padding: "2px 8px" }}>‹</button>
        <span style={{ flex: 1 }}>{step.caption}</span>
        <button aria-label="下一步" onClick={() => setI((x) => (x + 1) % mf.steps.length)}
          style={{ border: "1px solid var(--ifm-color-emphasis-300)", background: "transparent", borderRadius: 6, cursor: "pointer", padding: "2px 8px" }}>›</button>
        <span style={{ display: "flex", gap: 4 }}>
          {mf.steps.map((_, d) => (
            <button key={d} aria-label={`第 ${d + 1} 步`} onClick={() => setI(d)}
              style={{ width: 8, height: 8, borderRadius: 999, border: "none", cursor: "pointer",
                background: d === i ? "var(--ifm-color-primary)" : "var(--ifm-color-emphasis-300)" }} />
          ))}
        </span>
      </figcaption>
    </figure>
  );
}
