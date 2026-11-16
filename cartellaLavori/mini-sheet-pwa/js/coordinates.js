// Conversione A1 <-> indici (0-based). Griglia 100x100: A1:CV100
export const ROWS = 100, COLS = 100;
export function colName(c) { // 0 -> A, 26 -> AA
  let s = ''; c++;
  while (c > 0) { const m = (c - 1) % 26; s = String.fromCharCode(65 + m) + s; c = Math.floor((c - 1) / 26); }
  return s;
}
export function colIndex(s) { let n = 0; for (const ch of s) n = n * 26 + ch.charCodeAt(0) - 64; return n - 1; }
export function parseRef(s) { // "B3" -> {r:2,c:1}
  const m = /^([A-Z]{1,3})(\d+)$/.exec(s);
  return m ? { r: +m[2] - 1, c: colIndex(m[1]) } : null;
}
export const refName = (r, c) => colName(c) + (r + 1);
