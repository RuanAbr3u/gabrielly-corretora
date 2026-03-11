// ============================================
// CONFIGURAÇÃO DO SUPABASE - VERSÃO CORRIGIDA
// ============================================

/**
 * IMPORTANTE - SEGURANÇA:
 *
 * Esta chave é a chave PÚBLICA (anon key) do Supabase.
 * É seguro expô-la no frontend DESDE QUE você tenha:
 * 1. ✅ Row Level Security (RLS) ativado nas tabelas
 * 2. ✅ Políticas de acesso configuradas
 * 3. ✅ NUNCA exponha a service_role_key aqui
 *
 * Para maior segurança em produção:
 * - Use variáveis de ambiente no build (Netlify)
 * - Configure CORS adequadamente no Supabase
 * - Implemente rate limiting
 */

// ==============================================
// 1. VALIDAR SE O CDN CARREGOU
// ==============================================
if (!window.supabase || typeof window.supabase.createClient !== "function") {
  console.error("❌ CRÍTICO: CDN do Supabase não carregou!");
  console.error("Verifique:");
  console.error("  1. Sua conexão com a internet");
  console.error(
    "  2. Se o CDN está acessível: https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"
  );
  console.error("  3. Se há bloqueadores de anúncios/scripts ativos");

  alert(
    "Erro ao carregar biblioteca Supabase. Verifique sua conexão com a internet e recarregue a página."
  );
  throw new Error("Supabase CDN não carregado");
}

console.log("✅ CDN do Supabase carregado com sucesso");

// ==============================================
// 2. CARREGAR CONFIGURAÇÃO
// ==============================================
const SUPABASE_URL = window.APP_CONFIG?.supabase?.url;
const SUPABASE_KEY = window.APP_CONFIG?.supabase?.key;

// ==============================================
// 3. VALIDAR CONFIGURAÇÃO
// ==============================================
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ CRÍTICO: Credenciais do Supabase não configuradas!");
  console.error("window.APP_CONFIG:", window.APP_CONFIG);
  console.error("\n🔧 Solução:");
  console.error(
    "  1. Verifique se config.js está carregando ANTES de supabase-config.js"
  );
  console.error("  2. Em produção: Configure variáveis de ambiente no Netlify");
  console.error("  3. Ordem correta dos scripts:");
  console.error('     <script src="config.js"></script>');
  console.error('     <script src="supabase-config.js"></script>');

  throw new Error("SUPABASE_URL e SUPABASE_KEY são obrigatórios");
}

// ==============================================
// 4. VALIDAR FORMATO DA CHAVE
// ==============================================
if (!SUPABASE_KEY.startsWith("eyJ")) {
  console.error("❌ ATENÇÃO: Chave Supabase parece inválida!");
  console.error(
    'Chaves válidas do Supabase são JWT tokens que começam com "eyJ"'
  );
  console.error("Sua chave atual:", SUPABASE_KEY.substring(0, 30) + "...");
  console.error("\n🔑 Como obter a chave correta:");
  console.error("  1. Acesse: https://supabase.com/dashboard");
  console.error("  2. Abra seu projeto");
  console.error("  3. Vá em: Settings → API");
  console.error('  4. Copie a "anon" ou "public" key (começa com eyJ...)');

  console.warn(
    "⚠️ Continuando mesmo assim, mas espere erros de autenticação..."
  );
}

// ==============================================
// 5. INICIALIZAR CLIENTE SUPABASE
// ==============================================
var supabase; // Usar 'var' para escopo global
try {
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: {
        "x-client-info": "gabrielly-corretora@1.0.0",
      },
    },
  });

  console.log("✅ Cliente Supabase criado com sucesso!");
  console.log("📍 URL:", SUPABASE_URL);
  console.log(
    "🔑 Key:",
    SUPABASE_KEY.substring(0, 20) +
      "..." +
      SUPABASE_KEY.substring(SUPABASE_KEY.length - 5)
  );

  // Expor globalmente para outros scripts
  window.supabaseClient = supabase;
} catch (error) {
  console.error("❌ FALHA ao inicializar Supabase:", error);
  console.error("   URL:", SUPABASE_URL);
  console.error("   Chave:", SUPABASE_KEY ? "✅ Configurada" : "❌ Faltando");
  throw error;
}

// ==============================================
// 6. TESTAR CONECTIVIDADE (ASSÍNCRONO)
// ==============================================
setTimeout(async () => {
  try {
    console.log("🔍 Testando conectividade com Supabase...");

    const { count, error } = await supabase
      .from("imoveis")
      .select("*", { count: "exact", head: true });

    if (error) {
      console.error("⚠️ Erro ao verificar conectividade:", error.message);
      console.error("   Código:", error.code);
      console.error("   Detalhes:", error.details);

      // Mensagens de erro específicas
      if (error.message.includes("JWT") || error.code === "PGRST301") {
        console.error("🔑 SUA CHAVE ESTÁ INCORRETA OU EXPIRADA!");
        console.error("   Acesse: Supabase Dashboard → Settings → API");
        console.error('   Copie a chave "anon public"');
      } else if (
        error.message.includes("permission") ||
        error.code === "42501"
      ) {
        console.error("🔒 PROBLEMA DE PERMISSÃO (Row Level Security)");
        console.error("   As tabelas estão protegidas por RLS.");
        console.error(
          "   Solução: Configure políticas de RLS ou desative RLS (não recomendado)"
        );
      } else if (error.message.includes("relation") || error.code === "42P01") {
        console.error('📋 TABELA "imoveis" NÃO EXISTE!');
        console.error("   Verifique se o schema foi criado corretamente");
      } else if (
        error.message.includes("network") ||
        error.message.includes("fetch")
      ) {
        console.error("🌐 ERRO DE REDE ou CORS");
        console.error("   Verifique:");
        console.error("   1. Conexão com internet");
        console.error("   2. CORS no Supabase (Settings → API → CORS)");
        console.error("   3. Firewall/bloqueadores");
      }
    } else {
      console.log("✅ Conectividade OK!");
      console.log(`📊 Total de imóveis na tabela: ${count || 0}`);
    }
  } catch (err) {
    console.warn("⚠️ Não foi possível testar conectividade:", err.message);
    console.warn(
      "Isso é normal se a tabela ainda não existir ou estiver vazia"
    );
  }
}, 500);

// ==============================================
// 7. FUNÇÃO HELPER PARA TRATAMENTO DE ERROS
// ==============================================
function handleSupabaseError(error, operacao = "operação") {
  console.error(`❌ Erro na ${operacao}:`, error);

  const mensagens = {
    PGRST116: "Tabela ou coluna não encontrada",
    PGRST301: "Autenticação inválida ou chave incorreta",
    23505: "Registro duplicado",
    23503: "Violação de chave estrangeira",
    "42P01": "Tabela não existe",
    42501: "Permissão negada - Verifique RLS",
    JWT: "Chave de autenticação inválida ou expirada",
    CORS: "Erro de CORS - Configure no Supabase Dashboard",
  };

  let mensagem = error.message || "Erro desconhecido";

  // Procurar mensagem correspondente
  for (const [codigo, texto] of Object.entries(mensagens)) {
    if (error.code === codigo || mensagem.includes(codigo)) {
      mensagem = texto;
      break;
    }
  }

  return {
    sucesso: false,
    erro: mensagem,
    detalhes: error,
    codigo: error.code,
  };
}

// Expor helper globalmente
window.handleSupabaseError = handleSupabaseError;

console.log("🎉 supabase-config.js carregado e pronto para uso!");
