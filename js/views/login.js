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
            <label class="form-label" style="font-size:12px;font-weight:600">E-posta</label>
            <input type="email" id="loginEmail" class="form-control" style="background:#f8fafc" placeholder="patron1@turizm.com / editor1@turizm.com" onkeydown="if(event.key==='Enter') document.getElementById('loginBtn').click()">
          </div>
          <div class="form-group" style="margin-bottom:24px">
            <label class="form-label" style="font-size:12px;font-weight:600">Şifre</label>
            <input type="password" id="loginPw" class="form-control" style="background:#f8fafc" placeholder="patron123 / editor123" onkeydown="if(event.key==='Enter') document.getElementById('loginBtn').click()">
          </div>

        <button type="submit" id="loginBtn" class="btn btn-primary" style="width:100%;justify-content:center;padding:11px;font-size:14px;margin-top:4px">
          Giriş Yap →
        </button>
      </form>
    </div>
  </div>`;
}

function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const pass  = document.getElementById('loginPw').value;
  const errEl = document.getElementById('loginErr');

  const res = Auth.login(email, pass);
  if (res.success) {
    Router.navigate('/year/' + new Date().getFullYear());
  } else {
    errEl.style.display = 'block';
    errEl.textContent   = res.error;
  }
}
