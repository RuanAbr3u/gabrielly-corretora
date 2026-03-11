# 📧 Sistema de Contato com Supabase + Email

Este sistema integra o formulário de contato do site com o Supabase (banco de dados) e envio automático de emails via Gmail.

## 🚀 Funcionalidades

- ✅ Salva todos os contatos no Supabase
- ✅ Envia email para Gabriellycorretora1@gmail.com
- ✅ Envia email de confirmação para o cliente
- ✅ Interface amigável com feedback visual
- ✅ Tratamento de erros robusto

## 📋 Pré-requisitos

1. **Conta no Supabase** (https://supabase.com)
2. **Conta Gmail** (Gabriellycorretora1@gmail.com)
3. **Node.js** instalado

## 🔧 Configuração Passo a Passo

### 1️⃣ Configurar Supabase

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá em **SQL Editor** → **New Query**
3. Execute o script completo em: `backend/configuração/supabase-setup.sql`
   - Isso criará a tabela `contatos` e configurará as permissões (RLS)

4. Obtenha suas credenciais:
   - **Project URL**: Settings → API → Project URL
   - **Anon Key**: Settings → API → anon/public key
   - **Service Role Key**: Settings → API → service_role key (🔒 **NUNCA exponha no frontend!**)

### 2️⃣ Configurar Gmail para Envio de Emails

O Gmail requer uma "Senha de App" (App Password) em vez da senha normal:

1. Acesse sua conta Google (Gabriellycorretora1@gmail.com)
2. Vá em **Conta do Google** → **Segurança**
3. Ative a **Verificação em duas etapas** (se ainda não estiver ativada)
4. Depois, procure por **Senhas de app**
5. Selecione:
   - **App**: Outro (nome personalizado) → Digite: "Site Gabrielly Corretora"
   - Clique em **Gerar**
6. **Copie a senha gerada** (16 caracteres) - você só verá uma vez!

📖 **Tutorial completo**: https://support.google.com/mail/answer/185833

### 3️⃣ Configurar Variáveis de Ambiente

1. Copie o arquivo de exemplo:

   ```bash
   cd backend
   cp .env.example .env
   ```

2. Edite o arquivo `.env` e preencha:

   ```env
   # Supabase
   SUPABASE_URL=https://xxxxxxxxxx.supabase.co
   SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

   # Email
   EMAIL_USER=Gabriellycorretora1@gmail.com
   EMAIL_PASSWORD=abcd efgh ijkl mnop  # Senha de App gerada

   # Outras configurações
   NODE_ENV=development
   PORT=3000
   FRONTEND_URL=http://localhost:5500
   ```

### 4️⃣ Instalar Dependências e Iniciar Servidor

```bash
cd backend
npm install
npm run dev
```

O servidor estará rodando em: `http://localhost:3000`

### 5️⃣ Configurar Frontend

No arquivo `tela-inicial/contato.html`, a URL da API já está configurada:

```javascript
const API_URL = "http://localhost:3000/api/contato/enviar";
```

**Para produção**, altere para:

```javascript
const API_URL = "https://seu-dominio.com/api/contato/enviar";
```

## 🧪 Testar o Sistema

1. Abra o arquivo `tela-inicial/contato.html` no navegador
2. Preencha o formulário de contato
3. Clique em "Enviar Mensagem"
4. Verifique se:
   - ✅ Mensagem de sucesso aparece
   - ✅ Email chega em Gabriellycorretora1@gmail.com
   - ✅ Email de confirmação chega no email do cliente
   - ✅ Contato é salvo no Supabase (verifique no painel: Table Editor → contatos)

## 📊 Visualizar Contatos no Supabase

1. Acesse [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá em **Table Editor**
3. Selecione a tabela **contatos**
4. Veja todos os contatos recebidos com:
   - Nome, email, telefone, assunto, mensagem
   - Status e data de criação

## 🔍 Solução de Problemas

### ❌ Erro: "Erro ao salvar contato no Supabase"

**Possíveis causas:**

- Credenciais do Supabase incorretas no `.env`
- Tabela `contatos` não foi criada (execute o SQL novamente)
- Row Level Security bloqueando inserção (verifique as políticas RLS)

**Solução:**

```bash
# Verifique se as variáveis estão corretas
node -e "require('dotenv').config(); console.log(process.env.SUPABASE_URL)"
```

### ❌ Erro: "Erro ao enviar email"

**Possíveis causas:**

- Senha de App do Gmail incorreta
- Verificação em duas etapas não ativada
- Email bloqueado por segurança do Google

**Solução:**

1. Gere uma nova senha de App
2. Verifique se o email não tem bloqueios de segurança
3. Teste com o script:
   ```bash
   cd backend
   node -e "require('dotenv').config(); const n = require('nodemailer'); n.createTransport({service:'gmail',auth:{user:process.env.EMAIL_USER,pass:process.env.EMAIL_PASSWORD}}).verify().then(console.log).catch(console.error)"
   ```

### ❌ Erro de CORS

Se aparecer erro de CORS no navegador:

1. Verifique se o servidor está rodando
2. Confirme que `FRONTEND_URL` no `.env` está correto
3. Para desenvolvimento local, use:
   ```env
   FRONTEND_URL=http://localhost:5500,http://127.0.0.1:5500
   ```

## 📦 Estrutura de Arquivos

```
backend/
├── controladores/
│   └── contatocontroller.js    # Lógica principal (Supabase + Email)
├── rotas/
│   └── contato.js               # Rota /api/contato/enviar
├── configuração/
│   └── supabase-setup.sql      # Script SQL com tabela contatos
├── .env.example                # Template de configuração
├── .env                        # Configuração real (não commitar!)
└── README-CONTATO.md           # Este arquivo

tela-inicial/
└── contato.html                # Formulário de contato
```

## 🔐 Segurança

- ✅ **Row Level Security (RLS)** ativado no Supabase
- ✅ Qualquer pessoa pode **inserir** contatos (formulário público)
- ✅ Apenas usuários autenticados podem **ler/editar** contatos
- ✅ Service Key do Supabase **nunca** exposta no frontend
- ✅ Rate limiting ativo na API
- ✅ Validação de dados no backend
- ✅ CORS configurado para domínios específicos

## 📞 Suporte

Se encontrar problemas, verifique:

1. **Logs do servidor**: Terminal onde o `npm run dev` está rodando
2. **Console do navegador**: F12 → Console
3. **Logs do Supabase**: Dashboard → Logs
4. **Email Setup Guide**: `../EMAIL_SETUP.md`

---

Desenvolvido por Ruan Abreu | 2026
