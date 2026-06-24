import { db } from "../../firebase.js";

import {
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let checklistPendente = null;

const grupos = {
  sistemaEletrico: [
    "Luz dianteira",
    "Luz traseira",
    "Luz de freio",
    "Luz de mudança de direção (setas)",
    "Pisca alerta",
    "Sistema de partida e bateria",
    "Indicador de temperatura",
    "Indicador de combustível",
  ],

  sistemaHidraulico: [
    "Nível do óleo hidráulico",
    "Mangueiras em geral",
    "Vazamento de óleo",
    "Cilindro de elevação",
    "Nível óleo transmissão",
  ],

  estruturaFisica: [
    "Apresenta deformação na estrutura?",
    "Apresenta deformação na lataria?",
    "Todos os vidros em condições?",
    "Limpador de para-brisa em condições?",
    "Lubrificação pinos articulados / possíveis folgas?",
  ],

  motor: [
    "Nível de óleo do motor",
    "Vazamento no motor",
    "Limpeza do radiador",

    "Nível do reservatório",
  ],

  pneu: [
    "Calibração pneus dianteiros e conservação",

    "Calibração pneus traseiros e conservação",
  ],

  itensSeguranca: [
    "Freios",
    "Sirene de ré",
    "Cinto de segurança",
    "Giroflex",
    "Buzina",
    "Retrovisores",
    "Extintor de incêndio",
  ],
};

function criarItem(nomeGrupo, texto, index) {
  const idBase = `${nomeGrupo}-${index}`;

  return `
    <div class="item-check" data-item="${texto}">
      <div class="item-topo">
        <strong>${texto}</strong>

        <div class="opcoes">
          <label>
            <input type="radio" name="${idBase}" value="C" required/>
            <span>C</span>
          </label>

          <label>
            <input type="radio" name="${idBase}" value="NC" />
            <span>NC</span>
          </label>

          <label>
            <input type="radio" name="${idBase}" value="NA" />
            <span>NA</span>
          </label>
        </div>
      </div>

      <div class="obs-item">
        <textarea placeholder="Descreva a não conformidade..."></textarea>
      </div>
    </div>
  `;
}

const modal = document.getElementById("modalAviso");
const modalTexto = document.getElementById("modalTexto");
const fecharModal = document.getElementById("fecharModal");

function abrirModal(mensagem, titulo = "Aviso") {
  document.getElementById("modalTitulo").innerText = titulo;
  modalTexto.innerText = mensagem;
  modal.style.display = "flex";
}

function fechar() {
  modal.style.display = "none";
}

fecharModal.addEventListener("click", fechar);

window.addEventListener("click", (e) => {
  if (e.target === modal) {
    fechar();
  }
});

Object.entries(grupos).forEach(([grupo, itens]) => {
  const container = document.getElementById(grupo);

  container.innerHTML = itens
    .map((item, index) => criarItem(grupo, item, index))
    .join("");
});

let ultimoRadioClicado = null;

document.addEventListener("click", (event) => {
  const radio = event.target.closest("input[type='radio']");

  if (!radio) return;

  const item = radio.closest(".item-check");

  if (ultimoRadioClicado === radio) {
    radio.checked = false;
    ultimoRadioClicado = null;

    if (item) {
      item.classList.remove("nao-conforme");
    }

    return;
  }

  ultimoRadioClicado = radio;

  if (!item) return;

  if (radio.value === "NC") {
    item.classList.add("nao-conforme");
  } else {
    item.classList.remove("nao-conforme");
  }
});

const formChecklist = document.getElementById("formChecklist");

formChecklist.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!formChecklist.checkValidity()) {
    formChecklist.reportValidity();
    return;
  }

  const respostas = [];

  document.querySelectorAll(".item-check").forEach((item) => {
    const pergunta = item.dataset.item;

    const resposta =
      item.querySelector("input[type='radio']:checked")?.value || "";

    const observacao =
      item.querySelector("textarea")?.value.trim() || "";

    respostas.push({
      pergunta,
      resposta,
      observacao,
    });
  });

  const condicaoOperacao =
    document.querySelector(
      "input[name='condicaoOperacao']:checked"
    )?.value || "";

  checklistPendente = {
    tipo: "Pá Carregadeira",
    modelo: document.getElementById("modelo").value.trim(),
    operador: document.getElementById("operador").value.trim(),
    data: document.getElementById("data").value,
    turno: document.getElementById("turno").value,
    observacoes: document.getElementById("observacoes").value.trim(),
    condicaoOperacao,
    respostas,
  };

  abrirAssinatura();
});

/* Assinatura */

const modalAssinatura = document.getElementById("modalAssinatura");
const canvas = document.getElementById("canvasAssinatura");
const ctx = canvas.getContext("2d");

let desenhando = false;

// ajustar tamanho real do canvas
function resizeCanvas() {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}
resizeCanvas();

window.addEventListener("resize", resizeCanvas);

// começar desenho
canvas.addEventListener("mousedown", (e) => {
  desenhando = true;
  ctx.beginPath();
  ctx.moveTo(e.offsetX, e.offsetY);
});

// desenhar
canvas.addEventListener("mousemove", (e) => {
  if (!desenhando) return;

  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#000";

  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.stroke();
});

// parar desenho
window.addEventListener("mouseup", () => {
  desenhando = false;
});

// celular

function getTouchPos(canvas, touch) {
  const rect = canvas.getBoundingClientRect();

  return {
    x: touch.clientX - rect.left,
    y: touch.clientY - rect.top,
  };
}

canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();

  desenhando = true;

  const pos = getTouchPos(canvas, e.touches[0]);

  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
});

canvas.addEventListener("touchmove", (e) => {
  e.preventDefault();

  if (!desenhando) return;

  const pos = getTouchPos(canvas, e.touches[0]);

  ctx.lineWidth = 2;
  ctx.lineCap = "round";

  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();
});

canvas.addEventListener("touchend", () => {
  desenhando = false;
});

// limpar
document.getElementById("limparAssinatura").addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

function abrirAssinatura() {
  modalAssinatura.style.display = "flex";
}

// fechar modal
function fecharAssinatura() {
  modalAssinatura.style.display = "none";
}

document
  .getElementById("confirmarAssinatura")
  .addEventListener("click", async () => {
    const pixels = ctx.getImageData(
  0,
  0,
  canvas.width,
  canvas.height
).data;

const canvasVazio = !pixels.some(
  (valor, indice) => indice % 4 === 3 && valor !== 0
);

if (canvasVazio) {
  abrirModal(
    "Assine antes de confirmar.",
    "Assinatura obrigatória"
  );
  return;
}

    const assinaturaBase64 = canvas.toDataURL("image/png");

    checklistPendente.assinatura = assinaturaBase64;
    checklistPendente.criadoEm = serverTimestamp();

    try {

      await addDoc(
        collection(db, "checklists"),
        checklistPendente
      );

      fecharAssinatura();

      abrirModal(
        "Checklist enviado com sucesso!",
        "Sucesso"
      );

      formChecklist.reset();

      ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
      );

      checklistPendente = null;

    } catch (erro) {

      console.error(erro);

      abrirModal(
        "Erro ao enviar checklist.",
        "Erro"
      );
    }
  });
