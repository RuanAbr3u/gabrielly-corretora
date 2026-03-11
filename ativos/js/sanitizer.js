/**
 * SANITIZAÇÃO E SEGURANÇA
 * Utilitários para prevenir XSS e outras vulnerabilidades
 */

const Sanitizer = {
  /**
   * Escapa HTML para prevenir XSS
   * @param {string} str - String para sanitizar
   * @returns {string} String sanitizada
   */
  escapeHtml(str) {
    if (str === null || str === undefined) return "";

    const div = document.createElement("div");
    div.textContent = String(str);
    return div.innerHTML;
  },

  /**
   * Sanitiza HTML permitindo apenas tags seguras
   * @param {string} html - HTML para sanitizar
   * @returns {string} HTML sanitizado
   */
  sanitizeHtml(html) {
    if (!html) return "";

    const temp = document.createElement("div");
    temp.textContent = html;
    return temp.innerHTML;
  },

  /**
   * Valida e sanitiza URL
   * @param {string} url - URL para validar
   * @returns {string} URL sanitizada ou string vazia se inválida
   */
  sanitizeUrl(url) {
    if (!url) return "";

    const cleanUrl = String(url).trim();

    // Permitir apenas protocolos seguros
    const protocoloSeguro = /^(https?:\/\/|mailto:|tel:)/i;

    if (protocoloSeguro.test(cleanUrl)) {
      return cleanUrl;
    }

    // URLs relativas são permitidas
    if (
      cleanUrl.startsWith("/") ||
      cleanUrl.startsWith("./") ||
      cleanUrl.startsWith("../")
    ) {
      return cleanUrl;
    }

    return "";
  },

  /**
   * Sanitiza atributos para uso seguro em elementos
   * @param {string} value - Valor para sanitizar
   * @returns {string} Valor sanitizado
   */
  sanitizeAttribute(value) {
    if (!value) return "";

    return String(value)
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  },

  /**
   * Cria elemento HTML de forma segura
   * @param {string} tag - Tag HTML
   * @param {object} attributes - Atributos do elemento
   * @param {string|HTMLElement} content - Conteúdo (texto ou elemento filho)
   * @returns {HTMLElement} Elemento criado de forma segura
   */
  createElement(tag, attributes = {}, content = "") {
    const element = document.createElement(tag);

    // Define atributos de forma segura
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === "className") {
        element.className = value;
      } else if (key === "style" && typeof value === "object") {
        Object.assign(element.style, value);
      } else if (key.startsWith("data-")) {
        element.setAttribute(key, value);
      } else if (
        [
          "id",
          "type",
          "name",
          "placeholder",
          "value",
          "src",
          "alt",
          "href",
        ].includes(key)
      ) {
        element.setAttribute(key, value);
      }
    });

    // Define conteúdo de forma segura
    if (typeof content === "string") {
      element.textContent = content;
    } else if (content instanceof HTMLElement) {
      element.appendChild(content);
    }

    return element;
  },

  /**
   * Valida entrada de email
   * @param {string} email - Email para validar
   * @returns {boolean} True se válido
   */
  isValidEmail(email) {
    if (!email) return false;
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  },

  /**
   * Valida entrada de telefone
   * @param {string} phone - Telefone para validar
   * @returns {boolean} True se válido
   */
  isValidPhone(phone) {
    if (!phone) return false;
    const cleaned = phone.replace(/\D/g, "");
    return cleaned.length >= 10 && cleaned.length <= 11;
  },

  /**
   * Sanitiza entrada numérica
   * @param {any} value - Valor para converter em número
   * @param {number} defaultValue - Valor padrão se inválido
   * @returns {number} Número sanitizado
   */
  sanitizeNumber(value, defaultValue = 0) {
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
  },

  /**
   * Remove scripts maliciosos de strings
   * @param {string} str - String para limpar
   * @returns {string} String sem scripts
   */
  removeScripts(str) {
    if (!str) return "";
    return String(str).replace(
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      "",
    );
  },
};

// Expor globalmente
window.Sanitizer = Sanitizer;

// Exportar para uso em módulos
if (typeof module !== "undefined" && module.exports) {
  module.exports = Sanitizer;
}
