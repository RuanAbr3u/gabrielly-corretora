const bcrypt = require('bcryptjs');
const { pool } = require('./database');
const fs = require('fs').promises;
const path = require('path');

async function inicializarBanco() {
  try {
    console.log('🔧 Iniciando configuração do banco de dados...\n');

    // Ler e executar schema SQL
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf8');

    await pool.query(schema);
    console.log('✅ Schema criado com sucesso!\n');

    // Criar usuário padrão com senha hasheada
    const senhaHash = await bcrypt.hash('Admin@2025', 10);
    
    await pool.query(`
      INSERT INTO usuarios (nome, email, senha) 
      VALUES ($1, $2, $3)
      ON CONFLICT (email) DO UPDATE 
      SET senha = $3, nome = $1
    `, ['Administrador', 'admin@gabriellysilva.com', senhaHash]);

    console.log('✅ Usuário padrão criado/atualizado');
    console.log('   Email: admin@gabriellysilva.com');
    console.log('   Senha: Admin@2025\n');

    console.log('🎉 Banco de dados inicializado com sucesso!\n');
    console.log('📝 Próximos passos:');
    console.log('   1. Copie .env.example para .env');
    console.log('   2. Configure as variáveis de ambiente no .env');
    console.log('   3. Execute: npm install');
    console.log('   4. Execute: npm start\n');

    process.exit(0);

  } catch (error) {
    console.error('❌ Erro ao inicializar banco:', error);
    process.exit(1);
  }
}

inicializarBanco();
