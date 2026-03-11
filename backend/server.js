const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

// Trust proxy para Render
app.set("trust proxy", 1);

// ===== MIDDLEWARE DE SEGURANÇA =====

// 0. Cookie Parser - Necessário antes de outros middlewares
app.use(cookieParser());

// 1. Helmet - Headers de segurança HTTP
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://qlppgehmslfjffsfrazw.supabase.co"],
      },
    },
    hsts: {
      maxAge: 31536000, // 1 ano
      includeSubDomains: true,
      preload: true,
    },
    frameguard: { action: "deny" }, // X-Frame-Options: DENY
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    noSniff: true, // X-Content-Type-Options: nosniff
    xssFilter: true, // X-XSS-Protection: 1; mode=block
  }),
);

// 2. CORS configurável por ambiente
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",")
  : [
      "http://localhost:5500",
      "http://127.0.0.1:5500",
      "http://localhost:5501",
      "http://127.0.0.1:5501",
    ];
app.use(
  cors({
    origin: function (origin, callback) {
      // Em desenvolvimento, permite requisições sem origin (ex: Postman)
      if (!origin && NODE_ENV === "development") {
        callback(null, true);
        return;
      }
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`❌ CORS bloqueado para origem: ${origin}`);
        callback(new Error("CORS não permitido"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400, // 24 horas
  }),
);

// 3. Body parser com limite
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 4. Rate limiting diferenciado por ambiente
const limiterConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: NODE_ENV === "production" ? 50 : 200, // Mais restritivo em produção
  message: "Muitas requisições deste IP, tente novamente em 15 minutos",
  standardHeaders: true,
  legacyHeaders: false,
};

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: NODE_ENV === "production" ? 5 : 20, // Máximo 5 tentativas em produção
  message: "Muitas tentativas de login. Tente novamente em 15 minutos",
  skipSuccessfulRequests: true, // Não conta requisições bem-sucedidas
});

const apiLimiter = rateLimit(limiterConfig);
app.use("/api/", apiLimiter);

// 5. Logging de requisições com histórico persistente
const logHistory = [];
const MAX_LOG_HISTORY = 100;

function logRequest(method, path, details = "") {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    method,
    path,
    details,
  };

  logHistory.push(logEntry);
  if (logHistory.length > MAX_LOG_HISTORY) {
    logHistory.shift();
  }

  const emoji =
    method === "POST"
      ? "📝"
      : method === "GET"
        ? "📖"
        : method === "PUT"
          ? "✏️"
          : method === "DELETE"
            ? "🗑️"
            : "📡";
  console.log(
    `${emoji} [${timestamp}] ${method} ${path}${details ? " - " + details : ""}`,
  );
}

if (NODE_ENV === "development") {
  app.use((req, res, next) => {
    logRequest(req.method, req.path);
    next();
  });
}

// Endpoint para visualizar histórico de logs
app.get("/api/logs", (req, res) => {
  res.json({
    success: true,
    logs: logHistory,
    total: logHistory.length,
  });
});

// Servir arquivos estáticos (uploads)
app.use("/uploads", express.static("uploads"));

// ===== ROTAS =====
const authRoutes = require("./rotas/auth");
const imoveisRoutes = require("./rotas/imoveis");
const proprietariosRoutes = require("./rotas/proprietarios");
const atendimentosRoutes = require("./rotas/atendimentos");
const contatoRoutes = require("./rotas/contato");

app.use("/api/auth", authRoutes);
app.use("/api/imoveis", imoveisRoutes);
app.use("/api/proprietarios", proprietariosRoutes);
app.use("/api/atendimentos", atendimentosRoutes);
app.use("/api/contato", contatoRoutes);

// Rota raiz
app.get("/", (req, res) => {
  res.json({
    message: "API Gabrielly Silva Corretora",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      imoveis: "/api/imoveis",
      proprietarios: "/api/proprietarios",
      atendimentos: "/api/atendimentos",
    },
  });
});

// ===== TRATAMENTO DE ERROS =====
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: true,
    message: err.message || "Erro interno do servidor",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// 404 - Rota não encontrada
app.use((req, res) => {
  res.status(404).json({
    error: true,
    message: "Rota não encontrada",
  });
});

// ===== INICIAR SERVIDOR =====
app.listen(PORT, () => {
  const separator = "═".repeat(60);
  const timestamp = new Date().toISOString();

  console.log("\n" + separator);
  console.log(`🔄 SERVIDOR REINICIADO - ${timestamp}`);
  console.log(separator);

  // ✅ Logs apenas em desenvolvimento
  if (NODE_ENV === "development") {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📡 API: http://localhost:${PORT}`);
    console.log(`🌐 Frontend: ${process.env.FRONTEND_URL}`);
    console.log(`📦 Ambiente: ${process.env.NODE_ENV || "development"}`);
    console.log(`🍪 Cookie Parser: ✅ Ativo`);
    console.log(`🔒 CORS Origins: ${allowedOrigins.join(", ")}`);
  } else {
    console.log(`✅ Servidor iniciado na porta ${PORT}`);
  }

  console.log(separator + "\n");
  console.log("📋 Aguardando requisições...\n");
});

module.exports = app;
