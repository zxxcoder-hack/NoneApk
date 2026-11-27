(function () {
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

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

    const cards = list.length === 0
      ? `<div class="empty">
           <div class="empty-icon">▢</div>
           <div class="empty-title">No apps yet</div>
           <div class="empty-desc">Add entries to <code>data/apps.json</code> to see them here.</div>
         </div>`
      : list.map(app => `
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

    const shotsHTML = shots.length
      ? `<section class="section">
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
         </section>`
      : '';

    const warningBanner = `
      <div style="margin-bottom:1rem;padding:0.75rem 1rem;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg-100);font-size:0.8125rem;color:var(--text-2);line-height:1.6;">
        <strong style="color:var(--text);">First time installing an APK?</strong>
        Android will ask you to allow installs from this site. See our
        <a href="/faq" data-link style="color:var(--accent);">install guide</a>
        for the exact steps.
      </div>`;

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
          ${warningBanner}
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
    const cards = products.length
      ? products.map((p, i) => `
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
              Purchase
            </button>
          </div>
        `).join('')
      : `<div class="empty">
           <div class="empty-icon">▢</div>
           <div class="empty-title">No products available</div>
           <div class="empty-desc">This app does not have any purchasable products yet.</div>
         </div>`;

    return `
      <div class="page-head">
        <h1 class="page-title">Products for ${esc(app.name)}</h1>
        <p class="page-sub">Choose a license. Payments are coming soon.</p>
      </div>
      <div class="product-grid">${cards}</div>
    `;
  }

  function faqView() {
    const items = [
      {
        q: 'Why does Android warn "For your security, your phone is not allowed to install unknown apps from this source"?',
        a: 'Android blocks APK installs from outside the Play Store by default. This is a safety feature — it does not mean the app is malicious. You need to explicitly allow your browser or file manager to install APKs once, then the warning will not appear again for that source.'
      },
      {
        q: 'How do I enable installing APKs from my browser?',
        a: '<ol style="margin:0.5rem 0 0 1.25rem;padding:0;line-height:1.8;"><li>Download the APK from this site.</li><li>When you tap "Install", Android shows the warning. Tap <strong>Settings</strong>.</li><li>Toggle <strong>"Allow from this source"</strong> ON.</li><li>Go back and tap <strong>Install</strong> again.</li><li>After install, you can optionally turn the permission back off.</li></ol>'
      },
      {
        q: 'On which Android versions do I need to do this?',
        a: 'Android 8.0 (Oreo) and later require per-app permission. On older versions (Android 7 and below), you only need to enable "Unknown sources" once in Settings → Security. On Android 13+, it is under Settings → Apps → Special access → Install unknown apps.'
      },
      {
        q: 'Is it safe to install APKs from noneapk.xyz?',
        a: 'Every app on this site is uploaded by its developer. You can verify the APK file\'s SHA-256 checksum from the app detail page before installing. If the hash does not match, do not install the file.'
      },
      {
        q: 'Why does Play Protect show a warning after install?',
        a: 'Google Play Protect scans all installed apps, including sideloaded ones. If the app is not yet on the Play Store, it may show "App scan recommended" or "This app was not installed from Play Store." You can safely dismiss this if the checksum matches and the developer is trusted.'
      },
      {
        q: 'Can I update the app without uninstalling?',
        a: 'Yes. If the new APK is signed with the same signing key as the installed version, Android installs it as an update and keeps your data. If the signing key changed, Android will refuse and you will need to uninstall first — this is a security feature.'
      },
      {
        q: 'How do I verify the APK checksum?',
        a: 'On Android, use a file manager (like Material Files) — long-press the APK → Properties → SHA-256. On desktop, use <code>sha256sum file.apk</code> or <code>certutil -hashfile file.apk SHA256</code> on Windows.'
      }
    ];

    const itemsHTML = items.map((item, i) => `
      <details ${i === 0 ? 'open' : ''} style="border:1px solid var(--border);border-radius:var(--radius-lg);background:var(--bg-100);margin-bottom:0.75rem;">
        <summary style="padding:1rem 1.25rem;cursor:pointer;font-weight:600;font-size:0.9375rem;list-style:none;display:flex;justify-content:space-between;align-items:center;gap:1rem;">
          <span>${esc(item.q)}</span>
          <span style="color:var(--text-3);font-family:var(--font-mono);font-size:1rem;flex-shrink:0;">+</span>
        </summary>
        <div style="padding:0 1.25rem 1.25rem;color:var(--text-2);font-size:0.875rem;line-height:1.7;border-top:1px solid var(--border);padding-top:1rem;">
          ${item.a}
        </div>
      </details>
    `).join('');

    return `
      <div class="page-head">
        <h1 class="page-title">Frequently asked questions</h1>
        <p class="page-sub">Everything you need to know about installing apps from noneapk.xyz on Android.</p>
      </div>

      <div style="max-width:800px;">
        ${itemsHTML}
      </div>

      <div style="margin-top:2.5rem;padding:1.5rem;border:1px solid var(--border);border-radius:var(--radius-lg);background:var(--bg-100);max-width:800px;">
        <h3 style="font-size:0.9375rem;margin-bottom:0.5rem;">Still need help?</h3>
        <p style="font-size:0.875rem;color:var(--text-2);line-height:1.6;">
          If an install fails or the checksum does not match, do not proceed. Contact the developer listed on the app detail page, or email <a href="mailto:support@noneapk.xyz" style="color:var(--accent);">support@noneapk.xyz</a>.
        </p>
      </div>
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

  window.Views = { landingView, appDetailView, purchaseView, notFoundView, errorView, faqView };
})();