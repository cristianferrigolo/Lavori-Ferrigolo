# AI_LOG – uso dell'AI

> Deve riportare ciò che avete **davvero** fatto. Le voci 1–3 corrispondono a richieste realmente fatte a Claude in questo lavoro (verificate e adattate dove indicato). Le voci 4–5 vanno completate con la vostra esperienza: serve almeno un prompt sul deploy.

## 1 – Generazione del progetto
- **Prompt:** generare l'intera "Mini-Foglio PWA" seguendo il testo della prova.
- **Risposta (sintesi):** struttura dei file, `coordinates.js`, tokenizer + parser a discesa ricorsiva, grafo di dipendenze, griglia virtualizzata, manifest, service worker, icone, README.
- **Cosa abbiamo modificato/adattato:** _compilare_ (es. URL, nome utente, prove nel browser)

## 2 – Modifica: una sola cifra per cella
- **Prompt:** limitare l'input di una cella a una sola cifra.
- **Risposta (sintesi):** `maxlength="1"`, filtro `\D` sugli input, avvio modifica solo con tasti numerici; avvertito che così non si possono più scrivere formule.
- **Cosa abbiamo fatto:** _applicata / non applicata nella versione finale (la prova richiede formule)_

## 3 – Rifare tutto seguendo il PDF punto per punto
- **Prompt:** rifare la mini sheet seguendo tutte le istruzioni, senza tralasciare nulla.
- **Risposta (sintesi):** aggiunti inserimento/eliminazione righe e colonne (con adeguamento delle formule), `CONCAT`, `ARROTONDA`; test automatici nel browser (funzioni, tastiera, scorrimento, offline, percorsi) che hanno rivelato e fatto correggere un bug (i tasti dell'editor risalivano al gestore della griglia).
- **Cosa abbiamo verificato/modificato noi:** _compilare_

## 4 – _Spiegazione_ (consigliato): "Spiegami passo passo come funziona il parser in `engine.js`"
- **Risposta (sintesi):** _…_ · **Cosa abbiamo capito/modificato:** _…_

## 5 – DEPLOY (obbligatorio): _es. "Su GitHub Pages ricevo 404 su sw.js / il service worker non si attiva: perché?"_
- **Errore reale incollato:** _…_ · **Risposta (sintesi):** _…_ · **Cosa abbiamo cambiato:** _…_
