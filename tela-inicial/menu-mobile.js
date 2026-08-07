document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.getElementById("menuToggle");
  const navBar = document.getElementById("navBar");
  const header = document.querySelector(".site-header");
  let menuScrollY = 0;

  const closeMenu = () => {
    if (!menuToggle || !navBar) return;
    menuToggle.classList.remove("active");
    navBar.classList.remove("active");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Abrir menu");
    document.body.classList.remove("menu-open");
    document.body.style.removeProperty("top");
    document.body.style.removeProperty("position");
    document.body.style.removeProperty("width");
    window.scrollTo(0, menuScrollY);
  };

  const openMenu = () => {
    if (!menuToggle || !navBar) return;
    menuScrollY = window.scrollY || window.pageYOffset || 0;
    menuToggle.classList.add("active");
    navBar.classList.add("active");
    menuToggle.setAttribute("aria-expanded", "true");
    menuToggle.setAttribute("aria-label", "Fechar menu");
    document.body.classList.add("menu-open");
    document.body.style.position = "fixed";
    document.body.style.top = `-${menuScrollY}px`;
    document.body.style.width = "100%";
  };

  if (menuToggle && navBar) {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.addEventListener("click", () => {
      if (navBar.classList.contains("active")) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    navBar.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("click", (event) => {
      if (!navBar.contains(event.target) && !menuToggle.contains(event.target)) {
        closeMenu();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });
  }

  const updateHeader = () => {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 10);
  };

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  const loadingScreen = document.getElementById("loadingScreen");
  if (loadingScreen) {
    window.addEventListener("load", () => {
      setTimeout(() => loadingScreen.classList.add("hide"), 350);
    });
  }
});
