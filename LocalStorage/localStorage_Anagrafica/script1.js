var persone = [];

function aggiungiPersona() {

    var nome = document.getElementById("nome").value;
    var cognome = document.getElementById("cognome").value;
    var indirizzo = document.getElementById("indirizzo").value;
    var citta = document.getElementById("citta").value;
    var cap = document.getElementById("cap").value;
    var eta = document.getElementById("eta").value;
    var dataNascita = document.getElementById("dataNascita").value;
    var provincia = document.getElementById("provincia").value;

    var radios = document.getElementsByName("sesso");
    var sesso = "";
    for (var i = 0; i < radios.length; i++) {
        if (radios[i].checked) { sesso = radios[i].value; }
    }

    var checkbox = document.getElementsByName("mezzi");
    var mezzi = [];
    for (var i = 0; i < checkbox.length; i++) {
        if (checkbox[i].checked) { mezzi.push(checkbox[i].value); }
    }

    var selected = document.getElementById("materie").selectedOptions;
    var materie = [];
    for (var i = 0; i < selected.length; i++) {
        materie.push(selected[i].value);
    }

    var persona = {
        nome: nome,
        cognome: cognome,
        eta: eta,
        dataNascita: dataNascita,
        sesso: sesso,
        provincia: provincia,
        mezzi: mezzi.join(", "),
        materie: materie.join(", "),
        indirizzo: { via: indirizzo, citta: citta, cap: cap }
    };

    persone.push(persona);

    var indice = persone.length;
    if (indice < 10) { indice = "0" + indice; }

    document.getElementById("lista").innerHTML +=
        "<p>" + indice + " - " + nome + " " + cognome + "</p>";
}

function inviaDati() {

    localStorage.setItem("persone", JSON.stringify(persone));

    var indici = "";
    for (var i = 0; i < persone.length; i++) {
        var n = i + 1;
        if (n < 10) { indici += "0" + n; } else { indici += n; }
        if (i < persone.length - 1) { indici += ","; }
    }

    window.location.href = "ricevente.html?indici=" + indici;
}
