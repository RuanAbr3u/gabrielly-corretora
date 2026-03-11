const { createClient } = require("@supabase/supabase-js");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
);

async function criarUsuarioAdmin() {
  try {
    console.log("🔧 Criando usuário admin...\n");

    const email = "admin@gabriellysilva.com";
    const senha = "Admin@2025";
    const nome = "Administrador";

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // Inserir no Supabase
    const { data, error } = await supabase
      .from("usuarios")
      .insert([
        {
          nome: nome,
          email: email,
          senha: senhaHash,
          ativo: true,
        },
      ])
      .select();

    if (error) {
      console.error("❌ Erro ao criar usuário:", error);
      console.error("\n📝 Se a tabela não existe, crie com este SQL:");
      console.log(`
CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
      `);
      return;
    }

    console.log("✅ Usuário criado com sucesso!\n");
    console.log("📧 Email:", email);
    console.log("🔐 Senha:", senha);
    console.log("👤 Nome:", nome);
    console.log("\n🎉 Agora você pode fazer login!");
  } catch (error) {
    console.error("❌ Erro:", error.message);
  }
}

criarUsuarioAdmin();
