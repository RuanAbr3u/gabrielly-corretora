const fs = require("fs");
const path = require("path");

console.log("🔧 Iniciando build-config.js...");

// Ler variáveis de ambiente do Netlify
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

console.log("📋 Variáveis detectadas:");
console.log(
  "   SUPABASE_URL:",
  SUPABASE_URL ? "✅ Configurada" : "❌ Faltando",
);
console.log(
  "   SUPABASE_ANON_KEY:",
  SUPABASE_ANON_KEY ? "✅ Configurada" : "❌ Faltando",
);

// Validação crítica
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    "\n❌ ERRO CRÍTICO: Variáveis de ambiente obrigatórias não encontradas!",
  );
  console.error("Configure no Netlify: Site Settings → Environment Variables");
  console.error("Variáveis necessárias:");
  console.error("  • SUPABASE_URL");
  console.error("  • SUPABASE_ANON_KEY");
  console.error(
    "\nO build continuará, mas a aplicação NÃO funcionará em produção.\n",
  );
}

// Validar formato da chave JWT
if (SUPABASE_ANON_KEY && !SUPABASE_ANON_KEY.startsWith("eyJ")) {
  console.warn("\n⚠️ AVISO: SUPABASE_ANON_KEY não parece ser um JWT válido!");
  console.warn('Chaves JWT começam com "eyJ"');
  console.warn("Verifique se copiou a chave correta do Supabase Dashboard.\n");
}

// Gerar arquivo config.js dinâmico
const configContent = `/**
 * ============================================
 * CONFIGURAÇÃO DE AMBIENTE
 * ============================================
 * 
 * ⚠️ ARQUIVO GERADO AUTOMATICAMENTE NO BUILD
 * Data: ${new Date().toISOString()}
 * 
 * NÃO EDITE MANUALMENTE - Configure em Netlify Environment Variables
 */

const CONFIG = {
  supabase: {
    url: '${SUPABASE_URL || ""}',
    key: '${SUPABASE_ANON_KEY || ""}'
  },
  app: {
    nome: 'Gabrielly Corretora',
    versao: '2.0.0',
    autor: 'Gabrielly Silva',
    creci: '26.012'
  },
  contato: {
    telefone: '5511999999999',
    email: 'contato@gabriellycorretora.com.br',
    instagram: 'gabrielly.corretora',
    endereco: 'São Paulo, SP'
  },
  features: {
    uploadImagens: true,
    gestaoFinanceira: true,
    relatorios: true,
    backup: true
  }
};

// Validar configuração crítica
if (!CONFIG.supabase.url || !CONFIG.supabase.key) {
  console.error('❌ ERRO: Credenciais do Supabase não configuradas!');
  console.error('Configure as variáveis de ambiente no Netlify.');
}

// Prevenir modificação
Object.freeze(CONFIG);
Object.freeze(CONFIG.supabase);
Object.freeze(CONFIG.app);
Object.freeze(CONFIG.contato);
Object.freeze(CONFIG.features);

window.APP_CONFIG = CONFIG;

// Log apenas em desenvolvimento
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  console.log('✅ APP_CONFIG carregado:', {
    ...CONFIG,
    supabase: {
      url: CONFIG.supabase.url,
      key: CONFIG.supabase.key ? CONFIG.supabase.key.substring(0, 30) + '...' : '❌ VAZIA'
    }
  });
}
`;

// Criar diretório se não existir
const targetDir = path.join(__dirname, "ativos", "js");
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
  console.log("📁 Diretório criado:", targetDir);
}

// Escrever arquivo
const targetPath = path.join(targetDir, "config.js");
fs.writeFileSync(targetPath, configContent, "utf8");

console.log("\n✅ config.js gerado com sucesso!");
console.log("📍 Local:", targetPath);
console.log("🔐 URL Supabase:", SUPABASE_URL || "❌ NÃO CONFIGURADA");
console.log(
  "🔑 Anon Key:",
  SUPABASE_ANON_KEY ? "✅ Configurada" : "❌ NÃO CONFIGURADA",
);
console.log("🎉 Build concluído!\n");

// Exit com código apropriado
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    "⚠️ Build concluído COM AVISOS - configure as variáveis de ambiente!",
  );
  process.exit(0); // Não falhar o build, mas avisar
} else {
  process.exit(0);
}
