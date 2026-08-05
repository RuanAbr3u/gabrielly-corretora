const ROTAS_LIMPAS = {
  "/tela-inicial/index.html": "/",
  "/tela-inicial/servicos.html": "/servicos",
  "/tela-inicial/locacao.html": "/locacao",
  "/tela-inicial/vendas.html": "/vendas",
  "/tela-inicial/sobre.html": "/sobre",
  "/tela-inicial/contato.html": "/contato",
};

const ROTAS_ARQUIVOS = Object.fromEntries(
  Object.entries(ROTAS_LIMPAS).map(([arquivo, limpa]) => [limpa, arquivo]),
);

function ambienteLocalSemRewrite() {
  return ["127.0.0.1", "localhost"].includes(window.location.hostname);
}

function limparUrlAtual() {
  const rotaLimpa = ROTAS_LIMPAS[window.location.pathname];
  if (!rotaLimpa) return;

  window.history.replaceState({}, "", `${rotaLimpa}${window.location.search}${window.location.hash}`);
}

function prepararLinksLimpos() {
  document.querySelectorAll("a[href]").forEach((link) => {
    const href = link.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:")) {
      return;
    }

    const arquivo = href.startsWith("/") ? href : `/tela-inicial/${href}`;
    const rotaLimpa = ROTAS_LIMPAS[arquivo];
    if (!rotaLimpa) return;

    link.setAttribute("href", rotaLimpa);
  });
}

function prepararImagensDasRotas() {
  document.querySelectorAll("img[src]").forEach((img) => {
    const src = img.getAttribute("src");
    if (!src?.startsWith("./img/")) return;

    img.setAttribute("src", src.replace("./img/", "/tela-inicial/img/"));
  });
}

function navegarLocalmenteComArquivos() {
  if (!ambienteLocalSemRewrite()) return;

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!link || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const url = new URL(link.href, window.location.origin);
    if (url.origin !== window.location.origin) return;

    const arquivo = ROTAS_ARQUIVOS[url.pathname];
    if (!arquivo) return;

    event.preventDefault();
    window.location.href = `${arquivo}${url.search}${url.hash}`;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  prepararImagensDasRotas();
  prepararLinksLimpos();
  navegarLocalmenteComArquivos();
  limparUrlAtual();
});
