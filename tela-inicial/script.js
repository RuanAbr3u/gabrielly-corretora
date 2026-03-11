// Menu Hambúrguer
document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.getElementById("menuToggle");
  const navBar = document.getElementById("navBar");

  if (menuToggle && navBar) {
    menuToggle.addEventListener("click", () => {
      menuToggle.classList.toggle("active");
      navBar.classList.toggle("active");
    });

    // Fecha o menu ao clicar em um link
    const navLinks = navBar.querySelectorAll("a");
    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        menuToggle.classList.remove("active");
        navBar.classList.remove("active");
      });
    });

    // Fecha o menu ao clicar fora dele
    document.addEventListener("click", (e) => {
      if (!navBar.contains(e.target) && !menuToggle.contains(e.target)) {
        menuToggle.classList.remove("active");
        navBar.classList.remove("active");
      }
    });
  }
});

//Botão Whatsapp
window.addEventListener("DOMContentLoaded", () => {
  const balao = document.getElementById("whatsapp-balao");
  if (balao) {
    balao.style.opacity = 0;
    setTimeout(() => {
      balao.style.transition = "opacity 1s ease-in-out";
      balao.style.opacity = 1;
    }, 1000);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const lista = document.getElementById("listaImoveisSite");
  if (!lista) return; // Elemento não existe nesta página

  const imoveis = JSON.parse(localStorage.getItem("imoveis")) || [];

  if (imoveis.length === 0) {
    lista.innerHTML = "<p>Nenhum imóvel cadastrado ainda.</p>";
    return;
  }

  imoveis.forEach((imovel) => {
    const div = document.createElement("div");
    div.classList.add("imovel-item");

    const primeiraImagem =
      imovel.imagens && imovel.imagens[0] ? imovel.imagens[0] : "";

    div.innerHTML = `
      <article>
        <img src="${primeiraImagem}" alt="${imovel.titulo}" style="width:100%;border-radius:10px;">
        <h3>${imovel.titulo}</h3>
        <p>${imovel.descricao}</p>
        <p><strong>R$ ${imovel.preco}</strong></p>
        <p>${imovel.quartos} quartos | ${imovel.banheiros} banheiros | ${imovel.garagem}${imovel.vagas ? " (" + imovel.vagas + " vagas)" : ""}</p>
      </article>
    `;
    lista.appendChild(div);
  });
});
