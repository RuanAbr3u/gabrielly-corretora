/**
 * ✅ Script de Logout Seguro
 * Limpa sessão e cookies de forma segura
 */

// Detecta automaticamente se está em produção (Vercel) ou desenvolvimento (localhost)
const isLocal =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";
const API_BASE_URL = isLocal
  ? "http://localhost:3001"
  : "https://gabrielly-corretora.onrender.com";

// ✅ Função de logout seguro
async function logoutSeguro() {
  try {
    // 1. Enviar requisição ao backend para limpar cookies
    const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include", // Enviar cookies
      headers: {
        "Content-Type": "application/json",
      },
    });

    // 2. Limpar dados locais (compatibilidade)
    localStorage.removeItem("savedEmail");
    sessionStorage.clear();

    // 3. Redirecionar para login
    if (response.ok) {
      window.location.href = "login.html?logout=success";
    } else {
      // Mesmo com erro, fazer logout local
      window.location.href = "login.html?logout=forced";
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Erro no logout:", error);
    }
    // Logout forçado em caso de erro
    localStorage.removeItem("savedEmail");
    sessionStorage.clear();
    window.location.href = "login.html";
  }
}

// ✅ Logout ao clicar em botão (adicione em painel.html)
document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (confirm("Tem certeza que deseja fazer logout?")) {
        logoutSeguro();
      }
    });
  }

  // ✅ Logout automático por inatividade (10 minutos)
  let inactivityTimer;
  const INACTIVITY_TIME = 10 * 60 * 1000; // 10 minutos

  function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      console.warn("⏱️ Sessão expirada por inatividade");
      logoutSeguro();
    }, INACTIVITY_TIME);
  }

  // Detectar atividade do usuário
  document.addEventListener("mousemove", resetInactivityTimer);
  document.addEventListener("keypress", resetInactivityTimer);
  document.addEventListener("click", resetInactivityTimer);

  // Iniciar timer
  resetInactivityTimer();

  // ✅ Detectar fechamento de aba e fazer logout
  window.addEventListener("beforeunload", () => {
    // Envio assíncrono de logout (não previsível)
    // Continuará em background
    fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
      keepalive: true, // Importante para requisições em beforeunload
    }).catch(() => {
      // Silenciosamente ignorar erros
    });
  });
});

// Exportar função para uso em outros scripts
if (typeof module !== "undefined" && module.exports) {
  module.exports = { logoutSeguro };
}
