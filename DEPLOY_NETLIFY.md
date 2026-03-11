# 🚀 GUIA DE DEPLOY NO NETLIFY - Gabrielly Corretora

## ✅ CHECKLIST PRÉ-DEPLOY

### 1. Variáveis de Ambiente Obrigatórias

Configure no Netlify Dashboard: **Site Settings → Environment Variables**

| Variável            | Descrição                   | Onde Obter                             | Obrigatório |
| ------------------- | --------------------------- | -------------------------------------- | ----------- |
| `SUPABASE_URL`      | URL do projeto Supabase     | Dashboard do Supabase → Settings → API | ✅ Sim      |
| `SUPABASE_ANON_KEY` | Chave pública (anon/public) | Dashboard do Supabase → Settings → API | ✅ Sim      |

⚠️ **IMPORTANTE**:

- Use apenas a chave **ANON/PUBLIC** (começa com `eyJ...`)
- **NUNCA** use a `service_role` key no frontend
- A chave anon é segura para exposição pública SE você configurou Row Level Security (RLS)

### 2. Configurações do Supabase

Antes do deploy, verifique no Supabase Dashboard:

1. **Row Level Security (RLS)** está ATIVADO em todas as tabelas
2. **Políticas de acesso** estão configuradas corretamente
3. **Authentication** está configurado (se usar login)
4. **CORS** permite seu domínio do Netlify

### 3. Configurações no Netlify

#### Build Settings

- **Build command:** `node build-config.js`
- **Publish directory:** `.` (raiz do projeto)
- **Node version:** 14.x ou superior

#### Deploy Settings

```toml
[build]
  command = "node build-config.js"
  publish = "."
```

## 📋 PASSO A PASSO DO DEPLOY

### Opção 1: Deploy via GitHub (Recomendado)

1. **Conectar Repositório**
   - Vá em Netlify → Add new site → Import an existing project
   - Conecte sua conta do GitHub
   - Selecione o repositório

2. **Configurar Build**
   - Build command: `node build-config.js`
   - Publish directory: `.`

3. **Adicionar Environment Variables**
   - Vá em Site Settings → Environment Variables
   - Adicione `SUPABASE_URL` e `SUPABASE_ANON_KEY`

4. **Deploy**
   - Clique em "Deploy site"
   - Aguarde o build completar

### Opção 2: Deploy Manual via Netlify CLI

```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod

# Ou para preview
netlify deploy
```

### Opção 3: Deploy via Drag & Drop

⚠️ **Não recomendado** - As variáveis de ambiente não serão injetadas automaticamente.

## 🔐 SEGURANÇA - VERIFICAÇÃO PÓS-DEPLOY

### Checklist de Segurança OWASP

- [ ] **HTTPS forçado** - Netlify ativa automaticamente
- [ ] **Headers de segurança** configurados no `netlify.toml`
- [ ] **CSP** (Content Security Policy) ativo
- [ ] **X-Frame-Options: DENY** para prevenir clickjacking
- [ ] **X-Content-Type-Options: nosniff** ativo
- [ ] **Referrer-Policy** configurado
- [ ] **Strict-Transport-Security (HSTS)** ativo

### Testar Segurança

Após deploy, teste seu site em:

- [Mozilla Observatory](https://observatory.mozilla.org/)
- [Security Headers](https://securityheaders.com/)
- [SSL Labs](https://www.ssllabs.com/ssltest/)

Scores esperados:

- Mozilla Observatory: B+ ou superior
- Security Headers: A ou superior
- SSL Labs: A ou superior

## 🐛 TROUBLESHOOTING

### Erro: "Credenciais do Supabase não configuradas"

**Solução:**

1. Verifique se as variáveis de ambiente estão configuradas corretamente
2. Certifique-se que não há espaços extras nas keys
3. Redeploy após adicionar as variáveis

### Erro 404 em rotas

**Solução:**

- Verifique se o `netlify.toml` tem os redirects configurados
- O arquivo já está configurado corretamente para SPA

### Build falha

**Problemas comuns:**

- Node version incompatível → Configure Node 14.x ou superior
- Dependências faltando → Verifique `package.json`
- Caminho do build incorreto → Deve ser `node build-config.js`

### Imagens não carregam

**Solução:**

- Verifique se as imagens estão commitadas no repositório
- Caminhos devem ser relativos: `./ativos/img/` ou `/ativos/img/`
- CSP pode estar bloqueando → Verifique console do navegador

## 📊 MONITORAMENTO

### Logs do Netlify

- Acesse: Site → Deploys → Click no deploy → Deploy log
- Verifique erros no build

### Analytics (Opcional)

- Netlify Analytics → $9/mês
- Google Analytics → Configure manualmente
- Plausible/Fathom → Alternativas privacy-friendly

## 🔄 ATUALIZAÇÕES

### Deploy Automático

Configurado deploy contínuo via GitHub:

- Push na branch `main` → Deploy automático
- Pull Request → Deploy preview
- Rollback disponível via Netlify Dashboard

### Deploy Manual

```bash
netlify deploy --prod
```

## 🚨 SEGURANÇA CRÍTICA

### ❌ NUNCA FAÇA ISSO:

- Commitar arquivos `.env` com credenciais reais
- Usar `service_role` key no frontend
- Desabilitar Row Level Security no Supabase
- Expor `JWT_SECRET` ou outras secrets
- Commitar `credentials.json` ou `token.json`

### ✅ SEMPRE FAÇA ISSO:

- Use variáveis de ambiente para todas as credenciais
- Mantenha RLS ativo no Supabase
- Valide inputs no frontend E backend
- Sanitize dados antes de renderizar no DOM
- Mantenha dependências atualizadas (`npm audit`)

## 📞 SUPORTE

Problemas com:

- **Netlify:** [Netlify Docs](https://docs.netlify.com/)
- **Supabase:** [Supabase Docs](https://supabase.com/docs)
- **Segurança:** [OWASP Top 10](https://owasp.org/www-project-top-ten/)

## 📝 PRÓXIMOS PASSOS PÓS-DEPLOY

1. [ ] Configurar domínio customizado
2. [ ] Configurar emails de notificação
3. [ ] Configurar backup automático do Supabase
4. [ ] Implementar monitoramento de erros (Sentry)
5. [ ] Configurar Google Analytics ou alternativa
6. [ ] Testar em dispositivos móveis
7. [ ] Executar auditoria de performance (Lighthouse)
8. [ ] Configurar favicon e manifest.json para PWA

---

**Data de criação:** ${new Date().toISOString().split('T')[0]}
**Versão:** 2.0.0
