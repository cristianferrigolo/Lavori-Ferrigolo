// Variabile globale per i mezzi selezionati
      let selezionati = [];

      function onClickHandler(checkbox) {
        let valore = checkbox.value;

        if (checkbox.checked) {
          selezionati.push(valore);
        } else {
          selezionati = selezionati.filter((item) => item !== valore);
        }

        document.getElementById("rispMezzi").innerHTML =
          selezionati.length > 0
            ? "Hai selezionato: " + selezionati.join(", ")
            : "Nessun mezzo selezionato.";
      }

      function myFunction() {
        event.preventDefault(); // Evita il refresh della pagina

        let nome = document.getElementById("nome").value;
        let cognome = document.getElementById("cognome").value;
        let indirizzo = document.getElementById("indirizzo").value;
        let cap = parseInt(document.getElementById("cap").value);
        let citta = document.getElementById("citta").value;

        // ottiene l'anno dalla data di nascita
        let dataNascita = document.getElementById("dataNascita").value;
        let annoNascita = new Date(dataNascita).getFullYear();

        let sesso =
          document.querySelector('input[name="sesso"]:checked')?.value ||
          "Non specificato";
        let provincia = document.getElementById("provincia").value;

        // MATERIE (max 3)
        let materieSelect = document.getElementById("materie");
        let materieSelezionate = [];
        for (let i = 0; i < materieSelect.options.length; i++) {
          if (materieSelect.options[i].selected) {
            materieSelezionate.push(materieSelect.options[i].text);
          }
        }

        if (materieSelezionate.length > 3) {
          alert("Puoi selezionare al massimo 3 materie!");
          return;
        }

        // Calcolo generazione
        let descrizione = "";
        switch (true) {
          case annoNascita >= 1901 && annoNascita <= 1927:
            descrizione = "fa parte della Greatest Generation";
            break;
          case annoNascita >= 1928 && annoNascita <= 1945:
            descrizione = "fa parte della Generazione Silenziosa";
            break;
          case annoNascita >= 1946 && annoNascita <= 1964:
            descrizione = "fa parte dei Baby Boomers";
            break;
          case annoNascita >= 1965 && annoNascita <= 1980:
            descrizione = "fa parte della Generazione X";
            break;
          case annoNascita >= 1981 && annoNascita <= 1996:
            descrizione = "fa parte dei Millennials";
            break;
          case annoNascita >= 1997 && annoNascita <= 2012:
            descrizione = "fa parte della Generazione Z";
            break;
          case annoNascita >= 2013:
            descrizione = "fa parte della Generazione Alpha";
            break;
          default:
            descrizione = "ha inserito un anno di nascita non valido.";
        }

        // Stampa riepilogo sotto il form (versione riscritta)
        document.getElementById("risp").innerHTML = `
            <h2>Dati Inseriti</h2>
            <p><strong>Nome:</strong> ${nome}</p>
            <p><strong>Cognome:</strong> ${cognome}</p>
            <p><strong>Indirizzo:</strong> ${indirizzo}</p>
            <p><strong>Città:</strong> ${citta} (${provincia})</p>
            <p><strong>CAP:</strong> ${cap}</p>
            <p><strong>Data di nascita:</strong> ${dataNascita} → ${descrizione}</p>
            <p><strong>Sesso:</strong> ${sesso}</p>
            <p><strong>Mezzi posseduti:</strong> ${
              selezionati.length > 0 ? selezionati.join(", ") : "Nessuno"
            }</p>
            <p><strong>Materie preferite:</strong> ${
              materieSelezionate.length > 0 ? materieSelezionate.join(", ") : "Nessuna"
            }</p>
        `;
      }