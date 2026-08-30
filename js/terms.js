
document.addEventListener('DOMContentLoaded', function() {
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');

  menuToggle.addEventListener('click', function(e) {
    e.stopPropagation();
    navLinks.classList.toggle('active');
    const icon = this.querySelector('i');
    icon.className = navLinks.classList.contains('active') ? 'fas fa-times' : 'fas fa-bars';
  });

  document.addEventListener('click', function(e) {
    if (!e.target.closest('.navbar') && navLinks.classList.contains('active')) {
      navLinks.classList.remove('active');
      menuToggle.querySelector('i').className = 'fas fa-bars';
    }
  });

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', function() {
      if (window.innerWidth < 1024) {
        navLinks.classList.remove('active');
        menuToggle.querySelector('i').className = 'fas fa-bars';
      }
    });
  });

  window.addEventListener('resize', function() {
    if (window.innerWidth >= 1024 && navLinks.classList.contains('active')) {
      navLinks.classList.remove('active');
      menuToggle.querySelector('i').className = 'fas fa-bars';
    }
  });
});
