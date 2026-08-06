// ============================================
// ADAPTADOR: localStorage → Supabase
// Mantém compatibilidade com código existente
// ============================================

// Flag para ativar/desativar Supabase (para transição gradual)
// ✅ ATIVADO - Chave real configurada!
const USE_SUPABASE = true;

// ========== FUNÇÕES DE COMPATIBILIDADE ==========

// Carregar imóveis (compatível com código antigo)
async function carregarImoveis() {
  if (!USE_SUPABASE) {
    try {
      return JSON.parse(localStorage.getItem("imoveis")) || [];
    } catch (error) {
      console.error("Erro ao parsear imóveis do localStorage:", error);
      return [];
    }
  }

  try {
    const data = await DB.imoveis.listar();
    console.log("Imóveis carregados do Supabase:", data.length);

    // Se Supabase estiver vazio, tenta carregar do localStorage
    if (data.length === 0) {
      console.log("Supabase vazio, tentando localStorage...");
      try {
        const imoveisLocal = JSON.parse(localStorage.getItem("imoveis")) || [];
        console.log(
          "📂 Imóveis encontrados no localStorage:",
          imoveisLocal.length,
        );
        return imoveisLocal;
      } catch (storageError) {
        console.error("Erro ao acessar localStorage:", storageError);
        return [];
      }
    }

    // Converter formato Supabase para formato localStorage (compatível com painel)
    return data.map((imovel) => ({
      id: imovel.id,
      titulo: imovel.titulo,
      descricao: imovel.descricao,
      tipoNegocio: imovel.tipo_negocio,
      tipo: imovel.tipo_negocio,
      categoria: imovel.categoria,
      preco: imovel.valor
        ? imovel.valor.toString()
        : imovel.preco
          ? imovel.preco.toString()
          : "0",
      valor: imovel.valor || imovel.preco,
      cep: imovel.cep,
      cepImovel: imovel.cep,
      endereco: imovel.endereco,
      enderecoImovel: imovel.endereco,
      numero: imovel.numero,
      complemento: imovel.complemento,
      bairro: imovel.bairro,
      cidade: imovel.cidade,
      estado: imovel.estado,
      quartos: imovel.quartos,
      suites: imovel.suites || 0,
      banheiros: imovel.banheiros,
      garagem:
        (imovel.vagas_garagem || imovel.vagas) > 0
          ? "Com garagem"
          : "Sem garagem",
      vagas: imovel.vagas_garagem || imovel.vagas || 0,
      area: imovel.area || 0,
      areaUtil: imovel.area_util || imovel.area || 0,
      areaTotal: imovel.area_total || imovel.area || 0,
      condominio: imovel.condominio || "",
      valorCondominio: imovel.valor_condominio || 0,
      valorIPTU: imovel.valor_iptu || 0,
      proprietario:
        imovel.proprietario_id ||
        (imovel.proprietarios ? imovel.proprietarios.id : ""),
      proprietarioNome: imovel.proprietarios ? imovel.proprietarios.nome : "",
      proprietarioObj: imovel.proprietarios || null,
      caracteristicas: Array.isArray(imovel.caracteristicas)
        ? imovel.caracteristicas
        : [],
      imagens: imovel.imagens || [],
      fotos: imovel.imagens || [],
      disponibilidade:
        imovel.status === "ativo" ? "Disponível" : "Vendido/Alugado",
    }));
  } catch (error) {
    console.error("Erro ao carregar imóveis do Supabase:", error);
    console.log("Usando fallback do localStorage...");
    return JSON.parse(localStorage.getItem("imoveis")) || [];
  }
}

// Salvar imóvel
async function salvarImovel(imovel) {
  console.log("salvarImovel chamada! USE_SUPABASE:", USE_SUPABASE);
  console.log("📥 Dados recebidos:", imovel);

  if (!USE_SUPABASE) {
    console.log("Salvando no localStorage...");
    const imoveis = JSON.parse(localStorage.getItem("imoveis")) || [];
    if (imovel.id) {
      const index = imoveis.findIndex((i) => i.id === imovel.id);
      if (index !== -1) imoveis[index] = imovel;
    } else {
      imovel.id = Date.now().toString();
      imoveis.push(imovel);
    }
    localStorage.setItem("imoveis", JSON.stringify(imoveis));
    console.log("Salvo no localStorage!");
    return imovel;
  }

  console.log("Salvando no Supabase...");
  try {
    // Converter formato localStorage para Supabase
    // Usar APENAS os campos básicos que certamente existem na tabela
    const tipoNegocioFinal = (
      imovel.tipoNegocio ||
      imovel.tipo ||
      "venda"
    ).toLowerCase();
    console.log(
      "📝 Tipo de negócio sendo salvo:",
      tipoNegocioFinal,
      "Original:",
      imovel.tipoNegocio,
    );

    // Correção do valor: formato brasileiro R$ 1.500,00 -> 1500.00
    let valorOriginal = imovel.preco || imovel.valor || "0";
    console.log(
      "💰 Valor ORIGINAL recebido:",
      valorOriginal,
      "Tipo:",
      typeof valorOriginal,
    );

    let valorFinal;

    // Se já for número, usar direto
    if (typeof valorOriginal === "number") {
      valorFinal = valorOriginal;
      console.log("💰 Valor FINAL (já era número):", valorFinal);
    } else {
      // É string, precisa converter
      let valorLimpo = valorOriginal.toString();

      // Remove R$ e espaços
      valorLimpo = valorLimpo.replace(/R\$/g, "").replace(/\s/g, "");
      console.log("   1. Após remover R$ e espaços:", valorLimpo);

      // Verifica se tem vírgula (formato brasileiro)
      if (valorLimpo.includes(",")) {
        // Formato brasileiro: 1.500,00
        // Remove pontos (separadores de milhar)
        valorLimpo = valorLimpo.replace(/\./g, "");
        console.log("   2. Após remover pontos de milhar:", valorLimpo);

        // Troca vírgula por ponto (decimal)
        valorLimpo = valorLimpo.replace(",", ".");
        console.log("   3. Após trocar vírgula por ponto:", valorLimpo);
      } else if (valorLimpo.includes(".")) {
        // Já está em formato com ponto, verifica se tem mais de um ponto
        const pontos = (valorLimpo.match(/\./g) || []).length;
        if (pontos > 1) {
          // Múltiplos pontos = separadores de milhar + decimal
          // Ex: 1.500.000.00 (formato incorreto, assume último é decimal)
          const partes = valorLimpo.split(".");
          const decimal = partes.pop();
          valorLimpo = partes.join("") + "." + decimal;
          console.log(
            "   2. Formato com múltiplos pontos corrigido:",
            valorLimpo,
          );
        }
      }

      valorFinal = parseFloat(valorLimpo) || 0;
      console.log("💰 Valor FINAL convertido:", valorFinal);
    }

    console.log("Valor que será salvo no banco:", valorFinal);

    const imovelSupabase = {
      titulo: imovel.titulo,
      descricao: imovel.descricao || "",
      tipo_negocio: tipoNegocioFinal,
      categoria: imovel.categoria || "Residencial",
      valor: valorFinal,
      proprietario_id: imovel.proprietario_id || imovel.proprietario || null,
      cep: imovel.cep || imovel.cepImovel || "",
      endereco: imovel.endereco || imovel.enderecoImovel || "",
      numero: imovel.numero || "",
      complemento: imovel.complemento || "",
      bairro: imovel.bairro || "",
      cidade: imovel.cidade || "Brasília",
      estado: imovel.estado || "DF",
      quartos: parseInt(imovel.quartos) || 0,
      suites: parseInt(imovel.suites) || 0,
      banheiros: parseInt(imovel.banheiros) || 0,
      vagas_garagem:
        imovel.garagem === "Com garagem" ? parseInt(imovel.vagas) || 1 : 0,
      area:
        parseFloat(imovel.areaUtil || imovel.areaTotal || imovel.area || 0) ||
        0,
      area_util: parseFloat(imovel.areaUtil || imovel.area || 0) || 0,
      area_total: parseFloat(imovel.areaTotal || imovel.area || 0) || 0,
      condominio: imovel.condominio || "",
      valor_condominio:
        parseFloat(
          (imovel.valorCondominio || "0")
            .toString()
            .replace(/[^\d,]/g, "")
            .replace(",", "."),
        ) || 0,
      valor_iptu:
        parseFloat(
          (imovel.valorIPTU || "0")
            .toString()
            .replace(/[^\d,]/g, "")
            .replace(",", "."),
        ) || 0,
      caracteristicas: Array.isArray(imovel.caracteristicas)
        ? imovel.caracteristicas
        : [],
      imagens: imovel.imagens || imovel.fotos || [],
      status: imovel.disponibilidade === "Disponível" ? "ativo" : "inativo",
    };

    console.log("💾 Salvando imóvel COMPLETO no Supabase:", imovelSupabase);

    if (imovel.id && !imovel.id.startsWith("imovel-")) {
      // Se tem ID válido (UUID do Supabase), atualiza
      const data = await DB.imoveis.atualizar(imovel.id, imovelSupabase);
      console.log("Imóvel atualizado:", data);
      return { ...imovel, id: data.id };
    } else {
      // Cria novo
      const data = await DB.imoveis.criar(imovelSupabase);
      console.log("Imóvel criado:", data);
      return { ...imovel, id: data.id };
    }
  } catch (error) {
    console.error("Erro ao salvar imóvel no Supabase:", error);
    console.error("Mensagem de erro:", error.message);
    console.error("Dados do imóvel:", imovel);

    // FALLBACK: Se o Supabase falhar, salvar no localStorage
    console.log("Tentando fallback para localStorage...");
    try {
      const imoveis = JSON.parse(localStorage.getItem("imoveis")) || [];
      if (imovel.id && !imovel.id.startsWith("imovel-")) {
        // Atualizar existente
        const index = imoveis.findIndex((i) => i.id === imovel.id);
        if (index !== -1) {
          imoveis[index] = imovel;
        }
      } else {
        // Novo imóvel
        imovel.id = `imovel-${Date.now()}`;
        imoveis.push(imovel);
      }
      localStorage.setItem("imoveis", JSON.stringify(imoveis));
      console.log("Imóvel salvo no localStorage como fallback!");
      return imovel;
    } catch (fallbackError) {
      console.error("❌ Erro também no fallback localStorage:", fallbackError);
      throw new Error(
        `Erro ao salvar: Supabase indisponível. ${error.message}`,
      );
    }
  }
}

// Deletar imóvel
async function deletarImovel(id) {
  console.log(
    "🗑️ deletarImovel chamada! ID:",
    id,
    "USE_SUPABASE:",
    USE_SUPABASE,
  );

  // Se o ID começa com "imovel-", é do localStorage e não existe no Supabase
  if (id && id.toString().startsWith("imovel-")) {
    console.log(
      "⚠️ ID no formato localStorage detectado, deletando apenas do localStorage",
    );
    let imoveis = JSON.parse(localStorage.getItem("imoveis")) || [];
    console.log("   Total antes:", imoveis.length);
    imoveis = imoveis.filter((i) => i.id !== id);
    console.log("   Total depois:", imoveis.length);
    localStorage.setItem("imoveis", JSON.stringify(imoveis));
    console.log("✅ Deletado do localStorage!");
    return;
  }

  if (!USE_SUPABASE) {
    console.log("📂 Deletando do localStorage...");
    let imoveis = JSON.parse(localStorage.getItem("imoveis")) || [];
    console.log("   Total antes:", imoveis.length);
    imoveis = imoveis.filter((i) => i.id !== id);
    console.log("   Total depois:", imoveis.length);
    localStorage.setItem("imoveis", JSON.stringify(imoveis));
    console.log("✅ Deletado do localStorage!");
    return;
  }

  console.log("☁️ Deletando do Supabase...");
  try {
    await DB.imoveis.deletar(id);
    console.log("✅ Deletado do Supabase!");
  } catch (error) {
    console.error("❌ Erro ao deletar imóvel do Supabase:", error);
    throw error;
  }
}

// Carregar proprietários
async function carregarProprietarios() {
  if (!USE_SUPABASE) {
    return JSON.parse(localStorage.getItem("proprietarios")) || [];
  }

  try {
    const data = await DB.proprietarios.listar();
    // Converter formato
    return data.map((p) => ({
      id: p.id,
      nome: p.nome,
      documento: p.cpf_cnpj,
      cpf: p.cpf_cnpj,
      telefone: p.telefone,
      email: p.email,
      cep: p.cep,
      endereco: p.endereco,
      numero: p.numero,
      complemento: p.complemento,
      bairro: p.bairro,
      cidade: p.cidade,
      estado: p.estado,
      observacoes: p.observacoes,
    }));
  } catch (error) {
    console.error("Erro ao carregar proprietários:", error);
    return [];
  }
}

// Carregar atendimentos
async function carregarAtendimentos() {
  if (!USE_SUPABASE) {
    return JSON.parse(localStorage.getItem("atendimentos")) || [];
  }

  try {
    const data = await DB.atendimentos.listar();
    return data.map((a) => ({
      id: a.id,
      nomeCliente: a.nome_cliente,
      telefone: a.telefone,
      email: a.email,
      interesse: a.tipo_interesse,
      mensagem: a.mensagem,
      status: a.status,
      dataContato: a.data_contato,
      observacoes: a.observacoes,
    }));
  } catch (error) {
    console.error("Erro ao carregar atendimentos:", error);
    return [];
  }
}

// Salvar atendimento
async function salvarAtendimento(atendimento) {
  if (!USE_SUPABASE) {
    const atendimentos = JSON.parse(localStorage.getItem("atendimentos")) || [];
    if (atendimento.id) {
      const index = atendimentos.findIndex((a) => a.id === atendimento.id);
      if (index !== -1) atendimentos[index] = atendimento;
    } else {
      atendimento.id = Date.now().toString();
      atendimentos.push(atendimento);
    }
    localStorage.setItem("atendimentos", JSON.stringify(atendimentos));
    return atendimento;
  }

  try {
    const atendimentoSupabase = {
      nome_cliente: atendimento.nomeCliente,
      telefone: atendimento.telefone,
      email: atendimento.email,
      tipo_interesse: atendimento.interesse,
      mensagem: atendimento.mensagem,
      status: atendimento.status,
      data_contato: atendimento.dataContato,
      observacoes: atendimento.observacoes,
    };

    if (atendimento.id) {
      const data = await DB.atendimentos.atualizar(
        atendimento.id,
        atendimentoSupabase,
      );
      return { ...atendimento, id: data.id };
    } else {
      const data = await DB.atendimentos.criar(atendimentoSupabase);
      return { ...atendimento, id: data.id };
    }
  } catch (error) {
    console.error("Erro ao salvar atendimento:", error);
    throw error;
  }
}

// Deletar atendimento
async function deletarAtendimento(id) {
  if (!USE_SUPABASE) {
    let atendimentos = JSON.parse(localStorage.getItem("atendimentos")) || [];
    atendimentos = atendimentos.filter((a) => a.id !== id);
    localStorage.setItem("atendimentos", JSON.stringify(atendimentos));
    return;
  }

  try {
    await DB.atendimentos.deletar(id);
  } catch (error) {
    console.error("Erro ao deletar atendimento:", error);
    throw error;
  }
}

// Carregar transações financeiras
async function carregarTransacoes() {
  if (!USE_SUPABASE) {
    return JSON.parse(localStorage.getItem("transacoes")) || [];
  }

  try {
    const data = await DB.financeiro.listar();
    return data.map((t) => ({
      id: t.id,
      tipo: t.tipo,
      descricao: t.descricao,
      valor: t.valor,
      categoria: t.categoria,
      data: t.data_transacao,
      observacoes: t.observacoes,
    }));
  } catch (error) {
    console.error("Erro ao carregar transações:", error);
    return [];
  }
}

// Salvar transação
async function salvarTransacao(transacao) {
  if (!USE_SUPABASE) {
    const transacoes = JSON.parse(localStorage.getItem("transacoes")) || [];
    if (transacao.id) {
      const index = transacoes.findIndex((t) => t.id === transacao.id);
      if (index !== -1) transacoes[index] = transacao;
    } else {
      transacao.id = Date.now().toString();
      transacoes.push(transacao);
    }
    localStorage.setItem("transacoes", JSON.stringify(transacoes));
    return transacao;
  }

  try {
    const transacaoSupabase = {
      tipo: transacao.tipo,
      descricao: transacao.descricao,
      valor: parseFloat(transacao.valor),
      categoria: transacao.categoria,
      data_transacao: transacao.data,
      observacoes: transacao.observacoes,
    };

    if (transacao.id) {
      const data = await DB.financeiro.atualizar(
        transacao.id,
        transacaoSupabase,
      );
      return { ...transacao, id: data.id };
    } else {
      const data = await DB.financeiro.criar(transacaoSupabase);
      return { ...transacao, id: data.id };
    }
  } catch (error) {
    console.error("Erro ao salvar transação:", error);
    throw error;
  }
}

// Deletar transação
async function deletarTransacao(id) {
  if (!USE_SUPABASE) {
    let transacoes = JSON.parse(localStorage.getItem("transacoes")) || [];
    transacoes = transacoes.filter((t) => t.id !== id);
    localStorage.setItem("transacoes", JSON.stringify(transacoes));
    return;
  }

  try {
    await DB.financeiro.deletar(id);
  } catch (error) {
    console.error("Erro ao deletar transação:", error);
    throw error;
  }
}

console.log(
  "✅ Adaptador Supabase carregado! Modo:",
  USE_SUPABASE ? "SUPABASE" : "localStorage",
);

// Exportar funções para o escopo global
window.carregarImoveis = carregarImoveis;
window.salvarImovel = salvarImovel;
window.deletarImovel = deletarImovel;
window.carregarProprietarios = carregarProprietarios;
// window.salvarProprietario e window.deletarProprietario não são mais usados - usamos DB.proprietarios diretamente
window.carregarAtendimentos = carregarAtendimentos;
window.salvarAtendimento = salvarAtendimento;
window.deletarAtendimento = deletarAtendimento;
window.carregarTransacoes = carregarTransacoes;
window.salvarTransacao = salvarTransacao;
window.deletarTransacao = deletarTransacao;

console.log(
  "🌐 Funções exportadas para window:",
  Object.keys(window).filter((k) =>
    [
      "carregarImoveis",
      "salvarImovel",
      "deletarImovel",
      "carregarProprietarios",
      "salvarProprietario",
      "deletarProprietario",
      "carregarAtendimentos",
      "salvarAtendimento",
      "deletarAtendimento",
      "carregarTransacoes",
      "salvarTransacao",
      "deletarTransacao",
    ].includes(k),
  ),
);

// Carregamento robusto para o painel: tenta DB, depois REST direta do Supabase,
// e somente por ultimo usa localStorage.
(function configurarCarregamentoRobustoImoveis() {
  function carregarImoveisLocalSeguro() {
    try {
      return JSON.parse(localStorage.getItem("imoveis")) || [];
    } catch (error) {
      console.error("Erro ao acessar imoveis do localStorage:", error);
      return [];
    }
  }

  async function aguardarDBImoveis() {
    for (let tentativa = 0; tentativa < 12; tentativa++) {
      if (window.DB?.imoveis?.listar) return true;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    return false;
  }

  function normalizarImovelPainel(imovel) {
    const status = String(imovel.status || imovel.disponibilidade || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    return {
      id: imovel.id,
      titulo: imovel.titulo,
      descricao: imovel.descricao,
      tipoNegocio: imovel.tipo_negocio || imovel.tipoNegocio || imovel.tipo,
      tipo: imovel.tipo_negocio || imovel.tipoNegocio || imovel.tipo,
      categoria: imovel.categoria,
      preco: imovel.valor ? imovel.valor.toString() : imovel.preco ? imovel.preco.toString() : "0",
      valor: imovel.valor || imovel.preco,
      cep: imovel.cep,
      cepImovel: imovel.cep,
      endereco: imovel.endereco,
      enderecoImovel: imovel.endereco,
      numero: imovel.numero,
      complemento: imovel.complemento,
      bairro: imovel.bairro,
      cidade: imovel.cidade,
      estado: imovel.estado,
      quartos: Number(imovel.quartos) || 0,
      suites: Number(imovel.suites) || 0,
      banheiros: Number(imovel.banheiros) || 0,
      garagem: (imovel.vagas_garagem || imovel.vagas) > 0 ? "Com garagem" : "Sem garagem",
      vagas: Number(imovel.vagas_garagem || imovel.vagas) || 0,
      area: imovel.area || 0,
      areaUtil: imovel.area_util || imovel.area || 0,
      areaTotal: imovel.area_total || imovel.area || 0,
      condominio: imovel.condominio || "",
      valorCondominio: imovel.valor_condominio || 0,
      valorIPTU: imovel.valor_iptu || 0,
      proprietario: imovel.proprietario_id || (imovel.proprietarios ? imovel.proprietarios.id : "") || imovel.proprietario,
      proprietarioNome: imovel.proprietario_nome || (imovel.proprietarios ? imovel.proprietarios.nome : ""),
      proprietarioObj: imovel.proprietarios || null,
      caracteristicas: Array.isArray(imovel.caracteristicas) ? imovel.caracteristicas : [],
      imagens: imovel.imagens || imovel.fotos || [],
      fotos: imovel.imagens || imovel.fotos || [],
      disponibilidade: status === "ativo" || status === "disponivel" ? "Disponível" : "Vendido/Alugado",
    };
  }

  async function carregarImoveisViaRest() {
    const cfg = window.APP_CONFIG?.supabase || window.CONFIG?.supabase;
    if (!cfg?.url || !cfg?.key) return [];

    const response = await fetch(`${cfg.url}/rest/v1/imoveis?select=*&order=created_at.desc`, {
      headers: {
        apikey: cfg.key,
        Authorization: `Bearer ${cfg.key}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Supabase REST ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }

  window.carregarImoveis = async function carregarImoveisRobusto() {
    if (!USE_SUPABASE) return carregarImoveisLocalSeguro();

    try {
      if (await aguardarDBImoveis()) {
        const data = await window.DB.imoveis.listar();
        if (Array.isArray(data) && data.length > 0) {
          return data.map(normalizarImovelPainel);
        }
      }
    } catch (error) {
      console.warn("Falha ao carregar imoveis via DB:", error);
    }

    try {
      const data = await carregarImoveisViaRest();
      if (data.length > 0) return data.map(normalizarImovelPainel);
    } catch (error) {
      console.warn("Falha ao carregar imoveis via REST:", error);
    }

    return carregarImoveisLocalSeguro();
  };
})();

// Carregamento robusto para proprietarios e atendimentos usados nas telas auxiliares.
(function configurarCarregamentoRobustoPainelAuxiliar() {
  function obterConfigSupabase() {
    const cfg = window.APP_CONFIG?.supabase || window.CONFIG?.supabase;
    const key = cfg?.key || cfg?.anonKey;
    return cfg?.url && key ? { url: cfg.url, key } : null;
  }

  async function aguardarDB(recurso) {
    for (let tentativa = 0; tentativa < 12; tentativa++) {
      if (window.DB?.[recurso]?.listar) return true;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    return false;
  }

  async function buscarRest(tabela, order = "created_at.desc") {
    const cfg = obterConfigSupabase();
    if (!cfg) return [];

    const response = await fetch(`${cfg.url}/rest/v1/${tabela}?select=*&order=${order}`, {
      headers: {
        apikey: cfg.key,
        Authorization: `Bearer ${cfg.key}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Supabase REST ${tabela} ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  async function salvarRest(tabela, payload, id = null) {
    const cfg = obterConfigSupabase();
    if (!cfg) {
      throw new Error("Configuração do Supabase não encontrada.");
    }

    const url = id
      ? `${cfg.url}/rest/v1/${tabela}?id=eq.${encodeURIComponent(id)}`
      : `${cfg.url}/rest/v1/${tabela}`;
    const response = await fetch(url, {
      method: id ? "PATCH" : "POST",
      headers: {
        apikey: cfg.key,
        Authorization: `Bearer ${cfg.key}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const detalhe = await response.text().catch(() => "");
      throw new Error(`Falha ao salvar em ${tabela}: ${response.status} ${detalhe}`);
    }

    const data = await response.json().catch(() => []);
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error(`Supabase não retornou o registro salvo em ${tabela}.`);
    }

    return data[0];
  }

  function numeroPainel(valor) {
    if (typeof valor === "number") return valor;
    const texto = String(valor || "").trim();
    if (!texto) return 0;
    const limpo = texto
      .replace(/R\$/g, "")
      .replace(/\s/g, "")
      .replace(/\./g, "")
      .replace(",", ".");
    return parseFloat(limpo) || 0;
  }

  function statusImovel(valor) {
    const texto = String(valor || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    return texto.includes("disponivel") || texto.includes("ativo") ? "ativo" : "inativo";
  }

  function payloadImovel(imovel) {
    return {
      titulo: imovel.titulo || "",
      descricao: imovel.descricao || "",
      tipo_negocio: (imovel.tipoNegocio || imovel.tipo_negocio || imovel.tipo || "venda").toLowerCase(),
      categoria: imovel.categoria || "Residencial",
      valor: numeroPainel(imovel.preco || imovel.valor),
      proprietario_id: imovel.proprietario_id || imovel.proprietario || null,
      cep: imovel.cep || imovel.cepImovel || "",
      endereco: imovel.endereco || imovel.enderecoImovel || "",
      numero: imovel.numero || "",
      complemento: imovel.complemento || "",
      bairro: imovel.bairro || "",
      cidade: imovel.cidade || "Feira de Santana",
      estado: imovel.estado || "BA",
      quartos: parseInt(imovel.quartos) || 0,
      suites: parseInt(imovel.suites) || 0,
      banheiros: parseInt(imovel.banheiros) || 0,
      vagas_garagem: imovel.garagem === "Com garagem" ? parseInt(imovel.vagas) || 1 : 0,
      area: numeroPainel(imovel.areaUtil || imovel.areaTotal || imovel.area),
      area_util: numeroPainel(imovel.areaUtil || imovel.area),
      area_total: numeroPainel(imovel.areaTotal || imovel.area),
      condominio: imovel.condominio || "",
      valor_condominio: numeroPainel(imovel.valorCondominio),
      valor_iptu: numeroPainel(imovel.valorIPTU),
      caracteristicas: Array.isArray(imovel.caracteristicas) ? imovel.caracteristicas : [],
      imagens: imovel.imagens || imovel.fotos || [],
      status: statusImovel(imovel.disponibilidade || imovel.status || "Disponível"),
    };
  }

  async function deletarRest(tabela, id) {
    const cfg = obterConfigSupabase();
    if (!cfg) {
      throw new Error("Configuração do Supabase não encontrada.");
    }

    const response = await fetch(`${cfg.url}/rest/v1/${tabela}?id=eq.${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: {
        apikey: cfg.key,
        Authorization: `Bearer ${cfg.key}`,
        Prefer: "return=representation",
      },
    });

    if (!response.ok) {
      const detalhe = await response.text().catch(() => "");
      throw new Error(`Falha ao excluir em ${tabela}: ${response.status} ${detalhe}`);
    }

    const removidos = await response.json().catch(() => []);
    if (Array.isArray(removidos) && removidos.length === 0) {
      throw new Error("Registro não removido. Verifique as permissões RLS de DELETE no Supabase.");
    }

    return true;
  }

  async function deletarBackend(recurso, id) {
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    const baseUrl = isLocalhost
      ? "http://localhost:3000"
      : "https://gabrielly-corretora.onrender.com";
    const token = sessionStorage.getItem("authToken");

    const response = await fetch(`${baseUrl}/api/${recurso}/${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "include",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.message || `Backend ${response.status}: falha ao excluir ${recurso}`);
    }

    return true;
  }

  function removerLocal(chave, id) {
    const dados = lerLocal(chave).filter((item) => item.id !== id);
    localStorage.setItem(chave, JSON.stringify(dados));
  }

  function normalizarProprietario(p) {
    return {
      id: p.id,
      nome: p.nome || "",
      documento: p.cpf_cnpj || p.documento || "",
      cpf_cnpj: p.cpf_cnpj || p.documento || "",
      telefone: p.telefone || "",
      email: p.email || "",
      cep: p.cep || "",
      rua: p.rua || p.endereco || "",
      numero: p.numero || "",
      complemento: p.complemento || "",
      bairro: p.bairro || "",
      cidade: p.cidade || "",
      estado: p.estado || "",
      observacoes: p.observacoes || "",
      imovelId: p.imovel_id || p.imovelId || "",
      imovel_id: p.imovel_id || p.imovelId || null,
      created_at: p.created_at,
      synced: p.synced,
    };
  }

  function normalizarAtendimento(a) {
    return {
      id: a.id,
      cliente: a.nome_cliente || a.cliente || a.nome || "",
      nomeCliente: a.nome_cliente || a.cliente || a.nome || "",
      nome_cliente: a.nome_cliente || a.cliente || a.nome || "",
      data: a.data_contato || a.data || a.created_at?.slice(0, 10) || "",
      dataContato: a.data_contato || a.data || "",
      data_contato: a.data_contato || a.data || null,
      descricao: a.descricao || a.mensagem || a.observacoes || "",
      mensagem: a.mensagem || a.descricao || "",
      documento: a.documento || a.cpf_cnpj || "",
      telefone: a.telefone || "",
      email: a.email || "",
      imovelId: a.imovel_id || a.imovelId || "",
      imovel_id: a.imovel_id || a.imovelId || null,
      status: a.status || "novo",
      notas: a.notas || [],
      created_at: a.created_at,
    };
  }

  function lerLocal(chave) {
    try {
      return JSON.parse(localStorage.getItem(chave) || "[]");
    } catch (error) {
      console.error(`Erro ao ler ${chave} do localStorage:`, error);
      return [];
    }
  }

  window.carregarProprietariosSupabase = async function carregarProprietariosSupabase() {
    try {
      if (await aguardarDB("proprietarios")) {
        const data = await window.DB.proprietarios.listar();
        if (Array.isArray(data) && data.length > 0) {
          return data.map(normalizarProprietario);
        }
      }
    } catch (error) {
      console.warn("Falha ao carregar proprietarios via DB, tentando REST:", error);
    }

    try {
      const data = await buscarRest("proprietarios", "nome.asc");
      if (Array.isArray(data) && data.length > 0) {
        return data.map(normalizarProprietario);
      }
    } catch (error) {
      console.warn("Falha ao carregar proprietarios via REST:", error);
    }

    return lerLocal("proprietarios_backup").map(normalizarProprietario);
  };

  window.carregarAtendimentosSupabase = async function carregarAtendimentosSupabase() {
    try {
      if (await aguardarDB("atendimentos")) {
        const data = await window.DB.atendimentos.listar();
        if (Array.isArray(data) && data.length > 0) {
          return data.map(normalizarAtendimento);
        }
      }
    } catch (error) {
      console.warn("Falha ao carregar atendimentos via DB, tentando REST:", error);
    }

    try {
      const data = await buscarRest("atendimentos", "created_at.desc");
      if (Array.isArray(data) && data.length > 0) {
        return data.map(normalizarAtendimento);
      }
    } catch (error) {
      console.warn("Falha ao carregar atendimentos via REST:", error);
    }

    return lerLocal("atendimentos").map(normalizarAtendimento);
  };

  window.carregarCaracteristicasSupabase = async function carregarCaracteristicasSupabase() {
    try {
      if (await aguardarDB("caracteristicas")) {
        const data = await window.DB.caracteristicas.listar();
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
      }
    } catch (error) {
      console.warn("Falha ao carregar características via DB, tentando REST:", error);
    }

    try {
      const data = await buscarRest("caracteristicas", "nome.asc");
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch (error) {
      console.warn("Falha ao carregar características via REST:", error);
    }

    return lerLocal("caracteristicas");
  };

  window.salvarImovelSupabase = async function salvarImovelSupabase(imovel) {
    const payload = payloadImovel(imovel);
    const idValido = imovel.id && !String(imovel.id).startsWith("imovel-");
    const salvo = await salvarRest("imoveis", payload, idValido ? imovel.id : null);
    return { ...imovel, id: salvo.id };
  };

  window.salvarProprietarioSupabase = async function salvarProprietarioSupabase(proprietario) {
    const payload = {
      nome: proprietario.nome || "",
      cpf_cnpj: proprietario.cpf_cnpj || proprietario.documento || "",
      telefone: proprietario.telefone || "",
      email: proprietario.email || "",
      cep: proprietario.cep || "",
      rua: proprietario.rua || "",
      numero: proprietario.numero || "",
      complemento: proprietario.complemento || "",
      bairro: proprietario.bairro || "",
      cidade: proprietario.cidade || "",
      estado: proprietario.estado || "",
      observacoes: proprietario.observacoes || "",
    };
    if (!payload.nome || !payload.cpf_cnpj) {
      throw new Error("Nome e CPF/CNPJ são obrigatórios.");
    }
    const salvo = await salvarRest("proprietarios", payload, proprietario.id || null);
    return normalizarProprietario(salvo);
  };

  window.salvarAtendimentoSupabase = async function salvarAtendimentoSupabase(atendimento) {
    const payload = {
      nome_cliente: atendimento.nomeCliente || atendimento.cliente || "",
      telefone: atendimento.telefone || "",
      email: atendimento.email || "",
      mensagem: atendimento.mensagem || atendimento.descricao || "",
      status: atendimento.status || "novo",
      origem: atendimento.origem || "Painel",
      imovel_id: atendimento.imovelId || atendimento.imovel_id || null,
      observacoes: atendimento.observacoes || "",
    };
    if (!payload.nome_cliente || !payload.telefone) {
      throw new Error("Nome e telefone são obrigatórios.");
    }
    const salvo = await salvarRest("atendimentos", payload, atendimento.id || null);
    return normalizarAtendimento(salvo);
  };

  window.salvarTransacaoSupabase = async function salvarTransacaoSupabase(transacao) {
    const payload = {
      tipo: transacao.tipo,
      descricao: transacao.descricao || "",
      categoria: transacao.categoria || "outras",
      valor: numeroPainel(transacao.valor),
      data_transacao: transacao.data || transacao.data_transacao || new Date().toISOString().slice(0, 10),
      pendente: transacao.pendente !== false,
    };
    const salvo = await salvarRest("financeiro", payload, transacao.id || null);
    return {
      id: salvo.id,
      tipo: salvo.tipo,
      descricao: salvo.descricao,
      categoria: salvo.categoria,
      valor: salvo.valor,
      data: salvo.data_transacao || salvo.data,
      pendente: salvo.pendente,
    };
  };

  window.salvarCaracteristicaSupabase = async function salvarCaracteristicaSupabase(nome) {
    const salvo = await salvarRest("caracteristicas", { nome });
    return salvo;
  };

  window.deletarProprietarioSupabase = async function deletarProprietarioSupabase(id) {
    if (!id) throw new Error("ID do proprietário não informado.");

    try {
      await deletarRest("proprietarios", id);
      removerLocal("proprietarios_backup", id);
      return true;
    } catch (error) {
      console.warn("Falha ao excluir proprietário via REST, tentando backend:", error);
      await deletarBackend("proprietarios", id);
      removerLocal("proprietarios_backup", id);
      return true;
    }
  };

  window.deletarAtendimentoSupabase = async function deletarAtendimentoSupabase(id) {
    if (!id) throw new Error("ID do atendimento não informado.");

    try {
      await deletarRest("atendimentos", id);
      removerLocal("atendimentos", id);
      return true;
    } catch (error) {
      console.warn("Falha ao excluir atendimento via REST, tentando backend:", error);
      await deletarBackend("atendimentos", id);
      removerLocal("atendimentos", id);
      return true;
    }
  };

  window.deletarCaracteristicaSupabase = async function deletarCaracteristicaSupabase(id) {
    if (!id) throw new Error("ID da característica não informado.");

    try {
      await deletarRest("caracteristicas", id);
      removerLocal("caracteristicas", id);
      return true;
    } catch (error) {
      console.warn("Falha ao excluir característica via REST:", error);
      throw error;
    }
  };

  window.deletarImovelSupabase = async function deletarImovelSupabase(id) {
    if (!id) throw new Error("ID do imóvel não informado.");
    try {
      await deletarRest("imoveis", id);
      removerLocal("imoveis", id);
      return true;
    } catch (error) {
      console.warn("Falha ao excluir imóvel via REST, tentando backend:", error);
      await deletarBackend("imoveis", id);
      removerLocal("imoveis", id);
      return true;
    }
  };

  window.deletarTransacaoSupabase = async function deletarTransacaoSupabase(id) {
    if (!id) throw new Error("ID do lançamento não informado.");
    await deletarRest("financeiro", id);
    removerLocal("transacoes", id);
    return true;
  };

  window.carregarProprietarios = window.carregarProprietariosSupabase;
  window.carregarAtendimentos = window.carregarAtendimentosSupabase;
  window.carregarCaracteristicas = window.carregarCaracteristicasSupabase;
  window.salvarImovel = window.salvarImovelSupabase;
  window.salvarProprietario = window.salvarProprietarioSupabase;
  window.salvarAtendimento = window.salvarAtendimentoSupabase;
  window.salvarTransacao = window.salvarTransacaoSupabase;
  window.salvarCaracteristica = window.salvarCaracteristicaSupabase;
  window.deletarProprietario = window.deletarProprietarioSupabase;
  window.deletarAtendimento = window.deletarAtendimentoSupabase;
  window.deletarImovel = window.deletarImovelSupabase;
  window.deletarTransacao = window.deletarTransacaoSupabase;
})();
