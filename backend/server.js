const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

app.set("trust proxy", 1);

app.use(cookieParser());
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
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

const allowedOrigins = new Set([
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  "http://localhost:5501",
  "http://127.0.0.1:5501",
  "https://gabrielly-corretora.vercel.app",
  "https://gabrielly-corretora.netlify.app",
]);

if (process.env.FRONTEND_URL) {
  process.env.FRONTEND_URL.split(",")
    .map((url) => url.trim())
    .filter(Boolean)
    .forEach((url) => allowedOrigins.add(url));
}

function origemPermitida(origin) {
  if (!origin) return NODE_ENV === "development";
  if (allowedOrigins.has(origin)) return true;

  try {
    const { hostname } = new URL(origin);
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.endsWith(".vercel.app") ||
      hostname.endsWith(".netlify.app")
    );
  } catch (error) {
    return false;
  }
}
app.use(
  cors({
    origin: function (origin, callback) {
      // Em desenvolvimento, permite requisições sem origin (ex: Postman)
      if (origemPermitida(origin)) {
        callback(null, true);
      } else {
        console.warn(`CORS bloqueado para origem: ${origin}`);
        callback(new Error("CORS não permitido"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400, // 24 horas
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

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

app.use("/uploads", express.static("uploads"));

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

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: true,
    message: err.message || "Erro interno do servidor",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: true,
    message: "Rota não encontrada",
  });
});

app.listen(PORT, () => {
  console.log(`Servidor iniciado na porta ${PORT}`);
  console.log(`Ambiente: ${NODE_ENV}`);
});

module.exports = app;
