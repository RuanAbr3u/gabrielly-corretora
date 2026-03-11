// ============================================
// CONFIGURAÇÃO DO SUPABASE
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
 * - Use variáveis de ambiente no build
 * - Configure CORS adequadamente no Supabase
 * - Implemente rate limiting
 */

const SUPABASE_URL = window.APP_CONFIG?.supabase?.url;
const SUPABASE_KEY = window.APP_CONFIG?.supabase?.key;

// Validar configuração
if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error("SUPABASE_URL e SUPABASE_KEY são obrigatórios");
}

// Inicializar cliente Supabase
var supabase; // Mudar para 'var' para ser global (não 'let')
try {
  if (!window.supabase) {
    console.error("❌ Biblioteca Supabase não carregada. Verifique:");
    console.error("1. Se o CDN do Supabase está acessível");
    console.error("2. Se há bloqueadores de conteúdo ativos");
    console.error("3. Se a tag <script> do Supabase está ANTES deste arquivo");
    throw new Error(
      "Biblioteca Supabase não carregada. Verifique se o CDN está acessível.",
    );
  }

  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    db: {
      schema: "public",
    },
    global: {
      headers: {
        "x-application-name": "gabrielly-corretora",
      },
    },
  });

  // Expor globalmente para outros scripts
  window.supabaseClient = supabase;
} catch (error) {
  console.error("❌ Erro crítico ao inicializar Supabase:", error);
  console.error("   URL:", SUPABASE_URL);
  console.error("   Chave:", SUPABASE_KEY ? "✅ Configurada" : "❌ Faltando");

  // Mostrar alerta para o usuário
  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", () => {
      alert(
        "⚠️ Erro ao conectar com o banco de dados.\nVerifique o console para mais detalhes.",
      );
    });
  }

  throw error;
}

// Função helper para tratar erros do Supabase
function handleSupabaseError(error, operacao = "operação") {
  console.error(`❌ Erro na ${operacao}:`, error);

  const mensagens = {
    PGRST116: "Tabela ou coluna não encontrada",
    23505: "Registro duplicado",
    23503: "Violação de chave estrangeira",
    "42P01": "Tabela não existe",
  };

  const mensagem =
    mensagens[error.code] || error.message || "Erro desconhecido";

  return {
    sucesso: false,
    erro: mensagem,
    detalhes: error,
  };
}
