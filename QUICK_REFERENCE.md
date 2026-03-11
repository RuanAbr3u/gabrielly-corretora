# ⚡ QUICK REFERENCE - Deploy Netlify

## 🚀 DEPLOY RÁPIDO

### 1. Configurar Variáveis de Ambiente

```
Netlify → Site Settings → Environment Variables

SUPABASE_URL=https://qlppgehmslfjffsfrazw.supabase.co
SUPABASE_ANON_KEY=eyJ...sua-chave-aqui...
```

### 2. Build Settings

```
Build command: node build-config.js
Publish directory: .
```

### 3. Deploy

```bash
git push origin main
```

---

## 🔐 COMANDOS DE SEGURANÇA

```bash
# Verificar vulnerabilidades
npm run security:check

# Corrigir vulnerabilidades
npm run security:fix

# Remover credenciais do Git
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch backend/credentials.json" \
  --prune-empty --tag-name-filter cat -- --all
```

---

## 🛡️ XSS PREVENTION

```javascript
// ❌ NUNCA
element.innerHTML = userInput;

// ✅ SEMPRE
element.textContent = userInput;
// OU
element.textContent = Sanitizer.escapeHtml(userInput);
// OU
DOM.create("div", { text: userInput });
```

---

## 📋 CHECKLIST EXPRESS

**Pré-Deploy:**

- [ ] Variáveis no Netlify
- [ ] Sem credenciais hardcoded
- [ ] RLS ativo no Supabase

**Pós-Deploy:**

- [ ] Site carrega
- [ ] Login funciona
- [ ] Sem erros no console

**Testes de Segurança:**

- [ ] Mozilla Observatory > B
- [ ] Security Headers > A
- [ ] SSL Labs > A

---

## 🆘 TROUBLESHOOTING

**Erro: "Credenciais não configuradas"**
→ Adicionar `SUPABASE_URL` e `SUPABASE_ANON_KEY` no Netlify

**Erro 404 nas rotas**
→ Verificar redirects no `netlify.toml`

**Build falha**
→ Verificar Node version >= 14.x

**Imagens não carregam**
→ Verificar CSP no `netlify.toml`

---

## 📊 SCORES ESPERADOS

- **Mozilla Observatory:** B+ ou superior
- **Security Headers:** A ou superior
- **SSL Labs:** A ou superior
- **Lighthouse Performance:** 80+

---

## 📞 LINKS ÚTEIS

- [Security Headers Test](https://securityheaders.com/)
- [Mozilla Observatory](https://observatory.mozilla.org/)
- [Netlify Docs](https://docs.netlify.com/)
- [Supabase Dashboard](https://supabase.com/dashboard)

---

**Versão:** 2.0.0 | **Data:** ${new Date().toISOString().split('T')[0]}
