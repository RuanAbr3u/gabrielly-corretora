const TELEFONE_WHATSAPP = "557592112142";
const IMAGEM_FALLBACK = "./img/1384171.jpg";

let modalImovel;
let modalGaleria;
let imagensAtuais = [];
let indiceImagem = 0;
let imoveisCarregados = [];

function comTimeout(promise, ms, mensagem) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(mensagem)), ms);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function formatarAtributo(valor, singular, plural) {
  const num = Number(valor);
  if (Number.isNaN(num) || num <= 0) return "";
  return num === 1 ? `${num} ${singular}` : `${num} ${plural}`;
}

function formatarMoeda(valor) {
  const num = Number(valor);
  if (Number.isNaN(num)) return "Valor sob consulta";
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function escaparHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizarTexto(valor) {
  return String(valor ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizarImovel(imovel) {
  const imagens = imovel.imagens || imovel.fotos || [];
  const tipoOriginal = imovel.tipo_negocio || imovel.tipoNegocio || imovel.tipo || "";
  const tipoNegocio = normalizarTexto(tipoOriginal);
  const cidadeOriginal = imovel.cidade || "";
  const estadoOriginal = imovel.estado || "";
  const localizacaoIncorreta =
    normalizarTexto(cidadeOriginal) === "brasilia" && normalizarTexto(estadoOriginal) === "df";
  const cidade = localizacaoIncorreta ? "Feira de Santana" : cidadeOriginal;
  const estado = localizacaoIncorreta ? "BA" : estadoOriginal;

  return {
    id: imovel.id || `imovel-${crypto.randomUUID?.() || Date.now()}`,
    titulo: imovel.titulo || "Imóvel",
    descricao: imovel.descricao || "",
    tipoNegocio,
    categoria: imovel.categoria || "",
    preco: imovel.valor ?? imovel.preco ?? 0,
    bairro: imovel.bairro || "",
    cidade,
    estado,
    quartos: imovel.quartos || 0,
    banheiros: imovel.banheiros || 0,
    suites: imovel.suites || 0,
    vagas: imovel.vagas || 0,
    areaUtil: imovel.area || imovel.areaUtil || 0,
    garagem: Number(imovel.vagas || 0) > 0 ? "Com garagem" : imovel.garagem || "",
    condominio: imovel.condominio || "",
    valorCondominio: imovel.valor_condominio || imovel.valorCondominio || 0,
    valorIPTU: imovel.valor_iptu || imovel.valorIPTU || 0,
    caracteristicas: Array.isArray(imovel.caracteristicas) ? imovel.caracteristicas : [],
    imagens: Array.isArray(imagens) ? imagens.filter(Boolean) : [],
  };
}

function updateGaleria() {
  if (!modalGaleria) return;
  modalGaleria.querySelectorAll(".modal-img").forEach((img, index) => {
    img.style.display = index === indiceImagem ? "block" : "none";
  });
}

function fecharModal() {
  if (!modalImovel) return;
  modalImovel.classList.remove("ativo");
  document.body.style.overflow = "";
  setTimeout(() => {
    modalImovel.hidden = true;
    modalImovel.style.display = "none";
  }, 180);
}

function abrirModal(idImovel) {
  const imovel = imoveisCarregados.find((item) => String(item.id) === String(idImovel));
  if (!imovel || !modalImovel || !modalGaleria) return;

  imagensAtuais = imovel.imagens.length ? imovel.imagens : [IMAGEM_FALLBACK];
  indiceImagem = 0;
  modalGaleria.innerHTML = "";

  imagensAtuais.forEach((src, index) => {
    const img = document.createElement("img");
    img.src = src;
    img.alt = `${imovel.titulo} - imagem ${index + 1}`;
    img.className = "modal-img";
    img.loading = "lazy";
    img.decoding = "async";
    modalGaleria.appendChild(img);
  });

  const preco = `${formatarMoeda(imovel.preco)}${imovel.tipoNegocio === "locacao" ? "/mês" : ""}`;
  const txtQuartos = formatarAtributo(imovel.quartos, "quarto", "quartos");
  const txtSuites = formatarAtributo(imovel.suites, "suíte", "suítes");
  const txtBanheiros = formatarAtributo(imovel.banheiros, "banheiro", "banheiros");
  const txtVagas = formatarAtributo(imovel.vagas, "vaga", "vagas");
  const txtArea = Number(imovel.areaUtil) > 0 ? `${imovel.areaUtil} m²` : "";
  const garagemTxt = imovel.garagem === "Com garagem" && txtVagas ? `Garagem (${txtVagas})` : imovel.garagem;
  const localizacao = [imovel.bairro, imovel.cidade, imovel.estado].filter(Boolean).join(", ");
  const specs = [imovel.categoria, txtArea, txtQuartos, txtSuites, txtBanheiros, garagemTxt, imovel.condominio]
    .filter(Boolean)
    .map(escaparHtml)
    .join(" • ");
  const valores = [
    Number(imovel.valorCondominio) > 0 ? `Condomínio: ${formatarMoeda(imovel.valorCondominio)}` : "",
    Number(imovel.valorIPTU) > 0 ? `IPTU: ${formatarMoeda(imovel.valorIPTU)}` : "",
  ].filter(Boolean).join(" | ");
  const caracteristicas = imovel.caracteristicas.length
    ? `<p><strong>Características:</strong> ${imovel.caracteristicas.map(escaparHtml).join(" • ")}</p>`
    : "";

  const modalSpecs = [imovel.categoria, txtArea, txtQuartos, txtSuites, txtBanheiros, garagemTxt, imovel.condominio].filter(Boolean);
  const modalValores = [
    Number(imovel.valorCondominio) > 0 ? `Condominio: ${formatarMoeda(imovel.valorCondominio)}` : "",
    Number(imovel.valorIPTU) > 0 ? `IPTU: ${formatarMoeda(imovel.valorIPTU)}` : "",
  ].filter(Boolean);
  const modalCaracteristicas = imovel.caracteristicas.length
    ? `<div class="modal-spec-group"><span class="modal-spec-label">Caracteristicas</span><div class="modal-spec-chips">${imovel.caracteristicas.map((item) => `<span>${escaparHtml(item)}</span>`).join("")}</div></div>`
    : "";

  document.getElementById("modalTitulo").textContent = imovel.titulo;
  document.getElementById("modalDescricao").textContent = imovel.descricao;
  document.getElementById("modalPreco").textContent = preco;
  document.getElementById("modalSpecs").innerHTML = `
    ${localizacao ? `<p class="modal-location">${escaparHtml(localizacao)}</p>` : ""}
    ${modalSpecs.length ? `<div class="modal-spec-chips">${modalSpecs.map((spec) => `<span>${escaparHtml(spec)}</span>`).join("")}</div>` : ""}
    ${modalValores.length ? `<div class="modal-costs">${modalValores.map((valor) => `<span>${escaparHtml(valor)}</span>`).join("")}</div>` : ""}
    ${modalCaracteristicas}
  `;

  const mensagem = encodeURIComponent(`Olá, Gabrielly! Tenho interesse no imóvel "${imovel.titulo}". Poderia me dar mais informações?`);
  const botaoWhats = document.getElementById("botaoWhats");
  if (botaoWhats) botaoWhats.href = `https://wa.me/${TELEFONE_WHATSAPP}?text=${mensagem}`;

  updateGaleria();
  modalImovel.hidden = false;
  modalImovel.style.display = "flex";
  setTimeout(() => modalImovel.classList.add("ativo"), 10);
  document.body.style.overflow = "hidden";
}

async function buscarImoveis(tipoFiltro) {
  try {
    if (!window.DB?.imoveis?.listarPorTipo) {
      throw new Error("Supabase indisponível.");
    }

    const data = await DB.imoveis.listarPorTipo(tipoFiltro);
    const imoveisSupabase = data.map(normalizarImovel).filter((imovel) => imovel.tipoNegocio === tipoFiltro);
    if (imoveisSupabase.length > 0) return imoveisSupabase;
  } catch (error) {
    console.warn("Wrapper Supabase indisponivel para imoveis:", error.message);
  }

  try {
    const imoveisRest = await buscarImoveisRest(tipoFiltro);
    if (imoveisRest.length > 0) return imoveisRest;
  } catch (error) {
    console.warn("REST Supabase indisponivel para imoveis:", error.message);
  }

  console.warn("Usando fallback localStorage para imoveis.");
  const locais = JSON.parse(localStorage.getItem("imoveis")) || [];
  return locais
    .map(normalizarImovel)
    .filter((imovel) => {
      const tipo = (imovel.tipoNegocio || "").toLowerCase();
      return tipo === tipoFiltro;
    });
}

async function buscarImoveisRest(tipoFiltro) {
  const config = window.APP_CONFIG?.supabase;
  if (!config?.url || !config?.key) {
    throw new Error("Configuracao do Supabase indisponivel.");
  }

  const endpoint = new URL(`${config.url}/rest/v1/imoveis`);
  endpoint.searchParams.set("select", "*");
  endpoint.searchParams.set("tipo_negocio", `ilike.${tipoFiltro}`);
  endpoint.searchParams.set("order", "created_at.desc");

  const response = await fetch(endpoint.toString(), {
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Supabase REST ${response.status}`);
  }

  const data = await response.json();
  return data.map(normalizarImovel).filter((imovel) => imovel.tipoNegocio === tipoFiltro);
}

function popularFiltro(select, valores, labelPadrao) {
  if (!select) return;
  select.innerHTML = `<option value="">${labelPadrao}</option>`;
  [...new Set(valores.filter(Boolean))].sort().forEach((valor) => {
    const option = document.createElement("option");
    option.value = valor;
    option.textContent = valor;
    select.appendChild(option);
  });
}

function renderizarImoveis(lista, container) {
  container.innerHTML = "";
  container.classList.toggle("grid-imoveis-single", lista.length === 1);

  if (lista.length === 0) {
    container.innerHTML = '<p class="empty-state">Nenhum imóvel encontrado para os filtros selecionados.</p>';
    return;
  }

  lista.forEach((imovel) => {
    const finalidade = imovel.tipoNegocio === "locacao" ? "Locação" : "Venda";
    const preco = `${formatarMoeda(imovel.preco)}${imovel.tipoNegocio === "locacao" ? "/mês" : ""}`;
    const descricao = imovel.descricao.length > 120 ? `${imovel.descricao.slice(0, 120)}...` : imovel.descricao;
    const localizacao = [imovel.bairro, imovel.cidade, imovel.estado].filter(Boolean).join(", ");
    const specs = [
      formatarAtributo(imovel.quartos, "quarto", "quartos"),
      formatarAtributo(imovel.banheiros, "banheiro", "banheiros"),
      formatarAtributo(imovel.vagas, "vaga", "vagas"),
      Number(imovel.areaUtil) > 0 ? `${imovel.areaUtil} m²` : "",
    ].filter(Boolean);
    const mensagem = encodeURIComponent(`Olá, Gabrielly! Tenho interesse no imóvel "${imovel.titulo}".`);

    const article = document.createElement("article");
    article.className = "card-imovel";
    article.dataset.id = imovel.id;
    article.innerHTML = `
      <div class="property-image-wrap">
        <img src="${escaparHtml(imovel.imagens[0] || IMAGEM_FALLBACK)}" alt="${escaparHtml(imovel.titulo)}" class="img-imovel" loading="lazy" decoding="async">
        <span class="property-watermark" aria-hidden="true"></span>
      </div>
      <div class="info-imovel">
        <div class="property-badges">
          <span class="property-badge">${finalidade}</span>
          ${imovel.categoria ? `<span class="property-badge">${escaparHtml(imovel.categoria)}</span>` : ""}
        </div>
        <h2>${escaparHtml(imovel.titulo)}</h2>
        ${localizacao ? `<p>${escaparHtml(localizacao)}</p>` : ""}
        ${descricao ? `<p>${escaparHtml(descricao)}</p>` : ""}
        <p class="property-price">${escaparHtml(preco)}</p>
        <div class="property-badges">${specs.map((spec) => `<span class="property-badge">${escaparHtml(spec)}</span>`).join("")}</div>
        <div class="card-actions">
          <button class="btn-vermais" type="button" data-id="${escaparHtml(imovel.id)}">Ver detalhes</button>
          <a class="btn btn-outline" href="https://wa.me/${TELEFONE_WHATSAPP}?text=${mensagem}" target="_blank" rel="noopener noreferrer">Contato</a>
        </div>
      </div>
    `;
    container.appendChild(article);
  });
}

async function carregarImoveis(tipoImovel, containerId) {
  const container = document.getElementById(containerId);
  const loading = document.getElementById("loadingImoveis");
  const filtroBairro = document.getElementById("filtroBairro");
  const filtroCategoria = document.getElementById("filtroCategoria");
  if (!container) return;

  const tipoFiltro = (tipoImovel || "venda").toLowerCase();
  if (loading) loading.style.display = "flex";
  container.hidden = true;
  container.style.display = "none";

  try {
    imoveisCarregados = await comTimeout(buscarImoveis(tipoFiltro), 10000, "Tempo limite ao carregar imoveis.");
    popularFiltro(filtroBairro, imoveisCarregados.map((imovel) => imovel.bairro), "Todos os bairros");
    popularFiltro(filtroCategoria, imoveisCarregados.map((imovel) => imovel.categoria), "Todas as categorias");

    const aplicarFiltros = () => {
      const bairro = filtroBairro?.value || "";
      const categoria = filtroCategoria?.value || "";
      const filtrados = imoveisCarregados.filter((imovel) => {
        return (!bairro || imovel.bairro === bairro) && (!categoria || imovel.categoria === categoria);
      });
      renderizarImoveis(filtrados, container);
    };

    filtroBairro?.addEventListener("change", aplicarFiltros);
    filtroCategoria?.addEventListener("change", aplicarFiltros);
    container.addEventListener("click", (event) => {
      const button = event.target.closest(".btn-vermais");
      if (button) abrirModal(button.dataset.id);
    });

    aplicarFiltros();
  } catch (error) {
    console.warn("Nao foi possivel carregar os imoveis:", error.message);
    imoveisCarregados = [];
    container.classList.remove("grid-imoveis-single");
    container.innerHTML = '<p class="empty-state">Nao foi possivel carregar os imoveis agora. Tente novamente em instantes.</p>';
  } finally {
    if (loading) loading.style.display = "none";
    container.hidden = false;
    container.style.display = "grid";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  modalImovel = document.getElementById("modalImovel");
  modalGaleria = document.getElementById("modalGaleria");

  const pathname = location.pathname.toLowerCase();
  const tipoPagina = pathname.includes("locacao") ? "locacao" : "venda";
  if (document.getElementById("listaImoveisSite")) {
    carregarImoveis(tipoPagina, "listaImoveisSite");
  }

  document.getElementById("fecharModal")?.addEventListener("click", fecharModal);
  document.getElementById("btnFechar")?.addEventListener("click", fecharModal);
  document.getElementById("modalBackdrop")?.addEventListener("click", fecharModal);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") fecharModal();
  });

  document.getElementById("btnPrev")?.addEventListener("click", () => {
    if (!imagensAtuais.length) return;
    indiceImagem = (indiceImagem - 1 + imagensAtuais.length) % imagensAtuais.length;
    updateGaleria();
  });

  document.getElementById("btnNext")?.addEventListener("click", () => {
    if (!imagensAtuais.length) return;
    indiceImagem = (indiceImagem + 1) % imagensAtuais.length;
    updateGaleria();
  });

  let startX = 0;
  modalGaleria?.addEventListener("touchstart", (event) => {
    startX = event.touches[0].clientX;
  });
  modalGaleria?.addEventListener("touchend", (event) => {
    const endX = event.changedTouches[0].clientX;
    if (endX - startX > 50) document.getElementById("btnPrev")?.click();
    if (startX - endX > 50) document.getElementById("btnNext")?.click();
  });
});
