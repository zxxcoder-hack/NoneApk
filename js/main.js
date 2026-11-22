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
  const fourth = route[3];
  const query = route.query || {};

  window.scrollTo(0, 0);

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

  // NEW: /{appId}/data/{filename}  [?ext=txt|csv]
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
        if (!res.ok) {
          throw new Error(`File /data/${appId}/${third}.${ext} returned HTTP ${res.status}`);
        }
        const text = await res.text();
        appEl.innerHTML = window.Views.dataFileView(app, third, ext, text, null);
      })
      .catch((err) => {
        appEl.innerHTML = window.Views.dataFileView(
          app, third, ext, '', err.message
        );
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