// ==========================================================
// FUNÇÕES AUXILIARES GLOBAIS
// ==========================================================

// Função para formatar atributos (singular/plural e ocultar 0)
function formatarAtributo(valor, singular, plural) {
  const num = Number(valor);
  if (isNaN(num) || num <= 0) return "";
  return num === 1 ? `${num} ${singular}` : `${num} ${plural}`;
}

// Função para validar se um objeto é um imóvel válido
function isImovelValido(imovel) {
  return imovel && typeof imovel === "object" && (imovel.id || imovel.titulo);
}

// Função para formatar valores monetários (Condomínio/IPTU)
const formatarValorDisplay = (val) => {
  const num = Number(val);
  if (isNaN(num) || num <= 0) return "";
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

// ==========================================================
// VARIÁVEIS GLOBAIS (Serão inicializadas em DOMContentLoaded)
// ==========================================================
let modalImovel;
let modalGaleria;
let fecharModalBtn;
let btnFecharModal;
let modalBackdrop;
let btnPrev;
let btnNext;
let botaoWhats;

let imagensAtuais = [];
let indiceImagem = 0;
let currentImovel = null;

// ----------------------------------------------------------
// Funções do Modal
// ----------------------------------------------------------

function updateGaleria() {
  if (!modalGaleria) return;
  const imagens = modalGaleria.querySelectorAll(".modal-img");
  imagens.forEach((img, index) => {
    img.style.display = index === indiceImagem ? "block" : "none";
  });
}

function fecharModal() {
  if (!modalImovel) {
    console.warn("modalImovel não está disponível");
    return;
  }
  modalImovel.classList.remove("ativo");
  // Adiciona um atraso para a transição CSS antes de ocultar o display
  setTimeout(() => {
    modalImovel.style.display = "none";
    document.body.style.overflow = ""; // Restaura rolagem
  }, 200);
}

function abrirModal(idImovel, imoveisListaCompleta) {
  console.log("📝 abrirModal chamado:", {
    idImovel,
    listaLength: imoveisListaCompleta?.length,
    modalImovel,
  });
  // 1. Busca o imóvel e verifica se o modal existe
  currentImovel = imoveisListaCompleta.find((imovel) => imovel.id === idImovel);
  console.log("Imóvel encontrado:", currentImovel);
  if (!currentImovel || !modalImovel) {
    console.error("Modal não pode abrir:", { currentImovel, modalImovel });
    return;
  }

  // 2. Configura a Galeria
  imagensAtuais = currentImovel.imagens?.length
    ? currentImovel.imagens
    : ["./img/sem-foto.jpg"];
  indiceImagem = 0;

  modalGaleria.innerHTML = "";
  imagensAtuais.forEach((imgSrc) => {
    const img = document.createElement("img");
    img.src = imgSrc;
    img.classList.add("modal-img");
    modalGaleria.appendChild(img);
  });

  updateGaleria();

  // 3. Preenche Textos
  document.getElementById("modalTitulo").textContent = currentImovel.titulo;
  document.getElementById("modalDescricao").textContent =
    currentImovel.descricao;

  // --- PREÇO ---
  let precoModalFormatado = Number(currentImovel.preco).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    },
  );
  if (currentImovel.tipoNegocio === "locacao") {
    precoModalFormatado += "/mês";
  }
  document.getElementById("modalPreco").textContent = `${precoModalFormatado}`;

  // 4. Preenche Specs (Combinando a melhor formatação dos dois scripts)
  const txtQuartos = formatarAtributo(
    currentImovel.quartos,
    "quarto",
    "quartos",
  );
  const txtSuites = formatarAtributo(currentImovel.suites, "suíte", "suítes");
  const txtBanheiros = formatarAtributo(
    currentImovel.banheiros,
    "banheiro",
    "banheiros",
  );
  const txtArea =
    currentImovel.areaUtil && Number(currentImovel.areaUtil) > 0
      ? `${currentImovel.areaUtil} m²`
      : "";
  const txtVagas = formatarAtributo(currentImovel.vagas, "vaga", "vagas");

  const garagemTxt =
    currentImovel.garagem === "Com garagem" && txtVagas
      ? `Garagem (${txtVagas})`
      : currentImovel.garagem === "Sem garagem"
        ? "Sem Garagem"
        : "";

  // Exibição do nome do condomínio (removido o condominioStatus que estava causando undefined)
  let condominioInfo = "";
  if (currentImovel.condominio && currentImovel.condominio.trim() !== "") {
    condominioInfo = currentImovel.condominio;
  }

  const specsArray = [
    txtArea,
    txtQuartos,
    txtSuites,
    txtBanheiros,
    garagemTxt,
    condominioInfo,
  ].filter(Boolean);
  const specsHtml = specsArray.length
    ? `<p class="spec-line-1">${specsArray.join(" • ")}</p>`
    : "";

  const valorCondominioTxt = formatarValorDisplay(
    currentImovel.valorCondominio,
  );
  const valorIPTUTxt = formatarValorDisplay(currentImovel.valorIPTU);
  const condominioDisplay = valorCondominioTxt
    ? `Condomínio: ${valorCondominioTxt}`
    : "";
  const iptuDisplay = valorIPTUTxt ? `IPTU: ${valorIPTUTxt}` : "";
  const separador = condominioDisplay && iptuDisplay ? " | " : "";
  const valoresHtml =
    condominioDisplay || iptuDisplay
      ? `<p class="spec-line-valores">${condominioDisplay}${separador}${iptuDisplay}</p>`
      : "";

  const caracteristicasArray = currentImovel.caracteristicas?.length
    ? currentImovel.caracteristicas
    : [];
  const caracteristicasHtml = caracteristicasArray.length
    ? `<p class="spec-line-2"><strong>Características:</strong> ${caracteristicasArray.join(
        " • ",
      )}</p>`
    : "";

  document.getElementById("modalSpecs").innerHTML =
    specsHtml + valoresHtml + caracteristicasHtml;

  // 5. Link do WhatsApp
  const mensagemWhats = encodeURIComponent(
    `Olá, Gabrielly! Tenho interesse no imóvel "${currentImovel.titulo}". Poderia me dar mais informações?`,
  );
  if (botaoWhats)
    botaoWhats.href = `https://wa.me/557592112142?text=${mensagemWhats}`;

  // 6. Abertura do modal (CORREÇÃO APLICADA AQUI)
  modalImovel.style.display = "flex"; // 👈 Passo 1: Torna o container visível (importante!)
  setTimeout(() => {
    modalImovel.classList.add("ativo"); // 👈 Passo 2: Adiciona a classe para a transição/efeito CSS
    document.body.style.overflow = "hidden";
  }, 10);
}

// ----------------------------------------------------------
// RENDERIZAÇÃO E FILTRO PRINCIPAL
// ----------------------------------------------------------

async function carregarImoveis(tipoImovel, containerId) {
  console.log("carregarImoveis() chamado com:", { tipoImovel, containerId });

  const listaContainer = document.getElementById(containerId);
  const loadingContainer = document.getElementById("loadingImoveis");
  const filtroBairroSelect = document.getElementById("filtroBairro");
  const filtroCategoriaSelect = document.getElementById("filtroCategoria"); // NOVO: Elemento do filtro de categoria

  // Mostra loading
  if (loadingContainer) loadingContainer.style.display = "flex";
  if (listaContainer) listaContainer.style.display = "none";

  // Buscar imóveis do Supabase
  let imoveis = [];
  // Normalizar para minúsculas sempre
  const tipoFiltro = (tipoImovel || "venda").toLowerCase();
  console.log(
    "Filtrando imóveis por tipo:",
    tipoFiltro,
    "(entrada original:",
    tipoImovel,
    ")",
  );

  try {
    const data = await DB.imoveis.listarPorTipo(tipoFiltro);
    console.log("Imóveis retornados do Supabase:", data.length, data);

    // Converter formato Supabase para formato esperado
    imoveis = data.map((imovel) => ({
      id: imovel.id,
      titulo: imovel.titulo,
      descricao: imovel.descricao,
      tipoNegocio: imovel.tipo_negocio, // Usar o valor real do banco
      categoria: imovel.categoria,
      preco: imovel.valor,
      cep: imovel.cep,
      endereco: imovel.endereco,
      numero: imovel.numero,
      complemento: imovel.complemento,
      bairro: imovel.bairro,
      cidade: imovel.cidade,
      estado: imovel.estado,
      quartos: imovel.quartos,
      banheiros: imovel.banheiros,
      vagas: imovel.vagas,
      area: imovel.area,
      areaUtil: imovel.area,
      suites: imovel.suites || 0,
      garagem: imovel.vagas > 0 ? "Com garagem" : "Sem garagem",
      condominio: imovel.condominio || "",
      valorCondominio: imovel.valor_condominio || 0,
      valorIPTU: imovel.valor_iptu || 0,
      caracteristicas: Array.isArray(imovel.caracteristicas)
        ? imovel.caracteristicas
        : [],
      imagens: imovel.imagens || [],
      fotos: imovel.imagens || [],
    }));

    // Filtro extra por segurança (caso o Supabase retorne dados incorretos)
    imoveis = imoveis.filter((imovel) => imovel.tipoNegocio === tipoFiltro);
    console.log("Imóveis após filtro local:", imoveis.length);

    // Se Supabase não retornar nada, tenta localStorage
    if (imoveis.length === 0) {
      console.log("Supabase vazio, tentando localStorage...");
      const imoveisLocal = JSON.parse(localStorage.getItem("imoveis")) || [];
      imoveis = imoveisLocal.filter((imovel) => {
        const tipoImovelNormalizado = (
          imovel.tipoNegocio ||
          imovel.tipo ||
          ""
        ).toLowerCase();
        return (
          tipoImovelNormalizado === tipoFiltro ||
          tipoImovelNormalizado === tipoFiltro.replace("ção", "cao")
        );
      });
      console.log("📂 Imóveis encontrados no localStorage:", imoveis.length);
    }
  } catch (error) {
    console.error("Erro ao carregar imóveis do Supabase:", error);
    // Fallback para localStorage em caso de erro
    const imoveisLocal = JSON.parse(localStorage.getItem("imoveis")) || [];
    imoveis = imoveisLocal.filter((imovel) => {
      const tipoImovelNormalizado = (
        imovel.tipoNegocio ||
        imovel.tipo ||
        ""
      ).toLowerCase();
      return (
        tipoImovelNormalizado === tipoFiltro ||
        tipoImovelNormalizado === tipoFiltro.replace("ção", "cao")
      );
    });
    console.log(
      "📂 Fallback localStorage:",
      imoveis.length,
      "imóveis encontrados",
    );
  }

  if (!listaContainer) {
    console.error("Container de lista não encontrado:", containerId);
    return;
  }

  let imoveisFiltradosPorTipo = imoveis;

  // 1. Popula Filtro de Bairro
  const bairrosUnicos = [
    ...new Set(imoveisFiltradosPorTipo.map((imovel) => imovel.bairro)),
  ].sort();

  if (filtroBairroSelect) {
    filtroBairroSelect.innerHTML = '<option value="">Todos os Bairros</option>';
    bairrosUnicos.forEach((bairro) => {
      if (bairro && bairro.trim() !== "") {
        const option = document.createElement("option");
        option.value = bairro;
        option.textContent = bairro;
        filtroBairroSelect.appendChild(option);
      }
    });
  }

  // 2. Popula Filtro de Categoria (NOVO)
  const categoriasUnicas = [
    ...new Set(imoveisFiltradosPorTipo.map((imovel) => imovel.categoria)),
  ].sort();

  if (filtroCategoriaSelect) {
    filtroCategoriaSelect.innerHTML =
      '<option value="">Todas as Categorias</option>';
    categoriasUnicas.forEach((categoria) => {
      if (categoria && categoria.trim() !== "") {
        const option = document.createElement("option");
        option.value = categoria;
        option.textContent = categoria;
        filtroCategoriaSelect.appendChild(option);
      }
    });
  }

  function renderizarImoveis(imoveisParaRenderizar) {
    listaContainer.innerHTML = "";

    if (imoveisParaRenderizar.length === 0) {
      listaContainer.innerHTML =
        '<p style="text-align: center; color: #c9a961; font-size: 1.2rem; padding: 2rem;">Nenhum imóvel encontrado para os filtros selecionados.</p>';
      return;
    }

    imoveisParaRenderizar.forEach((imovel, index) => {
      // Garante que o imóvel tem um ID
      if (!imovel.id) {
        imovel.id = `imovel-${Date.now()}-${index}`;
        console.warn("Imóvel sem ID, gerando:", imovel.id);
      }

      const article = document.createElement("article");
      article.setAttribute("data-id", imovel.id);
      article.classList.add("card-imovel");

      // Formatação do preço e specs primárias para o CARD (lógica correta)
      let precoFormatado = Number(imovel.preco).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
      if (imovel.tipoNegocio === "locacao") precoFormatado += "/mês";

      const txtQuartos = formatarAtributo(imovel.quartos, "quarto", "quartos");
      const txtBanheiros = formatarAtributo(
        imovel.banheiros,
        "banheiro",
        "banheiros",
      );
      const txtSuites = formatarAtributo(imovel.suites, "suíte", "suítes");
      const txtArea =
        imovel.areaUtil && Number(imovel.areaUtil) > 0
          ? `${imovel.areaUtil} m²`
          : "";
      const specsPrimarias = [txtQuartos, txtBanheiros, txtSuites, txtArea]
        .filter(Boolean)
        .join(" | ");

      const descricaoCortada =
        imovel.descricao.length > 120
          ? imovel.descricao.slice(0, 120) + "..."
          : imovel.descricao;

      article.innerHTML = `
                <img src="${
                  imovel.imagens && imovel.imagens[0]
                    ? imovel.imagens[0]
                    : "./img/sem-foto.jpg"
                }" alt="${imovel.titulo}" class="img-imovel">
                <div class="info-imovel">
                    <h2>${imovel.titulo}</h2>
                    <p>${descricaoCortada}</p>
                    <p><strong>${precoFormatado}</strong></p>
                    <p>${specsPrimarias}</p>
                    <button class="btn-vermais" data-id="${
                      imovel.id
                    }">Ver Mais</button>
                </div>
            `;
      listaContainer.appendChild(article);
    });
  }

  // Função para aplicar todos os filtros
  function aplicarFiltros() {
    const bairroSelecionado = filtroBairroSelect
      ? filtroBairroSelect.value
      : "";
    const categoriaSelecionada = filtroCategoriaSelect
      ? filtroCategoriaSelect.value
      : ""; // NOVO: Valor da categoria

    let imoveisFiltradosFinal = imoveisFiltradosPorTipo;

    if (bairroSelecionado) {
      imoveisFiltradosFinal = imoveisFiltradosFinal.filter(
        (imovel) => imovel.bairro === bairroSelecionado,
      );
    }

    // NOVO: Aplica o filtro de categoria
    if (categoriaSelecionada) {
      imoveisFiltradosFinal = imoveisFiltradosFinal.filter(
        (imovel) => imovel.categoria === categoriaSelecionada,
      );
    }

    renderizarImoveis(imoveisFiltradosFinal);
  }

  // 3. Event Listeners para os filtros
  if (filtroBairroSelect) {
    filtroBairroSelect.addEventListener("change", aplicarFiltros);
  }
  if (filtroCategoriaSelect) {
    // NOVO: Event listener para o filtro de categoria
    filtroCategoriaSelect.addEventListener("change", aplicarFiltros);
  }

  // 4. Event Delegation para botões "Ver Mais" (funciona mesmo após filtros)
  console.log("Event delegation configurado para:", listaContainer);
  listaContainer.addEventListener("click", (event) => {
    const target = event.target.closest(".btn-vermais");
    if (target) {
      event.preventDefault();
      event.stopPropagation();
      const imovelId = target.dataset.id || target.getAttribute("data-id");
      console.log("✅ Clicou em Ver Mais - ID:", imovelId, "Target:", target);
      if (imovelId) {
        abrirModal(imovelId, imoveisFiltradosPorTipo);
      }
    }
  });

  // 5. Renderiza os imóveis inicialmente
  aplicarFiltros(); // Chama a função de aplicar filtros na carga inicial

  // Esconde loading e mostra lista
  if (loadingContainer) loadingContainer.style.display = "none";
  if (listaContainer) listaContainer.style.display = "grid";
}

// ==========================================================
// INICIALIZAÇÃO E EVENT LISTENERS DO DOM (ROBUSTO)
// ==========================================================

document.addEventListener("DOMContentLoaded", () => {
  // 1. Captura de Elementos do Modal (GARANTIDO APÓS O HTML)
  modalImovel = document.getElementById("modalImovel");
  modalGaleria = document.getElementById("modalGaleria");
  fecharModalBtn = document.getElementById("fecharModal");
  btnFecharModal = document.getElementById("btnFechar");
  modalBackdrop = document.getElementById("modalBackdrop");
  btnPrev = document.getElementById("btnPrev");
  btnNext = document.getElementById("btnNext");
  botaoWhats = document.getElementById("botaoWhats");

  // 2. Inicialização do WhatsApp Balão (do main.js)
  const balao = document.getElementById("whatsapp-balao");
  if (balao) {
    balao.style.opacity = 0;
    setTimeout(() => {
      balao.style.transition = "opacity 1s ease-in-out";
      balao.style.opacity = 1;
    }, 1000);
  }

  // 3. Carregamento da Listagem
  const pathname = location.pathname;
  const href = location.href;
  console.log("📍 Pathname atual:", pathname);
  console.log("📍 URL completa:", href);

  let tipoPagina = "venda"; // Padrão

  // Detectar tipo de página de forma mais robusta
  if (
    pathname.includes("locacao") ||
    href.includes("locacao") ||
    pathname.includes("/tela-inicial/locacao")
  ) {
    tipoPagina = "locacao";
  } else if (
    pathname.includes("vendas") ||
    pathname.includes("venda") ||
    href.includes("vendas")
  ) {
    tipoPagina = "venda";
  }

  console.log("🏷️ Tipo de página detectado:", tipoPagina);
  console.log("🔍 Vai buscar imóveis do tipo:", tipoPagina);
  const containerId = "listaImoveisSite"; // ID padrão do main.js

  if (document.getElementById(containerId)) {
    console.log("✅ Container encontrado, iniciando carregamento...");
    carregarImoveis(tipoPagina, containerId);
  } else {
    console.log("❌ Container não encontrado:", containerId);
  }

  // 4. Event Listeners de Fechamento do Modal
  if (fecharModalBtn) fecharModalBtn.addEventListener("click", fecharModal);
  if (btnFecharModal) btnFecharModal.addEventListener("click", fecharModal);
  if (modalBackdrop) modalBackdrop.addEventListener("click", fecharModal);

  // Suporte a Esc para fechar
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") fecharModal();
  });

  // 5. Event Listeners de Navegação da Galeria (do main.js)
  if (btnPrev && btnNext) {
    btnPrev.addEventListener("click", () => {
      if (imagensAtuais.length > 0) {
        indiceImagem =
          (indiceImagem - 1 + imagensAtuais.length) % imagensAtuais.length;
        updateGaleria();
      }
    });

    btnNext.addEventListener("click", () => {
      if (imagensAtuais.length > 0) {
        indiceImagem = (indiceImagem + 1) % imagensAtuais.length;
        updateGaleria();
      }
    });

    // Suporte a swipe em celulares
    if (modalGaleria) {
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
  }
});
