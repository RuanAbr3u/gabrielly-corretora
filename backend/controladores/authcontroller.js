const { createClient } = require("@supabase/supabase-js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
// Debug: verificar variáveis
console.log("🔧 SUPABASE_URL:", process.env.SUPABASE_URL);
console.log(
  "🔧 SUPABASE_SERVICE_KEY:",
  process.env.SUPABASE_SERVICE_KEY ? "✅ Definida" : "❌ Não definida",
);
// Inicializar Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
);

// ✅ VALIDAR FORÇA DE SENHA
const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const WEAK_PASSWORDS = [
  "123456",
  "password",
  "qwerty",
  "admin",
  "letmein",
  "welcome",
];

function validatePasswordStrength(senha) {
  if (!STRONG_PASSWORD_REGEX.test(senha)) {
    return {
      valid: false,
      message:
        "Senha fraca. Requer: 8+ caracteres, maiúscula, minúscula, número e símbolo (@$!%*?&)",
    };
  }

  if (WEAK_PASSWORDS.includes(senha.toLowerCase())) {
    return {
      valid: false,
      message: "Esta senha é muito comum. Use uma senha única.",
    };
  }

  return { valid: true };
}

// LOGIN
async function login(req, res) {
  try {
    const { email, senha } = req.body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({
        error: true,
        message: "Email inválido",
      });
    }

    if (!senha || String(senha).length < 1) {
      return res.status(400).json({
        error: true,
        message: "Senha obrigatória",
      });
    }

    // Buscar usuário no Supabase
    const { data: usuarios, error: erroSelectUsuario } = await supabase
      .from("usuarios")
      .select("*")
      .eq("email", email)
      .eq("ativo", true);

    if (erroSelectUsuario) {
      console.error("❌ Erro ao consultar Supabase:", erroSelectUsuario);
      return res.status(500).json({
        error: true,
        message: "Erro ao realizar login",
      });
    }

    if (!usuarios || usuarios.length === 0) {
      return res.status(401).json({
        error: true,
        message: "Email ou senha incorretos",
      });
    }

    const usuario = usuarios[0];

    // Verificar senha
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

    if (!senhaCorreta) {
      return res.status(401).json({
        error: true,
        message: "Email ou senha incorretos",
      });
    }

    // Gerar token JWT
    const token = jwt.sign(
      {
        id: usuario.id,
        email: usuario.email,
        nome: usuario.nome,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
    );

    // Enviar token via cookie HttpOnly
    const cookieOptions = {
      httpOnly: true,
      secure: false, // Em desenvolvimento, permitir HTTP
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    };

    // Em desenvolvimento, não usar sameSite para permitir localhost/127.0.0.1
    if (process.env.NODE_ENV === "production") {
      cookieOptions.sameSite = "lax";
    }

    console.log("🍪 Definindo cookie authToken com opções:", cookieOptions);
    res.cookie("authToken", token, cookieOptions);

    return res.json({
      success: true,
      message: "Login realizado com sucesso",
      token: token, // Incluído para fallback via Authorization header
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
      },
    });
  } catch (error) {
    console.error("❌ Erro no login:", error);
    if (process.env.NODE_ENV === "development") {
      console.error("Stack:", error.stack);
    }
    return res.status(500).json({
      error: true,
      message: "Erro ao realizar login",
    });
  }
}

// LOGOUT
async function logout(req, res) {
  try {
    res.clearCookie("authToken", {
      httpOnly: true,
      secure:
        process.env.NODE_ENV === "production" ||
        process.env.FORCE_HTTPS === "true",
      sameSite: "strict",
      path: "/",
    });

    return res.json({
      success: true,
      message: "Logout realizado com sucesso",
    });
  } catch (error) {
    console.error("❌ Erro no logout:", error);
    return res.status(500).json({
      error: true,
      message: "Erro ao realizar logout",
    });
  }
}

// VALIDAR TOKEN
async function validarToken(req, res) {
  try {
    // O middleware já validou o token e adicionou userId e userEmail
    return res.json({
      success: true,
      message: "Token válido",
      usuario: {
        id: req.userId,
        email: req.userEmail,
      },
    });
  } catch (error) {
    console.error("❌ Erro ao validar token:", error);
    return res.status(401).json({
      error: true,
      message: "Token inválido",
    });
  }
}

// TROCAR SENHA
async function trocarSenha(req, res) {
  try {
    const { senhaAtual, senhaNova } = req.body;
    const usuarioId = req.usuario.id;

    // Validar nova senha
    const validacao = validatePasswordStrength(senhaNova);
    if (!validacao.valid) {
      return res.status(400).json({
        error: true,
        message: validacao.message,
      });
    }

    // Buscar usuário
    const { data: usuarios, error: erroSelect } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id", usuarioId);

    if (erroSelect || !usuarios || usuarios.length === 0) {
      return res.status(401).json({
        error: true,
        message: "Usuário não encontrado",
      });
    }

    const usuario = usuarios[0];

    // Verificar senha atual
    const senhaAtualCorreta = await bcrypt.compare(senhaAtual, usuario.senha);

    if (!senhaAtualCorreta) {
      return res.status(401).json({
        error: true,
        message: "Senha atual incorreta",
      });
    }

    // Hash da nova senha
    const novaSehaHash = await bcrypt.hash(senhaNova, 10);

    // Atualizar no Supabase
    const { error: erroUpdate } = await supabase
      .from("usuarios")
      .update({ senha: novaSehaHash, atualizado_em: new Date() })
      .eq("id", usuarioId);

    if (erroUpdate) {
      console.error("❌ Erro ao atualizar senha:", erroUpdate);
      return res.status(500).json({
        error: true,
        message: "Erro ao trocar senha",
      });
    }

    return res.json({
      success: true,
      message: "Senha alterada com sucesso",
    });
  } catch (error) {
    console.error("❌ Erro ao trocar senha:", error);
    return res.status(500).json({
      error: true,
      message: "Erro ao trocar senha",
    });
  }
}

module.exports = {
  login,
  logout,
  validarToken,
  trocarSenha,
};
