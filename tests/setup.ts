// Node 23+ 內建實驗性 Web Storage：未帶 --localstorage-file 時，globalThis 上的
// localStorage／sessionStorage 是「屬性存在但取值為 undefined」的 accessor，且 vitest 的
// jsdom 環境（window 即 globalThis）不會覆蓋已存在的全域屬性，jsdom 實作因此掛不上。
// 這裡僅在該情況（屬性存在、值為 undefined）換成記憶體 Storage 墊片；
// CI 的 Node 20 沒有這個屬性（維持 zustand persist 的 ReferenceError 靜默停用路徑），不受影響。
function memoryStorage(): Storage {
  const m = new Map<string, string>();
  return {
    get length() { return m.size; },
    clear: () => m.clear(),
    getItem: (k: string) => (m.has(k) ? (m.get(k) as string) : null),
    key: (i: number) => [...m.keys()][i] ?? null,
    removeItem: (k: string) => { m.delete(k); },
    setItem: (k: string, v: string) => { m.set(k, String(v)); },
  };
}

for (const key of ["localStorage", "sessionStorage"] as const) {
  if (key in globalThis && (globalThis as Record<string, unknown>)[key] === undefined) {
    Object.defineProperty(globalThis, key, { value: memoryStorage(), configurable: true, writable: true });
  }
}
export {};
