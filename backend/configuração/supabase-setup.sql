-- =====================================================
-- SETUP COMPLETO DO BANCO DE DADOS - SUPABASE
-- Execute este script no SQL Editor do Supabase:
-- https://supabase.com/dashboard → SQL Editor → New query
-- =====================================================

-- Extensão UUID (já disponível no Supabase por padrão)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===== TABELA DE PROPRIETÁRIOS =====
CREATE TABLE IF NOT EXISTS proprietarios (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome        TEXT NOT NULL,
  cpf_cnpj    TEXT UNIQUE,
  tipo_pessoa TEXT CHECK (tipo_pessoa IN ('fisica', 'juridica')),
  telefone    TEXT,
  email       TEXT,
  cep         TEXT,
  endereco    TEXT,
  numero      TEXT,
  complemento TEXT,
  bairro      TEXT,
  cidade      TEXT,
  estado      TEXT,
  observacoes TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ===== TABELA DE IMÓVEIS =====
CREATE TABLE IF NOT EXISTS imoveis (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo           TEXT NOT NULL,
  descricao        TEXT,
  tipo_negocio     TEXT NOT NULL,
  categoria        TEXT NOT NULL,
  valor            DECIMAL(12, 2) DEFAULT 0,
  proprietario_id  UUID REFERENCES proprietarios(id) ON DELETE SET NULL,
  cep              TEXT,
  endereco         TEXT,
  numero           TEXT,
  complemento      TEXT,
  bairro           TEXT,
  cidade           TEXT DEFAULT 'Feira de Santana',
  estado           TEXT DEFAULT 'BA',
  quartos          INTEGER DEFAULT 0,
  suites           INTEGER DEFAULT 0,
  banheiros        INTEGER DEFAULT 0,
  vagas_garagem    INTEGER DEFAULT 0,
  area             DECIMAL(10, 2) DEFAULT 0,
  area_util        DECIMAL(10, 2) DEFAULT 0,
  area_total       DECIMAL(10, 2) DEFAULT 0,
  condominio       TEXT,
  valor_condominio DECIMAL(10, 2) DEFAULT 0,
  valor_iptu       DECIMAL(10, 2) DEFAULT 0,
  caracteristicas  JSONB DEFAULT '[]',
  imagens          JSONB DEFAULT '[]',
  status           TEXT DEFAULT 'ativo',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ===== TABELA DE ATENDIMENTOS =====
CREATE TABLE IF NOT EXISTS atendimentos (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  imovel_id     UUID REFERENCES imoveis(id) ON DELETE SET NULL,
  nome_cliente  TEXT NOT NULL,
  telefone      TEXT NOT NULL,
  email         TEXT,
  mensagem      TEXT,
  status        TEXT DEFAULT 'Novo',
  origem        TEXT,
  data_contato  TIMESTAMPTZ DEFAULT NOW(),
  observacoes   TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ===== TABELA DE CONTATOS =====
CREATE TABLE IF NOT EXISTS contatos (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome       TEXT NOT NULL,
  email      TEXT NOT NULL,
  telefone   TEXT,
  assunto    TEXT NOT NULL,
  mensagem   TEXT NOT NULL,
  status     TEXT DEFAULT 'Novo',
  lido       BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== TABELA DE CARACTERÍSTICAS =====
CREATE TABLE IF NOT EXISTS caracteristicas (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome       TEXT UNIQUE NOT NULL,
  icone      TEXT,
  ativo      BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar coluna categoria se não existir (compatível com tabela já existente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'caracteristicas' AND column_name = 'categoria'
  ) THEN
    ALTER TABLE caracteristicas ADD COLUMN categoria TEXT;
  END IF;
END;
$$;

-- ===== ÍNDICES PARA PERFORMANCE =====
CREATE INDEX IF NOT EXISTS idx_imoveis_tipo_negocio   ON imoveis(tipo_negocio);
CREATE INDEX IF NOT EXISTS idx_imoveis_categoria      ON imoveis(categoria);
CREATE INDEX IF NOT EXISTS idx_imoveis_bairro         ON imoveis(bairro);
CREATE INDEX IF NOT EXISTS idx_imoveis_status         ON imoveis(status);
CREATE INDEX IF NOT EXISTS idx_imoveis_proprietario   ON imoveis(proprietario_id);
CREATE INDEX IF NOT EXISTS idx_atendimentos_imovel    ON atendimentos(imovel_id);
CREATE INDEX IF NOT EXISTS idx_atendimentos_status    ON atendimentos(status);
CREATE INDEX IF NOT EXISTS idx_contatos_status        ON contatos(status);
CREATE INDEX IF NOT EXISTS idx_contatos_lido          ON contatos(lido);
CREATE INDEX IF NOT EXISTS idx_contatos_created_at    ON contatos(created_at DESC);

-- ===== ROW LEVEL SECURITY (RLS) =====

-- Habilitar RLS nas tabelas
ALTER TABLE imoveis        ENABLE ROW LEVEL SECURITY;
ALTER TABLE proprietarios  ENABLE ROW LEVEL SECURITY;
ALTER TABLE atendimentos   ENABLE ROW LEVEL SECURITY;
ALTER TABLE caracteristicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE contatos       ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "imoveis_public_read"          ON imoveis;
DROP POLICY IF EXISTS "imoveis_auth_all"             ON imoveis;
DROP POLICY IF EXISTS "proprietarios_auth_all"       ON proprietarios;
DROP POLICY IF EXISTS "atendimentos_auth_all"        ON atendimentos;
DROP POLICY IF EXISTS "caracteristicas_public_read"  ON caracteristicas;
DROP POLICY IF EXISTS "caracteristicas_auth_all"     ON caracteristicas;
DROP POLICY IF EXISTS "contatos_public_insert"       ON contatos;
DROP POLICY IF EXISTS "contatos_auth_all"            ON contatos;

-- IMÓVEIS: todos podem ler (site público), só autenticados gerenciam
CREATE POLICY "imoveis_public_read" ON imoveis
  FOR SELECT USING (true);

CREATE POLICY "imoveis_auth_all" ON imoveis
  FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- PROPRIETÁRIOS: só usuários autenticados
CREATE POLICY "proprietarios_auth_all" ON proprietarios
  FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- ATENDIMENTOS: só usuários autenticados
CREATE POLICY "atendimentos_auth_all" ON atendimentos
  FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- CARACTERÍSTICAS: todos podem ler, autenticados gerenciam
CREATE POLICY "caracteristicas_public_read" ON caracteristicas
  FOR SELECT USING (true);

CREATE POLICY "caracteristicas_auth_all" ON caracteristicas
  FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- CONTATOS: todos podem inserir (formulário público), só autenticados gerenciam
CREATE POLICY "contatos_public_insert" ON contatos
  FOR INSERT WITH CHECK (true);

CREATE POLICY "contatos_auth_all" ON contatos
  FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- ===== CARACTERÍSTICAS PADRÃO =====
INSERT INTO caracteristicas (nome) VALUES
  ('Área de serviço'),
  ('Cozinha'),
  ('Sala de almoço'),
  ('Sala de estar'),
  ('Varanda'),
  ('Churrasqueira'),
  ('Piscina'),
  ('Jardim'),
  ('Ar-condicionado'),
  ('Aquecimento'),
  ('Elevador'),
  ('Portaria 24h'),
  ('Câmeras'),
  ('Academia'),
  ('Salão de festas'),
  ('Playground')
ON CONFLICT (nome) DO NOTHING;

-- Atualizar categorias (só executa se a coluna existir)
UPDATE caracteristicas SET categoria = 'Cômodos'        WHERE nome IN ('Área de serviço','Cozinha','Sala de almoço','Sala de estar');
UPDATE caracteristicas SET categoria = 'Externos'       WHERE nome IN ('Varanda','Churrasqueira','Piscina','Jardim');
UPDATE caracteristicas SET categoria = 'Conforto'       WHERE nome IN ('Ar-condicionado','Aquecimento');
UPDATE caracteristicas SET categoria = 'Infraestrutura' WHERE nome IN ('Elevador');
UPDATE caracteristicas SET categoria = 'Segurança'      WHERE nome IN ('Portaria 24h','Câmeras');
UPDATE caracteristicas SET categoria = 'Lazer'          WHERE nome IN ('Academia','Salão de festas','Playground');

-- ===== VERIFICAÇÃO =====
SELECT 'Setup concluído!' AS status,
       (SELECT COUNT(*) FROM imoveis) AS total_imoveis,
       (SELECT COUNT(*) FROM proprietarios) AS total_proprietarios,
       (SELECT COUNT(*) FROM caracteristicas) AS total_caracteristicas;
