const formLogin = document.getElementById("formLogin");
const matricula = document.getElementById("matricula");
const senha = document.getElementById("senha");
const mensagemErro = document.getElementById("mensagemErro");

formLogin.addEventListener("submit", (event) => {
  event.preventDefault();

  const matriculaDigitada = matricula.value.trim();
  const senhaDigitada = senha.value.trim();

  mensagemErro.textContent = "";

  if (!matriculaDigitada || !senhaDigitada) {
    mensagemErro.textContent = "Preencha todos os campos.";
    return;
  }

  // Login provisório para teste
  if (matriculaDigitada === "123" && senhaDigitada === "123") {
    localStorage.setItem("colaboradorLogado", "true");
    localStorage.setItem("colaboradorMatricula", matriculaDigitada);

    window.location.href = "../01_HOME/painel.html";
    return;
  }

  mensagemErro.textContent = "Matrícula/CPF ou senha incorretos.";
});