(function() {
  let cachedApps = null;
  let cachedPayConfig = null;
  
  async function loadApps() {
    if (cachedApps) return cachedApps;
    const res = await fetch(window.APP_CONFIG.dataUrl, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`Failed to load apps.json (HTTP ${res.status})`);
    const data = await res.json();
    cachedApps = data.apps || {};
    return cachedApps;
  }
  
  async function loadPayConfig() {
    if (cachedPayConfig) return cachedPayConfig;
    try {
      const res = await fetch(window.APP_CONFIG.paykassmaConfigUrl, { cache: 'no-cache' });
      cachedPayConfig = res.ok ?
        await res.json() :
        { pluginBaseUrl: window.APP_CONFIG.paykassmaPluginBase };
    } catch {
      cachedPayConfig = { pluginBaseUrl: window.APP_CONFIG.paykassmaPluginBase };
    }
    return cachedPayConfig;
  }
  
  window.DataLoader = { loadApps, loadPayConfig };
})();