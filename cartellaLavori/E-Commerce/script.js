let carrello = [];

// LETTURA CSV
document.getElementById('fileInput').addEventListener('change', function (e) {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = function (event) {
        const text = event.target.result;
        const righe = text.split('\n').slice(1);

        const container = document.getElementById('prodotti');
        container.innerHTML = '';

        righe.forEach(riga => {
            const colonne = riga.split(',');

            if (colonne.length < 4) return;

            const categoria = colonne[0].trim();
            const titolo = colonne[1].trim();
            const dettaglio = colonne[2].trim();
            const prezzo = parseFloat(colonne[3].trim().replace('\\r', ''));
            if (!titolo) return;

            const div = document.createElement('div');
            div.className = 'card';
            div.innerHTML = `
        <b>${titolo}</b><br>
        Categoria: ${categoria}<br>
        Dettagli: ${dettaglio}<br>
        Prezzo: €${prezzo}<br>
        <button onclick="aggiungiCarrello('${titolo}', '${prezzo}')">Aggiungi al carrello</button>
      `;
            container.appendChild(div);
        });
    };

    reader.readAsText(file);
});

// CARRELLO
function aggiungiCarrello(nome, prezzo) {
    prezzo = parseFloat(prezzo);
    carrello.push({ nome, prezzo });
    aggiornaCarrello();
}

function aggiornaCarrello() {
    const lista = document.getElementById('carrello');
    lista.innerHTML = '';

    carrello.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item.nome + ' - €' + item.prezzo;
        lista.appendChild(li);
    });
}

// PDF
function generaPDF() {
    const nome = document.getElementById('nome').value;
    const cognome = document.getElementById('cognome').value;
    const email = document.getElementById('email').value;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.text("Riepilogo Acquisto", 10, 10);
    doc.text(`Cliente: ${nome} ${cognome}`, 10, 20);
    doc.text(`Email: ${email}`, 10, 30);

    let y = 40;
    carrello.forEach(item => {
        doc.text(`${item.nome} - €${item.prezzo}`, 10, y);
        y += 10;
    });

    doc.save("ordine.pdf");
}