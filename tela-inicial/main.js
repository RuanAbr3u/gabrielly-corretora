// ==========================================================
// FORMATAÇÃO DE ATRIBUTOS (singular/plural e ocultar 0)
// ==========================================================
function formatarAtributo(valor, singular, plural) {
  const num = Number(valor);
  // Garante que só retorna algo se for maior que 0
  if (isNaN(num) || num <= 0) return "";
  return num === 1 ? `${num} ${singular}` : `${num} ${plural}`;
}

// ==========================================================
// LÓGICA DE LISTAGEM DE IMÓVEIS E MODAL
// ==========================================================
document.addEventListener("DOMContentLoaded", () => {
  // ----------------------------------------------------------
  // 1. BALÃO DO WHATSAPP
  // ----------------------------------------------------------
  const balao = document.getElementById("whatsapp-balao");
  if (balao) {
    balao.style.opacity = 0;
    setTimeout(() => {
      balao.style.transition = "opacity 1s ease-in-out";
      balao.style.opacity = 1;
    }, 1000);
  }

  // ----------------------------------------------------------
  // 2. LISTAGEM DE IMÓVEIS
  // ----------------------------------------------------------

  const container = document.getElementById("listaImoveisSite");
  if (!container) return; // encerra se não estiver na página correta

  // Verifica se há filtros na página (significa que script-listagem.js deve gerenciar)
  const hasFiltros =
    document.getElementById("filtroBairro") ||
    document.getElementById("filtroCategoria");
  if (hasFiltros) {
    console.log(
      "Filtros detectados - script-listagem.js vai gerenciar os imóveis",
    );
    return; // Deixa o script-listagem.js gerenciar
  }

  container.innerHTML = "";

  const imoveis = JSON.parse(localStorage.getItem("imoveis")) || [];

  // Detecta o tipo de página (venda ou locação)
  const tipoPagina = location.pathname.includes("vendas.html")
    ? "venda"
    : "locacao";

  const lista = imoveis.filter((i) => i.tipoNegocio === tipoPagina);

  if (lista.length === 0) {
    container.innerHTML =
      '<p style="text-align:center; color:#e0dcd3;">Nenhum imóvel cadastrado no momento.</p>';
    return;
  }

  lista.forEach((imovel, index) => {
    const card = document.createElement("article");
    card.classList.add("card-imovel");
    card.dataset.index = index;

    const img =
      imovel.imagens && imovel.imagens[0]
        ? imovel.imagens[0]
        : "./img/sem-foto.jpg";

    // Formatação dos atributos
    const txtQuartos = formatarAtributo(imovel.quartos, "quarto", "quartos");
    const txtBanheiros = formatarAtributo(
      imovel.banheiros,
      "banheiro",
      "banheiros",
    );
    const txtVagas = formatarAtributo(imovel.vagas, "vaga", "vagas");

    // --- CORRIGIDO: Só exibe área se for > 0 ---
    const txtArea =
      imovel.areaUtil && Number(imovel.areaUtil) > 0
        ? `${Number(imovel.areaUtil)} m²`
        : "";

    const garagem =
      imovel.garagem === "Com garagem"
        ? txtVagas || "Garagem"
        : imovel.garagem === "Sem garagem"
          ? "Sem garagem"
          : "";

    // Adiciona Condomínio se existir
    const condominioInfo =
      imovel.condominio && imovel.condominio.trim() !== ""
        ? imovel.condominio
        : "";

    // --- ATUALIZADO (especificacoes do CARD) ---
    const especificacoes = [
      txtArea,
      txtQuartos,
      txtBanheiros,
      garagem,
      condominioInfo,
    ]
      .filter(Boolean)
      .join(" | ");

    const precoFormatado =
      tipoPagina === "locacao"
        ? `R$ ${Number(imovel.preco).toLocaleString("pt-BR")}/mês`
        : `R$ ${Number(imovel.preco).toLocaleString("pt-BR")}`;

    const descricaoCortada =
      imovel.descricao.length > 120
        ? imovel.descricao.slice(0, 120) + "..."
        : imovel.descricao;

    card.innerHTML = `
      <img src="${img}" alt="${imovel.titulo}" class="img-imovel">
      <div class="info-imovel">
        <h2>${imovel.titulo}</h2>
        <p>${descricaoCortada}</p>
        <p><strong>${precoFormatado}</strong></p>
        <p>${especificacoes}</p>
        <button class="btn-vermais" data-index="${index}">Ver mais</button>
      </div>
    `;
    container.appendChild(card);
  });

  // ----------------------------------------------------------
  // 3. MODAL DE DETALHES
  // ----------------------------------------------------------

  const modal = document.getElementById("modalImovel");
  const modalGaleria = document.getElementById("modalGaleria");
  const modalTitulo = document.getElementById("modalTitulo");
  const modalDescricao = document.getElementById("modalDescricao");
  const modalPreco = document.getElementById("modalPreco");
  const modalSpecs = document.getElementById("modalSpecs");
  const fecharModal = document.getElementById("fecharModal");
  const btnFechar = document.getElementById("btnFechar");
  const modalBackdrop = document.getElementById("modalBackdrop");
  const botaoWhats = document.getElementById("botaoWhats");
  const btnPrev = document.getElementById("btnPrev");
  const btnNext = document.getElementById("btnNext");

  let imagensAtuais = [];
  let indiceImagem = 0;

  // ----------------------------------------------------------
  // Função para mostrar imagem no modal
  // ----------------------------------------------------------

  function mostrarImagem(index) {
    if (!modalGaleria || imagensAtuais.length === 0) return;
    modalGaleria.innerHTML = "";
    const img = document.createElement("img");
    img.src = imagensAtuais[index];
    img.className = "modal-img";
    modalGaleria.appendChild(img);
  }

  // ----------------------------------------------------------
  // Função para abrir modal (COM AS MELHORIAS)
  // ----------------------------------------------------------

  function abrirModal(imovel) {
    if (!modal) return;

    imagensAtuais = imovel.imagens?.length ? imovel.imagens : [];
    indiceImagem = 0;

    if (imagensAtuais.length) {
      mostrarImagem(indiceImagem);
    } else {
      modalGaleria.innerHTML =
        '<div class="sem-imagem" style="text-align:center; padding: 20px;">Sem imagem disponível</div>';
    }

    modalTitulo.textContent = imovel.titulo;

    // --- CORRIGIDO: DESCRIÇÃO (Apenas a descrição livre) ---
    modalDescricao.textContent = imovel.descricao;

    // --- PREÇO (Formatação Corrigida) ---
    const precoNum = Number(imovel.preco);
    let precoFormatado = precoNum.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

    if (tipoPagina === "locacao") {
      precoFormatado += "/mês";
    }
    modalPreco.textContent = precoFormatado;

    // ----------------------------------------------------
    // --- SPECS & CARACTERÍSTICAS (Formato Profissional) ---
    // ----------------------------------------------------

    // 1. Linha de Specs Principais (Categoria, Área, Quartos, Suítes, Banheiros, Garagem, Condomínio)
    const txtQuartos = formatarAtributo(imovel.quartos, "quarto", "quartos");
    const txtSuites = formatarAtributo(imovel.suites, "suíte", "suítes");
    const txtBanheiros = formatarAtributo(
      imovel.banheiros,
      "banheiro",
      "banheiros",
    );
    const txtVagas = formatarAtributo(imovel.vagas, "vaga", "vagas");
    // Garante que só exibe área se for > 0
    const txtArea =
      imovel.areaUtil && Number(imovel.areaUtil) > 0
        ? `${Number(imovel.areaUtil)} m²`
        : "";

    const garagemTxt =
      imovel.garagem === "Com garagem" && txtVagas
        ? `Garagem (${txtVagas})`
        : imovel.garagem;

    let condominioInfo = "";
    if (
      imovel.condominio &&
      imovel.condominio.trim() !== "" &&
      imovel.condominioStatus !== "Não se aplica"
    ) {
      condominioInfo = `${imovel.condominio} (${imovel.condominioStatus})`;
    } else if (imovel.condominio && imovel.condominio.trim() !== "") {
      condominioInfo = imovel.condominio;
    }

    // Monta o array principal de especificações
    const specsArray = [
      imovel.categoria,
      txtArea,
      txtQuartos,
      txtSuites,
      txtBanheiros,
      garagemTxt,
      condominioInfo,
    ].filter(Boolean);

    // Cria a primeira linha (Specs)
    const specsHtml = `<p class="spec-line-1">${specsArray.join(" • ")}</p>`;

    // --- NOVO: Linha de Valores (Condomínio, IPTU) ---
    const formatarValorDisplay = (val) => {
      const num = Number(val);
      // Exibe apenas se o valor for positivo
      if (isNaN(num) || num <= 0) return "";
      return num.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
    };

    const valorCondominioTxt = formatarValorDisplay(imovel.valorCondominio);
    const valorIPTUTxt = formatarValorDisplay(imovel.valorIPTU);

    const condominioDisplay = valorCondominioTxt
      ? `Condomínio: ${valorCondominioTxt}`
      : "";
    const iptuDisplay = valorIPTUTxt ? `IPTU: ${valorIPTUTxt}` : "";
    const separador = condominioDisplay && iptuDisplay ? " | " : "";

    const valoresHtml =
      condominioDisplay || iptuDisplay
        ? `<p class="spec-line-valores">${condominioDisplay}${separador}${iptuDisplay}</p>`
        : "";

    // 3. Linha de Características (Checkbox)
    const caracteristicasArray = imovel.caracteristicas?.length
      ? imovel.caracteristicas
      : [];

    // Cria a terceira linha (Características)
    const caracteristicasHtml = caracteristicasArray.length
      ? `<p class="spec-line-2"><strong>Características:</strong> ${caracteristicasArray.join(
          " • ",
        )}</p>`
      : "";

    // Combina tudo no modalSpecs (três linhas distintas)
    modalSpecs.innerHTML = specsHtml + valoresHtml + caracteristicasHtml;

    // Link do WhatsApp
    const telefone = "557592112142";
    const msg = encodeURIComponent(
      `Olá! Tenho interesse no imóvel: ${imovel.titulo}. Poderia me passar mais detalhes?`,
    );
    if (botaoWhats) botaoWhats.href = `https://wa.me/${telefone}?text=${msg}`;

    modal.style.display = "flex";
    setTimeout(() => modal.classList.add("ativo"), 10);
  }

  // ----------------------------------------------------------
  // EVENTOS DE ABRIR E FECHAR MODAL
  // ----------------------------------------------------------

  // COMENTADO: script-listagem.js agora gerencia o evento de abrir modal
  // container.addEventListener("click", (e) => {
  //   const btn = e.target.closest(".btn-vermais");
  //   if (!btn) return;
  //   const index = Number(btn.dataset.index);
  //   abrirModal(lista[index]);
  // });

  function fechar() {
    if (!modal) return;
    modal.classList.remove("ativo");
    setTimeout(() => (modal.style.display = "none"), 200);
  }

  [fecharModal, btnFechar, modalBackdrop].forEach((el) =>
    el?.addEventListener("click", fechar),
  );
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") fechar();
  });

  // ----------------------------------------------------------
  // NAVEGAÇÃO ENTRE IMAGENS (SETAS E SWIPE)
  // ----------------------------------------------------------

  if (btnNext && btnPrev && modalGaleria) {
    btnNext.addEventListener("click", () => {
      if (!imagensAtuais.length) return;
      indiceImagem = (indiceImagem + 1) % imagensAtuais.length;
      mostrarImagem(indiceImagem);
    });

    btnPrev.addEventListener("click", () => {
      if (!imagensAtuais.length) return;
      indiceImagem =
        (indiceImagem - 1 + imagensAtuais.length) % imagensAtuais.length;
      mostrarImagem(indiceImagem);
    });

    // Suporte a swipe em celulares
    let startX = 0;
    modalGaleria.addEventListener("touchstart", (e) => {
      startX = e.touches[0].clientX;
    });
    modalGaleria.addEventListener("touchend", (e) => {
      const endX = e.changedTouches[0].clientX;
      if (endX - startX > 50) btnPrev.click();
      else if (startX - endX > 50) btnNext.click();
    });
  }
});
