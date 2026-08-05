const fs = require("fs");
const path = require("path");

const SUPABASE_URL =
  process.env.SUPABASE_URL || "https://qlppgehmslfjffsfrazw.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFscHBnZWhtc2xmamZmc2ZyYXp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNjE1MTYsImV4cCI6MjA4MzYzNzUxNn0.yDsPc0icyI3pNugua_nL7JKBlObWd0LTEW9bGG5N1eA";

const configContent = `const CONFIG = {
  supabase: {
    url: "${SUPABASE_URL}",
    key: "${SUPABASE_ANON_KEY}",
  },
  app: {
    nome: "Gabrielly Silva",
    versao: "2.0.0",
    autor: "Gabrielly Silva",
    creci: "26.012",
  },
  contato: {
    telefone: "557592112142",
    email: "gabriellycorretora1@gmail.com",
    instagram: "gabrielly_corretoraa",
    endereco: "Hotel e Business, Edificio Charmant - Caseb, Feira de Santana - BA, 44051-335 - Sala 807",
  },
};

Object.freeze(CONFIG);
Object.freeze(CONFIG.supabase);
Object.freeze(CONFIG.app);
Object.freeze(CONFIG.contato);

window.APP_CONFIG = CONFIG;
`;

const targetDir = path.join(__dirname, "ativos", "js");
const targetPath = path.join(targetDir, "config.js");

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

fs.writeFileSync(targetPath, configContent, "utf8");
console.log("config.js gerado:", targetPath);
console.log("Build concluido!");
