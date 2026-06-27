/* views/login.js */

function renderLoginView() {
  return `
  <div class="login-page">
    <div class="login-blob login-blob-1"></div>
    <div class="login-blob login-blob-2"></div>

    <div class="login-card">
      <div class="login-logo">
        <span class="login-logo-icon">✈️</span>
        <div class="login-logo-title">TurTakip</div>
        <div class="login-logo-sub">Turizm Yönetim Sistemi</div>
      </div>

      <form id="loginForm" onsubmit="handleLogin(event)">
        <div id="loginErr" class="login-err" style="display:none"></div>

        <div class="form-group">
          <label class="form-label" for="loginEmail">E-posta</label>
          <input type="email" id="loginEmail" class="form-control" placeholder="ornek@turizm.com" required autocomplete="email">
        </div>
        <div class="form-group">
          <label class="form-label" for="loginPass">Şifre</label>
          <input type="password" id="loginPass" class="form-control" placeholder="••••••••" required autocomplete="current-password">
        </div>

        <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center;padding:11px;font-size:14px;margin-top:4px">
          Giriş Yap →
        </button>
      </form>

      <div class="login-demo">
        <strong>Demo Hesaplar:</strong><br>
        Patron: <code>patron@turizm.com</code> / <code>patron123</code><br>
        Editör: <code>editor@turizm.com</code> / <code>editor123</code><br>
        Görüntüleyici: <code>goruntule@turizm.com</code> / <code>goruntule123</code>
      </div>
    </div>
  </div>`;
}

function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const pass  = document.getElementById('loginPass').value;
  const errEl = document.getElementById('loginErr');

  const res = Auth.login(email, pass);
  if (res.success) {
    Router.navigate('/year/' + new Date().getFullYear());
  } else {
    errEl.style.display = 'block';
    errEl.textContent   = res.error;
  }
}
