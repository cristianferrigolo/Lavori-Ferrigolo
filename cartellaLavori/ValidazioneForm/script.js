function valida() {

  const nome = document.invio.nome.value;
  const telefono = document.invio.telefono.value;
  const email = document.invio.email.value;
  const password = document.invio.password.value;
  const conferma = document.invio.conferma.value;

  
  const email_reg_exp =
    /^([a-zA-Z0-9_.-])+@(([a-zA-Z0-9-]{2,})+.)+([a-zA-Z0-9]{2,})+$/;


  const password_reg_exp = /^(?=.*[A-Z])(?=.*[@#$\-_?]).{6,}$/;


  if (!nome) {
    alert("Devi inserire un nome");
    document.invio.nome.focus();
    return false;
  }


  if (isNaN(telefono) || !telefono) {
    alert("Devi inserire il telefono, attenzione deve essere numerico!");
    document.invio.telefono.value = "";
    document.invio.telefono.focus();
    return false;
  }


  if (!email_reg_exp.test(email) || !email) {
    alert("Devi inserire un indirizzo email corretto");
    document.invio.email.focus();
    return false;
  }


  if (!password_reg_exp.test(password) || password.length < 6) {
    alert(
      "La password deve contenere almeno una lettera maiuscola, un carattere speciale (@, #, ?, $, -, _) e almeno 6 caratteri."
    );
    document.invio.password.focus();
    return false;
  }


  if (!conferma) {
    alert("Devi confermare la password");
    document.invio.conferma.focus();
    return false;
  }


  if (password !== conferma) {
    alert("La conferma password non corrisponde");
    document.invio.conferma.value = "";
    document.invio.conferma.focus();
    return false;
  } else {
    document.invio.action = "#";
    document.invio.submit();
  }
}