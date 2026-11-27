(function () {
  const appEl = document.getElementById('app');
  const navBack = document.getElementById('navBack');
  const yearEl = document.getElementById('year');
  const BASE_TITLE = 'noneapk.xyz';

  if (yearEl) yearEl.textContent = new Date().getFullYear();

  let appData = null;

  function setBackLink(href, label) {
    if (!navBack) return;
    if (href) {
      navBack.hidden = false;
      navBack.setAttribute('href', href);
      navBack.textContent = label || '← Back';
    } else {
      navBack.hidden = true;
    }
  }

  function setTitle(t) {
    document.title = t ? `${t} · ${BASE_TITLE}` : BASE_TITLE;
  }

  function render() {
    if (window.location.protocol === 'file:') {
      appEl.innerHTML = `
        <div class="empty">
          <div class="empty-icon">▢</div>
          <div class="empty-title">This site must be served over HTTP</div>
          <div class="empty-desc">Run <code>python3 -m http.server 8000</code> then open <code>http://localhost:8000</code>.</div>
        </div>
      `;
      return;
    }

    if (!appData) {
      appEl.innerHTML = `
        <div class="empty">
          <div class="empty-title">No data loaded</div>
          <div class="empty-desc">Could not load apps.json. Check the console for errors.</div>
        </div>
      `;
      return;
    }

    const route = window.Router.currentRoute();
    const appId = route[0];
    const sub = route[1];

    window.scrollTo(0, 0);

    // FAQ page
    if (appId === 'faq') {
      setBackLink('/', '← Back');
      setTitle('FAQ');
      appEl.innerHTML = window.Views.faqView();
      return;
    }

    if (!appId) {
      setBackLink(null);
      setTitle('');
      appEl.innerHTML = window.Views.landingView(appData);
      return;
    }

    const app = appData[appId];

    if (!app) {
      setBackLink('/', '← All apps');
      setTitle('Not found');
      appEl.innerHTML = window.Views.notFoundView(appId);
      return;
    }

    if (sub === 'purchase') {
      setBackLink(`/${appId}`, '← Back');
      setTitle(`Products for ${app.name}`);
      appEl.innerHTML = window.Views.purchaseView(app);
      return;
    }

    if (!sub) {
      setBackLink('/', '← All apps');
      setTitle(app.name);
      appEl.innerHTML = window.Views.appDetailView(app);
      return;
    }

    setBackLink('/', '← All apps');
    setTitle('Not found');
    appEl.innerHTML = window.Views.notFoundView(appId);
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-purchase]');
    if (btn) {
      const appId = btn.getAttribute('data-app-id');
      const productId = btn.getAttribute('data-product-id');
      const app = appData && appData[appId];
      if (!app) return;
      const product = (app.products || []).find(p => p.id === productId);
      if (!product) return;
      window.Payment.startPayment({ appId, product });
      return;
    }
    if (e.target.closest('[data-action="close-payment"]')) {
      window.Payment.closeOverlay();
    }
  });

  window.addEventListener('routechange', render);
  window.addEventListener('popstate', render);

  (async function init() {
    console.log('[main] init start');

    const timeoutId = setTimeout(() => {
      console.error('[main] timeout — apps.json did not load in 8s');
      appEl.innerHTML = window.Views.errorView('Loading timed out. Please check your connection and reload.');
    }, 8000);

    try {
      appData = await window.DataLoader.loadApps();
      clearTimeout(timeoutId);
      console.log('[main] apps loaded:', Object.keys(appData));
      render();
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('[main] init failed:', err);
      appEl.innerHTML = window.Views.errorView(err.message || 'Unknown error');
    }
  })();
})();