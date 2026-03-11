# 🔧 GUIA DE REFATORAÇÃO - Remoção de Vulnerabilidades XSS

## 📌 OBJETIVO

Eliminar TODOS os usos inseguros de `innerHTML` que podem causar vulnerabilidades XSS (Cross-Site Scripting).

---

## ⚠️ ARQUIVOS CRÍTICOS QUE PRECISAM DE REFATORAÇÃO

### 1. tela-de-login/script-painel.js

**Total de ocorrências:** ~27
**Prioridade:** 🔴 CRÍTICA

### 2. tela-de-login/script-login.js

**Total de ocorrências:** ~4
**Prioridade:** 🔴 CRÍTICA

### 3. tela-inicial/script-listagem.js

**Total de ocorrências:** A verificar
**Prioridade:** 🟡 MÉDIA

---

## 🛠️ UTILITÁRIOS DISPONÍVEIS

### 1. Sanitizer (ativos/js/sanitizer.js)

```javascript
// Escapar HTML
const safe = Sanitizer.escapeHtml(userInput);

// Validar email
if (Sanitizer.isValidEmail(email)) { ... }

// Validar telefone
if (Sanitizer.isValidPhone(phone)) { ... }

// Sanitizar número
const num = Sanitizer.sanitizeNumber(input, 0);
```

### 2. DOM Helpers (ativos/js/dom-helpers.js)

```javascript
// Limpar elemento
DOM.clear(container);

// Criar elemento com texto seguro
const div = DOM.create("div", { text: userInput });

// Criar select com opções
DOM.setSelectOptions(select, options, "Selecione...");

// Mostrar loading/erro/vazio
DOM.showLoading(container, "Carregando...");
DOM.showError(container, "Erro ao carregar");
DOM.showEmpty(container, "Nenhum resultado");
```

---

## 📝 PADRÕES DE REFATORAÇÃO

### Padrão 1: Texto Simples

#### ❌ ANTES (INSEGURO)

```javascript
element.innerHTML = userInput;
element.innerHTML = "Texto: " + userInput;
```

#### ✅ DEPOIS (SEGURO)

```javascript
element.textContent = userInput;
element.textContent = "Texto: " + userInput;
```

---

### Padrão 2: Limpar Container

#### ❌ ANTES (INSEGURO)

```javascript
container.innerHTML = "";
```

#### ✅ DEPOIS (SEGURO)

```javascript
DOM.clear(container);
// OU
while (container.firstChild) {
  container.removeChild(container.firstChild);
}
```

---

### Padrão 3: Criar Elemento com Texto

#### ❌ ANTES (INSEGURO)

```javascript
div.innerHTML = `<p>Nome: ${user.name}</p>`;
```

#### ✅ DEPOIS (SEGURO)

```javascript
const p = DOM.create("p", {
  text: `Nome: ${user.name}`,
});
div.appendChild(p);
```

---

### Padrão 4: Lista de Itens

#### ❌ ANTES (INSEGURO)

```javascript
container.innerHTML = "";
items.forEach((item) => {
  container.innerHTML += `<div class="card">${item.title}</div>`;
});
```

#### ✅ DEPOIS (SEGURO)

```javascript
DOM.clear(container);
items.forEach((item) => {
  const card = DOM.create("div", {
    className: "card",
    text: item.title,
  });
  container.appendChild(card);
});
```

---

### Padrão 5: Select Options

#### ❌ ANTES (INSEGURO)

```javascript
select.innerHTML = '<option value="">Selecione</option>';
items.forEach((item) => {
  select.innerHTML += `<option value="${item.id}">${item.name}</option>`;
});
```

#### ✅ DEPOIS (SEGURO)

```javascript
DOM.setSelectOptions(
  select,
  items.map((item) => ({
    value: item.id,
    text: item.name,
  })),
  "Selecione",
);
```

---

### Padrão 6: Checkboxes Dinâmicos

#### ❌ ANTES (INSEGURO)

```javascript
label.innerHTML = `<input type="checkbox" value="${item}"> ${item}`;
```

#### ✅ DEPOIS (SEGURO)

```javascript
const checkbox = DOM.create("input", {
  attributes: {
    type: "checkbox",
    value: item,
  },
});
label.appendChild(checkbox);
label.appendChild(document.createTextNode(" " + item));
```

---

### Padrão 7: Mensagens (Loading/Erro/Vazio)

#### ❌ ANTES (INSEGURO)

```javascript
container.innerHTML = "⏳ Carregando...";
container.innerHTML = "❌ Erro ao carregar";
container.innerHTML = "Nenhum resultado encontrado";
```

#### ✅ DEPOIS (SEGURO)

```javascript
DOM.showLoading(container, "⏳ Carregando...");
DOM.showError(container, "❌ Erro ao carregar");
DOM.showEmpty(container, "Nenhum resultado encontrado");
```

---

### Padrão 8: HTML Complexo que NÃO pode ser evitado

#### ⚠️ USE APENAS QUANDO NECESSÁRIO

```javascript
// Se realmente precisar de HTML, sanitize CADA variável
const safeTitle = Sanitizer.escapeHtml(imovel.titulo);
const safeDesc = Sanitizer.escapeHtml(imovel.descricao);
const safePreco = Sanitizer.sanitizeNumber(imovel.preco, 0);

element.innerHTML = `
  <div class="card">
    <h3>${safeTitle}</h3>
    <p>${safeDesc}</p>
    <span>R$ ${safePreco.toLocaleString("pt-BR")}</span>
  </div>
`;
```

**MELHOR AINDA: Criar via DOM**

```javascript
const card = DOM.create("div", { className: "card" });
const h3 = DOM.create("h3", { text: imovel.titulo });
const p = DOM.create("p", { text: imovel.descricao });
const span = DOM.create("span", {
  text: `R$ ${Number(imovel.preco).toLocaleString("pt-BR")}`,
});

card.appendChild(h3);
card.appendChild(p);
card.appendChild(span);
element.appendChild(card);
```

---

## 🎯 EXEMPLO PRÁTICO: Refatorar Galeria de Imagens

### ❌ CÓDIGO ORIGINAL (INSEGURO)

```javascript
// tela-de-login/script-painel.js (linha ~813)
preview.innerHTML = "";

arquivos.forEach((arquivo, index) => {
  const img = document.createElement("img");
  img.src = URL.createObjectURL(arquivo);
  img.style.width = "150px";
  img.style.margin = "5px";
  preview.appendChild(img);
});
```

### ✅ CÓDIGO REFATORADO (SEGURO)

```javascript
DOM.clear(preview);

arquivos.forEach((arquivo, index) => {
  const img = DOM.create("img", {
    attributes: {
      src: URL.createObjectURL(arquivo),
      alt: `Preview ${index + 1}`,
    },
    style: {
      width: "150px",
      margin: "5px",
    },
  });
  preview.appendChild(img);
});
```

**Análise:** Este caso já estava relativamente seguro, mas usando DOM.create fica mais explícito e consistente.

---

## 🎯 EXEMPLO 2: Refatorar Lista de Imóveis

### ❌ CÓDIGO ORIGINAL (INSEGURO)

```javascript
// Simplificado do script-painel.js
card.innerHTML = `
  <h3>${imovel.titulo}</h3>
  <p><strong>🏷️ Tipo:</strong> ${imovel.tipoNegocio}</p>
  <p><strong>💰 Valor:</strong> R$ ${imovel.valor}</p>
  <p><strong>📍 Bairro:</strong> ${imovel.bairro}</p>
`;
```

### ✅ CÓDIGO REFATORADO (SEGURO)

```javascript
DOM.clear(card);

// Criar elementos de forma segura
const h3 = DOM.create("h3", {
  text: imovel.titulo,
});

const pTipo = DOM.create("p");
pTipo.innerHTML = "<strong>🏷️ Tipo:</strong> ";
pTipo.appendChild(document.createTextNode(imovel.tipoNegocio));

const pValor = DOM.create("p");
pValor.innerHTML = "<strong>💰 Valor:</strong> ";
const valorFormatado = Number(imovel.valor).toLocaleString("pt-BR", {
  style: "currency",
  currency: "BRL",
});
pValor.appendChild(document.createTextNode(valorFormatado));

const pBairro = DOM.create("p");
pBairro.innerHTML = "<strong>📍 Bairro:</strong> ";
pBairro.appendChild(document.createTextNode(imovel.bairro));

// Adicionar ao card
card.appendChild(h3);
card.appendChild(pTipo);
card.appendChild(pValor);
card.appendChild(pBairro);
```

**OU usando função helper:**

```javascript
function createInfoParagraph(icon, label, value) {
  const p = document.createElement("p");
  const strong = document.createElement("strong");
  strong.textContent = `${icon} ${label}: `;
  p.appendChild(strong);
  p.appendChild(document.createTextNode(value));
  return p;
}

DOM.clear(card);
card.appendChild(DOM.create("h3", { text: imovel.titulo }));
card.appendChild(createInfoParagraph("🏷️", "Tipo", imovel.tipoNegocio));
card.appendChild(
  createInfoParagraph(
    "💰",
    "Valor",
    Number(imovel.valor).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    }),
  ),
);
card.appendChild(createInfoParagraph("📍", "Bairro", imovel.bairro));
```

---

## 🚨 CASOS ESPECIAIS

### 1. Emoji e Ícones

✅ **SEGURO:** Emojis são texto, podem ser usados normalmente

```javascript
element.textContent = "🏠 Casa";
```

### 2. Símbolos HTML Entities

⚠️ **CUIDADO:** Não use innerHTML para entities

```javascript
// ❌ EVITE
element.innerHTML = "&times;"; // × symbol

// ✅ USE
element.textContent = "×"; // Caractere direto
// OU
element.innerHTML = "&times;"; // OK se for constante, não input do usuário
```

### 3. Links Dinâmicos

```javascript
// ❌ INSEGURO
link.innerHTML = `<a href="${url}">Clique</a>`;

// ✅ SEGURO
const a = DOM.create("a", {
  text: "Clique",
  attributes: {
    href: Sanitizer.sanitizeUrl(url),
    target: "_blank",
    rel: "noopener noreferrer",
  },
});
link.appendChild(a);
```

---

## 📋 CHECKLIST DE REFATORAÇÃO

### Para cada arquivo:

- [ ] Identificar todas as ocorrências de `innerHTML`
- [ ] Classificar: SEGURO / INSEGURO / PRECISA REFATORAR
- [ ] Aplicar padrão apropriado de refatoração
- [ ] Testar funcionalidade após mudança
- [ ] Verificar no console se não há erros
- [ ] Testar com dados maliciosos (ex: `<script>alert('xss')</script>`)

---

## 🧪 COMO TESTAR XSS

### 1. Input Malicioso Básico

```javascript
<script>alert('XSS')</script>
```

### 2. Atributo de Evento

```javascript
<img src=x onerror="alert('XSS')">
```

### 3. Injeção de Estilo

```javascript
<style>body{background:red}</style>
```

### Como Testar:

1. Cole o código acima em qualquer input do sistema
2. Se um alert aparecer ou o estilo mudar, há XSS
3. Se nada acontecer, está protegido! ✅

---

## 🎓 BOAS PRÁTICAS

### ✅ SEMPRE

- Use `textContent` para texto puro
- Use `DOM.create()` para criar elementos
- Sanitize BEFORE inserir no DOM
- Valide inputs no frontend E backend
- Teste com dados maliciosos

### ❌ NUNCA

- Use `innerHTML` com dados de usuário
- Use `eval()` com strings dinâmicas
- Confie em inputs sem validação
- Concatene HTML manualmente com inputs
- Desabilite CSP por preguiça

---

## 📞 DÚVIDAS?

Se não souber como refatorar algum caso específico:

1. Consulte este guia
2. Procure padrões similares já refatorados
3. Use `Sanitizer.escapeHtml()` como last resort
4. Documente o motivo no código

---

**Última atualização:** ${new Date().toISOString().split('T')[0]}
**Versão:** 1.0.0
