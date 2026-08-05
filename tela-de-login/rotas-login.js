const ROTAS_AUTH_LIMPAS = {
  "/tela-de-login/login.html": "/login",
  "/tela-de-login/painel.html": "/painel",
};

function authAmbienteLocalSemRewrite() {
  return ["127.0.0.1", "localhost"].includes(window.location.hostname);
}

function authComQuery(path, query = "") {
  if (!query) return path;
  return query.startsWith("?") ? `${path}${query}` : `${path}?${query}`;
}

window.authRoutes = {
  login(query = "") {
    return authComQuery(authAmbienteLocalSemRewrite() ? "/tela-de-login/login.html" : "/login", query);
  },
  painel(query = "") {
    return authComQuery(authAmbienteLocalSemRewrite() ? "/tela-de-login/painel.html" : "/painel", query);
  },
};

document.addEventListener("DOMContentLoaded", () => {
  const rotaLimpa = ROTAS_AUTH_LIMPAS[window.location.pathname];
  if (rotaLimpa) {
    window.history.replaceState({}, "", `${rotaLimpa}${window.location.search}${window.location.hash}`);
  }
});
