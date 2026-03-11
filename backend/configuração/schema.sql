-- =========================================
-- SCHEMA DO BANCO DE DADOS
-- Sistema Gabrielly Silva Corretora
-- =========================================

-- Criação do banco de dados (execute separadamente se necessário)
-- CREATE DATABASE gabrielly_corretora;

-- Conectar ao banco
-- \c gabrielly_corretora;

-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===== TABELA DE USUÁRIOS =====
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== TABELA DE PROPRIETÁRIOS =====
CREATE TABLE IF NOT EXISTS proprietarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(255) NOT NULL,
  cpf_cnpj VARCHAR(18) UNIQUE NOT NULL,
  tipo_pessoa VARCHAR(10) CHECK (tipo_pessoa IN ('fisica', 'juridica')),
  telefone VARCHAR(20),
  email VARCHAR(255),
  cep VARCHAR(10),
  rua VARCHAR(255),
  numero VARCHAR(20),
  complemento VARCHAR(100),
  bairro VARCHAR(100),
  cidade VARCHAR(100),
  estado VARCHAR(2),
  observacoes TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== TABELA DE IMÓVEIS =====
CREATE TABLE IF NOT EXISTS imoveis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proprietario_id UUID REFERENCES proprietarios(id) ON DELETE SET NULL,
  tipo_negocio VARCHAR(10) CHECK (tipo_negocio IN ('venda', 'locacao')) NOT NULL,
  categoria VARCHAR(50) NOT NULL,
  cep VARCHAR(10),
  rua VARCHAR(255),
  numero VARCHAR(20),
  complemento VARCHAR(100),
  bairro VARCHAR(100),
  cidade VARCHAR(100),
  estado VARCHAR(2),
  quartos INTEGER DEFAULT 0,
  suites INTEGER DEFAULT 0,
  banheiros INTEGER DEFAULT 0,
  garagem VARCHAR(20),
  vagas_garagem INTEGER DEFAULT 0,
  area_util DECIMAL(10, 2),
  area_total DECIMAL(10, 2),
  preco DECIMAL(12, 2) NOT NULL,
  valor_condominio DECIMAL(10, 2),
  valor_iptu DECIMAL(10, 2),
  descricao TEXT,
  disponibilidade VARCHAR(20) DEFAULT 'Disponível',
  imagens JSONB DEFAULT '[]',
  caracteristicas JSONB DEFAULT '[]',
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== TABELA DE ATENDIMENTOS =====
CREATE TABLE IF NOT EXISTS atendimentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  imovel_id UUID REFERENCES imoveis(id) ON DELETE CASCADE,
  nome_cliente VARCHAR(255) NOT NULL,
  telefone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  mensagem TEXT,
  status VARCHAR(50) DEFAULT 'Novo',
  origem VARCHAR(50),
  data_contato TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  observacoes TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== ÍNDICES PARA PERFORMANCE =====
CREATE INDEX idx_imoveis_tipo_negocio ON imoveis(tipo_negocio);
CREATE INDEX idx_imoveis_categoria ON imoveis(categoria);
CREATE INDEX idx_imoveis_bairro ON imoveis(bairro);
CREATE INDEX idx_imoveis_disponibilidade ON imoveis(disponibilidade);
CREATE INDEX idx_imoveis_proprietario ON imoveis(proprietario_id);
CREATE INDEX idx_atendimentos_imovel ON atendimentos(imovel_id);
CREATE INDEX idx_atendimentos_status ON atendimentos(status);

-- ===== TRIGGERS PARA ATUALIZAR TIMESTAMP =====
CREATE OR REPLACE FUNCTION atualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_usuarios_timestamp
BEFORE UPDATE ON usuarios
FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER trigger_proprietarios_timestamp
BEFORE UPDATE ON proprietarios
FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER trigger_imoveis_timestamp
BEFORE UPDATE ON imoveis
FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER trigger_atendimentos_timestamp
BEFORE UPDATE ON atendimentos
FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

-- ===== USUÁRIO PADRÃO (senha: Admin@2025) =====
-- Hash gerado com bcrypt: $2a$10$...
INSERT INTO usuarios (nome, email, senha) VALUES
('Administrador', 'admin@gabriellysilva.com', '$2a$10$YourHashedPasswordHere')
ON CONFLICT (email) DO NOTHING;

-- ===== VIEWS ÚTEIS =====
CREATE OR REPLACE VIEW vw_imoveis_completo AS
SELECT 
  i.*,
  p.nome as proprietario_nome,
  p.telefone as proprietario_telefone,
  p.email as proprietario_email
FROM imoveis i
LEFT JOIN proprietarios p ON i.proprietario_id = p.id;

CREATE OR REPLACE VIEW vw_estatisticas AS
SELECT
  COUNT(*) FILTER (WHERE tipo_negocio = 'venda') as total_vendas,
  COUNT(*) FILTER (WHERE tipo_negocio = 'locacao') as total_locacoes,
  COUNT(*) FILTER (WHERE disponibilidade = 'Disponível') as disponiveis,
  COUNT(*) FILTER (WHERE disponibilidade = 'Vendido') as vendidos,
  COUNT(*) FILTER (WHERE disponibilidade = 'Alugado') as alugados,
  AVG(preco) FILTER (WHERE tipo_negocio = 'venda') as preco_medio_venda,
  AVG(preco) FILTER (WHERE tipo_negocio = 'locacao') as preco_medio_locacao
FROM imoveis;

COMMENT ON TABLE usuarios IS 'Usuários do sistema administrativo';
COMMENT ON TABLE proprietarios IS 'Proprietários dos imóveis';
COMMENT ON TABLE imoveis IS 'Imóveis para venda/locação';
COMMENT ON TABLE atendimentos IS 'Atendimentos e leads de clientes';
