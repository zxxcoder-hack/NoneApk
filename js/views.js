(function() {
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  } [c]));

  // Renders an <img> with a graceful text fallback if the file is missing
  function iconHTML(app, className = 'app-icon') {
    const src = app.icon;
    if (!src) {
      return `<div class="${className}"><span class="app-icon-fallback">?</span></div>`;
    }
    return `
      <div class="${className}">
        <img src="${esc(src)}" alt="${esc(app.name)} icon" loading="lazy"
          onerror="this.replaceWith(Object.assign(document.createElement('span'),
            {className:'app-icon-fallback', textContent:'?'}))">
      </div>`;
  }

  function landingView(apps) {
    const list = Object.values(apps);
    const domain = window.APP_CONFIG.domain;

    const cards = list.length === 0 ?
      `<div class="empty">
           <div class="empty-icon">▢</div>
           <div class="empty-title">No apps yet</div>
           <div class="empty-desc">Add entries to <code>data/apps.json</code> to see them here.</div>
         </div>` :
      list.map(app => `
          <a class="app-card" href="/${esc(app.id)}" data-link>
            <div class="app-card-head">
              ${iconHTML(app)}
              <div class="app-card-titles">
                <div class="app-card-name">${esc(app.name)}</div>
                <div class="app-card-dev">${esc(app.developer || 'Unknown')}</div>
              </div>
            </div>
            <div class="app-card-desc">${esc(app.description || '')}</div>
            <div class="app-card-foot">
              <span class="badge">v${esc(app.version || '?')}</span>
              <span class="app-card-arrow">→</span>
            </div>
          </a>
        `).join('');

    return `
      <section class="hero">
        <div class="hero-eyebrow">
          <span class="hero-eyebrow-dot"></span>
          Available now
        </div>
        <h1 class="hero-title">
          Download apps.<br>
          <span class="hero-title-sub">Purchase licenses.</span>
        </h1>
        <p class="hero-sub">
          Browse the ${esc(domain)} catalog. Open any app with
          <code>/${esc(domain)}/appid/</code> or pick one below.
        </p>
      </section>
      <section class="section">
        <div class="section-head">
          <h2 class="section-title">All apps</h2>
          <span class="section-count">${list.length} total</span>
        </div>
        <div class="app-grid">${cards}</div>
      </section>
    `;
  }

  function appDetailView(app) {
    const shots = app.screenshots || [];
    const hasProducts = (app.products || []).length > 0;

    const shotsHTML = shots.length ?
      `<section class="section">
           <div class="section-head">
             <h2 class="section-title">Screenshots</h2>
             <span class="section-count">${shots.length} images</span>
           </div>
           <div class="screenshots">
             ${shots.map(src => `
               <div class="shot">
                 <img src="${esc(src)}" alt="Screenshot" loading="lazy"
                   onerror="this.parentElement.replaceWith(Object.assign(document.createElement('div'),
                     {className:'shot', textContent:'Image missing'}))">
               </div>
             `).join('')}
           </div>
         </section>` :
      '';

    return `
      <div class="detail-top">
        <div class="detail-main">
          ${iconHTML(app, 'detail-icon')}
          <h1 class="detail-title">${esc(app.name)}</h1>
          <p class="detail-dev">by ${esc(app.developer || 'Unknown')}</p>
          <div class="detail-meta">
            <span class="badge">v${esc(app.version || '?')}</span>
            <span class="detail-meta-dot"></span>
            <span>${esc(app.category || 'App')}</span>
            <span class="detail-meta-dot"></span>
            <span>⭐ ${esc(String(app.rating || 'N/A'))}</span>
          </div>
          <p class="detail-desc">${esc(app.description || '')}</p>
          <div class="detail-actions">
            <a class="btn btn-primary btn-lg" href="${esc(app.apkUrl || '#')}" download>
              Download APK
            </a>
            ${hasProducts
              ? `<a class="btn btn-secondary btn-lg" href="/${esc(app.id)}/purchase" data-link>
                   View products
                 </a>`
              : ''}
          </div>
        </div>
        <aside class="detail-side">
          <div class="side-head">Details</div>
          <div class="side-row"><span class="side-label">Version</span><span class="side-value mono">${esc(app.version || '—')}</span></div>
          <div class="side-row"><span class="side-label">Size</span><span class="side-value mono">${esc(app.size || '—')}</span></div>
          <div class="side-row"><span class="side-label">Developer</span><span class="side-value">${esc(app.developer || '—')}</span></div>
          <div class="side-row"><span class="side-label">Category</span><span class="side-value">${esc(app.category || '—')}</span></div>
          <div class="side-row"><span class="side-label">Rating</span><span class="side-value">⭐ ${esc(String(app.rating || '—'))}</span></div>
        </aside>
      </div>
      ${shotsHTML}
    `;
  }

  function purchaseView(app) {
    const products = app.products || [];
    const cards = products.length ?
      products.map((p, i) => `
          <div class="product-card${i === 0 ? ' featured' : ''}">
            ${i === 0 ? '<span class="product-badge">Popular</span>' : ''}
            <div class="product-name">${esc(p.name)}</div>
            <div class="product-desc">${esc(p.description || '')}</div>
            <div class="product-price">
              <span class="product-amount">$${Number(p.price).toFixed(2)}</span>
              <span class="product-currency">${esc(p.currency || 'USD')}</span>
            </div>
            <button class="btn btn-primary btn-block"
              data-purchase
              data-app-id="${esc(app.id)}"
              data-product-id="${esc(p.id)}">
              Purchase with Paykassma
            </button>
          </div>
        `).join('') :
      `<div class="empty">
           <div class="empty-icon">▢</div>
           <div class="empty-title">No products available</div>
           <div class="empty-desc">This app does not have any purchasable products yet.</div>
         </div>`;

    return `
      <div class="page-head">
        <h1 class="page-title">Products for ${esc(app.name)}</h1>
        <p class="page-sub">Choose a license. Payments are processed securely by Paykassma.</p>
      </div>
      <div class="product-grid">${cards}</div>
    `;
  }

  function notFoundView(appId) {
    return `
      <div class="empty">
        <div class="empty-icon">▢</div>
        <div class="empty-title">App not found</div>
        <div class="empty-desc">
          No app with id "${esc(appId)}" exists in this store.
        </div>
        <a class="btn btn-secondary" href="/" data-link>Back to store</a>
      </div>
    `;
  }

  function errorView(msg) {
    return `
      <div class="empty">
        <div class="empty-icon">▢</div>
        <div class="empty-title">Failed to load store</div>
        <div class="empty-desc">${esc(msg)}</div>
        <button class="btn btn-secondary" onclick="location.reload()">Retry</button>
      </div>
    `;
  }

  function dataFileView(app, filename, ext, content, error) {
    const knownExts = ['json', 'txt', 'csv'];
    const activeExt = ext || 'json';

    // Build the tab links — one per known extension
    const tabs = knownExts.map(e => {
      const isActive = e === activeExt;
      return `<a class="btn ${isActive ? 'btn-primary' : 'btn-secondary'} btn-sm"
      href="/${esc(app.id)}/data/${esc(filename)}${e === 'json' ? '' : `?ext=${e}`}"
      data-link>${e.toUpperCase()}</a>`;
    }).join('');

    const contentBlock = error ?
      `<div class="empty" style="text-align:left;">
         <div class="empty-title">File not available</div>
         <div class="empty-desc">${esc(error)}</div>
       </div>` :
      `<pre style="background:var(--bg-100);border:1px solid var(--border);border-radius:var(--radius-lg);padding:1.25rem;overflow:auto;font-family:var(--font-mono);font-size:0.8rem;line-height:1.6;color:var(--text-2);max-height:600px;">${esc(content)}</pre>`;

    return `
    <div class="page-head">
      <h1 class="page-title">${esc(filename)}.${esc(activeExt)}</h1>
      <p class="page-sub">Raw data file for ${esc(app.name)} · <a href="/${esc(app.id)}" data-link style="color:var(--accent);">back to app</a></p>
    </div>

    <div style="display:flex;gap:0.5rem;margin-bottom:1.5rem;flex-wrap:wrap;">
      ${tabs}
      <a class="btn btn-ghost btn-sm"
         href="/data/${esc(app.id)}/${esc(filename)}.${esc(activeExt)}"
         target="_blank" rel="noopener">Open raw ↗</a>
    </div>

    ${contentBlock}
  `;
  }

  window.Views = {
    landingView,
    appDetailView,
    purchaseView,
    notFoundView,
    errorView
  };
})();