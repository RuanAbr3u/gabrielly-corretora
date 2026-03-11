const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");
const { authenticate } = require("@google-cloud/local-auth");

const CREDENTIALS_PATH = path.join(__dirname, "credentials.json");
const TOKEN_PATH = path.join(__dirname, "token.json");

async function generateToken() {
  try {
    console.log("🔐 Gerando token de autorização do Gmail...\n");

    const auth = await authenticate({
      scopes: ["https://www.googleapis.com/auth/gmail.send"],
      keyfilePath: CREDENTIALS_PATH,
      port: 8888,
    });

    const credentials = auth.credentials;
    const token = {
      type: credentials.type,
      client_id: credentials.client_id,
      client_secret: credentials.client_secret,
      refresh_token: credentials.refresh_token,
      access_token: credentials.access_token,
      expiry_date: credentials.expiry_date,
    };

    fs.writeFileSync(TOKEN_PATH, JSON.stringify(token, null, 2));
    console.log("✅ Token gerado com sucesso!");
    console.log(`📁 Arquivo salvo em: ${TOKEN_PATH}\n`);
    console.log("Você pode deletar este script agora.");
  } catch (error) {
    console.error("❌ Erro ao gerar token:", error.message);
    process.exit(1);
  }
}

generateToken();
