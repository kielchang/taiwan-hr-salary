// @vitest-environment jsdom
// 表單元件互動/無障礙：EditableField 的 radio/multiselect ARIA 語意與鍵盤、
// ChangeSummary「還原需先確認」（與欄位 undo 一致）。以 react-dom createRoot + act 掛載真實 DOM。
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { EditableField } from "@/components/form/EditableField";
import { ChangeSummary } from "@/components/form/ChangeSummary";
import type { Change } from "@/lib/forms/diff";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function click(el: Element | null) {
  act(() => { el?.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
}

const OPTS = [
  { value: "A", label: "甲" },
  { value: "B", label: "乙" },
  { value: "C", label: "丙" },
];

describe("EditableField radio（單選）無障礙", () => {
  it("點開後為 radiogroup，選項為 radio 且反映 aria-checked", () => {
    act(() => {
      root.render(<EditableField label="等級" kind="radio" value="A" original="A" options={OPTS} onChange={() => {}} />);
    });
    // 收合態：唯讀值按鈕（含 aria-label）
    const collapsed = container.querySelector("button[aria-label]");
    expect(collapsed?.getAttribute("aria-label")).toContain("等級");
    click(collapsed);

    const group = container.querySelector('[role="radiogroup"]');
    expect(group).toBeTruthy();
    expect(group?.getAttribute("aria-label")).toBe("等級");
    const radios = container.querySelectorAll('[role="radio"]');
    expect(radios.length).toBe(3);
    expect(radios[0].getAttribute("aria-checked")).toBe("true");
    expect(radios[1].getAttribute("aria-checked")).toBe("false");
    // 選中者 roving tabindex=0、其餘 -1
    expect(radios[0].getAttribute("tabindex")).toBe("0");
    expect(radios[1].getAttribute("tabindex")).toBe("-1");
  });

  it("點選其他選項 → onChange 傳回該值", () => {
    let picked: unknown = null;
    act(() => {
      root.render(<EditableField label="等級" kind="radio" value="A" original="A" options={OPTS} onChange={(v) => (picked = v)} />);
    });
    click(container.querySelector("button[aria-label]"));
    const radios = container.querySelectorAll('[role="radio"]');
    click(radios[2]);
    expect(picked).toBe("C");
  });
});

describe("EditableField multiselect（多選）無障礙", () => {
  it("點開後為 group，選項為 checkbox 並反映 aria-checked", () => {
    act(() => {
      root.render(<EditableField label="適用假別" kind="multiselect" value={["A"]} original={["A"]} options={OPTS} onChange={() => {}} />);
    });
    click(container.querySelector("button[aria-label]"));
    const group = container.querySelector('[role="group"]');
    expect(group?.getAttribute("aria-label")).toBe("適用假別");
    const boxes = container.querySelectorAll('[role="checkbox"]');
    expect(boxes.length).toBe(3);
    expect(boxes[0].getAttribute("aria-checked")).toBe("true");
    expect(boxes[1].getAttribute("aria-checked")).toBe("false");
  });
});

describe("EditableField 鎖定欄", () => {
  it("以 aria-disabled 呈現且可聚焦，aria-label 帶鎖定原因", () => {
    act(() => {
      root.render(<EditableField label="本薪" kind="money" value={40000} original={40000} disabled lockHint="本期已確認" onChange={() => {}} />);
    });
    const locked = container.querySelector('[aria-disabled="true"]');
    expect(locked).toBeTruthy();
    expect(locked?.getAttribute("tabindex")).toBe("0");
    expect(locked?.getAttribute("aria-label")).toContain("本期已確認");
  });
});

describe("ChangeSummary 還原需先確認", () => {
  const changes: Change[] = [
    { field: "name", label: "姓名", before: "王小明", after: "王大明", beforeText: "王小明", afterText: "王大明" },
    { field: "base", label: "本薪", before: 40000, after: 42000, beforeText: "$40,000", afterText: "$42,000" },
  ];

  it("逐欄還原：第一次點只出現確認、需再按確定才呼叫 onRevertField", () => {
    const reverted: string[] = [];
    act(() => {
      root.render(<ChangeSummary changes={changes} onRevertField={(f) => reverted.push(f)} onRevertAll={() => {}} />);
    });
    // 每列有一顆還原鈕（aria-label 以「還原」開頭）
    const revertBtns = Array.from(container.querySelectorAll("button")).filter((b) => b.getAttribute("aria-label")?.startsWith("還原"));
    expect(revertBtns.length).toBe(2);
    click(revertBtns[0]);
    expect(reverted).toEqual([]); // 尚未確認，不應執行

    // 出現確認列（含「還原？」與確定鈕）
    const confirmText = container.textContent ?? "";
    expect(confirmText).toContain("還原？");
    const confirmBtn = Array.from(container.querySelectorAll("button")).find((b) => b.textContent === "確定");
    expect(confirmBtn).toBeTruthy();
    click(confirmBtn!);
    expect(reverted).toEqual(["name"]);
  });

  it("全部還原：需確認後才呼叫 onRevertAll", () => {
    let all = 0;
    act(() => {
      root.render(<ChangeSummary changes={changes} onRevertField={() => {}} onRevertAll={() => (all += 1)} />);
    });
    const allBtn = Array.from(container.querySelectorAll("button")).find((b) => b.textContent?.includes("全部還原"));
    click(allBtn!);
    expect(all).toBe(0);
    const confirmBtn = Array.from(container.querySelectorAll("button")).find((b) => b.textContent === "確定");
    click(confirmBtn!);
    expect(all).toBe(1);
  });
});
