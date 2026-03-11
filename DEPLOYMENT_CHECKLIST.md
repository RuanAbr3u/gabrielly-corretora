# 📋 CHECKLIST FINAL DE DEPLOY

## ✅ PRÉ-DEPLOY - SEGURANÇA

### Credenciais e Secrets

- [ ] Nenhum arquivo `.env` commitado no repositório
- [ ] `credentials.json` removido do controle de versão
- [ ] `token.json` removido do controle de versão
- [ ] Arquivo `.gitignore` atualizado e funcionando
- [ ] Verificar histórico do Git: `git log --all --full-history -- "*credentials*"`

### Variáveis de Ambiente

- [ ] `SUPABASE_URL` configurada no Netlify
- [ ] `SUPABASE_ANON_KEY` configurada no Netlify
- [ ] Verificar que são as chaves CORRETAS (não service_role)
- [ ] Testar que valores não estão hardcoded no código

### Arquivos de Configuração

- [ ] `netlify.toml` não contém credenciais
- [ ] `build-config.js` usa `process.env`
- [ ] `config.js` não tem valores hardcoded

---

## 🔒 SEGURANÇA - SUPABASE

### Row Level Security (RLS)

- [ ] RLS ativado em TODAS as tabelas
- [ ] Políticas de SELECT configuradas
- [ ] Políticas de INSERT configuradas
- [ ] Políticas de UPDATE configuradas
- [ ] Políticas de DELETE configuradas
- [ ] Testar acesso com usuário não autenticado

### Authentication

- [ ] Providers configurados (Email, etc)
- [ ] Email templates customizados
- [ ] Redirect URLs configuradas
- [ ] Rate limiting ativo

### CORS

- [ ] Domínio do Netlify adicionado aos domains permitidos
- [ ] Localhost permitido apenas em development
- [ ] Verificar em: Supabase → Settings → API → CORS

---

## 🌐 NETLIFY - CONFIGURAÇÃO

### Build Settings

- [ ] Build command: `node build-config.js`
- [ ] Publish directory: `.`
- [ ] Node version: 14.x ou superior

### Environment Variables

```
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=eyJ...
```

- [ ] Variáveis adicionadas
- [ ] Deploy context: Production
- [ ] Sem espaços extras nas keys

### Domain & HTTPS

- [ ] HTTPS forçado (Force HTTPS)
- [ ] Domínio customizado configurado (opcional)
- [ ] SSL/TLS certificate ativo

### Deploy Settings

- [ ] Branch de produção: `main` ou `master`
- [ ] Auto publishing ativado
- [ ] Build hooks configurados (opcional)

---

## 🔍 CODE REVIEW - QUALIDADE

### JavaScript

- [ ] Nenhum `eval()` no código
- [ ] Nenhum `document.write()` no código
- [ ] console.log removidos ou protegidos por NODE_ENV
- [ ] Variáveis declaradas com `const`/`let` (não `var`)
- [ ] Funções com nomes descritivos
- [ ] Comentários óbvios removidos

### HTML

- [ ] Todos os forms têm `novalidate` ou validação adequada
- [ ] Inputs têm `autocomplete` apropriado
- [ ] Meta tags de SEO presentes
- [ ] Favicon configurado

### CSS

- [ ] Sem inline styles críticos
- [ ] CSS minificado ou otimizado
- [ ] Fontes carregadas de forma otimizada

---

## 🛡️ HEADERS DE SEGURANÇA

Verificar em `netlify.toml`:

- [ ] X-Frame-Options: DENY
- [ ] X-Content-Type-Options: nosniff
- [ ] X-XSS-Protection: 1; mode=block
- [ ] Referrer-Policy: strict-origin-when-cross-origin
- [ ] Strict-Transport-Security (HSTS)
- [ ] Content-Security-Policy configurado
- [ ] Permissions-Policy configurado

---

## 🧪 TESTES PRÉ-PRODUÇÃO

### Funcionalidade

- [ ] Login funciona corretamente
- [ ] Cadastro de imóveis funciona
- [ ] Upload de imagens funciona
- [ ] Filtros de busca funcionam
- [ ] Listagem carrega corretamente
- [ ] Modal de detalhes abre/fecha
- [ ] Logout funciona

### Navegadores

- [ ] Chrome (Desktop)
- [ ] Firefox (Desktop)
- [ ] Safari (Desktop)
- [ ] Safari (iOS)
- [ ] Chrome (Android)
- [ ] Edge

### Responsividade

- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)
- [ ] Mobile (360x640)

### Performance

- [ ] Lighthouse Performance > 80
- [ ] Lighthouse Accessibility > 90
- [ ] Lighthouse Best Practices > 90
- [ ] Lighthouse SEO > 80

---

## 📊 TESTES DE SEGURANÇA

### Análise Online

- [ ] [Mozilla Observatory](https://observatory.mozilla.org/) - Score B+ ou superior
- [ ] [Security Headers](https://securityheaders.com/) - Score A ou superior
- [ ] [SSL Labs](https://www.ssllabs.com/ssltest/) - Score A ou superior

### Auditoria de Dependências

```bash
cd backend
npm audit --production
# Deve retornar 0 vulnerabilidades críticas
```

### Testes Manuais

- [ ] Tentar XSS em inputs de texto
- [ ] Tentar SQL injection (se aplicável)
- [ ] Tentar acessar rotas sem autenticação
- [ ] Verificar se dados sensíveis não vazam em erros

---

## 🚀 DEPLOY

### Primeira Vez

```bash
# 1. Commitar mudanças
git add .
git commit -m "chore: prepare for production deploy"

# 2. Push para GitHub
git push origin main

# 3. Netlify vai auto-deploy
```

### Verificação Pós-Deploy

- [ ] Site carregou sem erros
- [ ] Console do navegador sem erros
- [ ] Login funciona
- [ ] Dados carregam do Supabase
- [ ] Imagens carregam corretamente

### Monitore por 24h

- [ ] Verificar logs do Netlify
- [ ] Verificar logs do Supabase
- [ ] Verificar analytics (se configurado)
- [ ] Responder a problemas reportados

---

## 📈 PÓS-DEPLOY

### Documentação

- [ ] README.md atualizado
- [ ] DEPLOY_NETLIFY.md revisado
- [ ] SECURITY_AUDIT.md arquivado
- [ ] Changelog atualizado

### Monitoramento

- [ ] Configurar uptime monitoring
- [ ] Configurar error tracking (Sentry)
- [ ] Configurar analytics
- [ ] Configurar alertas

### Backup

- [ ] Exportar dados do Supabase
- [ ] Fazer backup do código
- [ ] Documentar processo de rollback

### Marketing

- [ ] Atualizar links no Instagram
- [ ] Atualizar materiais de divulgação
- [ ] Enviar email para clientes
- [ ] Anunciar lançamento

---

## 🔄 MANUTENÇÃO CONTÍNUA

### Semanal

- [ ] Verificar logs de erro
- [ ] Revisar métricas de uso
- [ ] Responder feedbacks de usuários

### Mensal

- [ ] Executar `npm audit`
- [ ] Atualizar dependências
- [ ] Revisar analytics
- [ ] Testar funcionalidades críticas

### Trimestral

- [ ] Auditoria de segurança completa
- [ ] Revisar e otimizar performance
- [ ] Atualizar documentação
- [ ] Planejar novas features

---

## ⚠️ ROLLBACK PLAN

Se algo der errado:

1. **Via Netlify Dashboard:**
   - Deploys → Selecionar deploy anterior → Publish deploy

2. **Via Git:**

   ```bash
   git revert HEAD
   git push origin main
   ```

3. **Restaurar Banco de Dados:**
   - Supabase → Database → Backups → Restore

---

## 📞 CONTATOS DE EMERGÊNCIA

### Suporte Técnico

- **Netlify Support:** https://www.netlify.com/support/
- **Supabase Support:** https://supabase.com/support

### Serviços Críticos

- **Status Netlify:** https://netlifystatus.com/
- **Status Supabase:** https://status.supabase.com/

---

## ✅ ASSINATURA FINAL

**Deploy realizado por:** ********\_********

**Data:** ********\_********

**Versão:** 2.0.0

**Todos os itens verificados:** [ ] SIM [ ] NÃO

**Notas:**

---

---

---

---

🎉 **Parabéns! Seu site está pronto para produção!**
