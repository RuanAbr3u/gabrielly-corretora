-- ============================================
-- CORREÇÃO: Ativar todos os imóveis
-- ============================================
-- Execute este SQL no Supabase SQL Editor:
-- https://supabase.com/dashboard/project/qlppgehmslfjffsfrazw/sql/new

-- 1. Garantir que a coluna status existe
ALTER TABLE imoveis 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ativo';

-- 2. Atualizar todos os imóveis sem status para 'ativo'
UPDATE imoveis 
SET status = 'ativo' 
WHERE status IS NULL OR status = '';

-- 3. Verificar resultado (deve mostrar todos com status='ativo')
SELECT 
  id,
  titulo,
  tipo_negocio,
  categoria,
  status,
  created_at
FROM imoveis
ORDER BY created_at DESC;

-- ============================================
-- SOLUÇÃO RÁPIDA ALTERNATIVA
-- ============================================
-- Se os imóveis não aparecerem ainda, force status='ativo' em todos:

-- UPDATE imoveis SET status = 'ativo';
