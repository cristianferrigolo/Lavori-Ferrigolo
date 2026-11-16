# Mini-Foglio di Calcolo (PWA)

## 🔗 Sito pubblicato: `https://TUO-USERNAME.github.io/mini-sheet-pwa/`
_(sostituire con l'URL reale dopo il deploy; eventuale secondo URL Vercel: `https://mini-sheet-pwa.vercel.app`)_

Foglio di calcolo semplificato, installabile e utilizzabile offline. Griglia **100×100 (A1:CV100 = 10.000 celle)**, formule in italiano, motore di calcolo scritto da zero (nessuna libreria di spreadsheet). Stack: HTML + CSS + JavaScript vanilla (moduli ES); Bootstrap 5 solo per la barra degli strumenti responsive. Nessun dato viene inviato a server esterni (Bootstrap è solo scaricato da CDN e messo in cache).

## Avvio in locale
```bash
cd mini-sheet-pwa
python -m http.server 8000      # poi aprire http://localhost:8000
```
Non si apre da `file://`: il service worker richiede un server.

## Deploy
**Piattaforma scelta: GitHub Pages** (Vercel in alternativa, vedi sotto).
1. `git init && git add . && git commit -m "Prima versione" && git branch -M main`
2. `git remote add origin https://github.com/TUO-USERNAME/mini-sheet-pwa.git && git push -u origin main`
3. Repository → Settings → Pages → _Deploy from a branch_ → `main` / `/ (root)` → Save (URL dopo 1–2 minuti).
4. Aprire l'URL **in finestra anonima**. DevTools → Application: service worker "activated and running", manifest senza errori. Installare la PWA e provare Network → Offline → ricarica.

Percorsi sempre relativi (`./js/app.js`, `./sw.js`, `start_url: "./"`, `scope: "./"`), perché GitHub Pages serve da un sottopercorso. Dopo ogni modifica ai file cambiare `VERSION` in `sw.js` e fare hard-reload.
**Vercel (opzionale, bonus):** Add New → Project → repository → Framework Preset "Other", build command e install command vuoti, output directory `.` → Deploy.

## Funzioni implementate
- **Griglia:** 100×100 editabile, intestazioni A…Z, AA…CV e 1…100, barra della formula (contenuto grezzo), casella nome cella, evidenziazione di cella, riga e colonna correnti.
- **Tastiera:** frecce, Tab / Maiusc+Tab, Invio (conferma e scende), Esc (annulla), PagSu/PagGiù, F2 o doppio clic per modificare, Canc per svuotare. Su mobile: secondo tocco sulla cella per modificare, scorrimento orizzontale e verticale.
- **Contenuto delle celle:** numeri (`42`, `3.14`), testo, formule che iniziano con `=`.
- **Funzioni:** `SOMMA`, `MEDIA`, `CONTA`, `CONTA.VALORI`, `SOMMA.SE`, `CONTA.SE`, `MEDIA.SE`, `MAX`, `MIN` (condizioni `">5"`, `"<=3"`, `"<>0"`, `"testo"`, numero).
- **Operatori:** `+ - * /`, parentesi, meno unario; riferimenti `A1` e intervalli `A1:B5` (anche su più colonne). Separatore degli argomenti `;` (anche `,`), decimali con il punto nelle formule.
- **Errori:** `#DIV/0!`, `#VALORE!`, `#RIF!`, `#NOME?`, `#CIRC!` (riferimento circolare, diretto o a catena). Passando sulla cella compare la spiegazione e la barra di stato la riporta.
- **Ricalcolo automatico** incrementale con grafo delle dipendenze.
- **PWA:** manifest (nome, icone 192/512 + maskable, `theme_color`, `display: standalone`), service worker con cache, installabile, offline, responsive.

### Funzionalità extra (bonus)
`SE` (con confronti `> < >= <= = <>`), `CONCAT`, `ARROTONDA`, alias inglesi (SUM, IF, COUNTIF…); **inserimento/eliminazione di righe e colonne** con adeguamento delle formule (+Riga, −Riga, +Col, −Col); salvataggio automatico in `localStorage`; esportazione CSV; pulsante "Installa"; indicatore online/offline.

## Strategia di virtualizzazione
Un contenitore (`#sizer`) ha la dimensione dell'intera griglia (100×90 px per 100×26 px), così le barre di scorrimento sono quelle reali. Nel DOM esistono **solo le celle visibili** più 3 righe/colonne di margine (≈ 500 elementi invece di 10.000), posizionate in modo assoluto. Allo scroll, in un `requestAnimationFrame`, si rimuovono quelle uscite e si creano quelle entrate. Le 200 intestazioni sono fisse e traslate con `transform`. Selezione, riga/colonna corrente ed editor sono tre soli elementi sovrapposti. Alternativa valutata: `content-visibility: auto`, scartata perché mantiene comunque 10.000 nodi nel DOM.

## Dipendenze tra celle
Ogni formula memorizza le celle da cui dipende (`pre`) e ogni cella conosce chi dipende da lei (`dep`). Cambiando una cella si visitano solo i dipendenti transitivi e solo quelli vengono ricalcolati (gli altri valori restano in cache); si ridisegnano solo le celle visibili coinvolte. I cicli si rilevano con l'insieme delle celle in valutazione.
**Scelta di progetto:** una cella che compare nel proprio intervallo (es. `E1 = SOMMA(A1:CV100)`) ignora se stessa, così il caso di test 5 dà 0. I riferimenti diretti (`C1 = =C1`) e le catene (`A1→B1→A1`) restano `#CIRC!`.

## Casi di test e risultati
Eseguiti in Chromium headless (Playwright) servendo l'app da un **sottopercorso** (`http://localhost/mini-sheet-pwa/`) per riprodurre GitHub Pages.

| # | Test | Esito |
|---|------|-------|
| 1 | A1=5, A2=10, A3=`=SOMMA(A1:A2)` → 15 | ✅ 15 |
| 2 | B1=0, B2=`=A1/B1` → #DIV/0! | ✅ |
| 3 | C1=`=C1` → errore circolare | ✅ #CIRC! (anche catena F1↔G1) |
| 4 | `=CONTA.SE(A1:A10;">5")` con valori misti | ✅ 3 (SOMMA.SE 27, MEDIA.SE 9) |
| 5 | `=SOMMA(A1:CV100)` su griglia vuota → 0 | ✅ 0, nessun crash |
| 6 | Scorrimento riga 1→100→1 e fino a colonna CV | ✅ frame massimo 19,5 ms, media 16,6 ms (≈ 60 fps) su Chromium headless |
| 7 | Cella con 100 dipendenti | ✅ aggiornamento in ≈ 3 ms (limite 300 ms) |
| 8 | Rete disattivata → ricarica e funziona | ✅ (service worker attivo) |
| 10 | Nessun 404 sul sottopercorso | ✅ |
| – | Installabilità secondo Chrome (`Page.getInstallabilityErrors`) | ✅ nessun errore |
| – | Navigazione da tastiera, barra formula, +/− riga | ✅ |

**Ancora da fare a mano (dipendono dall'URL pubblico e dal dispositivo reale):**
- [ ] 9 URL pubblico in finestra anonima: app funzionante, installabile, offline
- [ ] 10 ripetere il controllo 404 in console sull'URL pubblico
- [ ] Lighthouse (DevTools → Lighthouse → Progressive Web App)
- [ ] 6 provare lo scorrimento su telefono/tablet reale

## Difficoltà incontrate e come risolte
_Da completare con la vostra esperienza di deploy._ Spunti reali emersi nel lavoro:
- **Tasti dell'editor:** l'editor sta dentro il contenitore della griglia, quindi ogni tasto risaliva al gestore della griglia e riavviava la modifica (si scriveva un carattere alla volta). Risolto ignorando gli eventi con `e.target === ed`. Scoperto con i test automatici.
- **`SOMMA(A1:CV100)` contiene la cella stessa:** vedi "Dipendenze".
- **Percorsi e scope** per GitHub Pages: tutto relativo.
- **Cache del service worker:** cambiare `VERSION` e fare hard-reload.

## Domande di riflessione (da rispondere con le vostre parole)
1. **Codice scritto da voi / dall'AI e verifica:** _…_ (suggerimento: elencate cosa avete scritto o modificato voi e come lo avete testato: casi della tabella, console, DevTools)
2. **Prompt più efficaci e perché:** _…_
3. **Cosa ha sbagliato l'AI e avete corretto:** _…_
4. **Virtualizzazione scelta e alternative:** vedi sezione dedicata (finestra di celle visibili; alternativa `content-visibility`).
5. **Dipendenze senza ricalcoli inutili:** vedi sezione dedicata (grafo `pre`/`dep`, ricalcolo dei soli dipendenti, cache dei valori).
6. **Piattaforma di deploy e problemi:** _…_
7. **Verifica dall'URL pubblico:** _…_ (finestra anonima, Application → Service Workers/Manifest, Network → Offline, installazione)
8. **Cosa cambiereste:** _…_

## Scaletta per la demo (5–7 min)
1. Formula di ogni tipo: SOMMA, MEDIA, CONTA, CONTA.VALORI, SOMMA.SE, CONTA.SE, MEDIA.SE, MAX/MIN, operatori e parentesi.
2. Un errore (`#DIV/0!`) e un riferimento circolare (`C1 = =C1`).
3. Scorrimento fluido fino alla riga 100 e alla colonna CV (PagGiù, frecce, trascinamento).
4. Apertura dell'URL pubblico in anonima e installazione della PWA da lì.
5. Rete disattivata (DevTools → Network → Offline) sull'URL pubblico: ricarica e uso.
