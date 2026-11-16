// UI: griglia virtualizzata, navigazione da tastiera, barra formula, salvataggio, PWA
import { ROWS, COLS, colName, refName } from './coordinates.js';
import { Engine, fmt, XError } from './engine.js';

const CW = 90, RH = 26, KEY = 'minisheet-v1';
const $ = id => document.getElementById(id);
const eng = new Engine();
const vp = $('viewport'), sizer = $('sizer'), cells = $('cells'), colHi = $('colHi'), rowHi = $('rowHi');
const fb = $('fbar'), nb = $('namebox'), st = $('status'), ed = $('editor');
const selBox = $('selBox'), bandR = $('bandR'), bandC = $('bandC');
let sel = { r: 0, c: 0 }, editing = false, win = '', tick = 0, tm;
const rendered = new Map(); // id -> elemento DOM (solo le celle visibili)

// Intestazioni (solo 200 elementi, fisse)
sizer.style.width = COLS * CW + 'px'; sizer.style.height = ROWS * RH + 'px';
colHi.style.width = COLS * CW + 'px'; rowHi.style.height = ROWS * RH + 'px';
for (let c = 0; c < COLS; c++) { const d = document.createElement('div'); d.className = 'hd'; d.style.cssText = `left:${c * CW}px;width:${CW}px;height:${RH}px`; d.textContent = colName(c); colHi.appendChild(d); }
for (let r = 0; r < ROWS; r++) { const d = document.createElement('div'); d.className = 'hd'; d.style.cssText = `top:${r * RH}px;height:${RH}px;width:100%`; d.textContent = r + 1; rowHi.appendChild(d); }

function paint(el, r, c) {
  const v = eng.get(r * COLS + c);
  el.textContent = fmt(v);
  el.className = 'cell' + (typeof v === 'number' ? ' num' : '') + (v instanceof XError ? ' err' : '');
  el.title = v instanceof XError ? v.msg : '';
}
// VIRTUALIZZAZIONE: nel DOM esistono solo le celle nella finestra visibile (+3 di margine)
function update() {
  const r0 = Math.max(0, Math.floor(vp.scrollTop / RH) - 3), r1 = Math.min(ROWS - 1, Math.ceil((vp.scrollTop + vp.clientHeight) / RH) + 3);
  const c0 = Math.max(0, Math.floor(vp.scrollLeft / CW) - 3), c1 = Math.min(COLS - 1, Math.ceil((vp.scrollLeft + vp.clientWidth) / CW) + 3);
  const key = [r0, r1, c0, c1].join(); if (key === win) return; win = key;
  for (const [k, el] of rendered) { const r = (k / COLS) | 0, c = k % COLS; if (r < r0 || r > r1 || c < c0 || c > c1) { el.remove(); rendered.delete(k); } }
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
    const k = r * COLS + c; if (rendered.has(k)) continue;
    const el = document.createElement('div'); el.style.cssText = `left:${c * CW}px;top:${r * RH}px`;
    paint(el, r, c); cells.appendChild(el); rendered.set(k, el);
  }
}
vp.addEventListener('scroll', () => {
  colHi.style.transform = `translateX(${-vp.scrollLeft}px)`; rowHi.style.transform = `translateY(${-vp.scrollTop}px)`;
  if (!tick) { tick = 1; requestAnimationFrame(() => { tick = 0; update(); }); }
});
addEventListener('resize', () => { win = ''; update(); });

function select(r, c) {
  sel = { r: Math.max(0, Math.min(ROWS - 1, r)), c: Math.max(0, Math.min(COLS - 1, c)) };
  const x = sel.c * CW, y = sel.r * RH;
  selBox.style.cssText = `left:${x}px;top:${y}px`; bandR.style.top = y + 'px'; bandC.style.left = x + 'px';
  [...colHi.children].forEach((d, i) => d.classList.toggle('on', i === sel.c));
  [...rowHi.children].forEach((d, i) => d.classList.toggle('on', i === sel.r));
  const id = sel.r * COLS + sel.c, v = eng.get(id);
  nb.value = refName(sel.r, sel.c); fb.value = eng.raw.get(id) || '';
  st.textContent = v instanceof XError ? `${v.code} – ${v.msg}` : 'Pronto';
  if (x < vp.scrollLeft) vp.scrollLeft = x; else if (x + CW > vp.scrollLeft + vp.clientWidth) vp.scrollLeft = x + CW - vp.clientWidth;
  if (y < vp.scrollTop) vp.scrollTop = y; else if (y + RH > vp.scrollTop + vp.clientHeight) vp.scrollTop = y + RH - vp.clientHeight;
  update();
}
const move = (dr, dc) => select(sel.r + dr, sel.c + dc);

function apply(r, c, s) { // scrive nel motore e ridisegna solo le celle ricalcolate
  eng.setCell(r, c, s).forEach(id => { const el = rendered.get(id); if (el) paint(el, (id / COLS) | 0, id % COLS); });
  clearTimeout(tm); tm = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify([...eng.raw])); } catch (e) { } }, 300);
  select(sel.r, sel.c);
}
function startEdit(init) {
  editing = true;
  ed.style.cssText = `display:block;left:${sel.c * CW}px;top:${sel.r * RH}px;width:220px`;
  ed.value = init ?? (eng.raw.get(sel.r * COLS + sel.c) || ''); ed.focus();
  ed.setSelectionRange(ed.value.length, ed.value.length); fb.value = ed.value;
}
function endEdit(save, dr = 0, dc = 0) {
  if (!editing) return; editing = false; ed.style.display = 'none';
  if (save) apply(sel.r, sel.c, ed.value);
  move(dr, dc); vp.focus({ preventScroll: true });
}
// una sola cifra (0-9): scarta tutto il resto, anche con incolla
const onlyDigit = el => { el.value = el.value.replace(/\D/g, '').slice(0, 1); };
ed.addEventListener('input', () => { onlyDigit(ed); fb.value = ed.value; });
fb.addEventListener('input', () => onlyDigit(fb));
ed.addEventListener('blur', () => endEdit(true));
ed.addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); endEdit(true, e.shiftKey ? -1 : 1, 0); }
  else if (e.key === 'Tab') { e.preventDefault(); endEdit(true, 0, e.shiftKey ? -1 : 1); }
  else if (e.key === 'Escape') endEdit(false);
});
fb.addEventListener('keydown', e => {
  if (e.key === 'Enter') { apply(sel.r, sel.c, fb.value); vp.focus({ preventScroll: true }); }
  if (e.key === 'Escape') { select(sel.r, sel.c); vp.focus({ preventScroll: true }); }
});
vp.addEventListener('keydown', e => {
  const page = Math.max(1, Math.floor(vp.clientHeight / RH) - 1), k = e.key;
  const m = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1], PageUp: [-page, 0], PageDown: [page, 0] }[k];
  if (m) move(...m);
  else if (k === 'Tab') move(0, e.shiftKey ? -1 : 1);
  else if (k === 'Enter') move(e.shiftKey ? -1 : 1, 0);
  else if (k === 'Delete' || k === 'Backspace') apply(sel.r, sel.c, '');
  else if (k === 'F2') startEdit();
  else if (/^\d$/.test(k) && !e.ctrlKey && !e.metaKey && !e.altKey) { startEdit(k); }
  else return;
  e.preventDefault();
});
sizer.addEventListener('click', e => { // da cella cliccata -> indici
  const b = sizer.getBoundingClientRect(), c = Math.floor((e.clientX - b.left) / CW), r = Math.floor((e.clientY - b.top) / RH);
  if (editing) endEdit(true);
  const same = r === sel.r && c === sel.c;
  select(r, c); vp.focus({ preventScroll: true });
  if (same && e.pointerType === 'touch') startEdit(); // su mobile: secondo tocco = modifica
});
sizer.addEventListener('dblclick', () => startEdit());

$('btnClear').onclick = () => {
  if (!confirm('Cancellare tutte le celle?')) return;
  eng.load([]); rendered.forEach((el, k) => paint(el, (k / COLS) | 0, k % COLS));
  try { localStorage.removeItem(KEY); } catch (e) { } select(0, 0);
};
$('btnCsv').onclick = () => { // esporta i valori calcolati
  const ids = [...eng.raw.keys()]; if (!ids.length) return;
  const R = Math.max(...ids.map(i => (i / COLS) | 0)), C = Math.max(...ids.map(i => i % COLS)), rows = [];
  for (let r = 0; r <= R; r++) { const row = []; for (let c = 0; c <= C; c++) row.push('"' + fmt(eng.get(r * COLS + c)).replace(/"/g, '""') + '"'); rows.push(row.join(';')); }
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([rows.join('\n')], { type: 'text/csv' })); a.download = 'foglio.csv'; a.click();
};
// Installazione PWA
let dp; addEventListener('beforeinstallprompt', e => { e.preventDefault(); dp = e; $('btnInstall').classList.remove('d-none'); });
$('btnInstall').onclick = () => dp && dp.prompt();
const net = () => { $('net').textContent = navigator.onLine ? 'online' : 'offline'; };
addEventListener('online', net); addEventListener('offline', net); net();
// Service worker (percorso RELATIVO: necessario su GitHub Pages)
if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(console.error));

try { eng.load(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch (e) { }
select(0, 0); vp.focus({ preventScroll: true });
