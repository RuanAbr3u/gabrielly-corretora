const isLocal =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";
const API_BASE_URL = isLocal
  ? "http://localhost:3001"
  : "https://gabrielly-corretora.onrender.com";

async function fetchWithAuth(url, options = {}) {
  // ✅ Usar URL absoluta se API_BASE_URL for fornecido
  const fullUrl = url.startsWith("http") ? url : `${API_BASE_URL}${url}`;

  // Adicionar Authorization header se token existir no sessionStorage
  const storedToken = sessionStorage.getItem("authToken");
  const authHeaders = storedToken
    ? { Authorization: `Bearer ${storedToken}` }
    : {};

  const response = await fetch(fullUrl, {
    ...options,
    headers: {
      ...authHeaders,
      ...options.headers,
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  // ✅ Se 401, assumir token expirado
  if (response.status === 401) {
    console.warn("Token expirado, redirecionando para login");
    // Limpar qualquer dado em localStorage (compatibilidade)
    localStorage.removeItem("savedEmail");
    window.location.href = "login.html?expired=true";
    throw new Error("Token expirado");
  }

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ message: "Erro desconhecido" }));
    throw new Error(errorData.message || `HTTP ${response.status}`);
  }

  return response.json().catch(() => {
    throw new Error("Resposta inválida do servidor");
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  // Elements
  const form = document.getElementById("formImovel");
  const listaImoveis = document.getElementById("listaImoveis");
  const preview = document.getElementById("preview");
  const garagemOpcao = document.getElementById("garagemOpcao");
  const garagemVagas = document.getElementById("garagemVagas");
  const inputImagens = document.getElementById("imagens");

  // Filtros e controles de listagem
  const filterTitle = document.getElementById("filterTitle");
  const filterTipo = document.getElementById("filterTipo");
  const filterCategoria = document.getElementById("filterCategoria");
  const filterBairro = document.getElementById("filterBairro");
  const filterProprietario = document.getElementById("filterProprietario");
  const filterDisponibilidade = document.getElementById(
    "filterDisponibilidade",
  );
  const limparFiltrosBtn = document.getElementById("limparFiltros");
  const perPageSelect = document.getElementById("perPage");
  const exportBtn = document.getElementById("exportBtn");
  let currentPage = 1;
  const ITEMS_PER_PAGE = 12;
  let itemsPerPage = ITEMS_PER_PAGE;
  const paginationEl = document.createElement("div");
  paginationEl.className = "pagination";

  // ✅ SEGURANÇA: Autenticação obrigatória antes de renderizar painel
  // Validar JWT com backend usando cookies HttpOnly ou Authorization header
  try {
    console.log(
      "🔐 Validando autenticação com:",
      `${API_BASE_URL}/api/auth/validar`,
    );

    // Montar headers com Authorization header como fallback ao cookie
    const authHeaders = { "Content-Type": "application/json" };
    const storedToken = sessionStorage.getItem("authToken");
    if (storedToken) {
      authHeaders["Authorization"] = `Bearer ${storedToken}`;
      console.log("🔑 Usando token do sessionStorage via Authorization header");
    } else {
      console.log("🍪 Tentando autenticação via cookie");
    }

    const resp = await fetch(`${API_BASE_URL}/api/auth/validar`, {
      method: "GET",
      credentials: "include",
      headers: authHeaders,
    });

    console.log("📡 Status da resposta:", resp.status, resp.statusText);

    let data;
    try {
      data = await resp.json();
      console.log("📊 Dados recebidos:", data);
    } catch (e) {
      console.error("❌ Erro ao parsear JSON:", e);
      console.log("📝 Resposta bruta:", await resp.text());
      throw e;
    }

    if (!resp.ok || !data.success) {
      console.warn("❌ Autenticação falhou:", data);
      console.log("⏳ Redirecionando para login em 2 segundos...");
      // Sessão inválida, redirecionar para login
      setTimeout(() => {
        window.location.href = "login.html?session=invalid";
      }, 2000);
      throw new Error("Sessão inválida");
    }

    // ✅ Exibir nome do usuário autenticado
    const userEmailSpan = document.getElementById("userEmail");
    if (userEmailSpan && data.usuario) {
      userEmailSpan.textContent = data.usuario.nome || "Gabrielly Silva";
    }

    console.log(
      "✅ Usuário autenticado:",
      data.usuario.nome || data.usuario.email,
    );

    // Salvar nome no sessionStorage para uso posterior
    if (data.usuario.nome) {
      sessionStorage.setItem("userName", data.usuario.nome);
    }
  } catch (err) {
    console.error("❌ Erro na autenticação:", err);
    console.log("⏳ Redirecionando para login em 2 segundos...");
    // Redirecionar para login em qualquer erro
    setTimeout(() => {
      window.location.href = "login.html?error=auth_failed";
    }, 2000);
    throw err;
  }

  // ...existing code...

  // Características dinâmicas
  async function carregarCaracteristicasDinamicas() {
    const div = document.getElementById("caracteristicas-dinamicas");
    if (!div) {
      console.warn("⚠️ Elemento caracteristicas-dinamicas não encontrado");
      return;
    }

    div.innerHTML = "⏳ Carregando características...";

    try {
      // Aguardar DB estar disponível (até 5 segundos)
      let tentativas = 0;
      while ((!window.DB || !window.DB.caracteristicas) && tentativas < 10) {
        console.warn(
          `⚠️ DB não está pronto, aguardando... (${tentativas + 1}/10)`,
        );
        await new Promise((resolve) => setTimeout(resolve, 500));
        tentativas++;
      }

      if (!window.DB || !window.DB.caracteristicas) {
        throw new Error("DB indisponível após aguardar");
      }

      // Carregar características do Supabase
      const caracteristicas = await DB.caracteristicas.listar();

      const lista =
        caracteristicas && caracteristicas.length > 0
          ? caracteristicas.map((c) => c.nome)
          : [
              "Área de serviço",
              "Cozinha",
              "Sala de almoço",
              "Sala de estar",
              "Varanda",
            ];

      div.innerHTML = "";

      lista.forEach((carac) => {
        const label = document.createElement("label");
        label.innerHTML = `<input type="checkbox" name="caracteristicas" value="${carac}"> ${carac}`;
        div.appendChild(label);
      });
    } catch (error) {
      console.error("Erro ao carregar características:", error);

      // Fallback com características padrão
      const lista = [
        "Área de serviço",
        "Cozinha",
        "Sala de almoço",
        "Sala de estar",
        "Varanda",
      ];
      div.innerHTML = "";
      lista.forEach((carac) => {
        const label = document.createElement("label");
        label.innerHTML = `<input type="checkbox" name="caracteristicas" value="${carac}"> ${carac}`;
        div.appendChild(label);
      });

      console.log("⚠️ Usando características padrão por erro");
    }
  }

  // Chamar ao iniciar
  carregarCaracteristicasDinamicas();

  // Função para atualizar características (chamada de outras telas)
  window.atualizarCaracteristicasPainel = carregarCaracteristicasDinamicas;

  // Buscar CEP via ViaCEP
  const btnBuscarCep = document.getElementById("btnBuscarCep");
  const inputCepImovel = document.getElementById("cepImovel");
  const inputEnderecoImovel = document.getElementById("enderecoImovel");
  const selectBairro = document.getElementById("bairro");

  if (btnBuscarCep && inputCepImovel) {
    // Aplicar máscara ao CEP
    inputCepImovel.addEventListener("input", function (e) {
      const digitos = e.target.value.replace(/\D/g, "").slice(0, 8);
      if (digitos.length <= 5) {
        e.target.value = digitos;
      } else {
        e.target.value = digitos.replace(/(\d{5})(\d{0,3})/, "$1-$2");
      }
    });

    btnBuscarCep.addEventListener("click", async function () {
      const cep = inputCepImovel.value.replace(/\D/g, "");

      if (cep.length !== 8) {
        showToast("Digite um CEP válido (8 dígitos)", "error");
        return;
      }

      btnBuscarCep.textContent = "⏳ Buscando...";
      btnBuscarCep.disabled = true;

      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);

        if (!response.ok) {
          throw new Error(`Erro HTTP: ${response.status}`);
        }

        const dados = await response.json();

        if (dados.erro) {
          showToast("CEP não encontrado", "error");
        } else {
          // Preencher endereço
          let enderecoCompleto = "";
          if (dados.logradouro) enderecoCompleto += dados.logradouro;
          if (dados.complemento) enderecoCompleto += ", " + dados.complemento;
          if (dados.localidade) enderecoCompleto += " - " + dados.localidade;
          if (dados.uf) enderecoCompleto += "/" + dados.uf;

          if (inputEnderecoImovel) inputEnderecoImovel.value = enderecoCompleto;

          // Selecionar bairro se existir na lista
          if (selectBairro && dados.bairro) {
            const options = Array.from(selectBairro.options);
            const bairroOption = options.find(
              (opt) => opt.value.toLowerCase() === dados.bairro.toLowerCase(),
            );
            if (bairroOption) {
              selectBairro.value = bairroOption.value;
            }
          }

          showToast("✅ Endereço encontrado!", "success");
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
      } finally {
        btnBuscarCep.textContent = "🔍 Buscar CEP";
        btnBuscarCep.disabled = false;
      }
    });
  }

  // Carrega bairros de Feira de Santana via API
  async function carregarBairrosDeFeiraDeSantana() {
    const selectBairro = document.getElementById("bairro");
    if (!selectBairro) return;

    try {
      // ✅ SEGURANÇA: Lista de bairros (sem logs em produção)
      const bairrosFeiraDeSantana = [
        "Acupe",
        "Aeroporto",
        "Alto do Cruzeiro",
        "Asa Branca",
        "Aviário",
        "Baraúnas",
        "Brasília",
        "Calumbi",
        "Campo do Gado Novo",
        "Campo Limpo",
        "Capuchinhos",
        "Caseb",
        "Centro",
        "Chácara Bela Vista",
        "Chácara São Cosme",
        "Cidade Nova",
        "Conceição",
        "Conjunto Habitacional Feira VI",
        "Conjunto Habitacional Feira VII",
        "Conjunto Habitacional Feira X",
        "Country Club",
        "Distrito Industrial Subaé",
        "Estação Nova",
        "Feira IX",
        "Feira VII",
        "Fradinhos",
        "Gabriela",
        "George Américo",
        "Humildes",
        "Irmã Dulce",
        "Jardim Acácia",
        "Jardim Cruzeiro",
        "Kalilândia",
        "Lagoa Grande",
        "Mangabeira",
        "Mangabinha",
        "Morada da Lua",
        "Muchila",
        "Muchila II",
        "Novo Horizonte",
        "Olhos D'Água",
        "Papagaio",
        "Parque Getúlio Vargas",
        "Parque Ipê",
        "Pedra Ferrada",
        "Ponto Central",
        "Queimadinha",
        "Quintas do Jacuípe",
        "Rito",
        "Rocinha",
        "Rua Nova",
        "Santa Mônica",
        "Santo Antônio dos Prazeres",
        "São João",
        "Serraria Brasil",
        "SIM",
        "Sobradinho",
        "Subaé",
        "Tanque da Nação",
        "Tomba",
        "Trevo da Estrada do Coqueiro",
        "Viveiros",
      ].sort();

      selectBairro.innerHTML =
        '<option value="">Selecione o bairro...</option>';

      bairrosFeiraDeSantana.forEach((bairro) => {
        const option = document.createElement("option");
        option.value = bairro;
        option.textContent = bairro;
        selectBairro.appendChild(option);
      });

      console.log(
        `✅ ${bairrosFeiraDeSantana.length} bairros carregados no select`,
      );
      showToast(
        `${bairrosFeiraDeSantana.length} bairros carregados com sucesso!`,
        "success",
        2000,
      );
    } catch (error) {
      console.error("❌ Erro ao carregar bairros:", error);
      showToast("Erro ao carregar bairros", "error", 3000);
    }
  }

  // Carrega proprietários no select
  async function carregarProprietariosNoSelect() {
    const selectProprietario = document.getElementById("proprietario");
    if (!selectProprietario) return;

    try {
      const proprietarios = await window.carregarProprietarios();
      selectProprietario.innerHTML =
        '<option value="">Selecione o Proprietário (opcional)</option>';

      proprietarios.forEach((prop, index) => {
        const option = document.createElement("option");
        option.value = prop.id; // Usar ID ao invés do nome
        option.textContent = `${prop.nome || "Sem nome"} - ${prop.documento || "Sem CPF/CNPJ"}`;
        selectProprietario.appendChild(option);
      });

      console.log(
        `✅ ${proprietarios.length} proprietários carregados no select`,
      );
    } catch (error) {
      console.error("❌ Erro ao carregar proprietários no select:", error);
      selectProprietario.innerHTML =
        '<option value="">Erro ao carregar proprietários</option>';
    }
  }

  // Executar ao carregar a página
  (async () => {
    await carregarBairrosDeFeiraDeSantana();
    await carregarProprietariosNoSelect();
  })();

  window.atualizarBairrosPainel = carregarBairrosDeFeiraDeSantana;
  window.atualizarProprietariosPainel = carregarProprietariosNoSelect;

  // Botão de atualizar bairros
  const btnAtualizarBairros = document.getElementById("btnAtualizarBairros");
  if (btnAtualizarBairros) {
    btnAtualizarBairros.addEventListener("click", async () => {
      await carregarBairrosDeFeiraDeSantana();
    });
  }

  // Botão de atualizar proprietários
  const btnAtualizarProprietarios = document.getElementById(
    "btnAtualizarProprietarios",
  );
  if (btnAtualizarProprietarios) {
    btnAtualizarProprietarios.addEventListener("click", async () => {
      await carregarProprietariosNoSelect();
      showToast("Lista de proprietários atualizada!", "success", 2000);
    });
  }

  // Máscaras de entrada para valores monetários - FORMATAÇÃO EM TEMPO REAL
  // O usuário digita normalmente e vê a formatação: 100 = R$ 1,00 | 10000 = R$ 100,00
  const aplicarMascaraMoeda = (input) => {
    input.addEventListener("input", (e) => {
      // Remove tudo que não é número
      let valor = e.target.value.replace(/\D/g, "");

      if (!valor) {
        e.target.value = "";
        return;
      }

      // Converte para número e divide por 100 (centavos para reais)
      const numero = parseFloat(valor) / 100;

      // Formata como moeda brasileira em tempo real
      e.target.value = numero.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
    });

    // Formata ao carregar se já tiver valor
    if (input.value) {
      let valor = input.value.replace(/\D/g, "");
      if (valor) {
        const numero = parseFloat(valor) / 100;
        input.value = numero.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        });
      }
    }
  };

  const camposPreco = ["preco", "valorCondominio", "valorIPTU"];
  camposPreco.forEach((id) => {
    const campo = document.getElementById(id);
    if (campo) aplicarMascaraMoeda(campo);
  });

  // Validação de imagens (máximo 20)
  if (inputImagens) {
    inputImagens.addEventListener("change", (e) => {
      if (e.target.files.length > 20) {
        showToast("Máximo de 20 fotos permitido!", "error");
        e.target.value = "";
        return;
      }
    });
  }

  // Controle de exibição do campo de vagas da garagem
  if (garagemOpcao && garagemVagas) {
    garagemOpcao.addEventListener("change", (e) => {
      if (e.target.value === "Com garagem") {
        garagemVagas.style.display = "block";
        garagemVagas.setAttribute("required", "required");
        garagemVagas.setAttribute("placeholder", "Número de vagas *");
        garagemVagas.value = garagemVagas.value || "1"; // Valor padrão
      } else {
        garagemVagas.style.display = "none";
        garagemVagas.removeAttribute("required");
        garagemVagas.value = "";
      }
    });
  }

  // Popula filtros dinâmicos (bairro e proprietário)
  async function popularFiltrosDinamicos() {
    const imoveis = await window.carregarImoveis();
    const proprietarios = await window.carregarProprietarios();

    // Filtro de bairros
    if (filterBairro) {
      const bairros = [
        ...new Set(imoveis.map((i) => i.bairro).filter(Boolean)),
      ].sort();
      filterBairro.innerHTML = '<option value="">Bairro (Todos)</option>';
      bairros.forEach((b) => {
        const opt = document.createElement("option");
        opt.value = b;
        opt.textContent = b;
        filterBairro.appendChild(opt);
      });
    }

    // Filtro de proprietários
    if (filterProprietario) {
      const props = [
        ...new Set(imoveis.map((i) => i.proprietario).filter(Boolean)),
      ].sort();
      filterProprietario.innerHTML =
        '<option value="">Proprietário (Todos)</option>';
      props.forEach((p) => {
        const opt = document.createElement("option");
        opt.value = p;
        opt.textContent = p;
        filterProprietario.appendChild(opt);
      });
    }
  }

  // Botão limpar filtros
  if (limparFiltrosBtn) {
    limparFiltrosBtn.addEventListener("click", () => {
      if (filterTitle) filterTitle.value = "";
      if (filterTipo) filterTipo.value = "";
      if (filterCategoria) filterCategoria.value = "";
      if (filterBairro) filterBairro.value = "";
      if (filterProprietario) filterProprietario.value = "";
      if (filterDisponibilidade) filterDisponibilidade.value = "";
      const filterPrecoMin = document.getElementById("filterPrecoMin");
      const filterPrecoMax = document.getElementById("filterPrecoMax");
      if (filterPrecoMin) filterPrecoMin.value = "";
      if (filterPrecoMax) filterPrecoMax.value = "";
      currentPage = 1;
      renderizarImoveis();
      showToast("Filtros limpos!", "success", 2000);
    });
  }

  // Utility: toast
  function showToast(message, type = "default", duration = 3500) {
    const container = document.getElementById("toasts");
    if (!container) return;
    const t = document.createElement("div");
    t.className =
      "toast " +
      (type === "success" ? "success" : type === "error" ? "error" : "");
    t.textContent = message;
    container.appendChild(t);
    setTimeout(() => {
      t.style.opacity = "0";
      setTimeout(() => t.remove(), 300);
    }, duration);
  }

  // Utility: confirm modal (returns Promise)
  function showConfirmModal(message) {
    console.log("❓ Modal de confirmação:", message);
    return new Promise((resolve) => {
      const modal = document.getElementById("confirmModal");
      const msg = document.getElementById("confirmMessage");
      const yes = document.getElementById("confirmYes");
      const no = document.getElementById("confirmNo");

      if (!modal || !msg || !yes || !no) {
        console.error("❌ Elementos do modal não encontrados!");
        return resolve(false);
      }

      console.log("✅ Modal aberto");
      msg.textContent = message || "Tem certeza?";
      modal.setAttribute("aria-hidden", "false");

      function cleanup() {
        console.log("🔒 Modal fechado");
        modal.setAttribute("aria-hidden", "true");
        yes.removeEventListener("click", onYes);
        no.removeEventListener("click", onNo);
      }
      function onYes() {
        console.log("✅ Usuário confirmou");
        cleanup();
        resolve(true);
      }
      function onNo() {
        console.log("❌ Usuário cancelou");
        cleanup();
        resolve(false);
      }
      yes.addEventListener("click", onYes);
      no.addEventListener("click", onNo);
    });
  }

  // Currency formatter (input)
  window.formatarMoeda = function (campo) {
    if (!campo) return;
    let valor = campo.value.replace(/\D/g, "");
    if (valor === "") return (campo.value = "");
    valor = (valor / 100).toFixed(2) + "";
    valor = valor.replace(".", ",");
    valor = valor.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
    campo.value = "R$ " + valor;
  };
  const campoPreco = document.getElementById("preco");
  if (campoPreco)
    campoPreco.addEventListener("input", () => formatarMoeda(campoPreco));

  // Função para adicionar marca d'água (com logo ou texto)
  async function adicionarMarcaDagua(imagemSrc) {
    return new Promise((resolve) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // Define o tamanho do canvas igual à imagem
        canvas.width = img.width;
        canvas.height = img.height;

        // Desenha a imagem original
        ctx.drawImage(img, 0, 0);

        // Tenta carregar a logo primeiro
        const logo = new Image();

        logo.onload = () => {
          console.log("✅ Logo carregada com sucesso!");

          // Calcula o tamanho da logo (25% da largura da imagem, mantendo proporção)
          const logoWidth = img.width * 0.25;
          const logoHeight = (logo.height / logo.width) * logoWidth;

          // Posiciona no canto inferior direito com margem
          const x = img.width - logoWidth - 15;
          const y = img.height - logoHeight - 15;

          // Adiciona fundo claro atrás da logo
          ctx.fillStyle = "rgba(245, 240, 232, 0.9)";
          const padding = 10;
          ctx.fillRect(
            x - padding,
            y - padding,
            logoWidth + padding * 2,
            logoHeight + padding * 2,
          );

          // Adiciona sombra
          ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
          ctx.shadowBlur = 8;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;

          // Desenha a logo
          ctx.globalAlpha = 0.95;
          ctx.drawImage(logo, x, y, logoWidth, logoHeight);

          // Reseta configurações
          ctx.globalAlpha = 1.0;
          ctx.shadowColor = "transparent";

          resolve(canvas.toDataURL("image/jpeg", 0.92));
        };

        logo.onerror = () => {
          console.warn("⚠️ Logo PNG não encontrada, tentando JPG...");

          // Tenta carregar como JPG
          const logoJpg = new Image();

          logoJpg.onload = () => {
            console.log("✅ Logo JPG carregada com sucesso!");

            const logoWidth = img.width * 0.1; // Reduzido para 10%
            const logoHeight = (logoJpg.height / logoJpg.width) * logoWidth;
            const x = img.width - logoWidth - 8;
            const y = img.height - logoHeight - 8;

            ctx.globalAlpha = 0.3;
            ctx.fillStyle = "rgba(245, 240, 232, 0.4)";
            const padding = 4;
            ctx.fillRect(
              x - padding,
              y - padding,
              logoWidth + padding * 2,
              logoHeight + padding * 2,
            );

            ctx.shadowColor = "rgba(0, 0, 0, 0.08)";
            ctx.shadowBlur = 2;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;

            ctx.globalAlpha = 0.25;
            ctx.drawImage(logoJpg, x, y, logoWidth, logoHeight);

            ctx.globalAlpha = 1.0;
            ctx.shadowColor = "transparent";

            resolve(canvas.toDataURL("image/jpeg", 0.92));
          };

          logoJpg.onerror = () => {
            console.warn(
              "⚠️ Logo não encontrada (nem PNG nem JPG), usando marca d'água de texto",
            );

            // MARCA D'ÁGUA DE TEXTO MELHORADA
            const baseSize = Math.max(10, Math.floor(img.width / 65)); // Reduzido para /65

            // Texto principal
            const titulo = "GABRIELLY SILVA";
            const subtitulo = "CORRETORA DE IMÓVEIS";
            const creci = "CRECI 26.012";

            // Fontes (todas reduzidas)
            ctx.font = `bold ${baseSize * 0.9}px Arial`;
            const tituloWidth = ctx.measureText(titulo).width;

            ctx.font = `${baseSize * 0.55}px Arial`;
            const subtituloWidth = ctx.measureText(subtitulo).width;
            const creciWidth = ctx.measureText(creci).width;

            const maxWidth = Math.max(tituloWidth, subtituloWidth, creciWidth);
            const boxHeight = baseSize * 3.2;

            // Posição no canto inferior direito
            const x = img.width - maxWidth - 15;
            const y = img.height - boxHeight - 8;

            // Fundo bege claro
            ctx.fillStyle = "rgba(245, 240, 232, 0.75)";
            ctx.fillRect(x - 8, y - 6, maxWidth + 16, boxHeight + 12);

            // Borda dourada
            ctx.strokeStyle = "#c9a961";
            ctx.lineWidth = 1;
            ctx.strokeRect(x - 8, y - 6, maxWidth + 16, boxHeight + 12);

            // Sombra
            ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
            ctx.shadowBlur = 2;

            // Desenha os textos
            ctx.fillStyle = "#5a1a1a";

            // Título
            ctx.font = `bold ${baseSize * 0.9}px Arial`;
            ctx.fillText(titulo, x, y + baseSize * 0.9);

            // Subtítulo
            ctx.font = `${baseSize * 0.55}px Arial`;
            ctx.fillText(subtitulo, x, y + baseSize * 1.75);

            // CRECI em dourado
            ctx.fillStyle = "#c9a961";
            ctx.font = `bold ${baseSize * 0.65}px Arial`;
            ctx.fillText(creci, x, y + baseSize * 2.7);

            ctx.shadowColor = "transparent";

            resolve(canvas.toDataURL("image/jpeg", 0.92));
          };

          // Tenta carregar como JPG
          logoJpg.src = "img/marca-dagua.jpg";
        };

        // Tenta carregar a logo PNG primeiro
        logo.src = "img/marca-dagua.jpeg";
      };

      img.onerror = () => {
        console.error("❌ Erro ao carregar imagem principal");
        resolve(imagemSrc);
      };

      img.src = imagemSrc;
    });
  }

  // Image preview com marca d'água
  if (inputImagens && preview) {
    console.log("✅ Event listener de imagens configurado");
    inputImagens.addEventListener("change", async (e) => {
      console.log(
        "📸 Evento change disparado! Arquivos:",
        e.target.files.length,
      );

      if (!preview) {
        console.error("❌ preview não está disponível!");
        return;
      }

      preview.innerHTML = "";
      const files = Array.from(e.target.files);

      if (!Array.isArray(files) || files.length === 0) {
        console.log("⚠️ Nenhum arquivo selecionado");
        return;
      }

      for (const file of files) {
        console.log("🖼️ Processando imagem:", file.name, "tamanho:", file.size);
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            // Adiciona marca d'água
            console.log("⏳ Adicionando marca d'água...");
            const imagemComMarca = await adicionarMarcaDagua(reader.result);
            const img = document.createElement("img");
            img.src = imagemComMarca;
            img.dataset.marcaDagua = imagemComMarca; // Armazena a versão com marca d'água
            preview.appendChild(img);
            console.log(
              "✅ Imagem adicionada ao preview. Total no preview:",
              preview.children.length,
            );
          } catch (error) {
            console.error("❌ Erro ao processar imagem:", error);
          }
        };
        reader.onerror = (error) => {
          console.error("❌ Erro ao ler arquivo:", error);
        };
        reader.readAsDataURL(file);
      }
    });
  } else {
    console.error(
      "❌ inputImagens ou preview não encontrado para event listener",
    );
  }

  // Carousel helpers
  function criarCarrossel(imagens) {
    if (!Array.isArray(imagens) || imagens.length === 0) {
      console.warn("⚠️ Nenhuma imagem válida para carrossel");
      return `<div class="galeria"><p>Sem imagens</p></div>`;
    }
    const imagensHtml = imagens
      .map(
        (img, i) =>
          `<img src="${img}" class="slide" data-index="${i}" style="${i === 0 ? "display:block" : "display:none"}">`,
      )
      .join("");
    return `\n      <div class="galeria">\n        <button class="seta esquerda">&#10094;</button>\n        <div class="slides-container">${imagensHtml}</div>\n        <button class="seta direita">&#10095;</button>\n      </div>\n    `;
  }
  function inicializarCarrossel() {
    document.querySelectorAll(".galeria").forEach((galeria) => {
      const slides = galeria.querySelectorAll(".slide");
      if (slides.length === 0) return;
      let i = 0;
      const show = (n) => {
        slides[i].style.display = "none";
        i = (n + slides.length) % slides.length;
        slides[i].style.display = "block";
      };
      const left = galeria.querySelector(".seta.esquerda");
      const right = galeria.querySelector(".seta.direita");
      if (left) left.addEventListener("click", () => show(i - 1));
      if (right) right.addEventListener("click", () => show(i + 1));
    });
  }

  // Load and render with filters + pagination
  async function renderizarImoveis() {
    try {
      listaImoveis.innerHTML = "";
      console.log("🔄 Iniciando renderização de imóveis...");
      const imoveis = await window.carregarImoveis();
      console.log("📦 Imóveis carregados:", imoveis.length, imoveis);
      const filterPrecoMin = document.getElementById("filterPrecoMin");
      const filterPrecoMax = document.getElementById("filterPrecoMax");

      const filters = {
        title: filterTitle ? (filterTitle.value || "").toLowerCase() : "",
        tipo: filterTipo ? filterTipo.value || "" : "",
        categoria: filterCategoria ? filterCategoria.value || "" : "",
        disponibilidade: filterDisponibilidade
          ? filterDisponibilidade.value || ""
          : "",
        precoMin: filterPrecoMin ? parseFloat(filterPrecoMin.value) || 0 : 0,
        precoMax: filterPrecoMax
          ? parseFloat(filterPrecoMax.value) || Infinity
          : Infinity,
      };

      const formatarDisplay = (val) => {
        const num = Number(val);
        if (isNaN(num) || num <= 0) return "";
        return num.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        });
      };

      console.log("🔍 Filtros ativos:", filters);
      console.log("📊 Total antes de filtrar:", imoveis.length);

      const filtered = imoveis.filter((imovel) => {
        if (
          filters.title &&
          !(imovel.titulo || "").toLowerCase().includes(filters.title)
        )
          return false;
        if (filters.tipo && (imovel.tipoNegocio || "") !== filters.tipo)
          return false;
        if (filters.categoria && (imovel.categoria || "") !== filters.categoria)
          return false;
        if (
          filters.disponibilidade &&
          (imovel.disponibilidade || "") !== filters.disponibilidade
        )
          return false;

        // Filtro de preço
        const preco = parseFloat(imovel.valor) || 0;
        if (preco < filters.precoMin || preco > filters.precoMax) return false;

        return true;
      });

      console.log("✅ Total após filtrar:", filtered.length);

      itemsPerPage = perPageSelect ? Number(perPageSelect.value) : itemsPerPage;
      const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
      if (currentPage > totalPages) currentPage = totalPages;
      const start = (currentPage - 1) * itemsPerPage;
      const pageItems = filtered.slice(start, start + itemsPerPage);

      if (filtered.length === 0) {
        listaImoveis.innerHTML = `<p style="grid-column: 1 / -1; color: #400000; text-align: center;">Nenhum imóvel encontrado.</p>`;
      }

      console.log(
        "📄 Renderizando página",
        currentPage,
        "- Itens:",
        pageItems.length,
      );

      for (let idx = 0; idx < pageItems.length; idx++) {
        try {
          const imovel = pageItems[idx];
          const index = start + idx;
          console.log(`🏠 Renderizando imóvel ${index + 1}:`, imovel.titulo);
          const card = document.createElement("div");
          card.className = "imovel-card";
          const statusClass =
            imovel.disponibilidade === "Disponível"
              ? "disponivel"
              : "indisponivel";

          // Corrigir exibição de garagem
          let garagemInfo = "Sem garagem";
          if (imovel.garagem === "Com garagem" && imovel.vagas) {
            garagemInfo = `Com garagem (${imovel.vagas} vaga${imovel.vagas > 1 ? "s" : ""})`;
          } else if (imovel.garagem === "Com garagem") {
            garagemInfo = "Com garagem";
          } else if (imovel.garagem === "Sem garagem") {
            garagemInfo = "Sem garagem";
          } else if (imovel.garagem) {
            // Fallback para valores antigos ou customizados
            garagemInfo = imovel.garagem;
          }

          const precoHtml =
            imovel.tipoNegocio === "locacao"
              ? `${formatarDisplay(imovel.preco)}/mês`
              : formatarDisplay(imovel.preco);
          const galeriaHtml = criarCarrossel(imovel.imagens);
          const bairroHtml = imovel.bairro
            ? `<p><strong>📍 Bairro:</strong> ${imovel.bairro}</p>`
            : "";

          // Usar proprietarioObj que já vem do banco de dados (se existir)
          let proprietarioObj = null;
          try {
            proprietarioObj = imovel.proprietarioObj || null;

            // Log de debug
            console.log(`🔍 Buscando proprietário para imóvel ${imovel.id}:`, {
              proprietarioObj,
              proprietario_id: imovel.proprietario_id,
              proprietario_nome: imovel.proprietario_nome,
              proprietario: imovel.proprietario,
            });

            // Se não vier do banco, buscar manualmente (fallback)
            if (
              !proprietarioObj &&
              (imovel.proprietario_id || imovel.proprietario)
            ) {
              const proprietariosSupabase =
                await window.carregarProprietarios();
              const idProprietario =
                imovel.proprietario_id || imovel.proprietario;
              proprietarioObj =
                proprietariosSupabase.find((p) => p.id === idProprietario) ||
                null;

              // Se ainda não encontrar, tentar buscar por nome (compatibilidade com localStorage)
              if (!proprietarioObj && typeof imovel.proprietario === "string") {
                proprietarioObj =
                  proprietariosSupabase.find(
                    (p) => p.nome === imovel.proprietario,
                  ) || null;
              }

              console.log(`  └─ Proprietário encontrado:`, proprietarioObj);
            }
          } catch (error) {
            console.warn("⚠️ Erro ao carregar proprietário:", error);
            proprietarioObj = null;
          }

          // Helper para formatar CPF/CNPJ
          const formatarDocumentoExibicao = (doc) => {
            if (!doc) return "";
            const d = String(doc).replace(/\D/g, "");
            if (d.length === 11)
              return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
            if (d.length === 14)
              return d.replace(
                /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
                "$1.$2.$3/$4-$5",
              );
            return doc;
          };

          const formatarTelefone = (tel) => {
            if (!tel) return "";
            const d = String(tel).replace(/\D/g, "");
            // Formatos comuns brasileiros: 11 dígitos (2 DDD + 9 número) ou 10 dígitos (2 DDD + 8 número)
            if (d.length === 11)
              return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
            if (d.length === 10)
              return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
            return tel;
          };

          let proprietarioHtml = "";
          if (proprietarioObj) {
            const doc = formatarDocumentoExibicao(
              proprietarioObj.documento || "",
            );
            const tel = proprietarioObj.telefone
              ? `<br><strong>Contato:</strong> ${formatarTelefone(proprietarioObj.telefone)}`
              : "";
            const docHtml = doc ? `<br><strong>Documento:</strong> ${doc}` : "";
            const emailHtml = proprietarioObj.email
              ? `<br><strong>Email:</strong> ${proprietarioObj.email}`
              : "";
            proprietarioHtml = `<p style="background: rgba(201, 169, 97, 0.1); padding: 10px; border-radius: 6px; border-left: 3px solid var(--color-gold);"><strong>👤 Proprietário: ${proprietarioObj.nome}</strong>${docHtml}${tel}${emailHtml}</p>`;
            console.log(
              `  └─ Proprietário renderizado com dados completos: ${proprietarioObj.nome}`,
            );
          } else if (imovel.proprietario_nome) {
            proprietarioHtml = `<p style="background: rgba(201, 169, 97, 0.1); padding: 10px; border-radius: 6px; border-left: 3px solid var(--color-gold);"><strong>👤 Proprietário: ${imovel.proprietario_nome}</strong></p>`;
            console.log(
              `  └─ Proprietário renderizado via proprietario_nome: ${imovel.proprietario_nome}`,
            );
          } else if (
            imovel.proprietario &&
            typeof imovel.proprietario === "string"
          ) {
            proprietarioHtml = `<p style=\"background: rgba(201, 169, 97, 0.1); padding: 10px; border-radius: 6px; border-left: 3px solid var(--color-gold);\"><strong>👤 Proprietário: ${imovel.proprietario}</strong></p>`;
            console.log(
              `  └─ Proprietário renderizado via proprietario (fallback): ${imovel.proprietario}`,
            );
          } else {
            console.warn(
              `  └─ ⚠️ NENHUM PROPRIETÁRIO ENCONTRADO PARA ${imovel.id}`,
              {
                proprietarioObj,
                proprietario_nome: imovel.proprietario_nome,
                proprietario: imovel.proprietario,
              },
            );
          }
          const areaHtml =
            imovel.areaUtil || imovel.areaTotal
              ? `<p><strong>📐 Área:</strong> ${imovel.areaUtil ? imovel.areaUtil + "m² útil" : ""} ${imovel.areaTotal ? " / " + imovel.areaTotal + "m² total" : ""}</p>`
              : "";

          // Montagem do HTML do condomínio (nome + valor)
          let condominioHtml = "";
          if (
            imovel.condominio ||
            (imovel.valorCondominio && Number(imovel.valorCondominio) > 0)
          ) {
            const nomeCondominio = imovel.condominio ? imovel.condominio : "";
            const valorCondominio =
              imovel.valorCondominio && Number(imovel.valorCondominio) > 0
                ? formatarDisplay(imovel.valorCondominio)
                : "";

            if (nomeCondominio && valorCondominio) {
              condominioHtml = `<p><strong>🏢 Condomínio/Prédio:</strong> ${nomeCondominio} - ${valorCondominio}</p>`;
            } else if (nomeCondominio) {
              condominioHtml = `<p><strong>🏢 Condomínio/Prédio:</strong> ${nomeCondominio}</p>`;
            } else if (valorCondominio) {
              condominioHtml = `<p><strong>Condomínio/Prédio:</strong> ${valorCondominio}</p>`;
            }
          }

          const iptuHtml =
            imovel.valorIPTU && Number(imovel.valorIPTU) > 0
              ? `<p><strong>IPTU:</strong> ${formatarDisplay(imovel.valorIPTU)}</p>`
              : "";
          const idCurto = imovel.id ? imovel.id.substring(0, 8) : "";
          const idHtml = idCurto
            ? `<p style="color: #999; font-size: 12px; margin-top: -5px; margin-bottom: 8px;"><strong>ID:</strong> ${idCurto}</p>`
            : "";

          card.innerHTML = `\n        ${galeriaHtml}\n        <div class="info">\n          <h3 style="color: #5a1a1a; margin-bottom: 10px;">${imovel.titulo}</h3>\n          ${idHtml}\n          ${proprietarioHtml}\n          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin: 10px 0;">\n            <p><strong>🏷️ Tipo:</strong> ${imovel.tipoNegocio === "venda" ? "Venda" : "Locação"}</p>\n            <p><strong>🏠 Categoria:</strong> ${imovel.categoria}</p>\n            <p><strong>🛏️ Quartos:</strong> ${imovel.quartos}${imovel.suites > 0 ? ` (${imovel.suites} suíte${imovel.suites > 1 ? "s" : ""})` : ""}</p>\n            <p><strong>🚿 Banheiros:</strong> ${imovel.banheiros}</p>\n            <p><strong>🚗 Garagem:</strong> ${garagemInfo}</p>\n          </div>\n          ${areaHtml}\n          ${bairroHtml}\n          <p style="font-size: 18px; font-weight: bold; color: #5a1a1a; margin: 10px 0;"><strong>💰 Preço:</strong> ${precoHtml}</p>\n          ${condominioHtml}\n          ${iptuHtml}\n          <p class="status ${statusClass}" style="display: inline-block; padding: 5px 10px; border-radius: 4px; margin: 10px 0;"><strong>Status:</strong> ${imovel.disponibilidade}</p>\n          <p style="color: #666; font-size: 14px;"><strong>Descrição:</strong> ${imovel.descricao ? imovel.descricao.substring(0, 100) : ""}...</p>\n          <div style="display: flex; gap: 5px; margin-top: 10px;">\n            <button class="editar-btn" data-index="${index}" style="flex: 1;">✏️ Editar</button>\n            <button class="duplicar-btn" data-index="${index}" style="flex: 1; background: #c9a961;">📋 Duplicar</button>\n            <button class="remover-btn" data-index="${index}" style="flex: 1;">🗑️ Remover</button>\n          </div>\n        </div>\n      `;
          listaImoveis.appendChild(card);
        } catch (error) {
          console.error("❌ Erro ao renderizar imóvel:", error);
        }
      }

      document
        .querySelectorAll(".remover-btn")
        .forEach((btn) => btn.addEventListener("click", removerImovel));
      document
        .querySelectorAll(".editar-btn")
        .forEach((btn) => btn.addEventListener("click", editarImovel));
      inicializarCarrossel();
      renderPagination(totalPages);
      renderMetrics();
    } catch (error) {
      console.error("❌ Erro geral na renderização:", error);
      listaImoveis.innerHTML = `<p style="grid-column: 1 / -1; color: #d9534f; text-align: center;">Erro ao carregar imóveis: ${error.message}</p>`;
    }
  }

  function renderPagination(totalPages) {
    let pagRoot = document.querySelector(".pagination");
    if (!pagRoot) {
      const target = document.querySelector("#listaImoveis");
      pagRoot = paginationEl;
      target && target.insertAdjacentElement("afterend", pagRoot);
    }
    pagRoot.innerHTML = "";
    const prev = document.createElement("button");
    prev.textContent = "‹";
    prev.disabled = currentPage === 1;
    prev.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        renderizarImoveis();
      }
    });
    pagRoot.appendChild(prev);
    for (let p = 1; p <= totalPages; p++) {
      const btn = document.createElement("button");
      btn.textContent = p;
      if (p === currentPage) btn.classList.add("active");
      btn.addEventListener("click", () => {
        currentPage = p;
        renderizarImoveis();
      });
      pagRoot.appendChild(btn);
    }
    const next = document.createElement("button");
    next.textContent = "›";
    next.disabled = currentPage === totalPages;
    next.addEventListener("click", () => {
      if (currentPage < totalPages) {
        currentPage++;
        renderizarImoveis();
      }
    });
    pagRoot.appendChild(next);
  }

  function exportCSV() {
    const imoveis = JSON.parse(localStorage.getItem("imoveis")) || [];
    const filters = {
      title: filterTitle ? (filterTitle.value || "").toLowerCase() : "",
      tipo: filterTipo ? filterTipo.value || "" : "",
      categoria: filterCategoria ? filterCategoria.value || "" : "",
      disponibilidade: filterDisponibilidade
        ? filterDisponibilidade.value || ""
        : "",
    };
    const filtered = imoveis.filter((imovel) => {
      if (
        filters.title &&
        !(imovel.titulo || "").toLowerCase().includes(filters.title)
      )
        return false;
      if (filters.tipo && (imovel.tipoNegocio || "") !== filters.tipo)
        return false;
      if (filters.categoria && (imovel.categoria || "") !== filters.categoria)
        return false;
      if (
        filters.disponibilidade &&
        (imovel.disponibilidade || "") !== filters.disponibilidade
      )
        return false;
      return true;
    });
    if (filtered.length === 0) {
      showToast("Nenhum imóvel para exportar", "error");
      return;
    }
    const headers = [
      "Título",
      "Negócio",
      "Preço",
      "Categoria",
      "Quartos",
      "Banheiros",
      "Garagem",
      "Vagas",
      "Bairro",
      "Status",
      "Descrição",
    ];
    const rows = filtered.map((i) =>
      [
        `"${(i.titulo || "").replace(/"/g, '""')}"`,
        i.tipoNegocio || "",
        i.preco || "",
        i.categoria || "",
        i.quartos || "",
        i.banheiros || "",
        i.garagem || "",
        i.vagas || "",
        i.bairro || "",
        i.disponibilidade || "",
        `"${(i.descricao || "").replace(/"/g, '""')}"`,
      ].join(","),
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "imoveis_export.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function removerImovel(e) {
    console.log("🗑️ Remover imóvel clicado!", e.target);
    const index = Number(e.target.dataset.index);
    console.log("📍 Index do imóvel:", index);

    const imoveis = await window.carregarImoveis();
    console.log("📦 Total de imóveis carregados:", imoveis.length);

    const imovel = imoveis[index];
    if (!imovel) {
      console.error("❌ Imóvel não encontrado no index:", index);
      showToast("Erro: Imóvel não encontrado!", "error");
      return;
    }

    console.log("🏠 Imóvel a ser removido:", imovel);
    const titulo = imovel.titulo || "este imóvel";

    showConfirmModal(`Deseja realmente remover o imóvel "${titulo}"?`).then(
      async (ok) => {
        if (!ok) {
          console.log("❌ Remoção cancelada pelo usuário");
          return;
        }

        console.log("🔄 Deletando imóvel ID:", imovel.id);
        try {
          await window.deletarImovel(imovel.id);
          console.log("✅ Imóvel deletado com sucesso!");
          showToast("Imóvel removido com sucesso!", "success");
          await renderizarImoveis();
          console.log("✅ Lista atualizada!");
        } catch (error) {
          console.error("❌ Erro ao deletar imóvel:", error);
          showToast("Erro ao remover imóvel: " + error.message, "error");
        }
      },
    );
  }

  let editandoIndex = null;
  const botaoSubmit = document.querySelector(
    '#formImovel button[type="submit"]',
  );
  let botaoCancelar = null;

  async function editarImovel(e) {
    const index = Number(e.target.dataset.index);
    const imoveis = await window.carregarImoveis();
    const imovel = imoveis[index];
    if (!imovel) return;
    editandoIndex = index;

    // Função auxiliar para formatar valor monetário para o input
    const formatarParaInput = (valor) => {
      if (!valor || valor === 0 || valor === "0") return "";
      const num = parseFloat(valor);
      if (isNaN(num)) return "";
      // Multiplica por 100 para exibir em centavos (ex: 100.00 vira 10000)
      const centavos = Math.round(num * 100).toString();
      return centavos;
    };

    document.getElementById("tipoNegocio").value = imovel.tipoNegocio || "";
    document.getElementById("titulo").value = imovel.titulo || "";

    // Preencher preço com formatação
    const inputPreco = document.getElementById("preco");
    if (inputPreco && imovel.preco) {
      inputPreco.value = formatarParaInput(imovel.preco);
      inputPreco.dispatchEvent(new Event("input"));
    }

    if (document.getElementById("proprietario"))
      document.getElementById("proprietario").value = imovel.proprietario || "";
    document.getElementById("categoria").value = imovel.categoria || "";
    document.getElementById("descricao").value = imovel.descricao || "";
    document.getElementById("quartos").value = imovel.quartos || "";

    // Preencher campos adicionais
    if (document.getElementById("suites"))
      document.getElementById("suites").value = imovel.suites || "";
    if (document.getElementById("areaUtil"))
      document.getElementById("areaUtil").value = imovel.areaUtil || "";
    if (document.getElementById("areaTotal"))
      document.getElementById("areaTotal").value = imovel.areaTotal || "";
    if (document.getElementById("condominio"))
      document.getElementById("condominio").value = imovel.condominio || "";

    // Preencher valores monetários de condomínio e IPTU
    const inputValorCondominio = document.getElementById("valorCondominio");
    if (inputValorCondominio && imovel.valorCondominio) {
      inputValorCondominio.value = formatarParaInput(imovel.valorCondominio);
      inputValorCondominio.dispatchEvent(new Event("input"));
    }

    const inputValorIPTU = document.getElementById("valorIPTU");
    if (inputValorIPTU && imovel.valorIPTU) {
      inputValorIPTU.value = formatarParaInput(imovel.valorIPTU);
      inputValorIPTU.dispatchEvent(new Event("input"));
    }

    document.getElementById("banheiros").value = imovel.banheiros || "";
    document.getElementById("garagemOpcao").value = imovel.garagem || "";
    document.getElementById("disponibilidade").value =
      imovel.disponibilidade || "";
    document.getElementById("bairro").value = imovel.bairro || "";

    // Preencher CEP e endereço
    if (document.getElementById("cepImovel"))
      document.getElementById("cepImovel").value =
        imovel.cep || imovel.cepImovel || "";
    if (document.getElementById("enderecoImovel"))
      document.getElementById("enderecoImovel").value =
        imovel.endereco || imovel.enderecoImovel || "";

    garagemOpcao.dispatchEvent(new Event("change"));
    if (garagemVagas) garagemVagas.value = imovel.vagas || "";
    preview.innerHTML = "";
    if (imovel.imagens && imovel.imagens.length > 0) {
      imovel.imagens.forEach((src) => {
        const img = document.createElement("img");
        img.src = src;
        img.dataset.marcaDagua = src; // Marca que já tem marca d'água
        preview.appendChild(img);
      });
    }
    if (botaoSubmit) botaoSubmit.textContent = "Salvar Alterações";
    if (!botaoCancelar) {
      botaoCancelar = document.createElement("button");
      botaoCancelar.type = "button";
      botaoCancelar.textContent = "Cancelar Edição";
      botaoCancelar.style.marginLeft = "10px";
      botaoSubmit.insertAdjacentElement("afterend", botaoCancelar);
      botaoCancelar.addEventListener("click", () => {
        form.reset();
        preview.innerHTML = "";
        editandoIndex = null;
        botaoSubmit.textContent = "Cadastrar Imóvel";
        botaoCancelar.remove();
        botaoCancelar = null;
      });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    console.log("🚀 Formulário submetido!");

    // Validação dos campos obrigatórios
    const camposObrigatorios = [
      { id: "tipoNegocio", nome: "Tipo de Negócio" },
      { id: "titulo", nome: "Título" },
      { id: "preco", nome: "Preço" },
      { id: "categoria", nome: "Categoria" },
      { id: "descricao", nome: "Descrição" },
      { id: "quartos", nome: "Quartos" },
      { id: "banheiros", nome: "Banheiros" },
    ];
    let erro = false,
      msgErro = "";
    camposObrigatorios.forEach((campo) => {
      const el = document.getElementById(campo.id);
      if (!el || !el.value || el.value.trim() === "") {
        erro = true;
        msgErro += `\n- ${campo.nome}`;
        el && (el.style.borderColor = "#e74c3c");
      } else {
        el.style.borderColor = "";
      }
    });
    if (erro) {
      console.error("❌ Campos obrigatórios faltando:", msgErro);
      showToast("Preencha os campos obrigatórios:" + msgErro, "error", 4000);
      return;
    }
    console.log("✅ Validação passou! Processando dados...");
    try {
      const limparValor = (id) => {
        const campo = document.getElementById(id);
        if (!campo) return "";

        let valor = campo.value.replace(/\D/g, "");
        if (!valor) return "";

        // Converte centavos para reais (divide por 100)
        const numero = parseFloat(valor) / 100;
        return numero.toString();
      };
      const tipoNegocio = document.getElementById("tipoNegocio").value;
      const titulo = document.getElementById("titulo").value;
      const preco = limparValor("preco");
      const proprietario = document.getElementById("proprietario")?.value || "";

      // Buscar nome do proprietário selecionado
      let proprietarioNome = "";
      if (proprietario) {
        try {
          const proprietarios = await window.carregarProprietarios();
          const propObj = proprietarios.find((p) => p.id === proprietario);
          if (propObj) {
            proprietarioNome = propObj.nome;
          }
        } catch (e) {
          console.warn("⚠️ Erro ao buscar nome do proprietário:", e);
        }
      }

      const categoria = document.getElementById("categoria").value;
      const descricao = document.getElementById("descricao").value;
      const quartos = document.getElementById("quartos").value;
      const banheiros = document.getElementById("banheiros").value;
      const suites = document.getElementById("suites")?.value || 0;
      const areaUtil = document.getElementById("areaUtil")?.value || 0;
      const areaTotal = document.getElementById("areaTotal")?.value || 0;
      const garagem = document.getElementById("garagemOpcao").value;
      const vagas = document.getElementById("garagemVagas").value;
      const disponibilidade = document.getElementById("disponibilidade").value;
      const bairro = document.getElementById("bairro").value;
      const condominio = document.getElementById("condominio")?.value || "";
      const valorCondominio = limparValor("valorCondominio");
      const valorIPTU = limparValor("valorIPTU");
      const cep = document.getElementById("cepImovel")?.value || "";
      const endereco = document.getElementById("enderecoImovel")?.value || "";
      const imagens = inputImagens ? inputImagens.files : null;

      // Buscar imóveis para pegar o ID correto se estiver editando
      let imovelAtual = null;
      if (editandoIndex !== null) {
        const imoveis = await window.carregarImoveis();
        imovelAtual = imoveis[editandoIndex];
      }

      let imagensBase64 = [];
      // Processa imagens com marca d'água
      if (imagens && imagens.length > 0) {
        // Pega as imagens com marca d'água do preview
        const imagensPreview = preview.querySelectorAll("img");
        if (imagensPreview.length > 0) {
          imagensBase64 = Array.from(imagensPreview).map(
            (img) => img.dataset.marcaDagua || img.src,
          );
        } else {
          // Fallback: adiciona marca d'água caso o preview não tenha carregado
          imagensBase64 = await Promise.all(
            Array.from(imagens).map(
              (file) =>
                new Promise((resolve) => {
                  const reader = new FileReader();
                  reader.onload = async () => {
                    const imagemComMarca = await adicionarMarcaDagua(
                      reader.result,
                    );
                    resolve(imagemComMarca);
                  };
                  reader.readAsDataURL(file);
                }),
            ),
          );
        }
      }

      // Coletar características selecionadas
      const caracteristicasSelecionadas = [];
      const checkboxes = document.querySelectorAll(
        'input[name="caracteristicas"]:checked',
      );
      checkboxes.forEach((cb) => caracteristicasSelecionadas.push(cb.value));
      console.log(
        "📋 Características selecionadas:",
        caracteristicasSelecionadas,
      );

      const novoImovel = {
        id:
          editandoIndex !== null
            ? imovelAtual?.id || `imovel-${Date.now()}`
            : `imovel-${Date.now()}`,
        tipoNegocio,
        titulo,
        preco,
        proprietario_id: proprietario,
        proprietario_nome: proprietarioNome,
        categoria,
        descricao,
        quartos,
        suites,
        banheiros,
        areaUtil,
        areaTotal,
        garagem,
        vagas: garagem === "Com garagem" ? vagas : null,
        disponibilidade,
        bairro,
        condominio,
        valorCondominio,
        valorIPTU,
        cep,
        endereco,
        caracteristicas: caracteristicasSelecionadas,
        imagens:
          imagensBase64.length > 0
            ? imagensBase64
            : editandoIndex !== null
              ? imovelAtual
                ? imovelAtual.imagens
                : []
              : [],
      };

      // Usar adapter para salvar
      console.log("📝 Salvando imóvel:", novoImovel);
      await window.salvarImovel(novoImovel);

      if (editandoIndex !== null) {
        showToast("Imóvel atualizado com sucesso!", "success");
      } else {
        showToast("Imóvel cadastrado com sucesso!", "success");
      }

      form.reset();
      preview.innerHTML = "";
      if (garagemVagas) {
        garagemVagas.style.display = "none";
        garagemVagas.removeAttribute("required");
      }
      if (botaoCancelar) {
        botaoCancelar.remove();
        botaoCancelar = null;
      }
      if (botaoSubmit) botaoSubmit.textContent = "Cadastrar Imóvel";
      editandoIndex = null;
      renderizarImoveis();
    } catch (err) {
      console.error("❌ Erro completo:", err);
      const msgErro = err.message || err.toString();
      showToast(`Erro ao salvar: ${msgErro}`, "error", 5000);
    }
  });

  window.logout = function () {
    sessionStorage.removeItem("isLoggedIn");
    sessionStorage.removeItem("userEmail");
    sessionStorage.removeItem("userName");
    alert("Você saiu do painel.");
    window.location.href = "login.html";
  };

  if (filterTitle)
    filterTitle.addEventListener("input", () => {
      currentPage = 1;
      renderizarImoveis();
    });
  if (filterTipo)
    filterTipo.addEventListener("change", () => {
      currentPage = 1;
      renderizarImoveis();
    });
  if (filterCategoria)
    filterCategoria.addEventListener("change", () => {
      currentPage = 1;
      renderizarImoveis();
    });
  if (filterDisponibilidade)
    filterDisponibilidade.addEventListener("change", () => {
      currentPage = 1;
      renderizarImoveis();
    });
  if (perPageSelect)
    perPageSelect.addEventListener("change", () => {
      itemsPerPage = Number(perPageSelect.value);
      currentPage = 1;
      renderizarImoveis();
    });
  if (exportBtn) exportBtn.addEventListener("click", exportCSV);

  async function renderMetrics() {
    const imoveis = await window.carregarImoveis();
    const total = imoveis.length;
    const disponiveis = imoveis.filter(
      (i) => i.disponibilidade === "Disponível",
    ).length;
    const vendidos = imoveis.filter(
      (i) => i.disponibilidade === "Vendido/Alugado",
    ).length;
    const ultimos = Math.min(5, imoveis.length);
    const elTotal = document.getElementById("totalImoveis");
    if (elTotal) elTotal.textContent = total;
    const elDisp = document.getElementById("disponiveis");
    if (elDisp) elDisp.textContent = disponiveis;
    const elVend = document.getElementById("vendidos");
    if (elVend) elVend.textContent = vendidos;
    const elUlt = document.getElementById("ultimos");
    if (elUlt) elUlt.textContent = ultimos;
  }

  const userEmailEl = document.getElementById("userEmail");
  if (userEmailEl)
    userEmailEl.textContent =
      sessionStorage.getItem("userName") || "Gabrielly Silva";
  renderizarImoveis();

  // Intercept sidebar links to open pages inside an overlay (no full navigation)
  function createOverlay(title, src) {
    // create overlay if missing
    let overlay = document.getElementById("contentOverlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "contentOverlay";
      const card = document.createElement("div");
      card.className = "overlay-card";
      const header = document.createElement("div");
      header.className = "overlay-header";
      const h3 = document.createElement("h3");
      h3.textContent = title || "";
      const controls = document.createElement("div");
      controls.style.display = "flex";
      controls.style.gap = "8px";
      const back = document.createElement("button");
      back.className = "overlay-back";
      back.textContent = "Voltar";
      back.addEventListener("click", () => {
        history.back();
      });
      const closeX = document.createElement("button");
      closeX.className = "overlay-close";
      closeX.innerHTML = "&times;";
      closeX.addEventListener("click", () => {
        history.back();
      });
      controls.appendChild(back);
      controls.appendChild(closeX);
      header.appendChild(h3);
      header.appendChild(controls);
      const body = document.createElement("div");
      body.className = "overlay-body";
      card.appendChild(header);
      card.appendChild(body);
      overlay.appendChild(card);
      document.body.appendChild(overlay);
      // prevent body from scrolling while overlay is open
      document.body.style.overflow = "hidden";
      // close on escape
      document.addEventListener("keydown", function escHandler(ev) {
        if (ev.key === "Escape") {
          history.back();
        }
      });
      // click outside to close
      overlay.addEventListener("click", function (ev) {
        if (ev.target === overlay) {
          history.back();
        }
      });
    }
    const body = overlay.querySelector(".overlay-body");
    // create loader
    body.innerHTML = `<div class="overlay-loader" style="padding:30px;text-align:center;color:#666">Carregando...</div>`;
    // create iframe
    const iframe = document.createElement("iframe");
    iframe.src = src;
    iframe.style.width = "100%";
    iframe.style.height = "70vh";
    iframe.style.border = "none";
    iframe.style.display = "none";
    // append iframe immediately so browser begins loading
    body.appendChild(iframe);
    iframe.addEventListener("load", () => {
      // remove loader and show iframe
      const loader = body.querySelector(".overlay-loader");
      if (loader) loader.remove();
      iframe.style.display = "block";
    });
    iframe.addEventListener("error", () => {
      const loader = body.querySelector(".overlay-loader");
      if (loader) loader.textContent = "Erro ao carregar a página.";
    });
    // ensure focus to capture escape if needed
    overlay.tabIndex = -1;
    overlay.focus();
  }

  // allow iframe pages to communicate with the painel via postMessage
  window.addEventListener("message", (ev) => {
    // ev.data should be an object like { type: 'reloadImoveis' }
    const data = ev.data;
    if (!data || typeof data !== "object") return;
    if (data.type === "reloadImoveis" || data.type === "refreshImoveis") {
      try {
        renderizarImoveis();
        showToast("Lista de imóveis atualizada pelo iframe.", "success");
      } catch (e) {}
    }
    if (data.type === "reloadMetrics" || data.type === "refreshMetrics") {
      try {
        renderMetrics();
        showToast("Métricas atualizadas.", "success");
      } catch (e) {}
    }
    if (data.type === "closeOverlay") {
      history.back();
    }
    if (data.type === "reloadAll") {
      try {
        renderizarImoveis();
        renderMetrics();
        showToast("Painel atualizado pelo iframe.", "success");
      } catch (e) {}
    }
  });

  function closeOverlay() {
    const overlay = document.getElementById("contentOverlay");
    if (overlay) overlay.remove();
    // restore body scroll
    document.body.style.overflow = "";
  }

  // click handler: fetch href and show container content
  function handlePainelLinkClick(ev) {
    ev.preventDefault();
    const a = ev.currentTarget;
    const href = a.getAttribute("href");
    const title = a.textContent || "";
    // push history state so back button works
    history.pushState(
      { overlay: true, url: href },
      title,
      "#" + encodeURIComponent(href),
    );
    createOverlay(title, href);
  }

  // attach to sidebar links - REMOVIDO para permitir navegação normal
  // Os links agora navegam diretamente sem modal/iframe
  /*
  document.querySelectorAll('.painel-link-btn').forEach(a=>{
    // Ignora link do manual (tem comportamento especial)
    if (a.href && a.href.includes('manual.html')) {
      return;
    }
    // remove target to avoid new tab
    if (a.getAttribute('target')) a.removeAttribute('target');
    a.addEventListener('click', handlePainelLinkClick);
  });
  */

  // Sistema de Backup e Restore - REMOVIDO

  // handle browser back/forward
  window.addEventListener("popstate", (ev) => {
    // if there's an overlay state, do nothing (we expect it to be open)
    if (ev.state && ev.state.overlay) {
      // if overlay not present, open it
      if (!document.getElementById("contentOverlay")) {
        createOverlay(
          ev.state.title || "",
          ev.state.url || ev.state.href || ev.state,
        );
      }
      return;
    }
    // otherwise close overlay if present
    closeOverlay();
  });
});

// ========================================
// MELHORIAS PROFISSIONAIS PARA O PAINEL (Consolidado de script-painel-pro.js)
// Funcionalidades avançadas e UX aprimorado
// ========================================

document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  // ===== MINIMIZAR/EXPANDIR FORMULÁRIO =====
  const toggleFormBtn = document.getElementById("toggleForm");
  const formContainer = document.getElementById("formContainer");

  if (toggleFormBtn && formContainer) {
    let formExpanded = true;

    // Configurar estado inicial
    formContainer.style.overflow = "hidden";
    formContainer.style.transition =
      "max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s ease, transform 0.5s ease";
    formContainer.style.transformOrigin = "top";
    formContainer.style.maxHeight = "10000px";
    formContainer.style.opacity = "1";
    formContainer.style.transform = "scaleY(1)";

    toggleFormBtn.addEventListener("click", function (e) {
      e.preventDefault();
      formExpanded = !formExpanded;

      if (formExpanded) {
        formContainer.style.display = "block";
        setTimeout(() => {
          formContainer.style.maxHeight = "10000px";
          formContainer.style.opacity = "1";
          formContainer.style.transform = "scaleY(1)";
        }, 10);
        toggleFormBtn.innerHTML = "▲ Minimizar";
        toggleFormBtn.classList.remove("btn-filter-primary");
        toggleFormBtn.classList.add("btn-filter-secondary");
      } else {
        formContainer.style.maxHeight = "0";
        formContainer.style.opacity = "0";
        formContainer.style.transform = "scaleY(0)";
        setTimeout(() => {
          formContainer.style.display = "none";
        }, 500);
        toggleFormBtn.innerHTML = "▼ Expandir Formulário";
        toggleFormBtn.classList.remove("btn-filter-secondary");
        toggleFormBtn.classList.add("btn-filter-primary");
      }
    });
  }

  // ===== CONTADOR DE RESULTADOS =====
  function updateResultCount() {
    const listaImoveis = document.getElementById("listaImoveis");
    const resultCount = document.getElementById("resultCount");
    const showingCount = document.getElementById("showingCount");

    if (listaImoveis) {
      const count = listaImoveis.children.length;
      if (resultCount)
        resultCount.textContent = `${count} ${count === 1 ? "resultado" : "resultados"}`;
      if (showingCount) showingCount.textContent = count;
    }
  }

  // Observar mudanças na lista
  const listaImoveis = document.getElementById("listaImoveis");
  if (listaImoveis) {
    const observer = new MutationObserver(updateResultCount);
    observer.observe(listaImoveis, { childList: true });
    updateResultCount();
  }

  // ===== ANIMAÇÃO NOS CARDS DE MÉTRICA =====
  function animateValue(element, start, end, duration) {
    if (!element) return;
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    const timer = setInterval(function () {
      current += increment;
      if (
        (increment > 0 && current >= end) ||
        (increment < 0 && current <= end)
      ) {
        current = end;
        clearInterval(timer);
      }
      const span = element.querySelector("span");
      if (span) span.textContent = Math.floor(current);
    }, 16);
  }

  window.addEventListener("load", function () {
    setTimeout(function () {
      ["totalImoveis", "disponiveis", "vendidos", "ultimos"].forEach(
        (id, idx) => {
          const el = document.getElementById(id);
          if (el && el.querySelector("span")) {
            const val = parseInt(el.querySelector("span").textContent) || 0;
            animateValue(el, 0, val, 1000 + idx * 200);
          }
        },
      );
    }, 500);
  });

  // ===== VALIDAÇÃO DE FORMULÁRIO APRIMORADA =====
  const form = document.getElementById("formImovel");
  if (form) {
    const inputs = form.querySelectorAll(
      "input[required], select[required], textarea[required]",
    );

    function validateField(field) {
      const isValid = field.checkValidity();
      if (isValid) {
        field.classList.remove("invalid");
        field.classList.add("valid");
      } else {
        field.classList.add("invalid");
        field.classList.remove("valid");
      }
      return isValid;
    }

    inputs.forEach((input) => {
      input.addEventListener("blur", () => validateField(input));
      input.addEventListener("input", function () {
        if (this.classList.contains("invalid")) validateField(this);
      });
    });

    form.addEventListener("submit", function (e) {
      let isValid = true;
      inputs.forEach((input) => {
        if (!validateField(input)) isValid = false;
      });
      if (!isValid) {
        e.preventDefault();
        const firstInvalid = form.querySelector(".invalid");
        if (firstInvalid) {
          firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
          firstInvalid.focus();
        }
      }
    });
  }

  // ===== ATALHOS DE TECLADO =====
  document.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      const submitBtn = document.getElementById("submitBtn");
      if (submitBtn && !submitBtn.disabled) submitBtn.click();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault();
      const searchInput = document.getElementById("filterTitle");
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    }
    if (e.key === "Escape") {
      const cancelBtn = document.getElementById("cancelEditBtn");
      if (cancelBtn && cancelBtn.style.display !== "none") cancelBtn.click();
    }
  });

  // ===== INDICADOR DE SALVAMENTO =====
  window.showSavingIndicator = function () {
    const submitBtn = document.getElementById("submitBtn");
    if (submitBtn) {
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = "⏳ Salvando...";
      submitBtn.disabled = true;
      submitBtn.classList.add("loading");
      return function () {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        submitBtn.classList.remove("loading");
      };
    }
    return function () {};
  };

  // ===== CONFIRMAÇÃO ANTES DE SAIR =====
  let formChanged = false;
  if (form) {
    const formInputs = form.querySelectorAll("input, select, textarea");
    formInputs.forEach((input) => {
      input.addEventListener("change", () => {
        formChanged = true;
      });
    });
    form.addEventListener("submit", () => {
      formChanged = false;
    });
    document.getElementById("cancelEditBtn")?.addEventListener("click", () => {
      formChanged = false;
    });
    window.addEventListener("beforeunload", function (e) {
      if (formChanged) {
        e.preventDefault();
        e.returnValue =
          "Você tem alterações não salvas. Deseja realmente sair?";
        return e.returnValue;
      }
    });
  }

  // ===== SCROLL TO TOP =====
  const scrollToTopBtn = document.createElement("button");
  scrollToTopBtn.innerHTML = "↑";
  scrollToTopBtn.className = "scroll-to-top";
  scrollToTopBtn.style.cssText = `
    position: fixed;
    bottom: 30px;
    right: 30px;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: linear-gradient(135deg, #5a1a1a, #3d1010);
    color: white;
    border: none;
    font-size: 24px;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
    z-index: 9999;
  `;
  document.body.appendChild(scrollToTopBtn);

  window.addEventListener("scroll", function () {
    if (window.pageYOffset > 300) {
      scrollToTopBtn.style.opacity = "1";
      scrollToTopBtn.style.visibility = "visible";
    } else {
      scrollToTopBtn.style.opacity = "0";
      scrollToTopBtn.style.visibility = "hidden";
    }
  });

  scrollToTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // ===== LOG DE ATIVIDADES =====
  window.logActivity = function (action, details) {
    const log = {
      timestamp: new Date().toISOString(),
      action: action,
      details: details,
      user: sessionStorage.getItem("userEmail") || "Anônimo",
    };
    try {
      let logs = JSON.parse(localStorage.getItem("activity_log") || "[]");
      logs.push(log);
      if (logs.length > 100) logs = logs.slice(-100);
      localStorage.setItem("activity_log", JSON.stringify(logs));
    } catch (e) {
      console.error("Erro ao registrar atividade:", e);
    }
  };

  // ===== ESTATÍSTICAS AVANÇADAS =====
  window.updateAdvancedStats = function (imoveis) {
    if (!Array.isArray(imoveis)) return;
    const seteDiasAtras = new Date();
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
    const ultimos7Dias = imoveis.filter((imovel) => {
      if (imovel.dataCadastro) {
        const dataCadastro = new Date(imovel.dataCadastro);
        return dataCadastro >= seteDiasAtras;
      }
      return false;
    }).length;
    const elementoUltimos = document.getElementById("ultimos");
    if (elementoUltimos) {
      const span = elementoUltimos.querySelector("span");
      if (span) span.textContent = ultimos7Dias;
    }
  };

  console.log("✅ Melhorias profissionais carregadas com sucesso!");
});
