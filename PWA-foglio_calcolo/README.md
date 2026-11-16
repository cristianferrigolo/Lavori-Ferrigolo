# Mini-Foglio di Calcolo (PWA)

**🔗 Sito pubblicato: `https://TUO-USERNAME.github.io/mini-sheet-pwa/`** ← _sostituire dopo il deploy_

Foglio di calcolo semplificato, installabile e utilizzabile offline: griglia 100×100 (A1:CV100), formule in italiano, HTML + CSS + JavaScript vanilla (Bootstrap 5 solo per la barra degli strumenti).

## Avvio in locale
```bash
cd mini-sheet-pwa
python -m http.server 8000     # poi aprire http://localhost:8000
```
(non funziona da `file://`: il service worker richiede un server)

## Deploy (GitHub Pages)
1. `git init && git add . && git commit -m "Prima versione" && git branch -M main`
2. `git remote add origin https://github.com/TUO-USERNAME/mini-sheet-pwa.git && git push -u origin main`
3. Repository → Settings → Pages → _Deploy from a branch_ → `main` / `/ (root)` → Save.
4. Dopo 1–2 minuti aprire l'URL **in una finestra anonima**, verificare in DevTools → Application che il service worker sia "activated", installare l'app e provare Network → Offline.

Tutti i percorsi sono relativi (`./js/app.js`, `./sw.js`, `start_url: "./"`, `scope: "./"`). Dopo ogni modifica ai file cambiare `VERSION` in `sw.js`.

## Funzioni implementate
`SOMMA`, `MEDIA`, `CONTA`, `CONTA.VALORI`, `SOMMA.SE`, `CONTA.SE`, `MEDIA.SE`, `MAX`, `MIN`; operatori `+ - * /`, parentesi, meno unario, riferimenti `A1` e intervalli `A1:B5`. Errori: `#DIV/0!`, `#VALORE!`, `#RIF!`, `#NOME?`, `#CIRC!` (riferimento circolare). Extra: `SE` con confronti (`> < >= <= = <>`), alias inglesi (SUM, IF…), salvataggio in localStorage, esportazione CSV, pulsante Installa.

## Strategia di virtualizzazione
Un contenitore (`#sizer`) ha le dimensioni dell'intera griglia (100×90 px × 100×26 px) così le barre di scorrimento sono quelle vere. Nel DOM vengono create **solo le celle visibili** (circa 600) più 3 righe/colonne di margine, posizionate in modo assoluto; allo scroll si rimuovono quelle uscite e si creano le nuove (aggiornamento in `requestAnimationFrame`). Le intestazioni (200 elementi) sono fisse e traslate con `transform` durante lo scroll. Alternativa scartata: `content-visibility: auto` (lascia comunque 10.000 nodi nel DOM).

## Gestione delle dipendenze
Ogni formula registra le celle da cui dipende (`pre`) e ogni cella conosce chi dipende da lei (`dep`). Modificando una cella si visitano solo i suoi dipendenti transitivi e solo quelli vengono ricalcolati (i valori sono in cache). I cicli si rilevano con l'insieme delle celle in valutazione.

**Scelta di progetto:** una cella che compare nel proprio intervallo (es. `E1 = SOMMA(A1:CV100)`) ignora se stessa, così il caso di test 5 dà 0 invece di un errore circolare. I riferimenti diretti (`C1 = =C1`) o le catene (`A1→B1→A1`) restano `#CIRC!`.

## Casi di test
Eseguiti con Node sul motore (`engine.js`):

| # | Test | Esito |
|---|------|-------|
| 1 | A1=5, A2=10, A3=SOMMA(A1:A2) → 15 | ✅ |
| 2 | B2 = A1/B1 con B1=0 → #DIV/0! | ✅ |
| 3 | C1 = =C1 → errore circolare (anche catena F1↔G1) | ✅ |
| 4 | CONTA.SE / SOMMA.SE / MEDIA.SE con valori misti | ✅ |
| 5 | SOMMA(A1:CV100) su griglia vuota → 0 | ✅ |
| 7 | 100 dipendenti: ricalcolo ≈ 1 ms (limite 300 ms) | ✅ (solo motore) |

**Da verificare nel browser (non ancora eseguiti, compilare dopo la prova):**
- [ ] 6 Scorrimento riga 1→100 e ritorno senza lag
- [ ] 7 Aggiornamento entro 300 ms nell'interfaccia
- [ ] 8 Rete disattivata → ricarica e funziona offline
- [ ] 9 URL pubblico in anonima: funziona, installabile, offline
- [ ] 10 Nessun 404 in console sull'URL pubblico
- [ ] Lighthouse: PWA installabile

## Difficoltà incontrate e come risolte
_Da scrivere con le vostre parole dopo il deploy._

## Domande di riflessione
_Rispondere con le vostre parole (1. cosa scritto da voi / dall'AI e come verificato · 2. prompt più efficaci · 3. cosa avete corretto · 4. virtualizzazione scelta e alternative · 5. gestione dipendenze · 6. piattaforma e problemi di deploy · 7. verifica da URL pubblico · 8. cosa cambiereste)._
