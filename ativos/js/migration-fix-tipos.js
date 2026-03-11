// ============================================
// SCRIPT DE MIGRAÇÃO: Corrigir tipos de negócio
// Execute uma vez para normalizar dados antigos
// ============================================

/**
 * Este script corrige registros antigos que podem ter sido salvos
 * com tipo_negocio em maiúsculas ('Venda', 'Locação', 'Locacao')
 * e converte para minúsculas ('venda', 'locacao')
 */

async function migrarTiposNegocio() {
  console.log("🔧 Iniciando migração de tipos de negócio...");

  if (!supabase || typeof supabase.from !== "function") {
    console.error("❌ Supabase não está disponível");
    return { sucesso: false, erro: "Supabase não inicializado" };
  }

  try {
    // 1. Buscar todos os imóveis
    console.log("📥 Buscando todos os imóveis...");
    const { data: imoveis, error: erroListar } = await supabase
      .from("imoveis")
      .select("id, tipo_negocio");

    if (erroListar) {
      console.error("❌ Erro ao listar imóveis:", erroListar);
      return { sucesso: false, erro: erroListar.message };
    }

    console.log(`📊 Total de imóveis encontrados: ${imoveis.length}`);

    // 2. Identificar os que precisam ser corrigidos
    const imoveisParaCorrigir = imoveis.filter((imovel) => {
      const tipo = imovel.tipo_negocio;
      // Se não está em minúsculas, precisa corrigir
      return tipo && tipo !== tipo.toLowerCase();
    });

    console.log(
      `⚠️ Imóveis que precisam correção: ${imoveisParaCorrigir.length}`
    );

    if (imoveisParaCorrigir.length === 0) {
      console.log("✅ Todos os tipos já estão normalizados!");
      return { sucesso: true, corrigidos: 0, total: imoveis.length };
    }

    // 3. Corrigir cada imóvel
    let corrigidos = 0;
    let erros = 0;

    for (const imovel of imoveisParaCorrigir) {
      const tipoOriginal = imovel.tipo_negocio;
      let tipoNormalizado = tipoOriginal.toLowerCase();

      // Normalizar variações comuns
      if (tipoNormalizado === "locação") {
        tipoNormalizado = "locacao";
      }

      console.log(
        `🔄 Corrigindo ID ${imovel.id}: "${tipoOriginal}" → "${tipoNormalizado}"`
      );

      try {
        const { error: erroAtualizar } = await supabase
          .from("imoveis")
          .update({ tipo_negocio: tipoNormalizado })
          .eq("id", imovel.id);

        if (erroAtualizar) {
          console.error(`❌ Erro ao corrigir ${imovel.id}:`, erroAtualizar);
          erros++;
        } else {
          console.log(`✅ Corrigido: ${imovel.id}`);
          corrigidos++;
        }
      } catch (error) {
        console.error(`❌ Exceção ao corrigir ${imovel.id}:`, error);
        erros++;
      }
    }

    console.log(`\n📊 RESULTADO DA MIGRAÇÃO:`);
    console.log(`   ✅ Corrigidos: ${corrigidos}`);
    console.log(`   ❌ Erros: ${erros}`);
    console.log(`   📈 Total processado: ${imoveisParaCorrigir.length}`);

    return {
      sucesso: true,
      corrigidos,
      erros,
      total: imoveis.length,
    };
  } catch (error) {
    console.error("❌ Erro crítico na migração:", error);
    return { sucesso: false, erro: error.message };
  }
}

// Expor função globalmente
window.migrarTiposNegocio = migrarTiposNegocio;

console.log("📦 Script de migração carregado!");
console.log("💡 Para executar a migração, execute: migrarTiposNegocio()");
