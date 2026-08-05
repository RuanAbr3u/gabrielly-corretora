document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contatoForm");
  if (!form) return;

  const isLocal = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const API_URL = isLocal
    ? "http://localhost:3001/api/contato/enviar"
    : "https://gabrielly-corretora.onrender.com/api/contato/enviar";

  const fields = ["nome", "email", "telefone", "assunto", "mensagem"];
  const status = document.getElementById("statusMensagem");
  const submitButton = form.querySelector("button[type='submit']");

  const setStatus = (message, type) => {
    status.textContent = message;
    status.className = `form-status is-${type}`;
  };

  const setError = (field, message) => {
    const input = document.getElementById(field);
    const error = document.getElementById(`erro-${field}`);
    if (!input || !error) return;
    error.textContent = message;
    input.setAttribute("aria-invalid", message ? "true" : "false");
    input.setAttribute("aria-describedby", error.id);
  };

  const validate = () => {
    let isValid = true;
    fields.forEach((field) => setError(field, ""));

    const nome = form.nome.value.trim();
    const email = form.email.value.trim();
    const assunto = form.assunto.value.trim();
    const mensagem = form.mensagem.value.trim();

    if (nome.length < 2) {
      setError("nome", "Informe seu nome.");
      isValid = false;
    }

    if (!form.email.validity.valid || !email) {
      setError("email", "Informe um email válido.");
      isValid = false;
    }

    if (assunto.length < 3) {
      setError("assunto", "Informe o assunto.");
      isValid = false;
    }

    if (mensagem.length < 10) {
      setError("mensagem", "Escreva uma mensagem com pelo menos 10 caracteres.");
      isValid = false;
    }

    return isValid;
  };

  fields.forEach((field) => {
    const input = document.getElementById(field);
    input?.addEventListener("input", () => setError(field, ""));
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!validate()) {
      setStatus("Revise os campos destacados antes de enviar.", "error");
      return;
    }

    submitButton.disabled = true;
    setStatus("Enviando mensagem...", "success");

    const formData = {
      nome: form.nome.value.trim(),
      email: form.email.value.trim(),
      telefone: form.telefone.value.trim() || null,
      assunto: form.assunto.value.trim(),
      mensagem: form.mensagem.value.trim(),
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Erro ao enviar mensagem.");
      }

      setStatus(result.message || "Mensagem enviada com sucesso. Em breve entraremos em contato.", "success");
      form.reset();
    } catch (error) {
      const message =
        error.name === "AbortError"
          ? "Tempo esgotado. Tente novamente em instantes."
          : "Não foi possível enviar a mensagem agora. Verifique sua conexão e tente novamente.";
      setStatus(message, "error");
      console.error("Erro ao enviar contato:", error);
    } finally {
      submitButton.disabled = false;
    }
  });
});
