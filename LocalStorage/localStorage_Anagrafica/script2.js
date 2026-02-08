var persone = JSON.parse(localStorage.getItem("persone"));

var url = window.location.search;
var parametri = new URLSearchParams(url);
var indici = parametri.get("indici").split(",");

var tabella = document.getElementById("tabella");

for (var i = 0; i < persone.length; i++) {
    tabella.innerHTML += "<tr>" +
        "<td>" + indici[i] + "</td>" +
        "<td>" + persone[i].nome + "</td>" +
        "<td>" + persone[i].cognome + "</td>" +
        "<td>" + persone[i].eta + "</td>" +
        "<td>" + persone[i].provincia + "</td>" +
        "<td>" + persone[i].mezzi + "</td>" +
        "<td>" + persone[i].materie + "</td>" +
        "</tr>";
}
