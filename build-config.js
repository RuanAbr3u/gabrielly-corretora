const fs = require("fs");
const path = require("path");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    "Erro: Variáveis SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórias",
  );
  process.exit(1);
}

const configContent = `const SUPABASE_URL = "${SUPABASE_URL}";
const SUPABASE_ANON_KEY = "${SUPABASE_ANON_KEY}";
`;

const targetDir = path.join(__dirname, "ativos", "js");
const targetPath = path.join(targetDir, "config.js");

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

fs.writeFileSync(targetPath, configContent, "utf8");
console.log("config.js gerado:", targetPath);
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
