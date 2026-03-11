// ============================================
// FUNÇÕES DE BANCO DE DADOS - SUPABASE
// ============================================

// Validação: Verificar se supabase está disponível
if (typeof supabase === "undefined") {
  if (window.supabaseClient) {
    var supabase = window.supabaseClient;
  } else {
    console.error("supabase-db.js: CRÍTICO - supabase não foi inicializado!");
  }
}

const DB = {
  // ========== IMÓVEIS ==========
  imoveis: {
    async listar() {
      try {
        // Tenta com join de proprietários
        let { data, error } = await supabase
          .from("imoveis")
          .select("*, proprietarios:proprietario_id(*)")
          .order("created_at", { ascending: false });

        // Se falhar com join, tenta sem o join
        if (error) {
          console.warn("Falhou com join, tentando sem join:", error.message);
          const res = await supabase
            .from("imoveis")
            .select("*")
            .order("created_at", { ascending: false });
          data = res.data;
          error = res.error;
        }

        if (error) throw error;
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Erro ao listar imóveis:", error);
        throw error;
      }
    },

    async buscarPorId(id) {
      let { data, error } = await supabase
        .from("imoveis")
        .select("*, proprietarios:proprietario_id(*)")
        .eq("id", id)
        .single();

      if (error) {
        // Tenta sem join
        const res = await supabase
          .from("imoveis")
          .select("*")
          .eq("id", id)
          .single();
        data = res.data;
        error = res.error;
      }

      if (error) throw error;
      return data;
    },

    async criar(imovel) {
      console.log("Criando imóvel no Supabase:", imovel);

      // Validar se supabase está disponível
      if (!supabase || typeof supabase.from !== "function") {
        const erro = new Error(
          "Supabase não inicializado corretamente. Verifique supabase-config.js",
        );
        console.error(erro.message);
        throw erro;
      }

      try {
        const { data, error } = await supabase
          .from("imoveis")
          .insert([imovel])
          .select("*")
          .single();

        if (error) {
          console.error("Erro ao criar imóvel:", error);
          console.error("   Código:", error.code);
          console.error("   Mensagem:", error.message);
          console.error("   Detalhes:", error.details);
          throw error;
        }
        console.log("Imóvel criado com sucesso:", data);
        return data;
      } catch (error) {
        console.error("Exceção ao criar imóvel:", error);
        throw error;
      }
    },

    async atualizar(id, imovel) {
      console.log("Atualizando imóvel no Supabase:", id, imovel);
      const { data, error } = await supabase
        .from("imoveis")
        .update(imovel)
        .eq("id", id)
        .select("*")
        .single();

      if (error) {
        console.error("Erro ao atualizar imóvel:", error);
        throw error;
      }
      console.log("Imóvel atualizado com sucesso:", data);
      return data;
    },

    async deletar(id) {
      console.log("Deletando imóvel do Supabase, ID:", id);
      const { error } = await supabase.from("imoveis").delete().eq("id", id);

      if (error) {
        console.error("Erro ao deletar do Supabase:", error);
        throw error;
      }
      console.log("Imóvel deletado com sucesso do Supabase!");
    },

    async listarPorTipo(tipo) {
      try {
        if (!tipo || typeof tipo !== "string") {
          console.error("Tipo inválido:", tipo);
          return [];
        }

        // Normalizar tipo para minúsculas (padrão do sistema)
        const tipoNormalizado = tipo.toLowerCase();
        console.log(
          "Buscando imóveis do tipo:",
          tipoNormalizado,
          "(original:",
          tipo,
          ")",
        );

        // Usar ilike para busca case-insensitive (funciona com 'venda', 'Venda', 'VENDA')
        const { data, error } = await supabase
          .from("imoveis")
          .select("*")
          .ilike("tipo_negocio", tipoNormalizado)
          .eq("status", "ativo")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Erro ao listar por tipo:", error);
          throw error;
        }

        const result = Array.isArray(data) ? data : [];
        console.log(
          `Encontrados ${result.length} imóveis do tipo "${tipoNormalizado}":`,
          result.map((i) => ({
            id: i.id,
            titulo: i.titulo,
            tipo: i.tipo_negocio,
          })),
        );
        return result;
      } catch (error) {
        console.error("Erro crítico ao listar por tipo:", error);
        return [];
      }
    },
  },

  // ========== PROPRIETÁRIOS ==========
  proprietarios: {
    async listar() {
      console.log("DB.proprietarios.listar - Buscando do Supabase...");

      try {
        const { data, error } = await supabase
          .from("proprietarios")
          .select("*")
          .order("nome", { ascending: true });

        if (error) {
          console.error("DB.proprietarios.listar - Erro do Supabase:", error);
          throw error;
        }

        console.log(
          "✅ DB.proprietarios.listar - Retornando",
          data?.length || 0,
          "proprietários",
        );
        return data;
      } catch (error) {
        console.warn(
          "⚠️ Supabase indisponível, usando fallback localStorage:",
          error.message,
        );
        const dados = JSON.parse(
          localStorage.getItem("proprietarios_backup") || "[]",
        );
        console.log("📂 Proprietários do localStorage:", dados.length);
        return dados;
      }
    },

    async buscarPorId(id) {
      const { data, error } = await supabase
        .from("proprietarios")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },

    async criar(proprietario) {
      try {
        if (!proprietario || typeof proprietario !== "object") {
          throw new Error("Dados de proprietário inválidos");
        }

        console.log(
          "💾 DB.proprietarios.criar - Enviando para Supabase:",
          proprietario,
        );

        if (!supabase || !supabase.from) {
          throw new Error("Supabase não está inicializado corretamente");
        }

        const { data, error } = await supabase
          .from("proprietarios")
          .insert([proprietario])
          .select()
          .single();

        if (error) {
          console.error("DB.proprietarios.criar - Erro do Supabase:", error);
          throw error;
        }

        console.log(
          "✅ DB.proprietarios.criar - Proprietário criado com sucesso:",
          data,
        );

        // Fazer backup em localStorage
        const backup = JSON.parse(
          localStorage.getItem("proprietarios_backup") || "[]",
        );
        backup.push(data);
        localStorage.setItem("proprietarios_backup", JSON.stringify(backup));

        return data;
      } catch (error) {
        console.warn(
          "⚠️ Supabase indisponível, salvando localmente:",
          error.message,
        );

        // Fallback para localStorage
        const backup = JSON.parse(
          localStorage.getItem("proprietarios_backup") || "[]",
        );
        const novoProprietario = {
          ...proprietario,
          id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          created_at: new Date().toISOString(),
          synced: false, // Marcar como não sincronizado
        };

        backup.push(novoProprietario);
        localStorage.setItem("proprietarios_backup", JSON.stringify(backup));

        console.log(
          "✅ Proprietário salvo localmente (será sincronizado quando Supabase voltar):",
          novoProprietario,
        );

        return novoProprietario;
      }
    },

    async atualizar(id, proprietario) {
      try {
        console.log(
          "🔵 DB.proprietarios.atualizar - Atualizando:",
          id,
          proprietario,
        );

        if (!supabase || !supabase.from) {
          throw new Error("Supabase não está inicializado corretamente");
        }

        const { data, error } = await supabase
          .from("proprietarios")
          .update(proprietario)
          .eq("id", id)
          .select()
          .single();

        if (error) {
          console.error("Erro ao atualizar proprietário:", error);
          throw error;
        }

        console.log("Proprietário atualizado com sucesso:", data);

        // Fazer backup em localStorage
        const backup = JSON.parse(
          localStorage.getItem("proprietarios_backup") || "[]",
        );
        const index = backup.findIndex((p) => p.id === id);
        if (index !== -1) {
          backup[index] = data;
          localStorage.setItem("proprietarios_backup", JSON.stringify(backup));
        }

        return data;
      } catch (error) {
        console.warn(
          "⚠️ Supabase indisponível, atualizando localmente:",
          error.message,
        );

        // Fallback para localStorage
        const backup = JSON.parse(
          localStorage.getItem("proprietarios_backup") || "[]",
        );
        const index = backup.findIndex((p) => p.id === id);

        if (index !== -1) {
          backup[index] = {
            ...backup[index],
            ...proprietario,
            updated_at: new Date().toISOString(),
            synced: false,
          };
          localStorage.setItem("proprietarios_backup", JSON.stringify(backup));
          console.log("Proprietário atualizado localmente:", backup[index]);
          return backup[index];
        }

        throw new Error("Proprietário não encontrado");
      }
    },

    async deletar(id) {
      try {
        console.log("DB.proprietarios.deletar - Deletando:", id);

        if (!supabase || !supabase.from) {
          throw new Error("Supabase não está inicializado corretamente");
        }

        const { error } = await supabase
          .from("proprietarios")
          .delete()
          .eq("id", id);

        if (error) {
          console.error("Erro ao deletar proprietário:", error);
          throw error;
        }

        console.log("Proprietário deletado com sucesso");

        // Remover do backup localStorage
        const backup = JSON.parse(
          localStorage.getItem("proprietarios_backup") || "[]",
        );
        const filtered = backup.filter((p) => p.id !== id);
        localStorage.setItem("proprietarios_backup", JSON.stringify(filtered));

        return true;
      } catch (error) {
        console.warn(
          "⚠️ Supabase indisponível, deletando localmente:",
          error.message,
        );

        // Fallback para localStorage
        const backup = JSON.parse(
          localStorage.getItem("proprietarios_backup") || "[]",
        );
        const filtered = backup.filter((p) => p.id !== id);
        localStorage.setItem("proprietarios_backup", JSON.stringify(filtered));

        console.log("Proprietário deletado localmente");
        return true;
      }
    },
  },

  // ========== ATENDIMENTOS ==========
  atendimentos: {
    async listar() {
      const { data, error } = await supabase
        .from("atendimentos")
        .select("*, imoveis(*)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },

    async criar(atendimento) {
      const { data, error } = await supabase
        .from("atendimentos")
        .insert([atendimento])
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async atualizar(id, atendimento) {
      const { data, error } = await supabase
        .from("atendimentos")
        .update(atendimento)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async deletar(id) {
      const { error } = await supabase
        .from("atendimentos")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
  },

  // ========== FINANCEIRO ==========
  financeiro: {
    async listar() {
      const { data, error } = await supabase
        .from("financeiro")
        .select("*, imoveis(*)")
        .order("data_transacao", { ascending: false });

      if (error) throw error;
      return data;
    },

    async criar(transacao) {
      const { data, error } = await supabase
        .from("financeiro")
        .insert([transacao])
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async atualizar(id, transacao) {
      const { data, error } = await supabase
        .from("financeiro")
        .update(transacao)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async deletar(id) {
      const { error } = await supabase.from("financeiro").delete().eq("id", id);

      if (error) throw error;
    },

    async calcularTotais() {
      const { data, error } = await supabase
        .from("financeiro")
        .select("tipo, valor");

      if (error) throw error;

      const totais = data.reduce(
        (acc, item) => {
          if (item.tipo === "receita") {
            acc.receitas += parseFloat(item.valor);
          } else {
            acc.despesas += parseFloat(item.valor);
          }
          return acc;
        },
        { receitas: 0, despesas: 0 },
      );

      totais.saldo = totais.receitas - totais.despesas;
      return totais;
    },
  },

  // ========== CARACTERÍSTICAS PERSONALIZADAS ==========
  caracteristicas: {
    async listar() {
      const { data, error } = await supabase
        .from("caracteristicas")
        .select("*")
        .order("nome", { ascending: true });

      if (error) throw error;
      return data || [];
    },

    async criar(nome) {
      const { data, error } = await supabase
        .from("caracteristicas")
        .insert([{ nome }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async deletar(id) {
      const { error } = await supabase
        .from("caracteristicas")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
  },

  // ========== LANÇAMENTOS FINANCEIROS ==========
  lancamentos: {
    async listar() {
      const { data, error } = await supabase
        .from("lancamentos_financeiros")
        .select("*")
        .order("data", { ascending: false });

      if (error) throw error;
      return data || [];
    },

    async criar(lancamento) {
      const { data, error } = await supabase
        .from("lancamentos_financeiros")
        .insert([lancamento])
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async atualizar(id, lancamento) {
      const { data, error } = await supabase
        .from("lancamentos_financeiros")
        .update(lancamento)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async deletar(id) {
      const { error } = await supabase
        .from("lancamentos_financeiros")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },

    async calcularTotais() {
      const { data, error } = await supabase
        .from("lancamentos_financeiros")
        .select("tipo, valor");

      if (error) throw error;

      const totais = data.reduce(
        (acc, item) => {
          if (item.tipo === "receita") {
            acc.receitas += parseFloat(item.valor);
          } else {
            acc.despesas += parseFloat(item.valor);
          }
          return acc;
        },
        { receitas: 0, despesas: 0 },
      );

      totais.saldo = totais.receitas - totais.despesas;
      return totais;
    },
  },

  // ========== LOGS DE ATIVIDADE ==========
  logs: {
    async criar(acao, detalhes = null, usuario = "Admin") {
      const { error } = await supabase
        .from("activity_logs")
        .insert([{ acao, detalhes, usuario }]);

      if (error) console.error("Erro ao salvar log:", error);
    },

    async listar(limite = 100) {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(limite);

      if (error) throw error;
      return data || [];
    },
  },
};

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

// Testar conectividade com Supabase
async function testarConectividadeSupabase() {
  try {
    if (!supabase || typeof supabase.from !== "function") {
      console.error("Supabase não está inicializado corretamente");
      return false;
    }

    console.log("Testando conectividade com Supabase...");
    const { error } = await supabase
      .from("imoveis")
      .select("count", { count: "exact", head: true });

    if (error) {
      console.error("Erro ao conectar com Supabase:", error.message);
      return false;
    }

    console.log("Conectividade com Supabase OK!");
    return true;
  } catch (error) {
    console.error("Erro ao testar conectividade:", error.message);
    return false;
  }
}

// Exportar função de teste
window.testarConectividadeSupabase = testarConectividadeSupabase;
window.DB = DB;

console.log("Funções de banco de dados carregadas!");
