const isLocal =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";
const API_BASE_URL = isLocal
  ? "http://localhost:3001"
  : "https://gabrielly-corretora.onrender.com";
const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

function validatePasswordStrength(password) {
  if (!STRONG_PASSWORD_REGEX.test(password)) {
    return "Senha fraca. Requer: 8+ caracteres, maiúscula, minúscula, número e símbolo (@$!%*?&)";
  }
  return null;
}

// Aguarda o carregamento do DOM
document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".login-form");
  const emailInput = document.getElementById("email");
  const senhaInput = document.getElementById("password");
  const errorMessage = document.getElementById("error-message");
  const togglePasswordBtn = document.querySelector(".toggle-password");
  const rememberMe = document.getElementById("rememberMe");

  // ✅ SANITIZAÇÃO: Função para limpar strings e evitar XSS
  function sanitizeInput(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // ✅ Verificar se há email salvo com validação
  const savedEmail = localStorage.getItem("savedEmail");
  if (savedEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(savedEmail)) {
    emailInput.value = sanitizeInput(savedEmail);
    rememberMe.checked = true;
  }

  // Função para limpar erros visuais
  function clearErrors() {
    emailInput.classList.remove("is-invalid");
    emailInput.setAttribute("aria-invalid", "false");
    senhaInput.classList.remove("is-invalid");
    senhaInput.setAttribute("aria-invalid", "false");
    errorMessage.textContent = "";
    errorMessage.classList.remove("show");
  }

  // ✅ SEGURANÇA: Função para mostrar erro com sanitização
  function showError(message) {
    errorMessage.textContent = sanitizeInput(String(message));
    errorMessage.classList.add("show");
    setTimeout(() => {
      errorMessage.classList.remove("show");
    }, 4000);
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault(); // evita recarregar a página
    clearErrors();

    const email = emailInput.value.trim();
    const senha = senhaInput.value.trim();
    const submitBtn = form.querySelector('button[type="submit"]');

    // Validação de campos vazios
    if (!email || !senha) {
      showError("Por favor, preencha todos os campos.");
      if (!email) {
        emailInput.classList.add("is-invalid");
        emailInput.focus();
      }
      if (!senha) {
        senhaInput.classList.add("is-invalid");
        if (email) senhaInput.focus();
      }
      return;
    }

    // Validação de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showError("Por favor, insira um email válido.");
      emailInput.classList.add("is-invalid");
      emailInput.focus();
      return;
    }

    // ✅ SEGURANÇA: Validação de força de senha (feedback ao usuário)
    const passwordError = validatePasswordStrength(senha);
    if (passwordError) {
      showError(passwordError);
      senhaInput.classList.add("is-invalid");
      senhaInput.focus();
      return;
    }

    // Mostrar loading
    submitBtn.disabled = true;
    const originalContent = submitBtn.innerHTML;
    submitBtn.innerHTML =
      '<span>Entrando...</span><span class="button-icon">⏳</span>';

    // ✅ Login seguro via API backend com URL configurável
    // Token será armazenado automaticamente em HttpOnly cookie pelo servidor
    console.log("🚀 Tentando login em:", `${API_BASE_URL}/api/auth/login`);
    fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // ✅ Necessário para enviar/receber cookies HttpOnly
      body: JSON.stringify({ email, senha }),
    })
      .then(async (response) => {
        console.log(
          "✅ Resposta recebida:",
          response.status,
          response.statusText,
        );
        let data;
        try {
          data = await response.json();
          console.log("📊 Dados da resposta:", data);
        } catch (e) {
          console.error("❌ Erro ao parsear JSON:", e);
          showError("Erro ao processar resposta do servidor");
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalContent;
          console.error("Erro ao parsear resposta:", e);
          return;
        }

        if (response.ok && data.success) {
          console.log("✅ Login bem-sucedido!");
          // Salvar email se checkbox marcado (⚠️ Apenas email, não token!)
          if (rememberMe.checked) {
            localStorage.setItem("savedEmail", email);
          } else {
            localStorage.removeItem("savedEmail");
          }

          // Salvar token para uso via Authorization header (fallback de cookie)
          if (data.token) {
            sessionStorage.setItem("authToken", data.token);
          }

          submitBtn.innerHTML =
            '<span>Sucesso!</span><span class="button-icon">✓</span>';
          console.log("🔄 Redirecionando para painel...");
          setTimeout(() => {
            // Redirecionar para o painel na mesma pasta
            window.location.href = "./painel.html";
          }, 800);
        } else {
          console.error("❌ Login falhou:", data.message);
          showError(
            data.message || "E-mail ou senha incorretos. Tente novamente.",
          );
          emailInput.classList.add("is-invalid");
          emailInput.setAttribute("aria-invalid", "true");
          senhaInput.classList.add("is-invalid");
          senhaInput.setAttribute("aria-invalid", "true");
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalContent;
          emailInput.focus();
        }
      })
      .catch((error) => {
        console.error("❌ Erro de conexão:", error);
        showError("Erro de conexão. Tente novamente mais tarde.");
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalContent;
        console.error("Erro no login:", error);
      });
  });

  // Adiciona um listener para remover o erro ao começar a digitar
  emailInput.addEventListener("input", clearErrors);
  senhaInput.addEventListener("input", clearErrors);

  // Toggle show/hide password (acessível)
  if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const current = senhaInput.getAttribute("type");
      if (current === "password") {
        senhaInput.setAttribute("type", "text");
        togglePasswordBtn.textContent = "Ocultar";
        togglePasswordBtn.setAttribute("aria-label", "Ocultar senha");
        togglePasswordBtn.setAttribute("aria-pressed", "true");
      } else {
        senhaInput.setAttribute("type", "password");
        togglePasswordBtn.textContent = "Mostrar";
        togglePasswordBtn.setAttribute("aria-label", "Mostrar senha");
        togglePasswordBtn.setAttribute("aria-pressed", "false");
      }
      senhaInput.focus();
    });
  }

  // Permitir Enter para enviar o formulário
  senhaInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      form.dispatchEvent(new Event("submit"));
    }
  });

  // Desabilitar autocomplete em produção (comentado por segurança)
  // form.setAttribute('autocomplete', 'off');
});
