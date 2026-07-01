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

  // Bugün Özeti (Sidebar için)
  const today = todayStr();
  const todayEvs = DB.getEventsForDate(today);
  const tGroup = todayEvs.length;
  const tPax   = todayEvs.reduce((sum, e) => sum + (e.reservation.guestCount||1), 0);
  const todaySumHtml = tGroup > 0 
    ? `<div style="padding:10px;margin:0 8px 10px;background:var(--card);border:1px solid var(--border);border-radius:var(--radius-sm);text-align:center;font-size:11px">
         <div style="font-weight:700;color:var(--orange);margin-bottom:2px">Bugün</div>
         <div style="color:var(--text-sec)">${tGroup} Grup · ${tPax} Kişi</div>
       </div>`
    : '';

  const roleText = user.role === 'owner' ? '👑 Patron' : user.role === 'editor' ? '✏️ Düzenleyici' : '👁️ Görüntüleyici';

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
          ${todaySumHtml}
          
          <div class="nav-section">Genel</div>
          ${navItem('📊','Ana Sayfa','dashboard','/dashboard')}

          <div class="nav-section">Takvim</div>
          ${navItem('📅','Yıllık Takvim','year','/year/'+year)}

          <div class="nav-section">Yönetim</div>
          ${navItem('🔔','Yaklaşan Aktiviteler','activities','/activities')}
          ${navItem('👥','Rezervasyonlar','reservations','/reservations')}

          <div class="nav-section">Sistem</div>
          ${Auth.canEdit() ? navItem('📈','İstatistikler','stats','/stats') : ''}
          ${navItem('⚙️','Ayarlar','settings','/settings')}
        </div>

        <div class="sidebar-footer">
          <div class="sidebar-user">
            <div class="s-avatar" style="background:${color}">${inits}</div>
            <div class="s-info">
              <div class="s-name">${name}</div>
              <div class="s-role">${roleText}</div>
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
          
          <div style="display:flex;align-items:center">
            <div style="position:relative; margin-right:8px;">
              <button class="theme-toggle-btn" onclick="toggleNotifPanel()" title="Bildirimler / İşlem Geçmişi" style="background:var(--card);border:1px solid var(--border);color:var(--text);border-radius:var(--radius-sm);padding:6px 10px;cursor:pointer;font-size:16px;position:relative">
                🔔<span id="notifBadge" style="position:absolute;top:-4px;right:-4px;background:var(--red);color:#fff;font-size:10px;padding:2px 5px;border-radius:10px;display:none;font-weight:bold">0</span>
              </button>
              <div id="notifPanel" style="display:none;position:absolute;top:44px;right:0;width:320px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-md);box-shadow:0 10px 30px rgba(0,0,0,0.3);z-index:9999;max-height:400px;overflow-y:auto;flex-direction:column">
                <div style="padding:12px 14px;border-bottom:1px solid var(--border);font-weight:600;font-size:13px;display:flex;justify-content:space-between;background:var(--card)">
                  <span>📋 Son İşlemler</span>
                  <span style="font-size:11px;color:var(--blue);cursor:pointer;font-weight:500" onclick="clearNotifs()">Temizle</span>
                </div>
                <div id="notifList" style="padding:4px">
                  <div style="padding:16px;text-align:center;color:var(--text-muted);font-size:12px">Henüz işlem yok.</div>
                </div>
              </div>
            </div>
            
            <button class="theme-toggle-btn" onclick="toggleTheme()" title="Tema Değiştir" style="background:var(--card);border:1px solid var(--border);color:var(--text);border-radius:var(--radius-sm);padding:6px 10px;cursor:pointer;font-size:16px;transition:all var(--ease)">☀️</button>
          </div>
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

function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.getAttribute('data-theme') !== 'light';
  const newTheme = isDark ? 'light' : 'dark';
  html.setAttribute('data-theme', newTheme);
  localStorage.setItem('turTakipTheme', newTheme);
  document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
    btn.textContent = newTheme === 'light' ? '🌙' : '☀️';
    btn.title = newTheme === 'light' ? 'Koyu Temaya Geç' : 'Açık Temaya Geç';
  });
}

function initTheme() {
  const saved = localStorage.getItem('turTakipTheme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
}

/* ============================================================
   Route kayıtları
   ============================================================ */
function initApp() {
  initTheme();
  
  // Eksik demo rezervasyonları (yeni eklenenleri) localStorage'a dahil et
  const demos = _buildDemoReservations();
  const currentRes = DB.reservations;
  let changed = false;
  demos.forEach(d => {
    if (!currentRes.find(r => r.id === d.id)) {
      currentRes.push(d);
      changed = true;
    }
  });
  if (changed) DB.reservations = currentRes;

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

    .on('/activities', () => {
      document.getElementById('app').innerHTML = renderLayout('Yaklaşan Aktiviteler', renderActivitiesView(), 'activities');
    })

    .on('/reservation/new', () => {
      if (!Auth.canEdit()) { Router.navigate('/reservations', true); return; }
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
      if (!Auth.canEdit()) { Router.navigate('/reservation/' + id, true); return; }
      const r = DB.getReservation(id);
      if (!r) { showNotif('Rezervasyon bulunamadı','error'); Router.navigate('/reservations'); return; }
      document.getElementById('app').innerHTML = renderLayout('Rezervasyon Düzenle', renderReservationForm(r), 'reservations');
      initFormCounters(r);
    })

    .on('/dashboard', () => {
      document.getElementById('app').innerHTML = renderLayout('Ana Sayfa', renderDashboardView(), 'dashboard');
    })

    .on('/stats', () => {
      if (!Auth.canEdit()) { Router.navigate('/dashboard', true); return; }
      document.getElementById('app').innerHTML = renderLayout('İstatistikler & Denetim', renderStatsView(), 'stats');
    })

    .on('/settings', () => {
      document.getElementById('app').innerHTML = renderLayout('Ayarlar', renderSettingsView(), 'settings');
    });

  // Default redirect
  if (window.location.hash === '' || window.location.hash === '#/') {
    Router.navigate(Auth.isLoggedIn() ? '/dashboard' : '/login');
  } else {
    Router.init();
  }

  // Set correct theme icon on load
  const _savedTheme = localStorage.getItem('turTakipTheme') || 'dark';
  document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
    btn.textContent = _savedTheme === 'light' ? '🌙' : '☀️';
  });
}

document.addEventListener('DOMContentLoaded', initApp);
