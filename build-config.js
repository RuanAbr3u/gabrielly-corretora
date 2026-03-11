const fs = require("fs");
const path = require("path");

// Variáveis de ambiente (Vercel/Netlify) ou valores padrão
const SUPABASE_URL = process.env.SUPABASE_URL || "https://qlppgehmslfjffsfrazw.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFscHBnZWhtc2xmamZmc2ZyYXp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNjE1MTYsImV4cCI6MjA4MzYzNzUxNn0.yDsPc0icyI3pNugua_nL7JKBlObWd0LTEW9bGG5N1eA";

const configContent = `/**
 * ============================================
 * CONFIGURAÇÃO DE AMBIENTE
 * ============================================
 *
 * ARQUIVO GERADO AUTOMATICAMENTE NO BUILD
 * Data: ${new Date().toISOString()}
 *
 * NÃO EDITE MANUALMENTE - Configure em Vercel/Netlify Environment Variables
 */

const CONFIG = {
  supabase: {
    url: "${SUPABASE_URL}",
    key: "${SUPABASE_ANON_KEY}",
  },
  app: {
    nome: "Gabrielly Corretora",
    versao: "2.0.0",
    autor: "Gabrielly Silva",
    creci: "26.012",
  },
  contato: {
    telefone: "5511999999999",
    email: "contato@gabriellycorretora.com.br",
    instagram: "gabrielly.corretora",
    endereco: "São Paulo, SP",
  },
  features: {
    uploadImagens: true,
    gestaoFinanceira: true,
    relatorios: true,
    backup: true,
  },
};

// Validar configuração crítica
if (!CONFIG.supabase.url || !CONFIG.supabase.key) {
  console.error("ERRO: Credenciais do Supabase não configuradas!");
  console.error("Configure as variáveis de ambiente no Vercel/Netlify.");
}

// Prevenir modificação
Object.freeze(CONFIG);
Object.freeze(CONFIG.supabase);
Object.freeze(CONFIG.app);
Object.freeze(CONFIG.contato);
Object.freeze(CONFIG.features);

window.APP_CONFIG = CONFIG;
`;

const targetDir = path.join(__dirname, "ativos", "js");
const targetPath = path.join(targetDir, "config.js");

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

fs.writeFileSync(targetPath, configContent, "utf8");
console.log("config.js gerado:", targetPath);
console.log("Build concluído!");
