(function () {
  function parsePath(pathname) {
    const clean = pathname.replace(/^\/+|\/+$/g, '');
    return clean ? clean.split('/') : [];
  }

  function currentRoute() {
    if (window.location.protocol === 'file:') {
      return { __fileProtocol: true };
    }
    const path = parsePath(window.location.pathname);
    const params = new URLSearchParams(window.location.search);
    return {
      segments: path,
      0: path[0],
      1: path[1],
      2: path[2],
      3: path[3],
      query: Object.fromEntries(params.entries())
    };
  }

  function navigate(path, options = {}) {
    if (options.replace) {
      window.history.replaceState({}, '', path);
    } else {
      window.history.pushState({}, '', path);
    }
    window.dispatchEvent(new Event('routechange'));
  }

  window.Router = { currentRoute, navigate, parsePath };

  document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-link]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('#') || link.target === '_blank') return;
    e.preventDefault();
    navigate(href);
  });
})();