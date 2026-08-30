// apk.js - Updated to load full app details from catalog
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

  // Load app data from URL parameters
  loadAppFromURL();
});

// Store all apps globally for lookup
let allApps = [];

function loadAppFromURL() {
  const params = new URLSearchParams(window.location.search);
  const packageName = params.get('package');
  
  if (packageName) {
    loadAppByPackage(packageName);
    return;
  }
  
  // Fallback to localStorage
  try {
    const storedData = localStorage.getItem('currentApp');
    if (storedData) {
      const appData = JSON.parse(storedData);
      renderAppDetails(appData);
      renderRelatedApps(appData);
      return;
    }
  } catch (e) {
    console.warn('Could not read from localStorage', e);
  }
  
  renderError('No app data provided. Please go back and try again.');
}

function loadAppByPackage(packageName) {
  const container = document.getElementById('apkHeader');
  
  // Show loading state
  if (container) {
    container.innerHTML = `
      <div class="loading-state">
        <i class="fas fa-spinner fa-pulse"></i>
        Loading app details...
      </div>
    `;
  }
  
  // Check if we already have apps loaded
  if (allApps.length > 0) {
    const foundApp = allApps.find(a => a.Package === packageName);
    if (foundApp) {
      renderAppFromCatalog(foundApp);
      renderRelatedApps(foundApp);
      return;
    }
  }
  
  // Load catalog files
  const catalogFiles = ['file/catalog/catalog_1.json', 'file/catalog/catalog_2.json', 'file/catalog/catalog_3.json'];
  
  const fetchPromises = catalogFiles.map(url =>
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .catch(err => {
        console.warn('Failed to load', url, err);
        return null;
      })
  );
  
  Promise.all(fetchPromises).then(results => {
    const valid = results.filter(r => r && r.Apps && Array.isArray(r.Apps));
    if (valid.length === 0) {
      renderError('Could not load app catalog. Please try again later.');
      return;
    }
    
    allApps = [];
    valid.forEach(cat => cat.Apps.forEach(app => allApps.push(app)));
    
    let foundApp = null;
    for (const cat of valid) {
      const app = cat.Apps.find(a => a.Package === packageName);
      if (app) {
        foundApp = app;
        break;
      }
    }
    
    if (foundApp) {
      renderAppFromCatalog(foundApp);
      renderRelatedApps(foundApp);
    } else {
      renderError('No app found with package name: <strong>' + packageName + '</strong>');
    }
  }).catch(err => {
    console.error(err);
    renderError('Error loading app catalog. Please try again later.');
  });
}

function renderAppFromCatalog(app) {
  let minSdk = app.MinSdk;
  if (minSdk === 0 || minSdk === '0' || minSdk === null || minSdk === undefined) {
    minSdk = 'Unknown';
  }
  
  const appData = {
    name: app.AppName || 'Unknown',
    dev: app.PublisherId || 'Unknown',
    icon: app.AppIcon || app.Thumbnail || 'fa-cube',
    version: app.Version || '1.0.0',
    packageName: app.Package || 'com.example.app',
    minSdk: minSdk,
    compileSdk: app.MinSdk || 'Unknown',
    androidVer: minSdk !== 'Unknown' ? 'Android ' + minSdk + '+' : 'Unknown',
    size: app.Size || 'Unknown',
    downloads: app.Downloads || '0',
    updated: app.ReleaseDate || 'Unknown',
    shortDesc: app.DiscriptionS || app.DiscriptionL || 'No description available.',
    longDesc: app.DiscriptionL || app.DiscriptionS || 'No description available.',
    rating: app.Rating ? parseFloat(app.Rating).toFixed(1) : 'N/A',
    totalRatings: app.TotalRatings || '0',
    category: app.CategoryName || 'Unknown',
    downloadUrl: app.DownloadUrl || '#',
    screenshots: app.ScreenShots || []
  };
  renderAppDetails(appData);
}

function renderAppDetails(app) {
  window.currentApp = app;
  
  // Format icon
  const iconHtml = app.icon && app.icon.startsWith('http') 
    ? `<img src="${app.icon}" alt="${app.name}" onerror="this.parentElement.innerHTML='<i class=\\'fas fa-cube\\'></i>'">` 
    : `<i class="fas ${app.icon || 'fa-cube'}"></i>`;
  
  // Header
  document.getElementById('apkHeader').innerHTML = `
    <div class="apk-header-flex">
      <div class="apk-icon-large">${iconHtml}</div>
      <div class="apk-title-area">
        <h1>${app.name}</h1>
        <div class="dev"><i class="fas fa-code"></i> ${app.dev}</div>
        <div class="short-desc">${app.shortDesc || 'No description available.'}</div>
        <div class="apk-stats">
          <span><i class="fas fa-tag"></i> ${app.version}</span>
          <span><i class="fas fa-download"></i> ${app.downloads} downloads</span>
          <span><i class="fas fa-star"></i> ${app.rating}</span>
          <span><i class="fas fa-file-alt"></i> ${app.size}</span>
        </div>
        <button class="btn-download" onclick="window.location.href='${app.downloadUrl || 'download.html'}'">
          <i class="fas fa-download"></i> Download APK
        </button>
      </div>
    </div>
  `;

  // Screenshots - Show "No screenshots available" if empty
  const screenshotContainer = document.getElementById('screenshotScroll');
  if (app.screenshots && app.screenshots.length > 0) {
    screenshotContainer.innerHTML = app.screenshots.map((url, index) => `
      <div class="screenshot">
        <img src="${url}" alt="Screenshot ${index + 1}" onerror="this.parentElement.innerHTML='<i class=\\'fas fa-image\\'></i><span>Screenshot ${index + 1}</span>'">
      </div>
    `).join('');
  } else {
    screenshotContainer.innerHTML = `
      <div class="screenshot no-screenshot">
        <i class="fas fa-image"></i>
        <span>No screenshots available</span>
      </div>
    `;
  }

  // Long description
  document.getElementById('longDesc').innerHTML = app.longDesc || 'No description available.';

  // Footer info - VERTICAL LAYOUT
  document.getElementById('apkFooterInfo').innerHTML = `
    <div class="info-row">
      <span class="info-label"><i class="fas fa-box"></i> Package</span>
      <span class="info-value">${app.packageName}</span>
    </div>
    <div class="info-row">
      <span class="info-label"><i class="fas fa-android"></i> Min SDK</span>
      <span class="info-value">${app.minSdk}</span>
    </div>
    <div class="info-row">
      <span class="info-label"><i class="fas fa-tag"></i> Category</span>
      <span class="info-value">${app.category}</span>
    </div>
    <div class="info-row">
      <span class="info-label"><i class="fas fa-version-tag"></i> Android</span>
      <span class="info-value">${app.androidVer}</span>
    </div>
    <div class="info-row">
      <span class="info-label"><i class="fas fa-calendar"></i> Updated</span>
      <span class="info-value">${app.updated}</span>
    </div>
    <div class="info-row">
      <span class="info-label"><i class="fas fa-users"></i> Total Ratings</span>
      <span class="info-value">${app.totalRatings}</span>
    </div>
  `;
}

function renderRelatedApps(currentApp) {
  const relatedGrid = document.getElementById('relatedGrid');
  
  // Get apps from same category or random ones
  let related = [];
  const category = currentApp.CategoryName || '';
  
  if (category && allApps.length > 0) {
    // Find apps with same category
    related = allApps.filter(app => 
      app.Package !== currentApp.Package && 
      app.CategoryName === category
    );
  }
  
  // If not enough related, get random apps
  if (related.length < 4) {
    const others = allApps.filter(app => app.Package !== currentApp.Package);
    const shuffled = others.sort(() => 0.5 - Math.random());
    const needed = 4 - related.length;
    const additional = shuffled.slice(0, needed);
    related = [...related, ...additional];
  }
  
  // Limit to 8
  related = related.slice(0, 8);
  
  if (related.length === 0) {
    relatedGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align:center; color:#6b7280; padding:1rem;">
        No related apps found.
      </div>
    `;
    return;
  }
  
  relatedGrid.innerHTML = related.map(app => {
    const name = app.AppName || 'Unknown';
    const dev = app.PublisherId || 'Unknown';
    const icon = app.AppIcon || app.Thumbnail || 'fa-cube';
    const packageName = app.Package || '';
    
    const iconHtml = icon && icon.startsWith('http') 
      ? `<img src="${icon}" alt="${name}" onerror="this.parentElement.innerHTML='<i class=\\'fas fa-cube\\'></i>'">` 
      : `<i class="fas ${icon}"></i>`;
    
    return `
      <div class="app-card" onclick="openAppByPackage('${packageName}')">
        <div class="app-icon-sm">${iconHtml}</div>
        <div class="app-name-sm">${name}</div>
        <div class="app-dev-sm">${dev}</div>
      </div>
    `;
  }).join('');
}

function openAppByPackage(packageName) {
  if (packageName) {
    window.location.href = 'apk.html?package=' + encodeURIComponent(packageName);
  }
}

function renderError(message) {
  const container = document.getElementById('apkHeader');
  if (container) {
    container.innerHTML = `
      <div class="error-state">
        <i class="fas fa-exclamation-circle"></i>
        <h2>App Not Found</h2>
        <p>${message}</p>
        <a href="index.html"><i class="fas fa-arrow-left"></i> Back to Home</a>
      </div>
    `;
  }
}