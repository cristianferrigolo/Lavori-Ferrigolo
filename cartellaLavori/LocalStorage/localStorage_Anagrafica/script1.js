var persone = [];

function aggiungiPersona() {

    var nome = document.getElementById("nome").value;
    var cognome = document.getElementById("cognome").value;
    var eta = document.getElementById("eta").value;

    var persona = {
        nome: nome,
        cognome: cognome,
        eta: eta
    };

    persone.push(persona);

    var indice = persone.length;
    if (indice < 10) { indice = "0" + indice; }

    document.getElementById("lista").innerHTML +=
        "<p>" + indice + " - " + nome + " " + cognome + " (" + eta + " anni)</p>";

    document.getElementById("nome").value = "";
    document.getElementById("cognome").value = "";
    document.getElementById("eta").value = "";
}

function inviaDati() {

    localStorage.setItem("persone", JSON.stringify(persone));

    var indici = "";

    for (var i = 0; i < persone.length; i++) {
        var n = i + 1;
        if (n < 10) { indici += "0" + n; } else { indici += n; }
        if (i < persone.length - 1) { indici += ","; }
    }

    window.location.href = "datiRicevuti.html?indici=" + indici;
}
