/* router.js — Hash tabanlı SPA yönlendirici */

const Router = {
  _routes: [],

  on(pattern, handler) {
    this._routes.push({ pattern: pattern.split('/').filter(Boolean), handler });
    return this;
  },

  navigate(path, replace = false) {
    const target = '#' + path;
    if (replace) history.replaceState(null, '', target);
    else window.location.hash = target;
    this._dispatch();
  },

  _dispatch() {
    const hash    = window.location.hash || '';
    const path    = hash.replace('#', '') || '/';
    const segs    = path.split('/').filter(Boolean);

    /* Auth guard */
    if (path !== '/login' && !Auth.isLoggedIn()) {
      this.navigate('/login', true); return;
    }
    if (path === '/login' && Auth.isLoggedIn()) {
      this.navigate('/year/' + new Date().getFullYear(), true); return;
    }

    /* Match */
    for (const route of this._routes) {
      const ps = route.pattern;
      if (ps.length !== segs.length) continue;
      const params = {};
      let ok = true;
      for (let i = 0; i < ps.length; i++) {
        if (ps[i].startsWith(':')) params[ps[i].slice(1)] = decodeURIComponent(segs[i]);
        else if (ps[i] !== segs[i]) { ok = false; break; }
      }
      if (ok) { route.handler(params); return; }
    }

    /* Default */
    this.navigate('/year/' + new Date().getFullYear(), true);
  },

  init() {
    window.addEventListener('hashchange', () => this._dispatch());
    this._dispatch();
  },
};
