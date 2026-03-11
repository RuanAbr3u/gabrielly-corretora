/**
 * DOM HELPERS - Funções seguras para manipulação do DOM
 * Alternativas seguras ao uso direto de innerHTML
 */

const DOM = {
  /**
   * Remove todos os filhos de um elemento
   * @param {HTMLElement} element - Elemento a ser limpo
   */
  clear(element) {
    if (!element) return;
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  },

  /**
   * Define texto de forma segura
   * @param {HTMLElement} element - Elemento alvo
   * @param {string} text - Texto a definir
   */
  setText(element, text) {
    if (!element) return;
    element.textContent = text || "";
  },

  /**
   * Adiciona classe(s) a um elemento
   * @param {HTMLElement} element - Elemento alvo
   * @param {string|string[]} classes - Classe(s) para adicionar
   */
  addClass(element, classes) {
    if (!element) return;
    const classList = Array.isArray(classes) ? classes : [classes];
    element.classList.add(...classList);
  },

  /**
   * Remove classe(s) de um elemento
   * @param {HTMLElement} element - Elemento alvo
   * @param {string|string[]} classes - Classe(s) para remover
   */
  removeClass(element, classes) {
    if (!element) return;
    const classList = Array.isArray(classes) ? classes : [classes];
    element.classList.remove(...classList);
  },

  /**
   * Cria elemento com opções
   * @param {string} tag - Tag HTML
   * @param {object} options - Configurações
   * @returns {HTMLElement}
   */
  create(tag, options = {}) {
    const element = document.createElement(tag);

    if (options.id) element.id = options.id;
    if (options.className) element.className = options.className;
    if (options.text) element.textContent = options.text;
    if (options.html && window.Sanitizer) {
      element.textContent = options.html; // Sanitizado como texto
    }

    if (options.attributes) {
      Object.entries(options.attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
      });
    }

    if (options.style) {
      Object.assign(element.style, options.style);
    }

    if (options.events) {
      Object.entries(options.events).forEach(([event, handler]) => {
        element.addEventListener(event, handler);
      });
    }

    if (options.children) {
      options.children.forEach((child) => {
        if (child instanceof HTMLElement) {
          element.appendChild(child);
        } else if (typeof child === "string") {
          element.appendChild(document.createTextNode(child));
        }
      });
    }

    return element;
  },

  /**
   * Cria lista de opções para select
   * @param {HTMLSelectElement} select - Elemento select
   * @param {Array} options - Array de {value, text}
   * @param {string} placeholder - Texto do placeholder
   */
  setSelectOptions(select, options, placeholder = "") {
    if (!select) return;

    this.clear(select);

    if (placeholder) {
      const option = this.create("option", {
        text: placeholder,
        attributes: { value: "" },
      });
      select.appendChild(option);
    }

    options.forEach((opt) => {
      const option = this.create("option", {
        text: opt.text || opt.label || opt.value,
        attributes: { value: opt.value },
      });
      if (opt.selected) option.selected = true;
      select.appendChild(option);
    });
  },

  /**
   * Cria lista de checkboxes
   * @param {HTMLElement} container - Container para checkboxes
   * @param {Array} items - Array de {value, label}
   * @param {string} name - Nome do input
   */
  createCheckboxList(container, items, name) {
    if (!container) return;

    this.clear(container);

    items.forEach((item) => {
      const label = this.create("label");
      const checkbox = this.create("input", {
        attributes: {
          type: "checkbox",
          name: name,
          value: item.value,
        },
      });

      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(" " + item.label));
      container.appendChild(label);
    });
  },

  /**
   * Mostra mensagem de loading
   * @param {HTMLElement} element - Elemento alvo
   * @param {string} message - Mensagem de loading
   */
  showLoading(element, message = "Carregando...") {
    if (!element) return;

    this.clear(element);
    const loader = this.create("div", {
      className: "loading-message",
      text: message,
      style: {
        padding: "20px",
        textAlign: "center",
        color: "#666",
      },
    });
    element.appendChild(loader);
  },

  /**
   * Mostra mensagem de erro
   * @param {HTMLElement} element - Elemento alvo
   * @param {string} message - Mensagem de erro
   */
  showError(element, message = "Ocorreu um erro") {
    if (!element) return;

    this.clear(element);
    const error = this.create("div", {
      className: "error-message",
      text: message,
      style: {
        padding: "20px",
        textAlign: "center",
        color: "#d32f2f",
        backgroundColor: "#ffebee",
        borderRadius: "4px",
      },
    });
    element.appendChild(error);
  },

  /**
   * Mostra mensagem vazia
   * @param {HTMLElement} element - Elemento alvo
   * @param {string} message - Mensagem
   */
  showEmpty(element, message = "Nenhum item encontrado") {
    if (!element) return;

    this.clear(element);
    const empty = this.create("div", {
      className: "empty-message",
      text: message,
      style: {
        padding: "40px 20px",
        textAlign: "center",
        color: "#999",
        fontSize: "1.1em",
      },
    });
    element.appendChild(empty);
  },

  /**
   * Toggle de visibilidade
   * @param {HTMLElement} element - Elemento
   * @param {boolean} show - Se deve mostrar
   */
  toggle(element, show) {
    if (!element) return;
    element.style.display = show ? "" : "none";
  },

  /**
   * Adiciona múltiplos filhos a um elemento
   * @param {HTMLElement} parent - Elemento pai
   * @param {Array<HTMLElement>} children - Filhos para adicionar
   */
  appendChildren(parent, children) {
    if (!parent || !Array.isArray(children)) return;

    children.forEach((child) => {
      if (child instanceof HTMLElement) {
        parent.appendChild(child);
      }
    });
  },
};

// Expor globalmente
window.DOM = DOM;

// Exportar para módulos
if (typeof module !== "undefined" && module.exports) {
  module.exports = DOM;
}
