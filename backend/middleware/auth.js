const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    let token;

    console.log("🔍 DEBUG Auth Middleware:");
    console.log("  - Cookies recebidos:", req.cookies);
    console.log("  - Authorization header:", req.headers.authorization);

    // ✅ SEGURANÇA: Tentar obter token de diferentes fontes (em ordem de prioridade)
    // 1. Cookie HttpOnly (mais seguro)
    if (req.cookies && req.cookies.authToken) {
      token = req.cookies.authToken;
      console.log("  - Token encontrado no cookie ✅");
    }
    // 2. Header Authorization (compatibilidade com sessões)
    else if (req.headers.authorization) {
      const authHeader = req.headers.authorization;
      const parts = authHeader.split(" ");

      if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
        token = parts[1];
        console.log("  - Token encontrado no header ✅");
      } else {
        console.log("  - Formato de token inválido ❌");
        return res.status(401).json({
          error: true,
          message: "Formato de token inválido",
        });
      }
    }

    if (!token) {
      console.log("  - Token não fornecido ❌");
      return res.status(401).json({
        error: true,
        message: "Token não fornecido",
      });
    }

    // Verificar token
    console.log("  - JWT_SECRET definido?", !!process.env.JWT_SECRET);
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        console.log("  - Erro ao verificar token:", err.message);
        // ✅ Apenas expor detalhes de erro em desenvolvimento
        const message =
          process.env.NODE_ENV === "development"
            ? `Token inválido: ${err.message}`
            : "Token inválido ou expirado";

        return res.status(401).json({
          error: true,
          message: message,
        });
      }

      console.log("  - Token verificado com sucesso ✅");
      console.log("  - Decoded:", decoded);

      // Adicionar dados do usuário na requisição
      req.userId = decoded.id;
      req.userEmail = decoded.email;

      return next();
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Erro no middleware de autenticação:", error);
    }

    return res.status(401).json({
      error: true,
      message: "Falha na autenticação",
    });
  }
};

module.exports = authMiddleware;
