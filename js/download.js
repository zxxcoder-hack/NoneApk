
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

  // --- Download countdown animation ---
  const appData = JSON.parse(localStorage.getItem('currentApp'));
  if (appData) {
    document.getElementById('appDisplay').textContent = appData.name + ' ' + appData.version;
  }

  let seconds = 5;
  const countdownEl = document.getElementById('countdownNumber');
  const progressFill = document.getElementById('progressFill');
  const progressPercent = document.getElementById('progressPercent');
  const progressRing = document.getElementById('progressRing');
  const statusTitle = document.getElementById('statusTitle');
  const statusText = document.getElementById('statusText');
  const downloadCard = document.getElementById('downloadCard');
  const finalBtn = document.getElementById('finalDownloadBtn');

  function updateProgress() {
    const progress = ((5 - seconds) / 5) * 100;
    progressFill.style.width = progress + '%';
    progressPercent.textContent = Math.round(progress) + '%';
    
    // Update ring progress
    const angle = (progress / 100) * 360;
    progressRing.style.background = `conic-gradient(#0a0a0a ${angle}deg, #e5e7eb ${angle}deg)`;
  }

  function countdown() {
    if (seconds > 0) {
      countdownEl.textContent = seconds;
      updateProgress();
      seconds--;
      setTimeout(countdown, 1000);
    } else {
      // Ready!
      countdownEl.textContent = '✓';
      countdownEl.style.color = '#059669';
      document.querySelector('.countdown .unit').textContent = '';
      
      statusTitle.textContent = 'Ready to download!';
      statusText.textContent = 'Your file is prepared and ready.';
      progressFill.style.width = '100%';
      progressPercent.textContent = '100%';
      progressRing.style.background = 'conic-gradient(#059669 360deg, #e5e7eb 360deg)';
      
      downloadCard.classList.remove('preparing');
      downloadCard.classList.add('ready');
    }
  }

  // Start countdown after a small delay
  setTimeout(countdown, 500);
});

function startFinalDownload() {
  // Simulate actual download start
  alert('Your download has started!');
  // In a real app, you would trigger the actual APK download here
  // window.location.href = 'path/to/your.apk';
}
