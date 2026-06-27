/* auth.js — Basit oturum yönetimi */

const Auth = {
  _user: null,

  get currentUser() {
    if (this._user) return this._user;
    try { const s = localStorage.getItem('tts_session'); this._user = s ? JSON.parse(s) : null; } catch { this._user = null; }
    return this._user;
  },

  login(email, password) {
    const user = DB.users.find(u => u.email === email && u.password === password);
    if (user) {
      this._user = user;
      localStorage.setItem('tts_session', JSON.stringify(user));
      return { success: true, user };
    }
    return { success: false, error: 'Geçersiz e-posta veya şifre.' };
  },

  logout() {
    this._user = null;
    localStorage.removeItem('tts_session');
    Router.navigate('/login');
  },

  isLoggedIn() { return !!this.currentUser; },
  canEdit()    { return this.currentUser?.role === 'editor'; },

  require() {
    if (!this.isLoggedIn()) { Router.navigate('/login'); return false; }
    return true;
  },
};
