# Configuração de Email - Guia Completo

## 🔑 Passo 1: Gerar App Password do Gmail

1. Acesse sua conta Google: https://myaccount.google.com/
2. Na barra esquerda, clique em **Segurança**
3. Role para baixo e procure por **Senhas de app**
4. Se não aparecer, ative **Verificação de duas etapas** primeiro
5. Selecione:
   - **Aplicativo:** Mail
   - **Dispositivo:** Windows Computer (ou seu dispositivo)
6. Clique em **Gerar**
7. Copie a senha de 16 caracteres que será exibida

## 📝 Passo 2: Atualizar o Arquivo .env

Abra o arquivo `backend/.env` e atualize:

```bash
EMAIL_USER=Gabriellycorretora1@gmail.com
EMAIL_PASSWORD=sua_senha_de_app_aqui  # Cole os 16 caracteres aqui
EMAIL_DESTINO=Gabriellycorretora1@gmail.com
```

**Exemplo:**

```bash
EMAIL_USER=Gabriellycorretora1@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop  # Remova os espaços, ficará: abcdefghijklmnop
EMAIL_DESTINO=Gabriellycorretora1@gmail.com
```

## 🚀 Passo 3: Iniciar o Backend

```bash
cd backend
npm start
```

Ou em desenvolvimento com nodemon:

```bash
npm run dev
```

## ✅ Passo 4: Testar o Formulário

1. Acesse `tela-inicial/contato.html` no navegador
2. Preencha o formulário com seu email
3. Clique em "Enviar Mensagem"
4. Você deve receber dois emails:
   - **Email para Gabrielly**: Com os dados do contato
   - **Email de confirmação**: Para o cliente

## 🔧 Estrutura do Backend

- **Controlador**: `backend/controladores/contatocontroller.js`
  - Lógica de envio de emails
  - Template HTML dos emails
- **Rota**: `backend/rotas/contato.js`
  - Endpoint: `POST /api/contato/enviar`
- **Servidor**: `backend/server.js`
  - Rota registrada como `/api/contato`

## 📧 Dados do Email

O formulário envia:

```json
{
  "nome": "Nome do cliente",
  "email": "cliente@email.com",
  "telefone": "75 99999-9999",
  "assunto": "Tenho interesse em um imóvel",
  "mensagem": "Gostaria de saber mais sobre..."
}
```

## 🆘 Troubleshooting

**Erro: "Erro ao enviar mensagem"**

- Verifique se o EMAIL_PASSWORD está correto no .env
- Confirme se você gerou uma App Password (não a senha normal)
- Reinicie o servidor após atualizar o .env

**Emails não chegando**

- Verifique a pasta de SPAM do Gmail
- Confirme que EMAIL_USER e EMAIL_PASSWORD estão corretos

**CORS Error**

- Certifique-se de que FRONTEND_URL no .env inclui o protocolo (http://)
- Por padrão deve ser: `http://localhost:5500`

## 📱 Em Produção

Quando colocar em produção:

1. Atualize `API_URL` no `contato.html` para seu domínio real
2. Configure `FRONTEND_URL` no .env para seu domínio
3. Considere adicionar rate limiting ou recaptcha
