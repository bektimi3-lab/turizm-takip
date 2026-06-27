/* app.js — Ana uygulama başlatıcısı ve ortak layout */

/* ============================================================
   Ortak layout (sidebar + header + içerik alanı)
   ============================================================ */
function renderLayout(title, content, activeNav) {
  const user = Auth.currentUser || {};
  const name = user.name || 'Kullanıcı';
  const inits = getInitials(name.split(' ')[0], name.split(' ')[1] || '');
  const color = avatarColor(name);
  const year  = new Date().getFullYear();

  function navItem(icon, label, nav, path) {
    const active = activeNav === nav ? 'active' : '';
    return `<button class="nav-item ${active}" id="nav-${nav}" onclick="Router.navigate('${path}')">
      <span class="nav-icon">${icon}</span><span>${label}</span>
    </button>`;
  }

  return `
    <div class="mob-overlay" id="mobOverlay" onclick="closeMobMenu()"></div>
    <div class="layout">
      <!-- SIDEBAR -->
      <nav class="sidebar" id="sidebar">
        <div class="sidebar-logo">
          <span style="font-size:26px">✈️</span>
          <div>
            <div class="sidebar-logo-text">TurTakip</div>
            <div class="sidebar-logo-sub">Turizm Yönetimi</div>
          </div>
        </div>

        <div class="sidebar-nav">
          <div class="nav-section">Takvim</div>
          ${navItem('📅','Yıllık Takvim','year','/year/'+year)}

          <div class="nav-section">Yönetim</div>
          ${navItem('👥','Rezervasyonlar','reservations','/reservations')}

          <div class="nav-section">Sistem</div>
          ${navItem('⚙️','Ayarlar','settings','/settings')}
        </div>

        <div class="sidebar-footer">
          <div class="sidebar-user">
            <div class="s-avatar" style="background:${color}">${inits}</div>
            <div class="s-info">
              <div class="s-name">${name}</div>
              <div class="s-role">${user.role === 'editor' ? '✏️ Editör' : '👁️ Görüntüleyici'}</div>
            </div>
            <button class="s-logout" onclick="Auth.logout()" title="Çıkış Yap">🚪</button>
          </div>
        </div>
      </nav>

      <!-- MAIN -->
      <div class="main-content">
        <header class="top-header">
          <button class="mobile-menu-btn" onclick="toggleMobMenu()">☰</button>
          <div class="top-header-title">${title}</div>
          <div class="top-header-actions" id="headerActions"></div>
        </header>
        <main class="page-content page-enter" id="pageContent">
          ${content}
        </main>
      </div>
    </div>
  `;
}

function toggleMobMenu() {
  document.getElementById('sidebar').classList.toggle('mob-open');
  document.getElementById('mobOverlay').classList.toggle('vis');
}
function closeMobMenu() {
  document.getElementById('sidebar')?.classList.remove('mob-open');
  document.getElementById('mobOverlay')?.classList.remove('vis');
}

/* ============================================================
   Route kayıtları
   ============================================================ */
function initApp() {
  const y = new Date().getFullYear();

  Router
    .on('/login', () => {
      document.getElementById('app').innerHTML = renderLoginView();
    })

    .on('/year/:year', ({ year }) => {
      const yr = parseInt(year) || y;
      document.getElementById('app').innerHTML = renderLayout(
        `${yr} Yılı Takvimi`,
        renderYearView(yr),
        'year'
      );
    })

    .on('/month/:year/:month', ({ year, month }) => {
      const yr = parseInt(year), mo = parseInt(month) - 1;
      document.getElementById('app').innerHTML = renderLayout(
        `${MONTHS_TR[mo]} ${yr}`,
        renderMonthView(yr, mo),
        'year'
      );
    })

    .on('/day/:year/:month/:day', ({ year, month, day }) => {
      const dateStr = `${year}-${month.padStart(2,'0')}-${day.padStart(2,'0')}`;
      document.getElementById('app').innerHTML = renderLayout(
        formatDate(dateStr),
        renderDayView(dateStr),
        'year'
      );
    })

    .on('/reservations', () => {
      document.getElementById('app').innerHTML = renderLayout('Rezervasyonlar', renderReservationsList(), 'reservations');
    })

    .on('/reservation/new', () => {
      if (!Auth.canEdit()) { showNotif('Bu işlem için yetkiniz yok.','error'); return; }
      document.getElementById('app').innerHTML = renderLayout('Yeni Rezervasyon', renderReservationForm(null), 'reservations');
      initFormCounters(null);
    })

    .on('/reservation/:id', ({ id }) => {
      const r = DB.getReservation(id);
      if (!r) { showNotif('Rezervasyon bulunamadı','error'); Router.navigate('/reservations'); return; }
      document.getElementById('app').innerHTML = renderLayout(
        `${r.personal.firstName} ${r.personal.lastName}`,
        renderReservationProfile(r),
        'reservations'
      );
    })

    .on('/reservation/:id/edit', ({ id }) => {
      if (!Auth.canEdit()) { showNotif('Bu işlem için yetkiniz yok.','error'); return; }
      const r = DB.getReservation(id);
      if (!r) { showNotif('Rezervasyon bulunamadı','error'); Router.navigate('/reservations'); return; }
      document.getElementById('app').innerHTML = renderLayout('Rezervasyon Düzenle', renderReservationForm(r), 'reservations');
      initFormCounters(r);
    })

    .on('/settings', () => {
      document.getElementById('app').innerHTML = renderLayout('Ayarlar', renderSettingsView(), 'settings');
    });

  Router.init();
}

document.addEventListener('DOMContentLoaded', initApp);
