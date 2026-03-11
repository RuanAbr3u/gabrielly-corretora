// Menu Hambúrguer - Script compartilhado
document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.getElementById('menuToggle');
  const navBar = document.getElementById('navBar');
  
  if (menuToggle && navBar) {
    menuToggle.addEventListener('click', () => {
      menuToggle.classList.toggle('active');
      navBar.classList.toggle('active');
    });
    
    // Fecha o menu ao clicar em um link
    const navLinks = navBar.querySelectorAll('a');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        menuToggle.classList.remove('active');
        navBar.classList.remove('active');
      });
    });
    
    // Fecha o menu ao clicar fora dele
    document.addEventListener('click', (e) => {
      if (!navBar.contains(e.target) && !menuToggle.contains(e.target)) {
        menuToggle.classList.remove('active');
        navBar.classList.remove('active');
      }
    });
  }
});
