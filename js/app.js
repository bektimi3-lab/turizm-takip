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
              <button onclick="toggleNotifPanel()" title="Bildirimler / İşlem Geçmişi" style="background:var(--card);border:1px solid var(--border);color:var(--text);border-radius:var(--radius-sm);padding:6px 10px;cursor:pointer;font-size:16px;position:relative">
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

window.addEventListener('beforeunload', (e) => {
  if (window._isFormDirty) {
    e.preventDefault();
    e.returnValue = 'Kaydedilmemiş değişiklikleriniz var!';
  }
});

/* ============================================================
   GÜNÜN ETKİNLİKLERİ BİLDİRİMİ
   ============================================================ */
function showTodayBriefing() {
  if (!Auth.isLoggedIn()) return;
  if (window._briefingShown) return;

  const today = todayStr();
  // Kullanıcı bazlı baskılama: farklı kullanıcılar ayrı ayrı "bugün gösterme" seçebilir
  const user = Auth.currentUser;
  const suppressedKey = 'turTakipBriefingSuppressed_' + (user?.id || 'default');

  // "Bugün tekrar gösterme" seçildiyse çık
  if (localStorage.getItem(suppressedKey) === today) return;

  const evList = DB.getEventsForDate(today);
  if (!evList || evList.length === 0) return; // Etkinlik yoksa gösterme

  // Toplam kişi sayısı
  const totalGuests = evList.reduce((s, e) => s + (e.reservation.guestCount || 1), 0);

  const rows = evList.map(({ reservation, events }) => {
    const nm = `${reservation.personal?.firstName || ''} ${reservation.personal?.lastName || ''}`.trim() || 'İsimsiz';
    const badges = events.map(ev => {
      if (ev.type === 'tour')     return `<span style="background:var(--orange-dim);color:var(--orange);border-radius:4px;padding:2px 6px;font-size:11px">🏷️ Tur</span>`;
      if (ev.type === 'balloon')  return `<span style="background:var(--red-dim);color:var(--red);border-radius:4px;padding:2px 6px;font-size:11px">🎈 Balon</span>`;
      if (ev.type === 'flight')   return `<span style="background:var(--blue-dim);color:var(--blue);border-radius:4px;padding:2px 6px;font-size:11px">✈️ Uçuş</span>`;
      if (ev.type === 'transfer') return `<span style="background:var(--purple-dim);color:var(--purple);border-radius:4px;padding:2px 6px;font-size:11px">🚌 Transfer</span>`;
      if (ev.type === 'checkin')  return `<span style="background:var(--green-dim);color:var(--green);border-radius:4px;padding:2px 6px;font-size:11px">🏨 Check-in</span>`;
      if (ev.type === 'checkout') return `<span style="background:var(--red-dim);color:var(--red);border-radius:4px;padding:2px 6px;font-size:11px">🏨 Check-out</span>`;
      return '';
    }).join(' ');
    
    // İlk tur uyarısı (Bakiye varsa)
    let warningHtml = '';
    const firstTourDate = [...(reservation.tours||[])].sort((a,b)=>new Date(a.date)-new Date(b.date))[0]?.date;
    const firstBalloonDate = reservation.balloon?.active ? reservation.balloon.date : null;
    
    const isFirstTourDay = (firstTourDate === today) || (firstBalloonDate === today && !firstTourDate);
    
    const total = reservation.payment?.total || 0;
    const paid = reservation.payment?.paid || 0;
    const remain = total - paid;
    
    if (isFirstTourDay && remain > 0) {
      warningHtml = `
        <div style="margin-top:8px;background:var(--red-dim);border:1px solid var(--red);border-radius:var(--radius-sm);padding:8px 12px;display:flex;align-items:center;gap:8px">
          <span style="font-size:18px">⚠️</span>
          <div>
            <div style="font-size:12px;font-weight:700;color:var(--red)">DİKKAT: İlk Gün Etkinliği!</div>
            <div style="font-size:11px;color:var(--red)">İçeride ödenmemiş <strong>${remain.toLocaleString('tr-TR')} ${reservation.payment?.currency||'EUR'}</strong> bakiye bekliyor.</div>
          </div>
        </div>
      `;
    }

    return `
      <div style="display:flex;flex-direction:column;padding:12px 0;border-bottom:1px solid var(--border);cursor:pointer"
           onclick="closeTodayBriefing(); Router.navigate('/reservation/${reservation.id}')">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-weight:600;font-size:14px;margin-bottom:4px">${nm}</div>
            <div style="display:flex;gap:4px;flex-wrap:wrap">${badges}</div>
          </div>
          <div style="font-size:12px;color:var(--text-muted);margin-left:12px;flex-shrink:0">${reservation.guestCount||1} Kişi</div>
        </div>
        ${warningHtml}
      </div>`;
  }).join('');

  const html = `
    <div id="todayBriefingOverlay" style="position:fixed;inset:0;background:rgba(0,0,0,0.60);z-index:99998;display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn 0.2s ease">
      <div style="width:100%;max-width:480px;background:var(--surface);border-radius:var(--radius-lg);box-shadow:0 20px 60px rgba(0,0,0,0.5);overflow:hidden">
        <!-- Header -->
        <div style="background:var(--orange);padding:18px 20px;display:flex;align-items:center;justify-content:space-between">
          <div>
            <div style="font-size:18px;font-weight:800;color:#fff">☀️ Günaydın!</div>
            <div style="font-size:12px;color:rgba(255,255,255,0.85);margin-top:2px">${new Date().toLocaleDateString('tr-TR',{weekday:'long',day:'numeric',month:'long'})} · Bugün <strong>${evList.length} grup, ${totalGuests} kişi</strong> var</div>
          </div>
          <button onclick="closeTodayBriefing()" style="background:rgba(255,255,255,0.2);border:none;color:#fff;border-radius:50%;width:30px;height:30px;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center">×</button>
        </div>
        <!-- List -->
        <div style="padding:4px 20px;max-height:320px;overflow-y:auto">
          ${rows}
        </div>
        <!-- Footer -->
        <div style="padding:14px 20px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border);gap:10px">
          <button onclick="suppressTodayBriefing()" style="background:none;border:1px solid var(--border);color:var(--text-muted);border-radius:var(--radius-sm);padding:7px 14px;cursor:pointer;font-size:12px;transition:all var(--ease)">
            🚫 Bugün tekrar gösterme
          </button>
          <button onclick="closeTodayBriefing(); Router.navigate('/activities')" style="background:var(--orange);border:none;color:#fff;border-radius:var(--radius-sm);padding:7px 16px;cursor:pointer;font-size:13px;font-weight:600">
            Aktiviteleri Gör →
          </button>
        </div>
      </div>
    </div>
  `;

  // Append to body after a short delay so layout is ready
  setTimeout(() => {
    if (!document.getElementById('todayBriefingOverlay')) {
      document.body.insertAdjacentHTML('beforeend', html);
      window._briefingShown = true;
    }
  }, 600);
}

function closeTodayBriefing() {
  const el = document.getElementById('todayBriefingOverlay');
  if (el) el.remove();
}

function suppressTodayBriefing() {
  const user = Auth.currentUser;
  const suppressedKey = 'turTakipBriefingSuppressed_' + (user?.id || 'default');
  localStorage.setItem(suppressedKey, todayStr());
  closeTodayBriefing();
}

/* ============================================================
   Route kayıtları
   ============================================================ */
function initApp() {
  initTheme();
  showTodayBriefing();
  
  // Demo rezervasyonları yalnızca ilk açılışta (localStorage tamamen boşsa) ekle.
  // Kullanıcı demo veriyi silerse bir daha geri GELMESİN.
  const demoInitKey = 'turTakipDemoInit_v2';
  if (!localStorage.getItem(demoInitKey)) {
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
    localStorage.setItem(demoInitKey, '1');
  }

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
        `${r.personal?.firstName || 'Bilinmeyen'} ${r.personal?.lastName || 'Kişi'}`,
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
