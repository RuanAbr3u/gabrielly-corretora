// Utilidades de data
function formatarDataBR(dataISO) {
  if (!dataISO) return "";
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
}
function desformatarDataBR(dataBR) {
  if (!dataBR) return "";
  const [dia, mes, ano] = dataBR.split("/");
  return `${ano}-${mes}-${dia}`;
}

// Formata CPF ou CNPJ com pontuação (aceita string com ou sem caracteres)
function formatarDocumentoMask(input) {
  if (!input) return "";
  const digits = (input + "").replace(/\D/g, "");
  if (digits.length === 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }
  if (digits.length === 14) {
    return digits.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      "$1.$2.$3/$4-$5",
    );
  }
  return input; // retorna como veio se não tiver tamanho esperado
}

// Validação algorítmica CPF
function validarCPF(digits) {
  if (!/^[0-9]{11}$/.test(digits)) return false;
  // rejeitar sequências repetidas
  if (/^(\d)\1{10}$/.test(digits)) return false;
  const nums = digits.split("").map(Number);
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += nums[i] * (10 - i);
  let rev = 11 - (soma % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== nums[9]) return false;
  soma = 0;
  for (let i = 0; i < 10; i++) soma += nums[i] * (11 - i);
  rev = 11 - (soma % 11);
  if (rev === 10 || rev === 11) rev = 0;
  return rev === nums[10];
}

// Validação algorítmica CNPJ
function validarCNPJ(digits) {
  if (!/^[0-9]{14}$/.test(digits)) return false;
  if (/^(\d)\1{13}$/.test(digits)) return false;
  const nums = digits.split("").map(Number);
  const calc = (pos) => {
    let soma = 0;
    let peso = pos - 7;
    for (let i = 0; i < pos - 1; i++) {
      soma += nums[i] * peso;
      peso = peso - 1;
      if (peso < 2) peso = 9;
    }
    let res = soma % 11;
    return res < 2 ? 0 : 11 - res;
  };
  const v1 = calc(13);
  if (v1 !== nums[12]) return false;
  const v2 = calc(14);
  return v2 === nums[13];
}

// Mascara live para documento (CPF/CNPJ) com caret preservation
function aplicarMaskDocumento(value) {
  const digits = (value || "").replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 11) {
    // parcial de CPF
    const p = digits;
    if (p.length <= 3) return p;
    if (p.length <= 6) return p.replace(/(\d{3})(\d+)/, "$1.$2");
    if (p.length <= 9) return p.replace(/(\d{3})(\d{3})(\d+)/, "$1.$2.$3");
    return p.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, "$1.$2.$3-$4");
  }
  // CNPJ
  const p = digits;
  if (p.length <= 2) return p;
  if (p.length <= 5) return p.replace(/(\d{2})(\d+)/, "$1.$2");
  if (p.length <= 8) return p.replace(/(\d{2})(\d{3})(\d+)/, "$1.$2.$3");
  if (p.length <= 12)
    return p.replace(/(\d{2})(\d{3})(\d{3})(\d+)/, "$1.$2.$3/$4");
  return p.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, "$1.$2.$3/$4-$5");
}

function handleDocumentoInput(e) {
  const input = e.target;
  const selectionStart = input.selectionStart;
  const oldValue = input.value;
  // count digits before caret
  const digitsBefore = (oldValue.slice(0, selectionStart).match(/\d/g) || [])
    .length;
  const newMasked = aplicarMaskDocumento(oldValue);
  input.value = newMasked;
  // restore caret position: move to after digitsBefore-th digit
  let pos = 0;
  let counted = 0;
  while (pos < input.value.length && counted < digitsBefore) {
    if (/\d/.test(input.value[pos])) counted++;
    pos++;
  }
  input.setSelectionRange(pos, pos);
}

// Armazenamento e renderização
let atendimentos = [];
let editandoIndex = null;

function salvarAtendimentos() {
  localStorage.setItem("atendimentos", JSON.stringify(atendimentos));
}
function carregarAtendimentos() {
  const dados = localStorage.getItem("atendimentos");
  atendimentos = dados ? JSON.parse(dados) : [];
}
function renderizarAtendimentos() {
  const ul = document.getElementById("lista-atendimentos");
  ul.innerHTML = "";
  atendimentos.forEach((a, idx) => {
    const li = document.createElement("li");
    // detalhe do imóvel vinculado (se existir)
    let imovelLabel = "";
    if (a.imovelId) {
      // Buscar imóvel pelo ID quando disponível
      carregarImoveis().then((imoveis) => {
        const im = imoveis.find((i) => i.id === a.imovelId);
        if (im) {
          const liElement = ul.querySelector(`[data-atendimento-idx="${idx}"]`);
          if (liElement) {
            const metaDiv = liElement.querySelector(".meta");
            const currentText = metaDiv.textContent;
            if (!currentText.includes("Imóvel:")) {
              const title = im.titulo || im.endereco || `Imóvel ${im.id}`;
              metaDiv.textContent =
                currentText +
                ` • Imóvel: ${title} (${im.bairro || "sem bairro"})`;
            }
          }
        }
      });
    } else if (typeof a.imovelIndex === "number" && a.imovelIndex !== null) {
      // Compatibilidade com formato antigo (localStorage)
      const imoveisRaw = localStorage.getItem("imoveis");
      const imoveis = imoveisRaw ? JSON.parse(imoveisRaw) : [];
      const im = imoveis[a.imovelIndex];
      if (im) {
        const title = im.titulo || im.endereco || `Imóvel ${a.imovelIndex + 1}`;
        imovelLabel = ` • Imóvel: ${title} (${im.bairro || "sem bairro"})`;
      }
    }
    const docFmt = a.documento ? formatarDocumentoMask(a.documento) : "";
    const statusLabel =
      a.status === "novo"
        ? "novo"
        : a.status === "interessado"
          ? "interessado"
          : a.status === "visita"
            ? "visita"
            : a.status;
    const badgeClass =
      statusLabel === "novo"
        ? "badge-novo"
        : statusLabel === "interessado"
          ? "badge-interessado"
          : "badge-visita";
    const statusHtml = `<span class="badge ${badgeClass}">${statusLabel === "novo" ? "Cliente novo" : statusLabel === "interessado" ? "Interessado" : "Visita agendada"}</span>`;
    li.innerHTML = `
            <div class="atendimento-info">
                <strong>${a.cliente} ${statusHtml}</strong>
                <div class="meta">${formatarDataBR(a.data)}${imovelLabel}${docFmt ? " • " + docFmt : ""}</div>
                <div class="desc">${a.descricao}</div>
            </div>
            <div class="atendimento-actions">
                <button type='button' class='editar-btn' data-idx='${idx}'>Editar</button>
                <button type='button' class='excluir-btn' data-idx='${idx}'>Excluir</button>
            </div>
        `;
    li.setAttribute("data-atendimento-idx", idx);
    ul.appendChild(li);
  });
  adicionarEventosAtendimentos();
}

function adicionarEventosAtendimentos() {
  document.querySelectorAll(".excluir-btn").forEach((btn) => {
    btn.onclick = function () {
      const idx = Number(this.getAttribute("data-idx"));
      if (confirm("Tem certeza que deseja excluir este atendimento?")) {
        atendimentos.splice(idx, 1);
        salvarAtendimentos();
        renderizarAtendimentos();
        mostrarMensagem("Atendimento excluído!");
      }
    };
  });
  document.querySelectorAll(".editar-btn").forEach((btn) => {
    btn.onclick = function () {
      const idx = Number(this.getAttribute("data-idx"));
      const a = atendimentos[idx];
      document.querySelector('input[name="cliente"]').value = a.cliente;
      document.querySelector('input[name="data"]').value = a.data;
      document.querySelector('textarea[name="descricao"]').value = a.descricao;
      // preencher documento formatado
      document.querySelector('input[name="documento"]').value = a.documento
        ? formatarDocumentoMask(a.documento)
        : "";
      // preencher select de imóvel (suporta ID ou índice)
      const sel = document.querySelector('select[name="imovel"]');
      if (sel) {
        if (a.imovelId) {
          sel.value = a.imovelId;
        } else if (
          typeof a.imovelIndex === "number" &&
          a.imovelIndex !== null
        ) {
          sel.value = String(a.imovelIndex);
        } else {
          sel.value = "";
        }
      }
      // status
      const st = document.querySelector('select[name="status"]');
      if (st) st.value = a.status || "novo";
      editandoIndex = idx;
      document.querySelector('button[type="submit"]').textContent = "Atualizar";
    };
  });
}

document
  .getElementById("atendimento-form")
  .addEventListener("submit", function (e) {
    e.preventDefault();
    const cliente = this.cliente.value.trim();
    const data = this.data.value;
    const descricao = this.descricao.value.trim();
    const documentoRaw = this.documento ? this.documento.value.trim() : "";
    const documentoDigits = (documentoRaw || "").replace(/\D/g, "");
    const telefone = this.telefone ? this.telefone.value.trim() : "";
    const notaTexto = this.nota ? this.nota.value.trim() : "";
    const imovelValue =
      this.imovel && this.imovel.value !== "" ? this.imovel.value : null;
    const status = this.status ? this.status.value : "novo";

    // Validação
    if (!cliente || !data || !descricao) {
      mostrarMensagem("Preencha todos os campos obrigatórios!", true);
      return;
    }
    // se documento preenchido, validar tamanho (CPF 11 ou CNPJ 14)
    if (
      documentoDigits &&
      !(documentoDigits.length === 11 || documentoDigits.length === 14)
    ) {
      mostrarMensagem(
        "Documento deve ser CPF (11 dígitos) ou CNPJ (14 dígitos).",
        true,
      );
      return;
    }

    const documentoParaSalvar = documentoDigits || "";

    // validação algorítmica quando preenchido
    if (documentoParaSalvar) {
      if (
        documentoParaSalvar.length === 11 &&
        !validarCPF(documentoParaSalvar)
      ) {
        mostrarMensagem("CPF inválido.", true);
        return;
      }
      if (
        documentoParaSalvar.length === 14 &&
        !validarCNPJ(documentoParaSalvar)
      ) {
        mostrarMensagem("CNPJ inválido.", true);
        return;
      }
    }

    const atendimentoData = {
      cliente,
      data,
      descricao,
      documento: documentoParaSalvar,
      telefone,
      imovelId: imovelValue,
      status,
      notas: [],
    };

    // Se tem nota, adicionar
    if (notaTexto) {
      atendimentoData.notas.push({
        texto: notaTexto,
        data: data,
      });
    }

    if (editandoIndex !== null) {
      // Preservar notas existentes ao editar
      if (atendimentos[editandoIndex].notas) {
        atendimentoData.notas = [
          ...atendimentos[editandoIndex].notas,
          ...atendimentoData.notas,
        ];
      }
      atendimentos[editandoIndex] = atendimentoData;
      editandoIndex = null;
      this.querySelector('button[type="submit"]').textContent = "Cadastrar";
    } else {
      atendimentos.push(atendimentoData);
    }
    salvarAtendimentos();
    renderizarAtendimentos();
    this.reset();
    mostrarMensagem("Atendimento salvo com sucesso!");
  });

// Popula o select de imóveis com os dados do Supabase
async function carregarImoveisNoSelect() {
  const sel = document.querySelector('select[name="imovel"]');
  if (!sel) return;
  // limpa mantendo a primeira opção
  sel.innerHTML = '<option value="">-- selecione --</option>';

  try {
    // Carregar imóveis do Supabase
    const imoveis = await carregarImoveis();
    console.log("📦 Imóveis carregados para select:", imoveis.length);

    if (imoveis.length === 0) {
      const optAviso = document.createElement("option");
      optAviso.value = "";
      optAviso.textContent = "(Nenhum imóvel cadastrado)";
      optAviso.disabled = true;
      sel.appendChild(optAviso);
      console.log("⚠️ Nenhum imóvel encontrado no banco");
    } else {
      imoveis.forEach((im, i) => {
        const title = im.titulo || im.endereco || `Imóvel ${im.id}`;
        const opt = document.createElement("option");
        opt.value = im.id || String(i); // Usar ID do Supabase
        opt.textContent = `${title} (${im.bairro || "sem bairro"})`;
        sel.appendChild(opt);
      });
      console.log("✅ " + imoveis.length + " imóveis adicionados ao select");
    }
  } catch (error) {
    console.error("❌ Erro ao carregar imóveis:", error);
    const optErro = document.createElement("option");
    optErro.value = "";
    optErro.textContent = "(Erro ao carregar imóveis)";
    optErro.disabled = true;
    sel.appendChild(optErro);
  }
}

// Atualizar select quando a janela ganhar foco (se um novo imóvel foi cadastrado em outra aba)
window.addEventListener("focus", carregarImoveisNoSelect);

// ligar máscara live se o input existir
const docInput = document.querySelector('input[name="documento"]');
if (docInput) {
  docInput.addEventListener("input", handleDocumentoInput);
  // formatar ao perder foco (garantir formato final)
  docInput.addEventListener("blur", function () {
    this.value = formatarDocumentoMask(this.value);
  });
}

// Mensagem de feedback
function mostrarMensagem(msg, erro = false) {
  let div = document.getElementById("mensagem-feedback");
  if (!div) {
    div = document.createElement("div");
    div.id = "mensagem-feedback";
    div.style.position = "fixed";
    div.style.top = "20px";
    div.style.left = "50%";
    div.style.transform = "translateX(-50%)";
    div.style.zIndex = "9999";
    div.style.padding = "14px 28px";
    div.style.borderRadius = "8px";
    div.style.fontWeight = "bold";
    div.style.fontSize = "1.1rem";
    document.body.appendChild(div);
  }
  div.textContent = msg;
  div.style.background = erro ? "#e74c3c" : "#27ae60";
  div.style.color = "#fff";
  div.style.boxShadow = "0 2px 8px #2228";
  div.style.display = "block";
  setTimeout(() => {
    div.style.display = "none";
  }, 3000);
}

// Inicialização
carregarAtendimentos();
renderizarAtendimentos();

// Inicializar imóveis assincronamente
(async function () {
  await carregarImoveisNoSelect();
  console.log("✅ Imóveis carregados no select");
})();

// ========== ESTATÍSTICAS E FILTROS (Consolidado de script-melhorias.js) ==========

// Estatísticas de atendimentos
function atualizarEstatisticas() {
  const total = atendimentos.length;

  // Atendimentos deste mês
  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();

  const esteMes = atendimentos.filter((a) => {
    const dataAtend = new Date(a.data);
    return (
      dataAtend.getMonth() === mesAtual && dataAtend.getFullYear() === anoAtual
    );
  }).length;

  // Visitas agendadas
  const visitas = atendimentos.filter((a) => a.status === "visita").length;

  const statTotal = document.getElementById("stat-total");
  const statMes = document.getElementById("stat-mes");
  const statVisitas = document.getElementById("stat-visitas");

  if (statTotal) statTotal.textContent = total;
  if (statMes) statMes.textContent = esteMes;
  if (statVisitas) statVisitas.textContent = visitas;
}

// Busca e filtros
let atendimentosFiltrados = [];

function buscarAtendimentos() {
  const termo =
    document.getElementById("busca-atendimento")?.value.toLowerCase() || "";
  const statusFiltro =
    document.getElementById("filtro-status-atend")?.value || "";

  atendimentosFiltrados = atendimentos.filter((a) => {
    // Filtro de busca
    let matchBusca = true;
    if (termo) {
      const cliente = (a.cliente || "").toLowerCase();
      const descricao = (a.descricao || "").toLowerCase();
      const documento = (a.documento || "").replace(/\D/g, "");
      const termoNumerico = termo.replace(/\D/g, "");

      matchBusca =
        cliente.includes(termo) ||
        descricao.includes(termo) ||
        (termoNumerico && documento.includes(termoNumerico));
    }

    // Filtro de status
    let matchStatus = true;
    if (statusFiltro) {
      matchStatus = a.status === statusFiltro;
    }

    return matchBusca && matchStatus;
  });

  renderizarAtendimentosFiltrados();
}

function renderizarAtendimentosFiltrados() {
  const ul = document.getElementById("lista-atendimentos");
  ul.innerHTML = "";

  if (atendimentosFiltrados.length === 0) {
    ul.innerHTML =
      '<li style="text-align: center; padding: 20px; color: var(--color-muted);">Nenhum atendimento encontrado</li>';
    return;
  }

  atendimentosFiltrados.forEach((a, idx) => {
    // Encontrar índice original
    const idxOriginal = atendimentos.indexOf(a);

    const li = document.createElement("li");
    li.setAttribute("data-atendimento-idx", idxOriginal);

    let imovelLabel = "";
    if (a.imovelId) {
      carregarImoveis().then((imoveis) => {
        const im = imoveis.find((i) => i.id === a.imovelId);
        if (im) {
          const liElement = ul.querySelector(
            `[data-atendimento-idx="${idxOriginal}"]`,
          );
          if (liElement) {
            const metaDiv = liElement.querySelector(".meta");
            const currentText = metaDiv.textContent;
            if (!currentText.includes("Imóvel:")) {
              metaDiv.textContent =
                currentText +
                ` • Imóvel: ${im.endereco || im.titulo || im.nome || "#" + im.id}`;
            }
          }
        }
      });
    }

    const docFmt = a.documento ? formatarDocumentoMask(a.documento) : "";
    const statusLabel =
      a.status === "novo"
        ? "novo"
        : a.status === "interessado"
          ? "interessado"
          : a.status === "visita"
            ? "visita"
            : a.status;
    const badgeClass =
      statusLabel === "novo"
        ? "badge-novo"
        : statusLabel === "interessado"
          ? "badge-interessado"
          : "badge-visita";
    const statusHtml = `<span class="badge ${badgeClass}">${statusLabel === "novo" ? "Cliente novo" : statusLabel === "interessado" ? "Interessado" : "Visita agendada"}</span>`;

    const telefone = a.telefone ? ` • ${a.telefone}` : "";

    li.innerHTML = `
            <div class="atendimento-info">
                <strong>${a.cliente} ${statusHtml}</strong>
                <div class="meta">${formatarDataBR(a.data)}${imovelLabel}${docFmt ? " • " + docFmt : ""}${telefone}</div>
                <div class="desc">${a.descricao}</div>
                ${a.notas && a.notas.length > 0 ? renderNotasHTML(a.notas) : ""}
            </div>
            <div class="atendimento-actions">
                <button type='button' class='add-nota-btn' data-idx='${idxOriginal}' style="background: #3498db;">+ Nota</button>
                <button type='button' class='editar-btn' data-idx='${idxOriginal}'>Editar</button>
                <button type='button' class='excluir-btn' data-idx='${idxOriginal}'>Excluir</button>
            </div>
        `;
    ul.appendChild(li);
  });

  // Adicionar eventos
  adicionarEventosBotoes();
  atualizarEstatisticas();
}

function renderNotasHTML(notas) {
  if (!notas || notas.length === 0) return "";

  let html = '<div class="notas-section">';
  html +=
    '<strong style="color: var(--color-gold); font-size: 0.9rem;">📝 Notas e Lembretes:</strong>';

  notas.forEach((nota) => {
    html += `
            <div class="nota-item">
                <div>${nota.texto}</div>
                <div class="nota-data">${nota.data ? formatarDataBR(nota.data) : ""}</div>
            </div>
        `;
  });

  html += "</div>";
  return html;
}

function adicionarNota(idx) {
  const texto = prompt("Digite a nota/lembrete:");
  if (!texto || texto.trim() === "") return;

  const atendimento = atendimentos[idx];
  if (!atendimento.notas) {
    atendimento.notas = [];
  }

  const hoje = new Date();
  const dataISO = hoje.toISOString().split("T")[0];

  atendimento.notas.push({
    texto: texto.trim(),
    data: dataISO,
  });

  salvarAtendimentos();
  buscarAtendimentos();
  mostrarMensagem("Nota adicionada com sucesso!");
}

function adicionarEventosBotoes() {
  // Botão adicionar nota
  document.querySelectorAll(".add-nota-btn").forEach((btn) => {
    btn.onclick = function () {
      const idx = Number(this.getAttribute("data-idx"));
      adicionarNota(idx);
    };
  });

  // Botão excluir
  document.querySelectorAll(".excluir-btn").forEach((btn) => {
    btn.onclick = function () {
      const idx = Number(this.getAttribute("data-idx"));
      if (confirm("Tem certeza que deseja excluir este atendimento?")) {
        atendimentos.splice(idx, 1);
        salvarAtendimentos();
        buscarAtendimentos();
        mostrarMensagem("Atendimento excluído!");
      }
    };
  });

  // Botão editar
  document.querySelectorAll(".editar-btn").forEach((btn) => {
    btn.onclick = function () {
      const idx = Number(this.getAttribute("data-idx"));
      const a = atendimentos[idx];
      document.querySelector('input[name="cliente"]').value = a.cliente;
      if (a.documento)
        document.querySelector('input[name="documento"]').value = a.documento;
      if (a.telefone)
        document.querySelector('input[name="telefone"]').value = a.telefone;
      if (a.imovelId) {
        const selectImovel = document.querySelector('select[name="imovel"]');
        if (selectImovel) selectImovel.value = a.imovelId;
      }
      document.querySelector('select[name="status"]').value = a.status;
      document.querySelector('input[name="data"]').value = a.data;
      document.querySelector('textarea[name="descricao"]').value = a.descricao;
      editandoIndex = idx;
      document.querySelector('button[type="submit"]').textContent = "Atualizar";
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
  });
}

function limparFiltrosAtendimento() {
  const buscaInput = document.getElementById("busca-atendimento");
  const filtroStatus = document.getElementById("filtro-status-atend");

  if (buscaInput) buscaInput.value = "";
  if (filtroStatus) filtroStatus.value = "";

  buscarAtendimentos();
  mostrarMensagem("Filtros limpos!");
}

// Adicionar eventos de busca e filtro
document.addEventListener("DOMContentLoaded", function () {
  const buscaInput = document.getElementById("busca-atendimento");
  const filtroStatus = document.getElementById("filtro-status-atend");

  if (buscaInput) {
    buscaInput.addEventListener("input", buscarAtendimentos);
  }

  if (filtroStatus) {
    filtroStatus.addEventListener("change", buscarAtendimentos);
  }

  // Inicializar lista filtrada
  atendimentosFiltrados = [...atendimentos];
  atualizarEstatisticas();
});
