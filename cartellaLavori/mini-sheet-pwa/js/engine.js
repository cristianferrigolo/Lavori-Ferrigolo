// Motore di calcolo: tokenizer -> parser (discesa ricorsiva) -> valutazione + grafo dipendenze
import { ROWS, COLS, parseRef, colName, colIndex } from './coordinates.js';

export class XError { constructor(code, msg) { this.code = code; this.msg = msg; } }
const E = {
  div: new XError('#DIV/0!', 'Divisione per zero'),
  val: new XError('#VALORE!', 'Valore o sintassi non validi'),
  ref: new XError('#RIF!', 'Riferimento fuori dalla griglia'),
  name: new XError('#NOME?', 'Nome o funzione sconosciuti'),
  circ: new XError('#CIRC!', 'Riferimento circolare'),
};
const ALIAS = { SUM: 'SOMMA', AVERAGE: 'MEDIA', COUNT: 'CONTA', COUNTA: 'CONTA.VALORI',
  SUMIF: 'SOMMA.SE', COUNTIF: 'CONTA.SE', AVERAGEIF: 'MEDIA.SE', IF: 'SE' };
const REF = /^[A-Z]{1,3}\d+$/;

// ---- 1) TOKENIZER: testo -> lista di token {k:tipo, v:valore}
function tokenize(s) {
  const t = []; let i = 0;
  while (i < s.length) {
    const ch = s[i]; let m;
    if (/\s/.test(ch)) { i++; continue; }
    const rest = s.slice(i);
    if ((m = /^(\d+\.?\d*|\.\d+)/.exec(rest))) { t.push({ k: 'n', v: +m[1] }); i += m[1].length; }
    else if (ch === '"') { // stringa, "" = virgolette letterali
      let j = i + 1, v = '';
      while (j < s.length && (s[j] !== '"' || s[j + 1] === '"')) { if (s[j] === '"') { v += '"'; j += 2; } else v += s[j++]; }
      if (j >= s.length) throw 0;
      t.push({ k: 's', v }); i = j + 1;
    }
    else if ((m = /^[A-Za-z_][A-Za-z0-9_.]*/.exec(rest))) { t.push({ k: 'id', v: m[0].toUpperCase() }); i += m[0].length; }
    else if ((m = /^(<=|>=|<>|[-+*\/()<>=;,:])/.exec(rest))) { t.push({ k: 'op', v: m[1] }); i += m[1].length; }
    else throw 0;
  }
  return t;
}

// ---- 2) PARSER: precedenza  confronti < + - < * / < meno unario < primari
function parse(src) {
  const t = tokenize(src); let p = 0;
  const isOp = v => t[p] && t[p].k === 'op' && t[p].v === v;
  const ref = id => { const x = parseRef(id); return x && x.r >= 0 && x.r < ROWS && x.c < COLS ? x : null; };
  function cmp() { let l = add(); while (t[p] && t[p].k === 'op' && ['=', '<>', '<', '>', '<=', '>='].includes(t[p].v)) { const op = t[p++].v; l = { t: 'bin', op, l, r: add() }; } return l; }
  function add() { let l = mul(); while (isOp('+') || isOp('-')) { const op = t[p++].v; l = { t: 'bin', op, l, r: mul() }; } return l; }
  function mul() { let l = un(); while (isOp('*') || isOp('/')) { const op = t[p++].v; l = { t: 'bin', op, l, r: un() }; } return l; }
  function un() { if (isOp('-')) { p++; return { t: 'neg', e: un() }; } if (isOp('+')) { p++; return un(); } return prim(); }
  function prim() {
    const k = t[p++]; if (!k) throw 0;
    if (k.k === 'n' || k.k === 's') return { t: 'v', v: k.v };
    if (k.k === 'op' && k.v === '(') { const e = cmp(); if (!isOp(')')) throw 0; p++; return e; }
    if (k.k !== 'id') throw 0;
    if (isOp('(')) { // chiamata di funzione
      p++; const a = [];
      if (!isOp(')')) { a.push(cmp()); while (isOp(';') || isOp(',')) { p++; a.push(cmp()); } }
      if (!isOp(')')) throw 0; p++;
      return { t: 'fn', n: k.v, a };
    }
    if (REF.test(k.v)) {
      const a = ref(k.v);
      if (isOp(':')) { // intervallo A1:B5
        p++; const k2 = t[p++]; if (!k2 || k2.k !== 'id' || !REF.test(k2.v)) throw 0;
        const b = ref(k2.v); if (!a || !b) return { t: 'err', e: E.ref };
        return { t: 'rng', r1: Math.min(a.r, b.r), r2: Math.max(a.r, b.r), c1: Math.min(a.c, b.c), c2: Math.max(a.c, b.c) };
      }
      return a ? { t: 'ref', r: a.r, c: a.c } : { t: 'err', e: E.ref };
    }
    return { t: 'err', e: E.name };
  }
  const ast = cmp(); if (p < t.length) throw 0; return ast;
}

// ---- helper di conversione/confronto
const num = v => v === null ? 0 : typeof v === 'boolean' ? +v : typeof v === 'number' ? v
  : (v.trim() !== '' && !isNaN(+v)) ? +v : E.val;
function cmpv(a, b) {
  if (a === null) a = typeof b === 'string' ? '' : 0;
  if (b === null) b = typeof a === 'string' ? '' : 0;
  const rk = { number: 0, string: 1, boolean: 2 };
  if (typeof a !== typeof b) return rk[typeof a] - rk[typeof b];
  if (typeof a === 'string') { a = a.toLowerCase(); b = b.toLowerCase(); }
  return a < b ? -1 : a > b ? 1 : 0;
}
// Criterio di SOMMA.SE ecc.: ">5", "<=3", "<>0", "testo", 7
function matcher(cr) {
  if (typeof cr === 'number') return v => typeof v === 'number' && v === cr;
  if (typeof cr !== 'string') return () => false;
  const m = /^(>=|<=|<>|>|<|=)?([\s\S]*)$/.exec(cr), op = m[1] || '=', o = m[2];
  const x = o.trim() !== '' && !isNaN(+o) ? +o : null, s = o.toLowerCase();
  return v => {
    if (x !== null) { if (typeof v !== 'number') return op === '<>'; return { '=': v === x, '<>': v !== x, '<': v < x, '>': v > x, '<=': v <= x, '>=': v >= x }[op]; }
    if (op === '=' || op === '<>') { const eq = (typeof v === 'string' && v.toLowerCase() === s) || (v === null && s === ''); return op === '=' ? eq : !eq; }
    if (typeof v !== 'string') return false;
    const w = v.toLowerCase(); return op === '>' ? w > s : op === '<' ? w < s : op === '>=' ? w >= s : w <= s;
  };
}
export function fmt(v) {
  if (v === null || v === undefined) return '';
  if (v instanceof XError) return v.code;
  if (typeof v === 'boolean') return v ? 'VERO' : 'FALSO';
  if (typeof v === 'number') return String(+v.toPrecision(12));
  return v;
}

// Adegua i riferimenti di una formula quando si inserisce/elimina una riga ('r') o colonna ('c') all'indice idx.
// Riferimento a una riga eliminata -> Z9999 (fuori griglia => #RIF!). Gli intervalli si allargano/restringono.
function shiftFormula(f, axis, idx, del) {
  const P = (c, r) => ({ r: +r - 1, c: colIndex(c.toUpperCase()) });
  const str = a => colName(a.c) + (a.r + 1);
  const mv = v => del ? (v > idx ? v - 1 : v) : (v >= idx ? v + 1 : v);
  return f.replace(/("(?:[^"]|"")*")|(?<![A-Za-z0-9_.])([A-Za-z]{1,3})(\d+)(?::([A-Za-z]{1,3})(\d+))?(?![A-Za-z0-9_(])/g, (m, s, c1, r1, c2, r2) => {
    if (s) return s; // le stringhe non si toccano
    const a = P(c1, r1);
    if (!c2) { if (del && a[axis] === idx) return 'Z9999'; const x = { ...a }; x[axis] = mv(a[axis]); return str(x); }
    const b = P(c2, r2), lo = Math.min(a[axis], b[axis]), hi = Math.max(a[axis], b[axis]);
    if (del && lo === idx && hi === idx) return 'Z9999';
    const nlo = del ? (lo > idx ? lo - 1 : lo) : (lo >= idx ? lo + 1 : lo);
    const nhi = hi >= idx ? hi + (del ? -1 : 1) : hi;
    const x = { ...a }, y = { ...b };
    if (a[axis] <= b[axis]) { x[axis] = nlo; y[axis] = nhi; } else { x[axis] = nhi; y[axis] = nlo; }
    return str(x) + ':' + str(y);
  });
}

export class Engine {
  constructor() { this.raw = new Map(); this.ast = new Map(); this.val = new Map(); this.dep = new Map(); this.pre = new Map(); this.vis = new Set(); }
  id(r, c) { return r * COLS + c; }

  // Valore di una cella (con cache). this.vis = celle in valutazione -> rileva i cicli.
  get(id) {
    if (this.val.has(id)) return this.val.get(id);
    const a = this.ast.get(id); if (!a) return null;
    if (this.vis.has(id)) return E.circ;
    this.vis.add(id);
    let v; try { v = a.err ? a.err : this.ev(a.n, id); } catch (e) { v = E.val; }
    this.vis.delete(id);
    if (v === null) v = 0; if (v && v.t === 'rng') v = E.val;
    this.val.set(id, v); return v;
  }
  // Memorizza il contenuto grezzo, aggiorna AST e grafo delle dipendenze
  put(id, s) {
    const pre = this.pre.get(id);
    if (pre) { pre.forEach(p => this.dep.get(p)?.delete(id)); this.pre.delete(id); }
    this.raw.delete(id); this.ast.delete(id); this.val.delete(id);
    if (s === '') return;
    this.raw.set(id, s);
    if (s[0] !== '=') { const x = s.replace(',', '.'); this.val.set(id, /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(x) ? +x : s); return; }
    try {
      const n = parse(s.slice(1)), set = new Set(); this.refs(n, set, id);
      this.ast.set(id, { n });
      set.forEach(p => { if (!this.dep.has(p)) this.dep.set(p, new Set()); this.dep.get(p).add(id); });
      this.pre.set(id, set);
    } catch (e) { this.ast.set(id, { err: E.val }); }
  }
  refs(n, set, self) { // precedenti di una formula (le celle da cui dipende)
    if (n.t === 'ref') set.add(n.r * COLS + n.c);
    else if (n.t === 'rng') { for (let r = n.r1; r <= n.r2; r++) for (let c = n.c1; c <= n.c2; c++) if (r * COLS + c !== self) set.add(r * COLS + c); }
    else if (n.t === 'bin') { this.refs(n.l, set, self); this.refs(n.r, set, self); }
    else if (n.t === 'neg') this.refs(n.e, set, self);
    else if (n.t === 'fn') n.a.forEach(x => this.refs(x, set, self));
  }
  // Ricalcolo incrementale: solo la cella e i suoi dipendenti (transitivi)
  setCell(r, c, s) { const id = this.id(r, c); this.put(id, s); return this.recalc([id]); }
  recalc(ids) {
    const seen = new Set(ids), q = [...ids];
    while (q.length) { const x = q.pop(); this.dep.get(x)?.forEach(d => { if (!seen.has(d)) { seen.add(d); q.push(d); } }); }
    seen.forEach(x => { if (this.ast.has(x)) this.val.delete(x); });
    seen.forEach(x => this.get(x));
    return [...seen];
  }
  load(entries) { // entries: [[id, raw], ...]
    [this.raw, this.ast, this.val, this.dep, this.pre].forEach(m => m.clear());
    entries.forEach(([id, s]) => this.put(id, s));
    [...this.ast.keys()].forEach(id => this.get(id));
  }

  // Inserisce (del=false) o elimina (del=true) la riga/colonna idx: sposta le celle e adegua le formule
  shift(axis, idx, del) {
    const lim = axis === 'r' ? ROWS : COLS, out = [];
    for (const [id, s] of this.raw) {
      const r = (id / COLS) | 0, c = id % COLS, v = axis === 'r' ? r : c;
      if (del && v === idx) continue;
      const nv = del ? (v > idx ? v - 1 : v) : (v >= idx ? v + 1 : v);
      if (nv >= lim) continue; // spinta fuori dalla griglia
      out.push([axis === 'r' ? nv * COLS + c : r * COLS + nv, s[0] === '=' ? shiftFormula(s, axis, idx, del) : s]);
    }
    this.load(out);
  }

  // ---- 3) VALUTAZIONE dell'AST
  ev(n, self) {
    switch (n.t) {
      case 'v': return n.v;
      case 'err': return n.e;
      case 'ref': return this.get(n.r * COLS + n.c);
      case 'rng': return E.val;
      case 'neg': { const x = num(this.ev(n.e, self)); return x instanceof XError ? x : -x; }
      case 'bin': {
        const a = this.ev(n.l, self), b = this.ev(n.r, self);
        if (a instanceof XError) return a; if (b instanceof XError) return b;
        if (['+', '-', '*', '/'].includes(n.op)) {
          const x = num(a), y = num(b); if (x instanceof XError) return x; if (y instanceof XError) return y;
          if (n.op === '/') return y === 0 ? E.div : x / y;
          return n.op === '+' ? x + y : n.op === '-' ? x - y : x * y;
        }
        const d = cmpv(a, b);
        return { '=': d === 0, '<>': d !== 0, '<': d < 0, '>': d > 0, '<=': d <= 0, '>=': d >= 0 }[n.op];
      }
      case 'fn': return this.fn(n, self);
    }
  }
  fn(n, self) {
    const name = ALIAS[n.n] || n.n, a = n.a;
    if (name === 'SE') { // valutazione "pigra": solo il ramo scelto
      if (a.length < 2 || a.length > 3) return E.val;
      const c = this.ev(a[0], self); if (c instanceof XError) return c; if (typeof c === 'string') return E.val;
      return c ? this.ev(a[1], self) : (a[2] ? this.ev(a[2], self) : false);
    }
    if (['SOMMA.SE', 'CONTA.SE', 'MEDIA.SE'].includes(name)) {
      if (a.length < 2 || a.length > 3 || (name === 'CONTA.SE' && a.length !== 2) || (a[0].t !== 'rng' && a[0].t !== 'ref')) return E.val;
      const R = a[0].t === 'rng' ? a[0] : { r1: a[0].r, r2: a[0].r, c1: a[0].c, c2: a[0].c };
      const cr = this.ev(a[1], self); if (cr instanceof XError) return cr;
      const ok = matcher(cr);
      const S = a[2] ? (a[2].t === 'rng' ? a[2] : a[2].t === 'ref' ? { r1: a[2].r, c1: a[2].c } : null) : R;
      if (!S) return E.val;
      let sum = 0, cnt = 0, nc = 0;
      for (let i = 0; i <= R.r2 - R.r1; i++) for (let j = 0; j <= R.c2 - R.c1; j++) {
        const id = (R.r1 + i) * COLS + R.c1 + j, v = id === self ? null : this.get(id);
        if (v instanceof XError) return v; if (!ok(v)) continue;
        cnt++; const r = S.r1 + i, c = S.c1 + j;
        if (r < ROWS && c < COLS) { const id2 = r * COLS + c, sv = id2 === self ? null : this.get(id2); if (sv instanceof XError) return sv; if (typeof sv === 'number') { sum += sv; nc++; } }
      }
      return name === 'CONTA.SE' ? cnt : name === 'SOMMA.SE' ? sum : (nc ? sum / nc : E.div);
    }
    if (name === 'ARROTONDA') { // ARROTONDA(numero; cifre): mezzi verso l'alto (in valore assoluto)
      if (a.length < 1 || a.length > 2) return E.val;
      const x = num(this.ev(a[0], self)), d = a[1] ? num(this.ev(a[1], self)) : 0;
      if (x instanceof XError) return x; if (d instanceof XError) return d;
      const f = 10 ** Math.trunc(d); return Math.sign(x) * Math.round(+(Math.abs(x) * f).toPrecision(15)) / f;
    }
    if (!['SOMMA', 'MEDIA', 'CONTA', 'CONTA.VALORI', 'MAX', 'MIN', 'CONCAT'].includes(name)) return E.name;
    // Funzioni aggregate: raccolgo i valori; la cella stessa dentro un intervallo viene saltata
    const items = [];
    for (const x of a) {
      if (x.t === 'rng') { for (let r = x.r1; r <= x.r2; r++) for (let c = x.c1; c <= x.c2; c++) { const id = r * COLS + c; items.push({ v: id === self ? null : this.get(id), cell: 1 }); } }
      else if (x.t === 'ref') items.push({ v: this.get(x.r * COLS + x.c), cell: 1 });
      else items.push({ v: this.ev(x, self), cell: 0 });
    }
    for (const it of items) if (it.v instanceof XError) return it.v;
    if (name === 'CONCAT') return items.filter(i => i.v !== null).map(i => fmt(i.v)).join('');
    if (name === 'CONTA.VALORI') return items.filter(i => i.v !== null && i.v !== '').length;
    const nums = [];
    for (const it of items) { // dalle celle contano solo i numeri; i valori diretti vengono convertiti
      if (typeof it.v === 'number') nums.push(it.v);
      else if (!it.cell && it.v !== null) { const x = num(it.v); if (x instanceof XError) return x; nums.push(x); }
    }
    if (name === 'CONTA') return nums.length;
    const sum = nums.reduce((s, x) => s + x, 0);
    if (name === 'SOMMA') return sum;
    if (name === 'MEDIA') return nums.length ? sum / nums.length : E.div;
    if (!nums.length) return 0;
    return nums.reduce((m, x) => name === 'MAX' ? Math.max(m, x) : Math.min(m, x));
  }
}
