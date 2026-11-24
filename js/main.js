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
    const third = route[2];
    const query = route.query || {};

    window.scrollTo(0, 0);

    if (!appId) {
      setBackLink(null);
      setTitle('');
      appEl.innerHTML = window.Views.landingView(appData);
      return;
    }

    // Raw file path: /data/{appId}/{filename}
    if (appId === 'data' && route[1] && route[2]) {
      const rawAppId = route[1];
      const rawFile = route[2];
      const rawApp = appData[rawAppId];

      if (!rawApp) {
        setBackLink('/', '← All apps');
        setTitle('Not found');
        appEl.innerHTML = window.Views.notFoundView(rawAppId);
        return;
      }

      const ext = (query.ext || 'json').toLowerCase();
      const allowed = ['json', 'txt', 'csv'];

      if (!allowed.includes(ext)) {
        setBackLink(`/${rawAppId}`, '← Back');
        setTitle('Invalid format');
        appEl.innerHTML = window.Views.dataFileView(
          rawApp, rawFile, 'json', '', `Unsupported extension "${ext}". Allowed: ${allowed.join(', ')}.`
        );
        return;
      }

      const fileUrl = `/data/${rawAppId}/${rawFile}.${ext}`;
      setBackLink(`/${rawAppId}`, '← Back');
      setTitle(`${rawFile}.${ext} — ${rawApp.name}`);
      appEl.innerHTML = `<div class="loader"><div class="spinner"></div><p>Loading file…</p></div>`;

      fetch(fileUrl, { cache: 'no-cache' })
        .then(async (res) => {
          if (!res.ok) throw new Error(`File /data/${rawAppId}/${rawFile}.${ext} returned HTTP ${res.status}`);
          const text = await res.text();
          appEl.innerHTML = window.Views.dataFileView(rawApp, rawFile, ext, text, null);
        })
        .catch((err) => {
          appEl.innerHTML = window.Views.dataFileView(rawApp, rawFile, ext, '', err.message);
        });
      return;
    }

    const app = appData[appId];

    if (!app) {
      setBackLink('/', '← All apps');
      setTitle('Not found');
      appEl.innerHTML = window.Views.notFoundView(appId);
      return;
    }

    // SPA route: /{appId}/data/{filename}
    if (sub === 'data' && third) {
      const ext = (query.ext || 'json').toLowerCase();
      const allowed = ['json', 'txt', 'csv'];

      if (!allowed.includes(ext)) {
        setBackLink(`/${appId}`, '← Back');
        setTitle('Invalid format');
        appEl.innerHTML = window.Views.dataFileView(
          app, third, 'json', '', `Unsupported extension "${ext}". Allowed: ${allowed.join(', ')}.`
        );
        return;
      }

      const fileUrl = `/data/${appId}/${third}.${ext}`;
      setBackLink(`/${appId}`, '← Back');
      setTitle(`${third}.${ext} — ${app.name}`);
      appEl.innerHTML = `<div class="loader"><div class="spinner"></div><p>Loading file…</p></div>`;

      fetch(fileUrl, { cache: 'no-cache' })
        .then(async (res) => {
          if (!res.ok) throw new Error(`File /data/${appId}/${third}.${ext} returned HTTP ${res.status}`);
          const text = await res.text();
          appEl.innerHTML = window.Views.dataFileView(app, third, ext, text, null);
        })
        .catch((err) => {
          appEl.innerHTML = window.Views.dataFileView(app, third, ext, '', err.message);
        });
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
    try {
      appData = await window.DataLoader.loadApps();
      console.log('[main] apps loaded:', Object.keys(appData));
      render();
    } catch (err) {
      console.error('[main] init failed:', err);
      appEl.innerHTML = window.Views.errorView(err.message || 'Unknown error');
    }
  })();
})();