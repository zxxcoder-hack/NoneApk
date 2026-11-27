(function () {
  let cachedApps = null;

  async function loadApps() {
    if (cachedApps) return cachedApps;
    const url = window.APP_CONFIG.dataUrl;
    console.log('[data-loader] fetching', url);
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`Failed to load apps.json (HTTP ${res.status})`);
    const data = await res.json();
    const apps = data.apps || {};

    Object.entries(apps).forEach(([key, app]) => {
      if (app.id !== key) {
        console.error(
          `[data-loader] Mismatch: apps["${key}"].id is "${app.id}". ` +
          `The key and id must be identical, otherwise /${app.id}/ will 404.`
        );
      }
    });

    cachedApps = apps;
    return cachedApps;
  }

  window.DataLoader = { loadApps };
})();