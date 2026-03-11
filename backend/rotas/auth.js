const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const authController = require("../controladores/authcontroller");
const authMiddleware = require("../middleware/auth");

// Rate limiter para login (máximo 5 tentativas em 15 minutos)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Muitas tentativas de login. Tente novamente em 15 minutos",
  skipSuccessfulRequests: true, // Não conta requisições bem-sucedidas
  skipFailedRequests: false, // Conta requisições falhadas
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress; // Rate limit por IP
  },
});

// Rotas públicas
router.post("/login", loginLimiter, authController.login);
router.post("/logout", authController.logout);

// Rotas protegidas (requerem autenticação)
router.get("/validar", authMiddleware, authController.validarToken);
router.post("/trocar-senha", authMiddleware, authController.trocarSenha);

module.exports = router;
